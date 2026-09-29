export const SERVICES = [
  {
    n: "01",
    title: "AI-built websites & web apps",
    body: "Fast, beautiful sites and web apps built with AI-accelerated workflows — from launch pages to booking flows and full product dashboards.",
    tags: ["Marketing sites", "Web apps", "E-commerce"],
  },
  {
    n: "02",
    title: "Mobile apps",
    body: "iOS and Android apps from first prototype to App Store release. Native feel, real-world tested — we've shipped our own.",
    tags: ["iOS", "Android", "Prototypes"],
  },
  {
    n: "03",
    title: "Brand identity & AI visuals",
    body: "Names, logos, type and colour systems, plus art-directed AI imagery that still looks unmistakably like you.",
    tags: ["Identity", "Art direction", "AI imagery"],
  },
  {
    n: "04",
    title: "Video & motion",
    body: "Launch films, social loops, product motion and 3D — cinematic content made for the feed and the big screen.",
    tags: ["Motion design", "3D", "Social"],
  },
  {
    n: "05",
    title: "AI tools for businesses",
    body: "Chatbots, booking assistants and quiet automations that answer customers, fill calendars and give your team hours back.",
    tags: ["Chatbots", "Booking assistants", "Automations"],
  },
  {
    n: "06",
    title: "Interactive & event experiences",
    body: "Installations, live visuals and playful web toys for launches, venues and performances — things people want to touch.",
    tags: ["Installations", "Live visuals", "Web toys"],
  },
];

export type WorkItem = {
  title: string;
  kind: string;
  blurb: string;
  label: "Shipped" | "Concept";
  href?: string;
  art: string; // css class for generated art
};

export const WORK: WorkItem[] = [
  {
    title: "OpenSlot",
    kind: "Mobile app · iOS",
    blurb:
      "Past project: an event & performance app for iPhone. Venues host open mics and DJ nights in minutes; performers discover comedy, music, poetry and DJ slots nearby and reserve with one tap. Designed and built by Senai Motley; on the App Store.",
    label: "Shipped",
    href: "https://openslot.me",
    art: "art-openslot",
  },
  {
    title: "Greenline Landscaping",
    kind: "Website · Local service",
    blurb: "Concept: a fast, photo-led site with instant quote requests and seasonal service pages for a Hudson Valley landscaper.",
    label: "Concept",
    art: "art-landscape",
  },
  {
    title: "Buna & Butter",
    kind: "Website · Pastry shop",
    blurb: "Concept: a warm, editorial bakery site with pre-orders, a daily-bake menu and a nod to Ethiopian coffee ceremony.",
    label: "Concept",
    art: "art-pastry",
  },
  {
    title: "Slot — AI booking assistant",
    kind: "AI tool · Chat & calendar",
    blurb: "Concept: a friendly assistant that answers questions, checks availability and books appointments over web chat and SMS.",
    label: "Concept",
    art: "art-assistant",
  },
];

// TODO(Senai): replace with the real inbox once the domain/email is live.
export const CONTACT_EMAIL = "hello@senaitechnology.com";
