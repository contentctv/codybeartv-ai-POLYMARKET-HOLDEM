import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { FOLLOW_HANDLE, FOLLOW_INTENT } from "@/lib/flags";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const x = GROK_PROVIDERS.find((p) => p.providerId === "grok-x");
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="text-sm text-cream/80">
        X OAuth 2.0 PKCE through the Grok broker. Follow @{FOLLOW_HANDLE} after sign-in so tools unlock.
        Follower status is never faked.
      </p>
      {authEnabled && x ? (
        <Button className="w-full" onClick={() => void signIn(x.providerId, { callbackURL: "/pass" })}>
          Continue with X
        </Button>
      ) : (
        <p className="text-sm text-muted">Sign-in is disabled.</p>
      )}
      <a className="block text-sm text-teal underline-offset-4 hover:underline" href={FOLLOW_INTENT}>
        Follow @{FOLLOW_HANDLE}
      </a>
      <Link to="/" className="block text-sm text-muted">
        Back to the felt
      </Link>
    </div>
  );
}
