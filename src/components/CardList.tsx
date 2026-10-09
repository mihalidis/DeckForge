"use client";
import { useState } from "react";
import { en } from "@/i18n/en";
import type { DeckCard } from "@/lib/deck/types";
import { CLASS_COLOR_VAR, RARITY_COLOR_VAR } from "@/lib/ui/classes";
import type { ClassSlug } from "@/lib/deck/rules";
import { ManaGem } from "./ManaGem";

interface Props { cards: DeckCard[]; classSlug: string; view: "list" | "grid"; onView: (v: "list" | "grid") => void }

function groupByMana(cards: DeckCard[]) {
  const map = new Map<number, DeckCard[]>();
  for (const c of cards) { const k = Math.min(c.cost, 7); map.set(k, [...(map.get(k) ?? []), c]); }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

/* eslint-disable @next/next/no-img-element -- Blizzard CDN images; next/image optimization not needed */
export function CardList({ cards, classSlug, view, onView }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const classColor = CLASS_COLOR_VAR[classSlug as ClassSlug];
  const total = cards.reduce((s, c) => s + c.count, 0);
  const seg = (active: boolean) => `rounded-full border-0 px-3.5 py-[5px] text-[13px] font-semibold ${active ? "text-parchment" : "text-subtle"}`;
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-[22px] font-medium">
          {en.result.cardsTitle} <span className="font-sans text-base tabular-nums text-subtle">{total}</span>
        </div>
        <div className="inline-flex gap-0.5 rounded-full border border-line p-[3px]">
          <button type="button" onClick={() => onView("list")} className={seg(view === "list")} style={{ background: view === "list" ? "color-mix(in srgb, var(--color-parchment) 10%, transparent)" : "transparent" }}>{en.result.list}</button>
          <button type="button" onClick={() => onView("grid")} className={seg(view === "grid")} style={{ background: view === "grid" ? "color-mix(in srgb, var(--color-parchment) 10%, transparent)" : "transparent" }}>{en.result.grid}</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="flex flex-col gap-2.5">
          {groupByMana(cards).map(([k, group]) => (
            <div key={k} className="rounded-[14px] border border-hair" style={{ background: "color-mix(in srgb, var(--color-ink-raised) 70%, transparent)" }}>
              <div className="flex items-center gap-2.5 border-b px-3.5 py-2 text-[11px] uppercase tracking-[.08em] text-subtle" style={{ borderColor: "color-mix(in srgb, var(--color-parchment) 6%, transparent)" }}>
                <span>{en.result.manaGroup(k)}</span><span className="flex-1" /><span className="tabular-nums">{en.result.cardsCount(group.reduce((s, c) => s + c.count, 0))}</span>
              </div>
              {group.map((card) => (
                <div
                  key={card.dbfId}
                  onMouseEnter={() => setHover(card.dbfId)}
                  onMouseLeave={() => setHover(null)}
                  className="relative flex items-center gap-3 border-l-[3px] px-3.5 py-[9px] hover:bg-[color-mix(in_srgb,var(--color-parchment)_4%,transparent)]"
                  style={{ borderLeftColor: RARITY_COLOR_VAR[card.rarity] }}
                >
                  <ManaGem cost={card.cost} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{card.name}</span>
                  <span className="hidden text-xs capitalize text-subtle sm:inline">{card.type}</span>
                  {card.classSlug !== "neutral" && <span className="block h-1.5 w-1.5 rounded-full" style={{ background: classColor }} />}
                  <span className="block h-2.5 w-2.5 rounded-full" style={{ background: RARITY_COLOR_VAR[card.rarity], boxShadow: "0 0 0 2px rgb(0 0 0 / .35) inset" }} />
                  <span className={`w-[30px] text-right text-[13px] font-semibold tabular-nums ${card.count === 2 ? "text-parchment" : "text-muted"}`}>×{card.count}</span>
                  {hover === card.dbfId && (
                    <div className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 z-10 hidden w-[200px] -translate-y-1/2 overflow-hidden rounded-lg border border-line-hover bg-ink-elevated shadow-[0_20px_50px_rgb(0_0_0/.5)] animate-rise lg:block">
                      <img src={card.image} alt={card.name} width={200} height={280} className="block w-full" loading="lazy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(132px,1fr))]">
          {cards.map((card) => (
            <div key={card.dbfId} className="relative overflow-hidden rounded-lg border border-line bg-ink-elevated hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]">
              <img src={card.image} alt={card.name} className="block aspect-[3/4] w-full object-cover" loading="lazy" />
              <span className="absolute right-2 top-2 rounded-full px-[7px] py-0.5 text-[11px] font-bold" style={{ background: "color-mix(in srgb, var(--color-ink) 85%, transparent)", color: card.count === 2 ? "var(--color-parchment)" : "var(--color-muted)" }}>×{card.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
