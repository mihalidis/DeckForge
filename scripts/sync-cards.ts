// Fetches metadata + collectible Standard cards from Blizzard and writes them under data/.
// Run: npm run sync:cards   (reads BLIZZARD_* from .env.local)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { blizzard } from "../src/lib/blizzard/client";
import {
  buildLookups,
  normalizeCard,
  standardSetSlugs,
  upcomingSetSlugs,
} from "../src/lib/cards/normalize";
import type { CardDataset } from "../src/lib/cards/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function main() {
  const t0 = Date.now();
  console.log("→ fetching metadata…");
  const meta = await blizzard.metadata();
  const standardSets = standardSetSlugs(meta);
  const upcoming = upcomingSetSlugs(meta);
  console.log(`  Standard sets (${standardSets.length}): ${standardSets.join(", ")}`);
  if (upcoming.length) console.log(`  Upcoming (not yet playable, excluded): ${upcoming.join(", ")}`);

  console.log("→ fetching collectible Standard cards…");
  const raw = await blizzard.searchAllCards(
    { set: "standard", collectible: "1", gameMode: "constructed", pageSize: 500, sort: "manaCost:asc" },
    (page, pageCount, got) => console.log(`  page ${page}/${pageCount} — total ${got}`),
  );

  const L = buildLookups(meta);
  const cards = raw
    .filter((c) => c.collectible === 1)
    .map((c) => normalizeCard(c, L))
    .sort((a, b) => a.dbfId - b.dbfId);

  // Standard filter once more per set (extra safeguard on top of the API's set=standard)
  const stdSet = new Set(standardSets);
  const dropped = cards.filter((c) => !stdSet.has(c.set));
  const kept = cards.filter((c) => stdSet.has(c.set));
  if (dropped.length) {
    console.log(`  ${dropped.length} cards from non-Standard/upcoming sets, dropped: ${Array.from(new Set(dropped.map((c) => c.set))).join(", ")}`);
  }

  const dataset: CardDataset = {
    syncedAt: new Date().toISOString(),
    format: "standard",
    locale: "en_US",
    region: process.env.BLIZZARD_REGION ?? "eu",
    standardSets,
    classes: meta.classes.map((c) => ({ id: c.id, slug: c.slug, name: c.name, heroDbfId: c.cardId })),
    sets: meta.sets.map((s) => ({ id: s.id, slug: s.slug, name: s.name })),
    keywords: meta.keywords.map((k) => ({ slug: k.slug, name: k.name, text: k.text })),
    cards: kept,
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, "metadata.json"), JSON.stringify(meta, null, 2));
  await writeFile(path.join(DATA_DIR, "cards.standard.json"), JSON.stringify(dataset));
  // First 3 raw cards for inspection (type verification)
  await writeFile(path.join(DATA_DIR, "sample.raw.json"), JSON.stringify(raw.slice(0, 3), null, 2));

  const byClass = new Map<string, number>();
  for (const c of kept) byClass.set(c.classSlug, (byClass.get(c.classSlug) ?? 0) + 1);
  console.log("\n✓ Done");
  console.log(`  cards: ${kept.length}  time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("  by class:", Object.fromEntries(Array.from(byClass).sort()));
  console.log(`  files: data/metadata.json, data/cards.standard.json, data/sample.raw.json`);
}

main().catch((err) => {
  console.error("✗ sync failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
