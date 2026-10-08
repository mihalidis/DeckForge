// Blizzard'dan metadata + Standard koleksiyon kartlarını çekip data/ altına yazar.
// Çalıştırma: npm run sync:cards   (.env.local'den BLIZZARD_* okur)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { blizzard } from "../src/lib/blizzard/client";
import {
  buildLookups,
  normalizeCard,
  standardSetSlugs,
} from "../src/lib/cards/normalize";
import type { CardDataset } from "../src/lib/cards/types";

const DATA_DIR = path.join(process.cwd(), "data");

async function main() {
  const t0 = Date.now();
  console.log("→ metadata çekiliyor…");
  const meta = await blizzard.metadata();
  const standardSets = standardSetSlugs(meta);
  console.log(`  Standard setleri (${standardSets.length}): ${standardSets.join(", ")}`);

  console.log("→ Standard koleksiyon kartları çekiliyor…");
  const raw = await blizzard.searchAllCards(
    { set: "standard", collectible: "1", gameMode: "constructed", pageSize: 500, sort: "manaCost:asc" },
    (page, pageCount, got) => console.log(`  sayfa ${page}/${pageCount} — toplam ${got}`),
  );

  const L = buildLookups(meta);
  const cards = raw
    .filter((c) => c.collectible === 1)
    .map((c) => normalizeCard(c, L))
    .sort((a, b) => a.dbfId - b.dbfId);

  // Standard filtresi set bazında bir kez daha (API'nin set=standard'ına ek güvence)
  const stdSet = new Set(standardSets);
  const dropped = cards.filter((c) => !stdSet.has(c.set));
  const kept = cards.filter((c) => stdSet.has(c.set));
  if (dropped.length) {
    console.warn(`  ! ${dropped.length} kart setGroups.standard dışında, atıldı: ${Array.from(new Set(dropped.map((c) => c.set))).join(", ")}`);
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
  // İlk 3 ham kartı incelemek için (tip doğrulama)
  await writeFile(path.join(DATA_DIR, "sample.raw.json"), JSON.stringify(raw.slice(0, 3), null, 2));

  const byClass = new Map<string, number>();
  for (const c of kept) byClass.set(c.classSlug, (byClass.get(c.classSlug) ?? 0) + 1);
  console.log("\n✓ Tamam");
  console.log(`  kart: ${kept.length}  süre: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("  sınıf dağılımı:", Object.fromEntries(Array.from(byClass).sort()));
  console.log(`  dosyalar: data/metadata.json, data/cards.standard.json, data/sample.raw.json`);
}

main().catch((err) => {
  console.error("✗ sync başarısız:", err instanceof Error ? err.message : err);
  process.exit(1);
});
