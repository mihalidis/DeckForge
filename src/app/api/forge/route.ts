// POST /api/forge  { prompt: string }  → text/event-stream
// event: step   data: {"step":"intent","status":"start"}
// event: result data: DeckResult
// event: error  data: {"kind":"vague","message":"..."}

import { forgeDeck, ForgeError } from "@/lib/deck/pipeline";

export const maxDuration = 60;

export async function POST(req: Request) {
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
