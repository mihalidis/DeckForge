// Sınıf → görsel eşlemeleri. Renkler globals.css @theme token'larından; JSX'e hex yazılmaz.
import { CLASS_NAMES, CLASS_SLUGS, type ClassSlug } from "@/lib/deck/rules";

export const CLASS_COLOR_VAR: Record<ClassSlug, string> = {
  deathknight: "var(--color-class-deathknight)",
  demonhunter: "var(--color-class-demonhunter)",
  druid: "var(--color-class-druid)",
  hunter: "var(--color-class-hunter)",
  mage: "var(--color-class-mage)",
  paladin: "var(--color-class-paladin)",
  priest: "var(--color-class-priest)",
  rogue: "var(--color-class-rogue)",
  shaman: "var(--color-class-shaman)",
  warlock: "var(--color-class-warlock)",
  warrior: "var(--color-class-warrior)",
};

export const RARITY_COLOR_VAR: Record<string, string> = {
  free: "var(--color-rarity-common)",
  common: "var(--color-rarity-common)",
  rare: "var(--color-rarity-rare)",
  epic: "var(--color-rarity-epic)",
  legendary: "var(--color-rarity-legendary)",
};

export const CLASS_LIST = CLASS_SLUGS.map((slug) => ({ slug, name: CLASS_NAMES[slug], color: CLASS_COLOR_VAR[slug] }));

/** Renk değişkenini verilen oranla saydamlaştırır (chip zemini, rozet). */
export const tint = (colorVar: string, pct: number) => `color-mix(in srgb, ${colorVar} ${pct}%, transparent)`;

export const formatDust = (n: number) => n.toLocaleString("en-US");
