// GET /api/cards?q=shudder&class=shaman&cost=9&type=minion&limit=20
// For UI card previews; the LLM does not use this endpoint (reads directly from the repo).

import { NextResponse } from "next/server";
import { searchCards } from "@/lib/cards/repo";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = u.searchParams;
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  try {
    const cards = await searchCards({
      q: p.get("q") ?? undefined,
      classSlug: p.get("class") ?? undefined,
      cost: num("cost"),
      type: p.get("type") ?? undefined,
      rarity: p.get("rarity") ?? undefined,
      minionType: p.get("minionType") ?? undefined,
      keyword: p.get("keyword") ?? undefined,
      limit: Math.min(num("limit") ?? 50, 200),
    });
    return NextResponse.json({ count: cards.length, cards });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 503 },
    );
  }
}
