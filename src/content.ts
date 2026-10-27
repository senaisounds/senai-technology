// TODO(Senai): replace with the real inbox once the domain/email is live.
export const CONTACT_EMAIL = "hello@senaitechnology.com";

export const COLORS = {
  bg: "#0c0a08",
  ink: "#f2ece1",
  accent: "#ff5a1f",
  gold: "#e7b75f",
  cool: "#3b5bff",
} as const;

export const NAV = [
  { id: "work", label: "Work" },
  { id: "pricing", label: "Pricing" },
  { id: "process", label: "Process" },
  { id: "studio", label: "Studio" },
  { id: "faq", label: "FAQ" },
];

export type Tier = {
  id: string;
  name: string;
  tagline: string;
  fit: string;
  /** name of the tier whose features this one includes, shown as "Everything in …, plus" */
  inherits?: string;
  includes: string[];
  icon: "motion" | "app" | "play";
  /** the highlighted pick: badge, accent frame, filled CTA */
  recommended?: boolean;
  flagship?: boolean;
};

export const TIERS: Tier[] = [
  {
    id: "Launch site",
    name: "Launch",
    tagline: "One sharp page, live fast.",
    fit: "New businesses, launches, events",
    includes: ["A single long-scroll page with tasteful motion", "Mobile-first, responsive build", "Contact or booking form", "Search + social previews set up", "Domain and hosting setup"],
    icon: "motion",
  },
  {
    id: "Studio site",
    name: "Studio",
    tagline: "A multi-page site with a real identity.",
    fit: "Growing brands, shops, practices",
    inherits: "Launch",
    includes: ["Multiple pages, shaped around your content", "Type, colour and art direction for the web", "Art-directed AI imagery", "Analytics and a simple way to update content"],
    icon: "app",
    recommended: true,
  },
  {
    id: "Signature site",
    name: "Signature",
    tagline: "A fully animated showcase, built to be remembered.",
    fit: "Brands that want the wow",
    inherits: "Studio",
    includes: ["Custom 3D / WebGL hero like the one above", "Scroll-driven storytelling and micro-interactions", "Motion assets and AI-generated visuals", "Performance tuning for real phones"],
    icon: "play",
    flagship: true,
  },
];

export const INCLUDED = [
  { title: "Designed in motion", body: "You click through a moving prototype early, not a static mockup." },
  { title: "Mobile-first", body: "Built for thumbs first, then scaled up. Just as smooth on a phone." },
  { title: "Fast by default", body: "Lean code, lazy-loaded media and effects that pause off-screen." },
  { title: "Accessible", body: "Semantic HTML, keyboard support and reduced-motion fallbacks." },
  { title: "Easy to find", body: "Titles, descriptions, structured data and social cards for search, sharing and AI answers." },
  { title: "Clean handover", body: "A walkthrough at launch so you know how everything fits together." },
] as const;

export const PAYMENTS = [
  { region: "United States", via: "Stripe", body: "Card payments and invoices through Stripe." },
  { region: "Ethiopia", via: "Chapa", body: "Pay locally in birr through Chapa." },
] as const;

export const PROCESS = [
  { n: "01", title: "Brief", body: "A short call about the business, the audience and the feeling the site should leave behind." },
  { n: "02", title: "Direction", body: "Type, colour and a motion concept, delivered as a clickable prototype you can react to early." },
  { n: "03", title: "Build", body: "AI-accelerated build, hand-tuned details: motion, responsiveness, performance, accessibility." },
  { n: "04", title: "Launch", body: "Domain, analytics and a walkthrough. Then we keep iterating together if you want to." },
];

export type Art = "site" | "openslot" | "local" | "cafe" | "assistant" | "dj" | "residences";

/**
 * One entry per project. Real projects fill every field; placeholders set `status: "placeholder"` and are badged
 * as concepts everywhere they render. To add a real case study: copy an entry, set `status`, and add `images`
 * (paths under /public/work/…) to replace the generated dither art with real screenshots.
 */
