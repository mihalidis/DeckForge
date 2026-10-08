import { en } from "@/i18n/en";
import type { DeckCard } from "@/lib/deck/types";

export function curveOf(cards: DeckCard[]): number[] {
  const bins = Array.from({ length: 8 }, () => 0);
  for (const c of cards) bins[Math.min(c.cost, 7)] += c.count;
  return bins;
}

export function ManaCurve({ cards }: { cards: DeckCard[] }) {
  const bins = curveOf(cards);
  const max = Math.max(1, ...bins);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-[.08em] text-subtle">{en.result.manaCurve}</div>
      <div className="grid h-[84px] grid-cols-8 items-end gap-1.5">
        {bins.map((n, i) => (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="text-[11px] tabular-nums text-muted">{n}</span>
            <div
              className="w-full min-h-[3px] rounded-[4px_4px_2px_2px]"
              style={{ height: `${Math.round((n / max) * 100)}%`, background: "linear-gradient(180deg, var(--color-mana), var(--color-mana-deep))" }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1.5 text-center text-[11px] tabular-nums text-subtle">
        {bins.map((_, i) => <span key={i}>{i === 7 ? "7+" : i}</span>)}
      </div>
    </div>
  );
}
