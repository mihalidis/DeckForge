import { describe, expect, it } from "vitest";
import { toCompactLine, statsOf } from "./compact";
import { buildLookups, normalizeCard } from "./normalize";
import { META, RAW } from "./fixtures";

const L = buildLookups(META);
const rec = (i: number) => normalizeCard(RAW[i], L);

describe("toCompactLine", () => {
  it("produces the fixed column order", () => {
    expect(toCompactLine(rec(0))).toBe(
      "61550|Shudderwock|9|6/6|minion|legendary|shaman|battlecry|Battlecry: Repeat all other Battlecries from cards you played this game (targets chosen randomly).",
    );
  });
  it("shows spell, weapon, dual-class and rune", () => {
    expect(toCompactLine(rec(2))).toBe("200|Lightning Bolt|1|-|spell|common|shaman|nature|Deal 3 damage. Overload: (1)");
    expect(statsOf(rec(6))).toBe("5/3");
    expect(toCompactLine(rec(3))).toContain("|mage+shaman|elemental|");
    expect(toCompactLine(rec(6))).toContain("[runes:FF]");
  });
});
