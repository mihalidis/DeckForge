// Candidate pool: all class + neutral + dual cards (~380 cards in Standard, ~10k tokens → all are sent).
// Work done here: resolve seed cards by name, sort cards by relevance score (seeds on top),
// filter by constraints (noLegendaries, mustExclude) and produce the compact block sent to the LLM.

import { toCompactBlock } from "@/lib/cards/compact";
import type { CardRecord } from "@/lib/cards/types";
import type { Intent } from "./schemas";

export interface RetrievedCard {
  card: CardRecord;
  score: number;
  reasons: string[];
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[’'`,.!:\-]/g, "").replace(/\s+/g, " ").trim();

/** Find a card by name: exact match > prefix > contains. */
export function findCardByName(name: string, pool: CardRecord[]): CardRecord | undefined {
  const n = norm(name);
  if (!n) return undefined;
  const direct =
    pool.find((c) => norm(c.name) === n) ??
    pool.find((c) => norm(c.name).startsWith(n)) ??
    pool.find((c) => norm(c.name).includes(n)) ??
    pool.find((c) => n.includes(norm(c.name)) && norm(c.name).length > 5);
  if (direct) return direct;
  // The LLM may give the "old/long" form of the name ("Al'Akir the Windlord" ↔ "Al'Akir, Lord of Storms"):
  // shorten word prefixes and look for a single prefix match (min 4 chars, short words like "the/of" excluded).
  const words = n.split(" ").filter((w) => w.length > 0);
  for (let k = words.length - 1; k >= 1; k--) {
    const prefix = words.slice(0, k).join(" ");
    if (prefix.length < 4) break;
    const hits = pool.filter((c) => norm(c.name).startsWith(prefix));
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) return undefined; // ambiguous; better to report not found than pick the wrong card
  }
  return undefined;
}

function tokensOf(c: CardRecord): Set<string> {
  const t = new Set<string>();
  for (const k of c.keywords) t.add(`kw:${k}`);
  for (const m of c.minionTypes) t.add(`tribe:${m}`);
  if (c.spellSchool) t.add(`school:${c.spellSchool}`);
  const text = c.text.toLowerCase();
  for (const w of ["murloc", "dragon", "elemental", "beast", "undead", "demon", "mech", "pirate", "naga", "totem", "draenei", "quilboar"]) {
    if (text.includes(w)) t.add(`mentions:${w}`);
  }
  for (const w of ["battlecry", "deathrattle", "taunt", "rush", "secret", "weapon", "armor", "heal", "discover", "overload", "corpse", "spell damage", "frenzy", "lifesteal", "divine shield", "combo", "outcast", "choose one", "quest", "excavate", "forge", "tradeable", "finale", "infuse", "location"]) {
    if (text.includes(w)) t.add(`mentions:${w}`);
  }
  return t;
}

export function retrieveCandidates(intent: Intent, pool: CardRecord[]) {
  const seeds = intent.seedCards
    .concat(intent.mustInclude)
    .map((n) => findCardByName(n, pool))
    .filter((c): c is CardRecord => !!c);
  const seedIds = new Set(seeds.map((s) => s.dbfId));
  const excluded = new Set(
    intent.mustExclude.map((n) => findCardByName(n, pool)?.dbfId).filter((x): x is number => x !== undefined),
  );

  // Tag set of the seed cards: tribe/keyword/school/text keys
  const seedTokens = new Set<string>();
  for (const s of seeds) for (const t of tokensOf(s)) seedTokens.add(t);
  // If the seed is a tribe member, match "mentions:tribe"; if it mentions a tribe, match its members
  for (const t of Array.from(seedTokens)) {
    if (t.startsWith("tribe:")) seedTokens.add(`mentions:${t.slice(6)}`);
    if (t.startsWith("mentions:")) seedTokens.add(`tribe:${t.slice(9)}`);
    if (t.startsWith("kw:")) seedTokens.add(`mentions:${t.slice(3)}`);
  }
  const focusTribe = intent.constraints.tribe?.toLowerCase();
  const focusKw = intent.constraints.keyword?.toLowerCase();

  const scored: RetrievedCard[] = [];
  for (const card of pool) {
    if (excluded.has(card.dbfId)) continue;
    if (intent.constraints.noLegendaries && card.rarity === "legendary" && !seedIds.has(card.dbfId)) continue;
    const reasons: string[] = [];
    let score = 0;
    if (seedIds.has(card.dbfId)) { score += 100; reasons.push("seed"); }
    const toks = tokensOf(card);
    let overlap = 0;
    for (const t of toks) if (seedTokens.has(t)) overlap++;
    if (overlap) { score += Math.min(overlap, 4) * 5; reasons.push(`synergy:${overlap}`); }
    if (focusTribe && (toks.has(`tribe:${focusTribe}`) || toks.has(`mentions:${focusTribe}`))) { score += 15; reasons.push(`tribe:${focusTribe}`); }
    if (focusKw && (toks.has(`kw:${focusKw}`) || toks.has(`mentions:${focusKw}`))) { score += 15; reasons.push(`kw:${focusKw}`); }
    if (card.classSlug !== "neutral") score += 2; // class cards slightly ahead
    if (intent.archetype === "aggro" && card.cost <= 3) score += 3;
    if (intent.archetype === "control" && (toks.has("mentions:armor") || toks.has("mentions:heal") || card.cost >= 6)) score += 3;
    scored.push({ card, score, reasons });
  }
  scored.sort((a, b) => b.score - a.score || a.card.cost - b.card.cost || a.card.dbfId - b.card.dbfId);

  const compact = toCompactBlock(scored.map((s) => s.card));
  return { seeds, excluded, candidates: scored, compact };
}
