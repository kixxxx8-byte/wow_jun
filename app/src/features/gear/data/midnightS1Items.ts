import type { EquipmentSlotKey } from "../domain/gearTypes";
import type { SecondaryStat, SpecKey } from "../domain/specGuides";

export type SeasonItemSourceType = "dungeon" | "raid" | "craft" | "delve" | "catalyst" | "vendor" | "unknown";
export type ArmorType = "cloth" | "leather" | "mail" | "plate";
export type CuratedRecommendationState = "recommended" | "needs_check" | "hidden" | "rejected" | "db_missing";
export type TrinketTier = "S" | "A" | "B" | "C" | "주의";
export type TrinketTierContentFocus = "mythic_plus" | "raid" | "balanced";

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
  nameEn?: string;
  slot: EquipmentSlotKey;
  armorType?: ArmorType;
  weaponType?: "dagger" | "oneHandSword" | "oneHandAxe" | "warglaive" | "fistWeapon" | "staff" | "offHand" | "unknown";
  allowedClasses?: Array<"rogue" | "demon-hunter">;
  allowedSpecs?: SpecKey[];
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
  recommendationState: CuratedRecommendationState;
  trinketTier?: TrinketTierRecord;
  tags?: Array<"bisCandidate" | "strongCandidate" | "backupCandidate" | "statStick" | "specialEffect" | "craftedOption" | "needsSim">;
  note?: string;
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
    slot: "TRINKET_1",
    sourceType: "raid",
    sourceNameKo: "한밤 시즌1 레이드",
    bossNameKo: "키마이루스",
    hasSpecialEffect: true,
    specialEffectNote: "장신구는 단순 보조 능력치 점수로 확정하지 않고 실제 효과와 시뮬레이션을 확인합니다.",
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
];

export const midnightS1ItemLevelNotes = {
  mythicPlus: "쐐기 종료 보상과 위대한 금고 템렙은 실제 한밤 시즌1 테이블 확인 후 표시합니다.",
  raid: "공격대 난이도별 템렙은 검증 전까지 UI에서 확정값처럼 보여주지 않습니다.",
  crafted: "제작템은 품질, 문장, 불꽃, 제작 옵션에 따라 실제 템렙과 가치가 달라집니다.",
};

