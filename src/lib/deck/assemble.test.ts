import { describe, expect, it } from "vitest";
import type { DeckCard } from "./types";
import { diffDecks, fromUrlCode, toUrlCode } from "./share";

const mk = (dbfId: number, name: string, count: 1 | 2, dust = 40): DeckCard => ({
  dbfId, slug: "", name, text: "", cost: 1, type: "minion", classSlug: "shaman", multiClass: [], rarity: "common",
  set: "core", minionTypes: [], keywords: [], dust, image: "", count,
});

describe("diffDecks", () => {
  it("çıkan/giren kartları ve dust farkını hesaplar", () => {
    const before = [mk(1, "A", 2), mk(2, "B", 1, 1600), mk(3, "C", 2)];
    const after = [mk(1, "A", 1), mk(3, "C", 2), mk(4, "D", 2, 100)];
    const d = diffDecks(before, after);
    expect(d.removed).toEqual([{ dbfId: 1, name: "A", count: 1 }, { dbfId: 2, name: "B", count: 1 }]);
    expect(d.added).toEqual([{ dbfId: 4, name: "D", count: 2 }]);
    expect(d.dustDelta).toBe((40 + 80 + 200) - (80 + 1600 + 80));
  });
});

describe("url code", () => {
  it("base64 ↔ base64url round-trip", () => {
    const ds = "AAECAaoIBKiKBNC/B4LUB6iBCA39nwTTngbt5gbo/AbChwfQnQfLrQexsAfOuwePvgfDwAfJwAfJ2wcAAA==";
    const u = toUrlCode(ds);
    expect(u).not.toMatch(/[+/=]/);
    expect(fromUrlCode(u)).toBe(ds);
  });
});
