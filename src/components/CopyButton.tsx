"use client";
import { useEffect, useRef, useState } from "react";
import { en } from "@/i18n/en";

export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const t = useRef<number | null>(null);
  useEffect(() => () => { if (t.current) window.clearTimeout(t.current); }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* izin yok; yine de geri bildirim ver */ }
    setCopied(true);
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setCopied(false), 2200);
  };
  return { copied, copy };
}

export function CopyToast({ show, align = "left" }: { show: boolean; align?: "left" | "right" }) {
  if (!show) return null;
  return (
    <div
      className={`absolute top-[calc(100%+8px)] z-10 flex items-center gap-2 whitespace-nowrap rounded-md border bg-toast px-3.5 py-2.5 text-[13px] text-parchment animate-rise ${align === "left" ? "left-0 right-0" : "right-0"}`}
      style={{ borderColor: "color-mix(in srgb, var(--color-arcane) 40%, transparent)" }}
    >
      <span className="block h-[5px] w-2 -rotate-45 border-b-2 border-l-2 border-arcane" />
      {en.result.copied}
    </div>
  );
}

export function CopyIcon() {
  return <span className="block h-3.5 w-3 rounded-[3px] border-2 border-ink" style={{ boxShadow: "3px -3px 0 -1px var(--color-accent), 3px -3px 0 1px var(--color-ink)" }} />;
}
