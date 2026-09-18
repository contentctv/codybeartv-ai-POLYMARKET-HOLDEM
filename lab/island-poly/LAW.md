# ISLAND-POLY LAW — PAPER ONLY

**Status:** `LIVE_TRADING=false` forever in code until `GATE_LIFT` · no CLOB keys · **$0 burn**  
**Lab:** `lab/island-poly/` · branch target `paper/island-poly-complete-set`  
Not financial advice. Not live trading. Never Enable Trading.

## Resolution (VERIFY ON CARD)

1. **Market card Resolution Source outranks blog / social / secondary writeups.**
2. Crypto Up/Down markets: **Chainlink TWAP** windows — VERIFY ON CARD:
   - ~5m markets → typically ~30s TWAP window (confirm on card)
   - ~15m / ~4h markets → typically ~60s TWAP window (confirm on card)
3. Do not invent resolution rules. If the card and a blog disagree, **the card wins**.

## Two subsidy rails (do NOT mix)

| Rail | What it is | How this lab treats it |
| --- | --- | --- |
| **Maker Rebates** | Maker rebate program | Measured rebate only; unknown → `rebate=0` → refuse combined > `target_combined_cost` (default **0.92**). Combined > $1 only when **MEASURED** rebate covers excess. Docs: https://docs.polymarket.com/market-makers/maker-rebates |
| **Liquidity Rewards** | Separate liquidity reward program | Documented education constants only (`C_TARGET_LIQUIDITY_REWARD_ADJ=1.02`, subsidy band 0.5%–3%). **Never** live-fetched or mixed into Maker Rebates math. |

Teaching `paper_sim` may use `fee_buffer=0.01` + `teaching_rebate=0.015` for locked paper PnL — that teaching rebate is **NOT** a live Maker Rebates quote.

## Archetypes

| Code | Name | Behavior this pass |
| --- | --- | --- |
| **BR** | Ceiling / bankroll | Risk envelope only — **no sniper**, no live aggression |
| **BOX** | Async complete-set | Two-sided POST_ONLY_MAKER under VWAP_up + VWAP_down ≤ C_target; regime by Δt |
| **MM** | Market-maker switch | ~70% directional inventory → switch toward **90%+ matched** regime |
| **AL** | Balanced | **90%+** balance; remainder light / rest |

Mode locked: **POST_ONLY_MAKER** only. No createAndPostOrder. No signed POST.

## Regime by Δt (time to resolution)

| Δt | Mode |
| --- | --- |
| ≤ 5 minutes | **skew** |
| 5m – 1h | **transition** |
| ≥ 1 hour | **parity** |

## HARD LOCK — GATE_LIFT

Lift is **not** flipping an env var casually. Gate requires **all** of:

1. Explicit **`GATE_LIFT LIVE_TRADING`** operator act (out of band — this lab never auto-lifts)
2. **20 scored cycles** in `cycles.csv` (`PASS_COUNT N/20`)
3. Mean **Brier ≤ 0.25**

Until then: `LIVE_TRADING=false` in code; any attempt to set True raises `RuntimeError`.

## Never

- Enable Trading / CLOB API keys / private keys / API secrets
- Signed POST / `createAndPostOrder` / live sniper this pass
- Unaudited P&L ads or claiming live Liquidity Rewards / Maker Rebates without measured verification
- Mixing the two subsidy rails
- Putting HOLDEM lab code inside the `island_poly` package tree
