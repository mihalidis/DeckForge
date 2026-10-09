import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildLookups, normalizeCard } from "./normalize";
import { META, RAW } from "./fixtures";
import type { CardDataset } from "./types";

// repo.ts reads process.cwd()/data → point it at a temp dir
let tmp: string;
beforeEach(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), "deckforge-"));
  await mkdir(path.join(tmp, "data"));
  const L = buildLookups(META);
  const ds: CardDataset = {
    syncedAt: "2026-01-01T00:00:00Z", format: "standard", locale: "en_US", region: "eu",
    standardSets: ["core", "whizbangs-workshop"],
    classes: META.classes.map((c) => ({ id: c.id, slug: c.slug, name: c.name, heroDbfId: c.cardId })),
    sets: META.sets.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
    keywords: [],
    cards: RAW.filter((c) => c.cardSetId !== 3).map((c) => normalizeCard(c, L)),
  };
  await writeFile(path.join(tmp, "data", "cards.standard.json"), JSON.stringify(ds));
  vi.spyOn(process, "cwd").mockReturnValue(tmp);
  vi.resetModules();
});
afterEach(() => vi.restoreAllMocks());

describe("repo", () => {
  it("getStandardPool returns class + neutral + dual", async () => {
    const { getStandardPool } = await import("./repo");
    const pool = await getStandardPool("shaman");
    expect(pool.map((c) => c.dbfId).sort()).toEqual([100, 200, 300, 600, 61550]);
    const mage = await getStandardPool("mage");
    expect(mage.map((c) => c.dbfId).sort()).toEqual([100, 300, 500, 600]);
  });
  it("searchCards filters and sorts by cost", async () => {
    const { searchCards } = await import("./repo");
    expect((await searchCards({ q: "shudder" })).map((c) => c.name)).toEqual(["Shudderwock"]);
    expect((await searchCards({ classSlug: "shaman", type: "spell" })).map((c) => c.name)).toEqual(["Lightning Bolt"]);
    expect((await searchCards({ minionType: "murloc" })).length).toBe(1);
    const all = await searchCards({});
    expect(all[0].cost).toBeLessThanOrEqual(all[all.length - 1].cost);
  });
  it("getClassInfo returns the hero dbfId", async () => {
    const { getClassInfo } = await import("./repo");
    expect((await getClassInfo("shaman"))?.heroDbfId).toBe(1066);
  });
  it("throws an error pointing to sync when data is missing", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(path.join(tmp, "nope"));
    const { loadDataset } = await import("./repo");
    await expect(loadDataset()).rejects.toThrow(/sync:cards/);
  });
});
