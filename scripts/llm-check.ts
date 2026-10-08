// LLM anahtarı ve model adını doğrular: npm run llm:check
import { generateObject } from "ai";
import { z } from "zod";
import { getModelById, modelIdsFor, providerName, providerOptionsFor } from "../src/lib/ai/provider";

async function main() {
  for (const role of ["intent", "build"] as const) for (const id of modelIdsFor(role)) {
    const t0 = Date.now();
    try {
      const { object } = await generateObject({
        model: await getModelById(id),
        schema: z.object({ classSlug: z.string(), ok: z.boolean() }),
        prompt: "Reply with classSlug 'shaman' and ok true.",
        providerOptions: providerOptionsFor(role, id),
      });
      console.log(`✓ ${providerName()} / ${role} = ${id} → ${JSON.stringify(object)} (${Date.now() - t0}ms)`);
    } catch (err) {
      console.log(`✗ ${providerName()} / ${role} = ${id} → ${(err as Error).message.slice(0, 300)}`);
      console.log("  Model adı yanlışsa: https://ai.google.dev/gemini-api/docs/models adresinden güncel id'yi al, .env.local'de LLM_MODEL_* değiştir.");
    }
  }
}
main();
