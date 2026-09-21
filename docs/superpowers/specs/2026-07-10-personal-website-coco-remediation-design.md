# Personal Website And COCO Remediation Design

## Goal

Remove every confirmed security, routing, update, deployment-drift, content, interaction, accessibility, performance, and repository-hygiene issue found in the 2026-07-10 audit without redesigning the existing brand or changing public URLs.

## Product Direction

This is a preserve-mode repair for a recruiter-facing portfolio. Keep the current light paper visual system, page hierarchy, Chinese copy voice, public slugs, and protected-tool boundaries. Changes must improve proof, reachability, clarity, accessibility, and operational safety.

## System Boundaries

- Public source: this repository, deployed to `/var/www/personal_website` on the current COCO host.
- Protected image tool: `/var/www/gpt_image_playground`.
- CPA management UI: `/etc/cli-proxy-api/management.html`, mirrored locally under `cpa/`.
- Nginx control point: `/etc/nginx/sites-available/cliproxyapi` and its enabled symlink.
- Auto-update control point: `/usr/local/sbin/personal-tools-auto-update` plus `/var/lib/personal-tools-auto-update`.
- Private browser UIs keep the existing Nginx Basic Auth boundary. Management and API endpoints keep their own application credentials; those credentials are not interchangeable. No password reset is part of this repair.

## Design

### Security

Move service secrets out of world-readable state by setting the smallest permissions compatible with the running service. Protect `/s` with the existing private-tools Basic Auth boundary. Remove publicly served `.bak` files after preserving a root-only server backup outside the webroot.

### Routing

Retire dead UI destinations instead of keeping controls that lead to known failures. Remove or disable the proxy API and QR actions backed by inactive port `2097`. Replace the dead dashboard redirect with the working local server-monitor route. Preserve deliberate `410` responses for retired routes.

### Authentication And Route Ownership

| Surface | Live owner | Anonymous result | Authentication contract |
| --- | --- | --- | --- |
| `/`, `/works/`, `/methods/`, `/about/`, `/resume/`, `/assets/` | `/var/www/personal_website` | `200` | Public; HTML must not inherit private no-store or auth behavior. |
| `/tools/`, `/tools/*`, `/cpa/`, `/image-playground/` | Static files or protected tool bundles | `401` | Nginx Basic Auth protects the browser UI. Individual tools may still require an application credential after login. |
| `/monitor/` | Reverse proxy to the server-monitor backend | `401` | Nginx Basic Auth, then the existing backend. |
| `/tools/ecommerce-video-breakdown/` | Reverse proxy to the backend under `/opt/ecommerce-video-breakdown` | `401` | Nginx Basic Auth. The tracked HTML at the same repository path is a local, non-submitting prototype, not the live backend template. |
| `/s` | Reverse proxy to the local SMS service | `401` | Nginx Basic Auth. The internal upstream token remains server-only and must never enter this repository or browser code. |
| `/v0/management` | CLI Proxy API management endpoint | Application response | Management-key authentication; do not add Basic Auth because it causes browser login loops. |
| `/v1/` | CLI Proxy API through the normalizer | `401` without a valid API key | Bearer/API-key authentication, independent of the browser UI password. |
| `/proxy-api*`, `/proxy-qr*` | Retired routes | `410` | No live action or redirect remains. |
| `/dashboard*` | Redirect only | `302` to `/monitor/` | Following the redirect anonymously reaches the monitor `401` boundary. |

### Updating

Use the updater state file as the authoritative installed management version. Do not scrape an arbitrary first semantic version from a minified HTML bundle. Add retention so successful automatic backups do not grow without bound. Keep enough recent backups for rollback, and remove redundant older automatic backups only after a fresh backup and health check.

Automatic rollback directories are root-only (`0700`). CPA configuration copies inside those backups are `0600`; the updater must enforce this explicitly instead of inheriting a historical source mode. The image updater must patch the single local module entry precisely, fail closed if the expected upstream guard or Service Worker declaration drifts, add the `?coco-zoom2` cache key, and validate the patched bundle and Service Worker before deployment. A CPA restart failure and any image sync, ownership, or mode failure must restore the previous live target before returning failure.

### Public Experience

- Add real, already-owned proof images and concise evidence captions to the two strongest work cases. Publish only cropped, sanitized evidence fragments; raw screenshots containing account balance, plan/account/content IDs, budgets, ROI targets, or internal filenames must not remain in the repository or webroot.
- Make the public navigation consistent and replace narrow-screen horizontal clipping with an explicit wrapped layout.
- Complete the tabs accessibility contract with ids, `aria-controls`, tabpanels, roving `tabindex`, arrow keys, Home, and End.
- Make hash targets focusable so skip and evidence links move both viewport and keyboard focus.
- Replace misleading relative freshness copy with explicit sample or snapshot timestamps.
- Remove image-tool zoom restrictions from both HTML metadata and the generated runtime bundle. Version the module URL and Service Worker cache so a previously controlled browser receives the corrected bundle on its first navigation without a manual refresh.
- Convert oversized, non-transparent portfolio PNGs to high-quality browser images using the native encoder, reserve dimensions, and add a seven-day public cache that still permits future filename-stable updates.

### Repository And Deployment

Sync the currently deployed CPA and image-tool artifacts back into their ignored local mirror directories without adding generated bundles to normal git tracking. Keep source-controlled public files canonical. Remove only verified unreferenced tracked assets. Replace ignored stale design drafts with this tracked remediation spec and plan.

`tools/monitor/index.html` is source-controlled and served by the protected static `/tools/` route. `tools/ecommerce-video-breakdown/index.html` is source-controlled for local preview and documentation, while its live URL is backend-owned. Generated CPA, image-playground, SIM, proxy, and legacy portal mirrors remain ignored and must not be force-added with runtime data.

Deployment is whitelist-only. Before copying, create a timestamped root-only backup outside the webroot. Sync only the reviewed public HTML, shared CSS/JavaScript, selected optimized images, and the explicitly reviewed protected static mirrors. Deploy the image-playground index to `/var/www/gpt_image_playground/index.html` separately. Never run a webroot-wide `rsync --delete`, never copy `.env`, keys, auth files, state files, SIM runtime data, or server configuration from the repository, and roll back the exact target set if post-deploy checks fail.

## Verification Contract

- `tests/site_contract.sh`, `tests/asset_contract.sh`, and `tests/protected_mirror_contract.sh` pass. Release verification runs the protected mirror contract with `REQUIRE_PROTECTED_MIRRORS=1`; a clean clone may report explicit skips. The protected image mirror must contain the exact runtime patch marker, module cache key, and matching Service Worker cache version.
- `nginx -t` passes before reload.
- Required units remain active and `/healthz` returns `200`.
- Public pages return `200`; private pages return `401` without credentials.
- `/s` returns `401` anonymously.
- No `.bak` file remains under the webroot.
- The updater reports the installed management version as current and does not create a new backup on a no-op run. A competing run exits `75`; rollback tests cover CPA restart failure and image sync/ownership/mode failure. Retained automatic backups are non-empty and root-only.
- Real browser tests cover desktop, 390px, and 320px navigation, anchors, tabs with mouse and keyboard, work evidence, resume, image zoom metadata, console errors, horizontal overflow, broken images, and protected boundaries. The image-tool check starts from the authenticated toolbox and must pass on the first click without a manual reload.

## Non-Goals

- No new frontend framework, dependency, design system, or backend service.
- No brand overhaul, route rename, password rotation, or speculative feature work.
- No deletion of business data, user data, active service state, or manual backups.
