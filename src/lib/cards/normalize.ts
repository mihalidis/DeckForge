// Raw Blizzard card + metadata → CardRecord. Used by the sync script and tests.

import type { ApiCard, Metadata } from "@/lib/blizzard/types";
import type { CardRecord, Rarity } from "./types";

export const NEUTRAL_CLASS_ID = 12;

/** Strips HTML tags and extra whitespace from Blizzard text. */
export function stripCardText(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<\/?b>/g, "")
    .replace(/<\/?i>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[x\]/g, "")
    .replace(/\$/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface Lookups {
  classById: Map<number, string>;
  typeById: Map<number, string>;
  setById: Map<number, string>;
  rarityById: Map<number, { slug: Rarity; dust: number }>;
  minionTypeById: Map<number, string>;
  spellSchoolById: Map<number, string>;
  keywordById: Map<number, string>;
}

export function buildLookups(meta: Metadata): Lookups {
  // Blizzard sends some slugs with a trailing newline ("battlecry\n"); clean them.
  const mapOf = <T extends { id: number; slug: string }>(arr: T[]) =>
    new Map(arr.map((x) => [x.id, x.slug.trim()] as const));
  return {
    classById: mapOf(meta.classes),
    typeById: mapOf(meta.types),
    setById: mapOf(meta.sets),
    rarityById: new Map(
      meta.rarities.map((r) => [
        r.id,
        { slug: r.slug as Rarity, dust: r.craftingCost?.[0] ?? 0 },
      ]),
    ),
    minionTypeById: mapOf(meta.minionTypes),
    spellSchoolById: mapOf(meta.spellSchools),
    keywordById: mapOf(meta.keywords),
  };
}

/** The card's class slugs: primary + extra classes. For dual/multi-class cards Blizzard sends classId=null
 *  and the classes only come in multiClassIds; in that case the first class is treated as primary. */
function classSlugsOf(c: ApiCard, L: Lookups): string[] {
  const out: string[] = [];
  const push = (id: number | null | undefined) => {
    if (id === null || id === undefined) return;
    const slug = L.classById.get(id);
    if (slug && !out.includes(slug)) out.push(slug);
  };
  push(c.classId);
  for (const id of c.multiClassIds ?? []) push(id);
  if (!out.length) out.push(c.classId === null ? "unknown" : String(c.classId));
  return out;
}

export function normalizeCard(c: ApiCard, L: Lookups): CardRecord {
  const classes = classSlugsOf(c, L);
  const rarity = L.rarityById.get(c.rarityId) ?? { slug: "common" as Rarity, dust: 0 };
  const minionTypes = [
    ...(c.minionTypeId ? [c.minionTypeId] : []),
    ...(c.multiTypeIds ?? []),
  ]
    .map((id) => L.minionTypeById.get(id))
    .filter((s): s is string => !!s);

  const rec: CardRecord = {
    dbfId: c.id,
    slug: c.slug,
    name: c.name,
    text: stripCardText(c.text),
    cost: c.manaCost,
    type: L.typeById.get(c.cardTypeId) ?? String(c.cardTypeId),
    classSlug: classes[0],
    multiClass: classes.slice(1),
    rarity: rarity.slug,
    set: L.setById.get(c.cardSetId) ?? String(c.cardSetId),
    minionTypes: Array.from(new Set(minionTypes)),
    keywords: (c.keywordIds ?? [])
      .map((id) => L.keywordById.get(id))
      .filter((s): s is string => !!s),
    dust: rarity.dust,
    image: c.image,
  };
  if (c.attack !== undefined) rec.attack = c.attack;
  if (c.health !== undefined) rec.health = c.health;
  if (c.durability !== undefined) rec.durability = c.durability;
  if (c.armor !== undefined) rec.armor = c.armor;
  if (c.spellSchoolId) rec.spellSchool = L.spellSchoolById.get(c.spellSchoolId);
  if (c.runeCost && (c.runeCost.blood || c.runeCost.frost || c.runeCost.unholy)) rec.runeCost = c.runeCost;
  if (c.touristClassId) rec.touristClass = L.classById.get(c.touristClassId);
  if (c.maxSideboardCards) rec.maxSideboardCards = c.maxSideboardCards;
  if (c.cropImage) rec.cropImage = c.cropImage;
  return rec;
}

/** Reads the Standard set group from metadata; set lists are never hand-written.
 *  Blizzard already includes an announced but unreleased expansion (`sets[].hyped === true`) in the Standard group and
 *  the `set=standard` search; the game rejects codes containing those cards. Default: excluded. */
export function standardSetSlugs(meta: Metadata, opts: { includeUpcoming?: boolean } = {}): string[] {
  const group = meta.setGroups.find((g) => g.slug === "standard");
  if (!group) throw new Error("'standard' not found in metadata.setGroups");
  if (opts.includeUpcoming) return group.cardSets;
  const upcoming = new Set(meta.sets.filter((s) => s.hyped).map((s) => s.slug));
  return group.cardSets.filter((slug) => !upcoming.has(slug));
}

export function upcomingSetSlugs(meta: Metadata): string[] {
  return meta.sets.filter((s) => s.hyped).map((s) => s.slug);
}
