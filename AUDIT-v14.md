# Choguild audit — v14 (2026-10-16)

Method: Playwright (Chromium 156) on live (v13) and local prod build; desktop 1440×900 and mobile 390×844 at 4× CPU throttle. Event Timing API (click/pointer/key, ≥16 ms), Long Tasks, idle rAF frame rate, click-to-route-settled time. Audit crawler over 9 pages × 2 viewports: console/page errors, horizontal overflow, h1 count, missing alt, unnamed controls, unlabeled inputs, tap targets <24 px, fonts, internal link status. Scripts: `/workspace/choguild-audit/v14/{perf,exp,audit}.mjs`.

## Click lag: root cause
No long tasks on the main thread. The lag came from **rendering**: three viewport-sized orbs with `filter: blur(90px)` sat behind ~20–40 glass surfaces with `backdrop-filter: blur(20px)`. While any animation ran (hero orbits, ticker, orb drift), the compositor re-applied the 90 px blur and re-blurred every card each frame. The home page rendered at 15–20 fps when idle, and each click waited for a slow frame. A/B test with injected CSS: hiding the orbs or stopping animations brought it back to 60 fps. Removing backdrop-filter alone did not.

Fixes:
- Orbs pre-blurred into three small static images (`public/bg/orb-*.webp`, dithered so they don't band). No CSS filter and no animation.
- `backdrop-filter` taken off cards, panels, ticker, surface and btn-glass. The translucent purple fill over the already-soft orbs looks the same. It stays only on the sticky pill nav (now 12 px), passport card and dialog overlay.
- Hero light drift stopped and stray `will-change` removed. Three inline `backdrop-blur` classes on home removed.
- The keyed `motion.div` page wrapper (a JS animation on every navigation) replaced with a 160 ms CSS fade that respects reduced motion.
- Already in place and checked: router `defaultPreload: "intent"` (40 ms), stale time 30 s, pending UI after 800 ms, top progress bar after 120 ms, and reduced-motion overrides on all keyframes.

## Before → after (local prod build, same machine)
| | before | after |
|---|---|---|
| Desktop idle fps (home) | 20 | 59 |
| Desktop max interaction | 168 ms | 64 ms |
| Desktop p75 interaction | 152 ms | 64 ms |
| Desktop nav click→settled | 110–161 ms | 46–89 ms |
| Mobile 4× idle fps | 33 | 60 |
| Mobile 4× p75 interaction | 120 ms | 48 ms |
Live v13 baseline: desktop 15 fps, max 352 ms, p75 216 ms.

## Findings
| # | Area | Finding | Status |
|---|---|---|---|
| 1 | Perf | Animated blurred orbs + backdrop-filter on every card → 15–20 fps, 150–350 ms clicks | Fixed |
| 2 | Perf | Page-transition JS animation on every navigation | Fixed (CSS) |
| 3 | Perf | Unused `@walletconnect/ethereum-provider` dependency | Removed |
| 4 | A11y/mobile | "How XP works" link on /ranking was under 24 px tall | Fixed (min-h-6) |
| 5 | Functionality | All 9 pages render with zero console or page errors (desktop and mobile) | OK |
| 6 | Links | 13 internal links, none broken | OK |
| 7 | Mobile | No horizontal overflow on any page at 390 px | OK |
| 8 | A11y | One h1 per page; no images missing alt; no unnamed buttons or links; no unlabeled inputs | OK |
| 9 | Type | Geist Sans used throughout; no stray fonts | OK |
| 10 | Wallet | injected() + EIP-6963 only; Coinbase and WalletConnect filtered; neither appears in the bundle | OK |
| 11 | Local env | Without `CHOG_SESSION_SECRET`, local SSR with DATABASE_URL returns 500 (expected config guard) | Open (env only) |
| 12 | Perf | Main client chunk is ~500 KB raw; wallet runtime is already split out (107 KB) | Open: split further |
| 13 | Flows | Signed wallet flows (submit, apply, Chog holder gating) not re-run end to end this pass; a real wallet extension is needed | Open: verify manually |
