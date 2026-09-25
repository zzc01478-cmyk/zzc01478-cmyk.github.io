import { MobileActionBar } from "@/components/MobileActionBar";
import { WorkWall } from "@/components/WorkCard";
import { DOUYIN, pageMeta } from "@/lib/site";
import { columns } from "@/lib/works";

export const metadata = pageMeta({
  title: "作品｜抽纸盒",
  description: "抽纸盒的 AI 视频作品与电商素材案例，每件 AI 视频附制作笔记：工具、提示词、步骤和踩过的坑。",
  ogDescription: "AI 视频作品与制作笔记，附工具、提示词和踩坑记录。",
  path: "/works/",
});

export default function WorksPage() {
  return (
    <>
      <section className="hero">
        <div className="wrap page-hero-copy" data-reveal>
          <p className="kicker">作品</p>
          <h1 className="page-title">做过的，都在这里。</h1>
          <p className="lead">AI 视频和电商案例两栏。每件 AI 视频都附制作笔记：用了哪些工具、提示词怎么写、关键步骤和踩过的坑。电商案例是我做信息流素材编导时的项目复盘。</p>
          <div className="actions" aria-label="作品页行动">
            <a className="btn primary" href={DOUYIN} rel="noopener">关注抖音看最新</a>
            <a className="btn" href="/about/">关于抽纸盒</a>
          </div>
        </div>
      </section>

      <section className="section" aria-label="作品墙">
        <div className="wrap">
          {columns.length ? columns.map((col) => (
            <section key={col.anchor} className="wall-column" id={col.anchor} tabIndex={-1} aria-labelledby={`${col.anchor}-title`}>
              <h2 className="wall-title" id={`${col.anchor}-title`}>{col.name}<span>{col.works.length} 件</span></h2>
              <WorkWall works={col.works} />
            </section>
          )) : <p className="fine-print">作品整理中，先去平台看看最新内容。</p>}
        </div>
      </section>
      <MobileActionBar />
    </>
  );
}
