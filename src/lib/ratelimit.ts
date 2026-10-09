// Bellek içi, IP başına kayan pencere limiti. Tek sunucu için yeterli (Vercel'de her instance kendi sayar);
// Faz 5'te gerekirse Upstash'e taşınır. Ücretsiz LLM kotasını tek kullanıcının tüketmesini engeller.

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
  if (buckets.size > 10_000) buckets.clear(); // basit bellek koruması
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export const FORGE_LIMIT = { limit: Number(process.env.RATE_LIMIT_FORGE ?? 8), windowMs: 10 * 60 * 1000 };
