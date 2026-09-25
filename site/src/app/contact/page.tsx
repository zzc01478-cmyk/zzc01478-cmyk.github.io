import { ContactForm } from "@/components/ContactForm";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "联系抽纸盒｜合作与授权",
  description: "联系抽纸盒（陈志鸿）：商务合作、作品授权，或交流 AI 视频的做法。",
  ogDescription: "商务合作、作品授权或交流，整理成一封可直接发送的邮件草稿。",
  path: "/contact/",
});

export default function Page() {
  return (
    <>
      <section className="hero">
        <div className="wrap page-hero-copy">
          <p className="kicker">联系</p>
          <h1 className="page-title">先把问题说清楚。</h1>
          <p className="lead">商务合作、作品授权，或者想交流 AI 视频的做法，都可以写信来。</p>
          <div className="actions" aria-label="联系页行动"><a className="btn primary" href="#contact-form">整理沟通信息</a><a className="btn" href="mailto:2589798905@qq.com">直接发邮件</a></div>
        </div>
      </section>
      <section className="section">
        <div className="wrap contact-grid">
          <ContactForm />
          <aside className="contact-details" aria-label="公开联系方式">
            <div>
              <p className="small-label">公开联系地址</p>
              <address><a href="mailto:2589798905@qq.com">2589798905@qq.com</a></address>
              <p>这是当前网站公开且可核验的联系渠道。出于隐私与安全考虑，本站不公开家庭或街道地址。</p>
            </div>
            <div>
              <p className="small-label">沟通效率</p>
              <p>合作请写明品牌或产品、想要的内容形式和时间；授权请附上作品链接和使用范围。</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
