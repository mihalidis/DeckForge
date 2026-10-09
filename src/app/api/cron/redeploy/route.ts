// GET /api/cron/redeploy — called once a day by Vercel Cron (vercel.json). Triggers the Deploy Hook;
// the new build re-fetches card data in prebuild, so data/ stays "fresh" on serverless.
// Vercel sends Authorization: Bearer <CRON_SECRET> on cron requests.

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
