#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

failures=0

pass() {
  printf 'PASS %s\n' "$1"
}

fail() {
  printf 'FAIL %s\n' "$1"
  failures=$((failures + 1))
}

skip() {
  printf 'SKIP %s\n' "$1"
}

assert_contains() {
  file=$1
  pattern=$2
  label=$3
  if grep -Eq "$pattern" "$file"; then pass "$label"; else fail "$label"; fi
}

assert_not_contains() {
  file=$1
  pattern=$2
  label=$3
  if grep -Eq "$pattern" "$file"; then fail "$label"; else pass "$label"; fi
}

count_matches() {
  pattern=$1
  file=$2
  grep -Eo "$pattern" "$file" 2>/dev/null | wc -l | tr -d ' '
}

assert_count() {
  expected=$1
  pattern=$2
  file=$3
  label=$4
  actual=$(count_matches "$pattern" "$file")
  if [ "$actual" = "$expected" ]; then pass "$label"; else fail "$label (expected $expected, got $actual)"; fi
}

assert_text_contains() {
  text=$1
  pattern=$2
  label=$3
  if printf '%s\n' "$text" | grep -Eq "$pattern"; then pass "$label"; else fail "$label"; fi
}

assert_tab_links() {
  page=$1
  label=$2
  while IFS= read -r tab; do
    tab_id=$(printf '%s\n' "$tab" | sed -n -E 's/.*id="([^"]+)".*/\1/p')
    panel_id=$(printf '%s\n' "$tab" | sed -n -E 's/.*aria-controls="([^"]+)".*/\1/p')
    if [ -z "$tab_id" ] || [ -z "$panel_id" ]; then
      fail "$label tab is missing id or aria-controls"
      continue
    fi
    panel=$(grep -E "role=\"tabpanel\"[^>]*id=\"$panel_id\"|id=\"$panel_id\"[^>]*role=\"tabpanel\"" "$page" || true)
    if [ -z "$panel" ]; then
      fail "$label tab $tab_id controls a real tabpanel"
    elif printf '%s\n' "$panel" | grep -Eq "aria-labelledby=\"$tab_id\""; then
      pass "$label tab $tab_id maps both ways"
    else
      fail "$label panel $panel_id labels itself with $tab_id"
    fi
  done < <(grep -E '<button[^>]*role="tab"' "$page")
}

nav_labels() {
  awk '/<nav class="nav-links"/{inside=1} inside{print} /<\/nav>/{exit}' "$1" |
    sed -E 's/<[^>]+>//g; s/^[[:space:]]+//; s/[[:space:]]+$//' |
    awk 'NF' |
    paste -sd '|' -
}

expected_nav='首页|作品|关于'
for page in index.html works/index.html works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html contact/index.html privacy/index.html terms/index.html thanks/index.html 404.html; do
  actual=$(nav_labels "$page")
  if [ "$actual" = "$expected_nav" ]; then pass "$page uses the shared public navigation"; else fail "$page navigation is $actual"; fi
  assert_contains "$page" '<main id="main" tabindex="-1">' "$page skip-link target is programmatically focusable"
  assert_contains "$page" 'class="footer-links"[^>]*>.*href="https://chenzhihong\.online/tools/">工具箱</a>' "$page links the toolbox from the footer only"
done
for page in tools/index.html tools/social-download/index.html; do
  actual=$(nav_labels "$page")
  if [ "$actual" = '首页|作品|关于|工具箱' ]; then pass "$page uses the toolbox navigation"; else fail "$page navigation is $actual"; fi
done

public_pages=(
  index.html
  works/index.html
  works/nv-guse/index.html
  works/sucai-fangfa/index.html
  about/index.html
  contact/index.html
  privacy/index.html
  terms/index.html
)
special_public_pages=(thanks/index.html 404.html)

