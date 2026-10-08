"use client";
import { en } from "@/i18n/en";
import type { DeckResult } from "@/lib/deck/types";
import { CopyIcon, CopyToast, useCopy } from "./CopyButton";

/** Mobil: ekranın altına yapışık kopyala çubuğu (design/screens.md → mobil). */
export function StickyCopyBar({ deck }: { deck: DeckResult }) {
  const { copied, copy } = useCopy(deck.clipboardText);
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hair bg-glass p-3 lg:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <div className="relative">
        <button type="button" onClick={copy} className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-4 py-3 text-[15px] font-bold text-ink active:bg-accent-mid">
          <CopyIcon />{en.result.copy}
        </button>
        <div className="absolute inset-x-0 -top-14"><CopyToast show={copied} /></div>
      </div>
    </div>
  );
}
