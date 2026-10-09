// intent → retrieve → build → validate (→ repair ×2 → mechanical) → encode (→ Blizzard verify)
// Each step is reported via onStep; the step tracker in the UI listens to these events.

import { blizzard } from "@/lib/blizzard/client";
import { getStandardPool, loadDataset } from "@/lib/cards/repo";
import type { CardRecord } from "@/lib/cards/types";
import { buildDeck, repairDeck, type BuildContext } from "@/lib/ai/build";
import { parseIntent } from "@/lib/ai/intent";
import { mechanicalRepair } from "@/lib/ai/repair";
import { findCardByName, retrieveCandidates } from "@/lib/ai/retrieve";
import { isQuotaError, isTransientLlmError } from "@/lib/ai/provider";
import type { Intent } from "@/lib/ai/schemas";
import { assembleDeck } from "./assemble";
import { CLASS_NAMES, isClassSlug, type ClassSlug } from "./rules";
import type { DeckResult, DeckSpec, Swap } from "./types";
import { formatErrors, validateDeck } from "./validate";

export type StepId = "intent" | "retrieve" | "build" | "validate" | "encode";
export interface StepEvent {
  step: StepId;
  status: "start" | "done" | "info";
  detail?: string;
}

export class ForgeError extends Error {
  constructor(
    public readonly kind: "vague" | "rotated" | "api" | "invalid" | "llm" | "busy",
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ForgeError";
  }
}

/** Maps an LLM error to a user-facing kind: quota/overload → busy, everything else → llm. */
function llmError(stage: string, err: unknown): ForgeError {
  const msg = (err as Error).message ?? String(err);
  if (isQuotaError(err) || isTransientLlmError(err)) {
    return new ForgeError("busy", "The forge is busy right now (AI provider is rate-limited). Try again in a minute.", { stage, cause: msg.slice(0, 200) });
  }
  return new ForgeError("llm", `${stage} failed: ${msg}`);
}

export interface ForgeOptions {
  onStep?: (e: StepEvent) => void;
  maxRepairRounds?: number; // default 2
  verifyWithBlizzard?: boolean; // default true
}

function inferClass(intent: Intent, seedsInAnyClass: CardRecord[]): ClassSlug | null {
  if (intent.classSlug) return intent.classSlug;
  for (const s of seedsInAnyClass) {
    if (isClassSlug(s.classSlug)) return s.classSlug;
    const dual = s.multiClass.find(isClassSlug);
    if (dual) return dual;
  }
  return null;
}

