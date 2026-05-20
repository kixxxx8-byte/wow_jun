import type { Target, WowheadBisItem } from "../../../types";
import type { EquipmentSlotKey, GearCandidate } from "./gearTypes";

const targetSlotToEquipmentSlot: Record<string, EquipmentSlotKey> = {
  head: "HEAD",
  neck: "NECK",
  shoulder: "SHOULDER",
  back: "BACK",
  chest: "CHEST",
  wrist: "WRIST",
  hands: "HANDS",
  waist: "WAIST",
  legs: "LEGS",
  feet: "FEET",
  finger: "FINGER_1",
  finger2: "FINGER_2",
  trinket: "TRINKET_1",
  trinket2: "TRINKET_2",
  weapon: "MAIN_HAND",
  offhand: "OFF_HAND",
};

export function legacyTargetToGearCandidate(target: Target): GearCandidate {
  const sourceLooksRaid = target.source.includes("레이드");
  const sourceType = sourceLooksRaid ? "raid" : target.type === "craft" ? "craft" : "unknown";
  return {
    itemId: Number(target.itemId || 0),
    nameKo: target.target,
    slot: targetSlotToEquipmentSlot[target.slot] || "TRINKET_1",
    sourceType,
    sourceNameKo: target.source,
    bossNameKo: target.boss,
    isSeasonalReward: false,
    isCrafted: sourceType === "craft",
    acquisition: {
      certainty: sourceType === "craft" ? "guaranteed" : sourceType === "raid" ? "weekly_rng" : "repeatable_rng",
      timeCost: sourceType === "craft" ? "medium" : "high",
      weeklyLimited: sourceType !== "unknown",
      requiresGroup: sourceType !== "craft",
      notesKo: "기존 v8 목표에서 변환된 참고 후보입니다.",
    },
    dataSource: "manual",
    confidence: sourceType === "craft" ? "medium" : "low",
    verifiedAt: "2026-05-20",
  };
}

export function wowheadBisToReferenceCandidate(item: WowheadBisItem): GearCandidate {
  return {
    itemId: item.itemId,
    nameKo: item.name,
    slot: item.slotKey as EquipmentSlotKey,
    sourceType: "unknown",
    sourceNameKo: "참고 BIS",
    bossNameKo: item.source,
    isSeasonalReward: false,
    acquisition: {
      certainty: "repeatable_rng",
      timeCost: "high",
      weeklyLimited: false,
      requiresGroup: true,
      notesKo: "참고 BIS 자료에서 온 후보이며, 자체 추천 확정 근거로 사용하지 않습니다.",
    },
    dataSource: "wowhead",
    confidence: "low",
    verifiedAt: item.itemLevelText || undefined,
  };
}
