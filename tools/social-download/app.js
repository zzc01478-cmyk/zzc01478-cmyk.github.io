(() => {
  "use strict";

  const base = "/tools/social-download/api/";
  const $ = id => document.getElementById(id);

  const form = $("download-form");
  const input = $("share-text");
  const submit = $("submit");
  const status = $("form-status");
  const connection = $("connection");
  const serviceCard = $("service-card");
  const preview = $("preview");
  const video = $("preview-video");
  const previewSaveBtn = $("preview-save-btn");
  const previewCloseBtn = $("close-preview");
  const previewDismissBtn = $("preview-close-action");
  const refreshBtn = $("refresh");
  const emptyState = $("empty-state");
  const taskCountEl = $("task-count");
  const tasksContainer = $("tasks");
  const listStatus = $("list-status");
  const platformPills = document.querySelectorAll(".platform-pill");
  const filterTabs = document.querySelectorAll(".filter-tab");

  const rows = new Map();
  const states = {
    pending: "等待排队",
    preparing: "准备下载",
    downloading: "正在下载",
    postprocessing: "合并音视频",
    finished: "已就绪",
    error: "未完成",
    scheduled: "等待平台",
  };

  const platformDomains = [
    { name: "抖音", regex: /(?:douyin\.com|iesdouyin\.com)/i },
    { name: "TikTok", regex: /tiktok\.com/i },
    { name: "小红书", regex: /(?:xiaohongshu\.com|xhslink\.com|rednote\.com)/i },
    { name: "YouTube", regex: /(?:youtube\.com|youtu\.be)/i },
    { name: "Instagram", regex: /instagram\.com/i },
    { name: "X", regex: /(?:x\.com|twitter\.com)/i },
  ];

  let online = false;
  let submitting = false;
  let refreshing = false;
  let currentFilter = "all";
  let previewOpener = null;
  let allTasks = [];

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle("is-error", error);
    if (!text) {
      status.setAttribute("hidden", "");
    } else {
      status.removeAttribute("hidden");
    }
  }

  function setSubmit() {
    submit.disabled = !online || submitting;
    const btnText = submit.querySelector("span");
    if (btnText) btnText.textContent = submitting ? "正在解析..." : "获取视频";
    submit.classList.toggle("is-loading", submitting);
    form.setAttribute("aria-busy", String(submitting));
  }

  function detectPlatform(text) {
    if (!text) return null;
    for (const p of platformDomains) {
      if (p.regex.test(text)) return p.name;
    }
    return null;
  }

  function updatePlatformPills() {
    const matched = detectPlatform(input.value);
    platformPills.forEach(pill => {
      const isTarget = pill.getAttribute("data-platform") === matched;
      pill.classList.toggle("is-detected", isTarget);
    });
  }

  function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || !Number.isFinite(timestampInSeconds)) return "";
    const now = Date.now() / 1000;
    const diff = Math.max(0, Math.floor(now - timestampInSeconds));
    if (diff < 45) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return "1 天前";
  }

  function formatSize(bytes) {
    return Number.isFinite(bytes) && bytes > 0 ? (bytes / 1048576).toFixed(1) + " MB" : "";
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(svg.namespaceURI, "use");
    use.setAttribute("href", "./icons.svg#" + name);
    svg.append(use);
    return svg;
  }

  async function api(path, options = {}) {
    const response = await fetch(base + path, {
      ...options,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Social-Download": "1" },
      signal: AbortSignal.timeout(options.method === "POST" ? 135000 : 15000),
    });
    if (response.status === 401) throw new Error("登录已失效，请刷新页面重新登录。");
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("下载服务未接入，当前页面无法提交任务。");
    }
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "服务暂不可用，请稍后刷新任务列表。");
    return body;
  }

  function makeRow(task) {
    const root = document.createElement("article");
    root.className = "task-card";

    const main = document.createElement("div");
    main.className = "task-card-main";

    const header = document.createElement("div");
    header.className = "task-card-header";

    const platform = document.createElement("span");
    platform.className = "task-platform-badge";

    const time = document.createElement("span");
    time.className = "task-time";

    const statusPill = document.createElement("span");
    statusPill.className = "task-status-pill";
    const pillDot = document.createElement("span");
    pillDot.className = "pill-dot";
    pillDot.setAttribute("aria-hidden", "true");
    const statusLabel = document.createElement("span");
    statusPill.append(pillDot, statusLabel);

    header.append(platform, time, statusPill);

    const title = document.createElement("h3");
    title.className = "task-title";

    const metaRow = document.createElement("div");
    metaRow.className = "task-meta-row";

    const sizeItem = document.createElement("span");
    sizeItem.className = "task-meta-item";
    const hardDriveIcon = icon("hard-drive");
    const sizeText = document.createTextNode("");
    sizeItem.append(hardDriveIcon, sizeText);

    const expireItem = document.createElement("span");
    expireItem.className = "task-meta-item";
    const clockIcon = icon("clock");
    const expireText = document.createTextNode("24h 自动清理");
    expireItem.append(clockIcon, expireText);

    metaRow.append(sizeItem, expireItem);

    const progressBox = document.createElement("div");
    progressBox.className = "task-progress-box";
    const progressLabel = document.createElement("div");
    progressLabel.className = "task-progress-label";
    const progressTitle = document.createElement("span");
    progressTitle.textContent = "服务器下载进度";
    const progressPercent = document.createElement("span");
    progressPercent.className = "task-percent";
    progressLabel.append(progressTitle, progressPercent);

    const progressTrack = document.createElement("div");
    progressTrack.className = "task-progress-track";
    const progressFill = document.createElement("div");
    progressFill.className = "task-progress-fill";
    progressTrack.append(progressFill);
    progressBox.append(progressLabel, progressTrack);

    const errorBox = document.createElement("div");
    errorBox.className = "task-error-box";

    main.append(header, title, metaRow, progressBox, errorBox);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    root.append(main, actions);

    const row = {
      root,
      main,
      header,
      platform,
      time,
      statusPill,
      statusLabel,
      title,
      metaRow,
      sizeItem,
      sizeText,
      expireItem,
      progressBox,
      progressPercent,
      progressTrack,
      progressFill,
      errorBox,
      actions,
      task,
      actionState: "",
      removing: false,
    };
    actions.addEventListener("click", event => {
      if (row.removing) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    return row;
  }

  function showPreview(task, opener) {
    previewOpener = opener;
    $("preview-title").textContent = task.title || "短视频预览";
    $("preview-status").textContent = "";
    video.src = base + "files/" + encodeURIComponent(task.id) + "?inline=1";
    previewSaveBtn.href = base + "files/" + encodeURIComponent(task.id);
    previewSaveBtn.setAttribute("download", (task.title || "video").replace(/[/\\?%*:|"<>]/g, "_") + ".mp4");
    preview.showModal();
  }

  function closePreview() {
    video.pause();
    video.removeAttribute("src");
    video.load();
    preview.close();
    if (previewOpener?.isConnected) previewOpener.focus();
  }

  function syncRowActions(row) {
    row.actions.setAttribute("aria-busy", String(row.removing));
    row.actions.querySelectorAll("button").forEach(el => { el.disabled = row.removing; });
    row.actions.querySelectorAll("a").forEach(el => {
      if (row.removing) {
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("tabindex", "-1");
      } else {
        el.removeAttribute("aria-disabled");
        el.removeAttribute("tabindex");
      }
    });
  }

  async function removeTask(row) {
    if (row.removing) return;
    const task = row.task;
    const terminal = ["finished", "error"].includes(task.status);
    const question = terminal
      ? "确认移除该任务并清除服务器缓存？已保存到本机的文件不受影响。"
      : "确认取消这条下载任务？";
    if (!window.confirm(question)) return;

    row.removing = true;
    syncRowActions(row);
    try {
      await api("remove", { method: "POST", body: JSON.stringify({ id: task.id }) });
      await refresh();
    } catch (error) {
      message(error.message || "操作结果未确认，请刷新任务列表后检查。", true);
    } finally {
      row.removing = false;
      syncRowActions(row);
    }
  }

  async function retryTask(row) {
    if (submitting || row.removing) return;
    submitting = true;
    setSubmit();
    message("正在重新提交解析，请稍候...");
    try {
      await api("retry", { method: "POST", body: JSON.stringify({ id: row.task.id }) });
      message("已重新提交，请查看任务队列进度。");
    } catch (error) {
      message(
        error.name === "TimeoutError" || error instanceof TypeError
          ? "重试结果尚未确认。请先刷新任务列表，避免重复提交。"
          : error.message,
        true
      );
    } finally {
      submitting = false;
      setSubmit();
      await refresh();
    }
  }

  function applyFilter() {
    let visibleCount = 0;
    for (const [id, row] of rows) {
      const status = row.task.status;
      let matches = false;
      if (currentFilter === "all") matches = true;
      else if (currentFilter === "active") matches = !["finished", "error"].includes(status);
      else if (currentFilter === "finished") matches = status === "finished";
      else if (currentFilter === "error") matches = status === "error";

      row.root.hidden = !matches;
      if (matches) visibleCount++;
    }

    const emptyDesc = emptyState.querySelector(".empty-desc");
    if (allTasks.length === 0) {
      emptyState.hidden = false;
      if (emptyDesc) emptyDesc.textContent = "在上方输入框粘贴短视频分享链接，解析完成后即可直接在此预览或保存到本地。";
    } else if (visibleCount === 0) {
      emptyState.hidden = false;
      if (emptyDesc) emptyDesc.textContent = "当前筛选状态下暂无对应任务。";
    } else {
      emptyState.hidden = true;
    }
  }

  function render(tasks) {
    allTasks = tasks;
    const ids = new Set(tasks.map(t => t.id));

    // 删除已被移除的任务 DOM
    for (const [id, row] of rows) {
      if (!ids.has(id)) {
        row.root.remove();
        rows.delete(id);
      }
    }

    // 更新或新增任务 DOM
    for (const task of tasks) {
      let row = rows.get(task.id);
      if (!row) {
        row = makeRow(task);
        rows.set(task.id, row);
        tasksContainer.append(row.root);
      }

      row.task = task;
      row.title.textContent = task.title || "正在读取视频标题...";
      row.title.title = task.title || "";
      row.platform.textContent = task.platform || "社媒视频";
      row.time.textContent = formatRelativeTime(task.created);

      // 状态 Pill
      row.statusLabel.textContent = states[task.status] || "处理中";
      row.statusPill.dataset.state = task.status;

      // 文件大小与元数据
      const sizeStr = formatSize(task.size);
      if (task.status === "finished" && sizeStr) {
        row.sizeText.textContent = sizeStr;
        row.sizeItem.hidden = false;
      } else {
        row.sizeItem.hidden = true;
      }

      // 进度条控制
      const isTerminal = ["finished", "error"].includes(task.status);
      row.progressBox.hidden = isTerminal;
      if (!isTerminal) {
        const progress = Number.isFinite(task.percent) ? Math.max(0, Math.min(100, task.percent)) : null;
        if (progress === null) {
          row.progressTrack.classList.add("is-indeterminate");
          row.progressFill.style.width = "40%";
          row.progressPercent.textContent = "解析中...";
        } else {
          row.progressTrack.classList.remove("is-indeterminate");
          row.progressFill.style.width = `${progress}%`;
          row.progressPercent.textContent = `${Math.round(progress)}%`;
        }
      }

      // 错误信息提示
      row.errorBox.textContent = task.message || "";
      row.errorBox.hidden = !task.message;

      // 动作按钮栏
      const actionState = `${task.downloadable}:${task.status}`;
      if (actionState !== row.actionState) {
        row.actions.replaceChildren();

        if (task.downloadable) {
          const playBtn = document.createElement("button");
          playBtn.type = "button";
          playBtn.className = "btn-action secondary";
          playBtn.append(icon("play"), document.createTextNode("预览"));
          playBtn.addEventListener("click", () => showPreview(row.task, playBtn));

          const saveBtn = document.createElement("a");
          saveBtn.className = "btn-action primary";
          saveBtn.href = base + "files/" + encodeURIComponent(task.id);
          saveBtn.setAttribute("download", (task.title || "video").replace(/[/\\?%*:|"<>]/g, "_") + ".mp4");
          saveBtn.append(icon("download"), document.createTextNode("保存视频"));

          row.actions.append(playBtn, saveBtn);
        }

        if (task.status === "error") {
          const retryBtn = document.createElement("button");
          retryBtn.type = "button";
          retryBtn.className = "btn-action secondary";
          retryBtn.append(icon("refresh-cw"), document.createTextNode("重试"));
          retryBtn.addEventListener("click", () => retryTask(row));
          row.actions.append(retryBtn);
        }

        const isFinishedOrError = ["finished", "error"].includes(task.status);
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-action-icon" + (isFinishedOrError ? " is-danger" : "");
        removeBtn.setAttribute("aria-label", isFinishedOrError ? "清除任务与缓存" : "取消任务");
        removeBtn.title = isFinishedOrError ? "清除任务与缓存" : "取消任务";
        removeBtn.append(icon(isFinishedOrError ? "trash-2" : "x"));
        removeBtn.addEventListener("click", () => removeTask(row));
        row.actions.append(removeBtn);

        row.actionState = actionState;
      }
      syncRowActions(row);
    }

    // 维持排序
    tasks.forEach((task, index) => {
      const root = rows.get(task.id).root;
      const current = tasksContainer.children[index];
      if (current !== root) tasksContainer.insertBefore(root, current || null);
    });

    taskCountEl.textContent = String(tasks.length);
    applyFilter();
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    refreshBtn.disabled = true;
    refreshBtn.classList.add("is-spinning");

    try {
      const data = await api("status");
      online = true;
      connection.textContent = "服务正常";
      serviceCard.dataset.state = "online";
      listStatus.textContent = "";
      render(data.tasks);
    } catch (error) {
      online = false;
      connection.textContent = "服务未连接";
      serviceCard.dataset.state = "offline";
      listStatus.textContent =
        error instanceof TypeError || error.name === "TimeoutError"
          ? "连接中断，已显示的任务状态可能不是最新的。请稍后刷新。"
          : error.message;
    } finally {
      refreshing = false;
      refreshBtn.disabled = false;
      refreshBtn.classList.remove("is-spinning");
      setSubmit();
    }
  }

  // 提交视频解析任务
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || !online) return;

    const trimmed = input.value.trim();
    if (!trimmed) {
      input.setAttribute("aria-invalid", "true");
      message("请先粘贴单条短视频链接或分享文本。", true);
      input.focus();
      return;
    }

    submitting = true;
    input.removeAttribute("aria-invalid");
    setSubmit();
    message("正在解析视频地址，请稍候...");

    try {
      await api("downloads", {
        method: "POST",
        body: JSON.stringify({ text: trimmed, quality: $("quality").value }),
      });
      message("解析任务已提交，正在排队下载。");
      input.value = "";
      updatePlatformPills();
    } catch (error) {
      message(
        error.name === "TimeoutError" || error instanceof TypeError
          ? "提交结果尚未确认。请先刷新任务列表，避免重复提交。"
          : error.message,
        true
      );
    } finally {
      submitting = false;
      setSubmit();
      await refresh();
    }
  });

  // 输入变化时实时检测平台
  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    updatePlatformPills();
  });

  // 快捷键提交：Cmd/Ctrl + Enter
  input.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (!submit.disabled) {
        form.requestSubmit();
      }
    }
  });

  // 粘贴与清空按钮
  $("paste").addEventListener("click", async () => {
    try {
      input.value = (await navigator.clipboard.readText()).slice(0, 4096);
      input.removeAttribute("aria-invalid");
      updatePlatformPills();
      input.focus();
      message("");
    } catch {
      message("无法直接读取剪贴板，请使用快捷键或右键粘贴到输入框中。", true);
      input.focus();
    }
  });

  $("clear").addEventListener("click", () => {
    input.value = "";
    input.removeAttribute("aria-invalid");
    updatePlatformPills();
    message("");
    input.focus();
  });

  // 筛选 Tab 切换
  function selectFilter(tab) {
    filterTabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle("is-active", selected);
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    $("task-results").setAttribute("aria-labelledby", tab.id);
    currentFilter = tab.getAttribute("data-filter") || "all";
    applyFilter();
  }

  filterTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectFilter(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % filterTabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + filterTabs.length) % filterTabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = filterTabs.length - 1;
      else return;
      event.preventDefault();
      selectFilter(filterTabs[next]);
      filterTabs[next].focus();
    });
  });

  // 刷新与弹窗事件
  refreshBtn.addEventListener("click", refresh);
  previewCloseBtn.addEventListener("click", closePreview);
  previewDismissBtn.addEventListener("click", closePreview);
  preview.addEventListener("cancel", event => {
    event.preventDefault();
    closePreview();
  });

  // 点击遮罩关闭弹窗
  preview.addEventListener("click", event => {
    const rect = preview.getBoundingClientRect();
    const inDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inDialog) closePreview();
  });

  video.addEventListener("error", () => {
    if (video.hasAttribute("src")) {
      $("preview-status").textContent = "浏览器内核解码失败，建议直接保存到本机使用播放器查看。";
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });

  async function poll() {
    if (!document.hidden) await refresh();
    window.setTimeout(poll, 3000);
  }

  // 初始化平台匹配与首次拉取
  updatePlatformPills();
  poll();
})();
