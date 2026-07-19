#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node --check tools/sim/app.js
grep -q 'type="tel" id="otp"' tools/sim/index.html
grep -q 'autocomplete="one-time-code"' tools/sim/index.html
grep -q 'const ESIM_API' tools/sim/app.js
grep -q 'PBKDF2' tools/sim/app.js
grep -q 'AES-GCM' tools/sim/app.js
grep -q 'auth/logout' tools/sim/app.js
grep -q 'https://flagcdn.com/' tools/sim/app.js
grep -q '.country-mark {.*border: 0; background: transparent;' tools/sim/index.html
grep -q '@keyframes row-in' tools/sim/index.html
grep -q 'prefers-reduced-motion: no-preference' tools/sim/index.html
grep -q '.topbar-inner, .login-sheet, .page-heading' tools/sim/index.html
grep -q 'animation-duration: 1ms' tools/sim/index.html
! grep -q 'data-lucide="sim-card"' tools/sim/index.html
! grep -q '本地演示' tools/sim/index.html
! grep -q 'demoLogin' tools/sim/index.html
grep -q 'data-sim-action="renew"' tools/sim/app.js
grep -q 'function renewSim' tools/sim/app.js

printf 'SIM contract passed\n'
