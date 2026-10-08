# DeckForge

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 (CSS-first: token'lar `src/app/globals.css` `@theme` bloğunda, `tailwind.config` yok) + shadcn/ui. Kullanıcı serbest metinle deste ister, LLM (Vercel AI SDK; varsayılan Gemini Flash ücretsiz katman) kart havuzundan 30 kartlık **geçerli** bir Hearthstone destesi seçer, deck kodu üretilir ve oyuna yapıştırılır. Kart verisi Blizzard Hearthstone Game Data API'den gelir.

Dokümanlar: `docs/FIZIBILITE.md` (neden/nasıl), `docs/ROADMAP.md` (faz planı, tek gerçek kaynak), `docs/API-NOTLARI.md` (Blizzard API + deckstring referansı), `docs/TASARIM-PROMPT.md`.

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run sync:cards` — Blizzard'dan metadata + Standard kartları çekip `data/` altına yazar (Faz 1'den itibaren)
- `npm run eval` — 30 prompt'luk deste değerlendirme seti (Faz 2'den itibaren)
- `npx tsc --noEmit` · `npx vitest` · `npx playwright test`

## Yapı

- `src/lib/blizzard/` — token, tipli istemci, API tipleri. Blizzard'a **yalnızca** buradan çıkılır.
- `src/lib/cards/` — yerel önbellek (`data/*.json`) üzerinden kart okuma/arama; LLM için `compact` satır formatı.
- `src/lib/deck/` — kurallar, deterministik doğrulayıcı, deckstring encode/decode, pipeline.
- `src/lib/ai/` — provider (sağlayıcı seçimi), intent (niyet), retrieve (aday havuzu), build (deste seçimi), repair (onarım). Prompt'lar `src/lib/ai/prompts/*.md`.
- `app/api/forge` — SSE ile adım olayları + sonuç. `app/api/cards` — arama.
- `data/` — senkron çıktısı, git'e girmez. `scripts/` — sync ve eval.
- `design/` — Design prototipi (`export/DeckForge.dc.html`), `tokens.md`, `screens.md`. UI yazarken hedef budur.
- `src/i18n/en.ts` — tüm kullanıcı metinleri.
- Next 16 API'leri eğitim verinden farklı olabilir: kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehbere bak (`AGENTS.md`).

## Kurallar

- **Kart id = dbfId.** Blizzard `card.id` alanı deckstring'de kullanılan sayıdır; başka id türetme.
- **Set, sınıf, kahraman listesi elle yazılmaz.** Standard setleri `metadata.setGroups`'tan, kahraman dbfId'leri `metadata.classes[].cardId`'den okunur.
- **Geçersiz deste kullanıcıya asla gösterilmez.** Her LLM çıktısı `validate()`'ten geçer; hata varsa `repair()`; hâlâ hata varsa kod doldurur. Doğrulayıcı testsiz değişmez.
- **LLM'e kart listesi her zaman kart metniyle gider**; model kartları ezberden bilmez varsay. Aday havuzu `compact` formatında gönderilir.
- **LLM çağrısı yalnızca `src/lib/ai/provider.ts` üzerinden.** Sağlayıcı SDK'ları (`@ai-sdk/google` vb.) başka dosyada import edilmez; model adı ve sağlayıcı `.env`'den gelir. Çıktı her zaman `generateObject` + Zod şeması, serbest metin parse edilmez.
- **Anahtarlar sunucuda kalır.** `BLIZZARD_*` ve `GOOGLE_GENERATIVE_AI_API_KEY` / `ANTHROPIC_API_KEY` yalnızca Route Handler / script içinde okunur; `NEXT_PUBLIC_` öneki almaz.
- Blizzard'a canlı istek yalnızca `sync:cards` ve son doğrulama (`/deck?code=`) için; arama ve LLM önbellekten çalışır.
- Kart görselleri Blizzard CDN URL'inden gösterilir, indirilip repoya konmaz. Resmî logo/kart çerçevesi kullanılmaz; footer'da fan content sorumluluk reddi var.
- **JSX'e hex yazılmaz.** Renkler `globals.css` `@theme` token'larından (`bg-ink-raised`, `text-accent`, `border-line` …) gelir; yeni renk gerekiyorsa önce `design/tokens.md`'ye, sonra `@theme`'e eklenir.
- UI metinleri şimdilik İngilizce (Hearthstone terminolojisi); sabit metinler `src/i18n/en.ts`'te toplanır ki Faz 9'da TR eklenebilsin.
- Kullanıcıya görünen her değişiklik `CHANGELOG.md` → `[Yayımlanmamış]` altına yazılır; tamamlanan maddeler `docs/ROADMAP.md`'de `[x]` yapılır.

## Skill'ler

- `/faz` — ROADMAP'ten sıradaki işi seç, uygula, işaretle (`.claude/skills/faz/SKILL.md`)
- `/blizzard-api` — Blizzard API'ye istek atma, parametreler, sorun giderme (`.claude/skills/blizzard-api/SKILL.md`)
- `/deckstring` — deck kodu üretme/çözme/doğrulama (`.claude/skills/deckstring/SKILL.md`)
