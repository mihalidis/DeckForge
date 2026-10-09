import { generateObject } from "ai";
import { z } from "zod";
import type { DeckCard } from "@/lib/deck/types";
import { CLASS_NAMES, type ClassSlug } from "@/lib/deck/rules";
import { providerOptionsFor, timeoutFor, withModelFallback } from "./provider";
import { REFINE_SYSTEM } from "./prompts/refine";
import { DeckCardsSchema } from "./schemas";

export const RefineOutputSchema = z.object({ reply: z.string(), cards: DeckCardsSchema });
export type RefineOutput = z.infer<typeof RefineOutputSchema>;

export interface RefineContext {
  classSlug: ClassSlug;
  deckName: string;
  cards: DeckCard[];
  compact: string;
  instruction: string;
  history: { user: string; reply: string }[];
}

export async function refineDeck(ctx: RefineContext): Promise<RefineOutput> {
  const current = ctx.cards.map((c) => `${c.dbfId} x${c.count}  ${c.name} (${c.cost})`).join("\n");
  const hist = ctx.history.length
    ? `\nEarlier edits in this session:\n${ctx.history.map((h) => `- Player: "${h.user}" → ${h.reply}`).join("\n")}\n`
    : "";
  return withModelFallback("build", async (model, id) => {
    const { object } = await generateObject({
      model,
      schema: RefineOutputSchema,
      system: REFINE_SYSTEM,
      prompt:
        `Class: ${CLASS_NAMES[ctx.classSlug]} (${ctx.classSlug})\nDeck: ${ctx.deckName}\n${hist}\n` +
        `Current deck (dbfId x count  name (cost)):\n${current}\n\n` +
        `Player's request: "${ctx.instruction.trim()}"\n\n` +
        `CANDIDATE CARDS (dbfId|Name|cost|atk/hp|type|rarity|class|tags|text):\n${ctx.compact}`,
      temperature: 0.3,
      maxRetries: 1,
      providerOptions: providerOptionsFor("build", id),
      abortSignal: AbortSignal.timeout(timeoutFor("build")),
    });
    return object;
  });
}
