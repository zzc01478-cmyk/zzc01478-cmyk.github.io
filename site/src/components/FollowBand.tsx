import { PLATFORMS } from "@/lib/site";

export function FollowBand() {
  return (
    <div className="follow-band">
      <div>
        <h2>更多作品在平台更新</h2>
        <p className="fine-print">{PLATFORMS.map((p) => `${p.name}：${p.handle}`).join(" / ")}</p>
      </div>
      <div className="actions">
        {PLATFORMS.map((p, i) => (
          <a key={p.name} className={i === 0 ? "btn primary" : "btn"} href={p.url} rel="noopener">关注{p.name}</a>
        ))}
      </div>
    </div>
  );
}
