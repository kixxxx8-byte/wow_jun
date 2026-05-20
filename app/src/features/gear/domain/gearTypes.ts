import type { Character, EquipmentItem } from "../../../types";

export type GearRecommendationMode =
  | "dungeon_craft_only"
  | "dungeon_craft_raid"
  | "no_raid"
  | "all_sources"
  | "craft_priority"
  | "trinket_priority";

export type GearSourceType =
  | "dungeon"
  | "craft"
  | "raid"
  | "great_vault"
  | "catalyst"
  | "vendor"
  | "delve"
  | "unknown";

export type EquipmentSlotKey =
  | "HEAD"
  | "NECK"
  | "SHOULDER"
  | "BACK"
  | "CHEST"
  | "WRIST"
  | "HANDS"
  | "WAIST"
  | "LEGS"
  | "FEET"
  | "FINGER_1"
  | "FINGER_2"
  | "TRINKET_1"
  | "TRINKET_2"
  | "MAIN_HAND"
  | "OFF_HAND";

export type GearAcquisition = {
  certainty: "guaranteed" | "repeatable_rng" | "weekly_rng" | "limited_currency";
  timeCost: "low" | "medium" | "high";
  weeklyLimited: boolean;
  requiresGroup: boolean;
  requiresCurrency?: boolean;
  notesKo?: string;
};

export type TrinketMeta = {
  role: "burst" | "sustained" | "aoe" | "single_target" | "stat_stick" | "defensive";
  usage: "on_use" | "passive" | "proc";
  synergyTags?: string[];
  confidence: "high" | "medium" | "low";
  notesKo?: string;
};

export type GearCandidate = {
  itemId: number;
  nameKo?: string;
  nameEn?: string;
  slot: EquipmentSlotKey;
  sourceType: GearSourceType;
  sourceNameKo?: string;
  sourceNameEn?: string;
  sourceDungeonKey?: string;
  sourceRaidKey?: string;
  bossNameKo?: string;
  bossNameEn?: string;
  seasonId?: string;
  isSeasonalReward: boolean;
  originalExpansion?: string;
  itemLevelMin?: number;
  itemLevelMax?: number;
  upgradeTrack?: string;
  stats?: {
    agility?: number;
    stamina?: number;
    crit?: number;
    haste?: number;
    mastery?: number;
    versatility?: number;
  };
  effects?: {
    type: "equip" | "use" | "proc" | "embellishment" | "set_bonus";
    textKo?: string;
    textEn?: string;
  }[];
  uniqueEquipGroup?: string;
  isCrafted?: boolean;
  hasEmbellishment?: boolean;
  isTierPiece?: boolean;
  acquisition?: GearAcquisition;
  trinketMeta?: TrinketMeta;
  dataSource: "manual" | "blizzard" | "wowhead" | "raidbots" | "simc" | "curated";
  confidence: "high" | "medium" | "low";
  verifiedAt?: string;
};

export type SeasonDungeon = {
  key: string;
  nameKo: string;
  nameEn: string;
  originalExpansion?: string;
  blizzardDungeonId?: number;
  journalInstanceId?: number;
  isSeasonalMythicPlus: boolean;
};

export type SeasonConfig = {
  id: string;
  labelKo: string;
  labelEn: string;
  expansionKey: string;
  isCurrent: boolean;
  dungeonPool: SeasonDungeon[];
  itemLevelRange?: {
    min: number;
    max: number;
  };
  allowedUpgradeTracks?: string[];
  verifiedAt?: string;
};

export type GearRecommendationProfile = {
  id: GearRecommendationMode;
  labelKo: string;
  descriptionKo: string;
  allowedSources: GearSourceType[];
  allowRaid: boolean;
  allowDungeon: boolean;
  allowCraft: boolean;
  allowGreatVault: boolean;
  allowDelve: boolean;
  preferCrafting: boolean;
  prioritizeTrinkets: boolean;
  contentFocus: "mythic_plus" | "raid" | "balanced";
  fightStyle: "single_target" | "aoe" | "mixed";
  hideLowConfidence: boolean;
};

