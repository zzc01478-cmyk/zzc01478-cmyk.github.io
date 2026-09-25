# 抽纸盒 IP Content Archive

## Decision Record

On 2026-09-25 the owner changed the site's job from job-seeking to a personal IP. All decisions below came from a structured interview with the owner on that date. This spec supersedes the positioning and page structure of `2026-09-24-magazine-layout-redesign.md`. The Kami visual system from that spec stays.

| Topic | Decision |
| --- | --- |
| Goal | Personal IP, not job-seeking |
| Audience | People who make content with AI |
| Platforms | Douyin (primary button), Xiaohongshu, X. The site archives; platforms distribute. |
| Name | 抽纸盒 leads; the real name 陈志鸿 appears on the about page |
| One-liner | 用 AI 做视频的编导 |
| Language | Chinese only; model names and prompts stay in their original language |
| Navigation | 首页 / 作品 / 关于. The toolbox link moves to the footer. No public tools section for now. |
| Resume | Merged into the about page; `/resume/` returns 301 to `/about/#experience` |
| Methods | The five e-commerce cases and the methods page merge into two case pages: NV 固色, and 素材编导方法. `/methods/` returns 301 to the method page. |
| Works grouping | Two columns: AI 视频 (every AI work) and 电商案例. The generating model and other tools are tags on each work. (The owner first chose per-model columns, then simplified to one AI column on 2026-09-25 and dropped Veo.) |
| Work page | Every work gets its own page with the full video and a production note in four parts: 工具, 提示词, 步骤, 踩过的坑. |
| Tutorials | No separate tutorial section at launch; notes grow into tutorials later. |
| Ownership | Personal works publish directly. Company or client works publish only if already public or approved, and never with backend data. |
| Video | Full video on the site, 1080p H.264, hosted on the current Singapore server. The owner chose this despite slow mainland downloads (measured about 64 KB/s from the owner's network on 2026-09-25). |
| Visual | Kami paper stays. Video walls and players first sat in dark screening frames; later on 2026-09-25 the owner found the dark border jarring, so posters and video now sit straight on the paper. |
| Home | First screen: name, one-liner, one featured work (poster; the video loads only on click), then platform buttons. Below: latest works wall, a short about section, contact. |
| Home (revised) | Later on 2026-09-25 the owner asked for the first screen to introduce the person, not a video, because video is only part of what they do: name, background, roles, platform buttons and the portrait. The latest works move into a carousel below; the separate about section merges into the first screen. |
| Primary action | Follow on a platform. Secondary: email for 商务合作 / 作品授权 / 交流. The contact form keeps its local mail-draft behavior with the new topics. |
| Publishing | One folder per work plus one command. The generator uses only the Python standard library plus local ffmpeg. |
| First batch | The owner picked 7 company works, all already published: 057, 093, 095, 098, 193, 194, 218. The agent drafts notes from the owner's project files (prompts, storyboards, generation records); the owner reviews before launch. |
| Old links | nginx 301 for `/resume/` and `/methods/`. Old `/works/#anchor` links are redirected by a script on the works wall. |
| Front end | Later on 2026-09-25 the owner chose to rewrite the public site in React (Next.js static export in `site/`) and reuse Skiper UI free components: an inverted-perspective carousel (skiper49, Swiper coverflow tilted 40°, free drag and trackpad swipe that settles on a poster, no autoplay) for the home latest works; a perspective text crawl (skiper28, without its Lenis smooth scrolling; flat under reduced motion and print) for the home closing contact block; hover-expand poster strip (skiper52) for each work page's other works; skiper67 for all playback (a poster with a cursor-following 播放 label that opens a popover media-chrome player; the poster stays still because pages never auto-load video); and scroll fade (skiper87 edge fade on prompts; reveal stays CSS-first so print and no-JS keep all text). Kami stays the visual system: `site/` imports `assets/site-system.css`. Skiper's free license requires the footer credit. Not deployed yet; the root pages stay live until the owner approves the cutover. |

## Platform Links

- 抖音: `https://www.douyin.com/user/MS4wLjABAAAAgzfVM9AGNSNbj_sEUfEDqoAVv53iQ90McrxvDUUGi2w` (抖音号 MG2617). This was resolved from the owner's logged-in `/user/self` page; the `/user/self` URL only works for the account owner.
- 小红书: `https://www.xiaohongshu.com/user/profile/6264b7d000000000100092cd`
- X: `https://x.com/zzchen275198`

## Content Model

Each work lives in `content/works/<slug>/`:

- `note.md` holds `key: value` metadata lines, then four `##` sections. Required keys: 标题, 模型, 日期, 视频, 归属, 简介. Optional keys: 标签, 封面, 封面秒, 原帖, 主打.
- 归属 must be one of 个人作品, 公司项目（已公开）, 公司项目（已授权）. The generator refuses anything else.
- The source video sits next to `note.md` and is ignored by Git.

`scripts/build_works.py` reads every `note.md` and does four things:

1. Transcodes the video to 1080p H.264 with AAC audio and faststart, and extracts a poster, into `media/works/<slug>/`, which is ignored by Git.
2. Writes `works/<slug>/index.html`.
3. Rewrites the generated blocks in `works/index.html` and `index.html` between `<!-- works:… -->` markers.
4. Rewrites the works entries in `sitemap.xml`.

Case pages (NV 固色, 素材编导方法) are hand-written HTML. They appear on the wall through a `note.md` with `类型: 案例`, and the generator skips building a page for them.

## Verification

Site, asset and browser contracts cover the new structure. A generator contract builds a fixture work into a temporary directory and checks the outputs. Browser QA uses Ego Lite at 320, 390, 768 and 1440 pixels.
