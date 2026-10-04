# Senai Technology — homepage v0.1

First working version of the homepage for **Senai Technology**, a creative technology studio (a Slotted LLC company, Briarcliff Manor, NY, with Addis Ababa roots).

> Local project only. Nothing here has been deployed or pushed anywhere.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc -b) + production build -> dist/
npm run preview    # serve dist/ on http://localhost:4173
npm run shots      # headless screenshots -> screenshots/ (needs the dev server running)
```

Node 20.19+ (Vite 8). `npm run shots` uses `playwright-core` with the system Chrome at `/usr/bin/google-chrome`
(override with `CHROME_PATH=...`) and SwiftShader software WebGL (`--use-angle=swiftshader --enable-unsafe-swiftshader`).

## Page sections

| # | Section | Where | Notes |
|---|---------|-------|-------|
| 1 | **Hero, "Play with us"** | `src/components/HeroScene.tsx` | Rapier physics pile of glossy capsules, spheres, rounded cubes and tori, plus 2 glass pieces (`MeshTransmissionMaterial`). The cursor is a kinematic ball that shoves them; clicking cycles the palette (blue → magenta → red → yellow). Lightformer environment, bloom, film grain and vignette. The HTML headline and "Start a project" CTA sit on top. |
| 2 | **What we make** | `src/components/ServicesScene.tsx`, `src/lib/shapes.ts` | 600vh scroll section with a sticky canvas. An 18k-point cloud (9k on mobile) morphs between 6 sampled shapes: `</>` text, phone slab, torus knot, film-reel torus, icosahedron and a rippling stage-floor grid. One shape per service, each with a real HTML caption (h2 + copy + tags). |
| 3 | **Air has a surface** | `src/components/AirScene.tsx` | Height-field wave equation on ping-pong half-float render targets. Cursor movement drops ripples, and the surface refracts (with chromatic split) a big typographic texture. A slow ambient drop runs when idle. |
| 4 | **Selected work** | `App.tsx` `Work`/`Tile`, `src/content.ts` | CSS 3D tilt, cursor-light hover and ring ripples. **OpenSlot** (past project, App Store, links to openslot.me) plus 3 tiles clearly badged "Concept · placeholder": landscaper site, pastry shop site, AI booking assistant. |
| 5 | **Paint with us / Start a project** | `src/lib/fluid.ts`, `App.tsx` `Paint` | Hover ink-fluid sim (port of PavelDoGreat's WebGL-Fluid-Simulation) behind a front-end-only form (name / email / project). Submitting opens a `mailto:` to the **placeholder** `hello@senaitechnology.com`. |
| 6 | **AI Chat Assistant** | `src/components/ChatWidget.tsx`, `api/chat.ts` | Floating chat button that opens an AI-powered assistant panel. Answers visitor questions about Senai Technology's services, captures leads (name, email, need), and guides visitors toward booking a discovery call. Streaming responses via Vercel AI SDK + OpenAI. **Requires `OPENAI_API_KEY` env var to function; falls back gracefully if not configured.** |
| 7 | Footer | `App.tsx` | "© 2026 Senai Technology, a Slotted LLC company" |

Content (service copy, work tiles, contact email) lives in `src/content.ts`.

## AI Chat Assistant

The site includes a floating chat widget (`src/components/ChatWidget.tsx`) powered by OpenAI via the Vercel AI SDK.

**Features:**
- Floating button (bottom-right) that opens a chat panel
- AI assistant that answers questions about Senai Technology's services
- Lead capture form (name, email, what they need)
- Streaming responses for a smooth conversational experience
- Mobile and desktop responsive
- Theme-agnostic styling using CSS variables (works with both main and redesign branches)
- Graceful fallback when `OPENAI_API_KEY` is not configured

**Environment Variables:**

For Vercel deployment, set these in the Vercel project settings:

- **`OPENAI_API_KEY`** (required) — Your OpenAI API key. The chat uses `gpt-4o-mini` for responses. Without this key, the chat shows a friendly error directing visitors to the contact form.
- **`CHAT_LEAD_WEBHOOK_URL`** (optional) — If provided, captured leads (name, email, need) are POSTed to this webhook URL as JSON. Leads are also logged server-side for backup.

**Local Development:**

Create a `.env` file (not committed):

```env
OPENAI_API_KEY=sk-...
CHAT_LEAD_WEBHOOK_URL=https://...  # optional
```

Without `OPENAI_API_KEY`, the widget still renders but shows a fallback message directing visitors to the contact form or email.

**Lead Storage:**

Currently, leads are:
1. Logged to the server console (visible in Vercel function logs)
2. Optionally sent to `CHAT_LEAD_WEBHOOK_URL` if configured

This approach works without a database. For production, consider:
- A webhook to a CRM or email service (Zapier, Make, n8n)
- A Vercel serverless function that emails leads via SendGrid/Postmark
- Adding Vercel Postgres or another database for persistent storage

## Stack

Vite 8 · React 19 · TypeScript 5 · three r180 · @react-three/fiber 9 · @react-three/drei 10 · @react-three/rapier 2 (Rapier/WASM) ·
@react-three/postprocessing 3 · Lenis (smooth scroll) · motion (`motion/react`, reveal animations) · maath ·
Bricolage Grotesque + Inter via Fontsource (self-hosted, no font CDN).

**Why motion and not GSAP:** GSAP is free, but under its own "Standard No Charge" license, which isn't OSI-approved.
The brief asked for permissive open-source deps only, so scroll reveals use `motion` (MIT) and the scroll progress
logic is hand-rolled (`getBoundingClientRect` on scroll, which works with Lenis's native scrolling).

## Performance and accessibility

- Every canvas caps DPR at **1.5** (`dpr={[1, 1.5]}`; the fluid sim clamps `devicePixelRatio` too).
- Canvases pause offscreen (IntersectionObserver → `frameloop="never"`, and the fluid RAF stops).
- The heavy scenes are lazy-loaded chunks. The Rapier WASM lives only in the hero chunk.
- Mobile gets fewer bodies, fewer particles, lower transmission samples, no shadows, and a single-column layout.
- **`prefers-reduced-motion`:** Lenis is off. The hero pile settles for about 1.8 s, then the render loop freezes
  (`frameloop="demand"`). The particle morph snaps between shapes with no sway. The air strip has no ambient drops.
  The fluid sim is replaced by a static gradient. CSS animations (marquee, grain, reveals) are disabled.
- All copy is real HTML (h1/h2/h3, lists, form labels) for SEO. Canvases are `aria-hidden`. There's a skip link and
  a meta description / OG tags in `index.html`.

## Credits and licenses for adapted code

| Source | License | Used for |
|--------|---------|----------|
| [pmndrs/examples · lusion-connectors](https://github.com/pmndrs/examples/tree/main/examples/lusion-connectors) (© 2024 Poimandres), itself inspired by [Lusion](https://lusion.co) | MIT | Hero physics setup (center-pull impulses, kinematic pointer body, Lightformer environment, palette cycling). The GLB connector model is **not** used. |
| [pmndrs/examples · gpgpu-curl-noise-dof](https://github.com/pmndrs/examples/tree/main/examples/gpgpu-curl-noise-dof) (© 2024 Poimandres) | MIT | Soft round point sprite and depth-fade approach in the particle shader |
| [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) (© 2017 Pavel Dobryakov) | MIT | `src/lib/fluid.ts`: condensed TS/WebGL2 port. The full license text is kept in the file header. |
| "Air has a surface" idea | — | Inspired by @xbh_artist's work. Original implementation (a classic 2D wave-equation ripple), no code copied. |
| Fonts: Bricolage Grotesque, Inter (Fontsource) | SIL OFL 1.1 | Display and body type |

Runtime dependencies are all MIT / Apache-2.0 / ISC / BSD / Zlib / OFL (checked with `license-checker-rseidelsohn`).
`@react-three/rapier`'s npm package has no `license` field, but the upstream repo is MIT.

## TODO before launch

- [ ] **Contact:** `hello@senaitechnology.com` is a placeholder (`src/content.ts`, `CONTACT_EMAIL`). The form has no
      backend and only builds a `mailto:` link. Wire up a form service or serverless endpoint.
- [ ] **AI Chat:** Set `OPENAI_API_KEY` in Vercel environment variables. Configure `CHAT_LEAD_WEBHOOK_URL` for lead routing.
- [ ] Replace the concept tiles with real case studies, and add real OpenSlot screenshots / an App Store badge.
- [ ] Add a real OG image, favicon set and analytics (if wanted).
- [ ] Tune effects on real GPUs. The screenshots came from SwiftShader (software) at low FPS, so ripple and fluid
      intensity look stronger there than they will at 60 fps.
