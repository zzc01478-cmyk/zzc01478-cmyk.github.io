"use client";

import { useState } from "react";

const MAIL = "2589798905@qq.com";
type Field = "name" | "email" | "topic" | "message";

/** Checks the fields, then opens the visitor's mail app with a draft. Nothing is sent to or stored by the site. */
export function ContactForm() {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const el = form.elements as unknown as Record<Field, HTMLInputElement>;
    const values = {
      name: el.name.value.trim(),
      email: el.email.value.trim(),
      topic: el.topic.value,
      message: el.message.value.trim(),
    };
    const next: Partial<Record<Field, string>> = {};
    if (values.name.length < 2) next.name = "请填写至少 2 个字的称呼。";
    if (!el.email.validity.valid || !values.email) next.email = "请填写可以回复的邮箱地址。";
    if (!values.topic) next.topic = "请选择本次沟通的主题。";
    if (values.message.length < 10) next.message = "请用至少 10 个字说明想合作的内容或想聊的问题。";
    setErrors(next);

    const first = (Object.keys(next) as Field[])[0];
    if (first) {
      setStatus("还有内容需要补充，请检查标记的字段。");
      el[first].focus();
      return;
    }
    const subject = `网站联系｜${values.topic}｜${values.name}`;
    const body = [`称呼：${values.name}`, `回复邮箱：${values.email}`, `沟通主题：${values.topic}`, "", values.message].join("\n");
    setStatus("信息已检查完成，正在打开邮箱应用。邮件仍需由你确认发送，本站不会保存这些内容。");
    setReady(true);
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const field = (id: Field) => ({
    id,
    name: id,
    "aria-describedby": `${id}-error`,
    "aria-invalid": errors[id] ? true : undefined,
    required: true,
  });
  const wrap = (id: Field, wide = false) => ["form-field", wide && "is-wide", errors[id] && "has-error"].filter(Boolean).join(" ");

  return (
    <form className="contact-form" id="contact-form" data-contact-form noValidate onSubmit={onSubmit}>
      <div className="section-head compact">
        <p className="section-num">邮件草稿</p>
        <h2 className="section-title">生成一封完整的沟通邮件。</h2>
        <p>表单内容只在当前浏览器中整理，提交后会打开你的邮箱应用，本站不会接收或保存。</p>
      </div>
      <div className="form-grid">
        <div className={wrap("name")}>
          <label htmlFor="name">你的称呼</label>
          <input {...field("name")} type="text" autoComplete="name" maxLength={60} />
          <p className="field-error" id="name-error">{errors.name}</p>
        </div>
        <div className={wrap("email")}>
          <label htmlFor="email">回复邮箱</label>
          <input {...field("email")} type="email" autoComplete="email" maxLength={160} />
          <p className="field-error" id="email-error">{errors.email}</p>
        </div>
        <div className={wrap("topic", true)}>
          <label htmlFor="topic">沟通主题</label>
          <select {...field("topic")} defaultValue="">
            <option value="">请选择</option>
            <option value="商务合作">商务合作</option>
            <option value="作品授权">作品授权</option>
            <option value="交流">交流</option>
            <option value="其他">其他</option>
          </select>
          <p className="field-error" id="topic-error">{errors.topic}</p>
        </div>
        <div className={wrap("message", true)}>
          <label htmlFor="message">想合作的内容或想聊的问题</label>
          <textarea {...field("message")} maxLength={1200} />
          <p className="field-error" id="message-error">{errors.message}</p>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn primary" type="submit">生成邮件草稿</button>
        <a className="btn" href="/thanks/" data-contact-next hidden={!ready}>邮件发送后查看下一步</a>
      </div>
      <p className="form-status" role="status" aria-live="polite" data-form-status>{status}</p>
    </form>
  );
}
