"use client";
import Link from "next/link";
import { useState } from "react";
import { en } from "@/i18n/en";
import type { DeckCore } from "@/lib/deck/types";
import type { DeckResult } from "@/lib/deck/types";
import { CardList } from "./CardList";
import { DeckHeader } from "./DeckHeader";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { StickyCopyBar } from "./StickyCopyBar";

/** Paylaşılan deste görünümü: "why" bölümü yok (LLM çıktısı saklanmıyor). */
export function SharedDeck({ deck: core }: { deck: DeckCore }) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [name, setName] = useState(core.name);
  const deck: DeckResult = { ...core, sections: [], swaps: [], verifiedByBlizzard: false };
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pb-24 sm:px-12 sm:pb-20">
        <section className="mt-5 grid items-start gap-6 lg:[grid-template-areas:'head_cards'] lg:[grid-template-columns:minmax(300px,340px)_minmax(0,1fr)]">
          <div className="lg:[grid-area:head]">
            <DeckHeader deck={deck} name={name} onNameChange={setName} />
            <p className="mt-3 text-xs text-subtle">
              {en.share.hint} <Link href="/" className="text-accent">{en.share.forgeYourOwn}</Link>
            </p>
          </div>
          <div className="lg:[grid-area:cards]"><CardList cards={deck.cards} classSlug={deck.classSlug} view={view} onView={setView} /></div>
          <StickyCopyBar deck={deck} />
        </section>
      </main>
      <Footer />
    </>
  );
}
