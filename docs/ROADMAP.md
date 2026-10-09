# DeckForge — Phase-by-Phase Development Plan

Each phase ends in a working state and has a "done" criterion. Completed items are marked `[x]`; the `/faz` skill picks the next task from here.

Scope decision (Phases 1–5): **Standard only, no user accounts, dark theme, English card data.**

---

## Phase 0 — Preparation (1–2 days)

- [x] Open a Battle.net Developer account, create a client, get `BLIZZARD_CLIENT_ID` / `BLIZZARD_CLIENT_SECRET`
- [x] Get a Gemini API key (AI Studio, separate "DeckForge" project) → `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] (Optional, local development) Install Ollama, `ollama pull qwen3:14b` or similar
- [x] Finish the design in Design (`docs/DESIGN-PROMPT.md`)
- [x] Project archive exported from Design, unpacked into `design/export/` (PNGs optional)
- [x] `design/tokens.md` — color/font/radius/spacing tokens (source for `tailwind.config` in Phase 3)
- [x] `design/screens.md` — screen → route → component mapping
- [x] Result page direction: **A (sticky sidebar)** chosen
- [x] Next.js 16 scaffold (`--ts --tailwind --app --src-dir`), tokens in the `globals.css` `@theme` block, fonts via `next/font`, `src/lib/*` folders, `src/i18n/en.ts`
- [ ] `npm install` (from the terminal; dependencies are ready in package.json) and first launch with `npm run dev`
- [x] ~~shadcn/ui~~ — decision: not used; design tokens and components are hand-written (fewer dependencies, 1:1 with the prototype)
- [x] `.env.example` → `.env.local`; run steps in `README.md`
- [ ] Git init, first commit

**Done criterion:** `npm run dev` starts, design files are in the repo, keys are in `.env.local`.

## Phase 1 — Data layer (3–4 days)

- [x] `src/lib/blizzard/auth.ts` — client-credentials token fetch, in-memory cache, refresh with a 5 min margin, shared concurrent calls
- [x] `src/lib/blizzard/client.ts` — typed client (`metadata`, `card`, `searchCards`, `searchAllCards`, `deckByCode`, `deckByIds`), 401 refresh, 429 backoff
- [x] `src/lib/blizzard/types.ts` — API response types
- [x] `scripts/sync-cards.ts` + `src/lib/cards/normalize.ts` — metadata + Standard cards → `data/cards.standard.json` (+ `metadata.json`, `sample.raw.json`)
- [x] First real sync: 1322 Standard cards, 8 sets, 7 s (2026-10-08). Dual-class cards were found to come with `classId=null` → normalize fixed
- [x] `src/lib/cards/repo.ts` — `getCard`, `searchCards`, `getStandardPool`, `getClassInfo`
- [x] `src/lib/cards/compact.ts` — `dbfId|Name|cost|atk/hp|type|rarity|class|tags|text`
- [x] `app/api/cards/route.ts` — search endpoint
- [x] Vitest: auth (4), normalize (5), compact (2), repo (4) — `npm test` to be run locally

**Done criterion:** `npm run sync:cards` finishes within 1 minute; `getStandardPool('shaman')` returns class + neutral cards; the set list comes from metadata (no hand-written sets).

## Phase 2 — Deck engine (5–7 days) — the heart of the project

- [x] `src/lib/deck/rules.ts` — rules, class slugs/names, deckstring format constants (sideboard: Standard currently has no sideboard cards, Phase 4+)
- [x] `src/lib/deck/validate.ts` — SIZE / COPIES / UNKNOWN_CARD / CLASS_MISMATCH / RUNES / DUPLICATE_ENTRY / BAD_COUNT
- [x] `src/lib/deck/deckstring.ts` — encode/decode, clipboard text, short id
- [x] `src/lib/ai/provider.ts` — provider selection; key/model validation via `npm run llm:check`
- [x] `src/lib/ai/intent.ts` + `schemas.ts` + `prompts/intent.ts`
- [x] `src/lib/ai/retrieve.ts` — the whole pool (~380 cards, ~10k tokens) is sent, sorted by seed/synergy/tribe score; noLegendaries and mustExclude are filtered out here
- [x] `src/lib/ai/build.ts` + `prompts/build.ts` — `buildDeck`, `repairDeck`
- [x] `src/lib/ai/repair.ts` — mechanical repair (if the LLM can't fix it in 2 rounds)
- [x] `src/lib/deck/pipeline.ts` — `forgeDeck()`; `ForgeError` kinds: vague / rotated / api / invalid / llm
- [x] `app/api/forge/route.ts` — POST, SSE (`step` / `result` / `error`)
- [x] `docs/ARCHETYPES.md` — archetype definitions + class identities (no card names)
- [x] Vitest: validate (5), deckstring (3), retrieve (3), pipeline mock (4) — 30 tests green in total
- [x] `scripts/eval.ts` — 30 prompts (28 decks + 2 expected errors), 4 s interval, `data/eval-*.json` report
- [x] `npm run llm:check` → key and model names verified
- [x] First real decks: 8/8 legal + Blizzard-verified (Al'Akir Elemental, Budget Hunter, Armor Warrior, Murloc Paladin…), 15–35 s
- [ ] Full 30-prompt eval — the free Gemini quota is ~20 decks per day; **decision: stay on the free tier**, the eval is split across days (`--limit`) and stops itself when it sees `busy`
- [x] Manual in-game test: the first codes were rejected by the game → cause: cards from the upcoming (`hyped`) set; excluded in sync, the code opened in-game (2026-10-09)

**Done criterion:** 100% valid deck rate on the eval set (thanks to the validator), seed card inclusion rate ≥95%, average time <20 s. Generated codes open in-game (5 decks tested manually).

**Status (2026-10-08):** The engine works; across 8 real decks: 100% legal, 100% seed, 15–35 s (LLM-dependent). Remaining: manual in-game test and spreading the eval across days. Moved on to Phase 3.

## Phase 3 — Interface (4–6 days)

- [x] Tokens in `globals.css` `@theme` (in Phase 0); mana/dust/archetype/toast colors added
- [x] Landing: `PromptBox` (textarea, format toggle, 11 class chips, Forge), example chips, `FeatureCards`
- [x] `StepTracker` + `useForge` SSE client (step/result/error events, elapsed timer, cancel)
- [x] Result (direction A): `DeckHeader` (class badge, editable name, dust/cards/avg, copy + toast, code details, `ManaCurve`, actions), `CardList` (mana groups, `ManaGem`, rarity gem, real card image on hover, card-art grid)
- [x] `WhyPanel` accordion (game plan, synergy, mulligan, swaps — Swap button in Phase 4)
- [x] `ErrorCard`: vague (example chips), rotated, api, busy, llm, invalid
- [x] Mobile: single column, `StickyCopyBar`; hover preview desktop only
- [x] Reviewed in the browser with a real deck; execCommand fallback added for copying (2026-10-09)
- [x] `Navbar`, `Footer` (disclaimer)

**Done criterion:** The prompt → deck → copy → paste in game flow works on desktop and mobile; Lighthouse accessibility ≥90.

## Phase 4 — Improvement / refine (3–4 days)

- [x] Refine: `POST /api/refine` (LLM edits → validate/mechanical repair → encode), `RefineThread` bubbles + removed/added diff + dust difference, history is sent as context
- [x] Swap: `POST /api/deck` (no LLM; validate + encode), shows "Swapped" in WhyPanel once applied, diff is posted to the thread
- [x] Rate limit: in-memory, per IP (`RATE_LIMIT_FORGE`, default 8 / 10 min) for forge + refine; Upstash in Phase 5 if needed
- [ ] Error tracking (Sentry) and product analytics (PostHog) — optional, free tiers; disabled by default via env for open source
- [x] Sharing: `/d/[code]` (base64url deckstring → built from local data, no DB/LLM, OG title/description), Share button copies the link
- [ ] `generateObject` → `generateText + Output.object` migration (AI SDK deprecation)

**Done criterion:** The refine flow works on 10 examples from the eval set; the share link produces a social preview (OG image).

**Status (2026-10-09):** Code complete, build and 33 tests green; remaining: trying refine with a real LLM and the OG image (moved to Phase 5).

## Phase 5 — Release (2–3 days)

- [x] Vercel configuration: `data/*.json` is bundled via `outputFileTracingIncludes`, `prebuild` runs the sync during build (a build without keys also passes)
- [x] Vercel project: https://deck-forge-eosin.vercel.app (2026-10-09)
- [x] Vercel Cron (`vercel.json`, 08:20 UTC) → `/api/cron/redeploy` (CRON_SECRET) → Deploy Hook → new build with fresh data; manual Redeploy on patch day
- [x] Playwright smoke (`e2e/smoke.spec.ts`: landing, `/d/[code]`, API 400) — runs locally/on preview; CI runs typecheck + lint + vitest + build (`.github/workflows/ci.yml`)
- [x] `/d/[code]/opengraph-image` dynamic OG image (class color, name, dust, mana curve)
- [x] Favicon (`icon.svg`, `apple-icon`), home page OG image, `metadataBase` (`NEXT_PUBLIC_SITE_URL` → Vercel host), robots/sitemap; `/d/[code]` noindex
- [ ] Domain name (if wanted; one line via `NEXT_PUBLIC_SITE_URL`)
- [x] `CHANGELOG.md` v0.1.0, MIT `LICENSE`, English `README.md` (Turkish README at `docs/README.tr.md`)
- [ ] GitHub Release v0.1.0 (`git tag v0.1.0 && git push --tags`)

**Done criterion:** Public URL; daily sync works; CI green.

---

## Later phases (out of scope, in order)

- **Phase 6 — Wild format:** the pool grows (~5,000 cards); retrieval becomes mandatory, prompt cache per class+format.
- **Phase 7 — Deck import:** the user pastes their own code → analysis, suggestions for missing/weak cards, "make this better".
- **Phase 8 — Accounts and history:** Auth (Clerk/Auth.js), generated decks, favorites; DB (Turso/Neon + Drizzle).
- **Phase 9 — Turkish interface:** i18n (card texts stay in English; the API has no TR).
- **Phase 10 — Collection awareness:** cards the user owns (manual list or HDT export) → decks built only from owned cards; dust budget.
- **Phase 11 — Battlegrounds / Twist:** separate pools via metadata `gameMode`.
