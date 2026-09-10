import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { LIVE_TRADING, KELLY_CAP, KELLY_FRACTION } from "@/lib/flags";
import { listCycles } from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/markets")({ component: Markets });

function Markets() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listCycles>>>([]);
  const [sealed, setSealed] = useState(false);

  useEffect(() => {
    if (!user) return;
    listCycles()
      .then(setRows)
      .catch(() => setSealed(true));
  }, [user]);

  if (isPending) return <div className="h-32 animate-pulse rounded-xl bg-felt-2" />;
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="space-y-6">
      <Badge variant="ember">Paper book · LIVE_TRADING={String(LIVE_TRADING)}</Badge>
      <h1 className="font-display text-4xl">Hero-wins cycles</h1>
      <p className="max-w-2xl text-cream/80">
        Each felt pot writes a binary cycle: does the hero win? Sizing is quarter-Kelly ({KELLY_FRACTION})
        with a {KELLY_CAP * 100}% bankroll cap. No live CLOB. Sit a hand on the{" "}
        <Link to="/" className="text-teal underline-offset-4 hover:underline">
          felt
        </Link>
        .
      </p>
      {sealed ? (
        <p className="text-ember">Desk sealed — book unavailable this request.</p>
      ) : rows.length === 0 ? (
        <p className="text-muted">No cycles yet. Play a paper hand.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-3">Market</th>
                <th className="py-2 pr-3">p</th>
                <th className="py-2 pr-3">¼ Kelly</th>
                <th className="py-2 pr-3">Sized</th>
                <th className="py-2 pr-3">Bankroll</th>
                <th className="py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border font-mono text-xs">
                  <td className="py-3 pr-3">{r.market}</td>
                  <td className="py-3 pr-3">{Number(r.p).toFixed(2)}</td>
                  <td className="py-3 pr-3">{Number(r.kelly_quarter).toFixed(3)}</td>
                  <td className="py-3 pr-3">{r.sized}</td>
                  <td className="py-3 pr-3">{Number(r.bankroll).toFixed(0)}</td>
                  <td className="py-3">{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
