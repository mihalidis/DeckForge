import { describe, expect, it } from "vitest";
import { buildLookups, normalizeCard, standardSetSlugs, stripCardText } from "./normalize";
import { META, RAW } from "./fixtures";

const L = buildLookups(META);

describe("stripCardText", () => {
  it("strips HTML, $ and line breaks", () => {
    expect(stripCardText(RAW[0].text)).toBe(
      "Battlecry: Repeat all other Battlecries from cards you played this game (targets chosen randomly).",
    );
    expect(stripCardText(RAW[2].text)).toBe("Deal 3 damage. Overload: (1)");
    expect(stripCardText(undefined)).toBe("");
  });
});

describe("normalizeCard", () => {
  it("converts id → slug, keeps dbfId", () => {
    const c = normalizeCard(RAW[0], L);
    expect(c.dbfId).toBe(61550);
    expect(c.classSlug).toBe("shaman");
    expect(c.type).toBe("minion");
    expect(c.rarity).toBe("legendary");
    expect(c.dust).toBe(1600);
    expect(c.set).toBe("core");
    expect(c.keywords).toEqual(["battlecry"]);
    expect(c.attack).toBe(6);
  });
  it("handles tribe, spell school, dual-class and rune fields", () => {
    expect(normalizeCard(RAW[1], L).minionTypes).toEqual(["murloc"]);
    expect(normalizeCard(RAW[2], L).spellSchool).toBe("nature");
    const dual = normalizeCard(RAW[3], L);
    expect(dual.classSlug).toBe("mage");
    expect(dual.multiClass).toEqual(["shaman"]);
    const nul = normalizeCard(RAW[5], L); // classId null, multiClassIds [mage, shaman]
    expect(nul.classSlug).toBe("mage");
    expect(nul.multiClass).toEqual(["shaman"]);
    expect(normalizeCard(RAW[6], L).runeCost).toEqual({ blood: 0, frost: 2, unholy: 0 });
    expect(normalizeCard(RAW[1], L).runeCost).toBeUndefined();
  });
});

describe("standardSetSlugs", () => {
  it("reads from setGroups, excludes the upcoming (hyped) set", () => {
    expect(standardSetSlugs(META)).toEqual(["core", "whizbangs-workshop"]);
    expect(standardSetSlugs(META, { includeUpcoming: true })).toEqual(["core", "whizbangs-workshop", "next-set"]);
  });
  it("throws when the group is missing", () => {
    expect(() => standardSetSlugs({ ...META, setGroups: [] })).toThrow(/standard/);
  });
});
