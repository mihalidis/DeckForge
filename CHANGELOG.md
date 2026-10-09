# Changelog

## [Unreleased]

## [0.1.0] — 2026-10-09

First release.

- LLM layer switched to Vercel AI SDK + Gemini Flash (free); Claude optional (2026-10-08).
- Project plan, feasibility report and skills created (2026-10-07).
- Phase 1: Blizzard client, card sync (`npm run sync:cards`), local card repository, `/api/cards` (2026-10-08).
- Phase 2: deck engine — validator, deckstring, intent/build/repair with Gemini, `forgeDeck()` pipeline, `/api/forge` SSE, eval set (2026-10-08).
- Phase 3: interface — landing, step tracker, deck result (sidebar), card list/grid, "why" panel, error cards, mobile sticky copy (2026-10-08).
- Phase 4: refine chat and diff, Swap, share link `/d/[code]`, per-IP rate limit (2026-10-09).
- Phase 5: Vercel configuration (prebuild sync, file bundling, daily cron → redeploy), GitHub Actions CI, Playwright smoke, `/d/[code]` OG image (2026-10-09).
- Removed the thick yellow focus outline on text fields; focus is now shown by the container's thin, faint, rounded border (2026-10-09).
- The browser tab icon is now the DeckForge logo (gold square, diamond in the center) (2026-10-09).
- Fix: cards from an announced but unreleased expansion (`sets[].hyped`) were removed from the pool; the game did not recognize deck codes containing these cards. Added the `npm run check:ids` diagnostic script (2026-10-09).
- Release polish: favicon, Apple icon, home page OG image, `metadataBase`, robots/sitemap, MIT license, English README (2026-10-09).
