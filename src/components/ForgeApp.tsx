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
import { RefineBox } from "./RefineBox";
import { StepTracker } from "./StepTracker";
import { StickyCopyBar } from "./StickyCopyBar";
import { WhyPanel } from "./WhyPanel";

export function ForgeApp() {
  const [prompt, setPrompt] = useState("");
  const [classSlug, setClassSlug] = useState<ClassSlug | null>(null);
  const [deckName, setDeckName] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const { phase, steps, deck, error, elapsedMs, forge, cancel, reset } = useForge();
  const refineRef = useRef<HTMLInputElement>(null);

  // Sınıf chip'i prompt'a eklenir ki LLM niyeti kesin okusun; chip yoksa prompt olduğu gibi gider.
  const fullPrompt = () => (classSlug && !prompt.toLowerCase().includes(classSlug) ? `${prompt.trim()} (class: ${classSlug})` : prompt.trim());
  const run = () => { if (prompt.trim()) { setDeckName(""); void forge(fullPrompt()); } };
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
              <DeckHeader deck={deck} name={deckName || deck.name} onNameChange={setDeckName} onRegenerate={run} onTweak={() => refineRef.current?.focus()} />
            </div>
            <div className="lg:[grid-area:cards]"><CardList cards={deck.cards} classSlug={deck.classSlug} view={view} onView={setView} /></div>
            <div className="lg:[grid-area:why]"><WhyPanel deck={deck} /></div>
            <div className="lg:[grid-area:thread]"><RefineBox ref={refineRef} /></div>
            <StickyCopyBar deck={deck} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
