// Headless screenshots via playwright-core + system Chrome with SwiftShader WebGL.
// Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:4173/";
const OUT = (process.argv[3] || new URL("../screenshots/", import.meta.url).pathname).replace(/\/?$/, "/");
fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const logs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(viewport, { mobile = false, reduced = false } = {}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const tag = `${viewport.width}${reduced ? "-reduced" : ""}`;
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`[${tag}] ${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`[${tag}] pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await wait(3500);
  return { ctx, page };
}
const scrollTo = async (page, y) => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(400);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
};
const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
const shot = (page, name, fullPage = false) => page.screenshot({ path: OUT + name, fullPage });

// ---- desktop ----
{
  const { ctx, page } = await open({ width: 1440, height: 900 });
  for (let i = 0; i <= 20; i++) { await page.mouse.move(700 + i * 16, 330 + Math.sin(i / 4) * 40); await wait(40); }
  await wait(1200);
  await shot(page, "desktop-1-hero.png");

  await scrollTo(page, await top(page, "#offer"));
  await wait(1800);
  await shot(page, "desktop-2-offer.png");

  await scrollTo(page, (await top(page, ".included")) - 120);
  await wait(1500);
  await shot(page, "desktop-3-included.png");

  const proc = await top(page, "#process");
  await scrollTo(page, proc - 60);
  await wait(1500);
  await shot(page, "desktop-4-process.png");

  const work = await top(page, "#work");
  await scrollTo(page, work + 40);
  await wait(1500);
  await shot(page, "desktop-5-work-head.png");
  await scrollTo(page, (await top(page, ".stack")) - 84);
  await wait(1200);
  await page.mouse.move(1000, 420);
  await wait(250);
  await page.mouse.move(1040, 400);
  await wait(900);
  await shot(page, "desktop-6-work-card.png");
  const cards = await page.$$eval(".card", (els) => els.map((e) => e.getBoundingClientRect().top + window.scrollY));
  await scrollTo(page, cards[2] + 200);
  await wait(1200);
  await page.mouse.move(1100, 480);
  await wait(250);
  await page.mouse.move(1060, 450);
  await wait(900);
  await shot(page, "desktop-7-work-placeholder.png");

  await scrollTo(page, (await top(page, "#studio")) + 20);
  await wait(1500);
  await shot(page, "desktop-8-studio.png");

  await scrollTo(page, await top(page, "#contact"));
  await wait(1500);
  await shot(page, "desktop-9-contact.png");

  await scrollTo(page, 1e6);
  await wait(1000);
  await shot(page, "desktop-10-footer.png");

  await scrollTo(page, 0);
  await wait(1200);
  await shot(page, "desktop-full.png", true);
  await ctx.close();
}

// ---- mobile ----
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { mobile: true });
  await shot(page, "mobile-1-hero.png");
  await scrollTo(page, (await top(page, ".tiers")) - 100);
  await wait(1500);
  await shot(page, "mobile-2-offer.png");
  await scrollTo(page, (await top(page, "#process")) + 300);
  await wait(1200);
  await shot(page, "mobile-3-process.png");
  await scrollTo(page, (await top(page, ".stack")) - 72);
  await wait(1200);
  await shot(page, "mobile-4-work.png");
  await scrollTo(page, (await top(page, "#contact")) + 40);
  await wait(1200);
  await shot(page, "mobile-5-contact.png");
  await page.click(".nav-menu");
  await wait(900);
  await shot(page, "mobile-6-menu.png");
  await page.click(".nav-menu");
  await scrollTo(page, 0);
  await wait(1000);
  await shot(page, "mobile-full.png", true);
  await ctx.close();
}

// ---- reduced motion ----
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, { reduced: true });
  await page.mouse.move(1000, 380);
  await wait(800);
  await shot(page, "desktop-reduced-motion-hero.png");
  await ctx.close();
}

await browser.close();
fs.writeFileSync(OUT + "console.log", logs.join("\n") + "\n");
console.log(logs.length ? logs.join("\n") : "no console errors/warnings");
