"use client";
import { forwardRef, useState, type KeyboardEvent } from "react";
import { en } from "@/i18n/en";
import type { DeckDiff } from "@/lib/deck/share";
import { formatDust } from "@/lib/ui/classes";

export interface ThreadEntry { user: string; reply: string; diff: DeckDiff }

interface Props {
  thread: ThreadEntry[];
  busy: boolean;
  error: string | null;
  onSend: (instruction: string) => void;
}

/** Design 1e: chat bubbles + out/in diff. */
export const RefineThread = forwardRef<HTMLInputElement, Props>(function RefineThread({ thread, busy, error, onSend }, ref) {
  const [text, setText] = useState("");
  const send = () => { const t = text.trim(); if (t && !busy) { onSend(t); setText(""); } };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { e.preventDefault(); send(); } };
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="font-display text-[22px] font-medium">{en.result.refine}</div>
      {thread.map((t, i) => (
        <div key={i} className="flex flex-col gap-2.5 animate-rise">
          <div className="max-w-[70%] self-end rounded-[16px_16px_4px_16px] border px-4 py-2.5 text-[14.5px]" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)", borderColor: "color-mix(in srgb, var(--color-accent) 30%, transparent)" }}>{t.user}</div>
          <div className="flex max-w-[min(720px,100%)] flex-col gap-3 self-start rounded-bubble border border-hair bg-ink-raised px-[18px] py-4">
            <div className="text-[14.5px] text-parchment-dim text-pretty">{t.reply}</div>
            {(t.diff.removed.length > 0 || t.diff.added.length > 0) && (
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <DiffCol label={en.result.removed} sign="−" colorVar="var(--color-danger)" items={t.diff.removed} strike />
                <DiffCol label={en.result.added} sign="+" colorVar="var(--color-success)" items={t.diff.added} />
              </div>
            )}
            <div className="text-xs text-subtle">
              {en.result.revalidated} · {t.diff.dustDelta === 0 ? en.result.sameDust : `${t.diff.dustDelta > 0 ? "+" : "−"}${formatDust(Math.abs(t.diff.dustDelta))} dust`}
            </div>
          </div>
        </div>
      ))}
      {busy && (
        <div className="flex items-center gap-2.5 self-start rounded-bubble border bg-ink-raised px-4 py-3 text-[13px] text-arcane" style={{ borderColor: "color-mix(in srgb, var(--color-arcane) 30%, transparent)" }}>
          <span className="block h-2 w-2 rounded-full bg-arcane animate-pulse-arcane" />{en.result.refining}
        </div>
      )}
      {error && <div className="text-[13px] text-danger">{error}</div>}
      <div className="flex items-center gap-2.5 rounded-full border border-line bg-ink-raised py-2 pl-[18px] pr-2 focus-within:border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]">
        <input ref={ref} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} maxLength={300} placeholder={en.result.refinePlaceholder} disabled={busy} className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-parchment focus-visible:outline-none" />
        <button type="button" onClick={send} disabled={busy || !text.trim()} className="rounded-full px-[18px] py-[9px] text-[13.5px] font-bold text-accent transition-colors hover:bg-accent hover:text-ink disabled:opacity-50" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }}>{en.result.refine}</button>
      </div>
    </div>
  );
});

function DiffCol({ label, sign, colorVar, items, strike }: { label: string; sign: string; colorVar: string; items: { dbfId: number; name: string; count: number }[]; strike?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] uppercase tracking-[.08em]" style={{ color: colorVar }}>{label}</div>
      {items.length === 0 && <div className="text-xs text-subtle">—</div>}
      {items.map((r) => (
        <div key={r.dbfId} className="flex items-center gap-2 rounded-sm border px-2.5 py-[7px] text-[13.5px]" style={{ background: `color-mix(in srgb, ${colorVar} 8%, transparent)`, borderColor: `color-mix(in srgb, ${colorVar} 25%, transparent)` }}>
          <span className="font-bold" style={{ color: colorVar }}>{sign}</span>
          <span className={`flex-1 ${strike ? "line-through text-parchment-dim" : ""}`}>{r.name}</span>
          <span className="tabular-nums text-subtle">×{r.count}</span>
        </div>
      ))}
    </div>
  );
}
