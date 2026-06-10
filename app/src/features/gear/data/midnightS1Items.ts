import type { EquipmentSlotKey } from "../domain/gearTypes";
import type { SecondaryStat, SpecKey } from "../domain/specGuides";

export type SeasonItemSourceType = "dungeon" | "raid" | "craft" | "delve" | "catalyst" | "vendor" | "unknown";
export type ArmorType = "cloth" | "leather" | "mail" | "plate";
export type CuratedRecommendationState = "recommended" | "needs_check" | "hidden" | "rejected" | "db_missing";
export type TrinketTier = "S" | "A" | "B" | "C" | "주의";
export type TrinketTierContentFocus = "mythic_plus" | "raid" | "balanced";
export type ItemUpgradeTrack = "veteran" | "champion" | "hero" | "myth";
export type ItemVariantSource = "mythic_plus_end" | "great_vault" | "raid_lfr" | "raid_normal" | "raid_heroic" | "raid_mythic" | "crafted";

export type ItemSourceReference = {
  name: "Wowhead" | "SeasonLoot" | "Blizzard" | "Manual";
  url: string;
  checkedAt: string;
  noteKo?: string;
};

export type SeasonItemVariant = {
  variantId: string;
  itemId: number;
  itemLevel: number;
  track: ItemUpgradeTrack;
  rank: number;
  maxRank: number;
  source: ItemVariantSource;
  keyLevel?: number;
  difficultyKo?: string;
  confidence: "high" | "medium" | "low";
  sourceRef: "wowhead-midnight-mplus-rewards" | "wowhead-raid-boss-guide" | "manual";
};

export type TrinketTierRecord = {
  itemId: number;
  specKey: SpecKey;
  tier: TrinketTier;
  contentFocus: TrinketTierContentFocus;
  confidence: "high" | "medium" | "low";
  needsSim: boolean;
  summaryKo: string;
  sources: Array<{
    name: "Wowhead" | "Method" | "MythicSim" | "SeasonLoot" | "Manual";
    url?: string;
    checkedAt?: string;
  }>;
};

export type SeasonItem = {
  itemId: number;
  nameKo: string;
  nameKoVerified: boolean;
  nameEn?: string;
  slot: EquipmentSlotKey;
  armorType?: ArmorType;
  weaponType?: "dagger" | "oneHandSword" | "oneHandAxe" | "warglaive" | "fistWeapon" | "staff" | "offHand" | "unknown";
  allowedClasses?: Array<"rogue" | "demon-hunter">;
  allowedSpecs?: SpecKey[];
  sourceType: SeasonItemSourceType;
  sourceNameKo: string;
  sourceNameEn?: string;
  sourceDungeonKey?: string;
  sourceRaidKey?: string;
  bossNameKo?: string;
  bossNameEn?: string;
  stats?: Partial<Record<SecondaryStat, true>>;
  recommendedStats?: SecondaryStat[];
  hasSpecialEffect?: boolean;
  specialEffectNote?: string;
  isTierPiece?: boolean;
  tierToken?: string;
  isCrafted?: boolean;
  professionKo?: string;
  embellishmentAllowed?: boolean;
  embellishmentNameKo?: string;
  wowheadUrl?: string;
  sourceRefs?: ItemSourceReference[];
  variants?: SeasonItemVariant[];
  uniqueEquipGroup?: string;
  setBonusKey?: string;
  isSeasonalReward?: boolean;
  season: "midnight-s1";
  confidence: "high" | "medium" | "low";
  recommendationState: CuratedRecommendationState;
  trinketTier?: TrinketTierRecord;
  tags?: Array<"bisCandidate" | "strongCandidate" | "backupCandidate" | "statStick" | "specialEffect" | "craftedOption" | "needsSim">;
  note?: string;
};

