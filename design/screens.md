# Screen → route → component mapping

Prototype: `export/DeckForge.dc.html` (open in a browser, clickable). To see all screens side by side, `export/DeckForge Screens.dc.html`. The `data-screen-label` values in the prototype match the screen names below.

| # | Screen (prototype) | Route | State | Main components |
|---|---|---|---|---|
| 1a | Landing | `/` | `isLanding` | `Navbar`, `Hero`, `PromptBox` (textarea + example chips `EXAMPLES` + `ClassChips` 11 classes + format badge "Standard" + "Forge deck" button), `FeatureCards` ×3, `Footer` |
| 1b | Generating | `/` (same page, prompt collapses upward) | `isGenerating` | `PromptSummary`, `StepTracker` (`STEPS`: 5 steps, `s.done` / `s.active`, timer/counter `elapsed` on the right), arcane shimmer |
| 1c | Deck result — **A: sticky sidebar** | `/` (same page; `/d/[code]` share route in Phase 4) | `isResult && isA` | Left, sticky: `DeckHeader` (class icon `classInitial`, editable `deckName`, format, `dust`, `archetype`), `CopyCodeButton` + toast (`copied`), `DeckstringBlock` (collapsible, mono), `ManaCurve` (`curve`, 0–7+), `avgCost`, actions (Regenerate `regenerate`, Tweak `focusRefine`, Share). Right: `CardList` / `CardGrid` toggle (`isList`/`isGrid`), `WhyTheseCards` accordion (`sections`, `sec.open`), `SwapRow` ×n |
| 1d | Deck result — **B: dashboard** | `/deck/[id]` | `isResult && isB` | Top strip `DeckHeaderBar` (copy at top right), wide `CardList`, right rail `WhyTheseCards` |
| 1e | Refine thread | below the result (active in Phase 4) | `thread.length > 0` | `RefineInput` (`refineText`, `sendRefine`), `ThreadEntry` (user bubble `16/16/16/4`, AI reply), `DiffList` (removed in red `danger`, added in green `success`, `dustDelta`) |
| 1f | Error: vague | `/` | `errVague` | `ErrorCard` + `vagueFixes` chips ("Tell me a class or a card to build around") |
| 1g | Error: rotated | `/` | `errRotated` | `ErrorCard` + "not in Standard" explanation + `useRotatedFix` (Wild suggestion / alternative card) |
| 1h | Error: API | `/` | `errApi` | `ErrorCard` + `retryApi` button. The same screen is also used for `busy` (LLM quota/overload); different text: "The forge is busy, try again in a minute" |

**Decision (2026-10-08): A — sticky sidebar.** 1d (dashboard) will not be implemented; the copy button and mana curve stay visible while scrolling; on mobile, single column + sticky bottom bar.

## Prototype data model → our types

The prototype stores cards with `C(name,cost,rarity,count,type,cls)`. In reality, `src/lib/deck/types.ts`:

```ts
type DeckCard = { dbfId: number; name: string; cost: number; rarity: Rarity; count: 1|2; type: CardType; classSlug: string; image: string; cropImage: string };
type DeckResult = { id: string; name: string; classSlug: string; format: 'standard'; cards: DeckCard[]; deckstring: string; clipboardText: string; dust: number; archetype: string; sections: Section[]; swaps: Swap[] };
type Section = { id: 'plan'|'syn'|'mull'|'swaps'; title: string; paras: string[] };
type Swap = { out: DeckCard; in: DeckCard; why: string };
type ThreadEntry = { user: string; reply: string; removed: {dbfId,count}[]; added: {dbfId,count}[]; dustDelta: number };
```

The `STEPS` array maps one-to-one to the `app/api/forge` SSE events: `intent` → `retrieve` → `build` → `validate` → `encode`.

## Not taken from the prototype

- All data is fake (`BASE_DECK`, `DECKSTRING`, `SECTIONS`); names and code don't reflect reality.
- Inline styles → converted to Tailwind classes via `tokens.md`. Hex codes are never written directly into JSX.
- `DCLogic` / `sc-if` / `dc-import` are Design's runtime; no equivalent in Next.js.
- The prototype is a single-page state machine; we have Landing (`/`) and Deck (`/deck/[id]`) as separate routes, and a deck can be shared by URL (may merge with Phase 4 `/d/[code]`).

## Missing

- Mobile (390px) screens are not in the prototype → to be derived in Phase 3, staying faithful to `tokens.md`; the mobile item in `DESIGN-PROMPT.md` applies.
- Screen PNGs are not in `screens/` yet (optional; the prototype HTML is enough).
