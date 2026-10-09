// Before `npm run build`: fetches card data if Blizzard keys are present (fresh data on every Vercel deploy).
// Without keys or network it continues with the existing data/; if data/ is missing too the build still passes and the app returns 503.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const hasCreds = !!(process.env.BLIZZARD_CLIENT_ID && process.env.BLIZZARD_CLIENT_SECRET);
const hasData = existsSync("data/cards.standard.json");

if (!hasCreds) {
  console.log(`[prebuild] no BLIZZARD_* → sync skipped (${hasData ? "existing data/ will be used" : "no data/; /api/forge returns 503"})`);
  process.exit(0);
}
const r = spawnSync("npx", ["tsx", "scripts/sync-cards.ts"], { stdio: "inherit", env: process.env });
if (r.status !== 0) {
  console.warn(`[prebuild] sync failed (code ${r.status}); ${hasData ? "continuing with existing data/" : "no data/!"}`);
  process.exit(hasData ? 0 : 1);
}