export const midnightS1MythicPlusItemLevelTable = [
  { keyLevel: 2, endItemLevel: 250, endTrack: "champion", endRank: 2, vaultItemLevel: 259, vaultTrack: "hero", vaultRank: 1 },
  { keyLevel: 3, endItemLevel: 250, endTrack: "champion", endRank: 2, vaultItemLevel: 259, vaultTrack: "hero", vaultRank: 1 },
  { keyLevel: 4, endItemLevel: 253, endTrack: "champion", endRank: 3, vaultItemLevel: 263, vaultTrack: "hero", vaultRank: 2 },
  { keyLevel: 5, endItemLevel: 256, endTrack: "champion", endRank: 4, vaultItemLevel: 263, vaultTrack: "hero", vaultRank: 2 },
  { keyLevel: 6, endItemLevel: 259, endTrack: "hero", endRank: 1, vaultItemLevel: 266, vaultTrack: "hero", vaultRank: 3 },
  { keyLevel: 7, endItemLevel: 259, endTrack: "hero", endRank: 1, vaultItemLevel: 269, vaultTrack: "hero", vaultRank: 4 },
  { keyLevel: 8, endItemLevel: 263, endTrack: "hero", endRank: 2, vaultItemLevel: 269, vaultTrack: "hero", vaultRank: 4 },
  { keyLevel: 9, endItemLevel: 263, endTrack: "hero", endRank: 2, vaultItemLevel: 269, vaultTrack: "hero", vaultRank: 4 },
  { keyLevel: 10, endItemLevel: 266, endTrack: "hero", endRank: 3, vaultItemLevel: 272, vaultTrack: "myth", vaultRank: 1 },
  { keyLevel: 11, endItemLevel: 266, endTrack: "hero", endRank: 3, vaultItemLevel: 272, vaultTrack: "myth", vaultRank: 1 },
  { keyLevel: 12, endItemLevel: 266, endTrack: "hero", endRank: 3, vaultItemLevel: 272, vaultTrack: "myth", vaultRank: 1 },
] as const;

export const midnightS1RaidItemLevelTable = [
  { difficultyKo: "공격대 찾기", itemLevel: 240, track: "veteran", rank: 3 },
  { difficultyKo: "일반", itemLevel: 253, track: "champion", rank: 3 },
  { difficultyKo: "영웅", itemLevel: 266, track: "hero", rank: 3 },
  { difficultyKo: "신화", itemLevel: 279, track: "myth", rank: 3 },
] as const;

const mythicPlusVariants = (itemId: number): SeasonItemVariant[] => midnightS1MythicPlusItemLevelTable.flatMap((row) => [
  {
    variantId: `${itemId}:mplus-${row.keyLevel}-end`,
    itemId,
    itemLevel: row.endItemLevel,
    track: row.endTrack,
    rank: row.endRank,
    maxRank: 6,
    source: "mythic_plus_end",
    keyLevel: row.keyLevel,
    confidence: "high",
    sourceRef: "wowhead-midnight-mplus-rewards",
  },
  {
    variantId: `${itemId}:mplus-${row.keyLevel}-vault`,
    itemId,
    itemLevel: row.vaultItemLevel,
    track: row.vaultTrack,
    rank: row.vaultRank,
    maxRank: 6,
    source: "great_vault",
    keyLevel: row.keyLevel,
    confidence: "high",
    sourceRef: "wowhead-midnight-mplus-rewards",
  },
]);

const raidVariants = (itemId: number): SeasonItemVariant[] => midnightS1RaidItemLevelTable.map((row) => ({
  variantId: `${itemId}:raid-${row.track}`,
  itemId,
  itemLevel: row.itemLevel,
  track: row.track,
  rank: row.rank,
  maxRank: 6,
  source: row.track === "veteran" ? "raid_lfr" : row.track === "champion" ? "raid_normal" : row.track === "hero" ? "raid_heroic" : "raid_mythic",
  difficultyKo: row.difficultyKo,
  confidence: "medium",
  sourceRef: "wowhead-raid-boss-guide",
}));

const wowheadItemRef = (itemId: number, checkedAt = "2026-06-10"): ItemSourceReference => ({
  name: "Wowhead",
  url: `https://www.wowhead.com/item=${itemId}`,
  checkedAt,
});

