# DEVELOPER ACCESS — 8-hour follow pass (`cca_` key)

STATUS=LANDING | STRIPE_LIVE=off | LIVE_TRADING=false | GENERATE=off | Discord HOLD

Paper-safe login credential. **Not a wallet. Not live trading. Not CLOB margin.**

Anyone who follows X `@contentctv` / `@ContentCTV` (see `FOLLOW_HANDLE` / `FOLLOW_INTENT` in `src/lib/flags.ts`) can claim one 8-hour `cca_` key. Commercial upsell is the Supercool kit and the GitHub Pages paywall. Buy kit $47 stays `href="#"`. Do not invent a `buy.stripe.com` URL.

## Operator flow

1. Visitor opens [Follow @ContentCTV](https://x.com/intent/follow?screen_name=ContentCTV).
2. Visitor signs in with X on `/login`, then attests the follow on `/pass`.
3. Visitor claims **DEVELOPER ACCESS** on `/dev-access` (also offered on `/pass`).
4. App shows a `cca_…` key **once**. Hash is stored. Plaintext is not logged.
5. Key expires 8 hours after claim. Re-claim while active does not mint a second key.
6. After expiry, follow-pass credits may still apply; the portable login key does not. Upsell:

   - Supercool kit $47: https://supercool.com/@codybearstudio/product/2036581b-09df-4e3e-bea0-9bfcdd0d4cba
   - Pages paywall: https://contentctv.github.io/codybeartv-ai-POLYMARKET-HOLDEM/
   - Stripe Buy kit: still `#` until a human pastes `STRIPE_LINK $47`

HITL: a human may also issue a `cca_` tuition login. This 8-hour path is the free follow gate, not a paid seat.

## What the key is

| Is | Is not |
|---|---|
| `cca_` login credential | Wallet, seed, or payout rail |
| 8-hour paper developer access | Live CLOB, margin, or spending |
| Bound to follow attestation | Discord (HOLD) |
| Hash-at-rest, HITL | Stripe live charge |

`LIVE_TRADING` stays `false`. Claim/verify refuse to run if that gate is ever lifted without a named card. `GENERATE=off`. Desk collection stays disabled. Paid desk / MBA seats are unchanged.

## Hard stops

- Do not mint a second auth system. Claim requires the existing X session + follow pass.
- Do not treat Bitcoin Jungle / Fountain as access.
- Do not enable Pages Stripe from this card. `STRIPE_LIVE=off`.
- Do not stand Discord.
- Do not send CLOB. Felt pot stays paper.

Sibling landing on `codybear-ai` PR #73 squash-merged as `f1ad44df`.

## Financial Engineering Notice

Education and a paper table. Not an offer of securities. Access is a kit or tuition. `cca_` is a login credential. LIVE_TRADING=false. Bitcoin Jungle is propina, not a purchase. CODYBEARTV GLOBAL MEDIA STUDIOS LIMITADA
