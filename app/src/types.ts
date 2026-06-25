import type { GearCoachPreferences, GearRecommendationResult } from "./features/gear/domain/gearTypes";

export type View = "today" | "ai" | "gear" | "wythic" | "dungeons" | "raids" | "guides" | "notes";
export type TimeBudget = "30m" | "60m" | "120m" | "custom";
export type Goal = "gear" | "score" | "light" | "push" | "maintenance";
export type Energy = "low" | "normal" | "high";
export type Party = "solo" | "premade" | "either";
export type Risk = "safe" | "balanced" | "aggressive";
export type ActionType = "dungeon" | "item" | "maintenance" | "sync" | "avoid";
export type Confidence = "low" | "medium" | "high";
export type PlanMode = "data_only" | "web_augmented";
export type AiTrigger = "manual";

export type Tone = "ok" | "warn" | "err";

export type AiPreferences = {
  timeBudget: TimeBudget;
  goal: Goal;
  energy: Energy;
  party: Party;
  risk: Risk;
  preferredDungeons: string[];
  avoidedDungeons: string[];
  freeNote: string;
  useWeb: boolean;
};

export type EquipmentItem = {
  id?: number | string;
  name?: string;
  level?: number;
  itemLevel?: number;
  quality?: string;
  iconUrl?: string;
  icon?: string;
  enchantments?: Array<{ displayString?: string; display?: string; name?: string; source?: string } | string>;
  sockets?: Array<{ item?: { name?: string }; itemId?: number; displayString?: string; display?: string } | string>;
  stats?: Array<{ type?: string; name?: string; value?: number; display?: string }>;
};

export type ItemTooltipData = {
  itemId: number;
  region: string;
  locale: string;
  name: string;
  quality?: string;
  qualityType?: string;
  iconUrl?: string;
  itemLevel?: number;
  itemLevelText?: string;
  binding?: string;
  inventoryType?: string;
  itemClass?: string;
  itemSubclass?: string;
  armor?: string;
  weapon?: string[];
  stats?: string[];
  sockets?: string[];
  spells?: string[];
  requirements?: string[];
  description?: string;
  setName?: string;
  originalUrl?: string;
};

export type WowheadBisItem = {
  slot: string;
  slotKey: string;
  itemId: number;
  name: string;
  source: string;
  iconUrl?: string;
  quality?: string;
  qualityType?: string;
  itemLevelText?: string;
  wowheadUrl: string;
};

export type WowheadBisReport = {
  spec: string;
  title: string;
  sourceUrl: string;
  fetchedAt: string;
  modifiedAt?: string;
  items: WowheadBisItem[];
  warnings?: string[];
};

export type Character = {
  id: string;
  name: string;
  realm?: string;
  realmSlug?: string;
  region?: string;
  spec?: string;
  specName?: string;
  className?: string;
  level?: number;
  itemLevel?: number;
  equipped_item_level?: number;
  equipment?: Record<string, EquipmentItem>;
  media?: Record<string, string>;
  syncStatus?: "synced" | "partial" | "stale";
  profileStatus?: "ok" | "failed";
  gearStatus?: "ok" | "failed" | "empty" | "stale";
  mediaStatus?: "ok" | "failed" | "empty";
  syncError?: string;
  gearError?: string;
  mediaError?: string;
  profileSyncedAt?: string;
  gearSyncedAt?: string;
  equipmentSlotCount?: number;
  lastSyncRunId?: string;
  seenInLastSync?: boolean;
  syncedAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
};

export type BnetSyncWarning = {
  name: string;
  realmSlug: string;
  stage?: string;
  error: string;
};

export type BnetSyncResponse = {
  characters?: Character[];
  summary?: {
    found: number;
    synced: number;
    partial?: number;
    failed: number;
    stale?: number;
    staleCleaned?: number;
    gearFailed?: number;
    mediaFailed?: number;
    iconHydrated?: number;
    iconFailed?: number;
    iconRequested?: number;
    syncRunId?: string;
  };
  warnings?: BnetSyncWarning[];
  syncedAt?: string;
};

export type Target = {
  id: string;
  slot: string;
  slotLabel: string;
  priority: number;
  type: "dungeon" | "craft";
  target: string;
  icon: string;
  itemId?: number;
  wowheadUrl?: string;
  tooltipName?: string;
  source: string;
  boss: string;
  reason: string;
  check: string;
};

