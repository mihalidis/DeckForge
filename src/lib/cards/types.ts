// Normalize edilmiş kart kaydı: data/cards.standard.json içindeki şekil.
// Tüm id → slug çevirileri senkron sırasında yapılır; uygulama kodu id'lerle uğraşmaz.

export type Rarity = "free" | "common" | "rare" | "epic" | "legendary";
export type CardType = "minion" | "spell" | "weapon" | "hero" | "location" | string;

export interface CardRecord {
  dbfId: number; // Blizzard `id`; deckstring bunu kullanır
  slug: string;
  name: string;
  text: string; // HTML etiketleri temizlenmiş
  cost: number;
  attack?: number;
  health?: number;
  durability?: number;
  armor?: number;
  type: CardType;
  classSlug: string; // "shaman" | "neutral" | ...
  multiClass: string[]; // dual-class kartlar için ek sınıflar
  rarity: Rarity;
  set: string; // set slug
  minionTypes: string[];
  spellSchool?: string;
  keywords: string[];
  runeCost?: { blood: number; frost: number; unholy: number };
  touristClass?: string;
  maxSideboardCards?: number;
  dust: number; // normal craft maliyeti
  image: string;
  cropImage?: string;
}

export interface ClassInfo {
  id: number;
  slug: string;
  name: string;
  heroDbfId?: number; // deckstring heroes[] için
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
