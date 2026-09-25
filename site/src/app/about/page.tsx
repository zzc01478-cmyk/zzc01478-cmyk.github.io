import { pageMeta } from "@/lib/site";
import { PrintButton } from "@/components/Interactions";
import { MobileActionBar } from "@/components/MobileActionBar";

export const metadata = pageMeta({
  title: "关于抽纸盒｜陈志鸿的经历",
  description: "抽纸盒（陈志鸿）：用 AI 做视频的编导。数字媒体艺术本科，做过影视后期、品牌拍剪和电商信息流素材编导，这里有完整经历与能力。",
  path: "/about/",
  ogDescription: "用 AI 做视频的编导，以及之前的影像与电商素材经历。",
});

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="spread">
          <div className="hero-copy" data-reveal>
            <p className="kicker">关于</p>
            <h1 className="page-title"><span className="nobr">抽纸盒，</span><span className="nobr">本名陈志鸿。</span></h1>
            <p className="lead">数字媒体艺术本科。做过影视后期包装、品牌拍摄剪辑和电商信息流素材编导，现在用 AI 做视频。编导经验让我在生成之前先把镜头顺序、台词和节奏想清楚。</p>
            <div className="actions" aria-label="关于页行动">
              <a className="btn primary" href="https://www.douyin.com/user/MS4wLjABAAAAgzfVM9AGNSNbj_sEUfEDqoAVv53iQ90McrxvDUUGi2w" rel="noopener">关注抖音</a>
              <a className="btn" href="#experience">看完整经历</a>
            </div>
          </div>
          <figure className="image-panel" data-reveal>
            <img src="/assets/materials/profile-portrait.jpg" alt="陈志鸿的个人照片" width="1080" height="1440" decoding="async" />
            <figcaption>陈志鸿，也叫抽纸盒。</figcaption>
          </figure>
        </div>
      </section>

      <section className="section" id="experience" tabIndex={-1} aria-labelledby="experience-title">
        <div className="wrap experience-grid">
          <div className="section-head" data-reveal>
            <h2 className="section-title" id="experience-title">经历与教育</h2>
            <p className="lead">从影像后期、品牌短视频拍剪，到信息流素材执行与内容复盘。</p>
            <div className="actions" aria-label="经历操作">
              <PrintButton />
            </div>
          </div>
          <div className="timeline" aria-label="经历与教育">
            <article className="timeline-item" data-reveal>
              <time dateTime="2026-03">2026.03-2026.06</time>
              <div>
                <h3>巨蛋传媒：摄影师（短视频运营职责）</h3>
                <p>协同账号内容分配，执行拍摄、剪辑、发布与复盘；用飞书多维表格管理拍摄排期、内容库与素材流转。</p>
                <p>用 AI 工具辅助拆解参考视频，根据点击率及 3 秒、5 秒完播数据定位问题，针对开头冲突与信息节奏做下一轮分镜迭代。</p>
              </div>
            </article>
            <article className="timeline-item" data-reveal>
              <time dateTime="2025-11">2025.11-2026.02</time>
              <div><h3>青叶网络科技有限公司：剪辑 / 信息流素材执行</h3><p>参与 NV 固色 0-1 起号项目，围绕卖点、用户痛点和竞品素材制定内容方向。搭建内容库、素材库及审片流程，沉淀分镜脚本框架与投放复盘记录。</p></div>
            </article>
            <article className="timeline-item" data-reveal>
              <time dateTime="2024-12">2024.12-2025.10</time>
              <div><h3>KNKW 品牌：短视频剪辑与拍摄</h3><p>参与账号精剪与信息流视频制作，涵盖穿搭展示、微剧情与口播。用 Sony FX3 拍摄室内外内容，拆解对标素材的开头与卖点逻辑，制作二创及多版本素材。</p></div>
            </article>
            <article className="timeline-item" data-reveal>
              <time dateTime="2024-06">2024.06-2024.12</time>
              <div><h3>广西师范大学出版社：影视编辑</h3><p>拍摄宣传片和网课等长视频内容，完成剪辑、调色与包装，积累从现场拍摄到成片交付的制作经验。</p></div>
            </article>
            <article className="timeline-item" data-reveal>
              <time dateTime="2023-09">2023.09-2023.12</time>
              <div><h3>湖南卫视后期包装工作室：后期助理（实习）</h3><p>参与节目拍摄与纪录片先导宣传片制作，承担素材整理、粗剪与现场协同，打下影像后期与团队协作的基础。</p></div>
            </article>
            <article className="timeline-item" data-reveal>
              <time dateTime="2020-09">2020.09-2024.06</time>
              <div><h3>汉江师范学院：数字媒体艺术本科</h3><p>系统学习视听语言、数字影像与视觉传达，为后续的素材编导、分镜设计与视听把控打下专业基础。</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ability-title">
        <div className="wrap resume-grid">
          <div className="resume-hero-copy" data-reveal>
            <h2 className="section-title" id="ability-title">能力</h2>
            <div className="role-strip" aria-label="做过的岗位方向">
              <span>信息流素材编导</span>
              <span>广告素材策划</span>
              <span>千川素材编导</span>
            </div>
            <div className="capability-list">
              <div>
                <h3>AI 拆解与策略</h3>
                <p>参考视频对标拆解、用户痛点挖掘、多视角脚本、镜头时序规划。</p>
              </div>
              <div>
                <h3>拍剪落地</h3>
                <p>分镜脚本设计、现场拍摄调度、节奏剪辑与素材排期协同。</p>
              </div>
              <div>
                <h3>数据驱动迭代</h3>
                <p>完播率与点击率分析、互动时序复盘、多版本素材测试。</p>
              </div>
            </div>
            <div className="tag-row" aria-label="能力关键词">
              <span className="tag">AI 对标拆解</span><span className="tag">卖点挖掘</span><span className="tag">脚本分镜</span><span className="tag">拍剪落地</span><span className="tag">视角矩阵</span><span className="tag">数据复盘</span><span className="tag">飞书多维表格</span><span className="tag">Sony FX3</span>
            </div>
          </div>
          <div className="resume-note" role="note" data-reveal>
            <strong>详细材料</strong>
            <p>欢迎沟通成片、分镜脚本与复盘记录；具体材料按授权范围提供，内部数据与未脱敏素材不公开。</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="focus-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <h2 className="section-title" id="focus-title">我正在把这些问题拆细。</h2>
          </div>
          <ol className="focus-list" data-reveal>
            <li><h3>AI 拆解提效</h3><p>怎样用 AI 更快地拆清参考视频的结构，批量生成开头方案和多视角分镜，再由人工筛选。</p></li>
            <li><h3>前 3 秒留存</h3><p>怎样在第一镜用直接的冲突和强相关的画面，留住真正的目标用户。</p></li>
            <li><h3>数据驱动迭代</h3><p>怎样把完播率、点击率的反馈，快速变成下一轮的补拍与重剪清单。</p></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap page-next-step" data-reveal>
          <div><h2>合作、授权或交流，发邮件最快。</h2><p>写清楚想合作的内容或想聊的问题，我会尽快回复。</p></div>
          <a className="btn primary" href="/contact/">写邮件</a>
        </div>
      </section>
      <MobileActionBar />
    </>
  );
}
