import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FOLLOW_HANDLE, FOLLOW_INTENT } from "@/lib/flags";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getGate, type GateView } from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { name: "Felt engine", need: "Follow", href: "/" },
  { name: "Paper book write", need: "Follow + sign-in", href: "/markets" },
  { name: "Desk HITL", need: "PAID_24HR", href: "/desk" },
  { name: "MBA stamp", need: "ENTREPRENEUR", href: "/mba" },
];

export const Route = createFileRoute("/skills")({ component: Skills });

function Skills() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);

  useEffect(() => {
    if (!user) return;
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
  }, [user]);

  const unlocked = Boolean(gate?.toolsUnlocked);

  return (
    <div className="space-y-6">
      <Badge variant={unlocked ? "teal" : "ember"}>{unlocked ? "Tools open" : "Tools locked"}</Badge>
      <h1 className="font-display text-4xl">Skills</h1>
      <p className="max-w-2xl text-cream/80">
        Catalog is public. Tools wait on a follow of @{FOLLOW_HANDLE}. We never invent follower status.
        Optional X API runs only when X_FOLLOW_BEARER exists.
      </p>
      {!unlocked ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="teal">
            <a href={FOLLOW_INTENT} target="_blank" rel="noreferrer">
              Follow @{FOLLOW_HANDLE}
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pass">Attest on Pass</Link>
          </Button>
        </div>
      ) : null}
      <ul className="divide-y divide-border rounded-xl border border-border">
        {TOOLS.map((t) => (
          <li key={t.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted">{t.need}</p>
            </div>
            {unlocked ? (
              <Link to={t.href} className="text-sm text-teal">
                Open
              </Link>
            ) : (
              <span className="text-xs text-ember">Locked</span>
            )}
          </li>
        ))}
      </ul>
      {isPending ? <p className="text-xs text-muted">Checking session…</p> : null}
    </div>
  );
}
