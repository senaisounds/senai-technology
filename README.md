# Senai Technology — homepage v0.2

Homepage for **Senai Technology**, the creative technology studio of Senai Motley (a Slotted LLC company, New York ⇄ Addis Ababa).
The site is its own portfolio piece for the first offer: premium, animated, AI-built websites.

## Run it

```bash
npm install
npm run build      # type-check (tsc -b) + production build -> dist/
npm run preview    # serve dist/ on http://localhost:4173
npm run dev        # http://localhost:5173
npm run shots      # headless screenshots -> screenshots/ (git-ignored; needs `npm run preview` running)
```

Node 20.19+ (Vite 8). `npm run shots` uses `playwright-core` with the system Chrome at `/usr/bin/google-chrome`
(override with `CHROME_PATH=...`) and SwiftShader software WebGL. The hero detects software GL and renders a still frame there,
so captures show the still frame (with the lens) rather than the animation.

## Page sections

| # | Section | Where | Notes |
|---|---------|-------|-------|
| 1 | **Hero, "Websites with a pulse."** | `src/lib/heroGL.ts`, `App.tsx` `Hero` | Raw WebGL2, two passes. A cluster of smooth-unioned metaballs is raymarched into a low-res buffer, then composited at screen res through a 3-tone ordered (Bayer 8×8) dither. A pointer-driven lens shows the smooth render underneath, slightly magnified; when idle it drifts on its own. One blob follows the cursor, and the form pulses at 92 BPM. A HUD shows real boot stages (context → shaders → first frame), plus live New York / Addis Ababa clocks. |
| 2 | Ticker | `App.tsx` `Ticker` | CSS marquee, pauses on hover, static when reduced motion is on. |
| 3 | **01 Offer: AI-built websites** | `TIERS`, `INCLUDED` in `src/content.ts` | Three scopes (Launch / Studio / Signature), each "Quoted per project". No prices. "Start with …" pre-selects the project type in the contact form. Dithered icons (`DitherIcon.tsx`) scan in when seen and replay on hover. Each card carries a dithered texture (`TierTexture.tsx`); on hover or keyboard focus a lens swaps it for an ASCII render of the same field. Mobile: swipeable scroll-snap row. |
| 4 | **02 Process** | `PROCESS` | Light section. The rail fills with scroll and lights each step. |
| 5 | **03 Work** | `WORK`, `DitherArt.tsx` | Sticky stacking cards. Each card's art is a one-time dithered render; hovering opens a lens onto a smooth layer (the hero interaction, in CSS). Real: this site and **OpenSlot** (openslot.me). Three **placeholders**, badged and stamped "Placeholder · concept". |
| 6 | **04 Studio** | `ALSO` | About line, ሰናይ in Ge'ez script, and the other five services. |
| 7 | **05 Contact** | `App.tsx` `Contact` | Project-type chips, name / email / project, and a copy-email button. Submitting opens a prefilled `mailto:` to the **placeholder** `hello@senaitechnology.com`. |
| 8 | Footer | `App.tsx` `Footer` | "© 2026 Senai Technology, a Slotted LLC company" |

## Stack

Vite 8 · React 19 · TypeScript 5 · raw WebGL2 (no three.js) · Lenis (smooth scroll). Scroll reveals use one IntersectionObserver plus CSS (`[data-reveal]`).
Fonts are self-hosted in `public/fonts` and preloaded: the Latin subsets of Instrument Sans (variable, width axis), Instrument Serif italic and Geist Mono.
Noto Sans Ethiopic is subset to the three glyphs of ሰናይ (`senai-geez.woff2`, about 2 KB).

## Performance and accessibility

- The headline is plain HTML, so it paints first. The hero shader compiles in `requestIdleCallback`, off the critical path.
- The raymarch runs at 0.5× CSS resolution (0.38× on mobile). If frames run slow, it steps down automatically. The DPR is capped at 1.5.
- Shaders compile with `KHR_parallel_shader_compile` where available. On software GL (SwiftShader, llvmpipe, `failIfMajorPerformanceCaveat`), the hero renders one still frame and re-renders only on pointer moves.
- The hero pauses when off-screen or when the tab is hidden. Work art, tier textures and icons are drawn once; icons animate for 0.9 s only when revealed or hovered.
- No WebGL2 → a CSS dithered fallback.
- **`prefers-reduced-motion`:** Lenis is off. The hero renders a single still frame (the lens only follows the pointer), with no beat or drift.
  Icons draw in their final state, the tier lens stays put instead of following the pointer, hover lifts / press scales / arrow nudges are off, and the ticker, reveals and transitions are disabled.
- Semantic headings and landmarks, a skip link, visible focus states, keyboard-reachable chips, and an Escape-to-close mobile menu. Canvases are `aria-hidden`.

## Credits and licenses

| Source | License | Used for |
|--------|---------|----------|
| Fonts: Instrument Sans, Instrument Serif, Geist Mono (files from Fontsource), Noto Sans Ethiopic (subset) | SIL OFL 1.1 | Type |
| Bayer-matrix `bayer2/4/8` recursion | Common public-domain shader idiom | Ordered dither in `heroGL.ts` |

Runtime deps: react, react-dom, lenis (all MIT).

## Environment Variables

The following environment variables can be configured for enhanced functionality:

- **`PAGESPEED_API_KEY`** (optional): Google PageSpeed Insights API key for higher rate limits on the website check tool. The tool works without a key at lower volume.
- **`LEAD_WEBHOOK_URL`** (optional): Webhook endpoint for lead submissions from the website check tool. If set, lead data is posted to this URL. Leads are always logged server-side regardless of webhook configuration.

## TODO before launch

- [ ] **Contact:** `hello@senaitechnology.com` is a placeholder (`src/content.ts`, `CONTACT_EMAIL`). The form has no
      backend; it builds a `mailto:` link. Wire up a form service or serverless endpoint.
- [ ] Payments: this repo has no Stripe integration. If Stripe checkout / payment links exist, add them to the offer cards.
- [ ] Replace placeholders with real case studies as they ship. Add real OpenSlot screenshots / App Store badge.
- [ ] Review all offer copy (tier names, scopes, process), and confirm the ሰናይ spelling.
- [ ] Add a real OG image and analytics (if wanted).
