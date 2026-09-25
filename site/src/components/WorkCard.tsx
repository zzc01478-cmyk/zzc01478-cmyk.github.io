import type { Work } from "@/lib/works";

export function WorkCard({ work }: { work: Work }) {
  const label = work.isCase ? "电商案例" : work.model;
  return (
    <a className={work.isCase ? "work-card is-case" : "work-card"} href={work.url}>
      {work.posterSmall ? (
        <span className="work-thumb">
          <img src={work.posterSmall} alt="" width={work.width || undefined} height={work.height || undefined} loading="lazy" decoding="async" />
        </span>
      ) : (
        <span className="work-thumb is-text"><small>电商案例</small>{work.summary}</span>
      )}
      <h3 className="work-title">{work.title}</h3>
      <span className="work-meta">{label} · {work.date}</span>
    </a>
  );
}

export function WorkWall({ works }: { works: Work[] }) {
  return <div className="work-wall">{works.map((w) => <WorkCard key={w.slug} work={w} />)}</div>;
}
