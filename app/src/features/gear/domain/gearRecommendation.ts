import type { Character } from "../../../types";
import { currentSeason, conservativeGearCandidates } from "../data/seasons";
import { dungeonGuideCatalog } from "../../../domain/dungeonCatalog";
import { certaintyLabelKo, confidenceLabelKo, getDisplayItemName, getDisplaySourceName, slotLabelKo, sourceTypeLabelKo } from "./localization";
import { gearProfile } from "./profiles";
import { rejectionForSeason } from "./seasonFilter";
import { scoreCandidate, scoreToPriority } from "./gearScoring";
import type {
  EquipmentSlotKey,
  EquippedItem,
  FarmingRoute,
  GearCandidate,
  GearCoachPreferences,
  GearRecommendationMode,
  GearRecommendationResult,
  GearSlotRecommendation,
  PriorityUpgrade,
  RejectedCandidate,
  RecommendGearInput,
} from "./gearTypes";

const slotOrder: EquipmentSlotKey[] = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "WRIST", "HANDS", "WAIST", "LEGS", "FEET", "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2", "MAIN_HAND", "OFF_HAND",
];

export function defaultGearCoachPreferences(): GearCoachPreferences {
  return {
    defaultMode: "dungeon_craft_only",
    excludedSources: [],
    preferredSources: [],
    avoidedDungeons: [],
    preferredDungeons: [],
    hiddenRecommendationIds: [],
    alreadyOwnedItemIds: [],
    craftingPreference: "neutral",
    riskTolerance: "medium",
    freeNote: "",
  };
}

function equipmentItemForSlot(character: Character, slot: EquipmentSlotKey): EquippedItem | undefined {
  const item = character.equipment?.[slot];
  return item ? { ...item, slot } : undefined;
}

function slotMatches(candidateSlot: EquipmentSlotKey, equippedSlot: string) {
  if (candidateSlot === equippedSlot) return true;
  if ((candidateSlot === "TRINKET_1" || candidateSlot === "TRINKET_2") && (equippedSlot === "TRINKET_1" || equippedSlot === "TRINKET_2")) return true;
  if ((candidateSlot === "FINGER_1" || candidateSlot === "FINGER_2") && (equippedSlot === "FINGER_1" || equippedSlot === "FINGER_2")) return true;
  return false;
}

function currentItemsForCandidate(character: Character, candidate: GearCandidate) {
  return Object.entries(character.equipment || {})
    .filter(([slot]) => slotMatches(candidate.slot, slot))
    .flatMap(([, item]) => item ? [{ ...item, slot: candidate.slot } as EquippedItem] : []);
}

function itemLevel(item?: EquippedItem) {
  return Number(item?.level || item?.itemLevel || 0);
}

function numericItemId(value: unknown) {
  const id = Number(value || 0);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function equippedItemIds(character: Character) {
  return new Set(Object.values(character.equipment || {}).map((item) => numericItemId(item?.id)).filter(Boolean));
}

function baseReject(item: GearCandidate, reason: RejectedCandidate["reason"], reasonKo: string): RejectedCandidate {
  return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason, reasonKo };
}

function rejectCandidate(item: GearCandidate, input: RecommendGearInput): RejectedCandidate | null {
  const profile = gearProfile(input.mode);
  const preferences = input.preferences;
  if (equippedItemIds(input.character).has(item.itemId)) return baseReject(item, "duplicate_unique_equip", "이미 장착 중인 아이템입니다.");
  const targetLevel = Number(item.itemLevelMax || item.itemLevelMin || 0);
  if (targetLevel > 0) {
    const currentItems = currentItemsForCandidate(input.character, item);
    if (currentItems.some((current) => itemLevel(current) >= targetLevel)) {
      return baseReject(item, "invalid_item_level_range", "현재 장착 장비보다 높은 변형이 아니라 기본 추천에서 제외합니다.");
    }
  }
  if (preferences?.alreadyOwnedItemIds.includes(item.itemId)) return baseReject(item, "duplicate_unique_equip", "이미 획득한 아이템으로 표시되어 기본 추천에서 숨깁니다.");
  if (preferences?.hiddenRecommendationIds.includes(String(item.itemId))) return baseReject(item, "source_not_allowed", "사용자가 숨긴 추천입니다.");
  if (preferences?.excludedSources.includes(item.sourceType)) return baseReject(item, "source_not_allowed", "사용자가 제외한 출처입니다.");
  if (!profile.allowedSources.includes(item.sourceType)) return baseReject(item, "source_not_allowed", `${profile.labelKo} 기준에서 허용되지 않는 출처입니다.`);
  if (!item.nameKo?.trim()) return baseReject(item, "missing_korean_name", "한국어 이름이 확인되지 않았습니다.");
  if (profile.hideLowConfidence && item.confidence === "low") return baseReject(item, "low_confidence", "신뢰도가 낮아 기본 추천에서 숨깁니다.");
  return rejectionForSeason(item, input.season);
}

