#!/usr/bin/env python3
"""Build the 抽纸盒 works archive from content/works/<slug>/note.md.

    python3 scripts/build_works.py           # transcode media and write pages
    python3 scripts/build_works.py --check   # validate notes only, write nothing
    python3 scripts/build_works.py --root D  # build another site root (tests)

Standard library only; media work shells out to the local ffmpeg/ffprobe.
Generated regions in index.html, works/index.html and sitemap.xml sit between
<!-- works:NAME:start --> and <!-- works:NAME:end --> markers. The same data is also
written to site/src/data/works.json for the Next.js site in site/.
"""

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

SITE = "https://chenzhihong.online"
ASSET_VERSION = "20260925-archive"
OWNERSHIP = {
    "个人作品": "个人作品",
    "公司项目（已公开）": "公司项目，已公开发布",
    "公司项目（已授权）": "公司项目，已获授权公开",
}
# The wall has two columns: every AI work, then the e-commerce cases. The model is shown as a tag.
AI_COLUMN = ("AI 视频", "ai")
CASE_COLUMN = ("电商案例", "cases")
SECTIONS = ["工具", "提示词", "步骤", "踩过的坑"]
PLATFORMS = [
    ("抖音", "https://www.douyin.com/user/MS4wLjABAAAAgzfVM9AGNSNbj_sEUfEDqoAVv53iQ90McrxvDUUGi2w", "抖音号 MG2617"),
    ("小红书", "https://www.xiaohongshu.com/user/profile/6264b7d000000000100092cd", "抽纸盒"),
    ("X", "https://x.com/zzchen275198", "@zzchen275198"),
]
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".webm"}


class NoteError(ValueError):
    pass


@dataclass
class Work:
    slug: str
    folder: Path
    meta: dict
    sections: dict = field(default_factory=dict)
    width: int = 0
    height: int = 0

    @property
    def is_case(self):
        return self.meta.get("类型") == "案例"

    @property
    def title(self):
        return self.meta["标题"]

    @property
    def url(self):
        return self.meta["页面"] if self.is_case else f"/works/{self.slug}/"

    @property
    def poster(self):
        return self.meta.get("封面", "") if self.is_case else f"/media/works/{self.slug}/poster.jpg"

    @property
    def poster_small(self):
        return self.meta.get("封面", "") if self.is_case else f"/media/works/{self.slug}/poster-sm.jpg"

    @property
    def tags(self):
        return [t.strip() for t in re.split(r"[,，、]", self.meta.get("标签", "")) if t.strip()]


# ---------- Parsing ----------

def parse_note(path):
    meta, sections, current = {}, {}, None
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.rstrip()
        heading = re.match(r"^##\s+(.+)$", line)
        if heading:
            current = heading.group(1).strip()
            sections[current] = []
            continue
        if current is None:
            if not line.strip():
                continue
            pair = re.match(r"^([^:：]+)[:：]\s*(.*)$", line)
            if not pair:
                raise NoteError(f"{path}:{number}: expected 'key: value', got {line!r}")
            meta[pair.group(1).strip()] = pair.group(2).strip()
        else:
            sections[current].append(raw)
    return meta, {k: "\n".join(v).strip() for k, v in sections.items()}


def load_work(folder):
    slug = folder.name
    if not SLUG.match(slug):
        raise NoteError(f"{folder}: folder name must be lowercase letters, digits and hyphens")
    note = folder / "note.md"
    if not note.exists():
        raise NoteError(f"{folder}: missing note.md")
    meta, sections = parse_note(note)
    work = Work(slug, folder, meta, sections)
    required = ["标题", "日期", "简介"] + (["页面"] if work.is_case else ["模型", "视频", "归属"])
    missing = [key for key in required if not meta.get(key)]
    if missing:
        raise NoteError(f"{note}: missing {', '.join(missing)}")
    # Case entries may use a month (2026-02) so no day is invented; works need the exact date.
    date_pattern = r"^\d{4}-\d{2}(-\d{2})?$" if work.is_case else r"^\d{4}-\d{2}-\d{2}$"
    if not re.match(date_pattern, meta["日期"]):
        raise NoteError(f"{note}: 日期 must look like 2026-09-25" + (" or 2026-02" if work.is_case else ""))
    if work.is_case:
        return work
    if meta["归属"] not in OWNERSHIP:
        raise NoteError(f"{note}: 归属 must be one of {', '.join(OWNERSHIP)}")
    video = folder / meta["视频"]
    if video.suffix.lower() not in VIDEO_EXTS or not video.is_file():
        raise NoteError(f"{note}: 视频 {meta['视频']} is not a video file in the work folder")
    if meta.get("封面") and not (folder / meta["封面"]).is_file():
        raise NoteError(f"{note}: 封面 {meta['封面']} not found")
    unknown = [name for name in sections if name not in SECTIONS]
    if unknown:
        raise NoteError(f"{note}: unknown section(s) {', '.join(unknown)}; use {', '.join(SECTIONS)}")
    return work


