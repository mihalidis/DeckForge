"use client";
import { forwardRef } from "react";
import { en } from "@/i18n/en";

/** Faz 4'te /api/refine'a bağlanır; şimdilik görünür ama pasif. */
export const RefineBox = forwardRef<HTMLInputElement>(function RefineBox(_, ref) {
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="font-display text-[22px] font-medium">{en.result.refine}</div>
      <div className="flex items-center gap-2.5 rounded-full border border-line bg-ink-raised py-2 pl-[18px] pr-2 focus-within:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]">
        <input ref={ref} placeholder={en.result.refinePlaceholder} disabled className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-parchment" />
        <button type="button" disabled className="rounded-full px-[18px] py-[9px] text-[13.5px] font-bold text-accent opacity-50" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }}>{en.result.refine}</button>
      </div>
      <div className="text-xs text-subtle">{en.result.refineSoon}</div>
    </div>
  );
});
