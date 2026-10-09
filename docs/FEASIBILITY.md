# DeckForge — Feasibility Report

Date: 2026-10-07 · Status: **Feasible (medium difficulty)**

## Summary

Generating a valid Hearthstone deck from a user's free-text request ("build a deck around this card") and returning a deck code that can be pasted directly into the game is technically possible. All three building blocks are available and free:

1. **Card data:** Blizzard's official Hearthstone Game Data API (OAuth client-credentials, free, 36,000 requests/hour).
2. **Deck code:** An open, documented format (HearthSim "deckstring"); encode/decode with the `deckstrings` npm package. The Blizzard API's `/hearthstone/deck` endpoint also validates and expands the code.
3. **AI:** Provider-agnostic via the Vercel AI SDK; default is **Google Gemini Flash (free API tier)**, Ollama for development, Claude if desired. The real challenge is not the LLM knowing the rules by heart; it is putting the card pool in front of it correctly and running the output through a **deterministic validator**.

The risk boils down to two things: "invalid deck" (31 cards, 2 copies of a legendary, off-class card, card rotated out of Standard) and "bad deck" (no synergy). The first is fully solved in code; the second is managed with good retrieval + rule-based guidance + an evaluation set.

## 1. Card data — Blizzard Hearthstone Game Data API

