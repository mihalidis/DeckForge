// 30-prompt evaluation set. Run: npm run eval  [-- --limit 5] [-- --no-verify]
// Report: legality, seed included, duration, number of repair rounds. Writes to data/eval-<date>.json.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { forgeDeck, ForgeError, type StepEvent } from "../src/lib/deck/pipeline";
import { validateDeck } from "../src/lib/deck/validate";
import { getStandardPool } from "../src/lib/cards/repo";
import { decodeDeck } from "../src/lib/deck/deckstring";

const PROMPTS: { prompt: string; expectSeed?: string; expectClass?: string; expectError?: string }[] = [
  { prompt: "Build a Standard Shaman deck around Al'Akir", expectSeed: "Al'Akir", expectClass: "shaman" },
  { prompt: "Cheap aggro Hunter under 3000 dust", expectClass: "hunter" },
  { prompt: "Control Warrior with lots of armor", expectClass: "warrior" },
  { prompt: "Dragon Priest, no legendaries", expectClass: "priest" },
  { prompt: "Murloc Paladin", expectClass: "paladin" },
  { prompt: "Elemental Mage that goes face", expectClass: "mage" },
  { prompt: "A Rogue deck that wins with weapons", expectClass: "rogue" },
  { prompt: "Zoo Warlock, as cheap as possible", expectClass: "warlock" },
  { prompt: "Big Druid ramping into huge minions", expectClass: "druid" },
  { prompt: "Aggro Demon Hunter", expectClass: "demonhunter" },
  { prompt: "Frost Death Knight with lots of removal", expectClass: "deathknight" },
  { prompt: "Blood Death Knight control deck", expectClass: "deathknight" },
  { prompt: "Taunt Warrior", expectClass: "warrior" },
  { prompt: "Secret Mage", expectClass: "mage" },
  { prompt: "Beast Hunter midrange", expectClass: "hunter" },
  { prompt: "Undead Priest", expectClass: "priest" },
  { prompt: "Totem Shaman, budget", expectClass: "shaman" },
  { prompt: "Mech Paladin with Divine Shield synergy", expectClass: "paladin" },
  { prompt: "Pirate Rogue tempo", expectClass: "rogue" },
  { prompt: "Discard Warlock", expectClass: "warlock" },
  { prompt: "Token Druid that floods the board", expectClass: "druid" },
  { prompt: "Deathrattle Demon Hunter", expectClass: "demonhunter" },
  { prompt: "Control Priest with heals and board clears", expectClass: "priest" },
  { prompt: "Spell Mage with no minions if possible", expectClass: "mage" },
  { prompt: "Combo Rogue", expectClass: "rogue" },
  { prompt: "Lifesteal Demon Hunter", expectClass: "demonhunter" },
  { prompt: "Handbuff Paladin", expectClass: "paladin" },
  { prompt: "Overload Shaman", expectClass: "shaman" },
  { prompt: "aggro", expectError: "vague" },
  { prompt: "Shudderwock Shaman for Standard", expectError: "rotated" }, // Shudderwock is Wild
];

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : PROMPTS.length;
  const verify = !args.includes("--no-verify");
  const delayMs = 4000; // for the free tier RPM limit

  const rows: Record<string, unknown>[] = [];
  let busyStreak = 0;
  for (const [i, p] of PROMPTS.slice(0, limit).entries()) {
    if (busyStreak >= 3) {
      console.log(`\n! 3 "busy" in a row (quota/overload) — run stopped; skipped the remaining ${PROMPTS.slice(0, limit).length - i} prompts.`);
      break;
    }
    const t0 = Date.now();
    let repairs = 0;
    const stepMs: Record<string, number> = {};
    let stepStart = Date.now();
    const onStep = (e: StepEvent) => {
      if (e.status === "start") stepStart = Date.now();
      if (e.status === "done") stepMs[e.step] = Date.now() - stepStart;
      if (e.step === "validate" && e.status === "info") repairs++;
    };
    try {
      const deck = await forgeDeck(p.prompt, { onStep, verifyWithBlizzard: verify });
      const pool = await getStandardPool(deck.classSlug);
      const v = validateDeck({ classSlug: deck.classSlug, format: "standard", cards: deck.cards.map((c) => ({ dbfId: c.dbfId, count: c.count })) }, (id) => pool.find((c) => c.dbfId === id));
      const decoded = decodeDeck(deck.deckstring);
      const seedOk = p.expectSeed ? deck.cards.some((c) => c.name.toLowerCase().includes(p.expectSeed!.toLowerCase())) : null;
      const classOk = p.expectClass ? deck.classSlug === p.expectClass : null;
      const row = { i, prompt: p.prompt, ok: v.ok && decoded.cards.length > 0, legal: v.ok, seedOk, classOk, class: deck.classSlug, name: deck.name, dust: deck.dust, repairs, verified: deck.verifiedByBlizzard, ms: Date.now() - t0, stepMs, expectedError: p.expectError ?? null, gotError: null as string | null,
        deck: deck.cards.map((c) => `${c.count}x (${c.cost}) ${c.name}`), gamePlan: deck.sections[0].paras };
      rows.push(row);
      busyStreak = 0;
      console.log(`${String(i + 1).padStart(2)}. ${row.ok ? "✓" : "✗"} ${p.prompt} → ${deck.name} (${deck.classSlug}, ${deck.dust} dust, ${repairs} repair, ${(row.ms / 1000).toFixed(1)}s${deck.verifiedByBlizzard ? ", verified" : ""})${seedOk === false ? " !seed" : ""}${classOk === false ? " !class" : ""}`);
      console.log(`    steps: ${Object.entries(stepMs).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)}s`).join(" · ")}`);
      console.log(`    ${deck.cards.map((c) => `${c.count}x ${c.name}`).join(", ")}`);
    } catch (err) {
      const kind = err instanceof ForgeError ? err.kind : "crash";
      const ok = p.expectError ? p.expectError === kind : false;
      busyStreak = kind === "busy" ? busyStreak + 1 : 0;
      rows.push({ i, prompt: p.prompt, ok, legal: false, class: null, repairs, ms: Date.now() - t0, expectedError: p.expectError ?? null, gotError: kind, message: (err as Error).message });
      console.log(`${String(i + 1).padStart(2)}. ${ok ? "✓" : "✗"} ${p.prompt} → error:${kind} ${ok ? "(expected)" : (err as Error).message.slice(0, 120)}`);
    }
    if (i < limit - 1) await new Promise((r) => setTimeout(r, delayMs));
  }

  const n = rows.length;
  const okN = rows.filter((r) => r.ok).length;
  const legalRows = rows.filter((r) => r.legal !== undefined && r.gotError === null);
  const legalN = legalRows.filter((r) => r.legal).length;
  const seedRows = rows.filter((r) => r.seedOk !== null && r.seedOk !== undefined);
  const avgMs = rows.reduce((s, r) => s + (r.ms as number), 0) / Math.max(1, n);
  console.log(`\n== ${okN}/${n} ok · legal ${legalN}/${legalRows.length} · seed ${seedRows.filter((r) => r.seedOk).length}/${seedRows.length} · avg ${(avgMs / 1000).toFixed(1)}s · repairs ${rows.reduce((s, r) => s + (r.repairs as number), 0)}`);

  await mkdir(path.join(process.cwd(), "data"), { recursive: true });
  const file = path.join(process.cwd(), "data", `eval-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`);
  await writeFile(file, JSON.stringify(rows, null, 2));
  console.log(`report: ${path.relative(process.cwd(), file)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
