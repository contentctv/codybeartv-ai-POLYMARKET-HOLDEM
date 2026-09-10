import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "./PlayingCard";
import {
  applyAction,
  legalActions,
  maxRaiseTo,
  minRaiseTo,
  newTable,
  runBots,
  startHand,
} from "@/lib/holdem/engine";
import { livePot } from "@/lib/holdem/pots";
import type { PlayerAction, SeatPlayer, TableState } from "@/lib/holdem/types";
import { writeCycle } from "@/lib/server/fns";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { formatChips } from "@/lib/utils";
import { BIG_BLIND } from "@/lib/flags";

const SEAT_POS: Record<number, string> = {
  0: "bottom-14 left-1/2 -translate-x-1/2 sm:bottom-2",
  1: "bottom-16 right-0 sm:right-8",
  2: "top-6 right-0 sm:top-14 sm:right-10",
  3: "top-0 left-1/2 -translate-x-1/2",
  4: "top-6 left-0 sm:top-14 sm:left-10",
  5: "bottom-16 left-0 sm:left-8",
};

function Seat({
  p,
  acting,
  hideHole,
}: {
  p: SeatPlayer;
  acting: boolean;
  hideHole: boolean;
}) {
  return (
    <div className={`absolute z-10 w-[6.5rem] sm:w-28 ${SEAT_POS[p.seat]}`}>
      <div
        className={`rounded-lg border px-2 py-1.5 ${
          acting ? "border-ember bg-felt" : "border-border bg-felt-2/90"
        } ${p.folded ? "opacity-40" : ""}`}
      >
        <div className="flex items-center gap-2">
          {p.portrait ? (
            <img
              src={p.portrait}
              alt=""
              className="size-8 rounded-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="size-8 rounded-full bg-ember/30" />
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{p.name}</p>
            <p className="font-mono text-[10px] text-teal">{formatChips(p.stack)}</p>
          </div>
        </div>
        <div className="mt-1 flex justify-center gap-1">
          {p.hole ? (
            <>
              <PlayingCard card={p.hole[0]} hidden={hideHole && !p.isHero} />
              <PlayingCard card={p.hole[1]} hidden={hideHole && !p.isHero} />
            </>
          ) : null}
        </div>
        {p.betStreet > 0 ? (
          <p className="mt-1 text-center font-mono text-[10px] text-cream/80">in {p.betStreet}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FeltTable() {
  const user = useCurrentUser();
  const [table, setTable] = useState<TableState>(() => newTable());
  const [raiseTo, setRaiseTo] = useState(0);
  const heroTurn = table.toAct === 0 && table.street !== "complete";
  const acts = useMemo(() => (heroTurn ? legalActions(table) : []), [heroTurn, table]);

  useEffect(() => {
    if (table.street === "complete" && table.handId > 0 && user) {
      const pot = table.potAtShowdown;
      const committed = table.heroCommitted;
      const p = table.heroWins ? 1 : 0;
      const b = committed > 0 ? pot / committed - 1 : 0;
      const result = table.players.find((x) => x.isHero)?.folded
        ? "fold"
        : table.heroWins
          ? "win"
          : "lose";
      writeCycle({
        data: {
          potId: `h${table.handId}`,
          p: result === "fold" ? 0 : p,
          b: Math.max(b, 0),
          result,
        },
      }).catch(() => undefined);
    }
  }, [table.handId, table.street, user]);

  function deal() {
    let s = startHand(table);
    s = runBots(s);
    setTable(s);
    setRaiseTo(minRaiseTo(s));
  }

  function act(a: PlayerAction) {
    let s = applyAction(table, a);
    s = runBots(s);
    setTable(s);
    setRaiseTo(minRaiseTo(s));
  }

  const pot = livePot(table.players);
  const minR = minRaiseTo(table);
  const maxR = maxRaiseTo(table);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {table.street === "complete" ? (
        <Button onClick={deal}>{table.handId === 0 ? "Sit the table" : "Next hand"}</Button>
      ) : heroTurn ? (
        <>
          {acts.some((a) => a.type === "fold") ? (
            <Button variant="outline" onClick={() => act({ type: "fold" })}>
              Fold
            </Button>
          ) : null}
          {acts.some((a) => a.type === "check") ? (
            <Button variant="teal" onClick={() => act({ type: "check" })}>
              Check
            </Button>
          ) : null}
          {acts
            .filter((a) => a.type === "call")
            .map((a) => (
              <Button key="call" variant="teal" onClick={() => act(a)}>
                Call {a.amount}
              </Button>
            ))}
          {acts.some((a) => a.type === "bet" || a.type === "raise") ? (
            <>
              <input
                type="range"
                min={minR}
                max={maxR}
                value={Math.min(Math.max(raiseTo, minR), maxR) || minR}
                onChange={(e) => setRaiseTo(Number(e.target.value))}
                className="hidden min-w-0 flex-1 accent-ember md:block"
              />
              <Button
                onClick={() =>
                  act({
                    type: table.currentBet === 0 ? "bet" : "raise",
                    amount: Math.min(Math.max(raiseTo, minR), maxR),
                  })
                }
              >
                {table.currentBet === 0 ? "Bet" : "Raise"} {Math.min(Math.max(raiseTo, minR), maxR)}
              </Button>
            </>
          ) : null}
          {acts.some((a) => a.type === "allin") ? (
            <Button variant="outline" onClick={() => act({ type: "allin" })}>
              All-in
            </Button>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted">Waiting on the night table…</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="md:hidden">{actions}</div>
      <div className="relative mx-auto aspect-square w-full max-w-xl sm:aspect-[5/4]">
        <div className="felt-oval absolute inset-[8%] rounded-[50%]" />
        <div className="absolute left-1/2 top-1/2 z-10 flex w-[70%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {table.street} · pot {formatChips(pot)} · bb {BIG_BLIND}
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {table.board.map((c, i) => (
              <PlayingCard key={i} card={c} />
            ))}
          </div>
          <p className="text-center text-[11px] text-cream/70">Paper chips. No wallet on the felt.</p>
        </div>
        {table.players.map((p) => (
          <Seat
            key={p.id}
            p={p}
            acting={table.toAct === p.seat}
            hideHole={table.street !== "complete" && table.street !== "showdown"}
          />
        ))}
      </div>
      <div className="hidden md:block">{actions}</div>
      <ol className="max-h-32 overflow-auto font-mono text-[11px] text-muted">
        {table.log.slice(0, 12).map((l) => (
          <li key={l.id}>{l.text}</li>
        ))}
      </ol>
    </div>
  );
}
