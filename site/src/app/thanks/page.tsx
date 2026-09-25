import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "感谢｜抽纸盒",
  description: "感谢你整理好合作或交流信息。请确认邮件已经在邮箱应用中发送。",
  noindex: true,
});

export default function Page() {
  return (
    <section className="hero">
      <div className="wrap content-page page-hero-copy">
        <p className="kicker">感谢</p>
        <h1 className="page-title">谢谢你把信息整理清楚。</h1>
        <p className="lead">本站没有接收或保存联系表单内容。请确认邮件已经在邮箱应用中点击发送；之后可以继续查看作品与方法。</p>
        <div className="actions" aria-label="感谢页行动"><a className="btn primary" href="/works/">继续看作品</a><a className="btn" href="/contact/">返回联系页</a></div>
      </div>
    </section>
  );
}
