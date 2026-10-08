// Tüm kullanıcıya görünen metinler burada toplanır (CLAUDE.md kuralı). Faz 9'da tr.ts eklenir.
export const en = {
  app: { name: "DeckForge", tagline: "AI deck builder for Hearthstone" },
  landing: {
    title: "Describe the deck.",
    titleAccent: "We forge it.",
    subtitle:
      "Type what you want to play. You get a legal 30-card Standard deck and a code that pastes straight into the game.",
    forge: "Forge deck",
  },
  footer: {
    disclaimer:
      "DeckForge is a fan project and is not affiliated with Blizzard Entertainment. Hearthstone is a trademark of Blizzard Entertainment, Inc.",
  },
} as const;
