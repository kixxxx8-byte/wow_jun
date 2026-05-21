import type { Character, EquipmentItem } from "../../../types";
import type { EquipmentSlotKey } from "./gearTypes";
import { slotLabelKo } from "./localization";
import type { SeasonItem } from "../data/midnightS1Items";
import type { SecondaryStat, SpecProfile } from "./specGuides";
import { statLabelKo } from "./specGuides";

export type GearSlotStatus =
  | "upgrade-candidate"
  | "keep"
  | "crafted-recommended"
  | "trinket-check"
  | "tier-check"
  | "weapon-priority"
  | "db-missing"
  | "unsupported"
  | "needs-sim";

export const gearStatusLabels: Record<GearSlotStatus, string> = {
  "upgrade-candidate": "교체 후보 있음",
  keep: "유지 가능",
  "crafted-recommended": "제작 후보",
  "trinket-check": "장신구 확인 필요",
  "tier-check": "티어 확인 필요",
  "weapon-priority": "무기 우선 확인",
  "db-missing": "DB 미등록",
  unsupported: "현재 장비 없음",
  "needs-sim": "시뮬 필요",
};

export type NormalizedGearItem = EquipmentItem & {
  slot: EquipmentSlotKey;
  slotLabelKo: string;
  armorType?: "cloth" | "leather" | "mail" | "plate";
  secondaryStats: SecondaryStat[];
};

export type GearSlotEvaluation = {
  slot: EquipmentSlotKey;
  slotLabelKo: string;
  status: GearSlotStatus;
  statusLabelKo: string;
  currentItem?: NormalizedGearItem;
  candidates: Array<{
    item: SeasonItem;
    score: number;
    reasons: string[];
    warnings: string[];
  }>;
  topCandidate?: {
    item: SeasonItem;
    score: number;
    reasons: string[];
    warnings: string[];
  };
  summary: string;
  action: string;
  warnings: string[];
};

export const inspectionSlotOrder: EquipmentSlotKey[] = [
  "HEAD",
  "NECK",
  "SHOULDER",
  "BACK",
  "CHEST",
  "WRIST",
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "TRINKET_1",
  "TRINKET_2",
  "MAIN_HAND",
  "OFF_HAND",
];

