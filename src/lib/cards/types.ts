// Normalized card record: the shape in data/cards.standard.json.
// All id → slug conversions happen during sync; app code never deals with ids.

export type Rarity = "free" | "common" | "rare" | "epic" | "legendary";
export type CardType = "minion" | "spell" | "weapon" | "hero" | "location" | string;

export interface CardRecord {
  dbfId: number; // Blizzard `id`; used by the deckstring
  slug: string;
  name: string;
  text: string; // HTML tags stripped
  cost: number;
  attack?: number;
  health?: number;
  durability?: number;
  armor?: number;
  type: CardType;
  classSlug: string; // "shaman" | "neutral" | ...
  multiClass: string[]; // extra classes for dual-class cards
  rarity: Rarity;
  set: string; // set slug
  minionTypes: string[];
  spellSchool?: string;
  keywords: string[];
  runeCost?: { blood: number; frost: number; unholy: number };
  touristClass?: string;
  maxSideboardCards?: number;
  dust: number; // normal craft cost
  image: string;
  cropImage?: string;
}

export interface ClassInfo {
  id: number;
  slug: string;
  name: string;
  heroDbfId?: number; // for deckstring heroes[]
}

export interface SetInfo {
  id: number;
  slug: string;
  name: string;
}

export interface CardDataset {
  syncedAt: string; // ISO
  format: "standard";
  locale: string;
  region: string;
  standardSets: string[]; // metadata.setGroups[standard].cardSets
  classes: ClassInfo[];
  sets: SetInfo[];
  keywords: { slug: string; name: string; text?: string }[];
  cards: CardRecord[];
}
