# Member front end (PAPER)

Next.js App Router shell for CodyBearTV members. It runs beside the Hold'em app and does not replace `/` on port 8080.

## Run

```bash
cd apps/member-fe
npm install
npm test
npm run typecheck
npm run dev
```

Open http://localhost:3010

Routes: `/`, `/member`, `/tip`.

Copy `.env.example` to `.env.local` only after a human supplies a WalletConnect project id. The committed value is `REPLACE_ME`. Connect throws until that value is replaced. Disconnect clears the in-memory session.

## Rails

- Session: connect, disconnect, truncated address. Account read only (`eth_accounts`).
- Tip: one link, `https://pay.bitcoinjungle.app/codybeartv`.

## Plane

PAPER. Publish, deploy, spend, and live trading stay off. Human verbs are in `HITL.md`. Charters are in `TEAM_DESIGN.md`.
