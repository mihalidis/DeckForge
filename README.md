# DeckForge

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
| `npm run eval` | 30 prompt'luk deste değerlendirme seti (Faz 2) |

Yığın: Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 (CSS-first, token'lar `src/app/globals.css` `@theme` bloğunda) · Vercel AI SDK + Gemini · `deckstrings`.

Bu proje Blizzard Entertainment ile bağlantılı değildir. Hearthstone, Blizzard Entertainment'ın tescilli markasıdır.
