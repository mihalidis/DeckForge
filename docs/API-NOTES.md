# Blizzard Hearthstone API & Deckstring — Quick Reference

Notes to consult frequently during development. Official documentation: https://develop.battle.net/documentation/hearthstone/game-data-apis

## Token

```http
POST https://oauth.battle.net/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```
Response: `{ access_token, token_type: "bearer", expires_in: 86399 }`. Refresh ~5 min before expiry. The token stays on the server.

## Request template

```
GET https://eu.api.blizzard.com/hearthstone/{path}?locale=en_US&...
Authorization: Bearer {access_token}
```

## Endpoints

| Endpoint | Note |
|---|---|
| `GET /cards` | Search. Parameters below. Response: `{ cards[], cardCount, pageCount, page }` |
| `GET /cards/{idOrSlug}` | Single card |
| `GET /deck?code={deckstring}` | Decodes the code; `{ deckCode, version, format, hero, heroPower, class, cards[], sideboardCards[], cardCount }` |
| `GET /deck?ids=1,2,3&hero=7` | Deck from a list of card ids; produces `deckCode`. Optional `sideboardCards=ownerId:cardId,...` |
| `GET /metadata` | Everything at once |
| `GET /metadata/{type}` | `sets`, `setGroups`, `types`, `rarities`, `classes`, `minionTypes`, `spellSchools`, `keywords`, `bgGameModes` |
| `GET /cardbacks` | Card backs (not used) |

## `/cards` parameters

| Parameter | Example | Note |
|---|---|---|
| `set` | `standard`, `wild`, `the-great-dark-beyond` | the `standard`/`wild` shortcuts work by setGroup |
| `class` | `shaman`, `shaman,neutral` | slug; comma-separated for multiple |
| `manaCost` | `3`, `0,1,2`, `10` | 10 = 10 and above |
| `attack`, `health` | `4` | |
| `collectible` | `1`, `0`, `0,1` | `1` for Standard |
| `rarity` | `legendary` | `common,free,rare,epic,legendary` |
| `type` | `minion`, `spell`, `weapon`, `hero`, `location` | |
| `minionType` | `murloc`, `dragon`, `elemental`, … | |
| `spellSchool` | `fire`, `nature`, … | |
| `keyword` | `battlecry`, `deathrattle`, `rush`, … | |
| `textFilter` | `shudderwock` | name + text search |
| `gameMode` | `constructed` (default), `battlegrounds`, `mercenaries` | |
| `page`, `pageSize` | `1`, `500` | keep pageSize large and iterate pages |
| `sort` | `manaCost:asc`, `name:asc`, `attack:desc` | |

Limit: 36,000 requests/hour, 100 requests/second.

## Card response (important fields)

```json
{
  "id": 61550,                 // dbfId — THE DECKSTRING USES THIS
  "slug": "61550-shudderwock",
  "classId": 7, "multiClassIds": [],
  "cardTypeId": 4, "cardSetId": 1004, "rarityId": 5,
  "minionTypeId": 0, "spellSchoolId": null,
  "name": "...", "text": "...", "flavorText": "...",
  "manaCost": 9, "attack": 6, "health": 6,
  "keywordIds": [8],
  "image": "https://d15f34w2p8l1cc.cloudfront.net/hearthstone/....png",
  "cropImage": "https://.../crop....png",
  "collectible": 1
}
```

`classId`, `cardTypeId`, `cardSetId`, `rarityId`, `minionTypeId`, `keywordIds` → resolved to slug/name via `/metadata`. `metadata.classes[].cardId` = that class's base hero dbfId (for deckstring `heroes`).

## Deck rules (validator)

- Exactly 30 cards (Renathal's 40 cards is Wild-only; not in Standard).
- Legendary at most 1 copy, others 2.
- Each card: `classId == deck class` **or** `classId == neutral(12)` **or** the deck class is in `multiClassIds`.
- Each card's `cardSetId` is in the `cardSets` list of the `setGroups` entry with `slug == "standard"` **and** its set is `hyped: false` (released). Blizzard already adds an announced but unreleased expansion to `set=standard`; the game silently rejects deck codes containing those cards (happened on 2026-10-09: Reign of the Black Empire).
- `collectible == 1`.
- Death Knight: total runes ≤ 3, cards' rune requirements (`runeCost`) compatible.
- Sideboard: E.T.C. (3 cards), Zilliax Deluxe 3000 (2 modules) — in Phase 2 only validate; the LLM is allowed to generate them in Phase 4+.
- Hero/hero power cards don't go into the deck.

## Deckstring

```
base64( 0x00, varint(1), varint(format), varint(len) heroes…, varint(len) 1x…, varint(len) 2x…, varint(len) (dbfId,count)…, [sideboard block] )
```
`format`: 1 Wild · 2 Standard · 3 Classic · 4 Twist. Cards sorted ascending by dbfId.

```ts
import { encode, decode } from "deckstrings";
const code = encode({
  format: 2,
  heroes: [1066],                      // Thrall — read from metadata.classes, don't hard-code
  cards: [[61550, 1], [59725, 2]],     // [dbfId, count]
  sideboardCards: [],                  // [dbfId, count, ownerDbfId]
});
```

Text to copy to the clipboard:
```
### {Deck Name}
# Class: {Class}
# Format: Standard
# Year of the {…}
#
# 2x (1) Card Name
# 1x (9) Shudderwock
#
{deckstring}
#
# To use this deck, copy it to your clipboard and create a new deck in Hearthstone
```
The game ignores `#` lines and uses the `###` line as the deck name.

## Fallback: HearthstoneJSON

`https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json` — the `dbfId` field is the same as Blizzard's `id`. The `mechanics[]` array (TAUNT, BATTLECRY, …) can be used as an extra signal in retrieval. Render: `https://art.hearthstonejson.com/v1/render/latest/enUS/256x/{cardId}.png`.
