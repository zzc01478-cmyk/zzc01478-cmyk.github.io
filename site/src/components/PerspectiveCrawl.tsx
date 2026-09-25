"use client";

import { m, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Text tilted back in perspective that climbs as the page scrolls (after Skiper UI skiper28).
 * The original also swaps in Lenis smooth scrolling for the whole page; that is left out so
 * scrolling stays native. Reduced motion and print show the text flat (see components.css).
 */
export function PerspectiveCrawl({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  // Starts low and near, ends far enough up that the last line is readable.
  const y = useTransform(scrollYProgress, [0, 1], [360, -120]);
  const transform = useMotionTemplate`rotateX(30deg) translateY(${y}px) translateZ(10px)`;

  return (
    <div ref={ref} className="crawl">
      <div className="crawl-stage">
        <div className="crawl-view">
          <m.div className="crawl-text" style={{ transform }}>{children}</m.div>
        </div>
        <div className="crawl-actions">{actions}</div>
      </div>
    </div>
  );
}
