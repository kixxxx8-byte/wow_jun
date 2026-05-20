import type { EquippedItem, GearCandidate, GearCoachPreferences, GearRecommendationProfile } from "./gearTypes";

function currentItemLevel(item?: EquippedItem) {
  return Number(item?.level || item?.itemLevel || 0);
}

export function estimateItemLevelGain(currentItem: EquippedItem | undefined, candidate: GearCandidate) {
  const target = Number(candidate.itemLevelMax || candidate.itemLevelMin || 0);
  const current = currentItemLevel(currentItem);
  if (!target || !current) return target ? 5 : 0;
  return Math.max(0, target - current);
}

export function estimateStatValue(candidate: GearCandidate, spec = "assassination_rogue") {
  if (spec !== "assassination_rogue") return 0;
  const stats = candidate.stats || {};
  return Number(stats.crit || 0) * 0.9 + Number(stats.mastery || 0) * 0.85 + Number(stats.haste || 0) * 0.75 + Number(stats.versatility || 0) * 0.65;
}

export function scoreCandidate(
  currentItem: EquippedItem | undefined,
  candidate: GearCandidate,
  profile: GearRecommendationProfile,
  preferences?: GearCoachPreferences,
): number {
  let score = 0;
  score += estimateItemLevelGain(currentItem, candidate) * 10;
  score += estimateStatValue(candidate, "assassination_rogue");
  if (candidate.slot.includes("TRINKET")) score += profile.prioritizeTrinkets ? 260 : 150;
  if (candidate.slot === "MAIN_HAND" || candidate.slot === "OFF_HAND") score += 120;
  if (profile.preferCrafting && candidate.sourceType === "craft") score += 80;
  if (preferences?.craftingPreference === "prefer" && candidate.sourceType === "craft") score += 45;
  if (preferences?.craftingPreference === "avoid" && candidate.sourceType === "craft") score -= 80;
  if (candidate.acquisition?.certainty === "guaranteed") score += 60;
  if (candidate.acquisition?.certainty === "weekly_rng") score -= 30;
  if (candidate.acquisition?.certainty === "repeatable_rng") score -= 10;
  if (candidate.confidence === "medium") score -= 40;
  if (candidate.confidence === "low") score -= 9999;
  if (preferences?.avoidedDungeons?.length && candidate.sourceDungeonKey && preferences.avoidedDungeons.includes(candidate.sourceDungeonKey)) score -= 1000;
  if (preferences?.preferredDungeons?.length && candidate.sourceDungeonKey && preferences.preferredDungeons.includes(candidate.sourceDungeonKey)) score += 40;
  return Math.round(score);
}

export function scoreToPriority(score: number): "very_high" | "high" | "medium" | "low" {
  if (score >= 180) return "very_high";
  if (score >= 120) return "high";
  if (score >= 60) return "medium";
  return "low";
}
