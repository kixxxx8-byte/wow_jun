import type { GearCandidate } from "../../domain/gearTypes";
import { craftedGearCandidates } from "./craftedGear";
import { currentDungeonLootCandidates } from "./currentDungeonLoot";
import { raidLootCandidates } from "./raidLoot";

export { currentSeason } from "./currentSeason";
export { craftedGearCandidates } from "./craftedGear";
export { currentDungeonLootCandidates } from "./currentDungeonLoot";
export { raidLootCandidates } from "./raidLoot";

export const conservativeGearCandidates: GearCandidate[] = [
  ...craftedGearCandidates,
  ...currentDungeonLootCandidates,
  ...raidLootCandidates,
];
