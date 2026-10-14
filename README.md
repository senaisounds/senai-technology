# Senai Technology — homepage v0.3

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

## Art direction: "Liner notes"

The site is laid out like a record sleeve and its insert. Dark **sleeve** sections (hero, work, process, contact, footer) alternate with warm
**paper** sections (intro, pricing, studio, FAQ), with one berbere-orange band for the free website check. Cormorant Garamond sets display type,
Instrument Sans the body, Geist Mono the catalogue-style labels (SNY—001, track numbers, 92 BPM). The accent is `#ff5a1f` on dark and a deeper
`#b8390c` on paper, so accent text keeps AA contrast. Surfaces swap through CSS custom properties: `.paper` redefines `--ink`, `--mute`, `--line`
and `--accent-text`, and tier cards reset them back to the dark set.

## Page sections

| # | Section | Where | Notes |
|---|---------|-------|-------|
| 1 | **Hero, "Websites with a pulse."** | `src/lib/heroGL.ts`, `HeroPoster.tsx`, `App.tsx` `Hero` | Raw WebGL2 raymarch through a 3-tone Bayer dither, with a pointer lens and ሰናይ hidden in the pixels (revealed around the pointer and as the hero scrolls away). `HeroPoster` paints a still dithered frame of the same layout first; it is also the fallback when WebGL2 is missing or fails. Fine pointers start the shader in the first idle period; touch devices start it on the first interaction, so shader compilation never competes with first paint on a phone. HUD: boot stages, 92 BPM. |
| 2 | Intro | `Intro` | Paper. Manifesto line plus a facts list (base, offer, pricing, payments, reply time). |
| 3 | **01 Work** | `WORK` (`CaseStudy`) in `src/content.ts`, `DitherArt.tsx` | A tracklist index of every entry, then a full case-study block per real project (role, scope, brief, approach, outcome, link) and an "Open slots" grid for placeholders, badged and stamped as placeholders. Add `images` to an entry to swap the generated dither art for real screenshots. |
| 4 | **02 Pricing** | `TIERS`, `INCLUDED`, `PAYMENTS`, `ALSO` | Paper. Launch / Studio / Signature, each "Quoted per project". Studio is recommended: badge, accent frame, raised on desktop, first on phones, the only filled CTA, and pre-selected in the contact form. Dither / ASCII tier textures and icons are kept. Below: what every site includes, local payments (Stripe for the US, Chapa for Ethiopia), and services beyond websites. |
| 5 | **03 Process** | `PROCESS` | Four beats; the rail fills with scroll and lights each step's beat. |
| 6 | **04 Studio** | `Studio` | Paper. ሰናይ in Ge'ez script, the studio statement, and a founder card with a marked **placeholder** portrait. |
| 7 | **05 FAQ** | `FAQ` | Paper. Exclusive `<details name="faq">` accordion (animated where `::details-content` is supported). Mirrored as FAQPage JSON-LD in `index.html`. |
| 8 | Website check band | `CheckBand` | Orange band with a URL field that opens `/check?url=…` prefilled. |
| 9 | **06 Contact** | `Contact` | Project-type chips, name / email / project, copy-email, and a three-step "what happens next". Submitting opens a prefilled `mailto:` to the **placeholder** `hello@senaitechnology.com`. |
| 10 | Footer | `Footer` | Index, tools, contact with live NYC / ADD clocks, liner-note colophon, giant Senai / ሰናይ wordmark. |

## Stack

