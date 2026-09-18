"""ISLAND-POLY AsyncCompleteSetManager — PAPER ONLY ($0 burn).

POST_ONLY_MAKER quote intent only. No CLOB keys. No Enable Trading.
No createAndPostOrder. No signed POST. LIVE_TRADING is hard-locked False.

Two subsidy rails (do NOT mix):
  1) Maker Rebates — https://docs.polymarket.com/market-makers/maker-rebates
  2) Liquidity Rewards — documented education constants only (not live API)

Teaching default: target_combined_cost = 0.92 (VWAP_up + VWAP_down ≤ C_target).
Combined > $1 only when a MEASURED rebate covers the excess; unknown rebate → 0
→ refuse combined > target_combined_cost.
"""

from __future__ import annotations

import sys
import types
from dataclasses import dataclass, field
from enum import Enum
from typing import Literal, Optional, Union


# ---------------------------------------------------------------------------
# LIVE_TRADING hard lock (module attribute cannot be set True)
# ---------------------------------------------------------------------------

LIVE_TRADING: bool = False


class _IslandPolyModule(types.ModuleType):
    """Module subclass that freezes LIVE_TRADING at False forever."""

    def __setattr__(self, name: str, value: object) -> None:
        if name == "LIVE_TRADING":
            if value:
                raise RuntimeError(
                    "LIVE_TRADING cannot be set True — PAPER ONLY until "
                    "GATE_LIFT LIVE_TRADING + 20 scored cycles + Brier≤0.25"
                )
            # Stay False forever — ignore attempts to "set False" as no-ops
            return super().__setattr__(name, False)
        return super().__setattr__(name, value)


sys.modules[__name__].__class__ = _IslandPolyModule


# ---------------------------------------------------------------------------
# Documented constants (NOT live-fetched)
# ---------------------------------------------------------------------------

# Teaching complete-set target (stricter than $1 redeem parity).
C_TARGET_TEACHING: float = 0.92
TARGET_COMBINED_COST: float = C_TARGET_TEACHING

# Base redeem parity (UP+DOWN → $1). Liquidity-reward-adjusted band is a
# documented constant only — never claimed from a live reward API here.
C_TARGET_BASE: float = 1.0
C_TARGET_LIQUIDITY_REWARD_ADJ: float = 1.02  # education constant only

# Liquidity Rewards subsidy band (fraction of notional) — illustrative only.
LIQUIDITY_REWARD_SUBSIDY_BAND_LOW: float = 0.005
LIQUIDITY_REWARD_SUBSIDY_BAND_HIGH: float = 0.03
LIQUIDITY_REWARD_SUBSIDY_ASSUMED: float = 0.02

# Maker Rebates rail — separate from Liquidity Rewards. Unknown → 0.
MAKER_REBATE_UNKNOWN: float = 0.0
# Teaching rebate used ONLY by paper_sim locked_pnl (NOT a live quote).
TEACHING_REBATE: float = 0.015
FEE_BUFFER: float = 0.01

# Regime thresholds by time-to-resolution Δt
DT_SKEW_MAX_SEC: float = 5 * 60  # ≤ 5m → skew
DT_PARITY_MIN_SEC: float = 60 * 60  # ≥ 1h → parity

DEFAULT_QUOTE_SIZE_USDC: float = 2.30
CONCURRENT_EXPOSURE_MAX_PCT: float = 0.20
DEFAULT_PAPER_BANKROLL_USDC: float = 116.0

# Archetype matched-share thresholds
MM_DIR_SHARE: float = 0.70  # MM: until ~70% directional, then switch
MM_MATCHED_SWITCH: float = 0.90  # MM: → 90%+ matched regime
AL_BALANCE_MIN: float = 0.90  # AL: 90%+ balance, rest opportunistic


class Mode(str, Enum):
    """Quote mode — POST_ONLY_MAKER only in this paper lab."""

    POST_ONLY_MAKER = "POST_ONLY_MAKER"


