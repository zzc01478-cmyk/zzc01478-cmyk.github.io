"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/works/", label: "作品" },
  { href: "/about/", label: "关于" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  // Mobile: hide the header while scrolling down, bring it back on the way up.
  useEffect(() => {
    let ticking = false;
    last.current = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      const diff = y - last.current;
      setScrolled(y > 24);
      if (window.innerWidth <= 720) {
        if (diff > 8 && y > 120) setHidden(true);
        else if (diff < -8 || y <= 120) setHidden(false);
      } else {
        setHidden(false);
      }
      last.current = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      if (window.innerWidth > 720) setHidden(false);
      last.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={cn("site-header", scrolled && "is-scrolled", hidden && "is-hidden")}>
      <div className="wrap">
        <a className="brand" href="/" aria-label="抽纸盒首页"><strong>抽纸盒</strong><span>用 AI 做视频的编导</span></a>
        <nav className="nav-links" aria-label="主导航">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} aria-current={current(item.href) ? "page" : undefined}>{item.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}
