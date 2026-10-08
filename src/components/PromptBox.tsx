"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { en } from "@/i18n/en";
import { CLASS_LIST, tint } from "@/lib/ui/classes";
import type { ClassSlug } from "@/lib/deck/rules";

interface Props {
  value: string;
  onChange: (v: string) => void;
  classSlug: ClassSlug | null;
  onClassChange: (c: ClassSlug | null) => void;
  onForge: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PromptBox({ value, onChange, classSlug, onClassChange, onForge, disabled, autoFocus }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!disabled && value.trim()) onForge(); }
  };

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-ink-raised px-[18px] pb-3.5 pt-[18px] shadow-[0_20px_60px_rgb(0_0_0/0.35)] focus-within:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)]">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        rows={3}
        maxLength={500}
        placeholder={en.landing.placeholder}
        disabled={disabled}
        className="w-full resize-none border-0 bg-transparent px-1.5 py-1 text-lg leading-normal text-parchment focus-visible:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2.5 border-t border-hair pt-3.5">
        <div className="inline-flex gap-0.5 rounded-full border border-line p-[3px]">
          <span className="rounded-full px-3.5 py-[5px] text-[13px] font-semibold" style={{ background: "color-mix(in srgb, var(--color-parchment) 10%, transparent)" }}>{en.landing.formatStandard}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[5px] text-[13px] text-subtle">
            {en.landing.formatWild}
            <span className="rounded-full border border-line-hover px-1.5 py-px text-[10px] uppercase tracking-[.08em]">{en.landing.soon}</span>
          </span>
        </div>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {CLASS_LIST.map((c) => {
            const active = classSlug === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => onClassChange(active ? null : c.slug)}
                className="inline-flex items-center gap-1.5 rounded-full border px-[11px] py-[5px] text-[12.5px] font-semibold transition-colors hover:border-[color-mix(in_srgb,var(--color-parchment)_35%,transparent)]"
                style={{
                  borderColor: active ? c.color : "color-mix(in srgb, var(--color-parchment) 12%, transparent)",
                  background: active ? tint(c.color, 13) : "transparent",
                  color: active ? "var(--color-parchment)" : "var(--color-muted)",
                }}
              >
                <span className="block h-2 w-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onForge}
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-[22px] py-[11px] text-[15px] font-bold text-ink transition-colors hover:bg-accent-hover active:bg-accent-mid disabled:opacity-50"
        >
          {en.landing.forge}
          <span className="block h-2 w-2 rotate-45 rounded-[1px] bg-ink" />
        </button>
      </div>
    </div>
  );
}
