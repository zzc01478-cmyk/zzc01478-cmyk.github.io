# Personal Website And COCO Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair every confirmed audit finding while preserving public routes, brand, and private-tool authentication.

**Architecture:** Treat the repository, Nginx, protected backends, and updater as separate control planes. Each task starts with a failing behavior check, applies the smallest fix at the canonical source, and verifies the live boundary before the next task.

**Tech Stack:** Static HTML/CSS/JavaScript, Nginx, Bash, systemd, Python-backed existing services, optimized JPEG assets, real browser automation.

---

### Task 1: Add The Regression Contract

**Files:**
- Create: `tests/site_contract.sh`
- Test: `tests/site_contract.sh`

- [x] Write assertions for navigation consistency, tabs semantics and keyboard handler, focusable anchors, snapshot wording, zoom metadata, referenced assets, and absence of public backup suffixes.
- [x] Run `bash tests/site_contract.sh` and confirm it fails on the audited behaviors.
- [x] Keep the test dependency-free and runnable on macOS and COCO.

### Task 2: Secure COCO And Remove Public Backups

**Files:**
- Modify: `/etc/cli-proxy-api/config.yaml` permissions only.
- Modify: `/etc/cli-proxy-api/.env` permissions only.
- Modify: `/etc/nginx/sites-available/cliproxyapi`.
- Delete: five verified `.bak` files under `/var/www/personal_website` after copying one root-only archive outside the webroot.

- [x] Record failing checks: secret files are `0644`, `/s` is not protected, and each known `.bak` URL returns `200`.
- [x] Back up Nginx config and webroot backups under `/root/backups/personal-website-remediation-20260710` with mode `0700`.
- [x] Set secret files to the narrowest service-compatible owner and mode.
- [x] Apply the existing Basic Auth snippet to `/s`.
- [x] Remove the five webroot backup files, run `nginx -t`, reload Nginx, and verify anonymous `/s` and private tools return `401`.

### Task 3: Repair Dead Routes

**Files:**
- Modify: `/etc/nginx/sites-available/cliproxyapi`.
- Modify: public tool links only when they expose retired proxy actions.

- [x] Record the inactive `2097` and `7000` listeners plus dead DNS redirect.
- [x] Remove inactive proxy API and QR locations or return explicit `410` where the route must remain stable.
- [x] Redirect `/dashboard` to the working `/monitor/` entry.
- [x] Verify no public or authenticated UI link points to the retired endpoints.

### Task 4: Fix The Auto-Updater

**Files:**
- Modify: `/usr/local/sbin/personal-tools-auto-update`.
- Modify: `/var/lib/personal-tools-auto-update/management-version` only if it does not match the deployed release.

- [x] Add a shell self-test that proves the old first-semver scraper returns the wrong value for current `management.html`.
- [x] Make the state file authoritative and use bundle scraping only as a diagnostic fallback.
- [x] Add bounded retention for automatic CPA backups.
- [x] Keep automatic rollback directories at `0700`, keep backed-up CPA configuration at `0600`, and harden existing automatic backups without touching manual backups.
- [x] Make CPA restart failure and image sync/ownership/mode failure restore the previous live target before returning failure.
- [x] Post-process the single image module entry and Service Worker precisely, fail closed on upstream drift, and preserve the patch idempotently.
- [x] Run syntax checks and a dry no-op version check, then run the updater once.
- [x] Confirm a current installation creates no new management backup.
- [x] Keep the newest rollback set and delete only redundant automatic backup directories beyond retention.

### Task 5: Repair The Public Experience

**Files:**
- Modify: `index.html`, `works/index.html`, `methods/index.html`, `about/index.html`, `resume/index.html`.
- Modify: `assets/site-system.css`, `assets/site-motion.js`.
- Modify: `tools/monitor/index.html`, `tools/sim/index.html`.
- Modify: `image-playground/index.html`.
- Delete: tracked assets proven to have zero references after the new work evidence is selected.

- [x] Run `tests/site_contract.sh` and preserve the expected red failures.
- [x] Reuse existing proof images in the NV and iteration cases.
- [x] Replace raw backend screenshots with new-name sanitized evidence crops and remove the raw files from both repository and webroot.
- [x] Make navigation and narrow-screen behavior consistent.
- [x] Complete tabs and anchor keyboard behavior with native JavaScript.
- [x] Change monitoring copy to explicit sample wording and SIM copy to snapshot-read wording with `updated_at`.
- [x] Remove `maximum-scale` and `user-scalable` from the image tool HTML and generated runtime bundle, then version the entry URL and Service Worker cache.
- [x] Run the contract test to green.

### Task 6: Optimize Assets And Cache Policy

**Files:**
- Create: optimized JPEG replacements under `assets/materials/` only for non-transparent images actually used.
- Modify: HTML references and `/etc/nginx/sites-available/cliproxyapi` asset cache location.

- [x] Record current byte sizes and visual dimensions.
- [x] Convert the four oversized PNG assets with installed native tooling and retain adequate visual quality.
- [x] Update references, add width and height where missing, and verify no broken images.
- [x] Add a seven-day cache for public `/assets/` files without caching HTML or authentication responses.
- [x] Verify transfer size reduction and response headers.

### Task 7: Sync Mirrors And Deploy

**Files:**
- Update ignored local mirrors: `cpa/` and `image-playground/`.
- Deploy source-controlled public files to `/var/www/personal_website`.

- [x] Copy current live CPA `v1.17.14` and image tool `v0.6.12` artifacts, including the final image index, entry bundle, and Service Worker, into their local mirror directories without exposing secrets.
- [x] Deploy only the reviewed public/source files and ignored static mirrors to COCO with a timestamped root-only rollback copy; do not use a webroot-wide `--delete`.
- [x] Run service, syntax, route, and file-hash checks.

### Task 8: Browser And Adversarial Verification

**Files:**
- No production changes unless a reproduced failure requires returning to its task.

- [x] Test public flow in a real browser at desktop and 320px mobile widths.
- [x] Click navigation, evidence anchors, work cases, methods tabs, resume links, and protected entries.
- [x] Test tabs with arrow keys, Home, End, and focus movement.
- [x] Capture accepted screenshots and inspect them.
- [x] Check console errors, missing assets, overflow, contrast, zoom metadata, the runtime gesture guard, and a first toolbox-to-image navigation that requires no reload.
- [x] Verify updater lock contention returns `75`, retained automatic backups are non-empty and root-only, and rollback tests restore CPA and image targets after injected failures.
- [x] Re-run `bash tests/site_contract.sh`, `bash tests/asset_contract.sh`, `REQUIRE_PROTECTED_MIRRORS=1 bash tests/protected_mirror_contract.sh`, `nginx -t`, unit health checks, public `200`, private `401`, anonymous `/s` `401`, and updater no-op behavior.
- [x] Run a final self-review against every audit finding and leave the worktree free of temporary files.
