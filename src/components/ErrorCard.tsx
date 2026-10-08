"use client";
import { en } from "@/i18n/en";
import type { ErrorKind } from "@/hooks/useForge";
import { Pill } from "./Pill";

interface Props {
  kind: ErrorKind;
  message: string;
  onRetry: () => void;
  onUseExample: (text: string) => void;
}

/** Tasarım 1f/1g/1h: vague (amber, ?), rotated (amber, !), api/busy/llm/invalid (kırmızı, ×). */
export function ErrorCard({ kind, message, onRetry, onUseExample }: Props) {
  const danger = kind === "api" || kind === "busy" || kind === "llm" || kind === "invalid";
  const glyph = kind === "vague" ? "?" : kind === "rotated" ? "!" : "×";
  const copy = en.errors[kind];
  const colorVar = danger ? "var(--color-danger)" : "var(--color-accent)";
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border px-4 py-3.5 animate-rise"
      style={{ borderColor: `color-mix(in srgb, ${colorVar} ${danger ? 40 : 35}%, transparent)`, background: `color-mix(in srgb, ${colorVar} 8%, transparent)` }}
    >
      <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-[1.5px] text-[13px] font-bold" style={{ borderColor: colorVar, color: colorVar }}>
        {glyph}
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="font-semibold">{copy.title}</div>
        <div className="text-sm text-muted">{kind === "rotated" || kind === "vague" ? message : copy.body}</div>
        {kind === "rotated" && <div className="text-sm text-muted">{copy.body}</div>}
        <div className="mt-1 flex flex-wrap gap-2">
          {kind === "vague" &&
            en.errors.vagueFixes.map((t) => (
              <Pill key={t} onClick={() => onUseExample(t)} className="font-normal">{t}</Pill>
            ))}
          {kind !== "vague" && <Pill onClick={onRetry}>{en.errors.retry}</Pill>}
        </div>
      </div>
    </div>
  );
}
