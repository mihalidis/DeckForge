import { generateObject } from "ai";
import { providerOptionsFor, timeoutFor, withModelFallback } from "./provider";
import { INTENT_SYSTEM } from "./prompts/intent";
import { IntentSchema, type Intent } from "./schemas";

export async function parseIntent(prompt: string): Promise<Intent> {
  return withModelFallback("intent", async (model, id) => {
    const { object } = await generateObject({
      model,
      schema: IntentSchema,
      system: INTENT_SYSTEM,
      prompt: `Player request: """${prompt.trim()}"""`,
      temperature: 0,
      maxRetries: 1,
      providerOptions: providerOptionsFor("intent", id),
      abortSignal: AbortSignal.timeout(timeoutFor("intent")),
    });
    return object;
  });
}
