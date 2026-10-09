# DeckForge — Fizibilite Raporu

Tarih: 2026-10-07 · Durum: **Yapılabilir (orta zorluk)**

## Özet

Kullanıcının serbest metin isteğinden ("şu kartı baz alan bir deck hazırla") geçerli bir Hearthstone destesi üretip oyuna doğrudan yapıştırılabilen deck kodu vermek teknik olarak mümkündür. Üç yapı taşının tamamı hazır ve ücretsiz:

1. **Kart verisi:** Blizzard'ın resmi Hearthstone Game Data API'si (OAuth client-credentials, ücretsiz, 36.000 istek/saat).
2. **Deck kodu:** Açık ve belgelenmiş bir format (HearthSim "deckstring"); `deckstrings` npm paketi ile encode/decode yapılır. Blizzard API'nin `/hearthstone/deck` ucu da kodu doğrulayıp genişletir.
3. **Yapay zeka:** Vercel AI SDK üzerinden sağlayıcıdan bağımsız; varsayılan **Google Gemini Flash (ücretsiz API katmanı)**, geliştirme için Ollama, istenirse Claude. Asıl zorluk LLM'in kuralları ezbere bilmesi değil; kart havuzunu doğru şekilde önüne koymak ve çıktıyı **deterministik bir doğrulayıcıdan** geçirmektir.

Risk, "deste geçersiz" (31 kart, 2 legendary, sınıf dışı kart, Standard'dan çıkmış kart) ve "deste kötü" (sinerji yok) ikilisinde toplanır. İlki kodla tamamen çözülür; ikincisi iyi retrieval + kural tabanlı rehberlik + değerlendirme seti ile yönetilir.

## 1. Kart verisi — Blizzard Hearthstone Game Data API

| Konu | Bulgu |
|---|---|
| Kayıt | https://develop.battle.net → Battle.net hesabı → "Create Client" → `client_id` + `client_secret`. Ücretsiz. |
| Yetkilendirme | `POST https://oauth.battle.net/token` (`grant_type=client_credentials`, Basic auth). Token ~24 saat geçerli; sunucuda önbelleğe alınır. Tarayıcıya **asla** gönderilmez. |
| Taban adres | `https://{region}.api.blizzard.com/hearthstone/...` — `region`: `us`, `eu`, `kr`, `tw`. Kart verisi bölgeden bağımsız; `eu` kullanacağız. |
| Dil | `locale=en_US` (ayrıca de_DE, fr_FR, es_ES, pt_BR, ru_RU, ko_KR, zh_TW, ja_JP, …). **Türkçe yok**; TR arayüz metni bizim, kart metinleri İngilizce kalır. |
| Kart arama | `GET /cards?set=standard&collectible=1&class=shaman,neutral&manaCost=3&keyword=battlecry&textFilter=...&pageSize=500&page=1&sort=manaCost:asc` |
| Tek kart | `GET /cards/{id veya slug}` |
| Deste | `GET /deck?code=AAEC...` (kodu çözer) veya `GET /deck?ids=1,2,3&hero=7` (koddan deste üretir, `deckCode` döner). Sideboard için `sideboardCards` parametresi. |
| Metadata | `GET /metadata` → `sets`, `setGroups` (Standard'daki setler **buradan** okunur, elle yazılmaz), `classes` (her sınıfın hero `cardId`'si), `types`, `rarities`, `minionTypes`, `spellSchools`, `keywords`. |
| Kart alanları | `id` (**= dbfId, deck kodunda kullanılan sayı**), `slug`, `name`, `text`, `manaCost`, `attack`, `health`, `classId`, `multiClassIds`, `cardTypeId`, `cardSetId`, `rarityId`, `minionTypeId`, `keywordIds`, `image`, `cropImage`, `flavorText`, `collectible`. |
| Limitler | 36.000 istek/saat, 100 istek/saniye. Standard havuzu (~1.500–1.900 koleksiyon kartı) `pageSize=500` ile 4–5 istekte çekilir. |
| Yedek kaynak | HearthstoneJSON (`api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json`) — key yok, topluluk kaynağı; `mechanics` dizisi Blizzard'dan daha zengin. Blizzard birincil, HSJSON yedek/çapraz kontrol. |
| Kullanım şartları | Blizzard API Terms of Use + Fan Content Policy: kaynak belirtme, resmi logo/çerçeve kullanmama, ticari kullanımda dikkat. Kart görselleri Blizzard CDN URL'leri üzerinden gösterilir (indirip dağıtılmaz). |

**Karar:** Kart havuzu her istekte Blizzard'dan çekilmez. Günde bir kez (ve yama sonrası elle) `/metadata` + Standard koleksiyon kartları çekilip yerel bir JSON/SQLite önbelleğine yazılır. LLM ve arama katmanı bu önbellekten çalışır; Blizzard yalnızca senkron ve son doğrulama için çağrılır.

## 2. Deck kodu (deckstring)

Format HearthSim tarafından belgelenmiştir ve oyunun kullandığı formatın aynısıdır:

```
base64( 0x00 | version=1 | format | heroes[] | 1x cards[] | 2x cards[] | n-x (dbfId,count)[] [| sideboard] )
```

- Tüm sayılar unsigned varint. `format`: 1 Wild, 2 Standard, 3 Classic, 4 Twist.
- `heroes`: sınıfın temel kahraman dbfId'si (metadata `classes[].cardId`'den okunur).
- Kartlar dbfId'ye göre artan sıralı → "kanonik" kod.
- Oyun, `#` ile başlayan satırları yok sayar; `### Deste Adı` satırı deste adı olarak alınır. Yani panoya şunu kopyalatırız:

