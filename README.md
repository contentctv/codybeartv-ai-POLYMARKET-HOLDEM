# POLYMARKET HOLD'EM by CODYBEARTV

Night-table 3-in-1 on grok.me: published factory catalog, Cipher Coast Hold'em felt (paper chips), paper Polymarket book.

- Default model: `grok-4.6` (never invent grok-4.7)
- `LIVE_TRADING=false` · `GENERATE=off` until GATE_LIFT · `PUBLISH=off` · `desk_collection=disabled`
- HITL on payment, post, withdraw, refund
- Auth: X OAuth 2.0 PKCE via Grok broker
- DB: Neon on deploy, PGLite in preview — fail closed per request

```sh
npm run dev        # 0.0.0.0:8080
npm run typecheck
npm run build
```

## Paper-host landing

Static Cipher Coast 3-IN-1 page: [`site/index.html`](site/index.html) (Pages copy: [`docs/`](docs/)).

- Buy kit $47 Payment Link (STRIPE_LINK $47, James 2026-09-10): https://buy.stripe.com/eVq6oz9eb5cnaPIeMC9ws00 — `STRIPE_LIVE` still needs operator confirm for live-mode API
- Supercool kit listed: https://supercool.com/@codybearstudio/product/2036581b-09df-4e3e-bea0-9bfcdd0d4cba
- Pages: https://contentctv.github.io/codybeartv-ai-POLYMARKET-HOLDEM/ from main `/docs`
- 8-hour free DEVELOPER ACCESS (`cca_` after follow @ContentCTV): [`docs/DEV_ACCESS.md`](docs/DEV_ACCESS.md)
- Discord HOLD
- Operator docs: [`docs/PAYWALL.md`](docs/PAYWALL.md) · [`docs/APPROVAL.md`](docs/APPROVAL.md) · [`CHANNELS.md`](CHANNELS.md) · [`SUPERCOOL_SHOP_LISTING.md`](SUPERCOOL_SHOP_LISTING.md)

