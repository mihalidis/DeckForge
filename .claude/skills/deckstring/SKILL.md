---
name: deckstring
description: Generating, decoding and validating Hearthstone deck codes (deckstrings), and building the game-format text to copy to the clipboard. Use when the user says "deck code", "deckstring", "convert to code", "code doesn't work" (or in Turkish "deck kodu", "koda çevir", "kod çalışmıyor").
---

# Deckstring

Format: `docs/API-NOTES.md` → "Deckstring". Code: `src/lib/deck/deckstring.ts` (encode/decode/toClipboardText). Package: `deckstrings` (v3.1.2, supports `sideboardCards`).

## Generation flow

1. Input: `{ classSlug, format: 'standard', cards: [{ dbfId, count }], sideboard?: [...] }`.
2. First `validate()` (`src/lib/deck/validate.ts`) — if it fails, don't generate a code.
3. `heroes = [metadata.classes.find(c => c.slug === classSlug).cardId]`.
4. `encode({ format: 2, heroes, cards: cards.map(c => [c.dbfId, c.count]), sideboardCards })`.
5. `toClipboardText()` joins `### Name`, `# Class`, `# Format`, the card list comments and the code.
6. Round-trip: `decode(code)` → the card list must match the input exactly. Then compare `cardCount` and card ids against Blizzard `GET /deck?code=`.

## Quick check (Node)

```bash
node -e '
const {encode,decode}=require("deckstrings");
const code=encode({format:2,heroes:[1066],cards:[[61550,1]],sideboardCards:[]});
console.log(code, JSON.stringify(decode(code)));'
```

## Rules

- Number = dbfId (Blizzard `card.id`). Slugs or string ids like `EX1_116` are not used.
- Format constants: 1 Wild, 2 Standard, 3 Classic, 4 Twist. Always 2 in Phases 1–5.
- Card and hero arrays are sorted ascending by dbfId (the library does this; if you build them by hand, do it yourself).
- Legendary 1 copy, others at most 2; 30 total. Trust the validator; don't add duplicate checks in code.
- The game ignores `#` lines; the `###` line becomes the deck name. Keep the deck name to 24 characters or fewer, no emoji.
- "Code won't open in the game" complaint: first decode it with `decode`, then look at the Blizzard `/deck?code=` response; the most common causes are a non-Standard card or a wrong hero id.
