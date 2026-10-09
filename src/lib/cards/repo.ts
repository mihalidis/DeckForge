// Reads from the local card cache. Server-side (fs). Loaded into memory on first call.
// Clear error if data is missing: run `npm run sync:cards`.

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CardDataset, CardRecord } from "./types";

export const DATA_DIR = path.join(process.cwd(), "data");
export const CARDS_FILE = path.join(DATA_DIR, "cards.standard.json");

let datasetPromise: Promise<CardDataset> | null = null;

export function loadDataset(): Promise<CardDataset> {
  if (!datasetPromise) {
    datasetPromise = readFile(CARDS_FILE, "utf8")
      .then((raw) => JSON.parse(raw) as CardDataset)
      .catch((err) => {
        datasetPromise = null;
        throw new Error(
          `Could not read card data (${CARDS_FILE}). Run \`npm run sync:cards\` first. ${String(err)}`,
        );
      });
  }
  return datasetPromise;
}

/** For reloading in tests / after sync. */
export function resetDataset() {
  datasetPromise = null;
}

export async function getCard(dbfId: number): Promise<CardRecord | undefined> {
  const ds = await loadDataset();
  return ds.cards.find((c) => c.dbfId === dbfId);
}

export async function getClassInfo(classSlug: string) {
  const ds = await loadDataset();
  return ds.classes.find((c) => c.slug === classSlug);
}

/** Class + neutral + dual-class cards that include this class (Standard, collectible). */
export async function getStandardPool(classSlug: string): Promise<CardRecord[]> {
  const ds = await loadDataset();
  return ds.cards.filter(
    (c) =>
      c.classSlug === classSlug ||
      c.classSlug === "neutral" ||
      c.multiClass.includes(classSlug),
  );
}

export interface SearchFilter {
  q?: string; // search in name/text (case-insensitive)
  classSlug?: string; // "shaman" → shaman + neutral + dual
  cost?: number; // 10 = 10 and above
  type?: string;
  rarity?: string;
  minionType?: string;
  keyword?: string;
  limit?: number;
}

export async function searchCards(f: SearchFilter): Promise<CardRecord[]> {
  const pool = f.classSlug ? await getStandardPool(f.classSlug) : (await loadDataset()).cards;
  const q = f.q?.trim().toLowerCase();
  const out = pool.filter((c) => {
    if (q && !(c.name.toLowerCase().includes(q) || c.text.toLowerCase().includes(q))) return false;
    if (f.cost !== undefined && (f.cost >= 10 ? c.cost < 10 : c.cost !== f.cost)) return false;
    if (f.type && c.type !== f.type) return false;
    if (f.rarity && c.rarity !== f.rarity) return false;
    if (f.minionType && !c.minionTypes.includes(f.minionType)) return false;
    if (f.keyword && !c.keywords.includes(f.keyword)) return false;
    return true;
  });
  out.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  return out.slice(0, f.limit ?? 50);
}