canonical_for_page() {
  case "$1" in
    index.html) printf '%s' 'https://chenzhihong.online/' ;;
    works/index.html) printf '%s' 'https://chenzhihong.online/works/' ;;
    works/nv-guse/index.html) printf '%s' 'https://chenzhihong.online/works/nv-guse/' ;;
    works/sucai-fangfa/index.html) printf '%s' 'https://chenzhihong.online/works/sucai-fangfa/' ;;
    about/index.html) printf '%s' 'https://chenzhihong.online/about/' ;;
    contact/index.html) printf '%s' 'https://chenzhihong.online/contact/' ;;
    privacy/index.html) printf '%s' 'https://chenzhihong.online/privacy/' ;;
    terms/index.html) printf '%s' 'https://chenzhihong.online/terms/' ;;
  esac
}

for page in "${public_pages[@]}"; do
  canonical=$(canonical_for_page "$page")
  assert_count 1 '<title>[^<]+</title>' "$page" "$page has one meta title"
  assert_count 1 '<meta name="description" content="[^"]+">' "$page" "$page has one meta description"
  assert_contains "$page" '<link rel="icon" type="image/svg\+xml" href="/assets/favicon\.svg\?v=20260913-r1">' "$page uses the site favicon"
  assert_contains "$page" "<link rel=\"canonical\" href=\"$canonical\">" "$page canonical matches its route"
  assert_contains "$page" '<meta property="og:title" content="[^"]+">' "$page has an Open Graph title"
  assert_contains "$page" '<meta property="og:description" content="[^"]+">' "$page has an Open Graph description"
  assert_contains "$page" '<meta property="og:image" content="https://chenzhihong\.online/assets/materials/og-portfolio\.jpg">' "$page uses the shared Open Graph image"
  assert_contains "$page" '<meta property="og:image:width" content="1200">' "$page declares the Open Graph image width"
  assert_contains "$page" '<meta property="og:image:height" content="630">' "$page declares the Open Graph image height"
  assert_contains "$page" '<meta property="og:image:alt" content="[^"]+">' "$page describes the Open Graph image"
  assert_contains "$page" '<meta name="twitter:card" content="summary_large_image">' "$page uses a large Twitter card"
  assert_contains "$page" '<meta name="twitter:title" content="[^"]+">' "$page has a Twitter title"
  assert_contains "$page" '<meta name="twitter:description" content="[^"]+">' "$page has a Twitter description"
  assert_contains "$page" '<body[^>]*data-public-site' "$page enables the public privacy notice"
  assert_contains "$page" 'href="/contact/"' "$page links to the contact page"
  assert_contains "$page" 'href="/privacy/"' "$page links to the privacy page"
  assert_contains "$page" 'href="/terms/"' "$page links to the terms page"
done

for page in "${special_public_pages[@]}"; do
  assert_count 1 '<title>[^<]+</title>' "$page" "$page has one meta title"
  assert_count 1 '<meta name="description" content="[^"]+">' "$page" "$page has one meta description"
  assert_contains "$page" '<meta name="robots" content="noindex,follow">' "$page stays out of search results"
  assert_contains "$page" '<link rel="icon" type="image/svg\+xml" href="/assets/favicon\.svg\?v=20260913-r1">' "$page uses the site favicon"
  assert_contains "$page" '<body[^>]*data-public-site' "$page enables the public privacy notice"
done

titles=$(for page in "${public_pages[@]}" "${special_public_pages[@]}"; do grep -Eo '<title>[^<]+</title>' "$page"; done)
title_count=$(printf '%s\n' "$titles" | wc -l | tr -d ' ')
unique_title_count=$(printf '%s\n' "$titles" | sort -u | wc -l | tr -d ' ')
if [ "$title_count" = "$unique_title_count" ]; then pass 'public pages use unique meta titles'; else fail 'public pages use unique meta titles'; fi

descriptions=$(for page in "${public_pages[@]}" "${special_public_pages[@]}"; do grep -Eo '<meta name="description" content="[^"]+">' "$page"; done)
description_count=$(printf '%s\n' "$descriptions" | wc -l | tr -d ' ')
unique_description_count=$(printf '%s\n' "$descriptions" | sort -u | wc -l | tr -d ' ')
if [ "$description_count" = "$unique_description_count" ]; then pass 'public pages use unique meta descriptions'; else fail 'public pages use unique meta descriptions'; fi

