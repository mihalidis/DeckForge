// Blizzard Hearthstone Game Data API response types (raw shape). The normalized card type is in src/lib/cards/types.ts.
// Reference: docs/API-NOTES.md

export type Region = "us" | "eu" | "kr" | "tw";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number; // seconds (~86399)
  sub?: string;
}

export interface MetadataSet {
  id: number;
  name: string;
  slug: string;
  type?: string;
  hyped?: boolean; // true = announced but not yet playable (upcoming) set
  releaseDate?: string | null;
  collectibleCount?: number;
  collectibleRevealedCount?: number;
  nonCollectibleCount?: number;
  nonCollectibleRevealedCount?: number;
  aliasSetIds?: number[];
}

export interface MetadataSetGroup {
  slug: string; // "standard" | "wild" | year slugs ...
  name: string;
  cardSets: string[]; // list of set slugs
  standard?: boolean;
  year?: number;
  yearRange?: string;
  icon?: string;
  svg?: string;
}

export interface MetadataClass {
  id: number;
  slug: string; // "shaman", "neutral", ...
  name: string;
  cardId?: number; // base hero dbfId
  heroPowerCardId?: number;
  alternateHeroCardIds?: number[];
}

export interface MetadataNamed {
  id: number;
  slug: string;
  name: string;
}

export interface MetadataRarity extends MetadataNamed {
  craftingCost: (number | null)[]; // [normal, golden]
  dustValue: (number | null)[];
}

export interface MetadataKeyword extends MetadataNamed {
  refText?: string;
  text?: string;
  gameModes?: number[];
}

export interface Metadata {
  sets: MetadataSet[];
  setGroups: MetadataSetGroup[];
  types: MetadataNamed[];
  rarities: MetadataRarity[];
  classes: MetadataClass[];
  minionTypes: MetadataNamed[];
  spellSchools: MetadataNamed[];
  keywords: MetadataKeyword[];
  gameModes?: MetadataNamed[];
  arenaIds?: number[];
  [key: string]: unknown;
}

export interface RuneCost {
  blood: number;
  frost: number;
  unholy: number;
}

export interface ApiCard {
  id: number; // dbfId
  collectible: 0 | 1;
  slug: string;
  classId: number | null; // null for dual/multi-class cards; classes are in multiClassIds
  multiClassIds: number[];
  cardTypeId: number;
  cardSetId: number;
  rarityId: number;
  minionTypeId?: number;
  multiTypeIds?: number[];
  spellSchoolId?: number;
  artistName?: string;
  manaCost: number;
  attack?: number;
  health?: number;
  durability?: number;
  armor?: number;
  name: string;
  text?: string;
  image: string;
  imageGold?: string;
  cropImage?: string;
  flavorText?: string;
  keywordIds?: number[];
  runeCost?: RuneCost;
  childIds?: number[];
  parentId?: number;
  copyOfCardId?: number;
  touristClassId?: number;
  maxSideboardCards?: number;
  isZilliaxFunctionalModule?: boolean;
  isZilliaxCosmeticModule?: boolean;
  duels?: { relevant?: boolean; constructed?: boolean };
  battlegrounds?: unknown;
  [key: string]: unknown;
}

export interface CardSearchResponse {
  cards: ApiCard[];
  cardCount: number;
  pageCount: number;
  page: number;
}

export interface CardSearchParams {
  set?: string; // "standard" | "wild" | set slug
  class?: string; // "shaman" | "shaman,neutral"
  manaCost?: string | number;
  attack?: string | number;
  health?: string | number;
  collectible?: "0" | "1" | "0,1";
  rarity?: string;
  type?: string;
  minionType?: string;
  spellSchool?: string;
  keyword?: string;
  textFilter?: string;
  gameMode?: "constructed" | "battlegrounds" | "mercenaries";
  page?: number;
  pageSize?: number;
  sort?: string; // "manaCost:asc"
}

export interface DeckResponse {
  deckCode: string;
  version: number;
  format: "standard" | "wild" | "classic" | "twist";
  hero: ApiCard;
  heroPower: ApiCard;
  class: MetadataClass;
  cards: ApiCard[];
  sideboardCards?: { sideboardCards: ApiCard[]; cardId: number }[];
  cardCount: number;
  invalidCardIds?: number[];
}
