import type { EquipmentSlotKey, GearCandidate, GearSourceType, SeasonConfig } from "./gearTypes";

export const DEFAULT_REGION = "kr";
export const DEFAULT_LOCALE = "ko_KR";

export const sourceTypeLabelKo: Record<GearSourceType, string> = {
  dungeon: "던전",
  craft: "제작",
  raid: "레이드",
  great_vault: "위대한 금고",
  catalyst: "변환",
  vendor: "상인",
  delve: "구렁",
  unknown: "출처 확인 필요",
};

export const slotLabelKo: Record<EquipmentSlotKey, string> = {
  HEAD: "머리",
  NECK: "목",
  SHOULDER: "어깨",
  BACK: "망토",
  CHEST: "가슴",
  WRIST: "손목",
  HANDS: "손",
  WAIST: "허리",
  LEGS: "다리",
  FEET: "발",
  FINGER_1: "반지 1",
  FINGER_2: "반지 2",
  TRINKET_1: "장신구 1",
  TRINKET_2: "장신구 2",
  MAIN_HAND: "주무기",
  OFF_HAND: "보조무기",
};

export function getDisplayItemName(item: GearCandidate): string {
  if (item.nameKo?.trim()) return item.nameKo;
  return "한국어 이름 확인 중";
}

export function getDisplaySourceName(item: GearCandidate): string {
  if (item.sourceNameKo?.trim()) return item.sourceNameKo;
  return "출처 확인 중";
}

export function getDisplayDungeonName(sourceDungeonKey: string | undefined, season: SeasonConfig): string {
  if (!sourceDungeonKey) return "던전명 확인 필요";
  const dungeon = season.dungeonPool.find((row) => row.key === sourceDungeonKey);
  return dungeon?.nameKo ?? "던전명 확인 필요";
}

export function confidenceLabelKo(value: GearCandidate["confidence"]) {
  if (value === "high") return "신뢰도 높음";
  if (value === "medium") return "신뢰도 중간";
  return "신뢰도 낮음";
}

export function certaintyLabelKo(value?: GearCandidate["acquisition"]) {
  if (!value) return "획득 정보 확인 중";
  if (value.certainty === "guaranteed") return "확정 획득";
  if (value.certainty === "repeatable_rng") return "반복 파밍";
  if (value.certainty === "weekly_rng") return "주간 운 요소";
  return "제한 자원 필요";
}
