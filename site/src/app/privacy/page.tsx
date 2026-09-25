import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "隐私说明｜抽纸盒",
  description: "抽纸盒个人网站的隐私说明，介绍访问日志、本地偏好、邮件联系和第三方分析工具的当前状态。",
  path: "/privacy/",
  ogDescription: "了解本站实际收集什么、不收集什么，以及如何联系网站维护者。",
});

export default function Page() {
  return (
    <>
      <section className="hero"><div className="wrap content-page page-hero-copy"><p className="kicker">隐私说明</p><h1 className="page-title"><span className="nobr">只说明真实发生的</span><span className="nobr">数据处理。</span></h1><p className="lead">生效日期：2026 年 9 月 13 日。本页根据网站当前功能编写；新增分析、广告或在线表单前，应先更新本说明与相应同意机制。</p></div></section>
      <section className="section">
        <div className="wrap content-page">
          <div className="policy-status" aria-label="当前隐私状态">
            <div><span>第三方分析工具</span><strong>Cloudflare Web Analytics 已启用</strong></div>
            <div><span>广告与追踪 Cookie</span><strong>未使用</strong></div>
            <div><span>网页联系表单上传</span><strong>不上传</strong></div>
            <div><span>本地偏好</span><strong>只保存隐私提示关闭状态</strong></div>
          </div>
          <h2>访问网站时</h2>
          <p>本站使用 Cloudflare Web Analytics 统计页面浏览量、访问来源、设备类型和真实页面性能。当前配置不使用广告或分析 Cookie，也不用于识别具体访客。托管服务器仍可能按运维配置生成必要的访问与安全日志，例如访问时间、请求路径、浏览器信息和网络地址，用于保障服务运行和排查异常。</p>
          <h2>联系页面</h2>
          <p>联系页只在当前浏览器中检查输入并生成邮件草稿。姓名、回复邮箱和项目内容不会提交到本站服务器；只有你在邮箱应用中确认发送后，邮件服务商才会处理这些信息。</p>
          <h2>Cookie 与本地存储</h2>
          <p>本站当前不使用广告 Cookie 或第三方分析 Cookie。关闭隐私提示后，浏览器会在本机的 <code>localStorage</code> 中保存一个简单状态，避免重复显示提示。</p>
          <h2>外部服务与链接</h2>
          <p>工具入口、邮箱应用或外部网站拥有各自的隐私规则。进入这些服务前，请查看对应服务的说明。</p>
          <h2>查询与联系</h2>
          <p>对本说明或公开内容有疑问，可以发送邮件至 <a href="mailto:2589798905@qq.com">2589798905@qq.com</a>。</p>
        </div>
      </section>
    </>
  );
}
