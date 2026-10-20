// Before/after captures for PR review: hero (with pointer on the shader), offer/tiers, and mobile equivalents.
// Usage: node scripts/compare-shots.mjs <baseUrl> <outDir> <prefix>
import { chromium } from "playwright-core";
import fs from "node:fs";

const [BASE = "http://localhost:4173/", OUT_ARG = "screenshots/compare", PREFIX = "shot"] = process.argv.slice(2);
const OUT = OUT_ARG.replace(/\/?$/, "/");
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});

async function open(viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await wait(3000);
  return { ctx, page };
}
const scrollTo = async (page, y) => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(400);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await wait(1500);
};
const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
const name = (n) => `${OUT}${PREFIX}-${n}.png`;
const revealAll = (page) => page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in")));

{
  const { ctx, page } = await open({ width: 1440, height: 900 }, false);
  for (let i = 0; i <= 20; i++) { await page.mouse.move(820 + i * 12, 300 + Math.sin(i / 4) * 30); await wait(40); }
  await wait(1200);
  await page.screenshot({ path: name("desktop-hero") });
  await page.mouse.move(10, 10);
  await scrollTo(page, (await top(page, "#offer")) - 10);
  await revealAll(page);
  await wait(1200);
  await page.locator("#offer").screenshot({ path: name("desktop-offer") });
  await ctx.close();
}
{
  const { ctx, page } = await open({ width: 390, height: 844 }, true);
  await page.screenshot({ path: name("mobile-hero") });
  await scrollTo(page, 300);
  await page.screenshot({ path: name("mobile-hero-scrolled") });
  await scrollTo(page, (await top(page, "#offer")) - 10);
  await revealAll(page);
  await wait(1200);
  await page.locator("#offer").screenshot({ path: name("mobile-offer") });
  await ctx.close();
}
await browser.close();
console.log("saved to", OUT);
