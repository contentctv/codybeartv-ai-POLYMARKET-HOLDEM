import { createFileRoute, Link } from "@tanstack/react-router";
import { FeltTable } from "@/components/felt/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <Badge variant="teal">Night table · paper chips</Badge>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] md:text-5xl">
            POLYMARKET HOLD'EM
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-muted">by CODYBEARTV</p>
          <p className="mt-4 max-w-xl text-cream/80">
            Six-max no-limit Hold'em on a study felt. Hole cards, streets, side pots, five original TAG
            seats. 10,000 paper chips. No wallet on this table.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/factory">Read the factory</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pass">Get a pass</Link>
          </Button>
        </div>
      </section>
      <FeltTable />
    </div>
  );
}
