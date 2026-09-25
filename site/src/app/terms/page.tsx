import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "使用条款｜抽纸盒",
  description: "抽纸盒个人网站的使用条款，说明公开作品、内容边界、外部链接和网站可用性。",
  path: "/terms/",
  ogDescription: "使用本站公开内容与工具入口前需要了解的基本边界。",
});

export default function Page() {
  return (
    <>
      <section className="hero"><div className="wrap content-page page-hero-copy"><p className="kicker">使用条款</p><h1 className="page-title"><span className="nobr">公开内容有边界，</span><span className="nobr">判断也需要上下文。</span></h1><p className="lead">生效日期：2026 年 9 月 13 日。访问或使用本站，即表示你理解以下基本规则。</p></div></section>
      <section className="section">
        <div className="wrap content-page">
          <h2>网站用途</h2>
          <p>本站用于展示抽纸盒的 AI 视频作品、制作笔记、电商素材案例和个人经历。公开案例可能经过脱敏与节选，不代表完整项目数据或全部协作过程。</p>
          <h2>内容使用</h2>
          <p>你可以为学习、合作判断和正常分享浏览本站。作品视频与制作笔记未经许可请勿转载或商用；也请勿冒用身份、歪曲案例结论，或将脱敏内容重新关联到未公开主体。</p>
          <h2>数据与结果表述</h2>
          <p>页面中的消耗、互动峰值等信息只用于说明阶段信号和工作方法，不等同于收入、利润、ROI，也不构成对未来结果的承诺。</p>
          <h2>外部链接与工具</h2>
          <p>外部服务和受保护工具由各自系统负责。链接可用性、账号权限和第三方内容可能发生变化。</p>
          <h2>网站可用性</h2>
          <p>本站会尽力保持内容准确与可访问，但可能因维护、网络或服务调整短暂不可用。发现错误可通过公开邮箱联系更正。</p>
          <h2>联系方式</h2>
          <p>条款相关问题请发送邮件至 <a href="mailto:2589798905@qq.com">2589798905@qq.com</a>。</p>
        </div>
      </section>
    </>
  );
}
