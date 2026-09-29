// Headless screenshots via playwright-core + system Chrome with SwiftShader WebGL.
// Usage: node scripts/screenshots.mjs [baseUrl]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5173/";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const logs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(viewport, mobile = false) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`[${viewport.width}] ${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`[${viewport.width}] pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await wait(4000);
  return { ctx, page };
}
async function scrollTo(page, y) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(300);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
}
async function sweep(page, x0, y0, x1, y1, steps = 30) {
  for (let i = 0; i <= steps; i++) {
    await page.mouse.move(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps + Math.sin(i / 3) * 40);
    await wait(30);
  }
}
const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);

// ---- desktop ----
{
  const { ctx, page } = await open({ width: 1440, height: 900 });
  await sweep(page, 300, 300, 1100, 500, 25);
  await wait(1500);
  await page.screenshot({ path: OUT + "desktop-1-hero.png" });

  const svc = await top(page, "#services");
  for (const [i, name] of [[0, "desktop-2-services.png"], [2, "desktop-2b-services-brand.png"]]) {
    await scrollTo(page, svc + i * 900 + 20);
    await wait(3500);
    await page.screenshot({ path: OUT + name });
  }

  const air = await top(page, ".air");
  await scrollTo(page, air - 90);
  await wait(1500);
  await sweep(page, 200, 400, 1250, 450, 40);
  await wait(250);
  await page.screenshot({ path: OUT + "desktop-3-air.png" });

  const work = await top(page, "#work");
  await scrollTo(page, work + 40);
  await wait(2000);
  await page.mouse.move(700, 500);
  await wait(900);
  await page.screenshot({ path: OUT + "desktop-4-work.png" });
  const grid = await top(page, ".work-grid .tile:nth-child(2)");
  await scrollTo(page, grid - 120);
  await wait(1800);
  await page.mouse.move(720, 420);
  await wait(250);
  await page.mouse.move(760, 400);
  await wait(500);
  await page.screenshot({ path: OUT + "desktop-4b-work-concepts.png" });

  const contact = await top(page, "#contact");
  await scrollTo(page, contact);
  await wait(2000);
  await sweep(page, 100, 250, 800, 700, 35);
  await sweep(page, 800, 200, 200, 600, 35);
  await wait(200);
  await page.screenshot({ path: OUT + "desktop-5-cta.png" });

  await scrollTo(page, 1e6);
  await wait(1000);
  await page.screenshot({ path: OUT + "desktop-6-footer.png" });
  await ctx.close();
}

// ---- mobile ----
{
  const { ctx, page } = await open({ width: 390, height: 844 }, true);
  await page.screenshot({ path: OUT + "mobile-1-hero.png" });
  const svc = await top(page, "#services");
  await scrollTo(page, svc + 844 * 1 + 10);
  await wait(3000);
  await page.screenshot({ path: OUT + "mobile-2-services.png" });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(OUT + "console.log", logs.join("\n") + "\n");
console.log(logs.length ? logs.join("\n") : "no console errors/warnings");
