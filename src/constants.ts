export const SCHOOL_ORDER = [
  "Trinity", "Gehenna", "Millennium", "Abydos", "Hyakkiyako",
  "Shanhaijing", "Red Winter", "Arius", "SRT", "Valkyrie"
] as const;
export type School = typeof SCHOOL_ORDER[number];

export const DAMAGE_ORDER = ["Explosive", "Penetration", "Mystic"] as const;
export type DamageType = typeof DAMAGE_ORDER[number];

export const API_BASE = "https://api-blue-archive.vercel.app";