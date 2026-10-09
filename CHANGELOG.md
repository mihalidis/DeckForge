# Changelog

## [Yayımlanmamış]

## [0.1.0] — 2026-10-09

İlk sürüm.

- LLM katmanı Vercel AI SDK + Gemini Flash (ücretsiz) olarak değiştirildi; Claude opsiyonel (2026-10-08).
- Proje planı, fizibilite raporu ve skill'ler oluşturuldu (2026-10-07).
- Faz 1: Blizzard istemcisi, kart senkronu (`npm run sync:cards`), yerel kart deposu, `/api/cards` (2026-10-08).
- Faz 2: deste motoru — doğrulayıcı, deckstring, Gemini ile intent/build/repair, `forgeDeck()` pipeline, `/api/forge` SSE, eval seti (2026-10-08).
- Faz 3: arayüz — landing, adım izleyici, deste sonucu (sidebar), kart listesi/grid, "why" paneli, hata kartları, mobil sticky kopyala (2026-10-08).
- Faz 4: refine sohbeti ve diff, Swap, paylaşım linki `/d/[code]`, IP bazlı istek limiti (2026-10-09).
- Faz 5: Vercel yapılandırması (prebuild sync, dosya paketleme, günlük cron → redeploy), GitHub Actions CI, Playwright smoke, `/d/[code]` OG görseli (2026-10-09).
- Metin alanlarındaki kalın sarı odak çerçevesi kaldırıldı; odak artık kapsayıcının ince, soluk ve yuvarlak kenarlığıyla gösteriliyor (2026-10-09).
- Tarayıcı sekmesi ikonu artık DeckForge logosu (altın kare, ortada elmas) (2026-10-09).
- Düzeltme: duyurulmuş ama çıkmamış genişlemenin kartları (`sets[].hyped`) havuzdan çıkarıldı; bu kartları içeren deck kodlarını oyun tanımıyordu. `npm run check:ids` teşhis scripti eklendi (2026-10-09).
- Yayın cilası: favicon, Apple icon, ana sayfa OG görseli, `metadataBase`, robots/sitemap, MIT lisansı, İngilizce README (2026-10-09).