function visibleCandidates(input: RecommendGearInput) {
  const rejected: RejectedCandidate[] = [];
  const visible = input.candidates.filter((candidate) => {
    const rejection = rejectCandidate(candidate, input);
    if (rejection) {
      rejected.push(rejection);
      return false;
    }
    return true;
  });
  return { visible, rejected };
}

function bestBySlot(input: RecommendGearInput, candidates: GearCandidate[]) {
  const profile = gearProfile(input.mode);
  const selected = new Map<EquipmentSlotKey, { candidate: GearCandidate; score: number }>();
  candidates.forEach((candidate) => {
    const currentItem = equipmentItemForSlot(input.character, candidate.slot);
    const score = scoreCandidate(currentItem, candidate, profile, input.preferences);
    const existing = selected.get(candidate.slot);
    if (!existing || score > existing.score) selected.set(candidate.slot, { candidate, score });
  });
  return selected;
}

function buildReason(candidate: GearCandidate, currentItem: EquippedItem | undefined) {
  const current = itemLevel(currentItem);
  const target = Number(candidate.itemLevelMax || candidate.itemLevelMin || 0);
  if (candidate.sourceType === "craft") return "운에 의존하지 않는 확정 강화 후보입니다.";
  if (candidate.slot.includes("TRINKET")) return "장신구는 효과 차이가 커서 신뢰도와 실제 심크 확인이 필요합니다.";
  if (target && current && target > current) return `현재 장비보다 아이템 레벨 기준으로 ${target - current} 높게 노릴 수 있습니다.`;
  return "현재 장비와 획득 경로를 기준으로 교체 후보입니다.";
}

function visibilityStatusForCandidate(candidate: GearCandidate): PriorityUpgrade["visibilityStatus"] {
  if (!candidate.nameKo?.trim()) return "hidden";
  if (candidate.confidence === "low" || candidate.sourceType === "unknown") return "hidden";
  if (candidate.trinketMeta || candidate.slot.includes("TRINKET")) return "needs_check";
  return "recommended";
}

