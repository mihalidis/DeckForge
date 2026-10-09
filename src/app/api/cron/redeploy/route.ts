// GET /api/cron/redeploy — Vercel Cron günde bir çağırır (vercel.json). Deploy Hook'u tetikler;
// yeni build prebuild'de kart verisini yeniden çeker. Böylece data/ serverless'ta "güncel" kalır.
// Vercel cron isteklerinde Authorization: Bearer <CRON_SECRET> gönderir.

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return Response.json({ ok: false, reason: "VERCEL_DEPLOY_HOOK_URL not set" }, { status: 500 });
  const res = await fetch(hook, { method: "POST" });
  return Response.json({ ok: res.ok, status: res.status, at: new Date().toISOString() });
}
