// Teşhis: Blizzard API'nin verdiği dbfId'ler HearthstoneJSON (oyun verisinden üretilir) ile uyuşuyor mu?
// Çalıştırma: npm run check:ids   → data/id-report.json + özet
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CardDataset } from "../src/lib/cards/types";

interface HsjCard { dbfId: number; id: string; name: string; set: string; collectible?: boolean; cardClass?: string; classes?: string[]; type?: string }

async function main() {
  const ds = JSON.parse(await readFile(path.join(process.cwd(), "data/cards.standard.json"), "utf8")) as CardDataset;
  const url = "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json";
  console.log("→ HearthstoneJSON indiriliyor…");
  const hsj = (await (await fetch(url)).json()) as HsjCard[];
  const byId = new Map(hsj.map((c) => [c.dbfId, c]));
  const byName = new Map<string, HsjCard[]>();
  for (const c of hsj) byName.set(c.name, [...(byName.get(c.name) ?? []), c]);

  const missing: { dbfId: number; name: string; set: string; alternatives: { dbfId: number; id: string; set: string }[] }[] = [];
  const setMismatch: { dbfId: number; name: string; ourSet: string; hsjSet: string; hsjId: string }[] = [];
  for (const c of ds.cards) {
    const h = byId.get(c.dbfId);
    if (!h) {
      missing.push({ dbfId: c.dbfId, name: c.name, set: c.set, alternatives: (byName.get(c.name) ?? []).map((a) => ({ dbfId: a.dbfId, id: a.id, set: a.set })) });
    } else if (h.set.toLowerCase().replace(/_/g, "-") !== c.set && !(c.set === "core" && h.set === "CORE")) {
      setMismatch.push({ dbfId: c.dbfId, name: c.name, ourSet: c.set, hsjSet: h.set, hsjId: h.id });
    }
  }
  const bySet = new Map<string, number>();
  for (const m of missing) bySet.set(m.set, (bySet.get(m.set) ?? 0) + 1);
  console.log(`\nBizim havuz: ${ds.cards.length} kart · HSJSON koleksiyon: ${hsj.length}`);
  console.log(`HSJSON'da OLMAYAN dbfId: ${missing.length}  → set dağılımı:`, Object.fromEntries(bySet));
  for (const m of missing.slice(0, 25)) console.log(`  ${m.dbfId} ${m.name} [${m.set}] → alternatif:`, m.alternatives.map((a) => `${a.dbfId}/${a.id}/${a.set}`).join(", ") || "yok");
  console.log(`Set uyuşmazlığı: ${setMismatch.length}`);
  for (const m of setMismatch.slice(0, 10)) console.log(`  ${m.dbfId} ${m.name}: biz ${m.ourSet}, HSJSON ${m.hsjSet} (${m.hsjId})`);
  // HSJSON'daki Core id'leri bizde var mı? (ters yön)
  const ourIds = new Set(ds.cards.map((c) => c.dbfId));
  const hsjCore = hsj.filter((c) => c.set === "CORE");
  const coreNotInOurs = hsjCore.filter((c) => !ourIds.has(c.dbfId));
  console.log(`\nHSJSON CORE: ${hsjCore.length} kart; bizde olmayan: ${coreNotInOurs.length}`);
  for (const c of coreNotInOurs.slice(0, 10)) console.log(`  ${c.dbfId} ${c.id} ${c.name}`);
  await writeFile(path.join(process.cwd(), "data/id-report.json"), JSON.stringify({ missing, setMismatch, coreNotInOurs: coreNotInOurs.map((c) => ({ dbfId: c.dbfId, id: c.id, name: c.name })) }, null, 2));
  console.log("\nrapor: data/id-report.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
