import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const routes = ["/", "/factory", "/markets", "/lease", "/skills", "/desk", "/flywheel", "/mba", "/pass", "/login"];
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const problems = [];

try {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`${vp.name} ${msg.text()}`);
    });
    page.on("pageerror", (err) => problems.push(`${vp.name} pageerror ${err.message}`));

    for (const route of routes) {
      const resp = await page.goto(base + route, { waitUntil: "networkidle", timeout: 45000 });
      const status = resp?.status() ?? 0;
      if (status >= 400) problems.push(`${vp.name} ${route} HTTP ${status}`);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return { x: doc.scrollWidth - doc.clientWidth, y: 0 };
      });
      if (overflow.x > 2) problems.push(`${vp.name} ${route} overflowX=${overflow.x}`);
      const shot = `screenshots/${vp.name}${route === "/" ? "-home" : route.replaceAll("/", "-")}.png`;
      await page.screenshot({ path: shot, fullPage: false });
    }

    if (vp.name === "desktop") {
      await page.goto(base + "/", { waitUntil: "networkidle" });
      const sit = page.getByRole("button", { name: /Sit the table|Next hand/i });
      if (await sit.count()) {
        await sit.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: "screenshots/desktop-felt-dealt.png" });
      }
    }

    if (consoleErrors.length) problems.push(...consoleErrors);
    await page.close();
  }
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(JSON.stringify({ ok: false, problems }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, routes, viewports: viewports.map((v) => v.name) }, null, 2));
