import type { Metadata } from "next";

export const SITE = "https://chenzhihong.online";
export const DOUYIN = "https://www.douyin.com/user/MS4wLjABAAAAgzfVM9AGNSNbj_sEUfEDqoAVv53iQ90McrxvDUUGi2w";

export const PLATFORMS = [
  { name: "抖音", url: DOUYIN, handle: "抖音号 MG2617" },
  { name: "小红书", url: "https://www.xiaohongshu.com/user/profile/6264b7d000000000100092cd", handle: "抽纸盒" },
  { name: "X", url: "https://x.com/zzchen275198", handle: "@zzchen275198" },
];

const OG_IMAGE = {
  url: `${SITE}/assets/materials/og-portfolio.jpg`,
  width: 1200,
  height: 630,
  alt: "浅色纸面上的素材卡片与分镜布局",
};

type PageMeta = {
  title: string;
  description: string;
  /** Path with trailing slash, e.g. "/works/". Omit for pages without a canonical URL. */
  path?: string;
  ogDescription?: string;
  ogType?: "website" | "article" | "video.other";
  image?: string;
  video?: string;
  noindex?: boolean;
};

/** Same head tags the hand-written pages carried: description, canonical, Open Graph and Twitter card. */
export function pageMeta({ title, description, path, ogDescription, ogType = "website", image, video, noindex }: PageMeta): Metadata {
  const images = image ? [{ url: `${SITE}${image}` }] : [OG_IMAGE];
  const summary = ogDescription ?? description;
  return {
    title: { absolute: title },
    description,
    robots: noindex ? { index: false, follow: true } : undefined,
    alternates: path ? { canonical: `${SITE}${path}` } : undefined,
    openGraph: {
      title,
      description: summary,
      type: ogType === "video.other" ? "video.other" : ogType,
      url: path ? `${SITE}${path}` : undefined,
      siteName: "抽纸盒",
      images,
      videos: video ? [{ url: `${SITE}${video}` }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description: summary, images: images.map((i) => i.url) },
  };
}
