"use client";

import { m } from "framer-motion";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { WorkCardData } from "@/lib/works";

/**
 * Full-screen player that opens out of the poster with a clip-path reveal (after Skiper UI skiper67).
 * Modal, portalled to <body> so it stays outside the inert page: the page behind is inert, Escape or the backdrop closes it, focus returns to the trigger.
 */
export function VideoPopover({ work, onClose, notesLink = true }: { work: WorkCardData; onClose: () => void; notesLink?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    if (shell) shell.inert = true;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (shell) shell.inert = false;
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="video-popover" role="dialog" aria-modal="true" aria-label={`播放《${work.title}》`}>
      <m.div
        className="video-popover-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <m.div
        className="video-popover-frame"
        style={{ aspectRatio: `${work.width} / ${work.height}`, "--r": work.width / work.height } as React.CSSProperties}
        initial={{ clipPath: "inset(43.5% round 12px)", opacity: 0 }}
        animate={{ clipPath: "inset(0% round 12px)", opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: "easeOut" } }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <VideoPlayer src={work.video!} poster={work.poster} width={work.width} height={work.height} title={work.title} autoPlay />
      </m.div>
      <div className="video-popover-bar">
        {notesLink ? <a href={work.url}>看《{work.title}》的制作笔记</a> : <span>{work.title}</span>}
        <button ref={closeRef} type="button" onClick={onClose}>关闭</button>
      </div>
    </div>,
    document.body,
  );
}
