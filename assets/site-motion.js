(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function markLoaded() {
    document.body.classList.add("is-loaded");
    if (!reduceMotion) {
      document.body.classList.add("is-entering");
      window.setTimeout(function () {
        document.body.classList.remove("is-entering");
      }, 680);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markLoaded);
  } else {
    markLoaded();
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    document.querySelectorAll("[data-reveal]").forEach(function (node, index) {
      node.style.transitionDelay = Math.min(index % 5, 4) * 70 + "ms";
      observer.observe(node);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      node.classList.add("is-visible");
    });
  }

  if (!document.querySelector(".page-wipe")) {
    var wipe = document.createElement("div");
    wipe.className = "page-wipe";
    wipe.setAttribute("aria-hidden", "true");
    document.body.appendChild(wipe);
  }

  function componentLabel(node, index) {
    var text = (node.textContent || "").trim().replace(/\s+/g, " ");
    if (text) return text;
    var image = node.querySelector && node.querySelector("img[alt]");
    var alt = image ? (image.getAttribute("alt") || "").trim() : "";
    if (alt) return alt;
    if (node.matches(".frame")) return "胶片帧 " + (index + 1);
    if (node.matches(".shot")) return "镜头素材 " + (index + 1);
    if (node.matches(".phone")) return "竖屏素材 " + (index + 1);
    if (node.matches(".screen")) return "屏幕素材 " + (index + 1);
    if (node.matches(".matrix-mini i")) return "素材矩阵格 " + (index + 1);
    if (node.matches(".keyframes-mini i")) return "时间线关键帧 " + (index + 1);
    if (node.matches(".story-film i")) return "故事胶片 " + (index + 1);
    if (node.matches(".film-cell")) return "胶片素材 " + (index + 1);
    if (node.matches(".journey-node")) return "职业路径 " + (index + 1);
    if (node.matches(".focus-card")) return "关注问题 " + (index + 1);
    if (node.matches(".sample-tile")) return "样本素材 " + (index + 1);
    if (node.matches(".hypothesis-note")) return "素材假设 " + (index + 1);
    if (node.matches(".observe-chart")) return "观察图表 " + (index + 1);
    if (node.matches(".orbit-node")) return "能力节点 " + (index + 1);
    if (node.matches(".orbit-evidence")) return "能力证据 " + (index + 1);
    if (node.matches(".experience-action")) return "经历动作 " + (index + 1);
    if (node.matches(".experience-frame")) return "经历胶片 " + (index + 1);
    if (node.matches(".archive-book")) return "精选作品档案";
    if (node.matches(".archive-photo")) return "作品证据 " + (index + 1);
    if (node.matches(".process-nodes .step")) return "流程步骤 " + (index + 1);
    if (node.matches(".method-evidence i")) return "素材证据 " + (index + 1);
    if (node.matches(".method-parts .lens")) return "拆解部件 " + (index + 1);
    return "可选素材 " + (index + 1);
  }

	  document.querySelectorAll(".frame, .shot, .phone, .pin-card, .folder, .note, .screen, .matrix-mini i, .keyframes-mini i, .story-film i, .film-cell, .journey-node, .focus-card, .sample-tile, .hypothesis-note, .observe-chart, .orbit-node, .orbit-evidence, .experience-action, .experience-frame, .archive-book, .archive-photo, .process-nodes .step, .role-panel-mini, .method-node, .method-plate li, .method-evidence i, .method-parts .lens").forEach(function (node, index) {
	    if (node.closest("a") && !node.matches("a")) return;
	    if (node.closest("[aria-hidden='true']") && !node.matches("button, a")) return;
	    if (node.closest("#matrix .matrix-mini")) return;
	    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    if (!node.getAttribute("aria-label")) {
      node.setAttribute("aria-label", componentLabel(node, index));
    }
    function togglePicked() {
      document.querySelectorAll(".is-picked").forEach(function (item) {
        if (item !== node) item.classList.remove("is-picked");
      });
      node.classList.toggle("is-picked");
    }
    node.addEventListener("click", togglePicked);
    node.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePicked();
    });
  });

  document.addEventListener("click", function (event) {
    var button = event.target.closest(".btn, .chip, .video-card");
    if (!button || reduceMotion) return;
    var rect = button.getBoundingClientRect();
    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = event.clientX - rect.left + "px";
    ripple.style.top = event.clientY - rect.top + "px";
    button.appendChild(ripple);
    window.setTimeout(function () {
      ripple.remove();
    }, 560);
  });

  document.querySelectorAll(".tilt-card").forEach(function (card) {
    if (reduceMotion) return;
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
      card.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
      card.style.setProperty("--lift", "-3px");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--lift", "0");
    });
  });

  document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var buttons = tabs.querySelectorAll("[data-tab-target]");
    var panels = tabs.querySelectorAll("[data-tab-panel]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-tab-target");
        buttons.forEach(function (item) {
          item.setAttribute("aria-selected", item === button ? "true" : "false");
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-tab-panel") === target);
        });
      });
    });
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link || reduceMotion || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0 || link.target === "_blank") return;
    var url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname && url.hash) return;
    event.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(function () {
      window.location.href = url.href;
    }, 210);
  });
})();
