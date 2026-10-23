# Choguild: judge guide

**What it is:** a work guild on Monad where the **Chog Genesis NFT is the member**. Passport, XP, rank, streak, duels and work history are keyed to the token, not the wallet, and the holder is read live onchain.

Live: https://choguild.vercel.app · Repo: https://github.com/catalystberry842-alt/choguild · [README](README.md)

## 1. No-wallet tour (about 3 min)

| URL | What to look for |
| --- | --- |
| https://choguild.vercel.app | Hero "Your Chog is the member.", then the sections: Chog card, daily quests, **Duels** (Charge / Guard / Trick), leaderboard, work board, review, publish |
| https://choguild.vercel.app/chog/12 | A Chog's public record: real token art, tier card, holder read live with `ownerOf`, **Duels** section and history, rank card, $CHOG tip, $CHOG rewards paid |
| https://choguild.vercel.app/ranking | All-time Chog leaderboard (every row is a token) |
| https://choguild.vercel.app/ranking?by=season | Weekly season board (resets Monday 00:00 UTC) |
| https://choguild.vercel.app/discover | Listings board; listings with a $CHOG reward show a reward tag |
| https://choguild.vercel.app/docs | Docs overview |
| https://choguild.vercel.app/docs/duels | Duel rules, duel XP limits, $CHOG rewards, notifications, season prizes |
| https://choguild.vercel.app/docs/quests | Daily quests, streaks, seasons, rank cards |

Without a wallet everything is **view only**. That is intentional.

## 2. With a Chog (about 5 min)

You need an injected browser wallet (**MetaMask or Rabby**) holding a Chog Genesis NFT on **Monad mainnet**.

1. **Add Monad:** chain ID **143**, currency MON, RPC `https://rpc.monad.xyz`, explorer `https://monadscan.com`. The site also asks the wallet to switch networks when needed.
2. **Connect wallet** (top right), then sign the **free** Sign-In with Ethereum message. It's a signature, not a transaction, so there's no gas.
3. **Pick your Chog** on `/passport` ("act as"). Ownership is checked live with `ownerOf`.
4. **Check in** under Today's quests. Watch the XP and streak go up.
5. **Duel:** open another holder's Chog (e.g. `/chog/12`), pick 3 moves, press Duel. The animated result has confetti on a win and a shareable `/duel/:id` page.
6. **Apply** to a listing on `/discover`.
7. **Post a listing** at `/opportunities/new` with an optional **$CHOG reward**. On acceptance you pay the accepted Chog's holder from your wallet; it's marked **Paid** only after the server verifies the onchain Transfer.

## 3. Why the NFT is core

- **No Chog = view only:** a wallet without a Chog can't post, apply, review, quest or duel.
- **Transfer moves the record:** send or sell the Chog and the new holder gets its passport, XP, rank and history; the old wallet loses access. Every write re-checks `ownerOf`.
- **Anti-farming is per token and per wallet:** Chogs in the same wallet can't hire, review or duel each other; quests count once per wallet per day; duels are 5 per wallet per day.

## 4. Verify onchain

- Chog Genesis (ERC-721): `0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`, see [MonadScan](https://monadscan.com/token/0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763)
- $CHOG (ERC-20, 18 decimals): `0x350035555E10d9AfAF1566AaebfCeD5BA6C27777`, see [MonadScan](https://monadscan.com/token/0x350035555E10d9AfAF1566AaebfCeD5BA6C27777)
- Script: `node scripts/chog-live-check.mjs` reads name, totalSupply, ownerOf and balanceOf over public RPC and checks `/api/chog/:id` on the live site.

## 5. Known limitations (honest)

- **Sparse early data:** the leaderboard, seasons, duels and board are real and unseeded, so they're thin right after launch. An empty state means nobody has done it yet.
- **Demo video:** the reward listing and duel result clips use **sample data from a local preview** and are captioned that way. The rank card is labeled "example numbers".
- **Async duels:** the defender auto-plays; there are no live head-to-head duels yet.
- **$CHOG payments** are wallet to wallet with onchain verification, with no escrow, so the publisher must actually pay.
- **Notifications** are in-app only (no email/push), with read state kept per browser.
- **Wallets:** injected browser wallets only (no WalletConnect / Coinbase / Phantom).
