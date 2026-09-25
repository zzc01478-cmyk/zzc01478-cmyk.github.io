import { MobileActionBar } from "@/components/MobileActionBar";
import { MotionProvider } from "@/components/MotionProvider";
import { PerspectiveCrawl } from "@/components/PerspectiveCrawl";
import { WorksCarousel } from "@/components/WorksCarousel";
import { DOUYIN, PLATFORMS, pageMeta } from "@/lib/site";
import { cardData, videoWorks } from "@/lib/works";

export const metadata = pageMeta({
  title: "抽纸盒｜用 AI 做视频的编导",
  description: "抽纸盒（陈志鸿），用 AI 做视频的编导。AI 视频作品与制作笔记：用了什么工具、提示词怎么写、踩过哪些坑。",
  ogDescription: "AI 视频作品与制作笔记，抖音、小红书、X 同步更新。",
  path: "/",
});

export default function Home() {
  const latest = videoWorks.slice(0, 8).map(cardData);

  // Only the home page and work pages animate with framer-motion, so only they load the motion features.
  return (
    <MotionProvider>
      <section className="hero hero-home">
        <div className="spread">
          <div className="hero-copy" data-reveal>
            <p className="kicker">用 AI 做视频的编导</p>
            <h1 className="display">抽纸盒</h1>
            <p className="lead">我叫陈志鸿，数字媒体艺术本科。做过影视后期包装、品牌拍摄剪辑和电商信息流素材编导，现在用 AI 做视频。每条都先写分镜脚本，定好镜头顺序和台词，再交给模型生成。</p>
            <div className="role-strip" aria-label="做过的事">
              <span>影视后期</span>
              <span>品牌拍剪</span>
              <span>信息流素材编导</span>
              <span>AI 视频</span>
            </div>
            <div className="actions" aria-label="关注抽纸盒">
              {PLATFORMS.map((p, i) => (
                <a key={p.name} className={i === 0 ? "btn primary" : "btn"} href={p.url} rel="noopener">{i === 0 ? `关注${p.name}` : p.name}</a>
              ))}
            </div>
            <p className="platform-ids">抖音号 MG2617 / 小红书 抽纸盒 / X @zzchen275198 · <a className="inline-link" href="/about/">完整经历</a></p>
          </div>
          <figure className="image-panel" data-reveal>
            <img src="/assets/materials/profile-portrait.jpg" alt="陈志鸿的个人照片" width="1080" height="1440" decoding="async" fetchPriority="high" />
            <figcaption>陈志鸿，也叫抽纸盒。</figcaption>
          </figure>
        </div>
      </section>

      <section className="section" id="latest" aria-labelledby="latest-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <h2 className="section-title" id="latest-title">最新作品</h2>
            <p className="lead">左右滑动换一件，点中间那张看完整视频，点标题看制作笔记。</p>
          </div>
          {latest.length ? <WorksCarousel works={latest} /> : <p className="fine-print">作品整理中。</p>}
          <p className="process-cta">
            <span>全部 AI 视频作品，以及电商素材案例。</span>
            <span className="closing-actions">
              <a className="inline-link" href="/works/">看全部作品</a>
              <a className="inline-link" href="/works/#cases">看电商案例</a>
            </span>
          </p>
        </div>
      </section>

      <section className="crawl-section" id="contact" tabIndex={-1} aria-labelledby="contact-title">
        <PerspectiveCrawl
          actions={
            <>
              <a className="btn primary" href="/contact/">写邮件</a>
              <a className="btn" href={DOUYIN} rel="noopener">关注抖音</a>
            </>
          }
        >
          <h2 id="contact-title">合作、授权，或只是聊聊。</h2>
          <p>商务合作、作品授权，或者想交流 AI 视频的做法，发邮件最快。</p>
          <p>合作请写明品牌或产品、想要的内容形式和时间；授权请附上作品链接和使用范围。</p>
          <p>抖音号 MG2617 / 小红书 抽纸盒 / X @zzchen275198</p>
        </PerspectiveCrawl>
      </section>
      <MobileActionBar />
    </MotionProvider>
  );
}