export type EquippedItem = EquipmentItem & {
  slot?: EquipmentSlotKey;
};

export type GearSetSummary = {
  labelKo: string;
  items: GearCandidate[];
  recommendationScore: number;
  notesKo?: string;
};

export type WeeklyActionPlan = {
  summaryKo: string;
  actions: {
    id: string;
    titleKo: string;
    descriptionKo: string;
    actionType: "dungeon" | "craft" | "upgrade" | "vault" | "note";
    priority: "very_high" | "high" | "medium" | "low";
    relatedItemIds?: number[];
    relatedDungeonKey?: string;
  }[];
};

export type PriorityUpgrade = {
  slot: EquipmentSlotKey;
  slotLabelKo: string;
  currentItem?: EquippedItem;
  recommendedItem: GearCandidate;
  priority: "very_high" | "high" | "medium" | "low";
  recommendationScore: number;
  reasonKo: string;
  sourceType: GearSourceType;
  sourceLabelKo: string;
  sourceNameKo: string;
  certaintyLabelKo?: string;
  confidenceLabelKo?: string;
};

export type FarmingRoute = {
  routeType: "dungeon" | "craft" | "raid" | "vendor" | "great_vault" | "delve";
  sourceKey?: string;
  sourceNameKo: string;
  priority: "very_high" | "high" | "medium" | "low";
  targetItems: {
    itemId: number;
    nameKo: string;
    slotLabelKo: string;
  }[];
  reasonKo: string;
  guideLink?: string;
  wythicLink?: string;
};

export type RejectedCandidate = {
  itemId: number;
  nameKo?: string;
  nameEn?: string;
  sourceType?: GearSourceType;
  sourceDungeonKey?: string;
  seasonId?: string;
  reason:
    | "not_current_season"
    | "dungeon_not_in_pool"
    | "not_seasonal_reward"
    | "legacy_original_dungeon_loot"
    | "source_not_allowed"
    | "low_confidence"
    | "missing_korean_name"
    | "invalid_item_level_range"
    | "invalid_upgrade_track"
    | "duplicate_unique_equip"
    | "not_supported_slot";
  reasonKo: string;
};

export type RecommendationWarning = {
  id: string;
  messageKo: string;
  severity: "info" | "warn" | "error";
};

export type GearSlotRecommendation = {
  slot: EquipmentSlotKey;
  slotLabelKo: string;
  status: "replace" | "enhance" | "keep" | "no_verified_candidate" | "insufficient_data";
  currentItem?: EquippedItem;
  recommendedItem?: GearCandidate;
  reasonKo: string;
  confidenceLabelKo?: string;
};

export type GearRecommendationResult = {
  mode: GearRecommendationMode;
  modeLabelKo: string;
  seasonId: string;
  seasonLabelKo: string;
  summaryKo: string;
  currentScore: number;
  targetScore: number;
  targetBestSet: GearSetSummary;
  weeklyActionPlan: WeeklyActionPlan;
  guaranteedUpgrades: PriorityUpgrade[];
  rngFarmingTargets: PriorityUpgrade[];
  priorityUpgrades: PriorityUpgrade[];
  farmingRoutes: FarmingRoute[];
  slotDetails: GearSlotRecommendation[];
  rejectedCandidates: RejectedCandidate[];
  warnings: RecommendationWarning[];
};

export type GearCoachPreferences = {
  defaultMode: GearRecommendationMode;
  excludedSources: GearSourceType[];
  preferredSources: GearSourceType[];
  avoidedDungeons: string[];
  preferredDungeons: string[];
  hiddenRecommendationIds: string[];
  alreadyOwnedItemIds: number[];
  craftingPreference: "prefer" | "neutral" | "avoid";
  timeBudgetMinutes?: number;
  riskTolerance: "low" | "medium" | "high";
  freeNote?: string;
};

export type RecommendGearInput = {
  character: Character;
  mode: GearRecommendationMode;
  season: SeasonConfig;
  candidates: GearCandidate[];
  preferences?: GearCoachPreferences;
};
