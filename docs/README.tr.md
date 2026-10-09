# DeckForge (Türkçe)

İngilizce ana README: [`../README.md`](../README.md)

Hearthstone için yapay zeka destekli deste üretici. Serbest metinle iste ("Shudderwock etrafında bir Shaman destesi"), geçerli 30 kartlık deste ve oyuna yapıştırılabilir deck kodu al.

- Fizibilite: `docs/FIZIBILITE.md`
- Faz planı: `docs/ROADMAP.md`
- API referansı: `docs/API-NOTLARI.md`
- Tasarım: `design/` (prototip `design/export/DeckForge.dc.html`, token'lar `design/tokens.md`)

## Kurulum

```bash
cp .env.example .env.local   # Blizzard + Gemini anahtarlarını doldur
npm install
npm run dev                  # http://localhost:3000
```

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run sync:cards` | Blizzard'dan metadata + Standard kartları `data/` altına çeker (Faz 1) |
| `npm run eval` | 30 prompt'luk deste değerlendirme seti (`-- --limit 3`); ücretsiz Gemini kotasını yer |
| `npm run llm:check` | LLM anahtarı ve model adlarını doğrular |
| `npm run e2e` | Playwright smoke |

## Yayına alma (Vercel, ücretsiz plan)

Kart verisi (`data/*.json`) repoda değil; her build'de `prebuild` adımı Blizzard'dan çeker ve dosyalar sunucu fonksiyonlarına paketlenir. Günlük tazeleme için Vercel Cron her sabah bir Deploy Hook tetikler.

1. Repoyu Vercel'e bağla (Import Project). Framework: Next.js, komutlar varsayılan.
2. Environment Variables: `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, `BLIZZARD_REGION`, `LLM_PROVIDER`, `GOOGLE_GENERATIVE_AI_API_KEY`, `LLM_MODEL_*`, `LLM_THINKING_*` (hepsi `.env.example`'da).
3. Settings → Git → Deploy Hooks → "daily-sync" adında hook oluştur, URL'yi `VERCEL_DEPLOY_HOOK_URL` olarak ekle.
4. `CRON_SECRET` ekle (rastgele uzun bir dize). `vercel.json`'daki cron (`20 8 * * *` UTC ≈ TR 11:20, Gemini kotası sıfırlandıktan sonra) `/api/cron/redeploy`'u bu secret ile çağırır.
5. Deploy. İlk build'de loglarda `→ metadata çekiliyor…` satırını gör; `/api/cards?q=alakir` ile veriyi doğrula.

Yama günü elle tazeleme: Vercel'de "Redeploy" ya da hook URL'sine `POST`.

## Testler

- `npm test` — birim (Vitest)
- `npm run e2e` — Playwright smoke (landing, `/d/[code]`, API); `npm run sync:cards` sonrası, LLM'e gitmez. İlk kez: `npx playwright install chromium`
- CI (`.github/workflows/ci.yml`): typecheck + lint + test + build

Yığın: Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 (CSS-first, token'lar `src/app/globals.css` `@theme` bloğunda) · Vercel AI SDK + Gemini · `deckstrings`.

Bu proje Blizzard Entertainment ile bağlantılı değildir. Hearthstone, Blizzard Entertainment'ın tescilli markasıdır.