class Archetype(str, Enum):
    """Operator archetype (BR = ceiling only — no sniper this pass)."""

    BR = "BR"  # ceiling / risk envelope only — no sniper
    BOX = "BOX"  # async complete-set
    MM = "MM"  # 70% dir → 90%+ matched regime switch
    AL = "AL"  # 90%+ balance, rest


class Regime(str, Enum):
    SKEW = "skew"
    TRANSITION = "transition"
    PARITY = "parity"


class QuoteSide(str, Enum):
    UP = "UP"
    DOWN = "DOWN"


class SubsidyRail(str, Enum):
    """Two rails — never mix numbers across rails."""

    MAKER_REBATES = "maker_rebates"
    LIQUIDITY_REWARDS = "liquidity_rewards"


@dataclass(frozen=True)
class BookLeg:
    side: QuoteSide
    bid: float
    ask: float
    mid: float
    size_available: float = 0.0


@dataclass(frozen=True)
class CompleteSetBookTick:
    market_slug: str
    up: BookLeg
    down: BookLeg
    dt_seconds: float
    ts_iso: str = ""


@dataclass(frozen=True)
class QuoteIntent:
    """POST_ONLY paper quote intent — never posted to CLOB."""

    side: QuoteSide
    limit_price: float
    size_usdc: float
    post_only: Literal[True] = True
    mode: Mode = Mode.POST_ONLY_MAKER
    regime: Regime = Regime.PARITY
    archetype: Archetype = Archetype.BOX
    reason: str = ""
    c_target: float = C_TARGET_TEACHING


@dataclass
class PaperFill:
    side: QuoteSide
    price: float
    size_usdc: float
    shares: float
    regime: Regime
    ts_iso: str = ""
    post_only: bool = True
    archetype: Archetype = Archetype.BOX


@dataclass
class InventoryState:
    """VWAP inventory for one complete-set market."""

    up_shares: float = 0.0
    up_cost: float = 0.0
    down_shares: float = 0.0
    down_cost: float = 0.0

    @property
    def vwap_up(self) -> float:
        if self.up_shares <= 0:
            return 0.0
        return self.up_cost / self.up_shares

    @property
    def vwap_down(self) -> float:
        if self.down_shares <= 0:
            return 0.0
        return self.down_cost / self.down_shares

    @property
    def paired_shares(self) -> float:
        return min(self.up_shares, self.down_shares)

    @property
    def combined_vwap(self) -> float:
        if self.paired_shares <= 0:
            return 0.0
        return self.vwap_up + self.vwap_down

    @property
    def matched_fraction(self) -> float:
        total = self.up_shares + self.down_shares
        if total <= 0:
            return 0.0
        return (2.0 * self.paired_shares) / total

    def locked_pnl(
        self,
        c_redeem: float = 1.0,
        *,
        fee_buffer: float = 0.0,
        maker_rebate: float = 0.0,
    ) -> float:
        """Paired complete-set locked PnL (paper model).

        Per paired share: redeem c_redeem, cost = combined VWAP + fee_buffer
        − maker_rebate (Maker Rebates rail only; do not mix with Liquidity Rewards).
        Unpaired inventory marked 0 (conservative paper).
        """
        paired = self.paired_shares
        if paired <= 0:
            return 0.0
        cost_per = self.vwap_up + self.vwap_down + fee_buffer - maker_rebate
        return round(paired * (c_redeem - cost_per), 6)

    def notional_exposure(self) -> float:
        return self.up_cost + self.down_cost