function buildPriorityUpgrades(input: RecommendGearInput, candidates: GearCandidate[]) {
  const selected = bestBySlot(input, candidates);
  return Array.from(selected.entries())
    .filter(([slot]) => Boolean(equipmentItemForSlot(input.character, slot)))
    .map(([slot, row]): PriorityUpgrade => {
      const currentItem = equipmentItemForSlot(input.character, slot);
      return {
        slot,
        slotLabelKo: slotLabelKo[slot],
        currentItem,
        recommendedItem: row.candidate,
        visibilityStatus: visibilityStatusForCandidate(row.candidate),
        priority: scoreToPriority(row.score),
        recommendationScore: row.score,
        reasonKo: buildReason(row.candidate, currentItem),
        sourceType: row.candidate.sourceType,
        sourceLabelKo: sourceTypeLabelKo[row.candidate.sourceType],
        sourceNameKo: getDisplaySourceName(row.candidate),
        certaintyLabelKo: certaintyLabelKo(row.candidate.acquisition),
        confidenceLabelKo: confidenceLabelKo(row.candidate.confidence),
      };
    })
    .filter((row) => row.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}

function buildFarmingRoutes(upgrades: PriorityUpgrade[]): FarmingRoute[] {
  const grouped = new Map<string, FarmingRoute>();
  upgrades.forEach((upgrade) => {
    const item = upgrade.recommendedItem;
    const key = item.sourceType === "dungeon" ? `dungeon:${item.sourceDungeonKey || item.sourceNameKo}` : `${item.sourceType}:${item.sourceNameKo || item.sourceType}`;
    const guide = item.sourceDungeonKey ? dungeonGuideCatalog.find((row) => row.id === item.sourceDungeonKey) : undefined;
    const existing = grouped.get(key);
    const route: FarmingRoute = existing || {
      routeType: item.sourceType === "craft" ? "craft" : item.sourceType === "raid" ? "raid" : item.sourceType === "great_vault" ? "great_vault" : item.sourceType === "delve" ? "delve" : item.sourceType === "vendor" ? "vendor" : "dungeon",
      sourceKey: item.sourceDungeonKey || item.sourceRaidKey,
      sourceNameKo: getDisplaySourceName(item),
      priority: upgrade.priority,
      targetItems: [],
      reasonKo: "",
      guideLink: guide ? "#guides" : undefined,
      wythicLink: guide?.href,
    };
    route.targetItems.push({ itemId: item.itemId, nameKo: getDisplayItemName(item), slotLabelKo: upgrade.slotLabelKo });
    route.reasonKo = route.routeType === "craft" ? "확정 강화 후보가 있습니다." : `교체 후보가 ${route.targetItems.length}개 있습니다.`;
    if (!existing) grouped.set(key, route);
  });
  return Array.from(grouped.values()).slice(0, 6);
}

function buildSlotDetails(character: Character, upgrades: PriorityUpgrade[]): GearSlotRecommendation[] {
  const upgradeBySlot = new Map(upgrades.map((row) => [row.slot, row]));
  return slotOrder.map((slot) => {
    const upgrade = upgradeBySlot.get(slot);
    const currentItem = equipmentItemForSlot(character, slot);
    if (upgrade) {
      return {
        slot,
        slotLabelKo: slotLabelKo[slot],
        status: "replace",
        currentItem,
        recommendedItem: upgrade.recommendedItem,
        reasonKo: upgrade.reasonKo,
        confidenceLabelKo: upgrade.confidenceLabelKo,
      };
    }
    return {
      slot,
      slotLabelKo: slotLabelKo[slot],
      status: currentItem ? "no_verified_candidate" : "insufficient_data",
      currentItem,
      reasonKo: currentItem ? "아직 이 부위의 검증된 교체 후보가 등록되지 않았습니다. BIS 완료를 의미하지 않습니다." : "현재 장비 정보가 부족합니다.",
    };
  });
}

function buildWeeklyActionPlan(upgrades: PriorityUpgrade[], routes: FarmingRoute[], modeLabelKo: string) {
  const actionableUpgrades = upgrades.filter((upgrade) => upgrade.visibilityStatus === "recommended" || upgrade.visibilityStatus === "needs_check");
  const actions = [
    ...actionableUpgrades.slice(0, 3).map((upgrade) => ({
      id: `upgrade-${upgrade.slot}-${upgrade.recommendedItem.itemId}`,
      titleKo: upgrade.visibilityStatus === "needs_check"
        ? `${upgrade.slotLabelKo} 후보 확인`
        : `${upgrade.slotLabelKo} ${upgrade.sourceType === "craft" ? "제작 검토" : "교체 후보 확인"}`,
      descriptionKo: `${getDisplayItemName(upgrade.recommendedItem)} · ${upgrade.reasonKo}`,
      actionType: upgrade.sourceType === "craft" ? "craft" as const : "upgrade" as const,
      priority: upgrade.priority,
      relatedItemIds: [upgrade.recommendedItem.itemId],
      relatedDungeonKey: upgrade.recommendedItem.sourceDungeonKey,
    })),
    ...routes.slice(0, 3).map((route) => ({
      id: `route-${route.routeType}-${route.sourceKey || route.sourceNameKo}`,
      titleKo: route.routeType === "craft" ? "제작 주문 확인" : `${route.sourceNameKo} 파밍`,
      descriptionKo: route.reasonKo,
      actionType: route.routeType === "craft" ? "craft" as const : route.routeType === "great_vault" ? "vault" as const : "dungeon" as const,
      priority: route.priority,
      relatedItemIds: route.targetItems.map((item) => item.itemId),
      relatedDungeonKey: route.sourceKey,
    })),
  ];
  const unique = actions.filter((action, index, arr) => arr.findIndex((row) => row.id === action.id) === index).slice(0, 6);
  return {
    summaryKo: unique.length ? `${modeLabelKo} 기준으로 이번 주 우선 행동 ${unique.length}개를 정리했습니다.` : `${modeLabelKo} 기준에서 검증된 기본 추천 후보가 부족합니다.`,
    actions: unique,
  };
}

function buildScores(character: Character, upgrades: PriorityUpgrade[]) {
  const equipped = slotOrder.map((slot) => itemLevel(equipmentItemForSlot(character, slot))).filter(Boolean);
  const avg = equipped.length ? equipped.reduce((sum, value) => sum + value, 0) / equipped.length : 0;
  const currentScore = Math.max(0, Math.min(100, Math.round(avg ? avg / 3 : 35)));
  const boost = Math.min(35, Math.round(upgrades.reduce((sum, row) => sum + Math.max(0, row.recommendationScore), 0) / 25));
  return { currentScore, targetScore: Math.max(currentScore, Math.min(100, currentScore + boost)) };
}

export function recommendGear(input: RecommendGearInput): GearRecommendationResult {
  const profile = gearProfile(input.mode);
  const { visible, rejected } = visibleCandidates(input);
  const priorityUpgrades = buildPriorityUpgrades(input, visible);
  const farmingRoutes = buildFarmingRoutes(priorityUpgrades);
  const guaranteedUpgrades = priorityUpgrades.filter((row) => row.recommendedItem.acquisition?.certainty === "guaranteed");
  const rngFarmingTargets = priorityUpgrades.filter((row) => row.recommendedItem.acquisition?.certainty !== "guaranteed");
  const slotDetails = buildSlotDetails(input.character, priorityUpgrades);
  const { currentScore, targetScore } = buildScores(input.character, priorityUpgrades);
  const warnings = priorityUpgrades.some((row) => row.slot.includes("TRINKET"))
    ? [{ id: "trinket-sim", severity: "warn" as const, messageKo: "장신구 추천은 실제 DPS와 차이가 있을 수 있습니다. 정확한 DPS 확인은 SimC/Raidbots 결과를 참고하세요." }]
    : [];
  return {
    mode: profile.id,
    modeLabelKo: profile.labelKo,
    seasonId: input.season.id,
    seasonLabelKo: input.season.labelKo,
    summaryKo: priorityUpgrades.length
      ? `${profile.labelKo} 기준으로 ${priorityUpgrades.length}개 교체 후보와 ${farmingRoutes.length}개 파밍 루트를 찾았습니다.`
      : `${profile.labelKo} 기준에서 안전하게 추천할 검증 후보가 아직 부족합니다.`,
    currentScore,
    targetScore,
    targetBestSet: {
      labelKo: `${profile.labelKo} 최종 추천 후보`,
      items: priorityUpgrades.map((row) => row.recommendedItem),
      recommendationScore: targetScore,
      notesKo: "이 점수는 실제 심크 DPS가 아니라 현재 장비, 시즌 보상, 획득 경로, 획득 난이도, 사용자 선호를 반영한 추천 우선도입니다.",
    },
    weeklyActionPlan: buildWeeklyActionPlan(priorityUpgrades, farmingRoutes, profile.labelKo),
    guaranteedUpgrades,
    rngFarmingTargets,
    priorityUpgrades,
    farmingRoutes,
    slotDetails,
    rejectedCandidates: rejected,
    warnings,
  };
}

export function buildDefaultGearRecommendation(character: Character, mode: GearRecommendationMode = "dungeon_craft_only", preferences = defaultGearCoachPreferences()) {
  return recommendGear({
    character,
    mode,
    season: currentSeason,
    candidates: conservativeGearCandidates,
    preferences,
  });
}
