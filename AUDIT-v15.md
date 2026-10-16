# AUDIT v15

Code commit: `484ee03` (main). Vercel: Ready (deployment completed 2026-10-16 20:55 WAT). GitHub Actions CI run #1: success (typecheck, lint, tests, build on Node 22).
Local checks on Node 22.20: `tsc --noEmit` clean, `eslint .` clean, `npm test` 64/64 pass, `vite build` OK.
Screenshots and verification scripts: `/workspace/choguild-audit/v15/` (verify.mjs, dos.mjs, *-1440.png, *-390.png).

| # | Item | Status | Change / live evidence |
|---|---|---|---|
| 1 | XP farming | Fixed | New `src/lib/ranking/farming.ts`. XP now comes from events, not raw counts. A listing earns +15 only if another wallet's work is accepted on it or it stays open 72 h. Max 4 listings per 30 days. Jobs between the same two wallets (either direction, one shared counter) earn ×1, then ×0.5, then 0. Self-dealing earns 0. Work and listing XP is capped at 400 per wallet per 30 days. New columns `published_at` and `closed_at` (migration 0008). Tests: `farming.test.ts` (66 publish+close loops = 0, 100 mutual rounds = 150/88 XP, self-deal = 0, cap) plus a DB test in `work.test.ts`. Live: production has 0 public passports, so I did not seed farm data on prod (real-data rule). The repro is covered by the PGLite-backed tests, which run the same SQL. |
| 2 | Sign-in DoS | Fixed | The limit is now per requester (SHA-256 of the client IP): 20 challenges per 10 min, stored in the DB. A new challenge never fails for a wallet: anything beyond the newest 3 open ones is evicted. TTL is 5 min. Tests added. **Live repro (dos.mjs):** a throwaway wallet signed in for real (SIWE, enforced CSP), then the attacker replayed nonce requests for that wallet. Requests 1–19 (past the old 8 cap) returned "ok" and requests 20–26 returned `REQUESTER_LIMIT`. "Wallet locked" never appeared. |
| 3 | Contribution history | Fixed | The passport page loads the signed-in profile's real accepted work (`getPublicContributions`), with loading, error and empty states. |
| 4 | Mobile sign-in | Fixed | Removed the dead `REMOTE_CONNECTOR_TYPES` path. On a mobile UA with no injected provider, the panel shows "Open in MetaMask / Phantom / Trust Wallet" deep links for the current URL. Rabby and Rainbow publish no open-URL link, so they get a "Copy link" button plus instructions. Live 390 px: links render (`passport-wallet-deeplinks-390.png`). |
| 5 | Reveal SSR opacity:0 | Fixed | `Reveal` is now progressive: the server HTML is visible. After hydration it hides only elements still below the fold and reveals them on scroll. Live no-JS render: 0 hidden text elements (`home-nojs-1440.png`). |
| 6 | First visit blocked on chain | Fixed | The Chog snapshot is kept in Postgres (`chog_snapshot`) and served stale-while-revalidate. Tx counts are cached in `onchain_tx_counts`. Missing data waits at most 1.5 s, then the page renders and the fetch finishes in the background. Live `/ranking` TTFB is about 0.28 s. |
| 7 | Migrations on previews | Fixed | `scripts/migrate.mjs` runs only when `VERCEL_ENV=production`, or with `CHOG_RUN_MIGRATIONS=1` outside Vercel. Documented in README. Live: migration 0008 applied on production (the nonce `requester` column is in use). |
| 8 | Transactions | Fixed | Added `Sql.transaction` (pg client BEGIN/COMMIT, PGLite `transaction`) and `withTransaction`. Wrapped: createWork, updateDraft (both branches), reviewWork, applyToOpportunity, withdrawApplication, setApplicationStatus. Rollback test added. |
| 9 | Missing session secret 500s | Fixed | `readSessionRecord` and `clearSessionRecord` treat a missing secret as signed out and log once. Only `writeSessionRecord` (sign-in) fails. Verified on a local production build with VERCEL=1 and no secret: every public page returns 200 and 404s return 404. |
| 10 | lower() and 500-wallet cap | Fixed | Migration 0008 lowercases every wallet column. Writes lowercase. The ranking queries indexed columns directly with `= any($1)`, with new `(wallet, status)` indexes. Tx counts now cover all wallets, in batches of 50 with 4 running in parallel. Test with 1,234 wallets added. |
| – | README / .env.example / WalletConnect | Done | Removed the WalletConnect and Coinbase docs and env var. `@walletconnect/*` remains only as a transitive optional dependency of wagmi. It is not imported or bundled. |
| – | CSP | Enforced | `Content-Security-Policy` is enforcing. `connect-src` lists self plus rpc1–3, monadinfra, dRPC, Ankr and rpc.monad.xyz. `frame-src 'none'` (WalletConnect and Coinbase removed). Reports go to `/api/csp-report` (live: 204). Playwright on 6 pages at 1440 and 390: 0 CSP violations. A real SIWE sign-in works. |
| – | Source maps | Done | `sourcemap: false`. Live `/assets/index-*.js.map` returns 404 and there is no `sourceMappingURL`. |
| – | "0 onchain txs" | Fixed | `stats.onchainTxs` is null when the RPC is unreachable, and Home and Ranking show "unavailable". |
| – | Unlisted / 404 SEO | Fixed | Unlisted passports get `noindex`. Missing listings and passports return 404 with a real h1 and noindex, and no canonical. |
| – | Mobile podium / steps | Fixed | The empty podium is now in DOM order 1, 2, 3, so #1 comes first on mobile. Step descriptions wrap instead of truncating (live 390 px: none truncated). |
| – | Bundle | Reduced | Removed `motion` entirely: CSS keyframes, IntersectionObserver, and scroll-driven CSS for the hero parallax. The ⌘K palette (cmdk) is now lazy. Main chunk went from 501 KB to 360 KB (116 KB gzip). Routes were already code-split. |
| – | CI | Added | `.github/workflows/ci.yml`. The Vercel install omits dev dependencies, so lint and tests are gated by CI, not the Vercel build. |

## Open / notes
- Rabby and Rainbow have no documented "open URL in in-app browser" deep link, so they get a copy-link button instead.
- Background refreshes of onchain data after the 1.5 s budget are best-effort on serverless. They persist to the DB when they finish, so the next visit is warm.
- A custom `VITE_MONAD_RPC_URL` host must be added to `connect-src`.
- Preview deploys no longer migrate. A preview that needs a new schema must use its own database, or wait until production has migrated.
- The noindex meta is emitted twice on 404 pages (route head + component). This is harmless.