```
### Shudderwock Shaman
# Class: Shaman
# Format: Standard
#
AAECAaoIBMmbBOW...
#
# To use this deck, copy it to your clipboard and create a new deck in Hearthstone
```

- `deckstrings` npm paketi: `encode({cards:[[dbfId,count]], heroes:[dbfId], format:2, sideboardCards:[[dbfId,count,ownerDbfId]]})` / `decode()`. Üretilen kod `GET /deck?code=` ile Blizzard'a doğrulatılır — hem kodun hem kart listesinin tutarlı olduğunun kanıtı olur.

## 3. Yapay zeka katmanı

Naif yaklaşım (tüm kartları prompt'a dök, "30 kart seç" de) çalışır ama pahalı ve hatalıdır. Önerilen boru hattı:

1. **Niyet çözümleme (LLM, küçük model):** Prompt → `{class, format, seedCards[], archetype, budget, mustInclude[], mustExclude[], style}` JSON. Sınıf belirsizse seed karttan çıkarılır; o da yoksa kullanıcıya tek soru sorulur.
2. **Aday havuzu (kod):** Önbellekten `class ∪ neutral` ve Standard filtresi. Seed kartın etiketleriyle (tribe, keyword, spell school, metin anahtar kelimeleri) puanlanıp ~250–400 aday seçilir. Her kart ~40 token'lık sıkıştırılmış satır: `id|name|cost|atk/hp|type|rarity|text`.
3. **Deste seçimi (LLM):** Sistem prompt'unda deste kuralları + arketip rehberi; aday listesi sıkıştırılmış formatta gönderilir (Gemini'nin 1M bağlam penceresi havuzu rahat taşır; ücretli sağlayıcıya geçilirse prompt cache devreye alınır). Çıktı: `{cards:[{id,count}], name, gamePlan, mulligan, swaps}` — Vercel AI SDK `generateObject` ile Zod şeması zorunlu.
4. **Doğrulayıcı (kod, deterministik):** 30 kart, legendary ≤1, diğer ≤2, sınıf uyumu (`classId`/`multiClassIds`/neutral), Standard set kontrolü, DK rune kısıtı, sideboard kuralları (Zilliax, E.T.C.). Hata varsa LLM'e **sadece hatalar** gönderilip onarım turu istenir (en fazla 2 tur); hâlâ bozuksa kod eksikleri en yüksek puanlı adaylarla doldurur.
5. **Kodlama + doğrulama:** `deckstrings.encode` → Blizzard `/deck?code=` → kart listesi eşleşmesi.

Tahmini maliyet: Gemini Flash ücretsiz katmanında **$0** (günlük/dakikalık istek limitleri dahilinde; limitler değişebilir, güncel değerler ai.google.dev/gemini-api/docs/rate-limits). Trafik artarsa ücretli katman veya Claude'a `.env` değişikliğiyle geçilir (o durumda istek başına ~$0.01–0.03). Süre: 8–20 sn; adım adım ilerleme UI'da gösterilir.

