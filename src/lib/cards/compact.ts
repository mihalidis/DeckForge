// Compact card line sent to the LLM. The format is fixed; prompts are written against it:
//   dbfId|Name|cost|atk/hp|type|rarity|class|tribes;keywords|text
// Example: 61550|Shudderwock|9|6/6|minion|legendary|shaman|battlecry|Battlecry: Repeat all other Battlecries from cards you played this game (targets chosen randomly).

import type { CardRecord } from "./types";

export function statsOf(c: CardRecord): string {
  if (c.type === "minion") return `${c.attack ?? 0}/${c.health ?? 0}`;
  if (c.type === "weapon") return `${c.attack ?? 0}/${c.durability ?? 0}`;
  if (c.type === "hero") return `+${c.armor ?? 0}`;
  if (c.type === "location") return `${c.durability ?? c.health ?? 0}d`;
  return "-";
}

export function toCompactLine(c: CardRecord): string {
  const tags = [...c.minionTypes, ...c.keywords, ...(c.spellSchool ? [c.spellSchool] : [])]
    .filter(Boolean)
    .join(";");
  const cls = c.multiClass.length ? `${c.classSlug}+${c.multiClass.join("+")}` : c.classSlug;
  const extras: string[] = [];
  if (c.runeCost) {
    const r = c.runeCost;
    extras.push(`runes:${"B".repeat(r.blood)}${"F".repeat(r.frost)}${"U".repeat(r.unholy)}`);
  }
  if (c.touristClass) extras.push(`tourist:${c.touristClass}`);
  const text = extras.length ? `${c.text} [${extras.join(" ")}]` : c.text;
  return [c.dbfId, c.name, c.cost, statsOf(c), c.type, c.rarity, cls, tags, text].join("|");
}

export function toCompactBlock(cards: CardRecord[]): string {
  return cards.map(toCompactLine).join("\n");
}

/** Rough token estimate (4 chars ≈ 1 token). For the eval report. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
