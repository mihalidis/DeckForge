import { z } from "zod";
import { CLASS_SLUGS } from "@/lib/deck/rules";

export const ArchetypeSchema = z.enum(["aggro", "midrange", "control", "combo", "unspecified"]);

export const IntentSchema = z.object({
  classSlug: z.enum(CLASS_SLUGS).nullable(),
  seedCards: z.array(z.string()).default([]),
  mustInclude: z.array(z.string()).default([]),
  mustExclude: z.array(z.string()).default([]),
  archetype: ArchetypeSchema.default("unspecified"),
  constraints: z
    .object({
      maxDust: z.number().int().positive().nullable().default(null),
      noLegendaries: z.boolean().default(false),
      tribe: z.string().nullable().default(null),
      keyword: z.string().nullable().default(null),
    })
    .default({ maxDust: null, noLegendaries: false, tribe: null, keyword: null }),
  needsClarification: z.boolean().default(false),
  clarificationQuestion: z.string().nullable().default(null),
  summary: z.string(),
});
export type Intent = z.infer<typeof IntentSchema>;

export const DeckCardsSchema = z.array(
  z.object({ dbfId: z.number().int(), count: z.number().int().min(1).max(2) }),
);

export const BuildSchema = z.object({
  name: z.string().max(40),
  archetype: ArchetypeSchema,
  cards: DeckCardsSchema,
  gamePlan: z.array(z.string()).min(1).max(4),
  coreSynergy: z.string(),
  mulligan: z.array(z.string()).min(1).max(6),
  swaps: z
    .array(z.object({ outDbfId: z.number().int(), inDbfId: z.number().int(), why: z.string() }))
    .max(4)
    .default([]),
});
export type BuildOutput = z.infer<typeof BuildSchema>;

export const RepairSchema = z.object({ cards: DeckCardsSchema });
