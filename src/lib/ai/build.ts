import { generateObject } from "ai";
import type { CardRecord } from "@/lib/cards/types";
import { providerOptionsFor, timeoutFor, withModelFallback } from "./provider";
import { BUILD_SYSTEM } from "./prompts/build";
import { BuildSchema, RepairSchema, type BuildOutput, type Intent } from "./schemas";
import { CLASS_NAMES, type ClassSlug } from "@/lib/deck/rules";

export interface BuildContext {
  intent: Intent;
  classSlug: ClassSlug;
  seeds: CardRecord[];
  compact: string; // aday kart bloğu
  userPrompt: string;
}

function requestBlock(ctx: BuildContext): string {
  const c = ctx.intent.constraints;
  const lines = [
    `Class: ${CLASS_NAMES[ctx.classSlug]} (${ctx.classSlug})`,
    `Format: Standard`,
    `Player request: "${ctx.userPrompt.trim()}"`,
    `Parsed intent: ${ctx.intent.summary}`,
    `Archetype: ${ctx.intent.archetype}`,
  ];
  if (ctx.seeds.length) lines.push(`Seed cards (must be in the deck): ${ctx.seeds.map((s) => `${s.name} (${s.dbfId})`).join(", ")}`);
  if (ctx.intent.mustExclude.length) lines.push(`Must exclude: ${ctx.intent.mustExclude.join(", ")}`);
  if (c.maxDust) lines.push(`Max dust: ${c.maxDust}`);
  if (c.noLegendaries) lines.push(`No legendary cards.`);
  if (c.tribe) lines.push(`Tribe focus: ${c.tribe}`);
  if (c.keyword) lines.push(`Mechanic focus: ${c.keyword}`);
  return lines.join("\n");
}

export async function buildDeck(ctx: BuildContext): Promise<{ output: BuildOutput; usage?: unknown }> {
  return withModelFallback("build", async (model, id) => {
    const { object, usage } = await generateObject({
      model,
      schema: BuildSchema,
      system: BUILD_SYSTEM,
      prompt: `${requestBlock(ctx)}\n\nCANDIDATE CARDS (dbfId|Name|cost|atk/hp|type|rarity|class|tags|text), most relevant first:\n${ctx.compact}`,
      temperature: 0.4,
      maxRetries: 1,
      providerOptions: providerOptionsFor("build", id),
      abortSignal: AbortSignal.timeout(timeoutFor("build")),
    });
    return { output: object, usage };
  });
}

/** Doğrulayıcı hatalarını gönderip yalnızca kart listesini düzelttirir. */
export async function repairDeck(
  ctx: BuildContext,
  current: { dbfId: number; count: number }[],
  errorText: string,
): Promise<{ dbfId: number; count: number }[]> {
  return withModelFallback("build", async (model, id) => {
    const { object } = await generateObject({
      model,
      schema: RepairSchema,
      system: BUILD_SYSTEM,
      prompt:
        `${requestBlock(ctx)}\n\nYour previous deck was rejected by the validator:\n${errorText}\n\n` +
        `Previous card list (dbfId x count):\n${current.map((c) => `${c.dbfId} x${c.count}`).join("\n")}\n\n` +
        `Return the corrected full 30-card list. Fix only what the errors require; keep the game plan.\n\n` +
        `CANDIDATE CARDS:\n${ctx.compact}`,
      temperature: 0.2,
      maxRetries: 1,
      providerOptions: providerOptionsFor("build", id),
      abortSignal: AbortSignal.timeout(timeoutFor("build")),
    });
    return object.cards;
  });
}
