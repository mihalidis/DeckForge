---
name: deckstring
description: Hearthstone deck kodu (deckstring) üretme, çözme, doğrulama ve oyun formatında panoya kopyalanacak metin oluşturma. "deck kodu", "deckstring", "koda çevir", "kod çalışmıyor" denince kullan.
---

# Deckstring

Format: `docs/API-NOTLARI.md` → "Deckstring". Kod: `src/lib/deck/deckstring.ts` (encode/decode/toClipboardText). Paket: `deckstrings` (v3.1.2, `sideboardCards` destekli).

## Üretim akışı

1. Girdi: `{ classSlug, format: 'standard', cards: [{ dbfId, count }], sideboard?: [...] }`.
2. Önce `validate()` (`src/lib/deck/validate.ts`) — geçmezse kod üretme.
3. `heroes = [metadata.classes.find(c => c.slug === classSlug).cardId]`.
4. `encode({ format: 2, heroes, cards: cards.map(c => [c.dbfId, c.count]), sideboardCards })`.
5. `toClipboardText()` ile `### Ad`, `# Class`, `# Format`, kart listesi yorumları ve kod birleştirilir.
6. Round-trip: `decode(code)` → kart listesi girdiyle birebir eşleşmeli. Sonra Blizzard `GET /deck?code=` ile `cardCount` ve kart id'leri karşılaştırılır.

## Hızlı kontrol (Node)

```bash
node -e '
const {encode,decode}=require("deckstrings");
const code=encode({format:2,heroes:[1066],cards:[[61550,1]],sideboardCards:[]});
console.log(code, JSON.stringify(decode(code)));'
```

## Kurallar

- Sayı = dbfId (Blizzard `card.id`). Slug veya `EX1_116` tarzı string id kullanılmaz.
- Format sabitleri: 1 Wild, 2 Standard, 3 Classic, 4 Twist. Faz 1–5'te hep 2.
- Kart ve kahraman dizileri dbfId'ye göre artan sıralı (kütüphane yapar; elle üretiyorsan sen yap).
- Legendary 1 kopya, diğerleri en fazla 2; toplam 30. Doğrulayıcıya güven, kodda tekrar kontrol ekleme.
- Oyun `#` satırlarını yok sayar; `###` satırı deste adı olur. Deste adı 24 karakteri geçmesin, emoji yok.
- "Kod oyunda açılmıyor" şikayeti: önce `decode` ile çöz, sonra Blizzard `/deck?code=` yanıtına bak; en sık sebep Standard dışı kart veya yanlış hero id.
