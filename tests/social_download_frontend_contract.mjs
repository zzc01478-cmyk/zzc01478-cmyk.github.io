// Run through Ego: ego-browser nodejs < tests/social_download_frontend_contract.mjs
const assert = (await import("node:assert/strict")).default;
const fs = await import("node:fs/promises");
const os = await import("node:os");
const path = await import("node:path");
const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), "social-frontend-contract-"));
const task = await taskSpace("Social downloader frontend contract");
const page = task.page("p1");
console.log({ spaceId: task.spaceId, artifacts });
await page.goto((process.env.SITE_URL || "http://127.0.0.1:8766") + "/tools/social-download/");
await page.waitForFunction(() => document.getElementById("service-card")?.dataset.state === "online", undefined, { timeout: 15000 });

// Only this test page sees fixtures. Every API POST is intercepted, never forwarded.
await page.evaluate(() => {
  const originalFetch = window.fetch;
  const finished = {
    id: "contract-finished", title: "Long video title ".repeat(17),
    platform: "X", status: "finished", percent: 100, size: 1024,
    message: "", downloadable: true, created: Date.now() / 1000,
  };
  window.__socialTest = {
    tasks: [
      finished,
      { ...finished, id: "contract-active", title: "Active fixture", status: "downloading", downloadable: false },
      { ...finished, id: "contract-error", title: "Error fixture", status: "error", downloadable: false },
    ],
    posts: [], confirms: 0,
  };
  window.confirm = () => { window.__socialTest.confirms++; return true; };
  window.fetch = (url, options = {}) => {
    const state = window.__socialTest;
    const route = String(url);
    if (route.endsWith("/api/status")) {
      return Promise.resolve(new Response(JSON.stringify({ tasks: state.tasks }), {
        headers: { "content-type": "application/json" },
      }));
    }
    if (options.method === "POST" && route.includes("/api/")) {
      state.posts.push({ route, body: JSON.parse(options.body) });
      if (route.endsWith("/remove")) {
        return new Promise(resolve => { state.resolveRemove = resolve; });
      }
      return Promise.reject(new Error("Unexpected mutation in frontend contract"));
    }
    return originalFetch(url, options);
  };
});
await page.waitForFunction(() => document.querySelector(".task-title")?.textContent.startsWith("Long video title"), undefined, { timeout: 10000 });

for (const width of [320, 390, 768, 1440]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 667, deviceScaleFactor: 1, mobile: true });
  const layout = await page.evaluate(() => ({
    overflow: [...document.querySelectorAll("main *,header *,footer *")].filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && !el.closest("[hidden]") && (rect.left < -1 || rect.right > innerWidth + 1);
    }).map(el => el.id || el.className),
    wrapping: [...document.querySelectorAll(".filter-tab, .tool-action-btn span")].filter(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getClientRects().length > 1;
    }).map(el => el.textContent),
  }));
  assert.deepEqual(layout.overflow, [], `horizontal overflow at ${width}`);
  assert.deepEqual(layout.wrapping, [], `wrapped control labels at ${width}`);
  console.log(`PASS layout ${width}`);
}

await page.cdp("Emulation.clearDeviceMetricsOverride");
await page.focus("#filter-all");
for (const [key, expected] of [["ArrowRight", "active"], ["End", "error"], ["Home", "all"], ["ArrowLeft", "error"]]) {
  await page.keyboard.press(key);
  const state = await page.evaluate(() => ({
    focus: document.activeElement.id,
    selected: document.querySelector('.filter-tab[aria-selected="true"]').id,
    tabbable: [...document.querySelectorAll(".filter-tab")].filter(el => el.tabIndex === 0).length,
    panelLabel: document.getElementById("task-results").getAttribute("aria-labelledby"),
    visible: [...document.querySelectorAll(".task-card:not([hidden]) .task-status-pill")].map(el => el.dataset.state),
  }));
  assert.equal(state.focus, "filter-" + expected);
  assert.equal(state.selected, state.focus);
  assert.equal(state.panelLabel, state.focus);
  assert.equal(state.tabbable, 1);
  assert.equal(state.visible.length, expected === "all" ? 3 : 1);
}
console.log("PASS keyboard filters and panel association");
await page.click("#filter-all");
await page.click(".task-card .btn-action.secondary >> nth=0");

