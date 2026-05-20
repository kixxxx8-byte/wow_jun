import type { GearCandidate, RejectedCandidate, SeasonConfig } from "./gearTypes";

export function rejectionForSeason(item: GearCandidate, season: SeasonConfig): RejectedCandidate | null {
  if (item.sourceType !== "dungeon") return null;
  if (!item.seasonId || item.seasonId !== season.id) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "not_current_season", reasonKo: "현재 시즌 보상으로 확인되지 않았습니다." };
  }
  if (!item.sourceDungeonKey) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, seasonId: item.seasonId, reason: "dungeon_not_in_pool", reasonKo: "현재 시즌 던전 키가 확인되지 않았습니다." };
  }
  const inCurrentPool = season.dungeonPool.some((dungeon) => dungeon.key === item.sourceDungeonKey);
  if (!inCurrentPool) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "dungeon_not_in_pool", reasonKo: "현재 시즌 쐐기 던전 풀에 없습니다." };
  }
  if (!item.isSeasonalReward) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "not_seasonal_reward", reasonKo: "현재 시즌 보상 테이블에 포함된 아이템으로 확인되지 않았습니다." };
  }
  if (item.confidence === "low") {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "low_confidence", reasonKo: "신뢰도가 낮아 기본 추천에서 숨깁니다." };
  }
  if (season.itemLevelRange && item.itemLevelMax && item.itemLevelMax < season.itemLevelRange.min) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "invalid_item_level_range", reasonKo: "현재 시즌 아이템 레벨 범위와 맞지 않습니다." };
  }
  if (season.allowedUpgradeTracks && item.upgradeTrack && !season.allowedUpgradeTracks.includes(item.upgradeTrack)) {
    return { itemId: item.itemId, nameKo: item.nameKo, nameEn: item.nameEn, sourceType: item.sourceType, sourceDungeonKey: item.sourceDungeonKey, seasonId: item.seasonId, reason: "invalid_upgrade_track", reasonKo: "현재 시즌 강화 트랙과 맞지 않습니다." };
  }
  return null;
}

export function isValidCurrentSeasonDungeonCandidate(item: GearCandidate, season: SeasonConfig): boolean {
  return !rejectionForSeason(item, season);
}
