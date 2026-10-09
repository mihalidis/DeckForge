// Code-based last-resort repair: if the LLM can't fix the deck in two rounds, it is fixed mechanically here.
// Invalid cards are dropped, excess is trimmed, shortfall is filled with the highest-scoring candidates.

import type { CardRecord } from "@/lib/cards/types";
import { DECK_SIZE } from "@/lib/deck/rules";
import { cardBelongsToClass, validateDeck } from "@/lib/deck/validate";
import type { DeckSpec } from "@/lib/deck/types";
import type { RetrievedCard } from "./retrieve";

export function mechanicalRepair(
  spec: DeckSpec,
  lookup: (id: number) => CardRecord | undefined,
  candidates: RetrievedCard[],
  seeds: CardRecord[],
): DeckSpec {
  // 1) merge + drop invalid ones
  const merged = new Map<number, number>();
  for (const e of spec.cards) {
    const card = lookup(e.dbfId);
    if (!card || !cardBelongsToClass(card, spec.classSlug)) continue;
    const max = card.rarity === "legendary" ? 1 : 2;
    merged.set(e.dbfId, Math.min(max, (merged.get(e.dbfId) ?? 0) + Math.max(1, Math.floor(e.count))));
  }
  // 2) seeds are guaranteed
  for (const s of seeds) if (!merged.has(s.dbfId)) merged.set(s.dbfId, 1);

  // 3) on rune violation, drop the lowest-scoring rune cards
  const scoreOf = new Map(candidates.map((c) => [c.card.dbfId, c.score]));
  const seedIds = new Set(seeds.map((s) => s.dbfId));
  const toSpec = (): DeckSpec => ({ ...spec, cards: Array.from(merged, ([dbfId, count]) => ({ dbfId, count })) });
  let guard = 0;
  while (validateDeck(toSpec(), lookup).errors.some((e) => e.code === "RUNES") && guard++ < 40) {
    const runeCards = Array.from(merged.keys())
      .map((id) => lookup(id)!)
      .filter((c) => c.runeCost && !seedIds.has(c.dbfId))
      .sort((a, b) => (scoreOf.get(a.dbfId) ?? 0) - (scoreOf.get(b.dbfId) ?? 0));
    if (!runeCards.length) break;
    merged.delete(runeCards[0].dbfId);
  }

  // 4) size: trim from the lowest-scoring if over, fill from the highest-scoring if under
  const total = () => Array.from(merged.values()).reduce((a, b) => a + b, 0);
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  while (total() > DECK_SIZE) {
    const victim = Array.from(merged.keys())
      .filter((id) => !seedIds.has(id))
      .sort((a, b) => (scoreOf.get(a) ?? 0) - (scoreOf.get(b) ?? 0))[0];
    if (victim === undefined) break;
    const n = merged.get(victim)!;
    if (n > 1) merged.set(victim, n - 1); else merged.delete(victim);
  }
  for (const c of ordered) {
    if (total() >= DECK_SIZE) break;
    const id = c.card.dbfId;
    const max = c.card.rarity === "legendary" ? 1 : 2;
    const cur = merged.get(id) ?? 0;
    if (cur >= max) continue;
    const trial = new Map(merged); trial.set(id, cur + 1);
    const trialSpec: DeckSpec = { ...spec, cards: Array.from(trial, ([dbfId, count]) => ({ dbfId, count })) };
    if (validateDeck(trialSpec, lookup).errors.some((e) => e.code === "RUNES")) continue;
    merged.set(id, cur + 1);
  }
  return toSpec();
}