export type CaseStudy = {
  slug: string;
  title: string;
  kind: string;
  year: string;
  status: "live" | "shipped" | "placeholder";
  summary: string;
  role: string[];
  services: string[];
  brief?: string;
  approach?: string;
  outcome?: string;
  href?: string;
  linkLabel?: string;
  art: Art;
  tone: { bg: string; mid: string; high: string };
  images?: { src: string; alt: string; width: number; height: number }[];
};

export const WORK: CaseStudy[] = [
  {
    slug: "senai-technology",
    title: "Senai Technology",
    kind: "Studio website",
    year: "2026",
    status: "live",
    summary: "The site you’re on: our own portfolio piece, and a working demo of the Signature tier.",
    role: ["Design", "Development", "WebGL"],
    services: ["Art direction", "Raw WebGL2 hero", "AI assistant", "Website check tool"],
    brief: "A studio site that proves the offer on first load: motion with a pulse, still fast on a phone.",
    approach:
      "A raymarched liquid form rendered through an ordered dither, with a lens that reveals the smooth render and the word ሰናይ hidden in the pixels. No Three.js: raw WebGL2, CSS motion and system-friendly fallbacks.",
    outcome: "Live now. Reduced-motion and weak-GPU visitors get a still frame instead of the animation.",
    href: "#top",
    linkLabel: "You’re looking at it",
    art: "site",
    tone: { bg: "#140c08", mid: "#ff5a1f", high: "#f2ece1" },
  },
  {
    slug: "openslot",
    title: "OpenSlot",
    kind: "Mobile app · iOS",
    year: "Past project",
    status: "shipped",
    summary: "An event and performance app for iPhone, designed and built by Senai Motley, on the App Store.",
    role: ["Product design", "iOS development"],
    services: ["Mobile app", "Booking flow", "Brand"],
    brief: "Make it easy for venues to host open mics and DJ nights, and for performers to find a slot.",
    approach:
      "Venues set up a night in minutes; performers discover comedy, music, poetry and DJ slots nearby and reserve with one tap.",
    outcome: "Shipped to the App Store.",
    href: "https://openslot.me",
    linkLabel: "openslot.me",
    art: "openslot",
    tone: { bg: "#0d0b1c", mid: "#3b5bff", high: "#e7b75f" },
  },
  {
    slug: "nora-flux",
    title: "NORA FLUX",
    kind: "DJ / artist site · Signature showcase",
    year: "2026",
    status: "live",
    summary:
      "A sound-first artist world: you choose to enter with sound, then a WebGL field pulses with a live mix. Tour dates peel open; releases orbit in 3D.",
    role: ["Art direction", "Development", "WebGL", "Web Audio"],
    services: ["Signature site", "Audio-reactive 3D", "Booking"],
    brief: "Show what the Signature tier looks like for a DJ — not a template, a night you can walk into.",
    approach:
      "An opt-in audio gate, a Three.js signal field driven by a Web Audio analyser, page-peel tickets and an orbiting mix gallery. Audio never autoplays; reduced-motion visitors get a still field.",
    outcome: "Live concept at /work/dj. Fictional artist; the craft is real.",
    href: "/work/dj",
    linkLabel: "Enter the showcase",
    art: "dj",
    tone: { bg: "#0A0B08", mid: "#D6FF3D", high: "#E8E2D4" },
  },
  {
    slug: "addis-crown-residences",
    title: "Addis Crown Residences",
    kind: "Developer pitch · Signature showcase",
    year: "2026",
    status: "live",
    summary:
      "A 60-second phone-handoff for Addis apartment developers: interactive 3D pre-sale tower, bilingual AI concierge, diaspora 30/40/30, and Prop Desk building OS.",
    role: ["Art direction", "Development", "WebGL", "Product"],
    services: ["Signature site", "Sales OS", "Prop Desk"],
    brief: "Hand Senai’s phone to a Bole developer. The page has to feel like a finished sales and property OS, not a deck.",
    approach:
      "Query-customizable project header, Twelve-storey Three.js inventory with gold/amber/emerald availability, instant EN/Amharic concierge wired to /api/chat, and a Prop Desk chair + Telegram resident preview.",
    outcome: "Live concept at /work/residences. Developer wears the public crown; Senai Technology + Prop Desk power the stack.",
    href: "/work/residences",
    linkLabel: "Open the residences pitch",
    art: "residences",
    tone: { bg: "#0B0B0D", mid: "#FFD400", high: "#F4F1EA" },
  },
  {
    slug: "open-slot-local",
    title: "Local service website",
    kind: "Website · Concept",
    year: "Open slot",
    status: "placeholder",
    summary: "Placeholder concept, not a client project: a fast, photo-led site with instant quote requests and seasonal service pages.",
    role: ["Placeholder"],
    services: ["Launch or Studio"],
    art: "local",
    tone: { bg: "#0b1410", mid: "#3fae6a", high: "#f2ece1" },
  },
  {
    slug: "open-slot-cafe",
    title: "Café & bakery website",
    kind: "Website · Concept",
    year: "Open slot",
    status: "placeholder",
    summary: "Placeholder concept, not a client project: a warm, editorial site with pre-orders, a daily menu and a nod to the Ethiopian coffee ceremony.",
    role: ["Placeholder"],
    services: ["Studio"],
    art: "cafe",
    tone: { bg: "#170d09", mid: "#c9743c", high: "#f2e3cc" },
  },
  {
    slug: "open-slot-assistant",
    title: "AI booking assistant",
    kind: "AI tool · Concept",
    year: "Open slot",
    status: "placeholder",
    summary: "Placeholder concept, not a client project: an assistant that answers questions, checks availability and books appointments.",
    role: ["Placeholder"],
    services: ["AI tools"],
    art: "assistant",
    tone: { bg: "#0a0f17", mid: "#5aa9ff", high: "#f2ece1" },
  },
];