for page in index.html works/index.html works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html contact/index.html; do
  hero=$(awk '/<section class="hero/{inside=1} inside{print} inside && /<\/section>/{exit}' "$page")
  assert_text_contains "$hero" 'class="actions"' "$page has an above-fold action group"
  assert_text_contains "$hero" 'class="btn primary"' "$page has an above-fold primary CTA"
done

for page in index.html works/index.html works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html; do
  assert_contains "$page" '<body[^>]*data-mobile-cta' "$page enables the sticky mobile CTA"
done
assert_contains assets/site-motion.js '关注抖音' 'mobile CTA leads with following on Douyin'
for page in index.html works/index.html contact/index.html; do
  assert_not_contains "$page" '岗位|求职|简历' "$page carries no job-seeking wording"
done
assert_contains index.html '<h1 class="display">抽纸盒</h1>' 'home leads with the IP name'
assert_contains index.html 'douyin\.com/user/MS4wLjABAAAAgzfVM9AGNSNbj_sEUfEDqoAVv53iQ90McrxvDUUGi2w' 'home links the public Douyin profile, not /user/self'
assert_not_contains index.html 'douyin\.com/user/self' 'home never links the owner-only Douyin URL'
for block in featured latest; do
  assert_count 1 "<!-- works:$block:start -->" index.html "home has one generated $block block"
done
assert_count 1 '<!-- works:wall:start -->' works/index.html 'works wall has one generated block'
assert_count 1 '<!-- works:urls:start -->' sitemap.xml 'sitemap has one generated works block'
if python3 scripts/build_works.py --check >/dev/null; then pass 'every work note passes validation'; else fail 'every work note passes validation'; fi
for option in 商务合作 作品授权 交流; do
  assert_contains contact/index.html "<option value=\"$option\">" "contact offers the $option topic"
done

assert_contains assets/site-motion.js 'className = "mobile-action-bar"' 'shared JavaScript creates the sticky mobile CTA'
assert_contains assets/site-system.css '@media \(max-width: 980px\)' 'site has a tablet breakpoint'
assert_contains assets/site-system.css '@media \(max-width: 720px\)' 'site has a mobile breakpoint'
assert_contains assets/site-system.css '\.mobile-action-bar[[:space:]]*\{' 'site styles the mobile CTA'
assert_contains assets/site-system.css '\.is-image-loading[[:space:]]*\{' 'site exposes an image loading state'
assert_contains assets/site-motion.js 'classList\.add\("is-image-loading"\)' 'images enter the loading state'
assert_contains assets/site-motion.js 'classList\.add\("has-image-error"\)' 'broken images expose an error state'

assert_contains contact/index.html 'data-contact-form' 'contact page has a validated contact form'
for field in name email topic message; do
  assert_contains contact/index.html "id=\"$field\"[^>]*aria-describedby=\"$field-error\"" "contact field $field names its error message"
  assert_contains contact/index.html "id=\"$field-error\"" "contact field $field has an error container"
done
assert_contains contact/index.html 'data-form-status' 'contact form has an announced status area'
assert_contains contact/index.html 'href="/thanks/"[^>]*data-contact-next[^>]*hidden' 'contact form reveals a thank-you next step after validation'
assert_contains contact/index.html '<address><a href="mailto:2589798905@qq\.com">2589798905@qq\.com</a></address>' 'contact page publishes the verified email address'
assert_contains contact/index.html '不公开家庭或街道地址' 'contact page explains the physical-address privacy boundary'
assert_contains assets/site-motion.js '请填写至少 2 个字的称呼' 'contact form defines the name error state'
assert_contains assets/site-motion.js '请填写可以回复的邮箱地址' 'contact form defines the email error state'
assert_contains assets/site-motion.js '请用至少 10 个字说明' 'contact form defines the message error state'

analytics_pages=(index.html works/index.html works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html contact/index.html privacy/index.html terms/index.html)
for page in "${analytics_pages[@]}"; do
  assert_count 1 'src="https://static\.cloudflareinsights\.com/beacon\.min\.js"' "$page" "$page loads the Cloudflare Web Analytics beacon once"
  assert_count 1 'data-cf-beacon=' "$page" "$page carries one Cloudflare Web Analytics site token"
  assert_count 1 '<script defer src="https://static\.cloudflareinsights\.com/beacon\.min\.js"' "$page" "$page executes the Cloudflare beacon as a deferred classic script"
  assert_not_contains "$page" '<script type="module" src="https://static\.cloudflareinsights\.com/beacon\.min\.js"' "$page does not load the classic Cloudflare beacon as a module"
