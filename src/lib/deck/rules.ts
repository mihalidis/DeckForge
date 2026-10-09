// Deck rules — single source of truth. Update validate.test.ts before changing.

export const DECK_SIZE = 30;
export const MAX_COPIES = 2;
export const MAX_LEGENDARY_COPIES = 1;
export const MAX_RUNES = 3; // Death Knight: 3 rune slots per deck in total
export const NEUTRAL = "neutral";

/** deckstring FormatType */
export const DECKSTRING_FORMAT = { wild: 1, standard: 2, classic: 3, twist: 4 } as const;

export const CLASS_SLUGS = [
  "deathknight",
  "demonhunter",
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
] as const;
export type ClassSlug = (typeof CLASS_SLUGS)[number];

export const CLASS_NAMES: Record<ClassSlug, string> = {
  deathknight: "Death Knight",
  demonhunter: "Demon Hunter",
  druid: "Druid",
  hunter: "Hunter",
  mage: "Mage",
  paladin: "Paladin",
  priest: "Priest",
  rogue: "Rogue",
  shaman: "Shaman",
  warlock: "Warlock",
  warrior: "Warrior",
};

export function isClassSlug(s: string): s is ClassSlug {
  return (CLASS_SLUGS as readonly string[]).includes(s);
}
