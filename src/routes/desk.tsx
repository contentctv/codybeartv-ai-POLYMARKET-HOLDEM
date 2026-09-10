import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { enqueueHitl, getGate, listHitl, type GateView } from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RAILS = [
  "x_money",
  "paypal",
  "cash_app",
  "bitcoin_jungle_lightning",
  "sinpe_movil",
  "usdc_receipt",
  "eip1193",
  "http_402",
] as const;

export const Route = createFileRoute("/desk")({ component: Desk });

function Desk() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof listHitl>>>([]);
  const [rail, setRail] = useState<(typeof RAILS)[number]>("sinpe_movil");
  const [kind, setKind] = useState<"payment" | "withdraw" | "refund" | "post">("payment");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  function reload() {
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
    listHitl()
      .then(setQueue)
      .catch(() => setQueue([]));
  }

  useEffect(() => {
    if (user) reload();
  }, [user]);

  if (isPending) return <div className="h-32 animate-pulse rounded-xl bg-felt-2" />;
  if (!user) return <RedirectToSignIn />;

  const locked = !gate?.deskUnlocked;

  return (
    <div className="space-y-6">
      <Badge variant="muted">desk_collection=disabled</Badge>
      <h1 className="font-display text-4xl">Desk</h1>
      <p className="max-w-2xl text-cream/80">
        Collection is disabled. Rails B/C stay HITL until secrets exist. No invented invoices, bank
        numbers, or buy.stripe.com URLs. Human approval on every payment, post, withdraw, and refund.
      </p>
      {locked ? (
        <p className="text-ember">Desk unlocks with the 24-hour suite or Entrepreneur pass.</p>
      ) : null}
      <form
        className="grid gap-3 rounded-xl border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          enqueueHitl({ data: { kind, rail, note, amountLabel: note } })
            .then((r) => {
              setMsg(`Queued #${r.id} — pending human`);
              reload();
            })
            .catch((err: Error) => setMsg(err.message));
        }}
      >
        <Label htmlFor="kind">Kind</Label>
        <select
          id="kind"
          className="h-11 rounded-md border border-border bg-felt px-3 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="payment">Payment</option>
          <option value="withdraw">Withdraw</option>
          <option value="refund">Refund</option>
          <option value="post">Post</option>
        </select>
        <Label htmlFor="rail">Rail</Label>
        <select
          id="rail"
          className="h-11 rounded-md border border-border bg-felt px-3 text-sm"
          value={rail}
          onChange={(e) => setRail(e.target.value as typeof rail)}
        >
          {RAILS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Label htmlFor="note">Note (SINPE CBTV-######, USDC receipt hash, etc.)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Human-readable only" />
        <Button type="submit" disabled={locked}>
          Queue HITL
        </Button>
        {msg ? <p className="text-sm text-teal">{msg}</p> : null}
      </form>
      <ul className="space-y-2 font-mono text-xs">
        {queue.map((q) => (
          <li key={q.id} className="rounded-md border border-border px-3 py-2">
            #{q.id} {q.kind} · {q.rail} · {q.status}
            {q.amount_label ? ` · ${q.amount_label}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
