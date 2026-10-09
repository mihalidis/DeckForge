// POST /api/deck  { classSlug, name, archetype?, cards:[{dbfId,count}] }  → DeckCore
// LLM yok: kart listesini doğrular, kodlar. Swap ve kart düzenlemeleri için.

import { NextResponse } from "next/server";
import { assembleDeck, AssembleError } from "@/lib/deck/assemble";
import type { Archetype } from "@/lib/deck/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { classSlug: string; name: string; archetype?: Archetype; cards: { dbfId: number; count: number }[] };
    if (!body?.classSlug || !Array.isArray(body.cards)) return NextResponse.json({ kind: "api", message: "Bad request" }, { status: 400 });
    const core = await assembleDeck({ spec: { classSlug: body.classSlug, format: "standard", cards: body.cards }, name: body.name ?? "", archetype: body.archetype });
    return NextResponse.json(core);
  } catch (err) {
    if (err instanceof AssembleError) return NextResponse.json({ kind: "invalid", message: err.message, errors: err.errors }, { status: 422 });
    return NextResponse.json({ kind: "api", message: (err as Error).message }, { status: 500 });
  }
}
