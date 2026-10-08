// Testler için küçük sahte metadata + kart seti. Gerçek şekli taklit eder; değerler temsilîdir.
import type { ApiCard, Metadata } from "@/lib/blizzard/types";

export const META: Metadata = {
  sets: [
    { id: 1, slug: "core", name: "Core" },
    { id: 2, slug: "whizbangs-workshop", name: "Whizbang's Workshop" },
    { id: 3, slug: "old-set", name: "Old Set" },
  ],
  setGroups: [
    { slug: "standard", name: "Standard", cardSets: ["core", "whizbangs-workshop"], standard: true },
    { slug: "wild", name: "Wild", cardSets: ["core", "whizbangs-workshop", "old-set"] },
  ],
  types: [
    { id: 3, slug: "hero", name: "Hero" },
    { id: 4, slug: "minion", name: "Minion" },
    { id: 5, slug: "spell", name: "Spell" },
    { id: 7, slug: "weapon", name: "Weapon" },
    { id: 39, slug: "location", name: "Location" },
  ],
  rarities: [
    { id: 1, slug: "common", name: "Common", craftingCost: [40, 400], dustValue: [5, 50] },
    { id: 3, slug: "rare", name: "Rare", craftingCost: [100, 800], dustValue: [20, 100] },
    { id: 4, slug: "epic", name: "Epic", craftingCost: [400, 1600], dustValue: [100, 400] },
    { id: 5, slug: "legendary", name: "Legendary", craftingCost: [1600, 3200], dustValue: [400, 1600] },
  ],
  classes: [
    { id: 7, slug: "shaman", name: "Shaman", cardId: 1066 },
    { id: 4, slug: "mage", name: "Mage", cardId: 637 },
    { id: 12, slug: "neutral", name: "Neutral" },
  ],
  minionTypes: [
    { id: 14, slug: "murloc", name: "Murloc" },
    { id: 18, slug: "elemental", name: "Elemental" },
  ],
  spellSchools: [{ id: 5, slug: "nature", name: "Nature" }],
  keywords: [
    { id: 8, slug: "battlecry\n", name: "Battlecry" },
    { id: 1, slug: "taunt", name: "Taunt" },
  ],
};

export const RAW: ApiCard[] = [
  {
    id: 61550, collectible: 1, slug: "61550-shudderwock", classId: 7, multiClassIds: [],
    cardTypeId: 4, cardSetId: 1, rarityId: 5, manaCost: 9, attack: 6, health: 6,
    name: "Shudderwock",
    text: "<b>Battlecry:</b> Repeat all other <b>Battlecries</b>\nfrom cards you played this game <i>(targets chosen randomly)</i>.",
    image: "https://img/61550.png", cropImage: "https://img/crop/61550.png", keywordIds: [8],
  },
  {
    id: 100, collectible: 1, slug: "100-murloc-tidecaller", classId: 12, multiClassIds: [],
    cardTypeId: 4, cardSetId: 2, rarityId: 3, manaCost: 1, attack: 1, health: 2,
    name: "Murloc Tidecaller", text: "Whenever you summon a Murloc, gain +1 Attack.",
    image: "https://img/100.png", minionTypeId: 14,
  },
  {
    id: 200, collectible: 1, slug: "200-lightning-bolt", classId: 7, multiClassIds: [],
    cardTypeId: 5, cardSetId: 1, rarityId: 1, manaCost: 1, name: "Lightning Bolt",
    text: "Deal $3 damage. <b>Overload:</b> (1)", image: "https://img/200.png", spellSchoolId: 5,
  },
  {
    id: 300, collectible: 1, slug: "300-dual", classId: 4, multiClassIds: [4, 7],
    cardTypeId: 4, cardSetId: 2, rarityId: 4, manaCost: 3, attack: 3, health: 3,
    name: "Dual Elemental", text: "", image: "https://img/300.png", minionTypeId: 18,
  },
  {
    id: 400, collectible: 1, slug: "400-old-card", classId: 12, multiClassIds: [],
    cardTypeId: 4, cardSetId: 3, rarityId: 1, manaCost: 2, attack: 2, health: 2,
    name: "Old Card", text: "", image: "https://img/400.png",
  },
  {
    id: 600, collectible: 1, slug: "600-voodoo-totem", classId: null, multiClassIds: [4, 7],
    cardTypeId: 4, cardSetId: 2, rarityId: 1, manaCost: 2, attack: 1, health: 3,
    name: "Dual Null", text: "", image: "https://img/600.png",
  },
  {
    id: 500, collectible: 1, slug: "500-frostmourne", classId: 4, multiClassIds: [],
    cardTypeId: 7, cardSetId: 1, rarityId: 4, manaCost: 7, attack: 5, durability: 3,
    name: "Big Weapon", text: "", image: "https://img/500.png", runeCost: { blood: 0, frost: 2, unholy: 0 },
  },
];