const seasonLootRef: ItemSourceReference = {
  name: "SeasonLoot",
  url: "https://seasonloot.com/rogue/",
  checkedAt: "2026-06-10",
  noteKo: "도적용 전체 슬롯/출처 목록 대조용입니다. itemId는 Wowhead 개별 페이지로 확인합니다.",
};

export const trinketTierRecords: TrinketTierRecord[] = [
  {
    itemId: 249343,
    specKey: "rogue-assassination",
    tier: "주의",
    contentFocus: "raid",
    confidence: "medium",
    needsSim: true,
    summaryKo: "레이드 출처 비교 후보입니다. 레이드 제외/던전+제작 기준에서는 기본 추천하지 않고, 실제 장신구 교체는 SimC 확인이 필요합니다.",
    sources: [
      { name: "Manual", checkedAt: "2026-05-20" },
      { name: "Wowhead", url: "https://www.wowhead.com/ko/guide/classes/rogue/assassination/bis-gear", checkedAt: "2026-05-20" },
    ],
  },
];

export const midnightS1Items: SeasonItem[] = [
  {
    itemId: 237837,
    nameKo: "원정순찰대원의 자비",
    nameKoVerified: true,
    slot: "OFF_HAND",
    weaponType: "offHand",
    allowedClasses: ["rogue"],
    sourceType: "craft",
    sourceNameKo: "전문기술 제작",
    isCrafted: true,
    professionKo: "제작 주문",
    recommendedStats: ["crit", "haste"],
    embellishmentAllowed: true,
    season: "midnight-s1",
    confidence: "high",
    recommendationState: "recommended",
    tags: ["craftedOption", "strongCandidate"],
    note: "현재 프로젝트에서 수동 검수된 제작 보조무기 후보입니다. 이미 장착 중이면 추천에서 제외합니다.",
  },
  {
    itemId: 244576,
    nameKo: "실버문 요원의 굴절보호대",
    nameKoVerified: true,
    slot: "WRIST",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "craft",
    sourceNameKo: "전문기술 제작",
    isCrafted: true,
    professionKo: "가죽세공",
    recommendedStats: ["mastery", "haste"],
    embellishmentAllowed: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["craftedOption"],
    note: "제작 전 현재 손목 마법부여와 대체 후보를 함께 확인합니다.",
  },
  {
    itemId: 249343,
    nameKo: "알른 선견자의 응시",
    nameKoVerified: true,
    slot: "TRINKET_1",
    sourceType: "raid",
    sourceNameKo: "한밤 시즌1 레이드",
    sourceRaidKey: "midnight-s1-raid",
    bossNameKo: "키마이루스",
    hasSpecialEffect: true,
    specialEffectNote: "장신구는 단순 보조 능력치 점수로 확정하지 않고 실제 효과와 시뮬레이션을 확인합니다.",
    wowheadUrl: "https://www.wowhead.com/item=249343",
    sourceRefs: [wowheadItemRef(249343)],
    variants: raidVariants(249343),
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    trinketTier: {
      ...trinketTierRecords[0],
      tier: "주의",
      contentFocus: "raid",
      confidence: "medium",
      needsSim: true,
      summaryKo: "레이드 출처 비교 후보입니다. 레이드 제외/던전+제작 기준에서는 기본 추천하지 않고, 실제 장신구 교체는 SimC 확인이 필요합니다.",
      sources: [
        { name: "Manual", checkedAt: "2026-05-20" },
        { name: "Wowhead", url: "https://www.wowhead.com/ko/guide/classes/rogue/assassination/bis-gear", checkedAt: "2026-05-20" },
      ],
    },
    tags: ["specialEffect", "needsSim"],
    note: "레이드 제외 모드에서는 추천하지 않는 비교 후보입니다.",
  },
  {
    itemId: 251109,
    nameKo: "스펠스냅 그림자가면",
    nameKoVerified: false,
    nameEn: "Spellsnap Shadowmask",
    slot: "HEAD",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "마법학자의 정원",
    sourceNameEn: "Magisters' Terrace",
    sourceDungeonKey: "magisters",
    bossNameKo: "세라넬 선래시",
    bossNameEn: "Seranel Sunlash",
    stats: { crit: true, mastery: true },
    wowheadUrl: "https://www.wowhead.com/item=251109",
    sourceRefs: [wowheadItemRef(251109), seasonLootRef],
    variants: mythicPlusVariants(251109),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "Wowhead 개별 아이템 페이지 기준으로 itemId와 출처를 확인했습니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 251177,
    nameKo: "악취나는 썩은 왕관",
    nameKoVerified: false,
    nameEn: "Fetid Vilecrown",
    slot: "HEAD",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "마이사라 동굴",
    sourceNameEn: "Maisara Caverns",
    sourceDungeonKey: "maisara",
    bossNameKo: "라크툴",
    bossNameEn: "Rak'tul",
    stats: { crit: true, versatility: true },
    wowheadUrl: "https://www.wowhead.com/item=251177",
    sourceRefs: [wowheadItemRef(251177), seasonLootRef],
    variants: mythicPlusVariants(251177),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "Wowhead 개별 아이템 페이지 기준으로 itemId와 출처를 확인했습니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 251216,
    nameKo: "저주받은 조끼",
    nameKoVerified: false,
    nameEn: "Maledict Vest",
    slot: "CHEST",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "연결지점 제나스",
    sourceNameEn: "Nexus-Point Xenas",
    sourceDungeonKey: "xenas",
    bossNameKo: "로트락시온",
    bossNameEn: "Lothraxion",
    stats: { haste: true, mastery: true },
    wowheadUrl: "https://www.wowhead.com/item=251216",
    sourceRefs: [wowheadItemRef(251216), seasonLootRef],
    variants: mythicPlusVariants(251216),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "Wowhead 개별 아이템 페이지 기준으로 itemId와 출처를 확인했습니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 251082,
    nameKo: "스냅덩굴 허리띠",
    nameKoVerified: false,
    nameEn: "Snapvine Cinch",
    slot: "WAIST",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "윈드러너 첨탑",
    sourceNameEn: "Windrunner Spire",
    sourceDungeonKey: "windrunner",
    bossNameKo: "엠버돈",
    bossNameEn: "Emberdawn",
    stats: { crit: true, mastery: true },
    wowheadUrl: "https://www.wowhead.com/item=251082",
    sourceRefs: [wowheadItemRef(251082), seasonLootRef],
    variants: mythicPlusVariants(251082),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "Wowhead 개별 아이템 페이지 기준으로 itemId와 출처를 확인했습니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 251087,
    nameKo: "머무는 유산의 다리싸개",
    nameKoVerified: false,
    nameEn: "Legwraps of Lingering Legacies",
    slot: "LEGS",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "윈드러너 첨탑",
    sourceNameEn: "Windrunner Spire",
    sourceDungeonKey: "windrunner",
    bossNameKo: "칼리스",
    bossNameEn: "Kalis",
    stats: { crit: true, haste: true },
    wowheadUrl: "https://www.wowhead.com/item=251087",
    sourceRefs: [wowheadItemRef(251087), seasonLootRef],
    variants: mythicPlusVariants(251087),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "Wowhead 개별 아이템 페이지 기준으로 itemId와 출처를 확인했습니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 251212,
    nameKo: "찬란한 절단검",
    nameKoVerified: false,
    nameEn: "Radiant Slicer",
    slot: "MAIN_HAND",
    weaponType: "dagger",
    allowedClasses: ["rogue"],
    sourceType: "dungeon",
    sourceNameKo: "연결지점 제나스",
    sourceNameEn: "Nexus-Point Xenas",
    sourceDungeonKey: "xenas",
    bossNameKo: "로트락시온",
    bossNameEn: "Lothraxion",
    stats: { haste: true, versatility: true },
    wowheadUrl: "https://www.wowhead.com/item=251212",
    sourceRefs: [wowheadItemRef(251212), seasonLootRef],
    variants: mythicPlusVariants(251212),
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    tags: ["backupCandidate"],
    note: "도적 전용 무기 후보입니다. 한국어 공식 아이템명은 추가 검수 전까지 확정 추천하지 않습니다.",
  },
  {
    itemId: 250256,
    nameKo: "바람의 심장",
    nameKoVerified: false,
    nameEn: "Heart of Wind",
    slot: "TRINKET_1",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "윈드러너 첨탑",
    sourceNameEn: "Windrunner Spire",
    sourceDungeonKey: "windrunner",
    bossNameKo: "불안정한 심장",
    bossNameEn: "Restless Heart",
    hasSpecialEffect: true,
    specialEffectNote: "가속 관련 발동형 장신구로 보이며, 직업/특성별 실제 가치는 SimC 확인이 필요합니다.",
    wowheadUrl: "https://www.wowhead.com/item=250256",
    sourceRefs: [wowheadItemRef(250256), seasonLootRef],
    variants: mythicPlusVariants(250256),
    uniqueEquipGroup: "trinket-250256",
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    trinketTier: {
      itemId: 250256,
      specKey: "rogue-outlaw",
      tier: "주의",
      contentFocus: "mythic_plus",
      confidence: "medium",
      needsSim: true,
      summaryKo: "쐐기 출처 장신구 후보입니다. 발동 효과 중심이라 전문화별 SimC 확인 전에는 확정 추천하지 않습니다.",
      sources: [
        { name: "Wowhead", url: "https://www.wowhead.com/item=250256", checkedAt: "2026-06-10" },
        { name: "SeasonLoot", url: "https://seasonloot.com/rogue/", checkedAt: "2026-06-10" },
      ],
    },
    tags: ["specialEffect", "needsSim"],
    note: "장신구는 티어/효과/실제 전투 상황 차이가 커서 기본 추천이 아니라 확인 후보로만 표시합니다.",
  },
  {
    itemId: 250227,
    nameKo: "크롤루크의 전투깃발",
    nameKoVerified: false,
    nameEn: "Kroluk's Warbanner",
    slot: "TRINKET_2",
    allowedClasses: ["rogue", "demon-hunter"],
    sourceType: "dungeon",
    sourceNameKo: "윈드러너 첨탑",
    sourceNameEn: "Windrunner Spire",
    sourceDungeonKey: "windrunner",
    bossNameKo: "사령관 크롤루크",
    bossNameEn: "Commander Kroluk",
    hasSpecialEffect: true,
    specialEffectNote: "근접 공격 기반 발동형 장신구로 보이며, 전문화별 실제 가치는 SimC 확인이 필요합니다.",
    wowheadUrl: "https://www.wowhead.com/item=250227",
    sourceRefs: [wowheadItemRef(250227), seasonLootRef],
    variants: mythicPlusVariants(250227),
    uniqueEquipGroup: "trinket-250227",
    isSeasonalReward: true,
    season: "midnight-s1",
    confidence: "medium",
    recommendationState: "needs_check",
    trinketTier: {
      itemId: 250227,
      specKey: "rogue-outlaw",
      tier: "주의",
      contentFocus: "mythic_plus",
      confidence: "medium",
      needsSim: true,
      summaryKo: "쐐기 출처 장신구 후보입니다. 근접 발동 효과라 전문화/전투 시간에 따라 가치가 크게 달라질 수 있습니다.",
      sources: [
        { name: "Wowhead", url: "https://www.wowhead.com/item=250227", checkedAt: "2026-06-10" },
        { name: "SeasonLoot", url: "https://seasonloot.com/rogue/", checkedAt: "2026-06-10" },
      ],
    },
    tags: ["specialEffect", "needsSim"],
    note: "장신구는 티어/효과/실제 전투 상황 차이가 커서 기본 추천이 아니라 확인 후보로만 표시합니다.",
  },
];

export const midnightS1ItemLevelNotes = {
  mythicPlus: "쐐기 종료 보상과 위대한 금고 템렙은 실제 한밤 시즌1 테이블 확인 후 표시합니다.",
  raid: "공격대 난이도별 템렙은 검증 전까지 UI에서 확정값처럼 보여주지 않습니다.",
  crafted: "제작템은 품질, 문장, 불꽃, 제작 옵션에 따라 실제 템렙과 가치가 달라집니다.",
};

