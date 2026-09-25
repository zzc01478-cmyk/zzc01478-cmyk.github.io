"use client";

import { useState, useSyncExternalStore } from "react";

const KEY = "privacy-notice-dismissed";
const noSubscription = () => () => {};

function readDismissed() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function PrivacyNotice() {
  // The server render has no storage, so it leaves the notice out; the browser decides after hydration.
  const dismissed = useSyncExternalStore(noSubscription, readDismissed, () => true);
  const [closed, setClosed] = useState(false);

  if (dismissed || closed) return null;
  return (
    <aside className="privacy-notice" aria-label="隐私与 Cookie 提示">
      <p><strong>隐私提示</strong> 本站使用 Cloudflare Web Analytics 统计匿名访问，不使用广告或分析 Cookie；本机只保存这条提示的关闭状态。<a href="/privacy/">查看隐私说明</a></p>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            // The notice can still close when storage is unavailable.
          }
          setClosed(true);
        }}
      >知道了</button>
    </aside>
  );
}
