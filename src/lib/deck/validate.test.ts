import { describe, expect, it } from "vitest";
import type { CardRecord } from "@/lib/cards/types";
import { validateDeck } from "./validate";

const mk = (dbfId: number, over: Partial<CardRecord> = {}): CardRecord => ({
  dbfId, slug: `${dbfId}-x`, name: `Card ${dbfId}`, text: "", cost: 1, type: "minion",
  classSlug: "shaman", multiClass: [], rarity: "common", set: "core", minionTypes: [], keywords: [],
  dust: 40, image: "", ...over,
});

const POOL: Record<number, CardRecord> = {
  1: mk(1), 2: mk(2), 3: mk(3, { rarity: "legendary" }), 4: mk(4, { classSlug: "neutral" }),
  5: mk(5, { classSlug: "mage" }), 6: mk(6, { classSlug: "mage", multiClass: ["shaman"] }),
  7: mk(7, { classSlug: "deathknight", runeCost: { blood: 2, frost: 0, unholy: 0 } }),
  8: mk(8, { classSlug: "deathknight", runeCost: { blood: 0, frost: 2, unholy: 0 } }),
};
const lookup = (id: number) => POOL[id];

describe("validateDeck", () => {
  it("accepts a valid 30-card deck", () => {
    const cards = [{ dbfId: 1, count: 2 }, { dbfId: 2, count: 2 }, { dbfId: 3, count: 1 }, { dbfId: 4, count: 2 }, { dbfId: 6, count: 2 }];
    // 9 cards; add 21 cards to the pool as filler
    const pool = { ...POOL };
    for (let i = 100; i < 121; i++) pool[i] = mk(i);
    const spec = { classSlug: "shaman", format: "standard" as const, cards: [...cards, ...Object.keys(pool).filter((k) => +k >= 100).map((k) => ({ dbfId: +k, count: 1 }))] };
    const r = validateDeck(spec, (id) => pool[id]);
    expect(r.cardCount).toBe(30);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("reports size, copy, class and unknown-card errors", () => {
    const r = validateDeck(
      { classSlug: "shaman", format: "standard", cards: [{ dbfId: 1, count: 3 }, { dbfId: 3, count: 2 }, { dbfId: 5, count: 1 }, { dbfId: 999, count: 1 }] },
      lookup,
    );
    const codes = r.errors.map((e) => e.code).sort();
    expect(codes).toEqual(["CLASS_MISMATCH", "COPIES", "COPIES", "SIZE", "UNKNOWN_CARD"]);
    expect(r.errors.find((e) => e.code === "CLASS_MISMATCH")?.dbfId).toBe(5);
  });

  it("accepts dual-class and neutral cards", () => {
    const r = validateDeck({ classSlug: "shaman", format: "standard", cards: [{ dbfId: 4, count: 2 }, { dbfId: 6, count: 2 }] }, lookup);
    expect(r.errors.map((e) => e.code)).toEqual(["SIZE"]);
  });

  it("catches two entries of the same card", () => {
    const r = validateDeck({ classSlug: "shaman", format: "standard", cards: [{ dbfId: 1, count: 1 }, { dbfId: 1, count: 1 }] }, lookup);
    expect(r.errors.some((e) => e.code === "DUPLICATE_ENTRY")).toBe(true);
  });

  it("enforces the Death Knight rune limit", () => {
    const r = validateDeck({ classSlug: "deathknight", format: "standard", cards: [{ dbfId: 7, count: 1 }, { dbfId: 8, count: 1 }] }, lookup);
    expect(r.errors.some((e) => e.code === "RUNES")).toBe(true); // 2B + 2F = 4 > 3
    const ok = validateDeck({ classSlug: "deathknight", format: "standard", cards: [{ dbfId: 7, count: 2 }] }, lookup);
    expect(ok.errors.some((e) => e.code === "RUNES")).toBe(false);
  });
});
