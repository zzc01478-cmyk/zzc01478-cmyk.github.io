"use client";

import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
} from "media-chrome/react";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  poster: string;
  width: number;
  height: number;
  title: string;
  autoPlay?: boolean;
  className?: string;
};

/**
 * Dark minimal player (after Skiper UI skiper67, built on media-chrome).
 * The video never preloads: it only streams after the visitor presses play.
 */
export function VideoPlayer({ src, poster, width, height, title, autoPlay, className }: Props) {
  return (
    <MediaController className={cn("kami-player", className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <video
        slot="media"
        src={src}
        poster={poster}
        preload="none"
        playsInline
        width={width}
        height={height}
        autoPlay={autoPlay}
        aria-label={title}
        suppressHydrationWarning
      />
      <MediaControlBar className="kami-player-bar">
        <MediaPlayButton className="kami-player-btn" />
        <MediaTimeRange className="kami-player-range" />
        <MediaTimeDisplay className="kami-player-time" showDuration />
        <MediaMuteButton className="kami-player-btn" />
        <MediaFullscreenButton className="kami-player-btn" />
      </MediaControlBar>
    </MediaController>
  );
}
