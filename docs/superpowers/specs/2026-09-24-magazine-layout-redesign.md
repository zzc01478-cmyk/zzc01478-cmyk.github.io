# Public Site Magazine Layout Redesign

## Goal

On 2026-09-24 the owner asked for a full re-layout and typographic overhaul of the public pages, keeping the Kami paper style. This spec replaces the layout part of the "preserve mode" constraint in `2026-07-10-personal-website-coco-remediation-design.md`. Routes, navigation labels, protected-tool boundaries and evidence rules are unchanged.

## Visual System

- Kami tokens stay: parchment `#f5f4ed`, ivory `#faf9f5`, warm plate `#e8e6dc`, ink `#141413`, single accent ink blue `#1b365d`. The page is light-only, including under a dark system preference.
- Serif throughout. Latin and numerals use Charter/Georgia; Chinese falls back through TsangerJinKai02, Source Han Serif, Noto Serif and Songti.
- Magazine devices: a 2px ink rule opens each section, 1px warm hairlines separate content, and warm plates hold evidence. No cards inside cards, no shadows except overlays, one 2px corner radius.
- Type scale: 16px body, display name up to 168px, page titles up to 84px (manifesto titles up to 104px), section titles up to 46px. Large headlines use `.nobr` phrase spans so they break between phrases, not inside words.
- `.spread` is a 12-column grid with gutter columns on both sides. A child may span into an outer column so evidence plates bleed to the viewport edge. Below 980px it collapses to a single column.
- At most one kicker label per three sections. Content has no em or en dash characters.

## Content Rules

- Only real material appears as imagery: sanitized proof screenshots and the owner's portrait. The eight AI-generated mood images were removed from the pages and, with the owner's approval, deleted from `assets/materials/`.
- Consumption screenshots use `.proof-frame.is-metric`, which shows the metric card at native size. The lightbox still opens the full image.
- Spend figures always carry the existing disclaimers: they are team spend records, not sales, ROI or personal attribution, and the February figure covers 1 to 5 February only.

## Toolbox

`/tools/` uses the same shell. It groups the tools into 素材与内容, 服务与运维 and 已退役, and gives each one a one-line description taken from that tool's own page. The retired proxy panel stays listed but is labeled retired. Tool pages that load the shared stylesheet (`tools/index.html`, `tools/social-download/`, `tools/ecommerce-video-breakdown/`) must use the current `?v=` asset version, or browsers keep a cached old stylesheet.

The social-download workbench (`tools/social-download/app.css`) follows the same language. Panels open with the 2px ink rule and have flat surfaces. Corners are 2px, platform tags are square, and status notes use a left rule. Guidelines are text columns rather than cards. Status dots remain because they show real service and task state. Its behavior contract is `tests/social_download_frontend_contract.mjs`, run through Ego.

## Verification

`tests/site_contract.sh`, `tests/asset_contract.sh` and `tests/browser_contract.cjs` cover this layout. The browser contract checks 320, 390, 768 and 1440px widths, the hero proof or note order, tabs, lightbox, hash focus, print and the paper theme.
