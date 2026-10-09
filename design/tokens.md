# DeckForge design tokens

Source: `export/DeckForge.dc.html` (Claude Design prototype, inline styles). The `export/_ds/organic-*` folder is Design's default "Organic" system skeleton and is **not used in this project** (light cream theme; our design is dark). Ignore it.

This file is the single source for the Tailwind v4 `@theme` block in `src/app/globals.css` (there is no `tailwind.config`). New colors are added here first, then to `@theme`.

## Colors

| Token | Hex | Usage (role in the prototype) |
|---|---|---|
| `bg` | `#0E1116` | Page background (darkest) |
| `bg-raised` | `#141A24` | Cards, prompt box, panels |
| `bg-glow` | `#1B2333` | Radial gradient peak (`radial-gradient(ellipse 90% 60% at 50% -10%, #1B2333 0%, #141A24 45%, #0E1116 100%)`) |
| `bg-elevated` | `#1F2736` / `#1A2130` | Hover row, secondary panel |
| `fg` | `#F2E9D8` | Main text (parchment) |
| `fg-muted` | `#A9A396` | Secondary text, descriptions |
| `fg-subtle` | `#7F7B72` | Placeholder, labels, tertiary |
| `fg-dim` | `#D9D0BF` | Emphasized secondary text |
| `accent` | `#E0A64B` | Primary action, heading accent, focus ring |
| `accent-hover` | `#F2C676` | Link/button hover |
| `accent-deep` | `#B77A2C` / `#C68E3A` | Logo gradient bottom end, pressed state |
| `arcane` | `#3FB9A8` | AI/"thinking" state, step tracker, shimmer |
| `danger` | `#E46056` | Error, removed card in diff |
| `success` | `#4FBF7F` | Copied toast, added card in diff |
| `info` | `#5B8DEF` | Info badge |
| `mana` / `mana-deep` | `#5B8DEF` / `#2F4FB0` | Mana crystal gradient, mana curve bars |
| `dust` | `#C7B9E6` | Dust gem |
| `archetype` | `#AEB7F0` | Archetype badge text (background: class-shaman 18%) |
| `toast` | `#1E2A2A` | "Copied" toast background |

Translucent layers (borders and surfaces), all based on `fg`:
`rgba(242,233,216,.03)` background texture · `.08` thin divider · `.10` / `.12` card border · `.15` hover border · `.20` active border.
Accent glows: `rgba(224,166,75,.35)` selection, `.5` focus ring; `rgba(63,185,168,.12/.15/.3)` arcane fill/border.
Shadow: `rgba(0,0,0,.35)`; glass panel: `rgba(20,26,36,.6)` + blur.

### Class colors (chip, underline, card row accent)

| Class | Hex |
|---|---|
| Mage | `#69CCF0` |
| Warrior | `#C9433F` |
| Hunter | `#8BC34A` |
| Paladin | `#F5C542` |
| Priest | `#D8D8E8` |
| Rogue | `#8A8A94` |
| Shaman | `#5B6DD6` |
| Warlock | `#9482C9` |
| Druid | `#A2673F` |
| Demon Hunter | `#2FBF71` |
| Death Knight | `#3C9AB0` |

### Rarity (rarity gem)

common `#9D9D9D` · rare `#4C8DF5` · epic `#A335EE` · legendary `#FF8000`
Dust: common 40 · rare 100 · epic 400 · legendary 1600

## Typography

| Token | Font | Where |
|---|---|---|
| `font-display` | **Spectral** (Georgia fallback) — 500/600, italic 400 | H1 (64px/1.05, -0.01em), deck name, logo text (20px/600) |
| `font-body` | **Manrope** — 400/500/600/700 | All body text and UI |
| `font-mono` | **JetBrains Mono** — 400/500 | Deck code block, mana/stat numbers |

Google Fonts: `Spectral:ital,wght@0,400;0,500;0,600;1,400`, `Manrope:wght@400;500;600;700`, `JetBrains+Mono:wght@400;500`. Loaded in Next.js via `next/font/google`.

Size scale (px): 10 · 11 · 12 · 13 (most common, card row) · 14 · 15 (body base, line-height 1.55) · 16 · 18 (subheading) · 20 · 22 · 24 · 26 · 28 · 64 (hero).
Eyebrow/label: 12px, `letter-spacing: .14em`, uppercase, 600–700.

## Corner radius

`pill` 999px (chip, button, input) · `full` 50% (gem, avatar) · `xl` 16px (main panels, prompt box) · `lg` 12–14px (cards, modal) · `md` 10px (rows, code block) · `sm` 8px (logo, small boxes) · `xs` 2–4px.
Chat bubble: `16px 16px 16px 4px`.

## Spacing and layout

Container `max-width: 1440px`, horizontal padding 48px. Landing content `max-width: 860px`, top spacing 72px. Vertical rhythm 14 / 18 / 28 / 36 / 40px.
Prompt box: `bg-raised`, 1px `.12` border, radius 16, padding `18px 18px 14px`.

## Effects

- Background texture: SVG `feTurbulence` fractalNoise, `opacity: .07`, `pointer-events:none` across the whole page.
- `df-shimmer`: background-position 200% → -200% (in the arcane step tracker).
- `df-pulse`: `box-shadow 0 0 0 0 rgba(63,185,168,.45)` → `0 0 0 6px` transparent (active step dot).
- `df-rise`: opacity 0 / translateY(8px) → 1 / 0 (entrance of result cards).
- Focus: `outline: 2px solid accent; outline-offset: 2px`. Selection: `rgba(224,166,75,.35)`.
- Theme: dark only. `prefers-color-scheme` is not observed.
