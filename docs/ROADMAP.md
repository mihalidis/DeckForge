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
- [ ] shadcn/ui kur (`npx shadcn@latest init`, Tailwind v4 + koyu tema) — Faz 3 başında da olabilir
- [x] `.env.example` → `.env.local`; `README.md` çalıştırma adımları
- [ ] Git init, ilk commit

**Bitti kriteri:** `npm run dev` açılıyor, tasarım dosyaları repoda, anahtarlar `.env.local`'de.

## Faz 1 — Veri katmanı (3–4 gün)

- [ ] `src/lib/blizzard/auth.ts` — client-credentials token alma, bellek + dosya önbelleği, süre dolunca yenileme
- [ ] `src/lib/blizzard/client.ts` — tipli `fetch` sarmalayıcı (`cards`, `card`, `deck`, `metadata`), hata ve rate-limit yönetimi
- [ ] `src/lib/blizzard/types.ts` — API yanıt tipleri (`Card`, `Metadata`, `DeckResponse`)
- [ ] `scripts/sync-cards.ts` — `/metadata` + Standard koleksiyon kartlarını çek, normalize et, `data/metadata.json` ve `data/cards.standard.json` yaz; `npm run sync:cards`
- [ ] `src/lib/cards/repo.ts` — önbellekten okuma: `getCard(id)`, `searchCards(filter)`, `getStandardPool(classSlug)`
- [ ] `src/lib/cards/compact.ts` — LLM için sıkıştırılmış kart satırı üretimi (`id|name|cost|atk/hp|type|rarity|text`)
- [ ] `app/api/cards/route.ts` — arama ucu (UI'daki kart önizlemeleri için)
- [ ] Vitest: token yenileme, sync normalize, compact formatı

**Bitti kriteri:** `npm run sync:cards` 1 dakikada biter; `getStandardPool('shaman')` sınıf + nötr kartları döner; set listesi metadata'dan geliyor (elle yazılmış set yok).

## Faz 2 — Deste motoru (5–7 gün) — projenin kalbi

- [ ] `src/lib/deck/rules.ts` — deste kuralları sabitleri (30 kart, kopya limitleri, DK rune, sideboard sahipleri)
- [ ] `src/lib/deck/validate.ts` — deterministik doğrulayıcı; hataları `{code, cardId?, message}` listesi olarak döner
- [ ] `src/lib/deck/deckstring.ts` — `deckstrings` ile encode/decode + `### Ad / # Class / # Format` panoya kopyalanacak metin üretimi
- [ ] `src/lib/ai/provider.ts` — Vercel AI SDK sağlayıcı seçimi (`LLM_PROVIDER=google|ollama|anthropic`), model adları env'den
- [ ] `src/lib/ai/intent.ts` — prompt → niyet JSON (`generateObject`, Zod şeması; Flash-Lite yeterli)
- [ ] `src/lib/ai/retrieve.ts` — aday havuzu puanlama (sınıf, seed kart etiketleri, keyword/tribe/spell school, metin eşleşmesi) → 250–400 kart
- [ ] `src/lib/ai/build.ts` — deste seçimi (`generateObject`, Gemini Flash), çıktı şeması: `cards[], name, archetype, gamePlan, mulligan[], swaps[]`
- [ ] `src/lib/ai/repair.ts` — doğrulayıcı hatalarını LLM'e gönderip onarım; en fazla 2 tur; sonra kod tabanlı doldurma
- [ ] `src/lib/deck/pipeline.ts` — intent → retrieve → build → validate → repair → encode → Blizzard `/deck?code=` doğrulaması; her adımı `onStep` ile raporlar
- [ ] `app/api/forge/route.ts` — SSE/streaming yanıt: adım olayları + sonuç
- [ ] `docs/ARCHETYPES.md` — sınıf başına 2–3 güncel arketip kısa rehberi (LLM sistem prompt'una girer)
- [ ] Vitest: doğrulayıcı tüm kural ihlalleri, deckstring round-trip, pipeline mock ile uçtan uca
- [ ] `scripts/eval.ts` — 30 prompt'luk değerlendirme seti; geçerlilik oranı + seed kart dahil mi + süre + token sayısı raporu (ücretsiz katman limitine takılmamak için istekler arası bekleme)

**Bitti kriteri:** Eval setinde geçerli deste oranı %100 (doğrulayıcı sayesinde), seed kart dahil oranı ≥%95, ortalama süre <20 sn. Üretilen kodlar oyunda açılıyor (elle 5 deste test).

## Faz 3 — Arayüz (4–6 gün)

- [ ] Tasarımdan token'lar: `tailwind.config` renkler, fontlar, radius
- [ ] Landing/prompt sayfası: prompt input, örnek chip'ler, sınıf seçici, format rozeti
- [ ] Üretim durumu: adım izleyici (SSE olaylarını dinler)
- [ ] Deste sonuç sayfası: başlık, deste kodu kopyala + toast, kart listesi (mana sıralı, rarity gem, ×1/×2), hover kart görseli, mana eğrisi grafiği, dust maliyeti
- [ ] "Neden bu kartlar" paneli: game plan, mulligan, swap önerileri
- [ ] Hata/boş durumlar: belirsiz prompt, API kapalı, Standard'da olmayan kart
- [ ] Mobil düzen (390px), sticky kopyala butonu
- [ ] Footer: Blizzard fan content sorumluluk reddi

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
