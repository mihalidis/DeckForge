// LLM'siz uçtan uca: intent ve build mock'lanır, doğrulayıcı/onarım/encode gerçek çalışır.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { CardDataset, CardRecord } from "@/lib/cards/types";

const mk = (dbfId: number, name: string, over: Partial<CardRecord> = {}): CardRecord => ({
  dbfId, slug: `${dbfId}-x`, name, text: "", cost: (dbfId % 7) + 1, type: "minion", classSlug: "shaman", multiClass: [],
  rarity: "common", set: "core", minionTypes: [], keywords: [], dust: 40, image: "", ...over,
});
const POOL: CardRecord[] = [
  mk(1, "Shudderwock", { cost: 9, rarity: "legendary", dust: 1600 }),
  ...Array.from({ length: 20 }, (_, i) => mk(100 + i, `Shaman Card ${i}`)),
  ...Array.from({ length: 20 }, (_, i) => mk(200 + i, `Neutral Card ${i}`, { classSlug: "neutral" })),
  mk(300, "Mage Only", { classSlug: "mage" }),
];

const parseIntent = vi.fn();
const buildDeck = vi.fn();
const repairDeck = vi.fn();
vi.mock("@/lib/ai/intent", () => ({ parseIntent: (p: string) => parseIntent(p) }));
vi.mock("@/lib/ai/build", () => ({ buildDeck: (c: unknown) => buildDeck(c), repairDeck: (...a: unknown[]) => repairDeck(...a) }));
vi.mock("@/lib/blizzard/client", () => ({ blizzard: { deckByCode: vi.fn().mockRejectedValue(new Error("offline")) } }));

const baseIntent = {
  classSlug: "shaman", seedCards: ["Shudderwock"], mustInclude: [], mustExclude: [], archetype: "combo",
  constraints: { maxDust: null, noLegendaries: false, tribe: null, keyword: null },
  needsClarification: false, clarificationQuestion: null, summary: "Shudderwock Shaman",
};
const goodCards = [{ dbfId: 1, count: 1 }, ...Array.from({ length: 14 }, (_, i) => ({ dbfId: 100 + i, count: 2 })), { dbfId: 200, count: 1 }];
const buildOut = (cards: { dbfId: number; count: number }[]) => ({
  output: { name: "Shudderwock Shaman", archetype: "combo", cards, gamePlan: ["Survive, then Shudderwock."], coreSynergy: "Battlecries.", mulligan: ["Keep cheap cards"], swaps: [{ outDbfId: 200, inDbfId: 201, why: "cheaper" }] },
});

let tmp: string;
beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), "deckforge-pipe-"));
  await mkdir(path.join(tmp, "data"));
  const ds: CardDataset = { syncedAt: "", format: "standard", locale: "en_US", region: "eu", standardSets: ["core"], classes: [{ id: 8, slug: "shaman", name: "Shaman", heroDbfId: 1066 }, { id: 4, slug: "mage", name: "Mage", heroDbfId: 637 }, { id: 12, slug: "neutral", name: "Neutral" }], sets: [], keywords: [], cards: POOL };
  await writeFile(path.join(tmp, "data", "cards.standard.json"), JSON.stringify(ds));
  vi.spyOn(process, "cwd").mockReturnValue(tmp);
  vi.resetModules();
  parseIntent.mockReset(); buildDeck.mockReset(); repairDeck.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("forgeDeck", () => {
  it("geçerli deste → kod, pano metni, bölümler, swap", async () => {
    parseIntent.mockResolvedValue(baseIntent);
    buildDeck.mockResolvedValue(buildOut(goodCards));
    const { forgeDeck } = await import("./pipeline");
    const steps: string[] = [];
    const deck = await forgeDeck("Shudderwock Shaman", { onStep: (e) => steps.push(`${e.step}:${e.status}`) });
    expect(deck.cardCount).toBe(30);
    expect(deck.cards.reduce((s, c) => s + c.count, 0)).toBe(30);
    expect(deck.classSlug).toBe("shaman");
    expect(deck.deckstring).toMatch(/^AAEC/);
    expect(deck.clipboardText).toContain("### Shudderwock Shaman");
    expect(deck.dust).toBe(1600 + 29 * 40);
    expect(deck.swaps).toHaveLength(1);
    expect(deck.verifiedByBlizzard).toBe(false);
    expect(steps).toEqual(["intent:start", "intent:done", "retrieve:start", "retrieve:done", "build:start", "build:done", "validate:start", "validate:done", "encode:start", "encode:done"]);
  });

  it("geçersiz deste → LLM onarımı, sonra mekanik onarım", async () => {
    parseIntent.mockResolvedValue(baseIntent);
    const bad = [{ dbfId: 1, count: 2 }, { dbfId: 300, count: 1 }, ...goodCards.slice(1, 10)]; // legendary x2, mage kartı, 20 kart
    buildDeck.mockResolvedValue(buildOut(bad));
    repairDeck.mockResolvedValue(bad); // LLM düzeltemiyor
    const { forgeDeck } = await import("./pipeline");
    const deck = await forgeDeck("Shudderwock Shaman", { maxRepairRounds: 2 });
    expect(repairDeck).toHaveBeenCalledTimes(2);
    expect(deck.cards.reduce((s, c) => s + c.count, 0)).toBe(30);
    expect(deck.cards.find((c) => c.dbfId === 1)?.count).toBe(1);
    expect(deck.cards.some((c) => c.dbfId === 300)).toBe(false);
  });

  it("belirsiz prompt → vague hatası; bilinmeyen seed → rotated", async () => {
    const { forgeDeck, ForgeError } = await import("./pipeline");
    parseIntent.mockResolvedValue({ ...baseIntent, classSlug: null, seedCards: [], needsClarification: true, clarificationQuestion: "Which class?" });
    await expect(forgeDeck("aggro")).rejects.toMatchObject({ kind: "vague", message: "Which class?" });
    parseIntent.mockResolvedValue({ ...baseIntent, classSlug: "shaman", seedCards: ["N'Zoth"] });
    const err = await forgeDeck("N'Zoth Shaman").catch((e) => e);
    expect(err).toBeInstanceOf(ForgeError);
    expect(err.kind).toBe("rotated");
  });

  it("seed kartın sınıfı yanlışsa rotated/class hatası", async () => {
    parseIntent.mockResolvedValue({ ...baseIntent, classSlug: "mage", seedCards: ["Shudderwock"] });
    const { forgeDeck } = await import("./pipeline");
    await expect(forgeDeck("Shudderwock Mage")).rejects.toMatchObject({ kind: "rotated" });
  });
});
