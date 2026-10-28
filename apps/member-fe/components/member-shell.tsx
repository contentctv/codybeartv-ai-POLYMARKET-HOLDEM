"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { connect, disconnect } from "../lib/walletconnect";

function sessionError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Session failed";
  if (raw.includes("wc" + ":")) return "Session failed";
  return raw;
}

export function MemberShell({ children }: { children: ReactNode }) {
  const [truncated, setTruncated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onConnect() {
    setBusy(true);
    setError(null);
    try {
      const session = await connect();
      setTruncated(session.truncated);
    } catch (err) {
      setError(sessionError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    setError(null);
    try {
      await disconnect();
      setTruncated(null);
    } catch (err) {
      setError(sessionError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <header className="bar">
        <Link className="mark" href="/">
          CodyBearTV
        </Link>
        <nav className="nav" aria-label="Member">
          <Link href="/">Home</Link>
          <Link href="/member">Member</Link>
          <Link href="/tip">Tip</Link>
        </nav>
        <div className="session">
          <span className="addr">{truncated ?? "No session"}</span>
          {truncated ? (
            <button type="button" onClick={onDisconnect} disabled={busy}>
              Disconnect
            </button>
          ) : (
            <button type="button" onClick={onConnect} disabled={busy}>
              Connect
            </button>
          )}
        </div>
      </header>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <main className="stage">{children}</main>
    </div>
  );
}