Vite 8 · React 19 · TypeScript 5 · raw WebGL2 (no three.js) · Lenis (smooth scroll). Scroll reveals use one IntersectionObserver plus CSS (`[data-reveal]`).
Fonts are self-hosted in `public/fonts` and preloaded: the Latin subsets of Instrument Sans (variable, width axis), Instrument Serif italic and Geist Mono,
plus Cormorant Garamond 600 for display headlines only (a static instance subset to ASCII + typographic punctuation with kerning only, about 9 KB).
Its `@font-face` pins ascent/descent, and three `local()` fallback faces (Times New Roman / Liberation Serif, Noto Serif, DejaVu Serif) carry
`size-adjust` and metric overrides measured against the site's own headlines, so the swap doesn't shift layout.
Microsoft's Michelangelus was the first choice, but its EULA grants no distribution rights and Microsoft's font FAQ forbids self-hosting or WOFF2 conversion.
Noto Sans Ethiopic is subset to the three glyphs of ሰናይ (`senai-geez.woff2`, about 2 KB).

## Performance and accessibility

- The headline is plain HTML, so it paints first. A still dithered poster (`HeroPoster`, a 2D canvas at 1/3 resolution) fills the hero immediately. On fine pointers the shader compiles in `requestIdleCallback`; on touch devices it waits for the first interaction.
- Lenis is loaded with a dynamic import, only for fine pointers without reduced motion (touch scrolling is native).
- The raymarch runs at 0.5× CSS resolution (0.38× on mobile). If frames run slow, it steps down automatically. The DPR is capped at 1.5.
- Shaders compile with `KHR_parallel_shader_compile` where available. On software GL (SwiftShader, llvmpipe, `failIfMajorPerformanceCaveat`), the hero renders one still frame and re-renders only on pointer moves. It compiles the composite without the hidden word there, since the extra shader work costs a long task per frame on a CPU rasteriser.
- The hero pauses when off-screen or when the tab is hidden. Work art, tier textures and icons are drawn once; icons animate for 0.9 s only when revealed or hovered.
- No WebGL2, or a shader failure → the still poster stays.
- **`prefers-reduced-motion`:** Lenis is off. The hero renders a single still frame (the lens and the hidden-word reveal only follow the pointer and scroll, without easing, and there is no idle hint), with no beat or drift. In the still frame the raymarch pass is cached and only redone on resize.
  Icons draw in their final state, the tier lens stays put instead of following the pointer, hover lifts / press scales / arrow nudges are off, and reveals and transitions are disabled.
- Semantic headings and landmarks, a skip link, visible focus states, keyboard-reachable chips, and an Escape-to-close mobile menu. Canvases are `aria-hidden`.

## Credits and licenses

| Source | License | Used for |
|--------|---------|----------|
| Fonts: Instrument Sans, Instrument Serif, Geist Mono (files from Fontsource), Noto Sans Ethiopic (subset), Cormorant Garamond (google/fonts, subset; license in `public/fonts/OFL-cormorant-garamond.txt`) | SIL OFL 1.1 | Type |
| Bayer-matrix `bayer2/4/8` recursion | Common public-domain shader idiom | Ordered dither in `heroGL.ts` |

Runtime deps: react, react-dom, lenis (all MIT).

## Environment Variables

The following environment variables can be configured for enhanced functionality:

- **`PAGESPEED_API_KEY`** (optional): Google PageSpeed Insights API key for higher rate limits on the website check tool. The tool works without a key at lower volume.
- **`LEAD_WEBHOOK_URL`** (optional): Webhook endpoint for lead submissions from the website check tool. If set, lead data is posted to this URL. Leads are always logged server-side regardless of webhook configuration.

## TODO before launch

- [ ] **Contact:** `hello@senaitechnology.com` is a placeholder (`src/content.ts`, `CONTACT_EMAIL`). The form has no
      backend; it builds a `mailto:` link. Wire up a form service or serverless endpoint.
- [ ] Payments: the site names Stripe (US) and Chapa (Ethiopia), but this repo has no checkout code. If payment links exist, add them to `PAYMENTS` in `src/content.ts`.
- [ ] Replace the founder-portrait placeholder in the Studio section.
- [ ] Replace placeholders with real case studies as they ship. Add real OpenSlot screenshots / App Store badge.
- [ ] Review all offer copy (tier names, scopes, process), and confirm the ሰናይ spelling.
- [ ] Add a real OG image and analytics (if wanted).
