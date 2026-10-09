"use client";
import { en } from "@/i18n/en";
import type { DeckResult } from "@/lib/deck/types";
import { CLASS_COLOR_VAR, formatDust, tint } from "@/lib/ui/classes";
import type { ClassSlug } from "@/lib/deck/rules";
import { CopyIcon, CopyToast, useCopy } from "./CopyButton";
import { ManaCurve } from "./ManaCurve";
import { Pill } from "./Pill";

interface Props {
  deck: DeckResult;
  name: string;
  onNameChange: (n: string) => void;
  onRegenerate?: () => void;
  onTweak?: () => void;
  onShare?: () => void;
  shareLabel?: string;
}

/** Tasarım 1c: sol sabit panel. Mobilde akışta kalır; kopyala butonu ayrıca StickyCopyBar'da. */
export function DeckHeader({ deck, name, onNameChange, onRegenerate, onTweak, onShare, shareLabel }: Props) {
  const color = CLASS_COLOR_VAR[deck.classSlug as ClassSlug];
  const avg = (deck.cards.reduce((s, c) => s + c.cost * c.count, 0) / deck.cardCount).toFixed(1);
  const { copied, copy } = useCopy(deck.clipboardText);
  return (
    <aside className="flex flex-col gap-[18px] rounded-xl border border-hair bg-ink-raised p-[22px] lg:sticky lg:top-5">
      <div className="flex items-start gap-3.5">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-lg font-display text-[22px] font-semibold text-ink" style={{ background: color }}>
          {deck.className[0]}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value.slice(0, 24))}
            aria-label="Deck name"
            className="w-full border-0 border-b border-dashed bg-transparent pb-[3px] font-display text-[22px] font-medium leading-tight text-parchment focus:border-accent"
            style={{ borderBottomColor: "color-mix(in srgb, var(--color-parchment) 20%, transparent)" }}
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-line-hover px-[9px] py-[3px] text-[11px] uppercase tracking-[.06em] text-muted">{en.result.standard}</span>
            {deck.archetype !== "unspecified" && (
              <span className="rounded-full px-[9px] py-[3px] text-[11px] uppercase tracking-[.06em] text-archetype" style={{ background: tint("var(--color-class-shaman)", 18) }}>{deck.archetype}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-[18px] tabular-nums">
        <Stat label={en.result.dust}><span className="block h-[9px] w-[9px] rotate-45 rounded-[1px] bg-dust" />{formatDust(deck.dust)}</Stat>
        <Stat label={en.result.cards}>{deck.cardCount}/30</Stat>
        <Stat label={en.result.avgCost}>{avg}</Stat>
      </div>

      <div className="relative flex flex-col gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-accent px-[18px] py-3.5 text-base font-bold text-ink transition-colors hover:bg-accent-hover active:bg-accent-mid"
        >
          <CopyIcon />
          {en.result.copy}
        </button>
        <CopyToast show={copied} />
      </div>

      <details className="rounded-md border border-hair bg-ink">
        <summary className="flex cursor-pointer list-none justify-between px-3 py-[9px] text-xs tracking-[.04em] text-muted">
          {en.result.deckCode}<span>▾</span>
        </summary>
        <div className="break-all px-3 pb-3 font-mono text-[11.5px] leading-normal text-muted">{deck.deckstring}</div>
      </details>

      <ManaCurve cards={deck.cards} />

      <div className="flex gap-2">
        {onRegenerate && <Pill onClick={onRegenerate} className="flex-1">{en.result.regenerate}</Pill>}
        {onTweak && <Pill onClick={onTweak} className="flex-1">{en.result.tweak}</Pill>}
        <Pill onClick={onShare} disabled={!onShare} className="flex-1">{shareLabel ?? en.result.share}</Pill>
      </div>
      <div className="text-[11px] text-subtle">{deck.verifiedByBlizzard ? `✓ ${en.result.verified}` : en.result.unverified}</div>
    </aside>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[.08em] text-subtle">{label}</div>
      <div className="flex items-center gap-1.5 text-xl font-semibold">{children}</div>
    </div>
  );
}