@dataclass
class AsyncCompleteSetManager:
    """PAPER complete-set VWAP inventory · POST_ONLY_MAKER · regime by Δt.

    Loop: on_book_tick → evaluate_quote → apply_paper_fill → locked_pnl / hold().
    Hard-gated: LIVE_TRADING forever False; no CLOB keys; $0 burn.
    """

    c_target: float = C_TARGET_TEACHING
    target_combined_cost: float = TARGET_COMBINED_COST
    use_liquidity_reward_adj: bool = False
    # Maker Rebates rail — unknown defaults to 0 (refuse combined > target).
    measured_maker_rebate: Optional[float] = None
    archetype: Archetype = Archetype.BOX
    mode: Mode = Mode.POST_ONLY_MAKER
    inventory: InventoryState = field(default_factory=InventoryState)
    fill_ledger: list[PaperFill] = field(default_factory=list)
    killed: bool = False
    kill_reason: str = ""
    holding: bool = False
    hold_reason: str = ""
    paper_bankroll_usdc: float = DEFAULT_PAPER_BANKROLL_USDC
    _quote_size_usdc: float = DEFAULT_QUOTE_SIZE_USDC

    def __post_init__(self) -> None:
        if LIVE_TRADING:
            raise RuntimeError("AsyncCompleteSetManager refuses LIVE_TRADING path")
        if self.mode != Mode.POST_ONLY_MAKER:
            raise RuntimeError("only POST_ONLY_MAKER mode is allowed in this paper lab")
        if self.use_liquidity_reward_adj:
            # Documented constant only — still paper; Liquidity Rewards rail.
            self.c_target = C_TARGET_LIQUIDITY_REWARD_ADJ

    # ----- LIVE / hold gates -----

    def assert_paper(self) -> None:
        if LIVE_TRADING:
            raise RuntimeError("LIVE_TRADING True is illegal in lab/island-poly")
        if self.holding:
            raise RuntimeError(f"HOLD POLY PAPER: {self.hold_reason or 'held'}")

    def hold(self, reason: str = "HOLD POLY PAPER") -> None:
        """Freeze quoting / fills — HOLD POLY PAPER."""
        self.holding = True
        self.hold_reason = reason

    def release_hold(self) -> None:
        """Clear paper hold (still LIVE_TRADING=false)."""
        self.holding = False
        self.hold_reason = ""

    # ----- regime / archetype -----

    @staticmethod
    def regime_for_dt(dt_seconds: float) -> Regime:
        if dt_seconds <= DT_SKEW_MAX_SEC:
            return Regime.SKEW
        if dt_seconds >= DT_PARITY_MIN_SEC:
            return Regime.PARITY
        return Regime.TRANSITION

    def effective_c_target(self) -> float:
        if self.use_liquidity_reward_adj:
            return C_TARGET_LIQUIDITY_REWARD_ADJ
        return self.c_target if self.c_target > 0 else C_TARGET_TEACHING

    def effective_maker_rebate(self) -> float:
        """Maker Rebates rail only. Unknown → 0 (never invent a live quote)."""
        if self.measured_maker_rebate is None:
            return MAKER_REBATE_UNKNOWN
        return float(self.measured_maker_rebate)

    def allows_combined(self, combined: float) -> bool:
        """Refuse combined > target unless MEASURED maker rebate covers excess.

        Combined > $1 only when measured rebate covers (combined - 1).
        Do NOT mix Liquidity Rewards constants into this check.
        """
        rebate = self.effective_maker_rebate()
        tgt = self.target_combined_cost
        if combined <= tgt + 1e-9:
            return True
        # Above teaching target: only OK if measured rebate covers excess vs $1
        # redeem floor when combined > 1, or vs target when target < combined ≤ 1.
        if combined > 1.0 + 1e-9:
            excess = combined - 1.0
            return rebate + 1e-9 >= excess
        # Between target and 1.0: require measured rebate covering (combined - tgt)
        return rebate + 1e-9 >= (combined - tgt)

    # ----- risk / kill -----

    def kill(self, reason: str) -> None:
        self.killed = True
        self.kill_reason = reason

    def _max_trade_usdc(self) -> float:
        return self.paper_bankroll_usdc * 0.05

    def _concurrent_cap_usdc(self) -> float:
        return self.paper_bankroll_usdc * CONCURRENT_EXPOSURE_MAX_PCT

    def _size_ok(self, size_usdc: float) -> bool:
        if size_usdc <= 0:
            return False
        if size_usdc > self._max_trade_usdc() + 1e-9:
            return False
        if self.inventory.notional_exposure() + size_usdc > self._concurrent_cap_usdc() + 1e-9:
            return False
        return True

    def check_kill_switches(self, daily_pnl: float = 0.0) -> bool:
        bankroll = self.paper_bankroll_usdc
        halt = -0.15 * bankroll
        if daily_pnl <= halt:
            self.kill(
                f"circuit breaker: 24h drawdown {daily_pnl:.2f} exceeds "
                f"15% of ${bankroll:.2f}"
            )
            return False
        if self.inventory.notional_exposure() > self._concurrent_cap_usdc() + 1e-9:
            self.kill("concurrent exposure > 20% bankroll")
            return False
        return not self.killed

    # ----- paper loop -----

    def on_book_tick(
        self,
        tick: CompleteSetBookTick,
        *,
        daily_pnl: float = 0.0,
    ) -> list[QuoteIntent]:
        """Ingest paired book tick; return POST_ONLY_MAKER intents (may be empty)."""
        self.assert_paper()
        if self.killed or self.holding:
            return []
        if not self.check_kill_switches(daily_pnl=daily_pnl):
            return []
        # BR = ceiling only — no sniper, no quotes this pass.
        if self.archetype == Archetype.BR:
            return []
        return self.evaluate_quote(tick)

    def evaluate_quote(self, tick: CompleteSetBookTick) -> list[QuoteIntent]:
        """Produce POST_ONLY_MAKER quote intents under VWAP + C_target + regime."""
        self.assert_paper()
        if self.killed or self.holding:
            return []
        if self.archetype == Archetype.BR:
            return []

        regime = self.regime_for_dt(tick.dt_seconds)
        # Archetype may force regime flavor
        regime = self._archetype_regime(regime)
        c_tgt = self.effective_c_target()
        size = min(self._quote_size_usdc, self._max_trade_usdc())
        intents: list[QuoteIntent] = []

        up_bid = min(tick.up.bid, tick.up.ask - 1e-4) if tick.up.ask > tick.up.bid else tick.up.bid
        down_bid = (
            min(tick.down.bid, tick.down.ask - 1e-4)
            if tick.down.ask > tick.down.bid
            else tick.down.bid
        )
        up_bid = max(0.01, min(up_bid, 0.99))
        down_bid = max(0.01, min(down_bid, 0.99))

        proj_up = self._projected_vwap(
            self.inventory.up_shares, self.inventory.up_cost, up_bid, size
        )
        proj_down = self._projected_vwap(
            self.inventory.down_shares, self.inventory.down_cost, down_bid, size
        )
        proj_combined = proj_up + proj_down

        if not self.allows_combined(proj_combined) and regime == Regime.PARITY:
            intents.extend(self._skew_toward_constraint(tick, regime, c_tgt, size))
            return [q for q in intents if q.post_only and self._size_ok(q.size_usdc)]

        if regime == Regime.PARITY:
            if self.allows_combined(proj_combined):
                if self._size_ok(size):
                    intents.append(
                        QuoteIntent(
                            side=QuoteSide.UP,
                            limit_price=round(up_bid, 4),
                            size_usdc=round(size, 2),
                            regime=regime,
                            archetype=self.archetype,
                            reason="parity two-sided UP POST_ONLY_MAKER",
                            c_target=c_tgt,
                        )
                    )
                if self._size_ok(size):
                    intents.append(
                        QuoteIntent(
                            side=QuoteSide.DOWN,
                            limit_price=round(down_bid, 4),
                            size_usdc=round(size, 2),
                            regime=regime,
                            archetype=self.archetype,
                            reason="parity two-sided DOWN POST_ONLY_MAKER",
                            c_target=c_tgt,
                        )
                    )
            else:
                intents.extend(self._skew_toward_constraint(tick, regime, c_tgt, size))
        elif regime == Regime.SKEW:
            intents.extend(self._skew_toward_constraint(tick, regime, c_tgt, size))
        else:  # TRANSITION
            if self.allows_combined(proj_combined) and self._size_ok(size):
                intents.append(
                    QuoteIntent(
                        side=QuoteSide.UP,
                        limit_price=round(up_bid, 4),
                        size_usdc=round(size, 2),
                        regime=regime,
                        archetype=self.archetype,
                        reason="transition UP POST_ONLY_MAKER",
                        c_target=c_tgt,
                    )
                )
                intents.append(
                    QuoteIntent(
                        side=QuoteSide.DOWN,
                        limit_price=round(down_bid, 4),
                        size_usdc=round(size, 2),
                        regime=regime,
                        archetype=self.archetype,
                        reason="transition DOWN POST_ONLY_MAKER",
                        c_target=c_tgt,
                    )
                )
            else:
                intents.extend(self._skew_toward_constraint(tick, regime, c_tgt, size))

        return [q for q in intents if q.post_only and self._size_ok(q.size_usdc)]

    def _archetype_regime(self, base: Regime) -> Regime:
        """Apply archetype overlay on top of Δt regime."""
        inv = self.inventory
        matched = inv.matched_fraction
        if self.archetype == Archetype.BOX:
            return base  # async complete-set — follow Δt
        if self.archetype == Archetype.MM:
            # 70% directional → switch toward matched / parity at 90%+
            if matched >= MM_MATCHED_SWITCH:
                return Regime.PARITY
            total = inv.up_shares + inv.down_shares
            if total > 0:
                dir_share = abs(inv.up_shares - inv.down_shares) / total
                if dir_share >= (1.0 - MM_DIR_SHARE):  # heavily one-sided
                    return Regime.SKEW
            return base
        if self.archetype == Archetype.AL:
            # 90%+ balance; rest light
            if matched >= AL_BALANCE_MIN:
                return Regime.PARITY
            return Regime.SKEW if matched < 0.5 else Regime.TRANSITION
        return base  # BR handled earlier (no quotes)

    def _skew_toward_constraint(
        self,
        tick: CompleteSetBookTick,
        regime: Regime,
        c_tgt: float,
        size: float,
    ) -> list[QuoteIntent]:
        inv = self.inventory
        up_heavy = inv.up_shares > inv.down_shares + 1e-9
        down_heavy = inv.down_shares > inv.up_shares + 1e-9

        if up_heavy:
            prefer = QuoteSide.DOWN
            price = min(tick.down.bid, max(0.01, c_tgt - (inv.vwap_up or tick.up.mid)))
        elif down_heavy:
            prefer = QuoteSide.UP
            price = min(tick.up.bid, max(0.01, c_tgt - (inv.vwap_down or tick.down.mid)))
        else:
            if not self.allows_combined(tick.up.mid + tick.down.mid):
                return []
            if tick.up.mid <= tick.down.mid:
                prefer = QuoteSide.UP
                price = tick.up.bid
            else:
                prefer = QuoteSide.DOWN
                price = tick.down.bid

        price = max(0.01, min(round(price, 4), 0.99))
        if not self._size_ok(size):
            return []

        if prefer == QuoteSide.UP:
            other = inv.vwap_down if inv.down_shares > 0 else tick.down.mid
            proj = self._projected_vwap(inv.up_shares, inv.up_cost, price, size)
            if not self.allows_combined(proj + other):
                return []
        else:
            other = inv.vwap_up if inv.up_shares > 0 else tick.up.mid
            proj = self._projected_vwap(inv.down_shares, inv.down_cost, price, size)
            if not self.allows_combined(other + proj):
                return []

        return [
            QuoteIntent(
                side=prefer,
                limit_price=price,
                size_usdc=round(size, 2),
                regime=regime,
                archetype=self.archetype,
                reason=f"{regime.value} skew {prefer.value} POST_ONLY_MAKER",
                c_target=c_tgt,
            )
        ]

    @staticmethod
    def _projected_vwap(
        shares: float, cost: float, fill_price: float, size_usdc: float
    ) -> float:
        if fill_price <= 0 or size_usdc <= 0:
            return cost / shares if shares > 0 else 0.0
        add_shares = size_usdc / fill_price
        new_shares = shares + add_shares
        new_cost = cost + size_usdc
        return new_cost / new_shares if new_shares > 0 else 0.0

    def apply_paper_fill(
        self,
        intent: QuoteIntent,
        *,
        fill_price: Optional[float] = None,
        shares: Optional[float] = None,
        ts_iso: str = "",
    ) -> PaperFill:
        """Record a paper maker fill. No network. Share- or USDC-sized."""
        self.assert_paper()
        if not intent.post_only or intent.mode != Mode.POST_ONLY_MAKER:
            raise RuntimeError("only POST_ONLY_MAKER intents accepted in paper ledger")
        if LIVE_TRADING:
            raise RuntimeError("live posts are never allowed in this PAPER scaffold")

        price = float(fill_price if fill_price is not None else intent.limit_price)
        if shares is not None:
            sh = float(shares)
            size_usdc = sh * price
        else:
            size_usdc = intent.size_usdc
            sh = size_usdc / price if price > 0 else 0.0

        fill = PaperFill(
            side=intent.side,
            price=price,
            size_usdc=size_usdc,
            shares=sh,
            regime=intent.regime,
            ts_iso=ts_iso,
            post_only=True,
            archetype=intent.archetype,
        )
        if intent.side == QuoteSide.UP:
            self.inventory.up_shares += sh
            self.inventory.up_cost += size_usdc
        else:
            self.inventory.down_shares += sh
            self.inventory.down_cost += size_usdc
        self.fill_ledger.append(fill)
        return fill

    def record_share_fill(
        self,
        side: Union[QuoteSide, str],
        price: float,
        shares: float,
        *,
        regime: Regime = Regime.PARITY,
        ts_iso: str = "",
    ) -> PaperFill:
        """Direct paper fill by share count (used by paper_sim BONES seat)."""
        self.assert_paper()
        side_e = QuoteSide(side) if not isinstance(side, QuoteSide) else side
        intent = QuoteIntent(
            side=side_e,
            limit_price=price,
            size_usdc=round(shares * price, 6),
            regime=regime,
            archetype=self.archetype,
            reason="paper_sim share fill",
            c_target=self.effective_c_target(),
        )
        return self.apply_paper_fill(intent, fill_price=price, shares=shares, ts_iso=ts_iso)

    def locked_pnl(
        self,
        *,
        fee_buffer: float = FEE_BUFFER,
        maker_rebate: Optional[float] = None,
    ) -> float:
        """Paired locked PnL at $1 redeem (paper).

        Default fee_buffer=0.01. Maker rebate: measured if set, else 0
        (unknown). paper_sim may pass TEACHING_REBATE explicitly — that is
        NOT a live rebate quote.
        """
        if maker_rebate is None:
            rebate = self.effective_maker_rebate()
        else:
            rebate = float(maker_rebate)
        return self.inventory.locked_pnl(
            c_redeem=1.0, fee_buffer=fee_buffer, maker_rebate=rebate
        )

    def constraint_ok(self) -> bool:
        if self.inventory.paired_shares <= 0:
            return True
        return self.allows_combined(self.inventory.combined_vwap)


__all__ = [
    "AL_BALANCE_MIN",
    "Archetype",
    "AsyncCompleteSetManager",
    "BookLeg",
    "C_TARGET_BASE",
    "C_TARGET_LIQUIDITY_REWARD_ADJ",
    "C_TARGET_TEACHING",
    "CompleteSetBookTick",
    "CONCURRENT_EXPOSURE_MAX_PCT",
    "DT_PARITY_MIN_SEC",
    "DT_SKEW_MAX_SEC",
    "FEE_BUFFER",
    "InventoryState",
    "LIVE_TRADING",
    "LIQUIDITY_REWARD_SUBSIDY_ASSUMED",
    "LIQUIDITY_REWARD_SUBSIDY_BAND_HIGH",
    "LIQUIDITY_REWARD_SUBSIDY_BAND_LOW",
    "MAKER_REBATE_UNKNOWN",
    "MM_DIR_SHARE",
    "MM_MATCHED_SWITCH",
    "Mode",
    "PaperFill",
    "QuoteIntent",
    "QuoteSide",
    "Regime",
    "SubsidyRail",
    "TARGET_COMBINED_COST",
    "TEACHING_REBATE",
]
