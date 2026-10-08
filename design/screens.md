# Ekran → route → bileşen eşlemesi

Prototip: `export/DeckForge.dc.html` (tarayıcıda aç, tıklanabilir). Tüm ekranları yan yana görmek için `export/DeckForge Screens.dc.html`. Prototipteki `data-screen-label` değerleri aşağıdaki ekran adlarıyla aynı.

| # | Ekran (prototip) | Route | Durum | Ana bileşenler |
|---|---|---|---|---|
| 1a | Landing | `/` | `isLanding` | `Navbar`, `Hero`, `PromptBox` (textarea + örnek chip'ler `EXAMPLES` + `ClassChips` 11 sınıf + format rozeti "Standard" + "Forge deck" butonu), `FeatureCards` ×3, `Footer` |
| 1b | Generating | `/` (aynı sayfa, prompt yukarı çöker) | `isGenerating` | `PromptSummary`, `StepTracker` (`STEPS`: 5 adım, `s.done` / `s.active`, sağda süre/sayaç `elapsed`), arcane shimmer |
| 1c | Deck result — **A: sticky sidebar** | `/deck/[id]` | `isResult && isA` | Sol sabit: `DeckHeader` (sınıf ikonu `classInitial`, düzenlenebilir `deckName`, format, `dust`, `archetype`), `CopyCodeButton` + toast (`copied`), `DeckstringBlock` (katlanır, mono), `ManaCurve` (`curve`, 0–7+), `avgCost`, aksiyonlar (Regenerate `regenerate`, Tweak `focusRefine`, Share). Sağ: `CardList` / `CardGrid` toggle (`isList`/`isGrid`), `WhyTheseCards` accordion (`sections`, `sec.open`), `SwapRow` ×n |
| 1d | Deck result — **B: dashboard** | `/deck/[id]` | `isResult && isB` | Üst şerit `DeckHeaderBar` (kopyala sağ üstte), geniş `CardList`, sağ ray `WhyTheseCards` |
| 1e | Refine thread | `/deck/[id]` altı | `thread.length > 0` | `RefineInput` (`refineText`, `sendRefine`), `ThreadEntry` (kullanıcı balonu `16/16/16/4`, AI yanıtı), `DiffList` (çıkan kırmızı `danger`, giren yeşil `success`, `dustDelta`) |
| 1f | Error: vague | `/` | `errVague` | `ErrorCard` + `vagueFixes` chip'leri ("Tell me a class or a card to build around") |
| 1g | Error: rotated | `/` | `errRotated` | `ErrorCard` + "Standard'da yok" açıklaması + `useRotatedFix` (Wild önerisi / alternatif kart) |
| 1h | Error: API | `/` | `errApi` | `ErrorCard` + `retryApi` butonu |

**Karar (2026-10-08): A — sticky sidebar.** 1d (dashboard) uygulanmayacak; kopyala butonu ve mana eğrisi kaydırırken görünür kalır, mobilde tek sütun + sticky alt bar.

## Prototipteki veri modeli → bizim tipler

Prototip `C(name,cost,rarity,count,type,cls)` ile kart tutuyor. Gerçekte `src/lib/deck/types.ts`:

```ts
type DeckCard = { dbfId: number; name: string; cost: number; rarity: Rarity; count: 1|2; type: CardType; classSlug: string; image: string; cropImage: string };
type DeckResult = { id: string; name: string; classSlug: string; format: 'standard'; cards: DeckCard[]; deckstring: string; clipboardText: string; dust: number; archetype: string; sections: Section[]; swaps: Swap[] };
type Section = { id: 'plan'|'syn'|'mull'|'swaps'; title: string; paras: string[] };
type Swap = { out: DeckCard; in: DeckCard; why: string };
type ThreadEntry = { user: string; reply: string; removed: {dbfId,count}[]; added: {dbfId,count}[]; dustDelta: number };
```

`STEPS` dizisi `app/api/forge` SSE olaylarıyla birebir: `intent` → `retrieve` → `build` → `validate` → `encode`.

## Prototipten alınmayacaklar

- Tüm veri sahte (`BASE_DECK`, `DECKSTRING`, `SECTIONS`); isimler ve kod gerçeği yansıtmaz.
- Inline stiller → Tailwind sınıflarına çevrilir, `tokens.md` üzerinden. Hex kodu doğrudan JSX'e yazılmaz.
- `DCLogic` / `sc-if` / `dc-import` Design'ın çalışma zamanı; Next.js'te karşılığı yok.
- Prototip tek sayfa state makinesi; bizde Landing (`/`) ve Deck (`/deck/[id]`) ayrı route, deste URL ile paylaşılabilir (Faz 4 `/d/[code]` ile birleşebilir).

## Eksik

- Mobil (390px) ekranlar prototipte yok → Faz 3'te `tokens.md`'ye sadık kalarak türetilecek; `TASARIM-PROMPT.md`'deki mobil maddesi geçerli.
- Ekran PNG'leri henüz `screens/` içinde değil (opsiyonel; prototip HTML yeterli).
