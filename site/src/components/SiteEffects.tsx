"use client";

import { useEffect } from "react";

// Old /works/#case anchors from the job-seeking site now live on the two case pages.
const MOVED_CASES: Record<string, string> = {
  nv: "/works/nv-guse/",
  iteration: "/works/nv-guse/#iteration",
  koc: "/works/nv-guse/#koc",
  shoe: "/works/sucai-fangfa/#shoe",
  matrix: "/works/sucai-fangfa/#matrix",
};

/**
 * Page-wide behavior that decorates server-rendered markup:
 * scroll reveal (CSS-first, so text stays visible without JS and in print), image load states,
 * focus for #hash targets, and the legacy works-anchor redirect.
 */
export function SiteEffects() {
  useEffect(() => {
    if (window.location.pathname === "/works/") {
      const moved = MOVED_CASES[window.location.hash.slice(1)];
      if (moved) {
        window.location.replace(moved);
        return;
      }
    }

    document.body.classList.add("is-loaded");

    const cleanups: (() => void)[] = [];

    document.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      if (image.closest("[aria-hidden='true']")) return;
      const host = image.closest("figure") ?? image.parentElement;
      if (!host) return;
      const finish = () => {
        host.classList.remove("is-image-loading");
        host.removeAttribute("aria-busy");
      };
      const fail = () => {
        finish();
        if (host.querySelector(".image-error")) return;
        host.classList.add("has-image-error");
        const fallback = document.createElement("span");
        fallback.className = "image-error";
        fallback.textContent = image.getAttribute("alt") || "图片暂时无法加载";
        host.insertBefore(fallback, host.querySelector("figcaption"));
      };
      if (!image.complete) {
        host.classList.add("is-image-loading");
        host.setAttribute("aria-busy", "true");
        image.addEventListener("load", finish, { once: true });
      }
      image.addEventListener("error", fail);
      if (image.complete && image.naturalWidth === 0) fail();
    });

    document.querySelectorAll(".hero, .section").forEach((scope) => {
      scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node, index) => {
        node.style.setProperty("--reveal-index", String(Math.min(index, 4)));
      });
    });
    const reveal = document.querySelectorAll("[data-reveal]");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      reveal.forEach((node) => observer.observe(node));
      cleanups.push(() => observer.disconnect());
    } else {
      reveal.forEach((node) => node.classList.add("is-visible"));
    }

    const focusHash = () => {
      if (!window.location.hash) return;
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      document.getElementById(id)?.focus({ preventScroll: true });
    };
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("a[href^='#']")) requestAnimationFrame(focusHash);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", focusHash);
    requestAnimationFrame(focusHash);
    cleanups.push(() => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", focusHash);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
