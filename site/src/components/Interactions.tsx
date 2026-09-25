"use client";

import { useEffect, useRef } from "react";

/** Five-step process buttons: pressing one rewrites the note beside it from the button's data attributes. */
export function ProcessSteps({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const note = scope.querySelector<HTMLElement>("[data-process-note]");
    const buttons = [...scope.querySelectorAll<HTMLButtonElement>("[data-process-step]")];
    const render = (button: HTMLButtonElement) => {
      if (!note) return;
      const title = note.querySelector("strong");
      const body = note.querySelector("p");
      const list = note.querySelector("ul");
      if (title) title.textContent = button.dataset.title || button.textContent!.trim();
      if (body) body.textContent = button.dataset.body || "";
      const points = (button.dataset.points || "").split("|").filter(Boolean);
      if (!list || !points.length) return;
      list.replaceChildren(...points.map((point) => Object.assign(document.createElement("li"), { textContent: point })));
    };
    const handlers = buttons.map((button) => {
      const onClick = () => {
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        render(button);
      };
      button.addEventListener("click", onClick);
      return () => button.removeEventListener("click", onClick);
    });
    return () => handlers.forEach((off) => off());
  }, []);
  return <div ref={root} className={className} data-reveal>{children}</div>;
}

/** WAI-ARIA tabs with arrow/Home/End keys; vertical list on wide screens. */
export function MethodTabs({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const buttons = [...scope.querySelectorAll<HTMLButtonElement>("[data-method-target]")];
    const panels = [...scope.querySelectorAll<HTMLElement>("[data-method-panel]")];
    const list = scope.querySelector('[role="tablist"]');
    const orient = () => list?.setAttribute("aria-orientation", window.innerWidth > 980 ? "vertical" : "horizontal");
    const activate = (button: HTMLButtonElement, focus: boolean) => {
      const id = button.getAttribute("aria-controls");
      buttons.forEach((item) => {
        item.setAttribute("aria-selected", String(item === button));
        item.tabIndex = item === button ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.id !== id; });
      if (focus) button.focus();
    };
    const offs = buttons.map((button, index) => {
      const onClick = () => activate(button, false);
      const onKey = (event: KeyboardEvent) => {
        let next = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        if (next === index && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        activate(buttons[next], true);
      };
      button.addEventListener("click", onClick);
      button.addEventListener("keydown", onKey);
      return () => {
        button.removeEventListener("click", onClick);
        button.removeEventListener("keydown", onKey);
      };
    });
    orient();
    window.addEventListener("resize", orient);
    return () => {
      offs.forEach((off) => off());
      window.removeEventListener("resize", orient);
    };
  }, []);
  return <div ref={root} className={className} data-method-tabs data-reveal>{children}</div>;
}

/** Evidence screenshots open full size in a modal; Escape or the backdrop closes it. */
export function ProofLightbox() {
  useEffect(() => {
    const images = [...document.querySelectorAll<HTMLImageElement>(".proof-frame img, .proof-hero-sheet img, .case-proof-grid img")];
    let overlay: HTMLDivElement | null = null;
    let trigger: HTMLElement | null = null;
    let previousOverflow = "";

    const close = () => {
      if (!overlay) return;
      overlay.classList.remove("is-active");
      overlay.hidden = true;
      document.body.style.overflow = previousOverflow;
      const shell = document.querySelector<HTMLElement>(".site-shell");
      if (shell) shell.inert = false;
      trigger?.focus();
      trigger = null;
    };
    const onKey = (event: KeyboardEvent) => {
      if (!overlay?.classList.contains("is-active")) return;
      if (event.key === "Tab") {
        event.preventDefault();
        overlay.querySelector("button")?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const build = () => {
      overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "图片预览");
      overlay.setAttribute("aria-describedby", "lightbox-caption");
      overlay.hidden = true;
      overlay.innerHTML = '<div class="lightbox-dialog"><button type="button" class="lightbox-close" aria-label="关闭预览 (Escape)">关闭 ✕</button><img alt=""><p class="lightbox-caption" id="lightbox-caption"></p></div>';
      overlay.querySelector("button")!.addEventListener("click", close);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) close(); });
      document.body.appendChild(overlay);
      return overlay;
    };
    const open = (image: HTMLImageElement) => {
      const box = overlay ?? build();
      const caption = (image.closest("figure") ?? image.parentElement)?.querySelector("figcaption")?.textContent?.trim() ?? "";
      const img = box.querySelector("img")!;
      trigger = image;
      img.src = image.src;
      img.alt = image.alt;
      box.querySelector(".lightbox-caption")!.textContent = caption || image.alt;
      previousOverflow = document.body.style.overflow;
      const shell = document.querySelector<HTMLElement>(".site-shell");
      if (shell) shell.inert = true;
      box.hidden = false;
      box.classList.add("is-active");
      document.body.style.overflow = "hidden";
      box.querySelector("button")!.focus();
    };
    const offs = images.map((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", "点击查看大图：" + (image.alt || "证据图"));
      const onClick = () => open(image);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open(image);
        }
      };
      image.addEventListener("click", onClick);
      image.addEventListener("keydown", onKeyDown);
      return () => {
        image.removeEventListener("click", onClick);
        image.removeEventListener("keydown", onKeyDown);
      };
    });
    window.addEventListener("keydown", onKey);
    return () => {
      offs.forEach((off) => off());
      window.removeEventListener("keydown", onKey);
      overlay?.remove();
    };
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <button type="button" className="btn" aria-label="打印或导出经历 PDF" onClick={() => window.print()}>打印 / 导出 PDF</button>
  );
}