function numericItemId(value: unknown) {
  const id = Number(value || 0);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function equipmentItemForSlot(character: Character, slot: EquipmentSlotKey): EquipmentItem | undefined {
  return character.equipment?.[slot];
}

function detectStats(item?: EquipmentItem): SecondaryStat[] {
  const text = (item?.stats || [])
    .map((stat) => `${stat.type || ""} ${stat.name || ""} ${stat.display || ""}`)
    .join(" ")
    .toLowerCase();
  const stats: SecondaryStat[] = [];
  if (/crit|critical|치명/.test(text)) stats.push("crit");
  if (/haste|가속/.test(text)) stats.push("haste");
  if (/mastery|특화/.test(text)) stats.push("mastery");
  if (/versatility|유연/.test(text)) stats.push("versatility");
  return stats;
}

export function normalizeGear(character: Character): NormalizedGearItem[] {
  return inspectionSlotOrder
    .map((slot) => {
      const item = equipmentItemForSlot(character, slot);
      if (!item) return null;
      return {
        ...item,
        slot,
        slotLabelKo: slotLabelKo[slot],
        secondaryStats: detectStats(item),
      };
    })
    .filter((item): item is NormalizedGearItem => Boolean(item));
}

function currentSlotItem(character: Character, slot: EquipmentSlotKey) {
  const item = equipmentItemForSlot(character, slot);
  if (!item) return undefined;
  return {
    ...item,
    slot,
    slotLabelKo: slotLabelKo[slot],
    secondaryStats: detectStats(item),
  };
}

function sameSlot(candidateSlot: EquipmentSlotKey, slot: EquipmentSlotKey) {
  if (candidateSlot === slot) return true;
  if (slot === "TRINKET_1" || slot === "TRINKET_2") return candidateSlot === "TRINKET_1" || candidateSlot === "TRINKET_2";
  if (slot === "FINGER_1" || slot === "FINGER_2") return candidateSlot === "FINGER_1" || candidateSlot === "FINGER_2";
  return false;
}

export function getGearCandidatesForSlot(params: {
  slot: EquipmentSlotKey;
  specProfile: SpecProfile;
  currentItem?: NormalizedGearItem;
  seasonItems: SeasonItem[];
}) {
  const { slot, specProfile, currentItem, seasonItems } = params;
  const equippedId = numericItemId(currentItem?.id);
  return seasonItems.filter((item) => {
    if (item.confidence === "low") return false;
    if (equippedId && item.itemId === equippedId) return false;
    if (!sameSlot(item.slot, slot)) return false;
    if (item.allowedSpecs && !item.allowedSpecs.includes(specProfile.specKey)) return false;
    if (item.allowedClasses?.includes("rogue") && specProfile.classNameKo !== "도적") return false;
    if (item.allowedClasses?.includes("demon-hunter") && specProfile.classNameKo !== "악마사냥꾼" && item.allowedClasses.length === 1) return false;
    if (currentItem?.armorType && item.armorType && currentItem.armorType !== item.armorType) return false;
    return true;
  });
}

export type GearScoreResult = {
  score: number;
  reasons: string[];
  warnings: string[];
};

export function scoreGearItemForSpec(item: SeasonItem, specProfile: SpecProfile): GearScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const itemStats = item.stats ? Object.keys(item.stats) as SecondaryStat[] : item.recommendedStats || [];

  if (item.slot === "TRINKET_1" || item.slot === "TRINKET_2") {
    warnings.push("장신구는 특수효과 영향이 커서 단순 스탯 점수만으로 판단하지 않습니다.");
    if (item.hasSpecialEffect) {
      score += 40;
      reasons.push("특수효과 장신구입니다.");
    }
    if (item.tags?.includes("needsSim")) warnings.push("정확한 비교는 SimulationCraft/Raidbots 확인이 필요합니다.");
    return { score, reasons, warnings };
  }

  itemStats.forEach((stat) => {
    const index = specProfile.statPriority.indexOf(stat);
    if (index === 0) {
      score += 30;
      reasons.push(`1순위 스탯(${statLabelKo[stat]}) 포함`);
    } else if (index === 1) {
      score += 22;
      reasons.push(`2순위 스탯(${statLabelKo[stat]}) 포함`);
    } else if (index === 2) {
      score += 14;
      reasons.push(`3순위 스탯(${statLabelKo[stat]}) 포함`);
    } else if (index === 3) {
      score += 8;
      reasons.push(`4순위 스탯(${statLabelKo[stat]}) 포함`);
    }
  });

  if (item.isCrafted) {
    score += 15;
    reasons.push("제작 장비라 원하는 보조 능력치 조정 가능성이 있습니다.");
  }
  if (item.isTierPiece) {
    score += 35;
    reasons.push("티어 세트 부위입니다.");
  }
  if (item.hasSpecialEffect) {
    score += 20;
    reasons.push("특수효과가 있는 장비입니다.");
  }
  if (item.tags?.includes("bisCandidate")) {
    score += 30;
    reasons.push("전문화 기준 주요 후보로 등록된 아이템입니다.");
  }
  if (item.tags?.includes("needsSim")) {
    warnings.push("정확한 비교는 SimulationCraft/Raidbots 확인이 필요합니다.");
  }

  return { score, reasons, warnings };
}

