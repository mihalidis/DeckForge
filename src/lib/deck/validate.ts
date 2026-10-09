// Deterministic deck validator. LLM output is never shown to the user without passing through here.

import type { CardRecord } from "@/lib/cards/types";
import { DECK_SIZE, MAX_COPIES, MAX_LEGENDARY_COPIES, MAX_RUNES, NEUTRAL } from "./rules";
import type { DeckSpec, ValidationError, ValidationResult } from "./types";

export type CardLookup = (dbfId: number) => CardRecord | undefined;

export function cardBelongsToClass(card: CardRecord, classSlug: string): boolean {
  return card.classSlug === classSlug || card.classSlug === NEUTRAL || card.multiClass.includes(classSlug);
}

export function validateDeck(spec: DeckSpec, lookup: CardLookup): ValidationResult {
  const errors: ValidationError[] = [];
  const seen = new Set<number>();
  let total = 0;
  let maxBlood = 0, maxFrost = 0, maxUnholy = 0;

  for (const entry of spec.cards) {
    if (seen.has(entry.dbfId)) {
      errors.push({ code: "DUPLICATE_ENTRY", dbfId: entry.dbfId, message: `Card ${entry.dbfId} is listed more than once; merge into one entry with count.` });
      continue;
    }
    seen.add(entry.dbfId);

    if (!Number.isInteger(entry.count) || entry.count < 1) {
      errors.push({ code: "BAD_COUNT", dbfId: entry.dbfId, message: `Card ${entry.dbfId} has invalid count ${entry.count}.` });
      continue;
    }
    total += entry.count;

    const card = lookup(entry.dbfId);
    if (!card) {
      errors.push({ code: "UNKNOWN_CARD", dbfId: entry.dbfId, message: `Card ${entry.dbfId} is not in the Standard collectible pool. Use only ids from the candidate list.` });
      continue;
    }
    const maxCopies = card.rarity === "legendary" ? MAX_LEGENDARY_COPIES : MAX_COPIES;
    if (entry.count > maxCopies) {
      errors.push({ code: "COPIES", dbfId: entry.dbfId, message: `${card.name} (${card.dbfId}) x${entry.count}: max ${maxCopies} copy${maxCopies > 1 ? "ies" : ""} (${card.rarity}).` });
    }
    if (!cardBelongsToClass(card, spec.classSlug)) {
      errors.push({ code: "CLASS_MISMATCH", dbfId: card.dbfId, message: `${card.name} (${card.dbfId}) is a ${card.classSlug} card and cannot go in a ${spec.classSlug} deck.` });
    }
    if (card.runeCost) {
      maxBlood = Math.max(maxBlood, card.runeCost.blood);
      maxFrost = Math.max(maxFrost, card.runeCost.frost);
      maxUnholy = Math.max(maxUnholy, card.runeCost.unholy);
    }
  }

  if (total !== DECK_SIZE) {
    errors.push({ code: "SIZE", message: `Deck has ${total} cards; it must have exactly ${DECK_SIZE}.` });
  }
  if (maxBlood + maxFrost + maxUnholy > MAX_RUNES) {
    errors.push({ code: "RUNES", message: `Rune requirements exceed ${MAX_RUNES} slots: needs ${maxBlood} Blood, ${maxFrost} Frost, ${maxUnholy} Unholy. Keep cards within one 3-rune combination.` });
  }

  return { ok: errors.length === 0, errors, cardCount: total };
}

/** Short text for sending errors to the LLM repair round. */
export function formatErrors(errors: ValidationError[]): string {
  return errors.map((e) => `- [${e.code}] ${e.message}`).join("\n");
}
