import { createFileRoute } from "@tanstack/react-router";
import { LEASE } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/lease")({ component: Lease });

function Lease() {
  return (
    <article className="space-y-6">
      <Badge variant="teal">Readable without a pass</Badge>
      <h1 className="font-display text-4xl">{LEASE.title}</h1>
      <p className="text-sm uppercase tracking-[0.16em] text-muted">{LEASE.kicker}</p>
      {LEASE.body.map((p) => (
        <p key={p} className="max-w-2xl text-cream/85">
          {p}
        </p>
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        {LEASE.clauses.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>
                {c.id}. {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cream/80">{c.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </article>
  );
}
