(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    document.body.classList.add("is-loaded");

    document.querySelectorAll("img").forEach(function (image) {
      if (image.closest("[aria-hidden='true']")) return;
      var host = image.closest("figure") || image.parentElement;
      if (!host) return;

      function showImageError() {
        if (host.querySelector(".image-error")) return;
        host.classList.add("has-image-error");
        var fallback = document.createElement("span");
        fallback.className = "image-error";
        fallback.textContent = image.getAttribute("alt") || "图片暂时无法加载";
        host.insertBefore(fallback, host.querySelector("figcaption"));
      }

      image.addEventListener("error", showImageError);
      if (image.complete && image.naturalWidth === 0) showImageError();
    });

    document.querySelectorAll(".hero, .section").forEach(function (scope) {
      scope.querySelectorAll("[data-reveal]").forEach(function (node, index) {
        node.style.setProperty("--reveal-index", String(Math.min(index, 4)));
      });
    });

    if (!reduceMotion && "IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });

      document.querySelectorAll("[data-reveal]").forEach(function (node) {
        observer.observe(node);
      });
    } else {
      document.querySelectorAll("[data-reveal]").forEach(function (node) {
        node.classList.add("is-visible");
      });
    }

    var processNote = document.querySelector("[data-process-note]");
    function renderProcess(button) {
      if (!processNote || !button) return;
      var title = processNote.querySelector("strong");
      var body = processNote.querySelector("p");
      var list = processNote.querySelector("ul");
      if (title) title.textContent = button.dataset.title || button.textContent.trim();
      if (body) body.textContent = button.dataset.body || "";
      var points = (button.dataset.points || "").split("|").filter(Boolean);
      if (!list || points.length === 0) return;
      list.replaceChildren();
      points.forEach(function (point) {
        var item = document.createElement("li");
        item.textContent = point;
        list.appendChild(item);
      });
    }

    document.querySelectorAll("[data-process-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.querySelectorAll("[data-process-step]").forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        renderProcess(button);
      });
    });
    renderProcess(document.querySelector('[data-process-step][aria-pressed="true"]'));

    document.querySelectorAll("[data-method-tabs]").forEach(function (tabs) {
      var buttons = tabs.querySelectorAll("[data-method-target]");
      var panels = tabs.querySelectorAll("[data-method-panel]");
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var target = button.getAttribute("data-method-target");
          buttons.forEach(function (item) {
            item.setAttribute("aria-selected", item === button ? "true" : "false");
          });
          panels.forEach(function (panel) {
            panel.hidden = panel.getAttribute("data-method-panel") !== target;
          });
        });
      });
    });
  });
})();
