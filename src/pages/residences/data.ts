export type Currency = "USD" | "ETB";
export type Availability = "available" | "reserved" | "sold";
export type PlanKind = "studio1" | "garden2" | "exec2" | "corner3" | "penthouse";
export type DiasporaCity = "Washington, DC" | "London" | "Frankfurt" | "Dubai" | "Addis Ababa";

export const RX = {
  obsidian: "#0B0B0D",
  paper: "#F4F1EA",
  gold: "#FFD400",
  amber: "#F59E0B",
  emerald: "#10B981",
  mute: "#8A8578",
} as const;

export const STATUS_HEX: Record<Availability, string> = {
  available: RX.gold,
  reserved: RX.amber,
  sold: RX.emerald,
};

export const STATUS_LABEL: Record<Availability, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};

export const STATUS_LABEL_AM: Record<Availability, string> = {
  available: "Open",
  reserved: "Held",
  sold: "Sold",
};

export const DEFAULT_PROJECT = {
  name: "Addis Crown Residences",
  location: "Bole · Addis Ababa",
  developer: "Crown Developments",
} as const;

export const ETB_PER_USD = 125;
export const FLOORS = 12;

export type Unit = {
  id: string;
  floor: number;
  code: string;
  name: string;
  beds: number;
  baths: number;
  sqm: number;
  terrace: string;
  status: Availability;
  usd: number;
  plan: PlanKind;
};