export function evaluateGearSlot(params: {
  slot: EquipmentSlotKey;
  currentItem?: NormalizedGearItem;
  specProfile: SpecProfile;
  seasonItems: SeasonItem[];
}): GearSlotEvaluation {
  const { slot, currentItem, specProfile, seasonItems } = params;
  const candidates = getGearCandidatesForSlot({ slot, currentItem, specProfile, seasonItems })
    .map((item) => ({ item, ...scoreGearItemForSpec(item, specProfile) }))
    .sort((a, b) => b.score - a.score);
  const topCandidate = candidates[0];
  const slotLabel = slotLabelKo[slot];

  if (!currentItem) {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "unsupported",
      statusLabelKo: gearStatusLabels.unsupported,
      candidates,
      topCandidate,
      summary: "이 부위의 현재 장비 정보를 찾을 수 없습니다.",
      action: "캐릭터 장비 정보를 다시 불러오세요.",
      warnings: [],
    };
  }

  if (!candidates.length) {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "db-missing",
      statusLabelKo: gearStatusLabels["db-missing"],
      currentItem,
      candidates: [],
      summary: "이 부위는 아직 한밤 시즌1 후보 장비 DB가 등록되지 않았습니다. 현재 장비가 BIS라는 의미는 아닙니다.",
      action: "후보 장비가 등록되면 현재 장비와 비교하여 교체 우선순위를 계산합니다.",
      warnings: ["후보 데이터가 부족합니다."],
    };
  }

  if (slot === "TRINKET_1" || slot === "TRINKET_2") {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "trinket-check",
      statusLabelKo: gearStatusLabels["trinket-check"],
      currentItem,
      candidates,
      topCandidate,
      summary: "장신구는 특수효과 비중이 커서 단순 스탯 점수만으로 판단하지 않습니다.",
      action: "추천 후보와 현재 장신구의 효과를 비교하고, 최종적으로는 SimulationCraft/Raidbots 확인이 필요합니다.",
      warnings: Array.from(new Set(["장신구는 반드시 별도 확인이 필요합니다.", ...(topCandidate?.warnings || [])])),
    };
  }

  if (slot === "MAIN_HAND" || slot === "OFF_HAND") {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "weapon-priority",
      statusLabelKo: gearStatusLabels["weapon-priority"],
      currentItem,
      candidates,
      topCandidate,
      summary: "무기는 DPS 영향이 큰 부위이므로 우선 확인이 필요합니다.",
      action: "현재 무기와 후보 무기의 아이템 레벨, 무기 종류, 특수효과를 비교하세요.",
      warnings: topCandidate?.warnings || [],
    };
  }

  if (topCandidate?.item.isCrafted) {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "crafted-recommended",
      statusLabelKo: gearStatusLabels["crafted-recommended"],
      currentItem,
      candidates,
      topCandidate,
      summary: "이 부위는 제작 장비 후보가 있으며, 원하는 보조 능력치 조정 가능성이 있습니다.",
      action: "전문화 기준 추천 스탯으로 제작 가능한지 확인하세요.",
      warnings: topCandidate.warnings,
    };
  }

  if (topCandidate?.item.isTierPiece) {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "tier-check",
      statusLabelKo: gearStatusLabels["tier-check"],
      currentItem,
      candidates,
      topCandidate,
      summary: "이 부위는 티어 세트와 관련된 부위입니다.",
      action: "세트 효과 유지 여부를 확인한 뒤 교체하세요.",
      warnings: topCandidate.warnings,
    };
  }

  if (topCandidate && topCandidate.score >= 45) {
    return {
      slot,
      slotLabelKo: slotLabel,
      status: "upgrade-candidate",
      statusLabelKo: gearStatusLabels["upgrade-candidate"],
      currentItem,
      candidates,
      topCandidate,
      summary: "현재 전문화 기준으로 교체 후보가 존재합니다.",
      action: "상위 후보의 출처와 템렙 범위를 확인하세요.",
      warnings: topCandidate.warnings,
    };
  }

  return {
    slot,
    slotLabelKo: slotLabel,
    status: "keep",
    statusLabelKo: gearStatusLabels.keep,
    currentItem,
    candidates,
    topCandidate,
    summary: "등록된 후보 기준으로는 즉시 교체 우선순위가 높지 않습니다.",
    action: "다른 부위의 교체 후보를 먼저 확인하세요.",
    warnings: topCandidate?.warnings || [],
  };
}

export function evaluateCharacterGear(params: {
  character: Character;
  specProfile: SpecProfile;
  seasonItems: SeasonItem[];
}) {
  const { character, specProfile, seasonItems } = params;
  const evaluations = inspectionSlotOrder.map((slot) => evaluateGearSlot({
    slot,
    currentItem: currentSlotItem(character, slot),
    specProfile,
    seasonItems,
  }));

  const summary = {
    upgradeCandidates: evaluations.filter((row) => row.status === "upgrade-candidate" || row.status === "weapon-priority").length,
    craftedRecommended: evaluations.filter((row) => row.status === "crafted-recommended").length,
    trinketChecks: evaluations.filter((row) => row.status === "trinket-check").length,
    tierChecks: evaluations.filter((row) => row.status === "tier-check").length,
    dbMissing: evaluations.filter((row) => row.status === "db-missing").length,
    keep: evaluations.filter((row) => row.status === "keep").length,
  };

  const todo = evaluations
    .filter((row) => ["weapon-priority", "trinket-check", "crafted-recommended", "tier-check", "upgrade-candidate", "db-missing"].includes(row.status))
    .slice(0, 5)
    .map((row) => ({
      slot: row.slot,
      label: row.statusLabelKo,
      action: row.action,
    }));

  return { evaluations, summary, todo };
}
