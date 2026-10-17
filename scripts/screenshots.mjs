// Headless screenshots of every homepage section via playwright-core + system Chrome with SwiftShader WebGL.
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

const SECTIONS = [
  ["2-intro", ".intro", 0],
  ["3-work", "#work", 0],
  ["4-case-study", ".case", -90],
  ["5-open-slots", ".slots", -90],
  ["6-pricing", "#pricing", 0],
  ["7-pricing-tiers", ".tiers", -110],
  ["8-pricing-more", ".pricing-more", -90],
  ["9-process", "#process", 0],
  ["10-studio", "#studio", 0],
  ["11-faq", "#faq", 0],
  ["12-check-band", ".check-band", -120],
  ["13-contact", "#contact", 0],
  ["14-footer", ".footer", 0],
];

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
  await wait(2500);
  return { ctx, page };
}
const scrollTo = async (page, y) => {
  for (let i = 0; i < 2; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await wait(350);
  }
};
const top = (page, sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
const shot = (page, name, fullPage = false) => page.screenshot({ path: OUT + name, fullPage });

async function sections(page, prefix) {
  for (const [name, sel, off] of SECTIONS) {
    await scrollTo(page, (await top(page, sel)) + off);
    await wait(1300);
    await shot(page, `${prefix}-${name}.png`);
  }
}

// ---- desktop ----
{
  const { ctx, page } = await open({ width: 1440, height: 900 });
  for (let i = 0; i <= 20; i++) { await page.mouse.move(820 + i * 14, 360 + Math.sin(i / 4) * 40); await wait(40); }
  await wait(1200);
  await shot(page, "desktop-1-hero.png");
  await sections(page, "desktop");
  await scrollTo(page, (await top(page, ".tier-rec")) - 120);
  await page.mouse.move(720, 420);
  await wait(900);
  await shot(page, "desktop-7b-tier-hover.png");
  await scrollTo(page, 0);
  await wait(1200);
  await shot(page, "desktop-full.png", true);
  await ctx.close();
}

// ---- mobile ----
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { mobile: true });
  await shot(page, "mobile-1-hero-poster.png");
  await sections(page, "mobile");
  await scrollTo(page, 0);
  await wait(1500);
  await shot(page, "mobile-1b-hero-live.png");
  await page.click(".nav-menu");
  await wait(900);
  await shot(page, "mobile-15-menu.png");
  await page.click(".nav-menu");
  await wait(400);
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
