# Archetype guide (included in the LLM system prompt as a summary)

Meta/winrate data is not in the official API; this file provides **class identity + archetype definitions**, not current card names (cards change every set; the LLM reads them from the candidate list). This file does not change with a new expansion; if a class identity changes (new mechanic), a single line is added.

## Archetypes

- **Aggro** — 12+ cards costing 1–3, at most 2–3 cards costing 5+. Goal: finish by turn 6–8. Little removal, lots of burn/face damage and board buffs. Mulligan: 1–2 drops.
- **Midrange** — Smooth 1–6 curve, takes board control and wins with tempo. Both early minions and a few strong mid-game cards.
- **Control** — Removal, board clears, heal/armor, card draw; 2–4 late-game finishers. Can have 3–5 cards costing 7+. Mulligan: early removal.
- **Combo / OTK** — Wins with a specific card combination; the deck is card draw + survival + combo pieces. The seed card is usually the center of the combo.

## Class identities

| Class | Strengths | Typical tribe / mechanic |
|---|---|---|
| Death Knight | Corpse economy, identity by rune: Blood (heal/removal/control), Frost (burn/spell/freeze), Unholy (undead board/aggro) | Undead; at most 3 runes |
| Demon Hunter | Fast tempo, hero attacks, Outcast, cheap spells | Demon, Naga |
| Druid | Mana ramp, Choose One, big minions, token/board | Beast, Dragon, Treant |
| Hunter | Face damage, Beast synergy, Secret, weapons | Beast |
| Mage | Spell damage, Freeze, Secret, Elemental, Discover | Elemental, spell school |
| Paladin | Buffs (handbuff/board), Divine Shield, weapons, Murloc/Mech | Murloc, Mech, Dragon |
| Priest | Heal, copy/steal, Dragon, Undead, control | Dragon, Undead, Naga |
| Rogue | Combo, weapons, Pirate, Stealth, cheap cards, Miracle | Pirate, Mech |
| Shaman | Overload, Elemental, Totem, Battlecry (Shudderwock), Nature spells | Elemental, Totem, Murloc |
| Warlock | Card draw (Life Tap), Demon, Discard, Zoo, self-damage | Demon, Imp |
| Warrior | Armor, weapons, Taunt, Rush, Pirate, Enrage | Pirate, Mech, Dragon |

The pipeline doesn't use this table directly; the `build.ts` system prompt contains the archetype rules in short form. The table is a reference when updating the prompt and interpreting eval results.