def load_works(root):
    base = root / "content" / "works"
    works = [load_work(folder) for folder in sorted(base.iterdir()) if folder.is_dir()] if base.exists() else []
    return sorted(works, key=lambda w: (w.meta["日期"], w.slug), reverse=True)


def columns(works):
    order = []
    for (name, key), items in ((AI_COLUMN, [w for w in works if not w.is_case]),
                               (CASE_COLUMN, [w for w in works if w.is_case])):
        if items:
            order.append((name, key, items))
    return order


# ---------- Media ----------

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(json.loads(out).get("format", {}).get("duration") or 0)


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    streams = json.loads(out).get("streams", [])
    video = next(s for s in streams if s.get("codec_type") == "video")
    return video["width"], video["height"], any(s.get("codec_type") == "audio" for s in streams)


def build_media(work, root):
    out = root / "media" / "works" / work.slug
    out.mkdir(parents=True, exist_ok=True)
    source = work.folder / work.meta["视频"]
    note = work.folder / "note.md"
    video = out / "video.mp4"
    if not video.exists() or video.stat().st_mtime < max(source.stat().st_mtime, note.stat().st_mtime):
        _, _, has_audio = probe(source)
        # Long side at most 1920 (1080p), never upscaled; H.264 + faststart for progressive playback.
        scale = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'"
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(source), "-vf", scale,
               "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p",
               "-profile:v", "high", "-movflags", "+faststart"]
        cmd += ["-c:a", "aac", "-b:a", "128k"] if has_audio else ["-an"]
        subprocess.run(cmd + [str(video)], check=True)
    poster = out / "poster.jpg"
    if not poster.exists() or poster.stat().st_mtime < video.stat().st_mtime:
        if work.meta.get("封面"):
            first = ["-i", str(work.folder / work.meta["封面"])]
        else:
            # Never seek past the end: short clips take their cover from the middle.
            at = min(float(work.meta.get("封面秒", "1")), duration(video) / 2)
            first = ["-ss", f"{at:.2f}", "-i", str(video)]
        subprocess.run(["ffmpeg", "-v", "error", "-y", *first, "-frames:v", "1",
                        "-vf", "scale='min(1080,iw)':-2", "-q:v", "3", str(poster)], check=True)
        if not poster.exists():
            raise NoteError(f"{work.folder / 'note.md'}: could not extract a cover frame; set 封面秒 or 封面")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(poster),
                        "-vf", "scale=480:-2", "-q:v", "4", str(out / "poster-sm.jpg")], check=True)
    work.width, work.height, _ = probe(video)


def case_size(work, root):
    if not work.poster:
        return
    image = root / work.poster.lstrip("/")
    if not image.is_file():
        raise NoteError(f"{work.folder / 'note.md'}: 封面 {work.poster} not found in the site")
    work.width, work.height, _ = probe(image)


# ---------- HTML ----------

def e(text):
    return html.escape(str(text), quote=True)


