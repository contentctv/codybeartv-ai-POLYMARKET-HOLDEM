"""Append-only cycle CSV for ISLAND-POLY paper gate tracking.

Default path: lab/island-poly/cycles.csv (beside this module).
Header exactly:
  cycle,ts,slug,p_hat,mid,gap,sim_fill,resolve,pnl,brier,archetype,mode

GATE_LIFT requires: LIVE_TRADING lift + 20 scored cycles + Brier≤0.25.
This lab keeps LIVE_TRADING=false forever in code until that gate.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Optional, Union

from complete_set import LIVE_TRADING

HEADER = [
    "cycle",
    "ts",
    "slug",
    "p_hat",
    "mid",
    "gap",
    "sim_fill",
    "resolve",
    "pnl",
    "brier",
    "archetype",
    "mode",
]

GATE_CYCLES_REQUIRED = 20
GATE_BRIER_MAX = 0.25

DEFAULT_CSV = Path(__file__).resolve().parent / "cycles.csv"


def ensure_csv(path: Optional[Path] = None) -> Path:
    """Create CSV with header only if missing or empty of header."""
    p = Path(path) if path else DEFAULT_CSV
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists() or p.stat().st_size == 0:
        with p.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER)
    return p


def append_cycle(row: dict[str, Any], path: Optional[Path] = None) -> Path:
    """Append one cycle row (keys must match HEADER). Append-only."""
    p = ensure_csv(path)
    # Refuse live path
    if LIVE_TRADING:
        raise RuntimeError("cycle_log refuses writes while LIVE_TRADING would be True")
    values = [row.get(h, "") for h in HEADER]
    with p.open("a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(values)
    return p


def read_cycles(path: Optional[Path] = None) -> list[dict[str, str]]:
    p = ensure_csv(path)
    with p.open("r", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != HEADER:
            # Allow exact header match only for gate scoring
            if list(reader.fieldnames or []) != HEADER:
                raise ValueError(
                    f"cycles.csv header mismatch: {reader.fieldnames} != {HEADER}"
                )
        return list(reader)


def scored_cycles(path: Optional[Path] = None) -> list[dict[str, str]]:
    """Cycles that have a numeric brier (scored)."""
    out: list[dict[str, str]] = []
    for row in read_cycles(path):
        b = (row.get("brier") or "").strip()
        if b == "":
            continue
        try:
            float(b)
        except ValueError:
            continue
        out.append(row)
    return out


def mean_brier(path: Optional[Path] = None) -> Optional[float]:
    rows = scored_cycles(path)
    if not rows:
        return None
    vals = [float(r["brier"]) for r in rows]
    return sum(vals) / len(vals)


def gate_status(path: Optional[Path] = None) -> dict[str, Any]:
    """Gate status dict (also usable as str via format).

    Blockers until GATE_LIFT LIVE_TRADING + 20 cycles + Brier≤0.25.
    LIVE_TRADING remains false in this paper lab.
    """
    scored = scored_cycles(path)
    n = len(scored)
    mb = mean_brier(path)
    blockers: list[str] = []

    live = bool(LIVE_TRADING)
    if live:
        blockers.append("LIVE_TRADING unexpectedly True — refuse")
    else:
        blockers.append("LIVE_TRADING false (need GATE_LIFT LIVE_TRADING)")

    if n < GATE_CYCLES_REQUIRED:
        blockers.append(f"scored cycles {n}/{GATE_CYCLES_REQUIRED}")
    if mb is None:
        blockers.append("no Brier scores yet")
    elif mb > GATE_BRIER_MAX:
        blockers.append(f"Brier {mb:.4f} > {GATE_BRIER_MAX}")

    passed = (
        (not live)
        and n >= GATE_CYCLES_REQUIRED
        and mb is not None
        and mb <= GATE_BRIER_MAX
    )
    # Even if paper metrics pass, LIVE_TRADING lift is external GATE_LIFT —
    # this lab never auto-lifts. Report as blocked while LIVE_TRADING false.
    gate_ready_metrics = (
        n >= GATE_CYCLES_REQUIRED and mb is not None and mb <= GATE_BRIER_MAX
    )

    status = {
        "PASS_COUNT": f"{n}/{GATE_CYCLES_REQUIRED}",
        "LIVE_TRADING": False,
        "mean_brier": mb,
        "brier_max": GATE_BRIER_MAX,
        "gate_ready_metrics": gate_ready_metrics,
        "GATE_LIFT": False,  # never auto-lift in this lab
        "blockers": blockers,
        "passed": False,  # hard: LIVE_TRADING stays false → not lifted
    }
    return status


def gate_status_str(path: Optional[Path] = None) -> str:
    s = gate_status(path)
    parts = [
        f"PASS_COUNT {s['PASS_COUNT']}",
        f"LIVE_TRADING {str(s['LIVE_TRADING']).lower()}",
        "blockers: " + "; ".join(s["blockers"]),
    ]
    return " | ".join(parts)


if __name__ == "__main__":
    ensure_csv()
    print(gate_status_str())
