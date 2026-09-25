import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "页面未找到｜抽纸盒",
  description: "该路径没有公开内容。",
  noindex: true,
});

export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap page-hero-copy">
        <p className="kicker">404 · 路径未找到</p>
        <h1 className="page-title">该路径没有公开内容。</h1>
        <p className="lead">可能是网址输入有误，或者该页面已被归档或移动。你可以直接返回首页，或查看公开作品档案。</p>
        <div className="actions" aria-label="404 导航行动">
          <a className="btn primary" href="/">返回首页</a>
          <a className="btn" href="/works/">看公开作品</a>
        </div>
      </div>
    </section>
  );
}
