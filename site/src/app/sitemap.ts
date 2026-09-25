import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { videoWorks } from "@/lib/works";

export const dynamic = "force-static";

const PAGES = ["/", "/works/", "/works/nv-guse/", "/works/sucai-fangfa/", "/about/", "/contact/", "/privacy/", "/terms/"];
const UPDATED = "2026-09-25";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES.map((path) => ({ url: `${SITE}${path}`, lastModified: UPDATED })),
    ...videoWorks.map((w) => ({ url: `${SITE}${w.url}`, lastModified: w.date })),
  ];
}
