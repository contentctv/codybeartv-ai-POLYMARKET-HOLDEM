import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TIP_JAR_URL } from "../lib/tip-jar";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TIP = "https://pay.bitcoinjungle.app/codybeartv";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("tip jar", () => {
  it("string-equals the Bitcoin Jungle CodyBearTV URL", () => {
    expect(TIP_JAR_URL).toBe(TIP);
  });

  it("exports that URL once from the tip module", () => {
    const tip = readFileSync(join(root, "lib/tip-jar.ts"), "utf8");
    expect(tip).toContain(`export const TIP_JAR_URL = "${TIP}"`);
    expect(tip.match(/https:\/\/pay\.bitcoinjungle\.app\/[a-z0-9]+/g)).toEqual([TIP]);
  });

  it("does not name a second payee", () => {
    const hits = walk(root).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return text.match(/https:\/\/pay\.bitcoinjungle\.app\/[a-z0-9]+/g) ?? [];
    });
    expect(new Set(hits)).toEqual(new Set([TIP]));
  });
});
