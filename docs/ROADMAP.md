# DeckForge — Faz Faz Geliştirme Planı

Her faz kendi başına çalışır durumda biter ve bir "bitti" kriteri vardır. Tamamlanan maddeler `[x]` yapılır; `/faz` skill'i buradan bir sonraki işi seçer.

Kapsam kararı (Faz 1–5): **yalnızca Standard, kullanıcı hesabı yok, dark tema, İngilizce kart verisi.**

---

## Faz 0 — Hazırlık (1–2 gün)

- [x] Battle.net Developer hesabı aç, client oluştur, `BLIZZARD_CLIENT_ID` / `BLIZZARD_CLIENT_SECRET` al
- [x] Gemini API anahtarı al (AI Studio, ayrı "DeckForge" projesi) → `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] (Opsiyonel, yerel geliştirme) Ollama kur, `ollama pull qwen3:14b` veya benzeri
- [x] Design'da tasarımı bitir (`docs/TASARIM-PROMPT.md`)
- [x] Design'dan Project archive export, `design/export/` içine açıldı (PNG'ler opsiyonel)
- [x] `design/tokens.md` — renk/font/radius/spacing token'ları (Faz 3'te `tailwind.config` kaynağı)
- [x] `design/screens.md` — ekran → route → bileşen eşlemesi
- [x] Sonuç sayfası yönü: **A (sticky sidebar)** seçildi
- [x] Next.js 16 iskeleti (`--ts --tailwind --app --src-dir`), token'lar `globals.css` `@theme` bloğuna, fontlar `next/font` ile, `src/lib/*` klasörleri, `src/i18n/en.ts`
- [ ] `npm install` (terminalden; bağımlılıklar package.json'da hazır) ve `npm run dev` ile ilk açılış
- [x] ~~shadcn/ui~~ — karar: kullanılmayacak; tasarım token'ları ve bileşenler elle yazılır (bağımlılık azalır, prototiple birebir)
- [x] `.env.example` → `.env.local`; `README.md` çalıştırma adımları
- [ ] Git init, ilk commit

**Bitti kriteri:** `npm run dev` açılıyor, tasarım dosyaları repoda, anahtarlar `.env.local`'de.

## Faz 1 — Veri katmanı (3–4 gün)

- [x] `src/lib/blizzard/auth.ts` — client-credentials token alma, bellek önbelleği, 5 dk marjla yenileme, eşzamanlı çağrı paylaşımı
- [x] `src/lib/blizzard/client.ts` — tipli istemci (`metadata`, `card`, `searchCards`, `searchAllCards`, `deckByCode`, `deckByIds`), 401 yenileme, 429 bekleme
- [x] `src/lib/blizzard/types.ts` — API yanıt tipleri
- [x] `scripts/sync-cards.ts` + `src/lib/cards/normalize.ts` — metadata + Standard kartlar → `data/cards.standard.json` (+ `metadata.json`, `sample.raw.json`)
- [x] İlk gerçek senkron: 1322 Standard kart, 8 set, 7 sn (2026-10-08). Dual-class kartlarda `classId=null` geldiği görüldü → normalize düzeltildi
- [x] `src/lib/cards/repo.ts` — `getCard`, `searchCards`, `getStandardPool`, `getClassInfo`
- [x] `src/lib/cards/compact.ts` — `dbfId|Name|cost|atk/hp|type|rarity|class|tags|text`
- [x] `app/api/cards/route.ts` — arama ucu
- [x] Vitest: auth (4), normalize (5), compact (2), repo (4) — `npm test` yerelde çalıştırılacak

**Bitti kriteri:** `npm run sync:cards` 1 dakikada biter; `getStandardPool('shaman')` sınıf + nötr kartları döner; set listesi metadata'dan geliyor (elle yazılmış set yok).

## Faz 2 — Deste motoru (5–7 gün) — projenin kalbi

- [x] `src/lib/deck/rules.ts` — kurallar, sınıf slug/adları, deckstring format sabitleri (sideboard: Standard'da şu an sideboard kartı yok, Faz 4+)
- [x] `src/lib/deck/validate.ts` — SIZE / COPIES / UNKNOWN_CARD / CLASS_MISMATCH / RUNES / DUPLICATE_ENTRY / BAD_COUNT
- [x] `src/lib/deck/deckstring.ts` — encode/decode, pano metni, kısa id
- [x] `src/lib/ai/provider.ts` — sağlayıcı seçimi; `npm run llm:check` ile anahtar/model doğrulama
- [x] `src/lib/ai/intent.ts` + `schemas.ts` + `prompts/intent.ts`
- [x] `src/lib/ai/retrieve.ts` — havuzun tamamı (~380 kart, ~10k token) seed/sinerji/tribe puanıyla sıralı gider; noLegendaries ve mustExclude burada elenir
- [x] `src/lib/ai/build.ts` + `prompts/build.ts` — `buildDeck`, `repairDeck`
- [x] `src/lib/ai/repair.ts` — mekanik onarım (LLM 2 turda düzeltemezse)
- [x] `src/lib/deck/pipeline.ts` — `forgeDeck()`; `ForgeError` türleri: vague / rotated / api / invalid / llm
- [x] `app/api/forge/route.ts` — POST, SSE (`step` / `result` / `error`)
- [x] `docs/ARCHETYPES.md` — arketip tanımları + sınıf kimlikleri (kart adı içermez)
- [x] Vitest: validate (5), deckstring (3), retrieve (3), pipeline mock (4) — toplam 30 test yeşil
- [x] `scripts/eval.ts` — 30 prompt (28 deste + 2 beklenen hata), 4 sn aralık, `data/eval-*.json` raporu
- [x] `npm run llm:check` → anahtar ve model adları doğrulandı
- [x] İlk gerçek desteler: 8/8 yasal + Blizzard doğrulamalı (Al'Akir Elemental, Budget Hunter, Armor Warrior, Murloc Paladin…), 15–35 sn
- [ ] Tam 30'luk eval — ücretsiz Gemini kotası günde ~20 deste; **karar: ücretsiz kalınacak**, eval günlere bölünerek koşulur (`--limit`), `busy` görünce kendini durdurur
- [ ] Üretilen 5 kodu oyunda elle test et (`data/eval-*.json` içindeki desteleri `/api/forge` ile tekrar üretmeye gerek yok; pano metni UI'dan kopyalanacak)

**Bitti kriteri:** Eval setinde geçerli deste oranı %100 (doğrulayıcı sayesinde), seed kart dahil oranı ≥%95, ortalama süre <20 sn. Üretilen kodlar oyunda açılıyor (elle 5 deste test).

**Durum (2026-10-08):** Motor çalışıyor; 8 gerçek destede yasal %100, seed %100, süre 15–35 sn (LLM'e bağlı). Kalan: oyun içi elle test ve eval'ın günlere yayılması. Faz 3'e geçildi.

## Faz 3 — Arayüz (4–6 gün)

- [x] Token'lar `globals.css` `@theme` (Faz 0'da); mana/dust/archetype/toast renkleri eklendi
- [x] Landing: `PromptBox` (textarea, format toggle, 11 sınıf chip'i, Forge), örnek chip'ler, `FeatureCards`
- [x] `StepTracker` + `useForge` SSE istemcisi (adım/sonuç/hata olayları, süre sayacı, iptal)
- [x] Sonuç (yön A): `DeckHeader` (sınıf rozeti, düzenlenebilir ad, dust/kart/avg, kopyala + toast, kod detayı, `ManaCurve`, aksiyonlar), `CardList` (mana grupları, `ManaGem`, rarity gem, hover'da gerçek kart görseli, kart-art grid)
- [x] `WhyPanel` accordion (game plan, synergy, mulligan, swaps — Swap butonu Faz 4)
- [x] `ErrorCard`: vague (örnek chip'leri), rotated, api, busy, llm, invalid
- [x] Mobil: tek sütun, `StickyCopyBar`; hover önizleme yalnız masaüstü
- [ ] Tarayıcıda gerçek deste ile gözden geçirme (masaüstü + 390px), tasarımla fark listesi
- [x] `Navbar`, `Footer` (sorumluluk reddi)

**Bitti kriteri:** Prompt → deste → kopyala → oyunda yapıştır akışı masaüstü ve mobilde çalışıyor; Lighthouse erişilebilirlik ≥90.

## Faz 4 — İyileştirme / refine (3–4 gün)

- [ ] Takip prompt'u ("make it cheaper", "remove X"): mevcut deste bağlam olarak gönderilir, diff (çıkan/giren) gösterilir
- [ ] "Swap" butonu: tek kart değişimi, yeniden doğrulama ve yeni kod
- [ ] İstek başına limit (IP bazlı, Upstash/Vercel KV) ve basit kötüye kullanım koruması
- [ ] Hata izleme (Sentry) ve ürün analitiği (PostHog): `forge_started`, `forge_succeeded`, `code_copied`
- [ ] Deste paylaşım linki (`/d/[code]` — kodu URL'den çözer, sunucu tarafında Blizzard ile genişletir, DB gerekmez)

**Bitti kriteri:** Refine akışı eval setinin 10 örneğinde çalışıyor; paylaşım linki sosyal önizleme (OG image) üretiyor.

## Faz 5 — Yayın (2–3 gün)

- [ ] Vercel projesi, env secret'ları, `eu` bölgesi
- [ ] Vercel Cron: günlük `sync:cards`; yama günleri için manuel tetik ucu (`/api/admin/sync`, gizli token)
- [ ] Playwright: ana akış smoke testi, CI'da (GitHub Actions)
- [ ] Alan adı, OG görselleri, favicon, basit SEO
- [ ] `CHANGELOG.md` v0.1.0

**Bitti kriteri:** Herkese açık URL; günlük senkron çalışıyor; CI yeşil.

---

## Sonraki fazlar (kapsam dışı, sıraya göre)

- **Faz 6 — Wild formatı:** havuz büyür (~5.000 kart); retrieval zorunlu hale gelir, prompt cache sınıf+format bazlı.
- **Faz 7 — Deste içe aktarma:** kullanıcı kendi kodunu yapıştırır → analiz, eksik/zayıf kart önerisi, "bunu daha iyi yap".
- **Faz 8 — Hesap ve geçmiş:** Auth (Clerk/Auth.js), üretilen desteler, favoriler; DB (Turso/Neon + Drizzle).
- **Faz 9 — Türkçe arayüz:** i18n (kart metinleri İngilizce kalır; API'de TR yok).
- **Faz 10 — Koleksiyon farkındalığı:** kullanıcının sahip olduğu kartlar (manuel liste veya HDT dışa aktarımı) → yalnızca sahip olunan kartlarla deste; dust bütçesi.
- **Faz 11 — Battlegrounds / Twist:** metadata `gameMode` ile ayrı havuzlar.
