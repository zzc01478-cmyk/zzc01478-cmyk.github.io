"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A copyable prompt. Long prompts scroll inside the block with faded edges where more text
 * continues (after Skiper UI skiper87's scroll-area fade).
 */
export function PromptBlock({ text }: { text: string }) {
  const scroller = useRef<HTMLPreElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const update = () => {
      setFade({
        top: node.scrollTop > 2,
        bottom: node.scrollTop + node.clientHeight < node.scrollHeight - 2,
      });
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const copy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="prompt-block" data-fade-top={fade.top || undefined} data-fade-bottom={fade.bottom || undefined}>
      <pre ref={scroller} tabIndex={0} aria-label="提示词"><code>{text}</code></pre>
      <button type="button" className="copy-btn" onClick={copy}>{copied ? "已复制" : "复制"}</button>
    </div>
  );
}
