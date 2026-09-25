"use client";

import { useEffect } from "react";
import { DOUYIN } from "@/lib/site";

/** Bottom action bar on phones; the body class reserves room for it in site-system.css. */
export function MobileActionBar() {
  useEffect(() => {
    document.body.classList.add("has-mobile-action-bar");
    return () => document.body.classList.remove("has-mobile-action-bar");
  }, []);
  return (
    <nav className="mobile-action-bar" aria-label="移动端快捷行动">
      <a href="/works/">看作品</a>
      <a className="primary" href={DOUYIN} rel="noopener">关注抖音</a>
    </nav>
  );
}
