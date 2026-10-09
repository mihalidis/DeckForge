# DeckForge

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 (CSS-first: tokens live in the `@theme` block of `src/app/globals.css`, there is no `tailwind.config`) (no shadcn/ui; components are hand-written under `src/components/`). The user asks for a deck in free text, the LLM (Vercel AI SDK; default Gemini Flash free tier) picks a **legal** 30-card Hearthstone deck from the card pool, a deck code is generated and pasted into the game. Card data comes from the Blizzard Hearthstone Game Data API.

Docs: `README.md` (English, open source), `docs/README.tr.md` (Turkish README), `docs/FEASIBILITY.md` (why/how), `docs/ROADMAP.md` (phase plan, single source of truth), `docs/API-NOTES.md` (Blizzard API + deckstring reference), `docs/DESIGN-PROMPT.md`.

## Commands

- `npm run dev` — development server
- `npm run sync:cards` — fetches metadata + Standard cards from Blizzard and writes them under `data/` (from Phase 1 on)
- `npm run eval` — 30-prompt deck evaluation set (`-- --limit 3`, `-- --no-verify`)
- `npm run llm:check` — verify LLM key/model name
- `npm run typecheck` · `npm test` · `npm run e2e` (Playwright; needs `data/`, does not call the LLM) · `npm run build` (prebuild: syncs if keys are present)

## Structure

- `src/lib/blizzard/` — token, typed client, API types. Calls to Blizzard go out **only** from here.
- `src/lib/cards/` — card reading/search over the local cache (`data/*.json`); `compact` line format for the LLM.
- `src/lib/deck/` — rules, deterministic validator, deckstring encode/decode, `assemble` (spec → code + clipboard text; shared by forge/refine/swap/share), `share` (fs-free client helpers), pipeline.
- `src/lib/ai/` — provider (provider selection), intent, retrieve (candidate pool), build (deck selection), repair. Prompts in `src/lib/ai/prompts/*.ts` (constant strings), schemas in `schemas.ts` (Zod).
- `app/api/forge` — step events + result over SSE. `app/api/refine` — editing (LLM). `app/api/deck` — validate + encode (no LLM). `app/api/cards` — search. `app/d/[code]` — share page.
- Client components (`"use client"`) cannot import modules that use fs, such as `src/lib/cards/repo` or `assemble`; pure helpers live in `src/lib/deck/share.ts`.
- `data/` — sync output, not committed to git; on Vercel `prebuild` generates it on every build and `next.config.ts` bundles it into the functions via `outputFileTracingIncludes`. `scripts/` — sync, eval, llm-check, prebuild.
- `design/` — Design prototype (`export/DeckForge.dc.html`), `tokens.md`, `screens.md`. This is the target when writing UI.
- `src/i18n/en.ts` — all user-facing strings.
- Next 16 APIs may differ from your training data: before writing code, read the relevant guide in `node_modules/next/dist/docs/` (`AGENTS.md`).

## Rules

- **Card id = dbfId.** Blizzard's `card.id` field is the number used in the deckstring; do not derive any other id.
- **Set, class and hero lists are never hand-written.** Standard sets are read from `metadata.setGroups` (excluding upcoming `hyped` sets — the game rejects codes containing unreleased cards), hero dbfIds from `metadata.classes[].cardId`.
- **An invalid deck is never shown to the user.** Every LLM output goes through `validate()`; if there are errors, `repair()`; if errors remain, code fills in the rest. The validator is never changed without tests.
- **The card list is always sent to the LLM with card text**; assume the model does not know cards from memory. The candidate pool is sent in `compact` format.
- **LLM calls go only through `src/lib/ai/provider.ts`.** Provider SDKs (`@ai-sdk/google` etc.) are not imported in any other file; model name and provider come from `.env`. Output is always `generateObject` + a Zod schema; free text is never parsed.
- **Keys stay on the server.** `BLIZZARD_*` and `GOOGLE_GENERATIVE_AI_API_KEY` / `ANTHROPIC_API_KEY` are read only inside Route Handlers / scripts; they never get the `NEXT_PUBLIC_` prefix.
- Live requests to Blizzard only for `sync:cards` and final verification (`/deck?code=`); search and the LLM run from the cache.
- Card images are shown from Blizzard CDN URLs, never downloaded into the repo. No official logo/card frame is used; the footer has a fan content disclaimer.
- **No hex in JSX.** Colors come from the `globals.css` `@theme` tokens (`bg-ink-raised`, `text-accent`, `border-line` …); if a new color is needed, add it to `design/tokens.md` first, then to `@theme`.
- UI text is English for now (Hearthstone terminology); constant strings are collected in `src/i18n/en.ts` so TR can be added in Phase 9.
- Every user-visible change is written under `CHANGELOG.md` → `[Unreleased]`; completed items are marked `[x]` in `docs/ROADMAP.md`.

- `npm run eval` eats the free Gemini quota (~20 decks per day); during development run it with `--limit 2-3`; once the quota is exhausted it returns `busy`.

## Skills

- `/faz` — pick the next item from the ROADMAP, implement it, mark it done (`.claude/skills/faz/SKILL.md`)
- `/blizzard-api` — making requests to the Blizzard API, parameters, troubleshooting (`.claude/skills/blizzard-api/SKILL.md`)
- `/deckstring` — generating/decoding/validating deck codes (`.claude/skills/deckstring/SKILL.md`)
