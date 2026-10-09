// POST /api/refine  { classSlug, name, archetype?, cards:[{dbfId,count}], instruction, history? }
// → { reply, deck: DeckCore, diff }   (LLM düzenler → validate/repair → encode)

import { NextResponse } from "next/server";
import { toCompactBlock } from "@/lib/cards/compact";
import { refineDeck } from "@/lib/ai/refine";
import { mechanicalRepair } from "@/lib/ai/repair";
import { isQuotaError, isTransientLlmError } from "@/lib/ai/provider";
import { assembleDeck, AssembleError, diffDecks, poolFor } from "@/lib/deck/assemble";
import type { Archetype, DeckCard, DeckSpec } from "@/lib/deck/types";
import { validateDeck } from "@/lib/deck/validate";
import { clientIp, FORGE_LIMIT, rateLimit } from "@/lib/ratelimit";

interface Body {
  classSlug: string;
  name: string;
  archetype?: Archetype;
  cards: { dbfId: number; count: number }[];
  instruction: string;
  history?: { user: string; reply: string }[];
}

export async function POST(req: Request) {
  const rl = rateLimit(`refine:${clientIp(req)}`, FORGE_LIMIT.limit, FORGE_LIMIT.windowMs);
  if (!rl.ok) return NextResponse.json({ kind: "busy", message: `Too many requests. Try again in ${rl.retryAfterSec}s.` }, { status: 429 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ kind: "api", message: "Bad request" }, { status: 400 }); }
  const instruction = (body.instruction ?? "").trim();
  if (!instruction || instruction.length > 300 || !Array.isArray(body.cards)) {
    return NextResponse.json({ kind: "vague", message: "Tell me what to change (max 300 characters)." }, { status: 400 });
  }

  try {
    const { pool, lookup, classSlug } = await poolFor(body.classSlug);
    const before: DeckCard[] = body.cards
      .map((e) => { const c = lookup(e.dbfId); return c ? { ...c, count: e.count as 1 | 2 } : null; })
      .filter((c): c is DeckCard => !!c);
    const out = await refineDeck({
      classSlug, deckName: body.name, cards: before, instruction, history: body.history ?? [],
      compact: toCompactBlock(pool),
    });

    let spec: DeckSpec = { classSlug, format: "standard", cards: out.cards };
    if (!validateDeck(spec, lookup).ok) {
      // LLM bozduysa mekanik onarım: mevcut desteyi koruyacak şekilde puanla
      const candidates = pool.map((card) => ({ card, score: before.some((b) => b.dbfId === card.dbfId) ? 10 : 0, reasons: [] as string[] }));
      spec = mechanicalRepair(spec, lookup, candidates, []);
    }
    const core = await assembleDeck({ spec, name: body.name, archetype: body.archetype ?? "unspecified" });
    const diff = diffDecks(before, core.cards);
    return NextResponse.json({ reply: out.reply, deck: core, diff });
  } catch (err) {
    if (err instanceof AssembleError) return NextResponse.json({ kind: "invalid", message: err.message }, { status: 422 });
    if (isQuotaError(err) || isTransientLlmError(err)) return NextResponse.json({ kind: "busy", message: "The forge is busy right now. Try again in a minute." }, { status: 503 });
    return NextResponse.json({ kind: "llm", message: (err as Error).message }, { status: 500 });
  }
}
