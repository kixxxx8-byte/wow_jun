import { useMemo } from "react";
import type { Character } from "../../../types";
import { conservativeGearCandidates, currentSeason } from "../data/seasons";
import { recommendGear } from "../domain/gearRecommendation";
import type { GearCoachPreferences, GearRecommendationMode } from "../domain/gearTypes";

export function useGearRecommendation(character: Character, mode: GearRecommendationMode, preferences?: GearCoachPreferences) {
  return useMemo(
    () => recommendGear({
      character,
      mode,
      season: currentSeason,
      candidates: conservativeGearCandidates,
      preferences,
    }),
    [character, mode, preferences],
  );
}
