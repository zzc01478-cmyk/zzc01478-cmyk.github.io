const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.SITE_URL || "http://127.0.0.1:8765";
const pages = [
  "/", "/works/", "/works/nv-guse/", "/works/sucai-fangfa/", "/about/",
  "/contact/", "/privacy/", "/terms/", "/thanks/", "/404.html",
];
const mobileCtaPages = new Set(["/", "/works/", "/works/nv-guse/", "/works/sucai-fangfa/", "/about/"]);

async function run() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://static.cloudflareinsights.com/**", route => route.abort());
    await page.goto(base);
    await page.evaluate(() => localStorage.removeItem("privacy-notice-dismissed"));
    await page.reload();
    assert(await page.getByRole("complementary", { name: "隐私与 Cookie 提示" }).isVisible());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => {
      const notice = document.querySelector(".privacy-notice");
      const actions = document.querySelector(".mobile-action-bar");
      if (!notice || !actions) return false;
      return notice.getBoundingClientRect().bottom <= actions.getBoundingClientRect().top + 1;
    });
    const fixedUi = await page.evaluate(() => {
      const notice = document.querySelector(".privacy-notice").getBoundingClientRect();
      const actions = document.querySelector(".mobile-action-bar").getBoundingClientRect();
      return {
        actionPosition: getComputedStyle(document.querySelector(".mobile-action-bar")).position,
        noticeClearsActions: notice.bottom <= actions.top + 1,
      };
    });
    assert.equal(fixedUi.actionPosition, "fixed");
    assert(fixedUi.noticeClearsActions, "privacy notice must clear the mobile CTA");
    await page.getByRole("button", { name: "知道了" }).click();
    assert.equal(await page.locator(".privacy-notice").count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem("privacy-notice-dismissed")), "1");
    await page.goto(base + "/works/");
    assert.equal(await page.locator(".privacy-notice").count(), 0, "privacy dismissal persists across public pages");

    const delayedImage = "**/profile-portrait.jpg";
    const delayImage = async route => {
      await new Promise(resolve => setTimeout(resolve, 250));
      await route.continue();
    };
    await page.route(delayedImage, delayImage);
    await page.goto(base + "/about/", { waitUntil: "domcontentloaded" });
    await page.locator(".image-panel.is-image-loading").waitFor();
    assert.equal(await page.locator(".image-panel").getAttribute("aria-busy"), "true");
    await page.waitForLoadState("load");
    await page.waitForFunction(() => !document.querySelector(".image-panel").classList.contains("is-image-loading"));
    await page.unroute(delayedImage, delayImage);
    await page.locator(".image-panel img").evaluate(image => { image.src = "/missing-image-contract.jpg"; });
    await page.locator(".image-panel.has-image-error .image-error").waitFor();
    assert((await page.locator(".image-error").textContent()).includes("陈志鸿"));
    assert.equal(await page.locator(".image-panel").getAttribute("aria-busy"), null);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base);
    assert.equal(await page.locator("main a[href='https://chenzhihong.online/tools/']").count(), 0);
    assert.equal(await page.locator(".nav-links a[href='https://chenzhihong.online/tools/']").count(), 0);
    assert.equal(await page.locator(".footer-links a[href='https://chenzhihong.online/tools/']").count(), 1);
    assert.equal(await page.locator("h1").textContent(), "抽纸盒");
    assert.equal(await page.locator("video[preload]:not([preload='none'])").count(), 0, "videos never preload");
    await page.goto(base + "/about/");
    await page.getByRole("link", { name: "看完整经历", exact: true }).click();
    await page.waitForFunction(() => document.activeElement.id === "experience");
    const recentJob = page.locator("#experience .timeline-item").first();
    assert.equal(await recentJob.locator("time").textContent(), "2026.03-2026.06");
    assert.equal(await recentJob.locator("h3").textContent(), "巨蛋传媒：摄影师（短视频运营职责）");
    assert((await recentJob.textContent()).includes("3 秒、5 秒完播"));
    assert.equal(await page.locator('#experience time[datetime="2020-09"]').textContent(), "2020.09-2024.06");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of pages) {
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200, route);
        const layout = await page.evaluate(async () => {
          for (const image of document.images) {
            image.loading = "eager";
            await image.decode().catch(() => {});
          }
          // Content clipped by an on-screen overflow:hidden/clip ancestor (a carousel track) cannot
          // push past the viewport, so only unclipped elements count as overflow.
          const clippedOnScreen = el => {
            for (let box = el.parentElement; box && box !== document.body; box = box.parentElement) {
              if (!/hidden|clip/.test(getComputedStyle(box).overflowX)) continue;
              const b = box.getBoundingClientRect();
              if (b.left >= -1 && b.right <= innerWidth + 1) return true;
            }
            return false;
          };
          const outside = [...document.querySelectorAll("header *, main *")]
            .filter(el => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && !clippedOnScreen(el);
            }).map(el => el.className || el.tagName);
          return {
            outside,
            broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
            nav: [...document.querySelectorAll(".nav-links a")].map(el => ({
              height: el.getBoundingClientRect().height,
              width: el.getBoundingClientRect().width,
            })),
          };
        });
        assert.deepEqual(layout.outside, [], `${width} ${route} overflow`);
        assert.deepEqual(layout.broken, [], `${width} ${route} images`);
        assert.equal(layout.nav.length, 3);
        assert(layout.nav.every(r => r.height >= 44 && r.width >= 44));
        if (mobileCtaPages.has(route) && width <= 720) {
          const mobileAction = await page.locator(".mobile-action-bar").evaluate(el => ({
            display: getComputedStyle(el).display,
            position: getComputedStyle(el).position,
            height: el.getBoundingClientRect().height,
          }));
          assert.notEqual(mobileAction.display, "none", `${width} ${route} mobile CTA visible`);
          assert.equal(mobileAction.position, "fixed", `${width} ${route} mobile CTA fixed`);
          assert(mobileAction.height >= 48, `${width} ${route} mobile CTA touch height`);
        }
        if (route === "/works/sucai-fangfa/") {
          await page.locator("[data-process-step]").last().click();
          await page.locator("[data-process-note] strong").waitFor();
          assert.equal(await page.locator("[data-process-note] strong").textContent(), "复盘");
        }
        console.log(`PASS ${width} ${route}`);
      }
    }
    await page.goto(base + "/works/sucai-fangfa/");
    assert.equal(await page.locator('[role="tablist"]').getAttribute("aria-orientation"), "vertical");
    await page.locator("#method-tab-deconstruct").focus();
    for (const [key, id] of [
      ["ArrowDown", "role"], ["End", "review"], ["Home", "deconstruct"],
      ["ArrowUp", "review"],
    ]) {
      await page.keyboard.press(key);
      assert.equal(await page.locator(":focus").getAttribute("id"), `method-tab-${id}`);
      assert(await page.locator(`#method-panel-${id}`).isVisible());
      assert.equal(await page.locator('[role="tab"][aria-selected="true"]').count(), 1);
    }

    await page.goto(base + "/works/nv-guse/");
    const lightboxTrigger = page.locator(".proof-frame img").first();
    await lightboxTrigger.focus();
    await page.keyboard.press("Enter");
    await page.locator(".lightbox-overlay.is-active").waitFor();
    assert.equal(await page.locator(":focus").getAttribute("class"), "lightbox-close");
    assert.equal(await page.locator(".site-shell").evaluate(el => el.inert), true);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(":focus").getAttribute("class"), "lightbox-close");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.locator(":focus").getAttribute("class"), "lightbox-close");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".lightbox-overlay.is-active").count(), 0);
    assert.equal(await lightboxTrigger.evaluate(el => document.activeElement === el), true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/about/");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.locator(".site-header.is-hidden").waitFor();
    await page.setViewportSize({ width: 768, height: 900 });
    await page.waitForFunction(() => !document.querySelector(".site-header").classList.contains("is-hidden"));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/contact/");
    await page.getByRole("button", { name: "生成邮件草稿" }).click();
    assert.equal(await page.locator("#name").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator("#email").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator("#topic").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator("#message").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator(":focus").getAttribute("id"), "name");
    assert((await page.locator("[data-form-status]").textContent()).includes("需要补充"));
    assert((await page.locator("#email-error").textContent()).includes("邮箱地址"));

    await page.goto(base + "/thanks/");
    assert((await page.locator("main").textContent()).includes("请确认邮件已经在邮箱应用中点击发送"));
    await page.goto(base + "/404.html");
    assert((await page.locator("main").textContent()).includes("该路径没有公开内容"));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/works/#koc");
    await page.waitForURL(url => url.pathname === "/works/nv-guse/" && url.hash === "#koc");
    await page.waitForFunction(() => document.activeElement.id === "koc");
    assert(await page.evaluate(() =>
      document.querySelector("#koc").getBoundingClientRect().top >=
      document.querySelector(".site-header").getBoundingClientRect().bottom
    ), "hash target must clear the sticky header");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(base + "/about/");
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("[data-reveal]").evaluateAll(nodes =>
      nodes.filter(el => getComputedStyle(el).opacity !== "1").length), 0,
    "print must include unrevealed content");
    await page.emulateMedia({ media: "screen", reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto(base);
    const theme = await page.evaluate(() => ({
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      background: getComputedStyle(document.documentElement).backgroundColor,
      font: getComputedStyle(document.body).fontFamily,
      texture: getComputedStyle(document.body, "::before").display,
      button: getComputedStyle(document.querySelector(".btn.primary")).backgroundColor,
      blur: getComputedStyle(document.querySelector(".site-header .wrap")).backdropFilter,
    }));
    assert.equal(theme.colorScheme, "light", "paper theme stays light under a dark system preference");
    assert.equal(theme.background, "rgb(245, 244, 237)");
    assert(theme.font.includes("serif"), "paper typography is retained");
    assert.notEqual(theme.texture, "none", "paper grid remains visible");
    assert.equal(theme.button, "rgb(27, 54, 93)");
    assert.equal(theme.blur, "none", "glass blur has been removed");
    if (process.env.SCREENSHOT_DIR) {
      for (const [name, width, scheme] of [
        ["desktop", 1440, "light"], ["mobile", 390, "light"], ["dark", 390, "dark"],
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(base);
        await page.locator("img").evaluateAll(async images => {
          await Promise.all(images.map(async image => {
            image.loading = "eager";
            await image.decode().catch(() => {});
          }));
        });
        await page.screenshot({
          path: path.join(process.env.SCREENSHOT_DIR, `website-${name}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
    }
    assert.deepEqual(errors, [], "browser JavaScript errors");
    console.log("Browser contract passed: layout, images, controls, keyboard, anchors, print, paper theme.");
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