done
for page in thanks/index.html 404.html tools/index.html; do
  assert_not_contains "$page" 'static\.cloudflareinsights\.com|data-cf-beacon' "$page is excluded from public analytics"
done
assert_contains privacy/index.html '第三方分析工具</span><strong>Cloudflare Web Analytics 已启用</strong>' 'privacy page truthfully reports Cloudflare analytics as enabled'
assert_contains privacy/index.html '广告与追踪 Cookie</span><strong>未使用</strong>' 'privacy page reports no advertising cookies'
assert_contains assets/site-motion.js 'privacy-notice-dismissed' 'privacy notice remembers dismissal locally'
assert_contains assets/site-motion.js 'Cloudflare Web Analytics 统计匿名访问' 'privacy notice names the active analytics service'
assert_contains assets/site-motion.js '不使用广告或分析 Cookie' 'privacy notice matches the current cookie state'

assert_contains 404.html '404 · 路径未找到' 'custom 404 page explains the missing route'
assert_contains thanks/index.html '请确认邮件已经在邮箱应用中点击发送' 'thank-you page does not claim server receipt'
assert_contains robots.txt '^User-agent: \*$' 'robots file addresses all crawlers'
assert_contains robots.txt '^Disallow: /thanks/$' 'robots file excludes the thank-you page'
assert_contains robots.txt '^Sitemap: https://chenzhihong\.online/sitemap\.xml$' 'robots file links the sitemap'
for route in '' works/ works/nv-guse/ works/sucai-fangfa/ about/ contact/ privacy/ terms/; do
  assert_contains sitemap.xml "<loc>https://chenzhihong\.online/${route}</loc>" "sitemap includes /$route"
done
assert_not_contains sitemap.xml '/thanks/|/404\.html|/tools/|/methods/|/resume/' 'sitemap excludes noindex, protected and retired pages'
for page in index.html works/index.html works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html contact/index.html privacy/index.html terms/index.html thanks/index.html 404.html; do
  assert_not_contains "$page" 'href="/(methods|resume)/' "$page no longer links the retired methods or resume pages"
done
assert_contains docs/superpowers/specs/2026-09-13-production-optimization-guide.md 'try_files \$uri \$uri/ =404;' 'Nginx guide stops unknown public routes before the backend'
assert_contains docs/superpowers/specs/2026-09-13-production-optimization-guide.md 'proxy_intercept_errors on;' 'Nginx guide documents proxied 404 interception'
assert_contains docs/superpowers/specs/2026-09-13-production-optimization-guide.md '证书路径没有确认前，不要启用 `listen 443 ssl`' 'Nginx guide gates HTTPS on a verified certificate'

