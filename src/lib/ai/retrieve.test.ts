import { describe, expect, it } from "vitest";
import type { CardRecord } from "@/lib/cards/types";
import type { Intent } from "./schemas";
import { findCardByName, retrieveCandidates } from "./retrieve";

const mk = (dbfId: number, name: string, over: Partial<CardRecord> = {}): CardRecord => ({
  dbfId, slug: `${dbfId}-x`, name, text: "", cost: 2, type: "minion", classSlug: "shaman", multiClass: [],
  rarity: "common", set: "core", minionTypes: [], keywords: [], dust: 40, image: "", ...over,
});
const POOL = [
  mk(1, "Shudderwock", { cost: 9, rarity: "legendary", keywords: ["battlecry"], text: "Battlecry: Repeat all other Battlecries" }),
  mk(2, "Murloc Tidecaller", { classSlug: "neutral", minionTypes: ["murloc"] }),
  mk(3, "Coldlight Seer", { classSlug: "neutral", minionTypes: ["murloc"], text: "Battlecry: Give your other Murlocs +2 Health.", keywords: ["battlecry"] }),
  mk(4, "Lightning Bolt", { type: "spell", spellSchool: "nature", text: "Deal 3 damage." }),
  mk(5, "Big Legendary", { rarity: "legendary", cost: 8 }),
];
const intent = (over: Partial<Intent> = {}): Intent => ({
  classSlug: "shaman", seedCards: [], mustInclude: [], mustExclude: [], archetype: "unspecified",
  constraints: { maxDust: null, noLegendaries: false, tribe: null, keyword: null },
  needsClarification: false, clarificationQuestion: null, summary: "", ...over,
});

describe("findCardByName", () => {
  it("exact, prefix and contains match", () => {
    expect(findCardByName("shudderwock", POOL)?.dbfId).toBe(1);
    expect(findCardByName("Murloc Tide", POOL)?.dbfId).toBe(2);
    expect(findCardByName("Seer", POOL)?.dbfId).toBe(3);
    expect(findCardByName("Ragnaros", POOL)).toBeUndefined();
    // Name lengthened/outdated by the LLM: single match via word prefix
    expect(findCardByName("Shudderwock the Battlecrier", POOL)?.dbfId).toBe(1);
    expect(findCardByName("Murloc Something Else", [...POOL, { ...POOL[1], dbfId: 9, name: "Murloc Warleader" }])).toBeUndefined(); // "murloc" is ambiguous
  });
});

describe("retrieveCandidates", () => {
  it("puts the seed on top and ranks synergy cards first", () => {
    const r = retrieveCandidates(intent({ seedCards: ["Shudderwock"] }), POOL);
    expect(r.seeds.map((s) => s.dbfId)).toEqual([1]);
    expect(r.candidates[0].card.dbfId).toBe(1);
    // Coldlight Seer shares battlecry → ahead of Tidecaller
    const order = r.candidates.map((c) => c.card.dbfId);
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(2));
    expect(r.compact.split("\n")[0]).toMatch(/^1\|Shudderwock\|9\|/);
  });
  it("applies noLegendaries and mustExclude, scores tribe focus", () => {
    const r = retrieveCandidates(intent({ mustExclude: ["Lightning Bolt"], constraints: { maxDust: null, noLegendaries: true, tribe: "murloc", keyword: null } }), POOL);
    const ids = r.candidates.map((c) => c.card.dbfId);
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
    expect(ids).not.toContain(1);
    expect(ids.slice(0, 2).sort()).toEqual([2, 3]);
  });
});
