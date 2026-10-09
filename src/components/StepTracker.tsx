"use client";
import { en } from "@/i18n/en";
import type { StepState } from "@/hooks/useForge";
import { Pill } from "./Pill";

interface Props {
  prompt: string;
  classColor?: string;
  steps: StepState[];
  elapsedMs: number;
  onCancel: () => void;
}

/** Design 1b: prompt summary + arcane step tracker. */
export function StepTracker({ prompt, classColor, steps, elapsedMs, onCancel }: Props) {
  return (
    <section className="mx-auto mt-8 flex w-full max-w-[860px] flex-col gap-5">
      <div className="flex items-center gap-3.5 rounded-[14px] border border-hair bg-ink-raised px-[18px] py-3.5">
        <span className="block h-2 w-2 flex-none rounded-full" style={{ background: classColor ?? "var(--color-subtle)" }} />
        <div className="flex-1 truncate text-[15px] text-parchment">{prompt}</div>
        <span className="hidden text-xs uppercase tracking-[.08em] text-subtle sm:inline">{en.result.standard}</span>
        <Pill onClick={onCancel} className="font-normal text-muted hover:text-parchment">{en.generating.cancel}</Pill>
      </div>

      <div
        className="flex flex-col gap-[22px] rounded-xl border px-7 pb-6 pt-7"
        style={{ borderColor: "color-mix(in srgb, var(--color-arcane) 25%, transparent)", background: "linear-gradient(180deg, color-mix(in srgb, var(--color-arcane) 6%, transparent), color-mix(in srgb, var(--color-ink-raised) 90%, transparent))" }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[28px] font-medium">{en.generating.title}</h2>
          <span className="text-[13px] tabular-nums text-arcane">{(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
        <ol className="flex flex-col gap-1">
          {steps.map((s) => {
            const active = s.status === "active";
            const done = s.status === "done";
            return (
              <li
                key={s.id}
                className="flex items-center gap-3.5 rounded-md px-3 py-[11px]"
                style={{ background: active ? "color-mix(in srgb, var(--color-arcane) 8%, transparent)" : "transparent" }}
              >
                <span
                  className={`grid h-6 w-6 flex-none place-items-center rounded-full border-[1.5px] ${active ? "animate-pulse-arcane" : ""}`}
                  style={{
                    borderColor: done ? "var(--color-arcane)" : active ? "var(--color-arcane)" : "color-mix(in srgb, var(--color-parchment) 15%, transparent)",
                    background: done ? "var(--color-arcane)" : "transparent",
                  }}
                >
                  {done && <span className="block h-1.5 w-2.5 -rotate-45 translate-x-px -translate-y-px border-b-2 border-l-2 border-ink" />}
                  {active && <span className="block h-2 w-2 rounded-full bg-arcane" />}
                </span>
                <span className={`flex-1 text-[15.5px] ${done ? "text-muted" : active ? "font-semibold text-parchment" : "text-subtle"}`}>
                  {en.generating.steps[s.id]}
                  {active && s.detail && <span className="ml-2 text-[12px] font-normal text-arcane">{s.detail}</span>}
                </span>
                {active && (
                  <span
                    className="h-1 w-[120px] rounded-full animate-shimmer"
                    style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-arcane) 15%, transparent), color-mix(in srgb, var(--color-arcane) 70%, transparent), color-mix(in srgb, var(--color-arcane) 15%, transparent))", backgroundSize: "200% 100%" }}
                  />
                )}
                {done && <span className="text-xs tabular-nums text-subtle">{s.detail ?? (s.ms !== undefined ? `${(s.ms / 1000).toFixed(1)}s` : "")}</span>}
              </li>
            );
          })}
        </ol>
        <div className="text-[13px] text-subtle">{en.generating.note}</div>
      </div>
    </section>
  );
}
