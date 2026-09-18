# lab/island-poly — ISLAND-POLY complete-set PAPER

**PAPER ONLY · `LIVE_TRADING=false` · no CLOB keys · $0 burn · no Enable Trading**

Branch target: `paper/island-poly-complete-set`  
No live sniper this pass. Mode: **POST_ONLY_MAKER** only.

## Files

| File | Role |
| --- | --- |
| `complete_set.py` | `AsyncCompleteSetManager` — VWAP inventory, regimes, archetypes, paper ledger, `hold()` |
| `paper_sim.py` | Deterministic 2-phase BONES seat sim + `--check` |
| `cycle_log.py` | Append-only `cycles.csv` + `gate_status()` |
| `cycles.csv` | Header only until scored cycles are appended |
| `LAW.md` | Resolution, subsidy rails, archetypes, GATE_LIFT hard lock |

## Run paper_sim --check

```bash
cd lab/island-poly   # or: cd /workspace/holdem-island-poly-stage/lab/island-poly
python3 paper_sim.py --check
```

Expect exit code **0** and a line starting with **`PASS`**.

Reference seat (no network):

- Phase1: UP fill **500 @ 0.44**
- Phase2: DOWN fill **500 @ 0.45**
- → matched **500**, combined VWAP **$0.89**
- Locked paper PnL uses `fee_buffer=0.01` + teaching rebate `0.015` (**not** a live rebate quote)

## cycle_log

```bash
python3 -c "from cycle_log import ensure_csv, gate_status_str; ensure_csv(); print(gate_status_str())"
```

- Default CSV: `cycles.csv` beside this module (header exactly  
  `cycle,ts,slug,p_hat,mid,gap,sim_fill,resolve,pnl,brier,archetype,mode`)
- `gate_status()` → `PASS_COUNT N/20`, `LIVE_TRADING false`, blockers until  
  **GATE_LIFT LIVE_TRADING + 20 scored + Brier≤0.25**

## LIVE_TRADING=false

Module-level hard lock in `complete_set.py`: reading `LIVE_TRADING` is always `False`; assigning `True` raises `RuntimeError`. Do not invent keys. Do not Enable Trading.

## Teaching defaults

- `target_combined_cost` / `C_TARGET_TEACHING` = **0.92**
- Liquidity-reward-adjusted `C_TARGET_LIQUIDITY_REWARD_ADJ=1.02` is a **documented constant only** (not live API)
- Two subsidy rails stay separate — see `LAW.md`

## HOLD POLY PAPER

```python
from complete_set import AsyncCompleteSetManager
mgr = AsyncCompleteSetManager()
mgr.hold("HOLD POLY PAPER")  # freezes quotes/fills
```
