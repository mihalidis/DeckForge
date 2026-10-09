# Design prompt for Design

Paste the prompt below as-is into Claude Design (or whichever design tool you use). The prompt is written in English because design tools give more consistent results in English; UI text is in English using Hearthstone terminology, and language support (TR) will be added in a later phase.

---

```
Design a dark, premium web app called **DeckForge** — an AI deck builder for Hearthstone. A player types a natural-language request (e.g. "Build a Standard Shaman deck around Shudderwock" or "Cheap aggro Hunter under 3000 dust") and the app returns a complete, legal 30-card deck with a copyable deck code that pastes straight into the game.

## Mood & visual language
- Fantasy-tavern feel, but modern and restrained: deep charcoal / ink-blue background (#0E1116 → #141A24), warm amber-gold accent (#E0A64B) used sparingly for primary actions and highlights, parchment-cream text (#F2E9D8). Secondary accent: arcane teal (#3FB9A8) for AI/"thinking" states.
- Subtle texture allowed (fine grain, soft vignette), no literal wood planks or heavy skeuomorphism. Rounded 12–16px corners, soft inner glows on focus, thin 1px borders at 10–15% opacity.
- Typography: a display serif with character for headings (e.g. Cinzel-like or Fraunces-like), a clean humanist sans for body (e.g. Inter / Manrope), tabular numerals for stats.
- Class color coding for Hearthstone's 11 classes as small chips/underline accents (Mage blue, Warrior red, Hunter green, Paladin gold, Priest white/silver, Rogue dark gray, Shaman indigo, Warlock purple, Druid brown, Demon Hunter emerald, Death Knight frost teal).
- Mana crystals, rarity gem colors (common gray, rare blue, epic purple, legendary orange) as compact UI motifs.

## Pages / screens to design
1. **Landing / Prompt page** — Hero headline ("Describe the deck. We forge it."), one big prompt input with placeholder examples, format selector (Standard only for v1, Wild "coming soon"), optional class pill selector, 3–4 example prompt chips, a "Forge deck" primary button. Below: three short feature cards (Live card data from Blizzard, Legal & validated decks, One-click deck code).
2. **Generating state** — Same page, prompt collapses to top; a progress panel shows AI steps in sequence with check marks: "Reading your request → Searching 1,600 Standard cards → Choosing synergies → Validating deck → Encoding deck code". Teal shimmer, no spinner-only screens.
3. **Deck result page** (the core screen) — Two-column desktop layout:
   - Left (narrow): deck header with class icon, deck name (editable), format badge, dust cost, archetype tag (Aggro / Midrange / Control / Combo). Big **"Copy deck code"** button with a success toast "Copied — paste in Hearthstone". A collapsed code block showing the deckstring. Mana curve bar chart (0–7+). Secondary: "Regenerate", "Tweak" (opens follow-up prompt), "Share".
   - Right (wide): the 30-card list grouped and sorted by mana cost, each row = mana crystal, card name, rarity gem, ×1/×2 count, hover shows full card art preview. Toggle between list view and card-art grid view.
   - Bottom / side panel: **"Why these cards"** — AI explanation in 3–5 short sections (Game plan, Core synergy, Mulligan tips, Possible swaps). Swaps appear as replaceable card pairs with a "Swap" button.
4. **Follow-up / refine** — A chat-like thread under the deck: user says "make it cheaper" / "remove Sargeras" and a diff view shows removed (red) / added (green) cards.
5. **Empty & error states** — Blizzard API unavailable; prompt too vague ("Tell me a class or a card to build around"); request not possible in Standard (card rotated out) with a suggestion.
6. **Mobile** — single column, deck code button sticky at bottom, card list collapsible by mana cost.

## Components to include in the system
Prompt input (multiline, with chips), class pill selector, format toggle, card row, card art tile, mana curve chart, rarity gem, dust badge, AI step tracker, copy button + toast, diff list, explanation accordion, navbar (logo, "New deck", "About", theme is dark-only), footer with Blizzard fan-content disclaimer.

## Constraints
- Dark theme only for v1. WCAG AA contrast for all text on dark surfaces.
- Desktop first (1440), then 390 mobile.
- Do not use Blizzard logos or official card frames; card art appears only as rectangular image thumbnails.
- Keep the UI calm: one primary action per screen, generous spacing, no more than two accent colors visible at once.
```
