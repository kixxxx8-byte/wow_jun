import type { GearCandidate } from "../../domain/gearTypes";

export const raidLootCandidates: GearCandidate[] = [
  {
    itemId: 249343,
    nameKo: "알른 선견자의 응시",
    slot: "TRINKET_1",
    sourceType: "raid",
    sourceNameKo: "레이드",
    sourceRaidKey: "midnight-raid",
    bossNameKo: "키마이루스",
    isSeasonalReward: false,
    acquisition: {
      certainty: "weekly_rng",
      timeCost: "high",
      weeklyLimited: true,
      requiresGroup: true,
      notesKo: "레이드 제외 모드에서는 추천하지 않습니다.",
    },
    trinketMeta: {
      role: "single_target",
      usage: "proc",
      tier: "주의",
      contentFocus: "raid",
      needsSim: true,
      sources: ["Manual", "Wowhead"],
      confidence: "medium",
      notesKo: "레이드 장신구는 모드에 따라 비교용으로만 표시됩니다.",
    },
    dataSource: "manual",
    confidence: "medium",
    verifiedAt: "2026-05-20",
  },
];
