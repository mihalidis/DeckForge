// Deckstring encode/decode ve oyun formatında panoya kopyalanacak metin.
// Format: docs/API-NOTLARI.md → "Deckstring". Paket: deckstrings (dbfId tabanlı).

import { decode as dsDecode, encode as dsEncode } from "deckstrings";
import type { CardRecord } from "@/lib/cards/types";
import { DECKSTRING_FORMAT } from "./rules";
import type { DeckFormat } from "./types";

export interface EncodeInput {
  format: DeckFormat;
  heroDbfId: number;
  cards: { dbfId: number; count: number }[];
}

export function encodeDeck(input: EncodeInput): string {
  return dsEncode({
    format: DECKSTRING_FORMAT[input.format],
    heroes: [input.heroDbfId],
    cards: [...input.cards]
      .sort((a, b) => a.dbfId - b.dbfId)
      .map((c) => [c.dbfId, c.count] as [number, number]),
    sideboardCards: [],
  });
}

export function decodeDeck(code: string): { format: number; heroes: number[]; cards: { dbfId: number; count: number }[] } {
  const d = dsDecode(code.trim());
  return {
    format: d.format,
    heroes: d.heroes,
    cards: d.cards.map(([dbfId, count]) => ({ dbfId, count })),
  };
}

export interface ClipboardInput {
  deckName: string;
  className: string;
  format: DeckFormat;
  deckstring: string;
  cards: (Pick<CardRecord, "name" | "cost"> & { count: number })[];
}

/** Hearthstone'un kendi "Copy deck" çıktısıyla aynı biçim; oyun # satırlarını yok sayar, ### adı okur. */
export function toClipboardText(i: ClipboardInput): string {
  const lines = [...i.cards]
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
    .map((c) => `# ${c.count}x (${c.cost}) ${c.name}`);
  return [
    `### ${i.deckName}`,
    `# Class: ${i.className}`,
    `# Format: ${i.format === "standard" ? "Standard" : i.format}`,
    "#",
    ...lines,
    "#",
    i.deckstring,
    "#",
    "# To use this deck, copy it to your clipboard and create a new deck in Hearthstone",
  ].join("\n");
}

/** Paylaşım/URL için kısa, kararlı id. */
export function shortIdOf(deckstring: string): string {
  let h = 2166136261;
  for (let i = 0; i < deckstring.length; i++) {
    h ^= deckstring.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).padStart(7, "0");
}