**Not:** Google One AI Pro / Gemini uygulaması aboneliği API kullanımını kapsamaz; API anahtarı aistudio.google.com'dan ayrı ve ücretsiz alınır, kredi kartı gerekmez. Ücretsiz katmanda Pro modelleri yok, Flash modelleri var; bizim iş için Flash yeterli.

**Bilinen sınırlar:** Meta/winrate verisi resmi API'de yok (HSReplay vb. kazımak ToS riski). Arketip bilgisi LLM'in genel bilgisi + bizim yazdığımız kısa `docs/ARCHETYPES.md` rehberinden gelir. Yeni genişleme çıktığında LLM yeni kartları "tanımaz" ama metinlerini okuyarak yine kullanabilir; bu yüzden kart metni her zaman prompt'a girer.

## 4. Teknik yığın (karar verildi)

- **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui**
- **Route Handlers** (`app/api/*`) Blizzard ve Claude çağrılarını sunucuda yapar; anahtarlar `.env`'de.
- **Veri önbelleği:** Faz 1'de `data/cards.standard.json` (repo'da değil, build/cron ile üretilir); büyürse SQLite/Turso.
- **LLM:** Vercel AI SDK (`ai` + `@ai-sdk/google`), `generateObject` ile Zod şemalı çıktı. Sağlayıcı `.env`'den seçilir: `google` (varsayılan, ücretsiz), `ollama` (yerel geliştirme), `anthropic` (opsiyonel).
- **Deck kodu:** `deckstrings` npm.
- **Deploy:** Vercel; günlük kart senkronu Vercel Cron.
- **Test:** Vitest (doğrulayıcı + deckstring round-trip), Playwright (akış).

## 5. Riskler ve önlemler

| Risk | Olasılık | Önlem |
|---|---|---|
| LLM geçersiz deste üretir | Yüksek | Deterministik doğrulayıcı + onarım turu + Blizzard `/deck` doğrulaması. Geçersiz deste kullanıcıya **asla** gösterilmez. |
| Standard rotasyonu / yeni set | Kesin (yılda 3 set + Nisan rotasyonu) | Set listesi metadata'dan okunur; günlük senkron; yama sonrası manuel tetik. |
| Blizzard API kesintisi | Düşük | Önbellek üzerinden çalışmaya devam; sadece son doğrulama atlanır ve kullanıcıya not düşülür. |
| Deste kalitesi zayıf | Orta | 30 prompt'luk değerlendirme seti; arketip rehberi; seed-kart sinerji puanlaması. |
| Maliyet | Düşük | Gemini ücretsiz katmanı; istek başı limit; sağlayıcı soyutlaması sayesinde gerekirse geçiş. |
| Ücretsiz katman kotası dolar / değişir | Orta | Vercel AI SDK ile sağlayıcı tek env değişkeni; UI'da "şu an yoğunluk var" durumu; Faz 4'te istek kuyruğu. |
| Hukuki | Düşük | Fan Content Policy'ye uygun görsel kullanımı, footer'da sorumluluk reddi, resmi logo yok. |

## 6. Sonuç

Projenin tüm bağımlılıkları ücretsiz ve belgeli. MVP (Faz 0–3) tek geliştiriciyle gerçekçi biçimde **3–4 hafta**lık akşam/hafta sonu eforuyla çıkarılabilir. En kritik mühendislik yatırımı doğrulayıcı ve retrieval katmanıdır; UI ve API katmanları standarttır.

## Kaynaklar

- Blizzard Hearthstone Game Data API dokümanı: https://develop.battle.net/documentation/hearthstone/game-data-apis
- Kart arama rehberi: https://develop.battle.net/documentation/hearthstone/guides/card-search
- Deckstring formatı (HearthSim): https://hearthsim.info/docs/deckstrings/
- `deckstrings` npm: https://www.npmjs.com/package/deckstrings · GitHub: https://github.com/hearthsim/hearthstone-deckstrings
- HearthstoneJSON: https://hearthstonejson.com/docs/cards.html