export const ALSO = [
  { title: "Mobile apps", body: "iOS and Android, from first prototype to App Store release. We’ve shipped our own." },
  { title: "Brand identity & AI visuals", body: "Names, logos, type and colour systems, plus art-directed AI imagery that still looks like you." },
  { title: "Video & motion", body: "Launch films, social loops, product motion and 3D for the feed and the big screen." },
  { title: "AI tools for businesses", body: "Chatbots, booking assistants and quiet automations that give your team hours back." },
  { title: "Interactive & event experiences", body: "Installations, live visuals and web toys for launches, venues and performances." },
] as const;

/** Mirrored as FAQPage JSON-LD in index.html; keep the two in sync. */
export const FAQ = [
  {
    q: "How much does a website cost?",
    a: "Every project is quoted after a short brief, because scope varies a lot. The three tiers tell you what each level includes; we reply to every enquiry within two business days.",
  },
  {
    q: "How do payments work?",
    a: "Clients in the United States pay by card or invoice through Stripe. Clients in Ethiopia pay locally in birr through Chapa.",
  },
  {
    q: "What does “AI-built” mean?",
    a: "We use AI-accelerated workflows for drafts, code and imagery, which makes us faster. Every detail is then reviewed and finished by hand: motion, responsiveness, performance and accessibility.",
  },
  {
    q: "How long does it take?",
    a: "It depends on the tier and your content. Launch is the quickest; you get a timeline together with the quote.",
  },
  {
    q: "Can I update the site myself?",
    a: "Studio and Signature include a simple way to update content, and every site ends with a walkthrough so you know how it all fits together.",
  },
  {
    q: "Not sure which tier fits?",
    a: "Run the free website check to see where your current site stands, ask the assistant in the corner, or just write to us and we’ll recommend one.",
  },
];

export const PROJECT_TYPES = ["Launch site", "Studio site", "Signature site", "Mobile app", "Brand & visuals", "Something else"];