def inline(text):
    escaped = e(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    return re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" rel="noopener">\1</a>', escaped)


def section_blocks(text):
    """Tiny Markdown subset: paragraphs, - lists, 1. lists and ``` fences (prompts).

    Paragraph and list-item text is returned as escaped inline HTML; prompts stay plain text."""
    blocks, lines, i = [], text.splitlines(), 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            body, i = [], i + 1
            while i < len(lines) and not lines[i].startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            blocks.append({"type": "prompt", "text": "\n".join(body)})
            continue
        for pattern, tag in ((r"^[-*]\s+", "ul"), (r"^\d+[.、]\s*", "ol")):
            if re.match(pattern, line):
                items = []
                while i < len(lines) and re.match(pattern, lines[i]):
                    items.append(inline(re.sub(pattern, "", lines[i])))
                    i += 1
                blocks.append({"type": tag, "items": items})
                break
        else:
            para = []
            while i < len(lines) and lines[i].strip() and not re.match(r"^([-*]\s|\d+[.、]|```)", lines[i]):
                para.append(lines[i].strip())
                i += 1
            blocks.append({"type": "p", "html": inline("".join(para))})
    return blocks


def render_section(name, text):
    parts = []
    for block in section_blocks(text):
        if block["type"] == "prompt":
            parts.append('<div class="prompt-block"><pre><code>' + e(block["text"]) + "</code></pre>"
                         '<button type="button" class="copy-btn" data-copy>复制</button></div>')
        elif block["type"] == "p":
            parts.append(f'<p>{block["html"]}</p>')
        else:
            items = "".join(f"<li>{item}</li>" for item in block["items"])
            parts.append(f'<{block["type"]}>{items}</{block["type"]}>')
    return f'<section class="note-section"><h2>{e(name)}</h2>{"".join(parts)}</section>'


def head(title, description, canonical, image, extra=""):
    return f"""<!doctype html>
<!-- generated by build_works.py -->
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{e(description)}">
  <title>{e(title)}</title>
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:type" content="{'video.other' if extra else 'website'}">
  <meta property="og:url" content="{SITE}{canonical}">
  <meta property="og:site_name" content="抽纸盒">
  <meta property="og:image" content="{SITE}{image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{e(title)}">
  <meta name="twitter:description" content="{e(description)}">
  <meta name="twitter:image" content="{SITE}{image}">
  <meta name="theme-color" content="#f5f4ed">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg?v=20260913-r1">
  <link rel="canonical" href="{SITE}{canonical}">
  <link rel="stylesheet" href="/assets/site-system.css?v={ASSET_VERSION}">{extra}
</head>"""


HEADER = """<body data-public-site data-mobile-cta>
  <a class="skip-link" href="#main">跳到内容</a>
  <div class="site-shell">
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="/" aria-label="抽纸盒首页"><strong>抽纸盒</strong><span>用 AI 做视频的编导</span></a>
        <nav class="nav-links" aria-label="主导航">
          <a href="/">首页</a>
          <a href="/works/" aria-current="page">作品</a>
          <a href="/about/">关于</a>
        </nav>
      </div>
    </header>"""

FOOTER = f"""    <footer class="site-footer">
      <div class="wrap">
        <span>© 2026 抽纸盒</span>
        <nav class="footer-links" aria-label="页脚导航"><a href="/contact/">联系</a><a href="/privacy/">隐私</a><a href="/terms/">条款</a><a href="https://chenzhihong.online/tools/">工具箱</a></nav>
      </div>
    </footer>
  </div>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{{"token":"9b12d2665a774752a3eed790460ace35"}}'></script>
  <script src="/assets/site-motion.js?v={ASSET_VERSION}" defer></script>
</body>
</html>
"""


def follow_band():
    buttons = "".join(
        f'<a class="btn{" primary" if i == 0 else ""}" href="{url}" rel="noopener">关注{e(name)}</a>'
        for i, (name, url, _) in enumerate(PLATFORMS)
    )
    ids = " / ".join(f"{e(name)}：{e(handle)}" for name, _, handle in PLATFORMS)
    return (f'<div class="follow-band"><div><h2>更多作品在平台更新</h2><p class="fine-print">{ids}</p></div>'
            f'<div class="actions">{buttons}</div></div>')


def origin_label(url):
    for key, name in (("douyin.com", "抖音"), ("x.com", "X"), ("twitter.com", "X"), ("xiaohongshu.com", "小红书"), ("xhslink.com", "小红书")):
        if key in url:
            return f"在{name}看原帖"
    return "看原帖"


def card(work, heading="h3"):
    kind = " is-case" if work.is_case else ""
    label = CASE_COLUMN[0] if work.is_case else work.meta["模型"]
    size = f' width="{work.width}" height="{work.height}"' if work.width else ""
    thumb = (f'<span class="work-thumb"><img src="{work.poster_small}" alt=""{size} loading="lazy" decoding="async"></span>'
             if work.poster_small else
             f'<span class="work-thumb is-text"><small>{e(CASE_COLUMN[0])}</small>{e(work.meta["简介"])}</span>')
    return (f'<a class="work-card{kind}" href="{work.url}">{thumb}'
            f'<{heading} class="work-title">{e(work.title)}</{heading}>'
            f'<span class="work-meta">{e(label)} · {e(work.meta["日期"])}</span></a>')


def detail_page(work, column, neighbours):
    meta = work.meta
    desc = meta["简介"]
    tags = "".join(f'<li>{e(tag)}</li>' for tag in [meta["模型"], *work.tags])
    origin = (f'<a class="inline-link" href="{e(meta["原帖"])}" rel="noopener">{origin_label(meta["原帖"])}</a>'
              if meta.get("原帖") else "")
    notes = "".join(render_section(name, work.sections[name]) for name in SECTIONS if work.sections.get(name))
    if not notes:
        notes = '<p class="fine-print">制作笔记整理中。</p>'
    more = "".join(card(w) for w in neighbours)
    more_block = f'<section class="more-works"><h2>{e(column)}里的其他作品</h2><div class="work-wall">{more}</div></section>' if more else ""
    ratio = f' style="--ratio: {work.width} / {work.height}"' if work.width else ""
    return (head(f"{work.title}｜抽纸盒", desc, work.url, work.poster,
                 extra=f'\n  <meta property="og:video" content="{SITE}/media/works/{work.slug}/video.mp4">')
            + "\n" + HEADER + f"""
    <main id="main" tabindex="-1">
      <article class="section work-detail">
        <div class="wrap">
          <nav class="crumbs" aria-label="位置"><a href="/works/">作品</a><span aria-hidden="true">/</span><a href="/works/#{column_anchor(column)}">{e(column)}</a></nav>
          <header class="work-head">
            <h1 class="page-title">{e(work.title)}</h1>
            <p class="lead">{e(desc)}</p>
          </header>
          <div class="screen work-screen"{ratio}>
            <video controls playsinline preload="none" poster="{work.poster}"{f' width="{work.width}" height="{work.height}"' if work.width else ""}>
              <source src="/media/works/{work.slug}/video.mp4" type="video/mp4">
              你的浏览器无法播放这个视频，<a href="/media/works/{work.slug}/video.mp4">可以直接下载</a>。
            </video>
          </div>
          <div class="work-facts">
            <ul class="tag-list" aria-label="模型与工具">{tags}</ul>
            <span class="fine-print">{e(meta["日期"])} · {e(OWNERSHIP[meta["归属"]])}</span>
            {origin}
          </div>
          <div class="work-notes">
            <h2 class="section-title">制作笔记</h2>
            {notes}
          </div>
          {more_block}
          {follow_band()}
        </div>
      </article>
    </main>
""" + FOOTER)


def column_anchor(name):
    return CASE_COLUMN[1] if name == CASE_COLUMN[0] else AI_COLUMN[1]


def wall_block(cols):
    # Anchors: #ai for AI works, #cases for the e-commerce cases.
    sections = "".join(
        f'<section class="wall-column" id="{key}" tabindex="-1" aria-labelledby="{key}-title">'
        f'<h2 class="wall-title" id="{key}-title">{e(name)}<span>{len(items)} 件</span></h2>'
        f'<div class="work-wall">{"".join(card(w) for w in items)}</div></section>'
        for name, key, items in cols
    )
    return sections if cols else '<p class="fine-print">作品整理中，先去平台看看最新内容。</p>'


def featured_block(works):
    """Home reel: the featured work large (plays inline on click), the next two newest as side posters."""
    candidates = [w for w in works if not w.is_case]
    if not candidates:
        return '<p class="fine-print">主打作品整理中。</p>'
    main = next((w for w in candidates if w.meta.get("主打") == "是"), candidates[0])
    sides = [w for w in candidates if w is not main][:2]
    size = f' width="{main.width}" height="{main.height}"' if main.width else ""
    side_html = "".join(
        f'<a class="reel-side" href="{w.url}" aria-label="{e(w.title)}">'
        f'<img src="{w.poster_small}" alt="" loading="lazy" decoding="async"></a>'
        for w in sides
    )
    return (f'<div class="hero-reel{" has-sides" if sides else ""}" data-reveal>{side_html}'
            f'<figure class="reel-main">'
            f'<div class="reel-screen">'
            f'<video controls playsinline preload="none" poster="{main.poster}"{size} hidden>'
            f'<source src="/media/works/{main.slug}/video.mp4" type="video/mp4"></video>'
            f'<button type="button" class="reel-play" data-play aria-label="播放《{e(main.title)}》">'
            f'<img src="{main.poster}" alt=""{size} decoding="async" fetchpriority="high">'
            f'<span class="play-icon" aria-hidden="true"></span></button></div>'
            f'<figcaption><a href="{main.url}">{e(main.title)}</a><span>看制作笔记</span></figcaption>'
            f'</figure></div>')


def latest_block(works, count=8):
    items = [w for w in works if not w.is_case][:count]
    return f'<div class="work-wall">{"".join(card(w) for w in items)}</div>' if items else \
        '<p class="fine-print">作品整理中。</p>'


def sitemap_block(works):
    return "".join(
        f'\n  <url><loc>{SITE}/works/{w.slug}/</loc><lastmod>{w.meta["日期"]}</lastmod></url>'
        for w in works if not w.is_case
    ) + "\n  "


def replace_block(path, name, content):
    text = path.read_text(encoding="utf-8")
    start, end = f"<!-- works:{name}:start -->", f"<!-- works:{name}:end -->"
    if text.count(start) != 1 or text.count(end) != 1:
        raise NoteError(f"{path}: expected one {start} … {end} pair")
    before, rest = text.split(start)
    _, after = rest.split(end)
    path.write_text(before + start + content + end + after, encoding="utf-8")


def site_data(works, cols):
    """Everything the Next.js site (site/) needs, so it never re-parses note.md itself."""
    column_of = {w.slug: name for name, _, items in cols for w in items}

    def entry(w):
        item = {
            "slug": w.slug, "title": w.title, "date": w.meta["日期"], "summary": w.meta["简介"],
            "url": w.url, "isCase": w.is_case, "poster": w.poster, "posterSmall": w.poster_small,
            "width": w.width, "height": w.height,
            "column": column_of[w.slug], "anchor": column_anchor(column_of[w.slug]),
        }
        if not w.is_case:
            item.update({
                "model": w.meta["模型"], "tags": w.tags, "video": f"/media/works/{w.slug}/video.mp4",
                "ownership": OWNERSHIP[w.meta["归属"]], "featured": w.meta.get("主打") == "是",
                "origin": {"url": w.meta["原帖"], "label": origin_label(w.meta["原帖"])} if w.meta.get("原帖") else None,
                "notes": [{"name": name, "blocks": section_blocks(w.sections[name])}
                          for name in SECTIONS if w.sections.get(name)],
            })
        return item

    return {
        "columns": [{"name": name, "anchor": key, "slugs": [w.slug for w in items]} for name, key, items in cols],
        "works": [entry(w) for w in works],
    }


# ---------- Main ----------

def build(root, check_only=False):
    works = load_works(root)
    if check_only:
        return works
    for work in works:
        if work.is_case:
            case_size(work, root)
        else:
            build_media(work, root)
    cols = columns(works)
    column_of = {w.slug: name for name, _, items in cols for w in items}
    generated = set()
    for name, _, items in cols:
        for index, work in enumerate(items):
            if work.is_case:
                continue
            others = [w for w in items if w is not work]
            page = root / "works" / work.slug / "index.html"
            page.parent.mkdir(parents=True, exist_ok=True)
            page.write_text(detail_page(work, column_of[work.slug], others[:4]), encoding="utf-8")
            generated.add(work.slug)
    # Remove pages of works whose folders were deleted; hand-written case pages have no marker and stay.
    for page in (root / "works").glob("*/index.html"):
        if page.parent.name not in generated and "<!-- generated by build_works.py -->" in page.read_text(encoding="utf-8"):
            shutil.rmtree(page.parent)
    replace_block(root / "works" / "index.html", "wall", wall_block(cols))
    replace_block(root / "index.html", "featured", featured_block(works))
    replace_block(root / "index.html", "latest", latest_block(works))
    replace_block(root / "sitemap.xml", "urls", sitemap_block(works))
    data = root / "site" / "src" / "data" / "works.json"
    data.parent.mkdir(parents=True, exist_ok=True)
    data.write_text(json.dumps(site_data(works, cols), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return works


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--check", action="store_true", help="validate notes without writing")
    args = parser.parse_args()
    try:
        works = build(args.root, args.check)
    except (NoteError, subprocess.CalledProcessError) as error:
        print(f"build_works: {error}", file=sys.stderr)
        return 1
    real = [w for w in works if not w.is_case]
    print(f"{'checked' if args.check else 'built'} {len(real)} works and {len(works) - len(real)} case entries")
    return 0


if __name__ == "__main__":
    sys.exit(main())
