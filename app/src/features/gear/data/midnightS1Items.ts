import type { EquipmentSlotKey } from "../domain/gearTypes";
import type { SecondaryStat, SpecKey } from "../domain/specGuides";

export type SeasonItemSourceType = "dungeon" | "raid" | "craft" | "delve" | "catalyst" | "vendor" | "unknown";
export type ArmorType = "cloth" | "leather" | "mail" | "plate";
export type GearClassKey = "rogue" | "demon-hunter";
export type GearUpgradeTrack = "veteran" | "champion" | "hero" | "myth" | "crafted";
export type TrinketTier = "S" | "A" | "B" | "C" | "주의";
export type GearContentFocus = "raid" | "mythic_plus" | "cleave" | "single_target" | "overall";

export type ItemVariant = {
  variantId: string;
  itemId: number;
  track: GearUpgradeTrack;
  rank: number;
  maxRank: number;
  itemLevel: number;
  sourceType: SeasonItemSourceType;
  sourceDifficultyKo: string;
  bonusIds?: number[];
  isVault?: boolean;
  isUpgradeable: boolean;
  upgradeCurrencyKo?: string;
  confidence: "high" | "medium" | "low";
};

export type TrinketTierRecord = {
  itemId: number;
  specKey: SpecKey;
  tier: TrinketTier;
  contentFocus: GearContentFocus;
  confidence: "high" | "medium" | "low";
  sources: Array<{
    name: "Wowhead" | "Method" | "MythicSim" | "SeasonLoot" | "Mythicstats" | "SimulationCraft";
    url: string;
  }>;
  notesKo: string;
  needsSim?: boolean;
};

export type ItemRecord = {
  itemId: number;
  nameKo: string;
  nameEn?: string;
  iconUrl?: string;
  slot: EquipmentSlotKey;
  armorType?: ArmorType;
  weaponType?: "dagger" | "oneHandSword" | "oneHandAxe" | "warglaive" | "fistWeapon" | "staff" | "offHand" | "unknown";
  allowedClasses: GearClassKey[];
  allowedSpecs?: SpecKey[];
  shareScope: "shared_leather" | "shared_jewelry" | "shared_trinket" | "rogue_weapon" | "devourer_weapon" | "class_tier" | "crafted_shared";
  sourceType: SeasonItemSourceType;
  sourceNameKo: string;
  sourceNameEn?: string;
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
  season: "midnight-s1";
  confidence: "high" | "medium" | "low";
  tags?: Array<"bisCandidate" | "strongCandidate" | "backupCandidate" | "statStick" | "specialEffect" | "craftedOption" | "needsSim">;
  variants: ItemVariant[];
  trinketTiers?: TrinketTierRecord[];
  note?: string;
};

export type SeasonItem = Omit<ItemRecord, "variants" | "trinketTiers"> & {
  variants: ItemVariant[];
  trinketTiers?: TrinketTierRecord[];
};

export const upgradeTrackItemLevels: Record<GearUpgradeTrack, number[]> = {
  veteran: [233, 236, 239, 243, 246, 250],
  champion: [246, 250, 253, 256, 259, 263],
  hero: [259, 263, 266, 269, 272, 276],
  myth: [272, 276, 279, 282, 285, 289],
  crafted: [259, 263, 266, 269, 272, 276],
};

export const upgradeTrackLabelKo: Record<GearUpgradeTrack, string> = {
  veteran: "베테랑",
  champion: "챔피언",
  hero: "영웅",
  myth: "신화",
  crafted: "제작",
};

function variants(itemId: number, sourceType: SeasonItemSourceType, tracks: GearUpgradeTrack[], confidence: ItemVariant["confidence"] = "medium"): ItemVariant[] {
  return tracks.flatMap((track) => upgradeTrackItemLevels[track].map((itemLevel, index) => {
    const rank = index + 1;
    return {
      variantId: `${itemId}:${track}:${rank}:${itemLevel}`,
      itemId,
      track,
      rank,
      maxRank: upgradeTrackItemLevels[track].length,
      itemLevel,
      sourceType,
      sourceDifficultyKo: `${upgradeTrackLabelKo[track]} ${rank}/${upgradeTrackItemLevels[track].length}`,
      isUpgradeable: rank < upgradeTrackItemLevels[track].length,
      upgradeCurrencyKo: track === "crafted" ? "불꽃/문장 확인" : "Dawncrest",
      confidence,
    };
  }));
}

