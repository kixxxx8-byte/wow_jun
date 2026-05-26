import type { GearCandidate } from "../../domain/gearTypes";
import { CURRENT_SEASON_ID } from "./currentSeason";

export const currentDungeonLootCandidates: GearCandidate[] = [
  {
    itemId: 193701,
    nameKo: "알게타르 수수께끼 상자",
    slot: "TRINKET_2",
    sourceType: "dungeon",
    sourceNameKo: "알게타르 대학",
    sourceDungeonKey: "algethar",
    bossNameKo: "도라고사",
    seasonId: CURRENT_SEASON_ID,
    isSeasonalReward: false,
    originalExpansion: "Dragonflight",
    acquisition: {
      certainty: "repeatable_rng",
      timeCost: "medium",
      weeklyLimited: false,
      requiresGroup: true,
      notesKo: "던전 이름만으로 현재 시즌 보상 확정이 불가능해 기본 추천에서 숨깁니다.",
    },
    trinketMeta: {
      role: "burst",
      usage: "on_use",
      tier: "주의",
      contentFocus: "mythic_plus",
      needsSim: true,
      sources: ["Manual"],
      confidence: "low",
      notesKo: "장신구는 실제 성능 차이가 클 수 있어 SimC/Raidbots 확인이 필요합니다.",
    },
    dataSource: "manual",
    confidence: "low",
    verifiedAt: "2026-05-20",
  },
];
