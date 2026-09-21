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

      function finishImageLoad() {
        host.classList.remove("is-image-loading");
        host.removeAttribute("aria-busy");
      }

      if (!image.complete) {
        host.classList.add("is-image-loading");
        host.setAttribute("aria-busy", "true");
        image.addEventListener("load", finishImageLoad, { once: true });
      }

      function showImageError() {
        finishImageLoad();
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
      var tabList = tabs.querySelector('[role="tablist"]');

      function syncTabOrientation() {
        if (!tabList) return;
        tabList.setAttribute("aria-orientation", window.innerWidth > 980 ? "vertical" : "horizontal");
      }

      function activateTab(button, moveFocus) {
        var panelId = button.getAttribute("aria-controls");
        buttons.forEach(function (item) {
          var selected = item === button;
          item.setAttribute("aria-selected", selected ? "true" : "false");
          item.tabIndex = selected ? 0 : -1;
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.id !== panelId;
        });
        if (moveFocus) button.focus();
      }

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activateTab(button, false);
        });
        button.addEventListener("keydown", function (event) {
          var index = Array.prototype.indexOf.call(buttons, button);
          var next = index;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = buttons.length - 1;
          if (next === index && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          activateTab(buttons[next], true);
        });
      });
      syncTabOrientation();
      window.addEventListener("resize", syncTabOrientation);
    });

    function focusHashTarget() {
      if (!window.location.hash) return;
      var id;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch (error) {
        return;
      }
      var target = document.getElementById(id);
      if (target) target.focus({ preventScroll: true });
    }

    document.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function () {
        window.requestAnimationFrame(focusHashTarget);
      });
    });
    window.addEventListener("hashchange", focusHashTarget);
    window.requestAnimationFrame(focusHashTarget);

    // Mobile scroll-adaptive sticky header
    var header = document.querySelector(".site-header");
    if (header) {
      var lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
      var scrollThreshold = 8;
      var ticking = false;

      function updateHeader() {
        var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
        var diff = currentScrollY - lastScrollY;

        if (currentScrollY > 24) {
          header.classList.add("is-scrolled");
        } else {
          header.classList.remove("is-scrolled");
        }

        if (window.innerWidth <= 720) {
          if (diff > scrollThreshold && currentScrollY > 120) {
            header.classList.add("is-hidden");
          } else if (diff < -scrollThreshold || currentScrollY <= 120) {
            header.classList.remove("is-hidden");
          }
        } else {
          header.classList.remove("is-hidden");
        }

        lastScrollY = currentScrollY;
        ticking = false;
      }

      window.addEventListener("scroll", function () {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      }, { passive: true });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 720) header.classList.remove("is-hidden");
        lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
      });
    }

    // Zero-dependency proof image lightbox
    var activeTrigger = null;
    var lightboxOverlay = null;
    var previousBodyOverflow = "";

    function createLightbox() {
      if (lightboxOverlay) return lightboxOverlay;
      lightboxOverlay = document.createElement("div");
      lightboxOverlay.className = "lightbox-overlay";
      lightboxOverlay.setAttribute("role", "dialog");
      lightboxOverlay.setAttribute("aria-modal", "true");
      lightboxOverlay.setAttribute("aria-label", "图片预览");
      lightboxOverlay.hidden = true;

      var dialog = document.createElement("div");
      dialog.className = "lightbox-dialog";

      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "lightbox-close";
      closeBtn.setAttribute("aria-label", "关闭预览 (Escape)");
      closeBtn.textContent = "关闭 ✕";

      var img = document.createElement("img");
      img.alt = "";

      var caption = document.createElement("p");
      caption.className = "lightbox-caption";
      caption.id = "lightbox-caption";
      lightboxOverlay.setAttribute("aria-describedby", caption.id);

      dialog.appendChild(closeBtn);
      dialog.appendChild(img);
      dialog.appendChild(caption);
      lightboxOverlay.appendChild(dialog);
      document.body.appendChild(lightboxOverlay);

      function closeLightbox() {
        lightboxOverlay.classList.remove("is-active");
        lightboxOverlay.hidden = true;
        document.body.style.overflow = previousBodyOverflow;
        var siteShell = document.querySelector(".site-shell");
        if (siteShell) siteShell.inert = false;
        if (activeTrigger) {
          activeTrigger.focus();
          activeTrigger = null;
        }
      }

      closeBtn.addEventListener("click", closeLightbox);
      lightboxOverlay.addEventListener("click", function (e) {
        if (e.target === lightboxOverlay) closeLightbox();
      });

      window.addEventListener("keydown", function (e) {
        if (!lightboxOverlay.classList.contains("is-active")) return;
        if (e.key === "Tab") {
          e.preventDefault();
          closeBtn.focus();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeLightbox();
        }
      });

      lightboxOverlay._open = function (src, alt, captionText, triggerEl) {
        activeTrigger = triggerEl;
        img.src = src;
        img.alt = alt || "";
        caption.textContent = captionText || alt || "";
        previousBodyOverflow = document.body.style.overflow;
        var siteShell = document.querySelector(".site-shell");
        if (siteShell) siteShell.inert = true;
        lightboxOverlay.hidden = false;
        lightboxOverlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
      };

      return lightboxOverlay;
    }

    document.querySelectorAll(".proof-frame img, .proof-hero-sheet img, .case-proof-grid img").forEach(function (image) {
      image.setAttribute("tabindex", "0");
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", "点击查看大图：" + (image.getAttribute("alt") || "证据图"));

      function triggerOpen() {
        var host = image.closest("figure") || image.parentElement;
        var captionEl = host ? host.querySelector("figcaption") : null;
        var captionText = captionEl ? captionEl.textContent.trim() : "";
        var lb = createLightbox();
        lb._open(image.src, image.getAttribute("alt"), captionText, image);
      }

      image.addEventListener("click", triggerOpen);
      image.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerOpen();
        }
      });
    });

    // Resume print trigger
    document.querySelectorAll("[data-print-resume]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        window.print();
      });
    });

    document.querySelectorAll("[data-contact-form]").forEach(function (form) {
      var status = form.querySelector("[data-form-status]");
      var successLink = form.querySelector("[data-contact-next]");

      function setFieldError(field, message) {
        var error = form.querySelector("#" + field.id + "-error");
        field.setAttribute("aria-invalid", message ? "true" : "false");
        if (error) error.textContent = message || "";
        var fieldWrap = field.closest(".form-field");
        if (fieldWrap) fieldWrap.classList.toggle("has-error", Boolean(message));
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = form.elements.name;
        var email = form.elements.email;
        var topic = form.elements.topic;
        var message = form.elements.message;
        var firstInvalid = null;

        [name, email, topic, message].forEach(function (field) { setFieldError(field, ""); });

        if (name.value.trim().length < 2) {
          setFieldError(name, "请填写至少 2 个字的称呼。");
          firstInvalid = firstInvalid || name;
        }
        if (!email.validity.valid) {
          setFieldError(email, "请填写可以回复的邮箱地址。");
          firstInvalid = firstInvalid || email;
        }
        if (!topic.value) {
          setFieldError(topic, "请选择本次沟通的主题。");
          firstInvalid = firstInvalid || topic;
        }
        if (message.value.trim().length < 10) {
          setFieldError(message, "请用至少 10 个字说明岗位、产品或当前问题。");
          firstInvalid = firstInvalid || message;
        }

        if (firstInvalid) {
          if (status) status.textContent = "还有内容需要补充，请检查标记的字段。";
          firstInvalid.focus();
          return;
        }

        var subject = "网站联系｜" + topic.value + "｜" + name.value.trim();
        var body = [
          "称呼：" + name.value.trim(),
          "回复邮箱：" + email.value.trim(),
          "沟通主题：" + topic.value,
          "",
          message.value.trim()
        ].join("\n");
        var mailto = "mailto:2589798905@qq.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

        if (status) status.textContent = "信息已检查完成，正在打开邮箱应用。邮件仍需由你确认发送，本站不会保存这些内容。";
        if (successLink) successLink.hidden = false;
        window.location.href = mailto;
      });
    });

    if (document.body.hasAttribute("data-mobile-cta")) {
      var mobileActions = document.createElement("nav");
      mobileActions.className = "mobile-action-bar";
      mobileActions.setAttribute("aria-label", "移动端快捷行动");
      mobileActions.innerHTML = '<a href="/works/">看作品</a><a class="primary" href="/contact/">联系我</a>';
      document.body.appendChild(mobileActions);
      document.body.classList.add("has-mobile-action-bar");
    }

    if (document.body.hasAttribute("data-public-site")) {
      var noticeDismissed = false;
      try {
        noticeDismissed = window.localStorage.getItem("privacy-notice-dismissed") === "1";
      } catch (error) {
        noticeDismissed = false;
      }

      if (!noticeDismissed) {
        var privacyNotice = document.createElement("aside");
        privacyNotice.className = "privacy-notice";
        privacyNotice.setAttribute("aria-label", "隐私与 Cookie 提示");
        privacyNotice.innerHTML = '<p><strong>隐私提示</strong> 本站使用 Cloudflare Web Analytics 统计匿名访问，不使用广告或分析 Cookie；本机只保存这条提示的关闭状态。<a href="/privacy/">查看隐私说明</a></p><button type="button">知道了</button>';
        privacyNotice.querySelector("button").addEventListener("click", function () {
          try {
            window.localStorage.setItem("privacy-notice-dismissed", "1");
          } catch (error) {
            // The notice can still close when storage is unavailable.
          }
          privacyNotice.remove();
        });
        document.body.appendChild(privacyNotice);
      }
    }
  });
})();
