// İstemcide de kullanılabilen saf yardımcılar (fs yok): diff ve URL kod dönüşümü.
import type { DeckCard } from "./types";

export interface DiffEntry { dbfId: number; name: string; count: number }
export interface DeckDiff { removed: DiffEntry[]; added: DiffEntry[]; dustDelta: number }

export function diffDecks(before: DeckCard[], after: DeckCard[]): DeckDiff {
  const b = new Map(before.map((c) => [c.dbfId, c]));
  const a = new Map(after.map((c) => [c.dbfId, c]));
  const removed: DiffEntry[] = [];
  const added: DiffEntry[] = [];
  for (const [id, c] of b) {
    const n = a.get(id)?.count ?? 0;
    if (n < c.count) removed.push({ dbfId: id, name: c.name, count: c.count - n });
  }
  for (const [id, c] of a) {
    const n = b.get(id)?.count ?? 0;
    if (n < c.count) added.push({ dbfId: id, name: c.name, count: c.count - n });
  }
  const dust = (cards: DeckCard[]) => cards.reduce((s, c) => s + c.dust * c.count, 0);
  return { removed, added, dustDelta: dust(after) - dust(before) };
}

/** deckstring'i URL'de taşımak için base64url. */
export const toUrlCode = (ds: string) => ds.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const fromUrlCode = (u: string) => {
  const b = u.replace(/-/g, "+").replace(/_/g, "/");
  return b + "=".repeat((4 - (b.length % 4)) % 4);
};
