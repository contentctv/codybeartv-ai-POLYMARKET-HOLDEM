# AGENTS

This workspace is POLYMARKET HOLD'EM plus a PAPER member front end at `apps/member-fe`.

## Gates

GENERATE off. PUBLISH off. SPEND off. LIVE_TRADING false. CreateAgent off. GATE_LIFT off.

Do not create agents, call live bot APIs, open billing, or merge to main without a human.

## Member front end

`apps/member-fe` is a Next.js member shell on port 3010. It does not replace the Hold'em app on port 8080.

- WalletConnect is connect and disconnect only, plus a truncated address.
- `NEXT_PUBLIC_WC_PROJECT_ID` stays `REPLACE_ME` until a human sets it.
- The only payee is `https://pay.bitcoinjungle.app/codybeartv`.
- Do not add a second payee, invoice mint, withdraw, or value-transfer calls.

Charters: `apps/member-fe/TEAM_DESIGN.md`. Human verbs: `apps/member-fe/HITL.md`.

## Hold'em app

The Vite app at the repo root stays the desk for `/`. Studio and Hold'em routes are unchanged by the member shell.
