import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connect, disconnect, truncatedAddress } from "../lib/walletconnect";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("walletconnect guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("truncates a namespaced account", () => {
    expect(truncatedAddress("eip155:1:0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234…5678",
    );
    expect(truncatedAddress("0x1234")).toBe("0x1234");
  });

  it("exports connect, disconnect, and truncatedAddress", () => {
    expect(typeof connect).toBe("function");
    expect(typeof disconnect).toBe("function");
    expect(typeof truncatedAddress).toBe("function");
  });

  it("keeps value-transfer names out of the session module", () => {
    const src = readFileSync(join(root, "lib/walletconnect.ts"), "utf8");
    const banned = ["eth_send" + "Transaction", "send" + "Transaction", "wallet_send" + "Calls"];
    for (const needle of banned) {
      expect(src.includes(needle)).toBe(false);
    }
    expect(src).toContain('methods: ["eth_accounts"]');
  });

  it("keeps secret literals out of the scaffold", () => {
    const banned = ["mnemo" + "nic", "wc" + ":", "maca" + "roon", "BEGIN " + "PRIVATE"];
    const files = walk(root);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const needle of banned) {
        expect(text.includes(needle), `${file} contains a forbidden literal`).toBe(false);
      }
    }
  });

  it("refuses the placeholder project id before opening a session", async () => {
    vi.stubEnv("NEXT_PUBLIC_WC_PROJECT_ID", "REPLACE_ME");
    await expect(connect()).rejects.toThrow(/NEXT_PUBLIC_WC_PROJECT_ID/);
  });

  it("does not open a session from the server once an id is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_WC_PROJECT_ID", "paper-id");
    await expect(connect()).rejects.toThrow(/browser/);
  });

  it("disconnect is a no-op without a live session", async () => {
    await expect(disconnect()).resolves.toBeUndefined();
  });
});
