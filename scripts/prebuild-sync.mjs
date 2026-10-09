// `npm run build` öncesi: Blizzard anahtarları varsa kart verisini çeker (Vercel'de her deploy'da taze veri).
// Anahtar yoksa veya ağ yoksa mevcut data/ ile devam eder; data/ da yoksa build yine geçer, uygulama 503 döner.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const hasCreds = !!(process.env.BLIZZARD_CLIENT_ID && process.env.BLIZZARD_CLIENT_SECRET);
const hasData = existsSync("data/cards.standard.json");

if (!hasCreds) {
  console.log(`[prebuild] BLIZZARD_* yok → sync atlandı (${hasData ? "mevcut data/ kullanılacak" : "data/ yok; /api/forge 503 döner"})`);
  process.exit(0);
}
const r = spawnSync("npx", ["tsx", "scripts/sync-cards.ts"], { stdio: "inherit", env: process.env });
if (r.status !== 0) {
  console.warn(`[prebuild] sync başarısız (kod ${r.status}); ${hasData ? "mevcut data/ ile devam" : "data/ yok!"}`);
  process.exit(hasData ? 0 : 1);
}