const wowheadRogue = "https://www.wowhead.com/guide/classes/rogue/assassination/overview-pve-dps";
const wowheadOutlaw = "https://www.wowhead.com/guide/classes/rogue/outlaw/bis-gear";
const wowheadDevourer = "https://www.wowhead.com/guide/classes/demon-hunter/devourer/bis-gear";
const methodAssassination = "https://www.method.gg/guides/assassination-rogue/gearing";
const methodOutlaw = "https://www.method.gg/guides/outlaw-rogue/gearing";
const mythicSimSubtlety = "https://mythicsim.com/best-trinkets/subtlety-rogue";
const seasonLootRogue = "https://seasonloot.com/rogue/";

function tier(itemId: number, specKey: SpecKey, tierValue: TrinketTier, contentFocus: GearContentFocus, notesKo: string, sources: TrinketTierRecord["sources"], confidence: TrinketTierRecord["confidence"] = "medium", needsSim = true): TrinketTierRecord {
  return { itemId, specKey, tier: tierValue, contentFocus, notesKo, sources, confidence, needsSim };
}

export const midnightS1ItemRecords: ItemRecord[] = [
  {
    itemId: 237837,
    nameKo: "원정순찰대원의 자비",
    nameEn: "Farstrider's Mercy",
    slot: "OFF_HAND",
    weaponType: "dagger",
    allowedClasses: ["rogue"],
    allowedSpecs: ["rogue-assassination", "rogue-subtlety"],
    shareScope: "rogue_weapon",
    sourceType: "craft",
    sourceNameKo: "전문기술 제작",
    isCrafted: true,
    professionKo: "제작 주문",
    recommendedStats: ["crit", "haste"],
    embellishmentAllowed: true,
    season: "midnight-s1",
    confidence: "high",
    tags: ["craftedOption", "strongCandidate"],
    variants: variants(237837, "craft", ["crafted"], "high"),
    note: "도적 전용 제작 무기 후보입니다. 암살/잠행은 무기 강화 우선순위가 높습니다.",
  },
  {
    itemId: 244576,
    nameKo: "실버문 요원의 굴절보호대",
    nameEn: "Silvermoon Agent's Deflectors",
    slot: "WRIST",
    armorType: "leather",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "crafted_shared",
    sourceType: "craft",
    sourceNameKo: "전문기술 제작",
    isCrafted: true,
    professionKo: "가죽세공",
    recommendedStats: ["mastery", "haste"],
    embellishmentAllowed: true,
    season: "midnight-s1",
    confidence: "medium",
    tags: ["craftedOption"],
    variants: variants(244576, "craft", ["crafted"], "medium"),
    note: "도적과 Devourer가 공유 가능한 가죽 제작 후보입니다.",
  },
  {
    itemId: 193708,
    nameKo: "플래티넘 별 고리",
    nameEn: "Platinum Star Band",
    slot: "FINGER_1",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_jewelry",
    sourceType: "dungeon",
    sourceNameKo: "알게타르 대학",
    sourceNameEn: "Algeth'ar Academy",
    stats: { crit: true, mastery: true },
    season: "midnight-s1",
    confidence: "medium",
    tags: ["strongCandidate"],
    variants: variants(193708, "dungeon", ["champion", "hero", "myth"], "medium"),
    note: "SimulationCraft 예시 프로필과 시즌 던전 표에서 확인되는 공유 반지 후보입니다.",
  },
  {
    itemId: 249919,
    nameKo: "신도레이 희망의 고리",
    nameEn: "Sin'dorei Band of Hope",
    slot: "FINGER_2",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_jewelry",
    sourceType: "raid",
    sourceNameKo: "한밤 시즌1 레이드",
    bossNameKo: "벨로렌",
    stats: { crit: true, mastery: true },
    season: "midnight-s1",
    confidence: "medium",
    tags: ["strongCandidate"],
    variants: variants(249919, "raid", ["champion", "hero", "myth"], "medium"),
    note: "SimulationCraft 예시 프로필에서 확인되는 공유 반지 후보입니다.",
  },
  {
    itemId: 249343,
    nameKo: "알른 선견자의 응시",
    nameEn: "Gaze of the Alnseer",
    slot: "TRINKET_1",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "raid",
    sourceNameKo: "꿈의 균열",
    sourceNameEn: "The Dreamrift",
    bossNameKo: "키마이루스",
    stats: { mastery: true },
    hasSpecialEffect: true,
    specialEffectNote: "여러 도적/민첩 전문화에서 강하게 언급되지만 실제 착용 조합은 시뮬레이션 확인이 필요합니다.",
    season: "midnight-s1",
    confidence: "high",
    tags: ["specialEffect", "needsSim", "bisCandidate"],
    variants: variants(249343, "raid", ["veteran", "champion", "hero", "myth"], "high"),
    trinketTiers: [
      tier(249343, "rogue-assassination", "S", "overall", "Method 암살 가이드와 Wowhead/SimC 계열 자료에서 최상위권으로 반복 확인됩니다.", [{ name: "Method", url: methodAssassination }, { name: "Wowhead", url: wowheadRogue }, { name: "SimulationCraft", url: "https://simulationcraft.org/reports/MID1_Raid.html" }], "high"),
      tier(249343, "rogue-subtlety", "S", "cleave", "MythicSim 잠행 기준 상위권 장신구입니다.", [{ name: "MythicSim", url: mythicSimSubtlety }, { name: "SeasonLoot", url: seasonLootRogue }], "high"),
      tier(249343, "rogue-outlaw", "A", "overall", "무법은 수동 사용 장신구보다 패시브/발동형 선호가 있어 A로 보수 배치합니다.", [{ name: "Wowhead", url: wowheadOutlaw }, { name: "Method", url: methodOutlaw }], "medium"),
      tier(249343, "demon-hunter-devourer", "A", "overall", "Devourer 계열 자료에서 강한 공유 장신구로 확인되지만 개인 빌드별 시뮬레이션이 필요합니다.", [{ name: "Wowhead", url: wowheadDevourer }, { name: "Mythicstats", url: "https://mythicstats.com/spec/devourer-demon-hunter" }], "medium"),
    ],
    note: "장신구는 티어가 높아도 현재 착용 조합과 전투 스타일에 따라 결과가 달라집니다.",
  },
  {
    itemId: 193701,
    nameKo: "알게타르 수수께끼 상자",
    nameEn: "Algeth'ar Puzzle Box",
    slot: "TRINKET_2",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "dungeon",
    sourceNameKo: "알게타르 대학",
    sourceNameEn: "Algeth'ar Academy",
    hasSpecialEffect: true,
    specialEffectNote: "강력한 사용 효과 후보지만 채널링/사용 타이밍 스트레스가 있어 선호도가 갈릴 수 있습니다.",
    season: "midnight-s1",
    confidence: "high",
    tags: ["specialEffect", "needsSim", "strongCandidate"],
    variants: variants(193701, "dungeon", ["champion", "hero", "myth"], "high"),
    trinketTiers: [
      tier(193701, "rogue-assassination", "S", "overall", "Method 암살 가이드에서 최상위권으로 언급되지만 사용 채널링 부담이 있습니다.", [{ name: "Method", url: methodAssassination }, { name: "Wowhead", url: wowheadRogue }], "high"),
      tier(193701, "rogue-subtlety", "A", "cleave", "MythicSim 잠행 순위에서 상위권이나 사용 타이밍 확인이 필요합니다.", [{ name: "MythicSim", url: mythicSimSubtlety }, { name: "SeasonLoot", url: seasonLootRogue }], "medium"),
      tier(193701, "rogue-outlaw", "B", "overall", "무법은 큰 쿨기 정렬형 장신구 가치가 낮을 수 있어 보수적으로 둡니다.", [{ name: "Wowhead", url: wowheadOutlaw }, { name: "Method", url: methodOutlaw }], "medium"),
    ],
    note: "같은 아이템이라도 고단 금고/신화 variant와 낮은 단계 드랍의 가치 차이가 큽니다.",
  },
  {
    itemId: 249806,
    nameKo: "순찰대장의 찬란한 휘장",
    nameEn: "Ranger-Captain's Iridescent Insignia",
    slot: "TRINKET_1",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "raid",
    sourceNameKo: "공허 첨탑",
    sourceNameEn: "The Voidspire",
    bossNameKo: "우주의 왕관",
    hasSpecialEffect: true,
    specialEffectNote: "치명타와 상호작용하는 사용 효과라 전문화별 가치 차이가 큽니다.",
    season: "midnight-s1",
    confidence: "medium",
    tags: ["specialEffect", "needsSim", "strongCandidate"],
    variants: variants(249806, "raid", ["veteran", "champion", "hero", "myth"], "medium"),
    trinketTiers: [
      tier(249806, "rogue-subtlety", "S", "cleave", "MythicSim 잠행 상위 3개 후보로 확인됩니다.", [{ name: "MythicSim", url: mythicSimSubtlety }, { name: "SeasonLoot", url: seasonLootRogue }], "high"),
      tier(249806, "rogue-assassination", "A", "overall", "Wowhead/SeasonLoot 계열에서 반복 노출되는 민첩 장신구 후보입니다.", [{ name: "Wowhead", url: wowheadRogue }, { name: "SeasonLoot", url: seasonLootRogue }], "medium"),
      tier(249806, "rogue-outlaw", "A", "overall", "무법은 발동형 장신구를 선호하는 편이라 상위 대체 후보로 둡니다.", [{ name: "Wowhead", url: wowheadOutlaw }, { name: "SeasonLoot", url: seasonLootRogue }], "medium"),
    ],
    note: "아이템 ID와 출처는 외부 표를 대조한 수동 검수 후보입니다.",
  },
  {
    itemId: 250256,
    nameKo: "잿불날개 깃털",
    nameEn: "Emberwing Feather",
    slot: "TRINKET_2",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "dungeon",
    sourceNameKo: "윈드러너 첨탑",
    sourceNameEn: "Windrunner Spire",
    hasSpecialEffect: true,
    specialEffectNote: "여러 전문화에서 좋은 던전 장신구로 언급되지만 구현/효과 검증 상태를 함께 봅니다.",
    season: "midnight-s1",
    confidence: "medium",
    tags: ["specialEffect", "needsSim", "strongCandidate"],
    variants: variants(250256, "dungeon", ["champion", "hero", "myth"], "medium"),
    trinketTiers: [
      tier(250256, "rogue-subtlety", "A", "cleave", "MythicSim 잠행 상위권 후보입니다.", [{ name: "MythicSim", url: mythicSimSubtlety }, { name: "SeasonLoot", url: seasonLootRogue }], "medium"),
      tier(250256, "demon-hunter-devourer", "A", "overall", "Devourer와 여러 캐스터/하이브리드 자료에서 반복 등장하는 장신구입니다.", [{ name: "Wowhead", url: wowheadDevourer }, { name: "Mythicstats", url: "https://mythicstats.com/spec/devourer-demon-hunter" }], "medium"),
      tier(250256, "rogue-outlaw", "A", "overall", "무법의 proc 선호와 맞는 대체 후보로 둡니다.", [{ name: "Method", url: methodOutlaw }, { name: "Wowhead", url: wowheadOutlaw }], "medium"),
    ],
    note: "장신구 효과 구현 상태와 실제 캐릭터 장비 조합을 반드시 확인합니다.",
  },
  {
    itemId: 250144,
    nameKo: "찬란한 깃털",
    nameEn: "Radiant Plume",
    slot: "TRINKET_1",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "raid",
    sourceNameKo: "쿠엘다나스 진군",
    sourceNameEn: "The March on Quel'Danas",
    hasSpecialEffect: true,
    specialEffectNote: "Method 암살 자료에서 좋은 대체 후보로 언급되며, 전문화별 티어는 중간 신뢰도로 둡니다.",
    season: "midnight-s1",
    confidence: "medium",
    tags: ["specialEffect", "needsSim", "backupCandidate"],
    variants: variants(250144, "raid", ["champion", "hero", "myth"], "medium"),
    trinketTiers: [
      tier(250144, "rogue-assassination", "A", "overall", "Method 암살 가이드에서 Puzzle Box 대체 후보로 언급됩니다.", [{ name: "Method", url: methodAssassination }], "medium"),
      tier(250144, "demon-hunter-devourer", "B", "overall", "Devourer 자료에서 후보로 보이나 출처별 우선순위가 갈립니다.", [{ name: "Wowhead", url: wowheadDevourer }, { name: "Mythicstats", url: "https://mythicstats.com/spec/devourer-demon-hunter" }], "medium"),
    ],
    note: "Radiant/Umbral 계열은 실제 효과와 스탯 선택을 같이 확인합니다.",
  },
  {
    itemId: 260235,
    nameKo: "공허 추적자의 계약서",
    nameEn: "Void Stalker's Contract",
    slot: "TRINKET_2",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "dungeon",
    sourceNameKo: "삼두정의 권좌",
    sourceNameEn: "Seat of the Triumvirate",
    hasSpecialEffect: true,
    specialEffectNote: "무법/민첩 계열 치트시트에서 반복 노출되지만 출처별 평가가 갈려 시뮬 확인 대상으로 둡니다.",
    season: "midnight-s1",
    confidence: "medium",
    tags: ["specialEffect", "needsSim", "backupCandidate"],
    variants: variants(260235, "dungeon", ["champion", "hero", "myth"], "medium"),
    trinketTiers: [
      tier(260235, "rogue-outlaw", "S", "overall", "Wowhead 무법 치트시트에서 주 후보로 노출됩니다.", [{ name: "Wowhead", url: wowheadOutlaw }], "medium"),
      tier(260235, "rogue-subtlety", "B", "cleave", "잠행 후보로 보이나 MythicSim 상위권 핵심 후보보다는 낮게 둡니다.", [{ name: "Wowhead", url: "https://www.wowhead.com/ko/guide/classes/rogue/subtlety/midnight-pre-patch" }], "medium"),
    ],
    note: "출처 충돌 가능성이 있어 needsSim 후보로 취급합니다.",
  },
  {
    itemId: 252420,
    nameKo: "태양섬광 분광경",
    nameEn: "Solarflare Prism",
    slot: "TRINKET_1",
    allowedClasses: ["rogue", "demon-hunter"],
    shareScope: "shared_trinket",
    sourceType: "raid",
    sourceNameKo: "한밤 시즌1 레이드",
    hasSpecialEffect: true,
    specialEffectNote: "암살과 무법 자료에서 대체 후보로 등장하지만 최상위 확정 후보는 아닙니다.",
    season: "midnight-s1",
    confidence: "medium",
    tags: ["specialEffect", "needsSim", "backupCandidate"],
    variants: variants(252420, "raid", ["champion", "hero", "myth"], "medium"),
    trinketTiers: [
      tier(252420, "rogue-assassination", "A", "overall", "Method 암살 가이드에서 좋은 대체 장신구로 언급됩니다.", [{ name: "Method", url: methodAssassination }, { name: "Wowhead", url: wowheadRogue }], "medium"),
      tier(252420, "rogue-outlaw", "A", "overall", "Wowhead 무법 후보 목록에 포함됩니다.", [{ name: "Wowhead", url: wowheadOutlaw }], "medium"),
    ],
    note: "정확한 가치는 현재 장비와 장신구 조합 시뮬레이션을 확인합니다.",
  },
];

export const midnightS1Items: SeasonItem[] = midnightS1ItemRecords.map((record) => ({ ...record }));

export const midnightS1ItemLevelNotes = {
  mythicPlus: "쐐기/금고 보상은 같은 itemId라도 챔피언·영웅·신화 트랙과 단계에 따라 실제 가치가 달라집니다.",
  raid: "공격대 장신구와 장비는 난이도별 트랙/단계를 별도 variant로 비교합니다.",
  crafted: "제작템은 품질, 문장, 불꽃, 제작 옵션에 따라 실제 템렙과 가치가 달라집니다.",
};