| Topic | Finding |
|---|---|
| Registration | https://develop.battle.net → Battle.net account → "Create Client" → `client_id` + `client_secret`. Free. |
| Authorization | `POST https://oauth.battle.net/token` (`grant_type=client_credentials`, Basic auth). Token valid for ~24 hours; cached on the server. **Never** sent to the browser. |
| Base URL | `https://{region}.api.blizzard.com/hearthstone/...` — `region`: `us`, `eu`, `kr`, `tw`. Card data is region-independent; we will use `eu`. |
| Language | `locale=en_US` (also de_DE, fr_FR, es_ES, pt_BR, ru_RU, ko_KR, zh_TW, ja_JP, …). **No Turkish**; the TR UI text is ours, card texts stay in English. |
| Card search | `GET /cards?set=standard&collectible=1&class=shaman,neutral&manaCost=3&keyword=battlecry&textFilter=...&pageSize=500&page=1&sort=manaCost:asc` |
| Single card | `GET /cards/{id or slug}` |
| Deck | `GET /deck?code=AAEC...` (decodes the code) or `GET /deck?ids=1,2,3&hero=7` (builds a deck from ids, returns `deckCode`). `sideboardCards` parameter for sideboards. |
| Metadata | `GET /metadata` → `sets`, `setGroups` (the sets in Standard are read **from here**, never hand-written), `classes` (each class's hero `cardId`), `types`, `rarities`, `minionTypes`, `spellSchools`, `keywords`. |
| Card fields | `id` (**= dbfId, the number used in the deck code**), `slug`, `name`, `text`, `manaCost`, `attack`, `health`, `classId`, `multiClassIds`, `cardTypeId`, `cardSetId`, `rarityId`, `minionTypeId`, `keywordIds`, `image`, `cropImage`, `flavorText`, `collectible`. |
| Limits | 36,000 requests/hour, 100 requests/second. The Standard pool (~1,500–1,900 collectible cards) is fetched in 4–5 requests with `pageSize=500`. |
| Fallback source | HearthstoneJSON (`api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json`) — no key, community source; its `mechanics` array is richer than Blizzard's. Blizzard is primary, HSJSON is fallback/cross-check. |
| Terms of use | Blizzard API Terms of Use + Fan Content Policy: attribution, no official logos/frames, care with commercial use. Card images are shown via Blizzard CDN URLs (not downloaded and redistributed). |

**Decision:** The card pool is not fetched from Blizzard on every request. Once a day (and manually after a patch) `/metadata` + Standard collectible cards are fetched and written to a local JSON/SQLite cache. The LLM and search layers work from this cache; Blizzard is called only for sync and final validation.

## 2. Deck code (deckstring)

The format is documented by HearthSim and is identical to the format the game uses:

```
base64( 0x00 | version=1 | format | heroes[] | 1x cards[] | 2x cards[] | n-x (dbfId,count)[] [| sideboard] )
```

- All numbers are unsigned varints. `format`: 1 Wild, 2 Standard, 3 Classic, 4 Twist.
- `heroes`: the class's base hero dbfId (read from metadata `classes[].cardId`).
- Cards sorted ascending by dbfId → "canonical" code.
- The game ignores lines starting with `#`; the `### Deck Name` line is taken as the deck name. So we copy this to the clipboard:

```
### Shudderwock Shaman
# Class: Shaman
# Format: Standard
#
AAECAaoIBMmbBOW...
#
# To use this deck, copy it to your clipboard and create a new deck in Hearthstone
```

- `deckstrings` npm package: `encode({cards:[[dbfId,count]], heroes:[dbfId], format:2, sideboardCards:[[dbfId,count,ownerDbfId]]})` / `decode()`. The generated code is verified against Blizzard via `GET /deck?code=` — proof that both the code and the card list are consistent.

## 3. AI layer

The naive approach (dump all cards into the prompt, say "pick 30 cards") works but is expensive and error-prone. Proposed pipeline:

1. **Intent parsing (LLM, small model):** Prompt → `{class, format, seedCards[], archetype, budget, mustInclude[], mustExclude[], style}` JSON. If the class is ambiguous it is inferred from the seed card; if that is missing too, the user is asked a single question.
2. **Candidate pool (code):** `class ∪ neutral` and the Standard filter from the cache. Cards are scored against the seed card's tags (tribe, keyword, spell school, text keywords) and ~250–400 candidates are selected. Each card is a ~40-token compact line: `id|name|cost|atk/hp|type|rarity|text`.
3. **Deck selection (LLM):** Deck rules + archetype guide in the system prompt; the candidate list is sent in compact format (Gemini's 1M context window easily fits the pool; if we switch to a paid provider, prompt caching is enabled). Output: `{cards:[{id,count}], name, gamePlan, mulligan, swaps}` — Zod schema enforced via Vercel AI SDK `generateObject`.
4. **Validator (code, deterministic):** 30 cards, legendary ≤1, others ≤2, class match (`classId`/`multiClassIds`/neutral), Standard set check, DK rune constraint, sideboard rules (Zilliax, E.T.C.). If there are errors, **only the errors** are sent to the LLM for a repair round (at most 2 rounds); if it is still broken, code fills the gaps with the highest-scoring candidates.
5. **Encoding + verification:** `deckstrings.encode` → Blizzard `/deck?code=` → card list match.

Estimated cost: **$0** on the Gemini Flash free tier (within daily/per-minute request limits; limits may change, current values at ai.google.dev/gemini-api/docs/rate-limits). If traffic grows, switch to a paid tier or Claude with a `.env` change (~$0.01–0.03 per request in that case). Time: 8–20 s; step-by-step progress is shown in the UI.

**Note:** A Google One AI Pro / Gemini app subscription does not cover API usage; the API key is obtained separately and for free from aistudio.google.com, no credit card required. The free tier has no Pro models but does have Flash models; Flash is enough for our purposes.

**Known limitations:** Meta/winrate data is not in the official API (scraping HSReplay etc. is a ToS risk). Archetype knowledge comes from the LLM's general knowledge + the short `docs/ARCHETYPES.md` guide we write. When a new expansion releases, the LLM won't "know" the new cards but can still use them by reading their text; this is why card text always goes into the prompt.

## 4. Tech stack (decided)

- **Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4** (CSS-first tokens, hand-written components, no shadcn/ui)
- **Route Handlers** (`app/api/*`) make the Blizzard and Claude calls on the server; keys live in `.env`.
- **Data cache:** `data/cards.standard.json` in Phase 1 (not in the repo, generated by build/cron); SQLite/Turso if it grows.
- **LLM:** Vercel AI SDK (`ai` + `@ai-sdk/google`), Zod-schema output via `generateObject`. Provider is selected from `.env`: `google` (default, free), `ollama` (local development), `anthropic` (optional).
- **Deck code:** `deckstrings` npm.
- **Deploy:** Vercel; daily card sync via Vercel Cron.
- **Tests:** Vitest (validator + deckstring round-trip), Playwright (flow).

## 5. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| LLM produces an invalid deck | High | Deterministic validator + repair round + Blizzard `/deck` verification. An invalid deck is **never** shown to the user. |
| Standard rotation / new set | Certain (3 sets a year + April rotation) | Set list read from metadata; daily sync; manual trigger after a patch. |
| Blizzard API outage | Low | Keep working from the cache; only final verification is skipped and the user is notified. |
| Weak deck quality | Medium | 30-prompt evaluation set; archetype guide; seed-card synergy scoring. |
| Cost | Low | Gemini free tier; per-request limit; provider abstraction allows switching if needed. |
| Free tier quota runs out / changes | Medium | Provider is a single env variable via the Vercel AI SDK; "high demand right now" state in the UI; request queue in Phase 4. |
| Legal | Low | Image usage compliant with the Fan Content Policy, disclaimer in the footer, no official logos. |

## 6. Conclusion

All of the project's dependencies are free and documented. The MVP (Phases 0–3) can realistically be shipped by a single developer with **3–4 weeks** of evening/weekend effort. The most critical engineering investment is the validator and retrieval layer; the UI and API layers are standard.

## Sources

- Blizzard Hearthstone Game Data API documentation: https://develop.battle.net/documentation/hearthstone/game-data-apis
- Card search guide: https://develop.battle.net/documentation/hearthstone/guides/card-search
- Deckstring format (HearthSim): https://hearthsim.info/docs/deckstrings/
- `deckstrings` npm: https://www.npmjs.com/package/deckstrings · GitHub: https://github.com/hearthsim/hearthstone-deckstrings
- HearthstoneJSON: https://hearthstonejson.com/docs/cards.html