export async function forgeDeck(userPrompt: string, opts: ForgeOptions = {}): Promise<DeckResult> {
  const emit = (e: StepEvent) => opts.onStep?.(e);
  const maxRepair = opts.maxRepairRounds ?? 2;

  // 1) intent
  emit({ step: "intent", status: "start" });
  let intent: Intent;
  try {
    intent = await parseIntent(userPrompt);
  } catch (err) {
    throw llmError("Intent parsing", err);
  }
  const ds = await loadDataset();

  // look up seed cards in the whole pool (for class inference)
  const seedsAny = intent.seedCards.map((n) => findCardByName(n, ds.cards)).filter((c): c is CardRecord => !!c);
  const missingSeeds = intent.seedCards.filter((n) => !findCardByName(n, ds.cards));
  if (missingSeeds.length && !seedsAny.length) {
    throw new ForgeError("rotated", `"${missingSeeds[0]}" is not in the current Standard pool (it may have rotated to Wild or the name is off).`, { missing: missingSeeds });
  }
  const classSlug = inferClass(intent, seedsAny);
  if (!classSlug || intent.needsClarification) {
    throw new ForgeError("vague", intent.clarificationQuestion ?? "Tell me a class or a card to build around.", { intent });
  }
  emit({ step: "intent", status: "done", detail: `${CLASS_NAMES[classSlug]} · ${intent.archetype}` });

  // 2) retrieve
  emit({ step: "retrieve", status: "start" });
  const pool = await getStandardPool(classSlug);
  const retrieved = retrieveCandidates(intent, pool);
  const seedNotInClass = seedsAny.filter((s) => !retrieved.seeds.some((r) => r.dbfId === s.dbfId));
  if (seedNotInClass.length) {
    throw new ForgeError("rotated", `${seedNotInClass[0].name} is a ${seedNotInClass[0].classSlug} card; it can't go in a ${CLASS_NAMES[classSlug]} deck.`);
  }
  emit({ step: "retrieve", status: "done", detail: `${retrieved.candidates.length} candidates · ${retrieved.seeds.length} seed` });

  // 3) build
  emit({ step: "build", status: "start" });
  const ctx: BuildContext = { intent, classSlug, seeds: retrieved.seeds, compact: retrieved.compact, userPrompt };
  let built;
  try {
    built = (await buildDeck(ctx)).output;
  } catch (err) {
    throw llmError("Deck building", err);
  }
  emit({ step: "build", status: "done", detail: built.name });

  // 4) validate (+ repair)
  emit({ step: "validate", status: "start" });
  const lookup = (id: number) => pool.find((c) => c.dbfId === id);
  let spec: DeckSpec = { classSlug, format: "standard", cards: built.cards };
  let result = validateDeck(spec, lookup);
  let round = 0;
  while (!result.ok && round < maxRepair) {
    round += 1;
    emit({ step: "validate", status: "info", detail: `repair round ${round}: ${result.errors.length} issue(s)` });
    try {
      spec = { ...spec, cards: await repairDeck(ctx, spec.cards, formatErrors(result.errors)) };
    } catch {
      break;
    }
    result = validateDeck(spec, lookup);
  }
  if (!result.ok) {
    emit({ step: "validate", status: "info", detail: "mechanical repair" });
    spec = mechanicalRepair(spec, lookup, retrieved.candidates, retrieved.seeds);
    result = validateDeck(spec, lookup);
  }
  if (!result.ok) {
    throw new ForgeError("invalid", `Could not produce a legal deck: ${formatErrors(result.errors)}`);
  }
  emit({ step: "validate", status: "done", detail: "legal" });

  // 5) encode
  emit({ step: "encode", status: "start" });
  const core = await assembleDeck({ spec, name: built.name, archetype: built.archetype });
  const { cards, deckstring } = core;

  let verified = false;
  if (opts.verifyWithBlizzard ?? true) {
    try {
      const remote = await blizzard.deckByCode(deckstring);
      const remoteIds = remote.cards.map((c) => c.id).sort((a, b) => a - b);
      const localIds = cards.flatMap((c) => Array(c.count).fill(c.dbfId) as number[]).sort((a, b) => a - b);
      verified = remote.cardCount === 30 && JSON.stringify(remoteIds) === JSON.stringify(localIds);
    } catch {
      verified = false; // if Blizzard is unreachable, local validation is enough; the UI shows a note
    }
  }
  emit({ step: "encode", status: "done", detail: verified ? "verified by Blizzard" : "encoded" });

  const inDeck = new Set(cards.map((c) => c.dbfId));
  const swaps: Swap[] = built.swaps
    .map((s) => {
      const out = cards.find((c) => c.dbfId === s.outDbfId);
      const inn = lookup(s.inDbfId);
      return out && inn && !inDeck.has(inn.dbfId) ? { out, in: { ...inn, count: out.count }, why: s.why } : null;
    })
    .filter((s): s is Swap => !!s);

  return {
    ...core,
    sections: [
      { id: "plan", title: "Game plan", paras: built.gamePlan },
      { id: "syn", title: "Core synergy", paras: [built.coreSynergy] },
      { id: "mull", title: "Mulligan tips", paras: built.mulligan },
      { id: "swaps", title: "Possible swaps", paras: swaps.length ? ["One-for-one swaps that keep the deck legal."] : ["No swaps suggested."] },
    ],
    swaps,
    verifiedByBlizzard: verified,
  };
}
