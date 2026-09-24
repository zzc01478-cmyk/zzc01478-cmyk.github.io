#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

failures=0

check_asset() {
  local page=$1
  local stem=$2
  local optimized="assets/materials/${stem}.jpg"

  if [[ ! -f "$optimized" ]]; then
    printf 'FAIL: missing %s\n' "$optimized" >&2
    failures=$((failures + 1))
    return
  fi

  local bytes
  bytes=$(wc -c < "$optimized" | tr -d '[:space:]')
  if ((bytes >= 600000)); then
    printf 'FAIL: %s is %s bytes\n' "$optimized" "$bytes" >&2
    failures=$((failures + 1))
  fi

  if ! /usr/bin/grep -q "/${optimized}" "$page"; then
    printf 'FAIL: %s does not reference %s\n' "$page" "$optimized" >&2
    failures=$((failures + 1))
  fi

  if /usr/bin/grep -q "/assets/materials/${stem}.png" "$page"; then
    printf 'FAIL: %s still references the PNG\n' "$page" >&2
    failures=$((failures + 1))
  fi
}

check_asset about/index.html profile-portrait
check_asset resume/index.html profile-portrait

public_pages=(
  index.html
  works/index.html
  methods/index.html
  about/index.html
  resume/index.html
  contact/index.html
  privacy/index.html
  terms/index.html
  thanks/index.html
  404.html
)

while IFS= read -r ref; do
  asset=".${ref}"
  if [[ ! -f "$asset" ]]; then
    printf 'FAIL: missing public image %s\n' "$asset" >&2
    failures=$((failures + 1))
    continue
  fi

  bytes=$(wc -c < "$asset" | tr -d '[:space:]')
  if ((bytes >= 600000)); then
    printf 'FAIL: public image %s is %s bytes\n' "$asset" "$bytes" >&2
    failures=$((failures + 1))
  fi
done < <(
  grep -Eho '<img[^>]+src="/[^"]+"' "${public_pages[@]}" |
    sed -E 's/.*src="([^"]+)"/\1/' |
    sort -u
)

if rg -n --pcre2 '<img\b(?![^>]*\balt=)[^>]*>' "${public_pages[@]}" >/dev/null; then
  printf 'FAIL: a public image is missing alt text\n' >&2
  failures=$((failures + 1))
fi

og_asset="assets/materials/og-portfolio.jpg"
if [[ ! -f "$og_asset" ]]; then
  printf 'FAIL: missing Open Graph image\n' >&2
  failures=$((failures + 1))
else
  og_width=$(sips -g pixelWidth "$og_asset" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  og_height=$(sips -g pixelHeight "$og_asset" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  og_bytes=$(wc -c < "$og_asset" | tr -d '[:space:]')
  if [[ "$og_width" != "1200" || "$og_height" != "630" ]]; then
    printf 'FAIL: Open Graph image is %sx%s, expected 1200x630\n' "$og_width" "$og_height" >&2
    failures=$((failures + 1))
  fi
  if ((og_bytes >= 300000)); then
    printf 'FAIL: Open Graph image is %s bytes\n' "$og_bytes" >&2
    failures=$((failures + 1))
  fi
fi

if ((failures > 0)); then
  exit 1
fi

printf 'Asset contract passed.\n'
