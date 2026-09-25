"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import type { WorkCardData } from "@/lib/works";

/**
 * Poster strip where the active work widens and shows its title (after Skiper UI skiper52).
 * Hover or keyboard focus opens an item; on touch, the first tap opens it and the second follows the link.
 */
export function HoverExpand({ works }: { works: WorkCardData[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="hover-expand">
      {works.map((work, index) => {
        const isActive = active === index;
        return (
          <m.a
            key={work.slug}
            href={work.url}
            className={isActive ? "hover-expand-item is-active" : "hover-expand-item"}
            aria-label={`${work.title}，${work.model} · ${work.date}`}
            initial={false}
            animate={{ flexGrow: isActive ? 3.5 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onHoverStart={() => setActive(index)}
            onFocus={() => setActive(index)}
            onPointerDown={(event) => {
              if (event.pointerType === "touch" && !isActive) {
                // Keep the tap from navigating; the next tap on the opened poster does.
                event.currentTarget.dataset.opening = "1";
                setActive(index);
              }
            }}
            onClick={(event) => {
              if (event.currentTarget.dataset.opening) {
                delete event.currentTarget.dataset.opening;
                event.preventDefault();
              }
            }}
          >
            <img src={work.posterSmall} alt="" width={work.width} height={work.height} loading="lazy" decoding="async" />
            <AnimatePresence>
              {isActive && (
                <m.span
                  className="hover-expand-shade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
            <span className="hover-expand-caption" aria-hidden="true">
              <span className="hover-expand-title">{work.title}</span>
              <span className="hover-expand-meta">{work.model} · {work.date}</span>
            </span>
          </m.a>
        );
      })}
    </div>
  );
}
