"use client";
import { useRef, useState } from "react";
import { en } from "@/i18n/en";
import { useForge } from "@/hooks/useForge";
import type { ClassSlug } from "@/lib/deck/rules";
import { CLASS_COLOR_VAR } from "@/lib/ui/classes";
import { CardList } from "./CardList";
import { DeckHeader } from "./DeckHeader";
import { ErrorCard } from "./ErrorCard";
import { FeatureCards } from "./FeatureCards";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { PromptBox } from "./PromptBox";
import { RefineThread, type ThreadEntry } from "./RefineThread";
import { diffDecks, toUrlCode } from "@/lib/deck/share";
import type { DeckCore } from "@/lib/deck/types";
import type { DeckDiff } from "@/lib/deck/share";
import type { Swap } from "@/lib/deck/types";
import { StepTracker } from "./StepTracker";
import { StickyCopyBar } from "./StickyCopyBar";
import { WhyPanel } from "./WhyPanel";

export function ForgeApp() {
  const [prompt, setPrompt] = useState("");
  const [classSlug, setClassSlug] = useState<ClassSlug | null>(null);
  const [deckName, setDeckName] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const { phase, steps, deck, error, elapsedMs, forge, cancel, reset, setDeck } = useForge();
  const refineRef = useRef<HTMLInputElement>(null);
  const [thread, setThread] = useState<ThreadEntry[]>([]);
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [shareLabel, setShareLabel] = useState<string | undefined>(undefined);

  const applyCore = (core: DeckCore) => {
    if (!deck) return;
    setDeck({ ...deck, ...core, name: deckName || core.name, verifiedByBlizzard: false });
  };

  const sendRefine = async (instruction: string) => {
    if (!deck) return;
    setRefining(true); setRefineError(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classSlug: deck.classSlug, name: deckName || deck.name, archetype: deck.archetype, cards: deck.cards.map((c) => ({ dbfId: c.dbfId, count: c.count })), instruction, history: thread.map((t) => ({ user: t.user, reply: t.reply })) }),
      });
      const j = (await res.json()) as { reply: string; deck: DeckCore; diff: DeckDiff } | { kind: string; message: string };
      if (!res.ok || !("deck" in j)) throw new Error("message" in j ? j.message : `HTTP ${res.status}`);
      applyCore(j.deck);
      setThread((t) => [...t, { user: instruction, reply: j.reply, diff: j.diff }]);
    } catch (e) {
      setRefineError((e as Error).message);
    } finally {
      setRefining(false);
    }
  };

  const applySwap = async (sw: Swap) => {
    if (!deck) return;
    setRefining(true); setRefineError(null);
    try {
      // An incoming Legendary may be 1 copy; then only 1 copy of the outgoing card is removed so the total stays 30.
      const inCount = sw.in.rarity === "legendary" ? 1 : sw.out.count;
      const cards: { dbfId: number; count: number }[] = deck.cards
        .map((c) => ({ dbfId: c.dbfId, count: c.dbfId === sw.out.dbfId ? c.count - inCount : c.count }))
        .filter((c) => c.count > 0);
      const existing = cards.find((c) => c.dbfId === sw.in.dbfId);
      if (existing) existing.count = Math.min(2, existing.count + inCount); else cards.push({ dbfId: sw.in.dbfId, count: inCount });
      const res = await fetch("/api/deck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classSlug: deck.classSlug, name: deckName || deck.name, archetype: deck.archetype, cards }) });
      const j = (await res.json()) as DeckCore | { kind: string; message: string };
      if (!res.ok || !("deckstring" in j)) throw new Error("message" in j ? j.message : `HTTP ${res.status}`);
      const before = deck.cards;
      applyCore(j);
      setApplied((a) => new Set(a).add(sw.out.dbfId));
      setThread((t) => [...t, { user: `Swap ${sw.out.name} → ${sw.in.name}`, reply: sw.why, diff: diffDecks(before, j.cards) }]);
    } catch (e) {
      setRefineError((e as Error).message);
    } finally {
      setRefining(false);
    }
  };

  const share = async () => {
    if (!deck) return;
    const url = `${window.location.origin}/d/${toUrlCode(deck.deckstring)}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("Share link:", url); return; }
    setShareLabel(en.result.linkCopied);
    window.setTimeout(() => setShareLabel(undefined), 2000);
  };

  // The class chip is appended to the prompt so the LLM reads the intent unambiguously; without a chip the prompt is sent as is.
  const fullPrompt = () => (classSlug && !prompt.toLowerCase().includes(classSlug) ? `${prompt.trim()} (class: ${classSlug})` : prompt.trim());
  const run = () => { if (prompt.trim()) { setDeckName(""); setThread([]); setApplied(new Set()); setRefineError(null); void forge(fullPrompt()); } };
  const goHome = () => { reset(); window.scrollTo({ top: 0 }); };
  const classColor = classSlug ? CLASS_COLOR_VAR[classSlug] : deck ? CLASS_COLOR_VAR[deck.classSlug as ClassSlug] : undefined;

  return (
    <>
      <Navbar onHome={goHome} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-24 sm:px-12 sm:pb-20">
        {phase === "idle" && (
          <section className="mx-auto mt-10 flex w-full max-w-[860px] flex-col gap-9 sm:mt-[72px]">
            <div className="flex flex-col gap-3.5">
              <div className="text-xs font-semibold uppercase tracking-[.14em] text-muted">{en.landing.eyebrow}</div>
              <h1 className="font-display text-[40px] font-medium leading-[1.05] tracking-[-.01em] text-balance sm:text-[64px]">
                {en.landing.title} <em className="italic text-accent">{en.landing.titleAccent}</em>
              </h1>
              <p className="max-w-[560px] text-lg text-muted text-pretty">{en.landing.subtitle}</p>
            </div>

            <div className="flex flex-col gap-3.5">
              <PromptBox value={prompt} onChange={setPrompt} classSlug={classSlug} onClassChange={setClassSlug} onForge={run} autoFocus />
              {error && <ErrorCard kind={error.kind} message={error.message} onRetry={run} onUseExample={(t) => { setPrompt(t); reset(); }} />}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs text-subtle">{en.landing.try}</span>
                {en.landing.examples.map((t) => (
                  <button key={t} type="button" onClick={() => setPrompt(t)} className="rounded-full border border-line px-3.5 py-[7px] text-[13px] text-parchment-dim hover:border-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] hover:text-parchment" style={{ background: "color-mix(in srgb, var(--color-parchment) 3%, transparent)" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <FeatureCards />
          </section>
        )}

        {phase === "generating" && (
          <StepTracker prompt={prompt} classColor={classColor} steps={steps} elapsedMs={elapsedMs} onCancel={cancel} />
        )}

        {phase === "result" && deck && (
          <section className="mt-5 grid items-start gap-6 lg:[grid-template-areas:'head_cards'_'head_why'_'head_thread'] lg:[grid-template-columns:minmax(300px,340px)_minmax(0,1fr)]">
            <div className="lg:[grid-area:head]">
              <DeckHeader deck={deck} name={deckName || deck.name} onNameChange={setDeckName} onRegenerate={run} onTweak={() => refineRef.current?.focus()} onShare={share} shareLabel={shareLabel} />
            </div>
            <div className="lg:[grid-area:cards]"><CardList cards={deck.cards} classSlug={deck.classSlug} view={view} onView={setView} /></div>
            <div className="lg:[grid-area:why]"><WhyPanel deck={deck} onSwap={applySwap} applied={applied} busy={refining} /></div>
            <div className="lg:[grid-area:thread]"><RefineThread ref={refineRef} thread={thread} busy={refining} error={refineError} onSend={sendRefine} /></div>
            <StickyCopyBar deck={deck} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
