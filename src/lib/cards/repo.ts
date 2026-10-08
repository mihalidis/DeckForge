// Yerel kart önbelleğinden okuma. Sunucu tarafı (fs). İlk çağrıda belleğe alınır.
// Veri yoksa anlaşılır hata: `npm run sync:cards` çalıştırılmalı.

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
          `Kart verisi okunamadı (${CARDS_FILE}). Önce \`npm run sync:cards\` çalıştır. ${String(err)}`,
        );
      });
  }
  return datasetPromise;
}

/** Testler / sync sonrası yeniden yükleme için. */
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

/** Sınıf + nötr + bu sınıfı içeren dual-class kartlar (Standard, koleksiyon). */
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
  q?: string; // isim/metin içinde arama (küçük/büyük harf duyarsız)
  classSlug?: string; // "shaman" → shaman + neutral + dual
  cost?: number; // 10 = 10 ve üzeri
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
