// In-memory sliding-window limit per IP. Enough for a single server (on Vercel each instance counts on its own);
// moves to Upstash in Phase 5 if needed. Keeps a single user from burning the free LLM quota.

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const retryAfterSec = Math.ceil((windowMs - (now - arr[0])) / 1000);
    buckets.set(key, arr);
    return { ok: false, retryAfterSec };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 10_000) buckets.clear(); // simple memory guard
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export const FORGE_LIMIT = { limit: Number(process.env.RATE_LIMIT_FORGE ?? 8), windowMs: 10 * 60 * 1000 };