export type EquipmentSlot = {
  key: string;
  label: string;
  group: "armor" | "jewelry" | "trinket" | "weapon";
  enchant: boolean;
  gem: boolean;
  note?: string;
};

export type TodayTask = {
  id: string;
  title: string;
  itemName: string;
  body: string;
  detail: string;
  type: "urgent" | "dungeon" | "craft";
  action: string;
  icon?: string;
  score?: number;
  view?: View;
  command?: "sync";
  button?: string;
  done: boolean;
};

export type EquipmentRow = {
  slot: EquipmentSlot;
  slotKey: string;
  slotLabel: string;
  item: EquipmentItem | null;
  equippedItem: EquipmentItem | null;
  targetItem: EquipmentItem | null;
  comparisonItem: EquipmentItem | null;
  target: Target | null;
  score: number;
  type: "dungeon" | "craft" | "none";
  enhancement: {
    label: string;
    detail: string;
    tone: "ok" | "warn";
  };
};

export type MaintenanceRow = {
  todoId: string;
  slotKey: string;
  slotLabel: string;
  item: EquipmentItem | null;
  priority: number;
  enhancement: {
    label: string;
    detail: string;
    tone: "ok" | "warn";
  };
};

export type DungeonBoss = {
  name: string;
  ko?: string;
  risk: string;
  one: string;
  do: string[];
  healer: string;
  diagram?: string;
};

export type DungeonGuide = {
  id: string;
  name: string;
  short: string;
  timer: string;
  href: string;
  videoUrl?: string;
  videoTitle?: string;
  sourceLabel?: string;
  en?: string;
  theme?: string;
  route: string;
  danger: string;
  overview: string[];
  bosses: DungeonBoss[];
};

export type DungeonRecommendation = {
  id: string;
  name: string;
  short: string;
  href: string;
  why: string;
  loot: string;
  memo: string;
  count: number;
  score: number;
  targets: Target[];
  guide?: DungeonGuide;
};

export type FreshnessItem = { label: string; tone: Tone; detail: string };

export type DataFreshness = {
  bnet: FreshnessItem;
  rio: FreshnessItem;
  cloud: FreshnessItem;
};

export type TodaySnapshot = {
  character: Character;
  equipmentRows: EquipmentRow[];
  todayTasks: TodayTask[];
  maintenanceRows: MaintenanceRow[];
  dungeonRecommendations: DungeonRecommendation[];
  recentRuns: unknown[];
  dataFreshness: DataFreshness;
  gearRecommendation?: GearRecommendationResult;
};

export type AiPlanAction = {
  rank: number;
  title: string;
  type: ActionType;
  reason: string;
  evidence: string[];
  estimatedTime: string;
  targetId?: string | null;
  dungeonId?: string | null;
};

export type AiPlan = {
  id: string;
  generatedAt: string;
  model: string;
  mode: PlanMode;
  title: string;
  summary: string;
  confidence: Confidence;
  actions: AiPlanAction[];
  timePlans: { short: string[]; normal: string[]; long: string[] };
  avoid: string[];
  assumptions: string[];
  dataWarnings: string[];
  sources: Array<{ title: string; url: string }>;
  snapshotHash?: string;
  trigger?: AiTrigger;
  savedAt?: unknown;
};

export type AiPlanRequest = {
  characterId: string;
  date: string;
  preferences: AiPreferences;
  snapshot: TodaySnapshot;
  snapshotHash: string;
  trigger: AiTrigger;
};

export type DungeonGuideFeedbackType =
  | "wrong"
  | "mechanic_wrong"
  | "order_wrong"
  | "unclear"
  | "too_long"
  | "mobile_hard"
  | "worked"
  | "needs_more_detail";

export type DungeonGuideFeedback = {
  id: string;
  dungeonId: string;
  phaseId?: string;
  bossName?: string;
  feedbackType: DungeonGuideFeedbackType;
  message: string;
  createdAt: string;
};

export type V8Settings = {
  done?: Record<string, boolean>;
  hidden?: Record<string, boolean>;
  note?: string;
  lastView?: View | string;
  activeCharacterId?: string;
  latestAiPlanId?: string;
  lastBnetSyncAt?: string;
  lastBnetSyncSummary?: BnetSyncResponse["summary"];
  lastBnetSyncWarnings?: BnetSyncWarning[];
  lastRioRefreshAt?: string;
  lastWowheadBisRefreshAt?: string;
  gearCoachPreferences?: GearCoachPreferences;
  dungeonGuideFeedback?: DungeonGuideFeedback[];
};
