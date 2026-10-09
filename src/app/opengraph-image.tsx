// Ana sayfa sosyal önizlemesi (statik).
import { ImageResponse } from "next/og";

export const alt = "DeckForge — AI deck builder for Hearthstone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(180deg,#1B2333 0%,#0E1116 100%)", color: "#F2E9D8", fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 44, height: 44, borderRadius: 12, background: "#E0A64B", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 14, height: 14, background: "#0E1116", borderRadius: 2, transform: "rotate(45deg)" }} />
          </div>
          <div style={{ display: "flex", fontSize: 34 }}>DeckForge</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05 }}>Describe the deck.</div>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05, color: "#E0A64B", fontStyle: "italic" }}>We forge it.</div>
          <div style={{ display: "flex", fontSize: 30, color: "#A9A396", marginTop: 10 }}>A legal 30-card Standard Hearthstone deck and a code that pastes straight into the game.</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#7F7B72" }}>Live Blizzard card data · Validated decks · One-click deck code</div>
      </div>
    ),
    size,
  );
}
