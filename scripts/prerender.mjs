/**
 * After `vite build`, write static HTML for SPA routes so /lab, /check and /work/dj
 * never flash the homepage #prerender. The client script in index.html already adds
 * `not-home` when pathname !== "/"; these copies bake that in for crawlers and first paint.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error("scripts/prerender.mjs: dist/index.html missing — run vite build first");
  process.exit(1);
}

const src = fs.readFileSync(indexPath, "utf8");

const ROUTES = [
  {
    dir: "lab",
    title: "Lab — Live Hero Generator · Senai Technology",
    canonical: "https://senaitechnology.com/lab",
    description:
      "Interactive Senai Lab: live WebGL hero & dither generator, motion timeline scrubber, holographic studio pass, and a 16-step Tizita sequencer.",
  },
  {
    dir: "check",
    title: "Free website check · Senai Technology",
    canonical: "https://senaitechnology.com/check",
    description: "Score a site for speed, search and AI-search readiness. No sign-up.",
  },
  {
    dir: "work/dj",
    title: "NORA FLUX — enter the field · Senai Technology",
    canonical: "https://senaitechnology.com/work/dj",
    description: "Signature-tier DJ showcase. Opt-in audio, never autoplayed.",
  },
  {
    dir: "work/residences",
    title: "Addis Crown Residences — developer pitch · Senai Technology",
    canonical: "https://senaitechnology.com/work/residences",
    description:
      "Interactive 3D pre-sale tower, bilingual AI concierge, diaspora 30/40/30 payments, and Prop Desk building OS for Addis Ababa apartment developers.",
  },
];

const kokebSrc = path.join(DIST, "kokeb-3d.html");
if (fs.existsSync(kokebSrc)) {
  const kokebDir = path.join(DIST, "work/kokeb-3d");
  fs.mkdirSync(kokebDir, { recursive: true });
  fs.copyFileSync(kokebSrc, path.join(DIST, "work/kokeb-3d.html"));
  fs.copyFileSync(kokebSrc, path.join(kokebDir, "index.html"));
  console.log("static https://senaitechnology.com/work/kokeb-3d");
}

for (const route of ROUTES) {
  let html = src
    .replace(/<html lang="en">/, '<html lang="en" class="not-home">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`)
    .replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${route.canonical}" />`)
    .replace(
      /<meta name="description" content="[^"]+" \/>/,
      `<meta name="description" content="${route.description}" />`,
    )
    .replace(/<meta property="og:url" content="[^"]+" \/>/, `<meta property="og:url" content="${route.canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]+" \/>/, `<meta property="og:title" content="${route.title}" />`);

  const outDir = path.join(DIST, route.dir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  console.log("prerender", route.canonical);
}
