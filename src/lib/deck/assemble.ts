// Doğrulanmış bir DeckSpec'ten DeckResult'ın "mekanik" kısmını üretir: kartlar, dust, deckstring, pano metni, id.
// pipeline (ilk üretim), refine (düzenleme), swap ve /d/[code] (paylaşım) hepsi bunu kullanır.

import { getClassInfo, getStandardPool } from "@/lib/cards/repo";
import type { CardRecord } from "@/lib/cards/types";
import { encodeDeck, shortIdOf, toClipboardText } from "./deckstring";
import { CLASS_NAMES, isClassSlug, type ClassSlug } from "./rules";
import type { Archetype, DeckCard, DeckCore, DeckSpec } from "./types";
export type { DeckCore } from "./types";
import { formatErrors, validateDeck } from "./validate";

export interface AssembleInput {
  spec: DeckSpec;
  name: string;
  archetype?: Archetype;
}


export class AssembleError extends Error {
  constructor(message: string, public readonly errors?: ReturnType<typeof validateDeck>["errors"]) {
    super(message);
    this.name = "AssembleError";
  }
}

/** Havuz + lookup; refine ve swap de kullanır. */
export async function poolFor(classSlug: string) {
  if (!isClassSlug(classSlug)) throw new AssembleError(`Unknown class: ${classSlug}`);
  const pool = await getStandardPool(classSlug);
  const byId = new Map(pool.map((c) => [c.dbfId, c]));
  return { pool, lookup: (id: number): CardRecord | undefined => byId.get(id), classSlug: classSlug as ClassSlug };
}

export async function assembleDeck({ spec, name, archetype = "unspecified" }: AssembleInput): Promise<DeckCore> {
  const { lookup, classSlug } = await poolFor(spec.classSlug);
  const v = validateDeck(spec, lookup);
  if (!v.ok) throw new AssembleError(`Deck is not legal:\n${formatErrors(v.errors)}`, v.errors);
  const cls = await getClassInfo(classSlug);
  if (!cls?.heroDbfId) throw new AssembleError(`No hero id for ${classSlug} in metadata`);

  const deckstring = encodeDeck({ format: "standard", heroDbfId: cls.heroDbfId, cards: spec.cards });
  const cards: DeckCard[] = spec.cards
    .map((e) => ({ ...lookup(e.dbfId)!, count: e.count as 1 | 2 }))
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  const className = CLASS_NAMES[classSlug];
  const deckName = (name || `${archetype} ${className}`).trim().slice(0, 24);
  return {
    id: shortIdOf(deckstring),
    name: deckName,
    classSlug,
    className,
    format: "standard",
    archetype,
    cards,
    cardCount: cards.reduce((s, c) => s + c.count, 0),
    dust: cards.reduce((s, c) => s + c.dust * c.count, 0),
    deckstring,
    clipboardText: toClipboardText({ deckName, className, format: "standard", deckstring, cards }),
  };
}

export { diffDecks, fromUrlCode, toUrlCode, type DeckDiff, type DiffEntry } from "./share";
