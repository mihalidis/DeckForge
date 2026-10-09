# Blizzard Hearthstone API & Deckstring — Hızlı Referans

Geliştirme sırasında sık bakılacak notlar. Resmî doküman: https://develop.battle.net/documentation/hearthstone/game-data-apis

## Token

```http
POST https://oauth.battle.net/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```
Yanıt: `{ access_token, token_type: "bearer", expires_in: 86399 }`. Süre dolmadan ~5 dk önce yenile. Token sunucuda kalır.

## İstek şablonu

```
GET https://eu.api.blizzard.com/hearthstone/{path}?locale=en_US&...
Authorization: Bearer {access_token}
```

## Uçlar

| Uç | Not |
|---|---|
| `GET /cards` | Arama. Parametreler aşağıda. Yanıt: `{ cards[], cardCount, pageCount, page }` |
| `GET /cards/{idOrSlug}` | Tek kart |
| `GET /deck?code={deckstring}` | Kodu çözer; `{ deckCode, version, format, hero, heroPower, class, cards[], sideboardCards[], cardCount }` |
| `GET /deck?ids=1,2,3&hero=7` | Kart id listesinden deste; `deckCode` üretir. Opsiyonel `sideboardCards=ownerId:cardId,...` |
| `GET /metadata` | Hepsi birden |
| `GET /metadata/{type}` | `sets`, `setGroups`, `types`, `rarities`, `classes`, `minionTypes`, `spellSchools`, `keywords`, `bgGameModes` |
| `GET /cardbacks` | Kart arkaları (kullanmıyoruz) |

## `/cards` parametreleri

| Parametre | Örnek | Not |
|---|---|---|
| `set` | `standard`, `wild`, `the-great-dark-beyond` | `standard`/`wild` kısayolları setGroup'a göre çalışır |
| `class` | `shaman`, `shaman,neutral` | slug; virgülle çoklu |
| `manaCost` | `3`, `0,1,2`, `10` | 10 = 10 ve üzeri |
| `attack`, `health` | `4` | |
| `collectible` | `1`, `0`, `0,1` | Standard için `1` |
| `rarity` | `legendary` | `common,free,rare,epic,legendary` |
| `type` | `minion`, `spell`, `weapon`, `hero`, `location` | |
| `minionType` | `murloc`, `dragon`, `elemental`, … | |
| `spellSchool` | `fire`, `nature`, … | |
| `keyword` | `battlecry`, `deathrattle`, `rush`, … | |
| `textFilter` | `shudderwock` | isim + metin araması |
| `gameMode` | `constructed` (varsayılan), `battlegrounds`, `mercenaries` | |
| `page`, `pageSize` | `1`, `500` | pageSize büyük tutulup sayfalar gezilir |
| `sort` | `manaCost:asc`, `name:asc`, `attack:desc` | |

Limit: 36.000 istek/saat, 100 istek/saniye.

## Kart yanıtı (önemli alanlar)

```json
{
  "id": 61550,                 // dbfId — DECKSTRING BUNU KULLANIR
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

`classId`, `cardTypeId`, `cardSetId`, `rarityId`, `minionTypeId`, `keywordIds` → `/metadata` ile slug/isme çevrilir. `metadata.classes[].cardId` = o sınıfın temel kahraman dbfId'si (deckstring `heroes` için).

## Deste kuralları (doğrulayıcı)

- Tam 30 kart (Renathal 40 kart Wild'a özel; Standard'da yok).
- Legendary en fazla 1 kopya, diğerleri 2.
- Her kart: `classId == deste sınıfı` **veya** `classId == neutral(12)` **veya** `multiClassIds` içinde deste sınıfı var.
- Her kartın `cardSetId`'si `setGroups` içinde `slug == "standard"` olanın `cardSets` listesinde **ve** seti `hyped: false` (çıkmış). Blizzard, duyurulan ama çıkmamış genişlemeyi `set=standard`'a şimdiden ekliyor; oyun bu kartlı deste kodunu sessizce reddediyor (2026-10-09'da yaşandı: Reign of the Black Empire).
- `collectible == 1`.
- Death Knight: toplam rune ≤ 3, kartların rune gereksinimi (`runeCost`) uyumlu.
- Sideboard: E.T.C. (3 kart), Zilliax Deluxe 3000 (2 modül) — Faz 2'de yalnız doğrula, LLM'e üretme izni Faz 4+.
- Hero/hero power kartları desteye girmez.

## Deckstring

```
base64( 0x00, varint(1), varint(format), varint(len) heroes…, varint(len) 1x…, varint(len) 2x…, varint(len) (dbfId,count)…, [sideboard bloğu] )
```
`format`: 1 Wild · 2 Standard · 3 Classic · 4 Twist. Kartlar dbfId artan sıralı.

```ts
import { encode, decode } from "deckstrings";
const code = encode({
  format: 2,
  heroes: [1066],                      // Thrall — metadata.classes'tan oku, sabit yazma
  cards: [[61550, 1], [59725, 2]],     // [dbfId, count]
  sideboardCards: [],                  // [dbfId, count, ownerDbfId]
});
```

Panoya kopyalanacak metin:
```
### {Deste Adı}
# Class: {Sınıf}
# Format: Standard
# Year of the {…}
#
# 2x (1) Kart Adı
# 1x (9) Shudderwock
#
{deckstring}
#
# To use this deck, copy it to your clipboard and create a new deck in Hearthstone
```
Oyun `#` satırlarını yok sayar, `###` satırını deste adı yapar.

## Yedek: HearthstoneJSON

`https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json` — `dbfId` alanı Blizzard `id` ile aynı. `mechanics[]` dizisi (TAUNT, BATTLECRY, …) retrieval'da ek sinyal olarak kullanılabilir. Render: `https://art.hearthstonejson.com/v1/render/latest/enUS/256x/{cardId}.png`.