mobile_nav=$(awk '
  /@media \(max-width: 720px\)/ {mobile=1}
  mobile && /^[[:space:]]*\.nav-links[[:space:]]*\{/ {nav=1}
  nav {print}
  nav && /^[[:space:]]*\}/ {exit}
' assets/site-system.css)
if printf '%s\n' "$mobile_nav" | grep -Eq 'overflow-x:[[:space:]]*(auto|hidden)'; then
  fail 'mobile navigation does not hide links behind horizontal overflow'
else
  pass 'mobile navigation does not hide links behind horizontal overflow'
fi
if printf '%s\n' "$mobile_nav" | grep -Eq 'flex-wrap:[[:space:]]*wrap|display:[[:space:]]*grid|grid-template-columns'; then
  pass 'mobile navigation explicitly wraps or uses a grid'
else
  fail 'mobile navigation explicitly wraps or uses a grid'
fi
assert_contains assets/site-system.css '\.nav-links a[[:space:]]*\{' 'navigation links have a shared rule'
assert_contains assets/site-system.css 'min-height:[[:space:]]*44px' 'navigation exposes a 44px touch target'
assert_contains assets/site-system.css '^[[:space:]]{2}\.case-proof-grid[[:space:]]*\{' 'case proof grid has an explicit phone layout'

assert_count 4 'role="tab"' works/sucai-fangfa/index.html 'method page exposes four tabs'
assert_count 4 'id="method-tab-[^"]+"' works/sucai-fangfa/index.html 'each method tab has an id'
assert_count 4 'aria-controls="method-panel-[^"]+"' works/sucai-fangfa/index.html 'each method tab controls a panel'
assert_count 1 'role="tab"[^>]*tabindex="0"' works/sucai-fangfa/index.html 'one method tab is in the tab order'
assert_count 3 'role="tab"[^>]*tabindex="-1"' works/sucai-fangfa/index.html 'inactive method tabs use roving tabindex'
assert_count 4 'role="tabpanel"' works/sucai-fangfa/index.html 'method page exposes four tab panels'
assert_count 4 'id="method-panel-[^"]+"' works/sucai-fangfa/index.html 'each method panel has an id'
assert_count 4 'aria-labelledby="method-tab-[^"]+"' works/sucai-fangfa/index.html 'each method panel names its tab'
assert_tab_links works/sucai-fangfa/index.html 'method page'
for key in ArrowLeft ArrowRight ArrowUp ArrowDown Home End; do
  assert_contains assets/site-motion.js "$key" "methods keyboard handling includes $key"
done
assert_contains assets/site-motion.js '\.focus\(' 'interactive navigation moves keyboard focus'

assert_contains index.html 'id="contact"[^>]*tabindex="-1"' 'home hash target contact is programmatically focusable'
assert_contains about/index.html 'id="experience"[^>]*tabindex="-1"' 'about hash target experience is programmatically focusable'
for target in nv iteration koc; do
  assert_contains works/nv-guse/index.html "id=\"$target\"[^>]*tabindex=\"-1\"" "NV case hash target $target is programmatically focusable"
done
for target in shoe matrix process; do
  assert_contains works/sucai-fangfa/index.html "id=\"$target\"" "method page keeps the $target anchor"
done
for anchor in nv iteration koc shoe matrix; do
  assert_contains assets/site-motion.js "$anchor: \"/works/" "old /works/#$anchor links are redirected"
done
assert_contains assets/site-motion.js "a\\[href\\^=['\"]#['\"]\\]" 'same-page hash links receive focus handling'

nv_case=$(awk '/id="nv"/,/id="iteration"/' works/nv-guse/index.html)
iteration_case=$(awk '/id="iteration"/,/id="koc"/' works/nv-guse/index.html)
assert_text_contains "$nv_case" 'proof-nv-dec-consume-public\.png' 'NV case shows sanitized December proof'
assert_text_contains "$nv_case" 'proof-nv-jan-consume-public\.png' 'NV case shows sanitized January proof'
assert_text_contains "$iteration_case" 'proof-video-timing-13s\.png' 'iteration case shows timing proof'
for image in assets/materials/proof-nv-dec-consume-public.png assets/materials/proof-nv-jan-consume-public.png assets/materials/proof-video-timing-13s.png; do
  if [ -f "$image" ]; then pass "$image exists"; else fail "$image exists"; fi
done
assert_text_contains "$nv_case" 'proof-nv-feb-consume-public\.png' 'NV case shows sanitized February proof'
assert_contains works/nv-guse/index.html 'proof-koc-timing-17s-public\.png' 'NV case shows the sanitized KOC proof'
assert_contains works/nv-guse/index.html '2 月只统计前 5 天，不与整月直接比较' 'NV case distinguishes the five-day spend window from full months'
assert_contains works/nv-guse/index.html '消耗不等于销售额或 ROI' 'NV case distinguishes ad spend from business results'
assert_contains works/nv-guse/index.html '不能据此推断留存或转化改善' 'interaction timing is not presented as retention or conversion uplift'
assert_contains about/index.html '具体材料按授权范围提供' 'about keeps shared materials within authorization'
assert_count 6 'class="timeline-item"' about/index.html 'about carries the full experience timeline from the resume'
for page in index.html works/index.html works/nv-guse/index.html about/index.html; do
  assert_not_contains "$page" '保留 80%|显著改善了前段留存|助力项目实现消耗稳步爬升|主导账号精剪' "$page avoids unverified metrics and expanded ownership"
done
for raw_proof in \
  assets/materials/proof-nv-dec-consume.png \
  assets/materials/proof-nv-jan-consume.png \
  assets/materials/proof-nv-feb-consume.png \
  assets/materials/proof-koc-timing-17s.png; do
  if [ -e "$raw_proof" ]; then fail "$raw_proof is not retained in the public source"; else pass "$raw_proof is absent from the public source"; fi
  if find . \( -path './.git' -o -path './site/node_modules' -o -path './site/.next' -o -path './site/out' \) -prune -o -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.tsx' -o -name '*.ts' -o -name '*.json' \) -exec grep -lF "$raw_proof" {} + | grep -q .; then
    fail "$raw_proof is still referenced"
  else
    pass "$raw_proof has zero HTML/CSS/JS references"
  fi
done

for page in works/nv-guse/index.html works/sucai-fangfa/index.html about/index.html; do
  assert_contains "$page" 'class="[^"]*page-next-step' "$page has an explicit next-step CTA"
  next_line=$(grep -n 'class="[^"]*page-next-step' "$page" | tail -1 | cut -d: -f1)
  last_section=$(grep -n '<section class="section"' "$page" | tail -1 | cut -d: -f1)
  if [ "$next_line" -gt "$last_section" ]; then pass "$page keeps its next step in the final section"; else fail "$page keeps its next step in the final section"; fi
done
assert_contains about/index.html '<h2>合作、授权或交流，发邮件最快。</h2>' 'about next-step heading matches its email action'

assert_contains tools/index.html '<main[^>]*id="main"[^>]*tabindex="-1"|<main[^>]*tabindex="-1"[^>]*id="main"' 'toolbox skip-link target is focusable'
assert_contains tools/index.html 'id="tool-cards"[^>]*tabindex="-1"' 'toolbox action target is focusable'
assert_contains tools/index.html '<script src="/assets/site-motion\.js[^>]*defer></script>' 'toolbox reuses shared hash focus handling'
assert_contains tools/ecommerce-video-breakdown/index.html '<main[^>]*id="main"[^>]*tabindex="-1"|<main[^>]*tabindex="-1"[^>]*id="main"' 'video prototype skip-link target is focusable'
assert_contains tools/ecommerce-video-breakdown/index.html '<script src="/assets/site-motion\.js[^>]*defer></script>' 'video prototype reuses shared hash focus handling'

assert_contains tools/index.html 'href="https://chenzhihong\.online/monitor/"[^>]*><span>监控</span><strong>服务器监控</strong>' 'toolbox opens the live monitor directly'
assert_not_contains tools/index.html 'href="https://chenzhihong\.online/tools/monitor/"' 'toolbox no longer routes through the monitor preview'
assert_contains tools/monitor/index.html 'http-equiv="refresh"[^>]*url=https://chenzhihong\.online/monitor/' 'legacy monitor preview redirects to the live backend'
assert_contains tools/monitor/index.html 'rel="canonical" href="https://chenzhihong\.online/monitor/"' 'legacy monitor preview names the live backend as canonical'
assert_not_contains tools/monitor/index.html 'web-main|api-worker|media-worker|edge-node-a' 'legacy monitor preview contains no stale sample nodes'

if [ -f tools/sim/index.html ]; then
  assert_contains tools/sim/index.html '<script src="\./app\.js[^>]*defer></script>' 'SIM loads its live application code'
  assert_contains tools/sim/app.js 'auth/verify' 'SIM verifies Telegram login codes'
  assert_contains tools/sim/app.js 'async function fetchSims\(' 'SIM loads live SIM records'
  assert_contains tools/sim/index.html '<main[^>]*id="main"[^>]*tabindex="-1"|<main[^>]*tabindex="-1"[^>]*id="main"' 'SIM skip-link target is focusable'
  assert_contains tools/sim/app.js "main.*focus\(\)" 'SIM moves focus into the authenticated app'
else
  skip 'tools/sim mirror is absent'
fi

for page in tools/proxy/index.html proxy/2vbCz7mecyxuFkhtAZWJ2CWE9cDH/index.html; do
  if [ -f "$page" ]; then
    assert_contains "$page" '已退役' "$page explains that the proxy portal is retired"
    assert_not_contains "$page" '(href|location\.href).*(/proxy-api|/proxy-qr|/dashboard|/proxy/)' "$page exposes no retired proxy action"
    assert_not_contains "$page" 'handoff-mark|wait-orbit|wait-dot' "$page shows no loading spinner for a retired service"
  else
    skip "$page mirror is absent"
  fi
done

backups=$(find . \( -path './.git' -o -path './site/node_modules' \) -prune -o -type f -name '*.bak*' -print)
if [ -n "$backups" ]; then fail "repository contains backup files: $(printf '%s\n' "$backups" | paste -sd, -)"; else pass 'repository contains no backup files'; fi

for removed in \
  assets/field-notes-desk.jpg \
  assets/materials/about-focus-lab.png \
  assets/materials/home-workbench-cinematic.png \
  assets/materials/methods-framework-instrument.png \
  assets/materials/phone-creative.jpg \
  assets/materials/resume-network-bg.png \
  assets/materials/script-paper.jpg \
  assets/materials/selected-work-shoe-lab.png \
  assets/materials/works-archive-cabinet.png \
  assets/materials/about-focus-lab.jpg \
  assets/materials/index-01-hero-workbench.jpg \
  assets/materials/index-03-process-board.jpg \
  assets/materials/index-04-ip-entry-map.jpg \
  assets/materials/index-05-final-cta-desk.jpg \
  assets/materials/methods-framework-instrument.jpg \
  assets/materials/resume-network-bg.jpg \
  assets/materials/works-archive-cabinet.jpg; do
  if find . \( -path './.git' -o -path './site/node_modules' -o -path './site/.next' -o -path './site/out' \) -prune -o -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.tsx' -o -name '*.ts' -o -name '*.json' \) -exec grep -lF "$removed" {} + | grep -q .; then
    fail "$removed is still referenced"
  else
    pass "$removed has zero HTML/CSS/JS references"
  fi
done

while IFS= read -r page; do
  duplicate_ids=$(grep -Eo 'id="[^"]+"' "$page" | sed -E 's/^id="//; s/"$//' | sort | uniq -d)
  if [ -n "$duplicate_ids" ]; then fail "$page has duplicate ids: $(printf '%s' "$duplicate_ids" | paste -sd, -)"; else pass "$page has unique ids"; fi
done < <(find . -type f -name '*.html' ! -path './.git/*' ! -path './docs/*' ! -path './site/*' | LC_ALL=C sort)

while IFS= read -r page; do
  base=$(dirname "$page")
  while IFS= read -r ref; do
    clean=${ref%%\?*}
    clean=${clean%%\#*}
    case "$clean" in
      ''|'/'|'#'*|http://*|https://*|mailto:*|data:*|javascript:*) continue ;;
      *'${'*|*'`'*|*' + '*) continue ;;
    esac
    if [[ "$clean" = /media/works/* ]] && [ ! -d media/works ]; then skip "$page reference $clean (generated media not built here)"; continue; fi
    if [[ "$clean" = /* ]]; then path=".${clean}"; else path="$base/$clean"; fi
    if [ -d "$path" ]; then path="$path/index.html"; fi
    if [ -e "$path" ]; then pass "$page reference $clean exists"; else fail "$page reference $clean exists"; fi
  done < <(grep -Eho '(href|src)="[^"]+"' "$page" | sed -E 's/^[^=]+="//; s/"$//' | LC_ALL=C sort -u)
done < <(find . -type f -name '*.html' ! -path './.git/*' ! -path './docs/*' ! -path './site/*' | LC_ALL=C sort)

if [ "$failures" -gt 0 ]; then
  printf '\n%d contract failure(s)\n' "$failures"
  exit 1
fi

printf '\nSite contract passed\n'
