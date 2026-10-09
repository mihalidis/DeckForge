"use client";
import { useState } from "react";
import { en } from "@/i18n/en";
import type { DeckResult, Swap } from "@/lib/deck/types";

export function WhyPanel({ deck, onSwap, applied, busy }: { deck: DeckResult; onSwap?: (sw: Swap) => void; applied?: Set<number>; busy?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ plan: true, syn: true, mull: false, swaps: true });
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="block h-2 w-2 rounded-full bg-arcane" />
        <div className="font-display text-[22px] font-medium">{en.result.why}</div>
      </div>
      <div className="flex flex-col gap-2">
        {deck.sections.map((sec) => (
          <div key={sec.id} className="overflow-hidden rounded-[14px] border border-hair" style={{ background: "color-mix(in srgb, var(--color-ink-raised) 70%, transparent)" }}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}
              className="flex w-full items-center gap-2.5 px-4 py-[13px] text-left text-[15px] font-semibold text-parchment hover:bg-[color-mix(in_srgb,var(--color-parchment)_3%,transparent)]"
            >
              <span className="flex-1">{sec.title}</span>
              <span className="text-xs text-subtle transition-transform" style={{ transform: open[sec.id] ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {open[sec.id] && (
              <div className="flex flex-col gap-2.5 px-4 pb-4">
                {sec.paras.map((p, i) => <p key={i} className="text-[14.5px] text-parchment-dim text-pretty">{p}</p>)}
                {sec.id === "swaps" && deck.swaps.map((sw) => (
                  <div key={`${sw.out.dbfId}-${sw.in.dbfId}`} className="grid items-center gap-2.5 rounded-md border border-hair bg-ink px-3 py-2.5 [grid-template-columns:1fr_auto_1fr_auto]">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold">{sw.out.name}</span>
                      <span className="text-xs text-subtle">{sw.why}</span>
                    </div>
                    <span className="text-subtle">→</span>
                    <div className="text-sm font-semibold">{sw.in.name}</div>
                    {applied?.has(sw.out.dbfId) ? (
                      <span className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold text-success">{en.result.swapped}</span>
                    ) : (
                      <button type="button" onClick={() => onSwap?.(sw)} disabled={!onSwap || busy} className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-bold text-parchment hover:border-accent disabled:opacity-50">{en.result.swap}</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
