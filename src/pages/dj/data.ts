export const ARTIST = "NORA FLUX";
export const MIX = {
  title: "Night Shift 04",
  subtitle: "Warehouse edit · 128 BPM · Phrygian",
  duration: "2:00",
  seconds: 120,
};

export const STEMS = [
  { id: "kick", label: "Kick" },
  { id: "hat", label: "Hat" },
  { id: "bass", label: "Bass" },
  { id: "pad", label: "Pad" },
] as const;

export type StemId = (typeof STEMS)[number]["id"];

export const TOUR = [
  { date: "15 MAR", year: "2026", venue: "Output", city: "Brooklyn", zone: "US-NY", note: "All night · Room 1" },
  { date: "22 MAR", year: "2026", venue: "Fabric", city: "London", zone: "UK", note: "Room 2 · 4 hour" },
  { date: "05 APR", year: "2026", venue: "Berghain", city: "Berlin", zone: "DE", note: "Klubnacht" },
  { date: "12 APR", year: "2026", venue: "Concrete", city: "Paris", zone: "FR", note: "Seine terrace" },
  { date: "28 APR", year: "2026", venue: "Smartbar", city: "Chicago", zone: "US-IL", note: "Afterhours" },
];

export const RELEASES = [
  { cat: "NF-011", title: "Crystalline Frequencies", kind: "LP", year: "2026", art: "rings", note: "One-take warehouse cut. No overdubs." },
  { cat: "NF-010", title: "Pulse Horizon", kind: "12\"", year: "2026", art: "bars", note: "A-side peak / B-side lock groove." },
  { cat: "NF-009", title: "Void Resonance", kind: "EP", year: "2025", art: "void", note: "Four tools. All 128–132." },
  { cat: "NF-008", title: "Echo Chamber", kind: "mix", year: "2025", art: "echo", note: "Live from a stairwell in Neukölln." },
  { cat: "NF-007", title: "Synthetic Dreams", kind: "12\"", year: "2025", art: "dream", note: "Detroit-leaning, Berlin-recorded." },
  { cat: "NF-006", title: "Field Notes", kind: "tape", year: "2024", art: "field", note: "C45. Left channel only on side B." },
];

export const PRESS = {
  lede: "A frequency first, a person second. Sets built to hold a room without asking it to clap.",
  bio: [
    "NORA FLUX works the long middle of the night: hypnotic techno that refuses the drop, recorded between a Berlin cellar and a New York loft.",
    "The live rig is four stems and a pair of hands. No laptop visuals. The site is the same idea — you enter the field, or you don’t.",
  ],
  facts: [
    { k: "2.4M", v: "monthly listeners" },
    { k: "48", v: "countries played" },
    { k: "128", v: "BPM house tempo" },
  ],
};

export const EPK_TEXT = `NORA FLUX — ELECTRONIC PRESS KIT
Issue 04 · 2026 · for promotional use only

ARTIST
NORA FLUX is a fictional showcase artist created by Senai Technology
to demonstrate a Signature-tier DJ/artist website. Treat the craft as
real; the person is not.

SOUND
Hypnotic techno / warehouse tools. 128–132 BPM. Long blends.
Live rig: kick, hat, bass, pad — the same four stems on this page.

BOOKING
hello@senaitechnology.com
Subject: NORA FLUX / booking

TECH
This page: opt-in Web Audio (synthesized loop, never autoplayed),
audio-reactive Three.js field, page-peel tour tickets, orbiting
release gallery. Respects prefers-reduced-motion.

© 2026 Senai Technology, a Slotted LLC company
`;
