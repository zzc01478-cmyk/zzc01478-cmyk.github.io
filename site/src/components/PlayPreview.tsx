"use client";

import { AnimatePresence, m, useSpring } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import type { WorkCardData } from "@/lib/works";

// The player (media-chrome) only downloads once the visitor asks to watch.
const VideoPopover = dynamic(() => import("@/components/VideoPopover").then((mod) => mod.VideoPopover), { ssr: false });

const SPRING = { mass: 0.1 };

/**
 * Poster that opens the full player (after Skiper UI skiper67): a "播放" label rests in the middle,
 * follows the mouse across the poster, and a click opens the popover player.
 * The poster stays a still image; no video loads until the visitor presses play.
 */
export function PlayPreview({
  work,
  className,
  priority = false,
  notesLink = true,
  small = false,
}: {
  work: WorkCardData;
  className?: string;
  priority?: boolean;
  /** Show the "制作笔记" link in the player bar; off on the work page itself. */
  notesLink?: boolean;
  /** Use the 480px poster, for small previews such as carousel slides. */
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  // Offset of the label from the poster's centre.
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  const follow = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - box.left - box.width / 2);
    y.set(event.clientY - box.top - box.height / 2);
  };
  const recentre = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <>
      <button
        type="button"
        className={cn("play-preview", className)}
        style={{ aspectRatio: `${work.width} / ${work.height}` }}
        aria-label={`播放《${work.title}》`}
        onClick={() => setOpen(true)}
        onPointerMove={follow}
        onPointerLeave={recentre}
      >
        <img
          src={small ? work.posterSmall : work.poster}
          alt=""
          width={work.width}
          height={work.height}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
        />
        <m.span className="play-cursor" style={{ x, y }} aria-hidden="true">
          <svg viewBox="0 0 12 14"><path d="M0.9375 13.2422C1.25 13.2422 1.51562 13.1172 1.82812 12.9375L10.9375 7.67188C11.5859 7.28906 11.8125 7.03906 11.8125 6.625C11.8125 6.21094 11.5859 5.96094 10.9375 5.58594L1.82812 0.3125C1.51562 0.132812 1.25 0.015625 0.9375 0.015625C0.359375 0.015625 0 0.453125 0 1.13281V12.1172C0 12.7969 0.359375 13.2422 0.9375 13.2422Z" /></svg>
          播放
        </m.span>
      </button>
      <noscript><a className="inline-link" href={work.video}>直接打开视频</a></noscript>
      <AnimatePresence>{open && <VideoPopover work={work} onClose={close} notesLink={notesLink} />}</AnimatePresence>
    </>
  );
}
