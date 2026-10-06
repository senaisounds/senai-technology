// TODO(Senai): replace with the real inbox once the domain/email is live.
export const CONTACT_EMAIL = "hello@senaitechnology.com";

export const COLORS = {
  bg: "#0b0a09",
  ink: "#f2ece1",
  accent: "#ff5a1f",
  gold: "#e7b75f",
  cool: "#3b5bff",
} as const;

export type Tier = {
  id: string;
  name: string;
  tagline: string;
  fit: string;
  includes: string[];
  icon: "motion" | "app" | "play";
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
    includes: ["Everything in Launch", "Multiple pages, shaped around your content", "Type, colour and art direction for the web", "Art-directed AI imagery", "Analytics and a simple way to update content"],
    icon: "app",
  },
  {
    id: "Signature site",
    name: "Signature",
    tagline: "A fully animated showcase, built to be remembered.",
    fit: "Brands that want the wow",
    includes: ["Everything in Studio", "Custom 3D / WebGL hero like the one above", "Scroll-driven storytelling and micro-interactions", "Motion assets and AI-generated visuals", "Performance tuning for real phones"],
    icon: "play",
    flagship: true,
  },
];

export const INCLUDED = [
  { icon: "motion", title: "Designed in motion", body: "You click through a moving prototype early, not a static mockup." },
  { icon: "mobile", title: "Mobile-first", body: "Built for thumbs first, then scaled up. Just as smooth on a phone." },
  { icon: "fast", title: "Fast by default", body: "Lean code, lazy-loaded media and effects that pause off-screen." },
  { icon: "access", title: "Accessible", body: "Semantic HTML, keyboard support and reduced-motion fallbacks." },
  { icon: "search", title: "Easy to find", body: "Titles, descriptions and social cards set up for search and sharing." },
  { icon: "handover", title: "Clean handover", body: "A walkthrough at launch so you know how everything fits together." },
] as const;

export const PROCESS = [
  { n: "01", title: "Brief", body: "A short call about the business, the audience and the feeling the site should leave behind." },
  { n: "02", title: "Direction", body: "Type, colour and a motion concept, delivered as a clickable prototype you can react to early." },
  { n: "03", title: "Build", body: "AI-accelerated build, hand-tuned details: motion, responsiveness, performance, accessibility." },
  { n: "04", title: "Launch", body: "Domain, analytics and a walkthrough. Then we keep iterating together if you want to." },
];

export type WorkItem = {
  title: string;
  kind: string;
  year: string;
  blurb: string;
  status: "live" | "shipped" | "placeholder";
  href?: string;
  linkLabel?: string;
  art: "site" | "openslot" | "local" | "cafe" | "assistant";
  tone: { bg: string; mid: string; high: string };
};

export const WORK: WorkItem[] = [
  {
    title: "Senai Technology",
    kind: "Studio website · WebGL, React",
    year: "2026",
    blurb:
      "The site you’re on. A raymarched liquid form rendered through an ordered dither, with a lens that reveals the real render underneath. Built AI-accelerated, tuned by hand, and it respects reduced-motion settings.",
    status: "live",
    href: "#top",
    linkLabel: "You’re looking at it",
    art: "site",
    tone: { bg: "#140c08", mid: "#ff5a1f", high: "#f2ece1" },
  },
  {
    title: "OpenSlot",
    kind: "Mobile app · iOS",
    year: "Past project",
    blurb:
      "An event and performance app for iPhone. Venues host open mics and DJ nights in minutes; performers discover comedy, music, poetry and DJ slots nearby and reserve with one tap. Designed and built by Senai Motley; on the App Store.",
    status: "shipped",
    href: "https://openslot.me",
    linkLabel: "openslot.me",
    art: "openslot",
    tone: { bg: "#0d0b1c", mid: "#3b5bff", high: "#e7b75f" },
  },
  {
    title: "NORA FLUX — DJ/Artist Site",
    kind: "Music website · Concept",
    year: "2026 showcase",
    blurb: "Placeholder concept: a premium, music-driven artist site with beat-synced visuals, interactive track player, tour dates, and EPK. Showcases the 'Signature' tier craft for DJs and electronic music artists.",
    status: "placeholder",
    href: "/work/dj",
    linkLabel: "Explore the showcase",
    art: "local",
    tone: { bg: "#0a0514", mid: "#667eea", high: "#f093fb" },
  },
  {
    title: "Local service website",
    kind: "Website · Concept",
    year: "Open slot",
    blurb: "Placeholder concept, not a client project: a fast, photo-led site with instant quote requests and seasonal service pages for a local business.",
    status: "placeholder",
    art: "local",
    tone: { bg: "#0b1410", mid: "#3fae6a", high: "#f2ece1" },
  },
  {
    title: "Café & bakery website",
    kind: "Website · Concept",
    year: "Open slot",
    blurb: "Placeholder concept, not a client project: a warm, editorial site with pre-orders, a daily menu and a nod to the Ethiopian coffee ceremony.",
    status: "placeholder",
    art: "cafe",
    tone: { bg: "#170d09", mid: "#c9743c", high: "#f2e3cc" },
  },
  {
    title: "AI booking assistant",
    kind: "AI tool · Concept",
    year: "Open slot",
    blurb: "Placeholder concept, not a client project: a friendly assistant that answers questions, checks availability and books appointments over web chat and SMS.",
    status: "placeholder",
    art: "assistant",
    tone: { bg: "#0a0f17", mid: "#5aa9ff", high: "#f2ece1" },
  },
];

export const ALSO = [
  { icon: "app", title: "Mobile apps", body: "iOS and Android, from first prototype to App Store release. We’ve shipped our own." },
  { icon: "brand", title: "Brand identity & AI visuals", body: "Names, logos, type and colour systems, plus art-directed AI imagery that still looks like you." },
  { icon: "film", title: "Video & motion", body: "Launch films, social loops, product motion and 3D for the feed and the big screen." },
  { icon: "chat", title: "AI tools for businesses", body: "Chatbots, booking assistants and quiet automations that give your team hours back." },
  { icon: "play", title: "Interactive & event experiences", body: "Installations, live visuals and web toys for launches, venues and performances." },
] as const;

export const PROJECT_TYPES = ["Launch site", "Studio site", "Signature site", "Mobile app", "Brand & visuals", "Something else"];
