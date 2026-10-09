import { describe, expect, it } from "vitest";
import { decodeDeck, encodeDeck, shortIdOf, toClipboardText } from "./deckstring";

describe("deckstring", () => {
  it("encode → decode round-trip, canonical order", () => {
    const code = encodeDeck({ format: "standard", heroDbfId: 1066, cards: [{ dbfId: 61550, count: 1 }, { dbfId: 59725, count: 2 }] });
    expect(code).toBe("AAECAaoIAe7gAwHN0gMAAA=="); // verified with deckstrings 3.1.2
    const d = decodeDeck(code);
    expect(d.format).toBe(2);
    expect(d.heroes).toEqual([1066]);
    expect(d.cards).toEqual([{ dbfId: 59725, count: 2 }, { dbfId: 61550, count: 1 }]);
  });

  it("clipboard text is in game format", () => {
    const t = toClipboardText({
      deckName: "Shudderwock Shaman", className: "Shaman", format: "standard", deckstring: "AAEC",
      cards: [{ name: "Shudderwock", cost: 9, count: 1 }, { name: "Lightning Bolt", cost: 1, count: 2 }],
    });
    expect(t.split("\n")[0]).toBe("### Shudderwock Shaman");
    expect(t).toContain("# Class: Shaman");
    expect(t).toContain("# 2x (1) Lightning Bolt\n# 1x (9) Shudderwock");
    expect(t).toContain("\nAAEC\n");
  });

  it("shortId is stable", () => {
    expect(shortIdOf("abc")).toBe(shortIdOf("abc"));
    expect(shortIdOf("abc")).not.toBe(shortIdOf("abd"));
  });
});
