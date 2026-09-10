import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Spade, BookOpen, Newspaper, GraduationCap, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getGate, type GateView } from "@/lib/server/fns";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Felt" },
  { to: "/factory", label: "Factory" },
  { to: "/markets", label: "Book" },
  { to: "/lease", label: "Lease" },
  { to: "/skills", label: "Skills" },
  { to: "/desk", label: "Desk" },
  { to: "/flywheel", label: "News" },
  { to: "/mba", label: "MBA" },
  { to: "/pass", label: "Pass" },
  { to: "/dev-access", label: "Dev access" },
];

const DOCK = [
  { to: "/", label: "Felt", icon: Spade },
  { to: "/markets", label: "Book", icon: BookOpen },
  { to: "/flywheel", label: "News", icon: Newspaper },
  { to: "/mba", label: "MBA", icon: GraduationCap },
  { to: "/pass", label: "Pass", icon: Ticket },
];

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-8 w-8 animate-pulse rounded-full bg-cream/10" />;
  return user ? (
    <UserButton />
  ) : (
    <Link to="/login" className="text-sm text-cream/80 hover:text-cream">
      Sign in
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isPending || !user) {
      setGate(null);
      return;
    }
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
  }, [user, isPending]);

  return (
    <div className="lamp-glow min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-felt/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-lg tracking-tight text-cream">POLYMARKET HOLD'EM</span>
            <span className="hidden truncate text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              by CODYBEARTV
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {gate?.sealed ? (
              <span className="hidden text-xs text-ember sm:inline">Desk sealed</span>
            ) : gate ? (
              <span className="hidden font-mono text-xs text-teal sm:inline">{gate.credits} cr</span>
            ) : null}
            <AuthSlot />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle>Table map</SheetTitle>
                <nav className="flex flex-col gap-1">
                  {NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-3 text-sm",
                        pathname === item.to ? "bg-felt text-ember" : "hover:bg-felt",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <SignedOut>
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full">Sign in with X</Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <p className="text-xs text-muted">HITL on payment, post, withdraw, refund.</p>
                </SignedIn>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-felt/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {DOCK.map((item) => {
            const Icon = item.icon;
            const on = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
                    on ? "text-ember" : "text-muted",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
