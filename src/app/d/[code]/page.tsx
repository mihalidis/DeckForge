// /d/[code] — paylaşım linki. Kodu çözer, yerel kart verisiyle desteyi kurar; LLM ve DB yok.
// Cache Components: sayfanın statik kabuğu Suspense sınırı; deste istek anında (fs) kurulur.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { loadDataset } from "@/lib/cards/repo";
import { assembleDeck, fromUrlCode } from "@/lib/deck/assemble";
import { decodeDeck } from "@/lib/deck/deckstring";
import { CLASS_NAMES, isClassSlug } from "@/lib/deck/rules";
import { SharedDeck } from "@/components/SharedDeck";

async function deckFromCode(code: string) {
  await connection();
  try {
    const d = decodeDeck(fromUrlCode(code));
    const ds = await loadDataset();
    const cls = ds.classes.find((c) => c.heroDbfId === d.heroes[0]);
    if (!cls || !isClassSlug(cls.slug)) return null;
    return await assembleDeck({ spec: { classSlug: cls.slug, format: "standard", cards: d.cards }, name: `Shared ${CLASS_NAMES[cls.slug]}` });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/d/[code]">): Promise<Metadata> {
  const { code } = await params;
  const deck = await deckFromCode(code);
  if (!deck) return { title: "Deck not found — DeckForge" };
  return {
    title: `${deck.name} — DeckForge`,
    description: `${deck.className} · ${deck.cardCount} cards · ${deck.dust.toLocaleString("en-US")} dust. Copy the code and paste it into Hearthstone.`,
  };
}

async function DeckLoader({ params }: { params: PageProps<"/d/[code]">["params"] }) {
  const { code } = await params;
  const deck = await deckFromCode(code);
  if (!deck) notFound();
  return <SharedDeck deck={deck} />;
}

export default function SharedDeckPage({ params }: PageProps<"/d/[code]">) {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-[1440px] px-4 py-16 text-sm text-subtle sm:px-12">Loading deck…</div>}>
      <DeckLoader params={params} />
    </Suspense>
  );
}