// A portrait media stream makes layout tests independent of codecs and cached files.
await page.evaluate(async () => {
  const video = document.getElementById("preview-video");
  video.removeAttribute("src");
  video.load();
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext("2d");
  context.fillStyle = "#46754c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  video.srcObject = canvas.captureStream(1);
  video.muted = true;
  await video.play();
  document.getElementById("preview-status").textContent = "";
});
await page.waitForFunction(() => document.getElementById("preview-video").videoHeight === 1280, undefined, { timeout: 10000 });
for (const width of [320, 390, 768, 1440]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width, height: 667, deviceScaleFactor: 1, mobile: true });
  const bounds = await page.evaluate(() => {
    const dialog = document.getElementById("preview");
    const video = document.getElementById("preview-video");
    video.scrollIntoView({ block: "end" });
    const player = video.getBoundingClientRect();
    const wrapper = video.parentElement.getBoundingClientRect();
    const modal = dialog.getBoundingClientRect();
    const footer = document.querySelector(".preview-footer").getBoundingClientRect();
    return {
      cropped: player.bottom > wrapper.bottom + 1 || player.top < wrapper.top - 1,
      controlsVisible: player.bottom <= modal.bottom + 1 && player.bottom > modal.top + 30,
      footerOverlap: footer.top < player.bottom - 1,
      overflow: dialog.scrollWidth > dialog.clientWidth,
    };
  });
  assert.deepEqual(bounds, { cropped: false, controlsVisible: true, footerOverlap: false, overflow: false }, `preview geometry at ${width}`);
  const screenshot = await page.cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.writeFile(path.join(artifacts, `preview-${width}.png`), Buffer.from(screenshot.data, "base64"));
  console.log(`PASS portrait preview and long title ${width}`);
}
await page.evaluate(() => {
  const video = document.getElementById("preview-video");
  video.srcObject.getTracks().forEach(track => track.stop());
  video.srcObject = null;
});
await page.keyboard.press("Escape");
await page.cdp("Emulation.clearDeviceMetricsOverride");
await page.click('.task-card button[aria-label="清除任务与缓存"] >> nth=0');
let busy = await page.evaluate(() => {
  const actions = document.querySelector(".task-actions");
  actions.querySelector("button[aria-label]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const anchor = actions.querySelector("a");
  const blocked = !anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  return {
    disabled: [...actions.querySelectorAll("button")].every(el => el.disabled),
    linkDisabled: anchor.getAttribute("aria-disabled") === "true" && anchor.tabIndex === -1,
    blocked, posts: window.__socialTest.posts.length, confirms: window.__socialTest.confirms,
  };
});
assert.deepEqual(busy, { disabled: true, linkDisabled: true, blocked: true, posts: 1, confirms: 1 });
await page.evaluate(() => {
  window.__socialTest.tasks[0].status = "error";
  window.__socialTest.tasks[0].downloadable = false;
});
await page.waitForFunction(() => document.querySelector(".task-status-pill")?.dataset.state === "error", undefined, { timeout: 10000 });
assert(await page.evaluate(() => [...document.querySelector(".task-actions").querySelectorAll("button")].every(el => el.disabled)), "poll-driven replacement must stay disabled");
await page.evaluate(() => window.__socialTest.resolveRemove(new Response(JSON.stringify({ message: "Contract failure" }), {
  status: 503, headers: { "content-type": "application/json" },
})));
await page.waitForFunction(() => document.querySelector(".task-actions").getAttribute("aria-busy") === "false", undefined, { timeout: 10000 });
assert(await page.evaluate(() => [...document.querySelector(".task-actions").querySelectorAll("button")].every(el => !el.disabled)), "failed deletion must unlock controls");
console.log("PASS deletion lock, rerender and recovery; no real tasks mutated");

await page.reload();
await task.finish({ keep: [] });
console.log("Frontend contract passed.");
