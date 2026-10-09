// Social preview image for /d/[code] (1200×630). Built from card data; font: system.
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { loadDataset } from "@/lib/cards/repo";
import { assembleDeck, fromUrlCode } from "@/lib/deck/assemble";
import { decodeDeck } from "@/lib/deck/deckstring";
import { CLASS_NAMES, isClassSlug } from "@/lib/deck/rules";

export const alt = "DeckForge deck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CLASS_HEX: Record<string, string> = {
  deathknight: "#3C9AB0", demonhunter: "#2FBF71", druid: "#A2673F", hunter: "#8BC34A", mage: "#69CCF0", paladin: "#F5C542",
  priest: "#D8D8E8", rogue: "#8A8A94", shaman: "#5B6DD6", warlock: "#9482C9", warrior: "#C9433F",
}; // The OG image can't access CSS variables; same values as design/tokens.md

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  let deck: Awaited<ReturnType<typeof assembleDeck>> | null = null;
  try {
    const d = decodeDeck(fromUrlCode(code));
    const ds = await loadDataset();
    const cls = ds.classes.find((c) => c.heroDbfId === d.heroes[0]);
    if (cls && isClassSlug(cls.slug)) deck = await assembleDeck({ spec: { classSlug: cls.slug, format: "standard", cards: d.cards }, name: `${CLASS_NAMES[cls.slug]} deck` });
  } catch { /* invalid code → generic image */ }

  const bins = Array.from({ length: 8 }, () => 0);
  for (const c of deck?.cards ?? []) bins[Math.min(c.cost, 7)] += c.count;
  const max = Math.max(1, ...bins);
  const color = deck ? CLASS_HEX[deck.classSlug] : "#E0A64B";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(180deg,#1B2333 0%,#0E1116 100%)", color: "#F2E9D8", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#A9A396" }}>
          <div style={{ display: "flex", width: 36, height: 36, borderRadius: 10, background: "#E0A64B" }} />
          DeckForge · AI deck builder for Hearthstone
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 88, height: 88, borderRadius: 22, background: color, color: "#0E1116", fontSize: 48, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{deck ? deck.className[0] : "?"}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 64, lineHeight: 1.05 }}>{deck ? deck.name : "Deck not found"}</div>
              <div style={{ display: "flex", fontSize: 28, color: "#A9A396" }}>{deck ? `${deck.className} · Standard · ${deck.cardCount} cards · ${deck.dust.toLocaleString("en-US")} dust` : "Forge your own at DeckForge"}</div>
            </div>
          </div>
          {deck && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginTop: 12 }}>
              {bins.map((n, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 56 }}>
                  <div style={{ width: 44, height: Math.max(6, Math.round((n / max) * 90)), borderRadius: 6, background: "linear-gradient(180deg,#5B8DEF,#3B5FC4)" }} />
                  <div style={{ display: "flex", fontSize: 18, color: "#7F7B72" }}>{i === 7 ? "7+" : i}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#7F7B72" }}>Copy the code, open Hearthstone, create a new deck.</div>
      </div>
    ),
    size,
  );
}
