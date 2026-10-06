// Screenshots for DJ showcase page
// Usage: node scripts/dj-screenshots.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:4173/";
const OUT = (process.argv[3] || new URL("../screenshots/dj-showcase/", import.meta.url).pathname).replace(/\/?$/, "/");
fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const logs = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(url, viewport, { mobile = false, reduced = false } = {}) {
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
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await wait(3000);
  return { ctx, page };
}

const scrollTo = async (page, y) => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(400);
};

const top = (page, sel) => page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().top + window.scrollY || 0, sel);
const shot = (page, name, fullPage = false) => page.screenshot({ path: OUT + name, fullPage });

// ---- Main site Work tile ----
{
  const { ctx, page } = await open(BASE, { width: 1440, height: 900 });
  await scrollTo(page, await top(page, "#work"));
  await wait(1500);
  // Find the DJ showcase card (3rd card)
  const cards = await page.$$eval(".card", (els) => els.map((e) => e.getBoundingClientRect().top + window.scrollY));
  if (cards.length >= 3) {
    await scrollTo(page, cards[2] - 100);
    await wait(1200);
    await page.mouse.move(1100, 500);
    await wait(300);
    await shot(page, "main-site-work-tile-desktop.png");
  }
  await ctx.close();
}

// ---- DJ Showcase Desktop ----
{
  const djUrl = BASE.replace(/\/$/, "") + "/work/dj";
  const { ctx, page } = await open(djUrl, { width: 1440, height: 900 });
  
  // Hero
  await wait(1500);
  await shot(page, "dj-desktop-1-hero.png");
  
  // Latest Release
  await scrollTo(page, await top(page, ".release-section"));
  await wait(1200);
  await shot(page, "dj-desktop-2-release.png");
  
  // Track Player
  await scrollTo(page, await top(page, ".player-section"));
  await wait(1200);
  await shot(page, "dj-desktop-3-player.png");
  
  // Tour Dates
  await scrollTo(page, await top(page, ".tour-section"));
  await wait(1200);
  await shot(page, "dj-desktop-4-tour.png");
  
  // Gallery
  await scrollTo(page, await top(page, ".gallery-section"));
  await wait(1200);
  await shot(page, "dj-desktop-5-gallery.png");
  
  // EPK
  await scrollTo(page, await top(page, ".epk-section"));
  await wait(1200);
  await shot(page, "dj-desktop-6-epk.png");
  
  // Booking
  await scrollTo(page, await top(page, ".booking-section"));
  await wait(1200);
  await shot(page, "dj-desktop-7-booking.png");
  
  // Senai Banner
  await scrollTo(page, await top(page, ".senai-banner"));
  await wait(800);
  await shot(page, "dj-desktop-8-senai-banner.png");
  
  // Full page
  await scrollTo(page, 0);
  await wait(1000);
  await shot(page, "dj-desktop-full.png", true);
  
  await ctx.close();
}

// ---- DJ Showcase Mobile ----
{
  const djUrl = BASE.replace(/\/$/, "") + "/work/dj";
  const { ctx, page } = await open(djUrl, { width: 390, height: 844 }, { mobile: true });
  
  // Hero
  await wait(1500);
  await shot(page, "dj-mobile-1-hero.png");
  
  // Latest Release
  await scrollTo(page, await top(page, ".release-section"));
  await wait(1200);
  await shot(page, "dj-mobile-2-release.png");
  
  // Track Player
  await scrollTo(page, await top(page, ".player"));
  await wait(1200);
  await shot(page, "dj-mobile-3-player.png");
  
  // Tour Dates
  await scrollTo(page, await top(page, ".tour-section"));
  await wait(1200);
  await shot(page, "dj-mobile-4-tour.png");
  
  // Gallery
  await scrollTo(page, await top(page, ".gallery-section"));
  await wait(1200);
  await shot(page, "dj-mobile-5-gallery.png");
  
  // Booking
  await scrollTo(page, await top(page, ".booking-section"));
  await wait(1200);
  await shot(page, "dj-mobile-6-booking.png");
  
  // Full page
  await scrollTo(page, 0);
  await wait(1000);
  await shot(page, "dj-mobile-full.png", true);
  
  await ctx.close();
}

await browser.close();
fs.writeFileSync(OUT + "console.log", logs.join("\n") + "\n");
console.log(logs.length ? logs.join("\n") : "no console errors/warnings");
console.log(`\nScreenshots saved to: ${OUT}`);
