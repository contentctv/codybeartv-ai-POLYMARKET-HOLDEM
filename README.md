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

- Buy kit $47 stays `href="#"` until a human pastes `STRIPE_LINK`
- Discord HOLD
- Operator docs: [`docs/PAYWALL.md`](docs/PAYWALL.md) · [`docs/APPROVAL.md`](docs/APPROVAL.md) · [`CHANNELS.md`](CHANNELS.md) · [`SUPERCOOL_SHOP_LISTING.md`](SUPERCOOL_SHOP_LISTING.md)

