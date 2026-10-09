# DeckForge

**AI deck builder for Hearthstone.** Describe the deck you want to play — *"Elemental Shaman around Al'Akir"*, *"cheap aggro Hunter under 3000 dust"* — and get a legal 30-card Standard deck with a code that pastes straight into the game.

Live: https://deck-forge-eosin.vercel.app · Türkçe dokümantasyon: [`docs/`](docs/) ([README](docs/README.tr.md), [feasibility](docs/FIZIBILITE.md), [roadmap](docs/ROADMAP.md))

## How it works

1. **Card data** comes from Blizzard's official [Hearthstone Game Data API](https://develop.battle.net/documentation/hearthstone/game-data-apis) and is synced into a local JSON cache (`npm run sync:cards`, and on every production build). Only released Standard sets are used; announced-but-unreleased expansions are filtered out because the game rejects deck codes that contain them.
2. **The LLM** (Gemini Flash by default via the Vercel AI SDK; Ollama and Anthropic are drop-in alternatives) reads your request, then picks 30 cards from the class's full Standard pool — every card with its real text, so new sets work without retraining anything.
3. **A deterministic validator** checks size, copy limits, class legality and Death Knight runes. If the model slips, it gets the errors back for up to two repair rounds, then a mechanical repair finishes the job. Invalid decks never reach the UI.
4. **The deck code** is encoded with [`deckstrings`](https://github.com/hearthsim/hearthstone-deckstrings) and verified against Blizzard's `/deck` endpoint. Copy, open Hearthstone, create a new deck.

Then: refine the deck in a chat ("make it cheaper"), apply suggested swaps, or share it with a link (`/d/<code>`) that needs no database.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · Vercel AI SDK · `deckstrings` · Vitest · Playwright

## Run it locally

```bash
git clone https://github.com/<you>/deckforge && cd deckforge
npm install
cp .env.example .env.local      # fill in the keys below
npm run sync:cards              # pulls ~1,200 Standard cards from Blizzard (≈10 s)
npm run dev                     # http://localhost:3000
```

You need two free keys:

- **Blizzard** — create a client at [develop.battle.net](https://develop.battle.net) → `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`.
- **Gemini** — [aistudio.google.com](https://aistudio.google.com) → `GOOGLE_GENERATIVE_AI_API_KEY`. The free tier is enough for development (quota is per model and resets daily; the app shows a "forge is busy" state when it runs out). Set `LLM_PROVIDER=ollama` to run fully local, or `anthropic` to use Claude.

`npm run llm:check` verifies the key and model names; `npm run eval -- --limit 3` builds a few real decks and reports legality, seed-card inclusion and timing.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run sync:cards` | Fetch metadata + Standard cards into `data/` |
| `npm run check:ids` | Cross-check card ids against HearthstoneJSON (diagnostics) |
| `npm run llm:check` | Verify LLM key and model ids |
| `npm run eval [-- --limit N]` | Evaluation set of 30 prompts (uses LLM quota) |
| `npm test` / `npm run e2e` | Vitest unit tests / Playwright smoke tests |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy (Vercel, free plan)

Card data is not committed; `prebuild` fetches it on every build and `next.config.ts` bundles `data/*.json` into the server functions. A daily cron (`vercel.json`) calls `/api/cron/redeploy`, which triggers a Deploy Hook so the data stays fresh.

1. Import the repo in Vercel. Add the env vars from `.env.example`.
2. Settings → Git → Deploy Hooks → create one, put its URL in `VERCEL_DEPLOY_HOOK_URL`; add a random `CRON_SECRET`.
3. Optional: `NEXT_PUBLIC_SITE_URL` for a custom domain (used for OG images and the sitemap).

## Project layout

```
src/lib/blizzard   token + typed client for the Blizzard API
src/lib/cards      sync normalisation, local repo, compact format for the LLM
src/lib/deck       rules, validator, deckstring, assemble, pipeline
src/lib/ai         provider selection, intent, retrieve, build, refine, repair
src/app            pages, /api/forge (SSE), /api/refine, /api/deck, /d/[code]
scripts            sync-cards, eval, llm-check, check-ids, prebuild
docs               Turkish planning docs (feasibility, roadmap, API notes)
design             Claude Design export, tokens and screen map
```

## Contributing

Issues and PRs are welcome. The rules the code follows are in [`CLAUDE.md`](CLAUDE.md) (in Turkish; the gist: never hand-write set/class lists, never show an unvalidated deck, no hex colours in JSX, all LLM calls go through `src/lib/ai/provider.ts`).

## License & disclaimer

MIT — see [LICENSE](LICENSE). DeckForge is a fan project and is not affiliated with Blizzard Entertainment. Hearthstone is a trademark of Blizzard Entertainment, Inc. Card data and images are © Blizzard Entertainment and are used under the [Blizzard Developer API Terms](https://develop.battle.net/documentation/guides/getting-started) and [Fan Content Policy](https://www.blizzard.com/en-us/legal/fan-content-policy).
