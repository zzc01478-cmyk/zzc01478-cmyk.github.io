import { notFound } from "next/navigation";
import { FollowBand } from "@/components/FollowBand";
import { HoverExpand } from "@/components/HoverExpand";
import { MobileActionBar } from "@/components/MobileActionBar";
import { MotionProvider } from "@/components/MotionProvider";
import { NoteSections } from "@/components/NoteSections";
import { PlayPreview } from "@/components/PlayPreview";
import { pageMeta } from "@/lib/site";
import { cardData, columns, getWork, videoWorks } from "@/lib/works";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return videoWorks.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props) {
  const work = getWork((await params).slug)!;
  return pageMeta({
    title: `${work.title}｜抽纸盒`,
    description: work.summary,
    path: work.url,
    ogType: "video.other",
    image: work.poster,
    video: work.video,
  });
}

export default async function WorkPage({ params }: Props) {
  const work = getWork((await params).slug);
  if (!work) notFound();
  const column = columns.find((c) => c.anchor === work.anchor)!;
  const others = column.works.filter((w) => w.slug !== work.slug).slice(0, 4).map(cardData);

  return (
    <MotionProvider>
      <article className="section work-detail">
        <div className="wrap">
          <nav className="crumbs" aria-label="位置"><a href="/works/">作品</a><span aria-hidden="true">/</span><a href={`/works/#${work.anchor}`}>{work.column}</a></nav>
          <header className="work-head">
            <h1 className="page-title">{work.title}</h1>
            <p className="lead">{work.summary}</p>
          </header>
          <div className="screen work-screen" style={{ "--ratio": `${work.width} / ${work.height}` } as React.CSSProperties}>
            <PlayPreview work={cardData(work)} priority notesLink={false} />
          </div>
          <div className="work-facts">
            <ul className="tag-list" aria-label="模型与工具">{[work.model, ...(work.tags ?? [])].map((t) => <li key={t}>{t}</li>)}</ul>
            <span className="fine-print">{work.date} · {work.ownership}</span>
            {work.origin && <a className="inline-link" href={work.origin.url} rel="noopener">{work.origin.label}</a>}
          </div>
          <div className="work-notes">
            <h2 className="section-title">制作笔记</h2>
            <NoteSections notes={work.notes ?? []} />
          </div>
          {others.length > 0 && (
            <section className="more-works">
              <h2>{work.column}里的其他作品</h2>
              <HoverExpand works={others} />
            </section>
          )}
          <FollowBand />
        </div>
      </article>
      <MobileActionBar />
    </MotionProvider>
  );
}
