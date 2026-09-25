import { pageMeta } from "@/lib/site";
import { ProofLightbox } from "@/components/Interactions";
import { MobileActionBar } from "@/components/MobileActionBar";

export const metadata = pageMeta({
  title: "NV 固色：从起盘到复盘｜抽纸盒",
  description: "抽纸盒做信息流素材编导时的 NV 固色新品起盘案例：卖点拆解、视频三轮迭代与 KOC 二创，附脱敏后台截图。",
  path: "/works/nv-guse/",
  ogType: "article",
});

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="wrap page-hero-copy" data-reveal>
          <nav className="crumbs" aria-label="位置"><a href="/works/">作品</a><span aria-hidden="true">/</span><a href="/works/#cases">电商案例</a></nav>
          <h1 className="page-title"><span className="nobr">NV 固色：</span><span className="nobr">从起盘到复盘</span></h1>
          <p className="lead">做 AI 视频之前，我在电商团队做信息流素材编导。这是一个从零起盘的新品项目，按起盘、视频迭代和 KOC 二创三段展开；数据是团队后台的投放消耗记录，只说明项目阶段，不做效果归因。</p>
          <div className="actions" aria-label="案例页行动"><a className="btn primary" href="#nv">从起盘看起</a><a className="btn" href="/works/sucai-fangfa/">看素材编导方法</a></div>
        </div>
      </section>

      <section className="section" aria-label="NV 固色案例">
        <article className="case" id="nv" tabIndex={-1}>
          <div className="wrap">
            <header className="case-head" data-reveal>
              <span className="case-numeral">01</span>
              <div>
                <h2>NV 固色 0-1 起号</h2>
                <p className="lead">围绕鞋类清洁与护理场景，把卖点拆成具体可拍的画面，再根据投放反馈持续迭代脚本。</p>
              </div>
            </header>
            <dl className="case-meta" data-reveal>
              <div><dt>业务问题</dt><dd>新品起盘阶段，产品优势需要变成能打动目标用户的短视频镜头。</dd></div>
              <div><dt>编导动作</dt><dd>拆解卖点与痛点、撰写分镜脚本、规划镜头，整理素材库与复盘记录。</dd></div>
              <div><dt>交付产出</dt><dd>分镜脚本、素材库、对标素材拆解与复盘记录。</dd></div>
              <div><dt>投放消耗</dt><dd>2025 年 12 月 6,188.06 元，2026 年 1 月 14,313.78 元，2026 年 2 月前 5 天 8,897.60 元。</dd></div>
            </dl>
            <p className="case-note fine-print">这组数据是团队的投放消耗记录，我参与了内容方向、分镜与复盘。消耗不等于销售额或 ROI，也不能单独证明素材优化的效果；2 月只统计前 5 天，不与整月直接比较。公开图片为脱敏摘录。</p>
            <div className="case-proof-grid" role="group" aria-label="NV 固色公开证据" data-reveal>
              <figure className="proof-frame is-metric">
                <img src="/assets/materials/proof-nv-dec-consume-public.png" alt="NV 固色 2025 年 12 月项目起盘消耗证据摘录" width="960" height="540" loading="lazy" decoding="async" />
                <figcaption><span className="fig-no">图 1</span>12 月起盘：消耗 6,188.06 元</figcaption>
              </figure>
              <figure className="proof-frame is-metric">
                <img src="/assets/materials/proof-nv-jan-consume-public.png" alt="NV 固色 2026 年 1 月项目消耗证据摘录" width="960" height="540" loading="lazy" decoding="async" />
                <figcaption><span className="fig-no">图 2</span>1 月记录：消耗 14,313.78 元</figcaption>
              </figure>
              <figure className="proof-frame is-metric">
                <img src="/assets/materials/proof-nv-feb-consume-public.png" alt="NV 固色 2026 年 2 月前 5 天投放消耗证据摘录" width="960" height="540" loading="lazy" decoding="async" />
                <figcaption><span className="fig-no">图 3</span>2 月前 5 天：消耗 8,897.60 元</figcaption>
              </figure>
            </div>
          </div>
        </article>

        <article className="case" id="iteration" tabIndex={-1}>
          <div className="spread case-spread">
            <div className="case-text" data-reveal>
              <header className="case-head">
                <span className="case-numeral">02</span>
                <div>
                  <h2>视频三轮迭代</h2>
                  <p className="lead">针对同一个产品，比较不同的开头冲突、画面密度与信任点顺序，结合反馈提出下一轮测试方向。</p>
                </div>
              </header>
              <dl className="case-meta is-2x2">
                <div><dt>业务问题</dt><dd>单条素材无法判断变量，需要分别检查开头吸引力、信息密度和信任证据。</dd></div>
                <div><dt>编导动作</dt><dd>保留核心卖点，逐轮调整开头冲突、角色视角与剪辑节奏。</dd></div>
                <div><dt>交付产出</dt><dd>三版脚本、剪辑节奏表与镜头差异说明。</dd></div>
                <div><dt>复盘发现</dt><dd>截图显示 13 秒互动峰值，可用于回看对应镜头；不能据此推断留存或转化改善。</dd></div>
              </dl>
            </div>
            <div className="case-visual bleed" data-reveal>
              <div className="case-proof-grid is-single" role="group" aria-label="视频迭代公开证据">
                <figure className="proof-frame">
                  <img src="/assets/materials/proof-video-timing-13s.png" alt="视频互动时序 13 秒峰值截图" width="1073" height="526" loading="lazy" decoding="async" />
                  <figcaption><span className="fig-no">图 4</span>13 秒互动峰值：作为镜头回看与下一轮测试的线索。</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </article>

        <article className="case" id="koc" tabIndex={-1}>
          <div className="spread case-spread is-mirrored">
            <div className="case-text" data-reveal>
              <header className="case-head">
                <span className="case-numeral">03</span>
                <div>
                  <h2>KOC 二创</h2>
                  <p className="lead">重组用户视角素材，在保留生活化口吻的前提下，补足产品信息与行动引导，并核对素材使用边界。</p>
                </div>
              </header>
              <dl className="case-meta is-2x2">
                <div><dt>业务问题</dt><dd>素人 KOC 素材生活感强、信任度高，但结构松散，容易漏掉核心卖点。</dd></div>
                <div><dt>编导动作</dt><dd>提炼真实表达，重组开头、产品证据与结尾行动引导。</dd></div>
                <div><dt>交付产出</dt><dd>KOC 二创脚本、剪辑备注与素材使用边界。</dd></div>
                <div><dt>复盘维度</dt><dd>检查真实口吻、产品信息完整度与前 3 秒表达，避免二创变成脱离原意的硬广。</dd></div>
              </dl>
            </div>
            <div className="case-visual bleed" data-reveal>
              <div className="case-proof-grid is-single" role="group" aria-label="KOC 二创公开证据">
                <figure className="proof-frame">
                  <img src="/assets/materials/proof-koc-timing-17s-public.png" alt="KOC 二创互动时序分析截图，17 秒互动峰值" width="1083" height="500" loading="lazy" decoding="async" />
                  <figcaption><span className="fig-no">图 5</span>17 秒互动峰值：用于回看对应表达，不单独作效果归因。</figcaption>
                </figure>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="section">
        <div className="wrap page-next-step" data-reveal>
          <div><h2>现在我用 AI 做视频。</h2><p>每条都先写分镜脚本，定好镜头顺序和台词，再交给模型生成。</p></div>
          <a className="btn primary" href="/works/">看 AI 作品</a>
        </div>
      </section>
      <ProofLightbox />
      <MobileActionBar />
    </>
  );
}
