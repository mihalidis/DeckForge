---
name: blizzard-api
description: Blizzard Hearthstone Game Data API'ye token alma, kart arama, metadata ve deck uçlarına istek atma, hata ayıklama. Blizzard/Battle.net API, kart verisi, sync sorunlarında kullan.
---

# Blizzard Hearthstone API

Referans: `docs/API-NOTLARI.md`. Kod: `src/lib/blizzard/`.

## Hızlı test (curl)

```bash
# .env.local'den oku
set -a; source .env.local; set +a
TOKEN=$(curl -s -u "$BLIZZARD_CLIENT_ID:$BLIZZARD_CLIENT_SECRET" -d grant_type=client_credentials https://oauth.battle.net/token | jq -r .access_token)
curl -s "https://eu.api.blizzard.com/hearthstone/cards?locale=en_US&set=standard&collectible=1&class=shaman,neutral&pageSize=5&textFilter=shudderwock" -H "Authorization: Bearer $TOKEN" | jq '.cards[] | {id,name,manaCost,classId,cardSetId}'
curl -s "https://eu.api.blizzard.com/hearthstone/metadata/setGroups?locale=en_US" -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.slug=="standard")'
curl -s "https://eu.api.blizzard.com/hearthstone/deck?locale=en_US&code=$DECKCODE" -H "Authorization: Bearer $TOKEN" | jq '{class:.class.slug, count:.cardCount, cards:[.cards[].name]}'
```

## Kurallar

- Kodda her zaman `src/lib/blizzard/client.ts` kullan; `fetch`'i doğrudan çağırma.
- Token'ı `auth.ts` önbellekler; 401 gelirse bir kez yenile ve tekrar dene. 429'da `Retry-After`'a uy.
- Tüm kart havuzunu çekerken `pageSize=500`, `page` artırarak `pageCount`'a kadar gez; `set=standard&collectible=1&gameMode=constructed`.
- `card.id` = dbfId. Deckstring'de bu kullanılır.
- Standard set listesi, sınıf listesi, kahraman id'leri **metadata'dan** okunur; sabit yazılmaz.
- Locale `en_US`; Türkçe locale yok.

## Sık sorunlar

- `403 Forbidden`: token yok/bitti veya client secret yenilenmiş. Token'ı yeniden al.
- `/cards` hero kartlarını döndürmez (bilinen davranış); kahraman için `metadata/classes[].cardId` kullan.
- Yeni set çıktı ama kartlar gelmiyor: Blizzard API'nin güncellenmesi yama sonrası saatler/günler sürebilir; `sync:cards` tekrar çalıştır, gerekirse HearthstoneJSON ile çapraz kontrol.
- Oyun deck kodunu tanımıyor ama Blizzard `/deck` doğruluyor: destede **yaklaşan setten** (`metadata.sets[].hyped === true`) kart var; sync bunları hariç tutar, `npm run check:ids` ile HearthstoneJSON'a karşı doğrula.
- `set=standard` ile dönen sayı beklenenden az: `collectible=1` ve `gameMode=constructed` birlikte verildi mi kontrol et.
