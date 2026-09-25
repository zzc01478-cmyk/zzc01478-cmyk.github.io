import data from "@/data/works.json";

// Written by scripts/build_works.py from content/works/<slug>/note.md. Do not edit the JSON by hand.

export type Block =
  | { type: "p"; html: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "prompt"; text: string };

export type Work = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  url: string;
  isCase: boolean;
  poster: string;
  posterSmall: string;
  width: number;
  height: number;
  column: string;
  anchor: string;
  model?: string;
  tags?: string[];
  video?: string;
  ownership?: string;
  featured?: boolean;
  origin?: { url: string; label: string } | null;
  notes?: { name: string; blocks: Block[] }[];
};

/** What cards, strips and the home reel need: no notes, so client props stay small. */
export type WorkCardData = Pick<Work, "slug" | "title" | "date" | "url" | "poster" | "posterSmall" | "width" | "height" | "model" | "video">;

export function cardData(w: Work): WorkCardData {
  return { slug: w.slug, title: w.title, date: w.date, url: w.url, poster: w.poster, posterSmall: w.posterSmall, width: w.width, height: w.height, model: w.model, video: w.video };
}

export type Column = { name: string; anchor: string; works: Work[] };

const works = data.works as Work[];
const bySlug = new Map(works.map((w) => [w.slug, w]));

export const columns: Column[] = data.columns.map((c) => ({
  name: c.name,
  anchor: c.anchor,
  works: c.slugs.map((s) => bySlug.get(s)!),
}));

/** AI works only, newest first. */
export const videoWorks = works.filter((w) => !w.isCase);

export function getWork(slug: string) {
  const work = bySlug.get(slug);
  return work && !work.isCase ? work : undefined;
}

export function featuredWork() {
  return videoWorks.find((w) => w.featured) ?? videoWorks[0];
}
