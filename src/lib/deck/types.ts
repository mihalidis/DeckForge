import type { CardRecord } from "@/lib/cards/types";

export type Archetype = "aggro" | "midrange" | "control" | "combo" | "unspecified";
export type DeckFormat = "standard";

/** Raw deck from the LLM / into the validator: just id + count. */
export interface DeckSpec {
  classSlug: string;
  format: DeckFormat;
  cards: { dbfId: number; count: number }[];
}

export interface DeckCard extends CardRecord {
  count: 1 | 2;
}

export interface Swap {
  out: DeckCard;
  in: DeckCard;
  why: string;
}

export interface DeckSection {
  id: "plan" | "syn" | "mull" | "swaps";
  title: string;
  paras: string[];
}

export interface DeckResult {
  id: string; // short hash of the deckstring
  name: string;
  classSlug: string;
  className: string;
  format: DeckFormat;
  archetype: Archetype;
  cards: DeckCard[]; // sorted by cost
  cardCount: number;
  dust: number;
  deckstring: string;
  clipboardText: string;
  sections: DeckSection[];
  swaps: Swap[];
  verifiedByBlizzard: boolean;
}

/** The mechanical part of DeckResult without LLM explanations (assemble, /api/deck, /d/[code]). */
export type DeckCore = Pick<DeckResult, "id" | "name" | "classSlug" | "className" | "format" | "archetype" | "cards" | "cardCount" | "dust" | "deckstring" | "clipboardText">;

export type ValidationCode =
  | "SIZE"
  | "COPIES"
  | "UNKNOWN_CARD"
  | "CLASS_MISMATCH"
  | "RUNES"
  | "DUPLICATE_ENTRY"
  | "BAD_COUNT";

export interface ValidationError {
  code: ValidationCode;
  message: string;
  dbfId?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  cardCount: number;
}
