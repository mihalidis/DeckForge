# DeckForge tasarım token'ları

Kaynak: `export/DeckForge.dc.html` (Claude Design prototipi, inline stiller). `export/_ds/organic-*` klasörü Design'ın varsayılan "Organic" sistem iskeletidir, **bu projede kullanılmıyor** (açık krem tema; bizim tasarım koyu). Yok sayılır.

Faz 3'te bu dosya `tailwind.config.ts` → `theme.extend` ve `app/globals.css` → `:root` değişkenlerinin tek kaynağıdır.

## Renkler

| Token | Hex | Kullanım (prototipteki rolü) |
|---|---|---|
| `bg` | `#0E1116` | Sayfa zemini (en koyu) |
| `bg-raised` | `#141A24` | Kartlar, prompt kutusu, paneller |
| `bg-glow` | `#1B2333` | Radial gradient tepe noktası (`radial-gradient(ellipse 90% 60% at 50% -10%, #1B2333 0%, #141A24 45%, #0E1116 100%)`) |
| `bg-elevated` | `#1F2736` / `#1A2130` | Hover satırı, ikincil panel |
| `fg` | `#F2E9D8` | Ana metin (parşömen) |
| `fg-muted` | `#A9A396` | İkincil metin, açıklamalar |
| `fg-subtle` | `#7F7B72` | Placeholder, etiketler, üçüncül |
| `fg-dim` | `#D9D0BF` | Vurgulu ikincil metin |
| `accent` | `#E0A64B` | Birincil aksiyon, başlık vurgusu, focus ring |
| `accent-hover` | `#F2C676` | Link/buton hover |
| `accent-deep` | `#B77A2C` / `#C68E3A` | Logo gradient alt ucu, basılı durum |
| `arcane` | `#3FB9A8` | AI/"düşünüyor" durumu, adım izleyici, shimmer |
| `danger` | `#E46056` | Hata, diff'te çıkan kart |
| `success` | `#4FBF7F` | Kopyalandı toast'ı, diff'te giren kart |
| `info` | `#5B8DEF` | Bilgi rozeti |
| `mana` / `mana-deep` | `#5B8DEF` / `#2F4FB0` | Mana kristali gradient'i, mana eğrisi çubukları |
| `dust` | `#C7B9E6` | Dust elması |
| `archetype` | `#AEB7F0` | Arketip rozeti metni (zemin: class-shaman %18) |
| `toast` | `#1E2A2A` | "Copied" toast zemini |

Saydam katmanlar (border ve yüzeyler), hepsi `fg` üzerinden:
`rgba(242,233,216,.03)` zemin dokusu · `.08` ince ayraç · `.10` / `.12` kart kenarlığı · `.15` hover kenarlığı · `.20` aktif kenarlık.
Aksan glow'ları: `rgba(224,166,75,.35)` selection, `.5` focus halkası; `rgba(63,185,168,.12/.15/.3)` arcane dolgu/kenarlık.
Gölge: `rgba(0,0,0,.35)`; cam panel: `rgba(20,26,36,.6)` + blur.

### Sınıf renkleri (chip, alt çizgi, kart satırı aksanı)

| Sınıf | Hex |
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

### Nadirlik (rarity gem)

common `#9D9D9D` · rare `#4C8DF5` · epic `#A335EE` · legendary `#FF8000`
Dust: common 40 · rare 100 · epic 400 · legendary 1600

## Tipografi

| Token | Font | Nerede |
|---|---|---|
| `font-display` | **Spectral** (Georgia fallback) — 500/600, italic 400 | H1 (64px/1.05, -0.01em), deste adı, logo yazısı (20px/600) |
| `font-body` | **Manrope** — 400/500/600/700 | Tüm gövde ve UI |
| `font-mono` | **JetBrains Mono** — 400/500 | Deck kodu bloğu, mana/istatistik sayıları |

Google Fonts: `Spectral:ital,wght@0,400;0,500;0,600;1,400`, `Manrope:wght@400;500;600;700`, `JetBrains+Mono:wght@400;500`. Next.js'te `next/font/google` ile yüklenir.

Boyut ölçeği (px): 10 · 11 · 12 · 13 (en sık, kart satırı) · 14 · 15 (gövde taban, line-height 1.55) · 16 · 18 (alt başlık) · 20 · 22 · 24 · 26 · 28 · 64 (hero).
Eyebrow/etiket: 12px, `letter-spacing: .14em`, uppercase, 600–700.

## Köşe yarıçapı

`pill` 999px (chip, buton, input) · `full` 50% (gem, avatar) · `xl` 16px (ana paneller, prompt kutusu) · `lg` 12–14px (kartlar, modal) · `md` 10px (satırlar, kod bloğu) · `sm` 8px (logo, küçük kutular) · `xs` 2–4px.
Sohbet balonu: `16px 16px 16px 4px`.

## Boşluk ve düzen

Konteyner `max-width: 1440px`, yatay padding 48px. Landing içerik `max-width: 860px`, üst boşluk 72px. Dikey ritim 14 / 18 / 28 / 36 / 40px.
Prompt kutusu: `bg-raised`, 1px `.12` kenarlık, radius 16, padding `18px 18px 14px`.

## Efektler

- Zemin dokusu: SVG `feTurbulence` fractalNoise, `opacity: .07`, tüm sayfada `pointer-events:none`.
- `df-shimmer`: background-position 200% → -200% (arcane adım izleyicide).
- `df-pulse`: `box-shadow 0 0 0 0 rgba(63,185,168,.45)` → `0 0 0 6px` şeffaf (aktif adım noktası).
- `df-rise`: opacity 0 / translateY(8px) → 1 / 0 (sonuç kartlarının girişi).
- Focus: `outline: 2px solid accent; outline-offset: 2px`. Selection: `rgba(224,166,75,.35)`.
- Tema: yalnızca koyu. `prefers-color-scheme` dinlenmez.
