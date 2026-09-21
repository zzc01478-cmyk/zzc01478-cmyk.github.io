#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

failures=0
skips=0
require_mirrors=${REQUIRE_PROTECTED_MIRRORS:-0}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

missing_mirror() {
  local label=$1
  if [[ "$require_mirrors" == "1" ]]; then
    fail "$label mirror is required for release verification"
  else
    printf 'SKIP: %s mirror is absent.\n' "$label"
    skips=$((skips + 1))
  fi
}

if [[ -d image-playground ]]; then
  if ! /usr/bin/grep -q '"tag":"v0.6.12"' image-playground/.coco-updater.json; then
    fail 'image playground mirror is not v0.6.12'
  fi

  if /usr/bin/grep -Eq 'maximum-scale|user-scalable' image-playground/index.html; then
    fail 'image playground disables browser zoom'
  fi

  image_entry_src=$(/usr/bin/grep -Eo 'src="\./assets/index-[^"]+\.js(\?[^"]+)?"' image-playground/index.html | head -1 | sed -E 's/^src="//; s/"$//')
  if [[ "$image_entry_src" != *'?coco-zoom2' ]]; then
    fail 'image playground entry bundle is missing the zoom cache key'
  fi
  image_entry_src=${image_entry_src%%\?*}
  image_entry="image-playground/${image_entry_src#./}"
  if [[ ! -f "$image_entry" ]]; then
    fail 'image playground entry bundle is missing'
  else
    if /usr/bin/grep -Eq 'maximum-scale|user-scalable' "$image_entry"; then
      fail 'image playground entry bundle restores a zoom restriction'
    fi
    if /usr/bin/grep -Eq 'document\.addEventListener\("gesture(start|change)"|touches\.length>1&&!pk\(' "$image_entry"; then
      fail 'image playground entry bundle blocks page zoom gestures globally'
    fi
    if [[ "$(/usr/bin/grep -o 'coco-zoom-guard-removed-v2' "$image_entry" | wc -l | tr -d '[:space:]')" != "1" ]]; then
      fail 'image playground entry bundle is missing the exact zoom guard patch marker'
    fi
  fi

  for asset in manifest.webmanifest pwa-icon.svg sw.js; do
    if [[ ! -f "image-playground/$asset" ]]; then
      fail "image playground is missing $asset"
    fi
  done

  if [[ "$(/usr/bin/grep -Eo "const CACHE_NAME = ['\"][^'\"]+-coco-zoom2['\"]" image-playground/sw.js | wc -l | tr -d '[:space:]')" != "1" ]]; then
    fail 'image playground service worker is missing the zoom cache version'
  fi
else
  missing_mirror 'image playground'
fi

if [[ -d cpa ]]; then
  if ! /usr/bin/grep -q 'v1.17.14' cpa/index.html; then
    fail 'CPA management mirror is not v1.17.14'
  fi
else
  missing_mirror 'CPA management'
fi

if ((failures > 0)); then
  exit 1
fi

if ((skips > 0)); then
  printf 'Protected mirror contract passed with %s local mirror(s) skipped.\n' "$skips"
else
  printf 'Protected mirror contract passed with all local mirrors verified.\n'
fi
