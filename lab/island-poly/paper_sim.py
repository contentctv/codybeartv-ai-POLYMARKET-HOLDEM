#!/usr/bin/env python3
"""Deterministic 2-phase PAPER sim — BONES seat reference (no network).

Phase1: UP fill 500 @ 0.44
Phase2: DOWN fill 500 @ 0.45
→ matched 500, combined VWAP $0.89

Locked paper PnL uses fee_buffer 0.01 + teaching rebate 0.015
(NOT a live rebate quote). LIVE_TRADING stays false. $0 burn.

CLI:
  python3 paper_sim.py --check   # exit 0 + print PASS
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Local import (lab/island-poly is the cwd / sibling package path)
sys.path.insert(0, str(Path(__file__).resolve().parent))

from complete_set import (  # noqa: E402
    FEE_BUFFER,
    LIVE_TRADING,
    TEACHING_REBATE,
    Archetype,
    AsyncCompleteSetManager,
    QuoteSide,
)


# BONES seat reference constants (locked)
PHASE1_SIDE = QuoteSide.UP
PHASE1_SHARES = 500.0
PHASE1_PRICE = 0.44
PHASE2_SIDE = QuoteSide.DOWN
PHASE2_SHARES = 500.0
PHASE2_PRICE = 0.45
EXPECTED_MATCHED = 500.0
EXPECTED_COMBINED_VWAP = 0.89  # 0.44 + 0.45
# locked = matched * (1 - combined - fee_buffer + teaching_rebate)
#        = 500 * (1 - 0.89 - 0.01 + 0.015) = 500 * 0.115 = 57.5
EXPECTED_LOCKED_PNL = 57.5


def run_bones_seat() -> dict:
    """Run the deterministic 2-phase paper sim. No network."""
    if LIVE_TRADING:
        raise RuntimeError("paper_sim refuses LIVE_TRADING")

    mgr = AsyncCompleteSetManager(archetype=Archetype.BOX)

    # Phase 1 — UP fill 500 @ 0.44
    mgr.record_share_fill(PHASE1_SIDE, PHASE1_PRICE, PHASE1_SHARES, ts_iso="phase1")
    # Phase 2 — DOWN fill 500 @ 0.45
    mgr.record_share_fill(PHASE2_SIDE, PHASE2_PRICE, PHASE2_SHARES, ts_iso="phase2")

    inv = mgr.inventory
    matched = inv.paired_shares
    combined = inv.combined_vwap
    # Teaching rebate is paper-only — NOT a live Maker Rebates quote.
    locked = mgr.locked_pnl(fee_buffer=FEE_BUFFER, maker_rebate=TEACHING_REBATE)

    return {
        "matched": matched,
        "combined_vwap": round(combined, 6),
        "vwap_up": round(inv.vwap_up, 6),
        "vwap_down": round(inv.vwap_down, 6),
        "locked_pnl": locked,
        "fee_buffer": FEE_BUFFER,
        "teaching_rebate": TEACHING_REBATE,
        "live_trading": bool(LIVE_TRADING),
        "fills": len(mgr.fill_ledger),
    }


def check() -> int:
    """Assert BONES seat numbers; print PASS and return 0."""
    result = run_bones_seat()
    errors: list[str] = []

    if result["live_trading"] is not False:
        errors.append(f"LIVE_TRADING must be False, got {result['live_trading']}")
    if abs(result["matched"] - EXPECTED_MATCHED) > 1e-9:
        errors.append(f"matched={result['matched']} want {EXPECTED_MATCHED}")
    if abs(result["combined_vwap"] - EXPECTED_COMBINED_VWAP) > 1e-9:
        errors.append(
            f"combined_vwap={result['combined_vwap']} want {EXPECTED_COMBINED_VWAP}"
        )
    if abs(result["vwap_up"] - PHASE1_PRICE) > 1e-9:
        errors.append(f"vwap_up={result['vwap_up']} want {PHASE1_PRICE}")
    if abs(result["vwap_down"] - PHASE2_PRICE) > 1e-9:
        errors.append(f"vwap_down={result['vwap_down']} want {PHASE2_PRICE}")
    if abs(result["locked_pnl"] - EXPECTED_LOCKED_PNL) > 1e-6:
        errors.append(f"locked_pnl={result['locked_pnl']} want {EXPECTED_LOCKED_PNL}")
    if result["fills"] != 2:
        errors.append(f"fills={result['fills']} want 2")

    if errors:
        print("FAIL")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("PASS")
    print(
        f"  matched={result['matched']:.0f} "
        f"combined_vwap=${result['combined_vwap']:.2f} "
        f"locked_pnl=${result['locked_pnl']:.2f} "
        f"(fee_buffer={FEE_BUFFER} teaching_rebate={TEACHING_REBATE}) "
        f"LIVE_TRADING={result['live_trading']}"
    )
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="ISLAND-POLY paper_sim (PAPER ONLY)")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Run BONES seat assertions; exit 0 and print PASS",
    )
    args = parser.parse_args(argv)
    if args.check:
        return check()
    # Default: run and print summary
    result = run_bones_seat()
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
