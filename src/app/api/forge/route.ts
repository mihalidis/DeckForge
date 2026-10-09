// POST /api/forge  { prompt: string }  → text/event-stream
// event: step   data: {"step":"intent","status":"start"}
// event: result data: DeckResult
// event: error  data: {"kind":"vague","message":"..."}

import { forgeDeck, ForgeError } from "@/lib/deck/pipeline";
import { clientIp, FORGE_LIMIT, rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = rateLimit(`forge:${clientIp(req)}`, FORGE_LIMIT.limit, FORGE_LIMIT.windowMs);
  if (!rl.ok) {
    return new Response(JSON.stringify({ kind: "busy", message: `Too many requests from this address. Try again in ${rl.retryAfterSec}s.` }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSec) },
    });
  }
  let prompt = "";
  try {
    const body = (await req.json()) as { prompt?: string };
    prompt = (body.prompt ?? "").trim();
  } catch {
    /* boş */
  }
  if (!prompt || prompt.length > 500) {
    return new Response(JSON.stringify({ kind: "vague", message: "Tell me what you want to play (max 500 characters)." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const deck = await forgeDeck(prompt, { onStep: (e) => send("step", e) });
        send("result", deck);
      } catch (err) {
        if (err instanceof ForgeError) send("error", { kind: err.kind, message: err.message });
        else send("error", { kind: "api", message: (err as Error).message ?? "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
