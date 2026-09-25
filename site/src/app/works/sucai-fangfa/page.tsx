import { pageMeta } from "@/lib/site";
import { MethodTabs, ProcessSteps } from "@/components/Interactions";
import { MobileActionBar } from "@/components/MobileActionBar";

export const metadata = pageMeta({
  title: "素材编导方法｜抽纸盒",
  description: "抽纸盒的素材编导方法：五步流程、四个核心动作、鞋类卖点拆解与四种视角矩阵，把素材拆成可执行、可测试的变量。",
  path: "/works/sucai-fangfa/",
  ogType: "article",
});

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="wrap page-hero-copy" data-reveal>
          <nav className="crumbs" aria-label="位置"><a href="/works/">作品</a><span aria-hidden="true">/</span><a href="/works/#cases">电商案例</a></nav>
          <h1 className="page-title"><span className="nobr">素材不是灵感，</span><span className="nobr">是变量。</span></h1>
          <p className="lead">这是我做信息流素材编导时整理的方法：把素材生产从碰运气的单次灵感，变成有依据、能测试、可以一轮轮迭代的工作。现在做 AI 视频，也是先写分镜脚本，再交给模型生成。</p>
          <div className="actions" aria-label="案例页行动"><a className="btn primary" href="#process">看五步流程</a><a className="btn" href="/works/nv-guse/">看 NV 固色案例</a></div>
        </div>
      </section>

      <section className="section" id="process">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <h2 className="section-title">一条素材的五个环节</h2>
            <p className="lead">每一步都要落到一份能交给拍摄或剪辑的产出，而不是停在想法上。</p>
          </div>
          <ProcessSteps className="process-board">
            <div className="step-list" aria-label="流程步骤">
              <button type="button" aria-pressed="true" aria-controls="process-note" data-process-step data-title="卖点" data-body="先把产品优势拆成具体可拍的证据，而不是停在好用、好看、划算。" data-points="输出：卖点证据表|痛点出现在哪个场景|证据能不能被镜头看见"><span>01</span>卖点</button>
              <button type="button" aria-pressed="false" aria-controls="process-note" data-process-step data-title="对标" data-body="看同场景的素材怎样进入问题、怎样铺信任点、怎样转到行动。" data-points="输出：开头与信任点拆解|信任点放在哪一秒|评论区反复在问什么"><span>02</span>对标</button>
              <button type="button" aria-pressed="false" aria-controls="process-note" data-process-step data-title="分镜" data-body="把脚本写成镜头顺序，分清必拍镜头、补拍镜头和剪辑节奏。" data-points="输出：必拍镜头清单|哪几个镜头需要补拍|转行动前要不要再留一个证据"><span>03</span>分镜</button>
              <button type="button" aria-pressed="false" aria-controls="process-note" data-process-step data-title="拍剪" data-body="先做出能测的第一版，再根据反馈决定保留哪个变量、替换哪个变量。" data-points="输出：第一版可测素材|开头和节奏分开测试|剪掉不能证明卖点的镜头"><span>04</span>拍剪</button>
              <button type="button" aria-pressed="false" aria-controls="process-note" data-process-step data-title="复盘" data-body="复盘只回答三件事：下一轮拍什么、删什么、保留什么。" data-points="输出：下一轮补拍清单|保留有效镜头|删除误导信息"><span>05</span>复盘</button>
            </div>
            <div className="process-note" id="process-note" data-process-note aria-live="polite">
              <strong>卖点</strong>
              <p>先把产品优势拆成具体可拍的证据，而不是停在好用、好看、划算。</p>
              <ul><li>输出：卖点证据表</li><li>痛点出现在哪个场景</li><li>证据能不能被镜头看见</li></ul>
            </div>
          </ProcessSteps>
          <div className="process-cta" data-reveal>
            <p>已经有产品页、历史素材或投放反馈，可以按这套流程先拆下一轮的测试方向。</p>
            <a className="inline-link" href="/contact/">带材料来沟通</a>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="method-actions-title">
        <div className="wrap">
          <h2 className="section-title visually-hidden" id="method-actions-title">四个核心动作</h2>
          <MethodTabs className="method-shell">
            <div className="tab-list" role="tablist" aria-label="方法切换" aria-orientation="vertical">
              <button type="button" role="tab" id="method-tab-deconstruct" aria-controls="method-panel-deconstruct" aria-selected="true" tabIndex={0} data-method-target="deconstruct"><span>01</span>AI 对标拆解</button>
              <button type="button" role="tab" id="method-tab-role" aria-controls="method-panel-role" aria-selected="false" tabIndex={-1} data-method-target="role"><span>02</span>多视角脚本</button>
              <button type="button" role="tab" id="method-tab-hook" aria-controls="method-panel-hook" aria-selected="false" tabIndex={-1} data-method-target="hook"><span>03</span>分镜与前 3 秒</button>
              <button type="button" role="tab" id="method-tab-review" aria-controls="method-panel-review" aria-selected="false" tabIndex={-1} data-method-target="review"><span>04</span>数据复盘闭环</button>
            </div>
            <div className="method-content">
              <div role="tabpanel" id="method-panel-deconstruct" aria-labelledby="method-tab-deconstruct" tabIndex={0} data-method-panel="deconstruct">
                <strong>AI 对标与卖点拆解</strong>
                <p>第一步不是凭空想点子。我用 AI 工作流拆解同品类的参考视频，提取关键画面、痛点切入点和信任节奏，再把模糊的产品优势落到镜头能拍、用户能感知的具体事实上。</p>
                <ul>
                  <li>用 AI 快速整理参考视频的时序结构、核心台词与视觉冲突点，再由人工核对。</li>
                  <li>把产品优势落到具体的使用场景和痛点，不写空泛的自夸。</li>
                  <li>把卖点拆成近景特写、对比实验和使用动作，用镜头代替形容词。</li>
                </ul>
              </div>
              <div role="tabpanel" id="method-panel-role" aria-labelledby="method-tab-role" tabIndex={0} data-method-panel="role" hidden>
                <strong>多视角脚本矩阵</strong>
                <p>避免所有素材都用同一种喊话口吻。同一款产品从商家、用户、专家、KOC 四种视角切入，可以拓宽测试的范围，照顾到不同决策习惯的用户。</p>
                <ul>
                  <li>商家视角：讲品牌选材的初衷与品质承诺，建立基础信任。</li>
                  <li>用户视角：讲痛点场景与前后变化，让人看到自己。</li>
                  <li>专家视角：讲成分、工艺与行业标准，给出理性的购买理由。</li>
                  <li>KOC 视角：保留测评口吻，正面回应真实顾虑。</li>
                </ul>
              </div>
              <div role="tabpanel" id="method-panel-hook" aria-labelledby="method-tab-hook" tabIndex={0} data-method-panel="hook" hidden>
                <strong>分镜设计与前 3 秒</strong>
                <p>前 3 秒不是制造噪音，而是让目标用户在划到的那一刻意识到「这和我有关」。分镜要把视觉冲突放在前面，并让后面的镜头紧紧接住核心卖点。</p>
                <ul>
                  <li>第一镜交代清楚人物身份和具体冲突场景，先锁定目标用户。</li>
                  <li>痛点前置，不做冗长铺垫，直接给出反差或问题。</li>
                  <li>分清必拍镜头与补拍镜头，让现场拍摄节奏和成片剪辑对得上。</li>
                </ul>
              </div>
              <div role="tabpanel" id="method-panel-review" aria-labelledby="method-tab-review" tabIndex={0} data-method-panel="review" hidden>
                <strong>数据反馈与快速迭代</strong>
                <p>投放数据是素材迭代最直接的依据。复盘不求长篇大论，只看 3 秒、5 秒完播率、点击率和互动峰值，明确下一轮要保留什么、删掉什么、再测什么。</p>
                <ul>
                  <li>对比 3 秒与 5 秒完播率，定位开头的流失点，替换新的开头。</li>
                  <li>看互动时序峰值，把用户感兴趣的论据特写适度前置或加强。</li>
                  <li>把验证过的镜头沉淀进素材库，组合出下一批测试版本。</li>
                </ul>
              </div>
            </div>
          </MethodTabs>
        </div>
      </section>

      <section className="section" aria-label="方法案例">
        <article className="case" id="shoe" tabIndex={-1}>
          <div className="wrap">
            <header className="case-head" data-reveal>
              <span className="case-numeral">01</span>
              <div>
                <h2>鞋类 3.2 拆解</h2>
                <p className="lead">把鞋款卖点从抽象的「好看好穿」，拆成真实通勤场景、脚感对比和购买前的顾虑。</p>
              </div>
            </header>
            <div className="word-split" data-reveal>
              <p className="from"><small>原来的说法</small>「好看、好穿」</p>
              <ol aria-label="拆解后的四个镜头方向">
                <li><small>01</small>脚感</li>
                <li><small>02</small>搭配</li>
                <li><small>03</small>细节</li>
                <li><small>04</small>顾虑</li>
              </ol>
            </div>
            <dl className="case-meta" data-reveal>
              <div><dt>业务问题</dt><dd>只夸外观容易像硬广，缺少让用户下决定的理由。</dd></div>
              <div><dt>编导动作</dt><dd>按用户顾虑重排脚本顺序，补充使用场景、脚感表达与细节镜头。</dd></div>
              <div><dt>交付产出</dt><dd>鞋类卖点拆解表、拍摄清单与常见评论顾虑对照表。</dd></div>
              <div><dt>后续复用</dt><dd>整理为后续鞋类素材的分镜检查框架。</dd></div>
            </dl>
          </div>
        </article>

        <article className="case" id="matrix" tabIndex={-1}>
          <div className="wrap">
            <header className="case-head" data-reveal>
              <span className="case-numeral">02</span>
              <div>
                <h2>四种视角的素材矩阵</h2>
                <p className="lead">同一款产品从商家、用户、专家和 KOC 四种视角切入，形成有差异的测试素材，避免方向单一、很快枯竭。</p>
              </div>
            </header>
            <dl className="matrix" data-reveal>
              <div><dt>商家视角</dt><dd>讲品牌选材的初衷与品质承诺，建立基本信任。</dd></div>
              <div><dt>用户视角</dt><dd>讲日常痛点、真实场景与使用前后的直观变化。</dd></div>
              <div><dt>专家视角</dt><dd>讲行业评判标准，以及成分或设计背后的专业逻辑。</dd></div>
              <div><dt>KOC 视角</dt><dd>保留原本的使用体验，用素人口吻回应购买前的顾虑。</dd></div>
            </dl>
            <p className="matrix-summary" data-reveal><span>留下什么</span>一套可以持续测试的素材方向，而不是一次性的单条素材。</p>
          </div>
        </article>
      </section>

      <section className="section" aria-labelledby="modules-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <h2 className="section-title" id="modules-title">方法要能落到拍摄现场。</h2>
            <p className="lead">下面六个模块，每一个都对应一份可以交给拍摄或剪辑的东西。</p>
          </div>
          <ol className="module-list" data-reveal>
            <li><h3>卖点拆解</h3><p>把产品卖点拆成近景特写、使用前后对比和真实使用动作，用镜头代替形容词。</p></li>
            <li><h3>脚本分镜</h3><p>用画面推进来承载说服逻辑，不把脚本写成一整篇干巴巴的口播。</p></li>
            <li><h3>拍剪落地</h3><p>拍摄前列好必拍镜头与补拍备选，剪辑时控制节奏和信息密度。</p></li>
            <li><h3>视角矩阵</h3><p>从商家、用户、专家与 KOC 四种视角切入，拓宽测试维度与受众范围。</p></li>
            <li><h3>AI 工作流</h3><p>用 AI 结构化拆解参考素材、生成多版脚本草稿，再由人工核对产品事实、镜头可行性与表达。</p></li>
            <li><h3>复盘迭代</h3><p>结合 3 秒完播与点击数据定位问题，持续生成下一轮测试版本。</p></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap page-next-step" data-reveal>
          <div><h2>现在我用 AI 做视频。</h2><p>每条都先写分镜脚本，定好镜头顺序和台词，再交给模型生成。</p></div>
          <a className="btn primary" href="/works/">看 AI 作品</a>
        </div>
      </section>
      <MobileActionBar />
    </>
  );
}