export const UNITS: Unit[] = [
  { id: "1A", floor: 1, code: "1A", name: "2BR Garden Residence", beds: 2, baths: 2, sqm: 98, terrace: "Garden patio · east courtyard", status: "available", usd: 168000, plan: "garden2" },
  { id: "1B", floor: 1, code: "1B", name: "1BR Courtyard Studio", beds: 1, baths: 1, sqm: 64, terrace: "Juliet balcony · north", status: "sold", usd: 118000, plan: "studio1" },
  { id: "2A", floor: 2, code: "2A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 148, terrace: "South-west cantilever · city", status: "reserved", usd: 248000, plan: "corner3" },
  { id: "2B", floor: 2, code: "2B", name: "2BR Executive", beds: 2, baths: 2, sqm: 112, terrace: "West balcony · dusk light", status: "available", usd: 186000, plan: "exec2" },
  { id: "3A", floor: 3, code: "3A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 152, terrace: "South-west corner · Entoto line", status: "sold", usd: 256000, plan: "corner3" },
  { id: "3B", floor: 3, code: "3B", name: "2BR Executive", beds: 2, baths: 2, sqm: 114, terrace: "West balcony · Bole road", status: "available", usd: 192000, plan: "exec2" },
  { id: "4A", floor: 4, code: "4A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 156, terrace: "South-west · airport approach", status: "available", usd: 264000, plan: "corner3" },
  { id: "4B", floor: 4, code: "4B", name: "2BR Executive", beds: 2, baths: 2, sqm: 116, terrace: "West balcony · dusk light", status: "reserved", usd: 198000, plan: "exec2" },
  { id: "5A", floor: 5, code: "5A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 158, terrace: "South-west · city canopy", status: "available", usd: 272000, plan: "corner3" },
  { id: "5B", floor: 5, code: "5B", name: "2BR Executive", beds: 2, baths: 2, sqm: 116, terrace: "West balcony · evening gold", status: "sold", usd: 198000, plan: "exec2" },
  { id: "6A", floor: 6, code: "6A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 160, terrace: "South-west · long view", status: "reserved", usd: 284000, plan: "corner3" },
  { id: "6B", floor: 6, code: "6B", name: "2BR Executive", beds: 2, baths: 2, sqm: 118, terrace: "West balcony · Bole lights", status: "available", usd: 204000, plan: "exec2" },
  { id: "7A", floor: 7, code: "7A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 162, terrace: "South-west · horizon line", status: "sold", usd: 292000, plan: "corner3" },
  { id: "7B", floor: 7, code: "7B", name: "2BR Executive", beds: 2, baths: 2, sqm: 118, terrace: "West balcony · evening gold", status: "available", usd: 208000, plan: "exec2" },
  { id: "8A", floor: 8, code: "8A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 164, terrace: "South-west · Entoto ridge", status: "available", usd: 298000, plan: "corner3" },
  { id: "8B", floor: 8, code: "8B", name: "2BR Executive", beds: 2, baths: 2, sqm: 118, terrace: "West balcony · city grid", status: "available", usd: 212000, plan: "exec2" },
  { id: "9A", floor: 9, code: "9A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 166, terrace: "South-west · long light", status: "reserved", usd: 306000, plan: "corner3" },
  { id: "9B", floor: 9, code: "9B", name: "2BR Executive", beds: 2, baths: 2, sqm: 118, terrace: "West balcony · dusk", status: "sold", usd: 214000, plan: "exec2" },
  { id: "10A", floor: 10, code: "10A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 168, terrace: "South-west · Entoto view", status: "available", usd: 312000, plan: "corner3" },
  { id: "10B", floor: 10, code: "10B", name: "2BR Executive", beds: 2, baths: 2, sqm: 118, terrace: "West balcony · Bole lights", status: "reserved", usd: 218000, plan: "exec2" },
  { id: "11A", floor: 11, code: "11A", name: "3BR Corner Residence", beds: 3, baths: 3, sqm: 176, terrace: "South-west wrap · ridge + city", status: "available", usd: 338000, plan: "corner3" },
  { id: "11B", floor: 11, code: "11B", name: "2BR Executive", beds: 2, baths: 2, sqm: 122, terrace: "West balcony · night grid", status: "sold", usd: 228000, plan: "exec2" },
  { id: "12A", floor: 12, code: "12A", name: "Sky Penthouse", beds: 4, baths: 4, sqm: 280, terrace: "360 rooftop terrace · pool + pergola", status: "available", usd: 585000, plan: "penthouse" },
];

export const MILESTONES = [
  { pct: 30, en: "Reservation / groundbreaking", am: "Hold / groundbreaking", railUsd: "Slotted LLC · Stripe / USD Wire", railEtb: "Chapa · reservation slip" },
  { pct: 40, en: "Structure complete", am: "Structure complete", railUsd: "Slotted LLC · Stripe / USD Wire", railEtb: "Ethiopian bank milestone" },
  { pct: 30, en: "Handover & keys", am: "Handover & keys", railUsd: "Slotted LLC · Stripe / USD Wire", railEtb: "Chapa / bank final" },
] as const;

export const DIASPORA_CITIES: DiasporaCity[] = [
  "Washington, DC",
  "London",
  "Frankfurt",
  "Dubai",
  "Addis Ababa",
];

export const TABS = [
  { id: "tower", n: "01", en: "3D Pre-Sale Tower", short: "Tower" },
  { id: "agent", n: "02", en: "AI Sales Agent · EN / AM", short: "Agent" },
  { id: "os", n: "03", en: "Prop Desk Building OS", short: "OS" },
  { id: "deal", n: "04", en: "Partnership Models", short: "Deal" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export type LeadTag = "Diaspora" | "Local";
export type LeadStatus = "New" | "Qualified" | "Tour booked" | "VIP pass issued" | "Locked";

export type VaultLead = {
  id: string;
  name: string;
  city: string;
  unit: string;
  tag: LeadTag;
  preference: string;
  budget: string;
  status: LeadStatus;
  locked: boolean;
  ts: string;
};

export const SEED_LEADS: VaultLead[] = [
  { id: "L-4412", name: "Hanna K.", city: "Washington, DC", unit: "10A", tag: "Diaspora", preference: "3BR · F08–F11", budget: "$280–340k", status: "Qualified", locked: true, ts: "09:14 ADD" },
  { id: "L-4418", name: "Yonas T.", city: "Addis Ababa", unit: "8B", tag: "Local", preference: "2BR · west light", budget: "ETB 22–26M", status: "Tour booked", locked: true, ts: "10:02 ADD" },
  { id: "L-4421", name: "Mariam B.", city: "London", unit: "12A", tag: "Diaspora", preference: "Sky penthouse", budget: "$520–600k", status: "VIP pass issued", locked: true, ts: "11:41 ADD" },
  { id: "L-4426", name: "Daniel G.", city: "Frankfurt", unit: "5A", tag: "Diaspora", preference: "3BR corner", budget: "$250–290k", status: "Qualified", locked: true, ts: "13:05 ADD" },
  { id: "L-4430", name: "Selam A.", city: "Dubai", unit: "4A", tag: "Diaspora", preference: "3BR · milestone USD", budget: "$240–270k", status: "New", locked: true, ts: "14:22 ADD" },
];

export const CHAIR_METRICS = {
  collection: 96.4,
  units: 23,
  occupied: 18,
  openTickets: 2,
  generatorPct: 78,
  pumpPsi: 3.4,
  waterBill: 1860,
  powerBill: 4200,
} as const;

export const WORK_ORDERS = [
  { id: "WO-204", unit: "Lift 2", issue: "On-site · car alignment", eta: "20 min", owner: "Staff", tone: "emerald" as const },
  { id: "WO-198", unit: "Pump room", issue: "Homeowner ticket · leak", eta: "Opened", owner: "Chair", tone: "amber" as const },
  { id: "WO-191", unit: "12A", issue: "Slip 4,200 ETB confirmed", eta: "Posted", owner: "Chair", tone: "gold" as const },
] as const;

export const SCENARIO_CHIPS = [
  {
    id: "milestone",
    en: "How does the 30/40/30 diaspora USD milestone payment plan work?",
    send: "How does the 30/40/30 diaspora USD milestone payment plan work?",
  },
  {
    id: "threebr",
    en: "Which 3-bedroom units are still available on Floors 8–11?",
    send: "Which 3-bedroom units are still available on Floors 8–11?",
  },
  {
    id: "pay-am",
    en: "Payment options in birr and USD — and which floors are open?",
    send: "Payment options in birr and USD, and which floors are open?",
  },
  {
    id: "tour",
    en: "Book a private site tour or WhatsApp video walkthrough",
    send: "Book a private site tour or WhatsApp video walkthrough",
  },
] as const;

export type Project = {
  name: string;
  location: string;
  developer: string;
  currency: Currency;
};

export function unitsOnFloor(floor: number): Unit[] {
  return UNITS.filter((u) => u.floor === floor);
}

export function floorStatus(floor: number): Availability {
  const units = unitsOnFloor(floor);
  if (units.some((u) => u.status === "available")) return "available";
  if (units.some((u) => u.status === "reserved")) return "reserved";
  return "sold";
}

export function etbOf(usd: number): number {
  return usd * ETB_PER_USD;
}

export function formatMoney(usd: number, currency: Currency): string {
  if (currency === "USD") return `$${usd.toLocaleString("en-US")}`;
  const etb = etbOf(usd);
  if (etb >= 1_000_000) {
    const millions = etb / 1_000_000;
    const digits = etb % 1_000_000 === 0 ? 0 : 2;
    return `ETB ${millions.toFixed(digits)}M`;
  }
  return `ETB ${etb.toLocaleString("en-US")}`;
}

export function splitMilestone(usd: number, currency: Currency) {
  return MILESTONES.map((m) => ({
    ...m,
    amount: formatMoney(Math.round((usd * m.pct) / 100), currency),
  }));
}

export function availableThreeBed(floors: [number, number]) {
  return UNITS.filter(
    (u) => u.beds >= 3 && u.status === "available" && u.floor >= floors[0] && u.floor <= floors[1],
  );
}

export function parseProject(search: URLSearchParams): Project {
  const pick = (key: string, fallback: string) => {
    const v = search.get(key);
    return v && v.trim() ? v.trim() : fallback;
  };
  const raw = (search.get("currency") || "USD").toUpperCase();
  return {
    name: pick("name", DEFAULT_PROJECT.name),
    location: pick("location", DEFAULT_PROJECT.location),
    developer: pick("developer", DEFAULT_PROJECT.developer),
    currency: raw === "ETB" ? "ETB" : "USD",
  };
}

export function projectQuery(p: Project): URLSearchParams {
  return new URLSearchParams({
    name: p.name,
    location: p.location,
    developer: p.developer,
    currency: p.currency,
  });
}

export function passSerial(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 33 + seed.charCodeAt(i)) >>> 0;
  return `SENAI-VIP-${(n % 9000 + 1000).toString(16).toUpperCase().padStart(4, "0")}`;
}

export function addisClock(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Addis_Ababa",
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m} ADD`;
}
