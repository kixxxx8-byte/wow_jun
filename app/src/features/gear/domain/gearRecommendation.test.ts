import { describe, expect, it } from "vitest";
import { defaultCharacter } from "../../../domain/planning";
import { craftedGearCandidates } from "../data/seasons";
import { currentSeason } from "../data/seasons/currentSeason";
import { currentDungeonLootCandidates } from "../data/seasons/currentDungeonLoot";
import { raidLootCandidates } from "../data/seasons/raidLoot";
import { legacyTargetToGearCandidate } from "./adapters";
import type { GearCandidate } from "./gearTypes";
import { getDisplayItemName, getDisplaySourceName } from "./localization";
import { recommendGear } from "./gearRecommendation";
import { isValidCurrentSeasonDungeonCandidate, rejectionForSeason } from "./seasonFilter";

const baseDungeonCandidate: GearCandidate = {
  itemId: 1,
  nameKo: "검증된 던전 장신구",
  slot: "TRINKET_1",
  sourceType: "dungeon",
  sourceNameKo: "사론의 구덩이",
  sourceDungeonKey: "saron",
  seasonId: currentSeason.id,
  isSeasonalReward: true,
  acquisition: {
    certainty: "repeatable_rng",
    timeCost: "medium",
    weeklyLimited: false,
    requiresGroup: true,
  },
  trinketMeta: {
    role: "aoe",
    usage: "proc",
    confidence: "medium",
  },
  dataSource: "curated",
  confidence: "medium",
};

describe("v9 gear recommendation domain", () => {
  it("does not fall back to English names in display helpers", () => {
    expect(getDisplayItemName({ ...baseDungeonCandidate, nameKo: "", nameEn: "English Item" })).toBe("한국어 이름 확인 중");
    expect(getDisplaySourceName({ ...baseDungeonCandidate, sourceNameKo: "", sourceNameEn: "English Source" })).toBe("출처 확인 중");
  });

  it("rejects invalid current season dungeon candidates", () => {
    expect(isValidCurrentSeasonDungeonCandidate(baseDungeonCandidate, currentSeason)).toBe(true);
    expect(rejectionForSeason({ ...baseDungeonCandidate, seasonId: "old" }, currentSeason)?.reason).toBe("not_current_season");
    expect(rejectionForSeason({ ...baseDungeonCandidate, sourceDungeonKey: "not-current" }, currentSeason)?.reason).toBe("dungeon_not_in_pool");
    expect(rejectionForSeason({ ...baseDungeonCandidate, isSeasonalReward: false }, currentSeason)?.reason).toBe("not_seasonal_reward");
    expect(rejectionForSeason({ ...baseDungeonCandidate, confidence: "low" }, currentSeason)?.reason).toBe("low_confidence");
  });

  it("hides raid and low-confidence candidates from dungeon craft only recommendations", () => {
    const result = recommendGear({
      character: defaultCharacter,
      mode: "dungeon_craft_only",
      season: currentSeason,
      candidates: [...craftedGearCandidates, ...raidLootCandidates, ...currentDungeonLootCandidates],
    });

    expect(result.priorityUpgrades.every((row) => row.sourceType !== "raid")).toBe(true);
    expect(result.priorityUpgrades.every((row) => row.recommendedItem.confidence !== "low")).toBe(true);
    expect(result.rejectedCandidates.some((row) => row.sourceType === "raid" && row.reason === "source_not_allowed")).toBe(true);
    expect(result.rejectedCandidates.some((row) => row.reason === "low_confidence" || row.reason === "not_seasonal_reward")).toBe(true);
  });

  it("keeps target best set and weekly action plan separated", () => {
    const result = recommendGear({
      character: defaultCharacter,
      mode: "craft_priority",
      season: currentSeason,
      candidates: craftedGearCandidates,
    });

    expect(result.targetBestSet.items.length).toBeGreaterThan(0);
    expect(result.weeklyActionPlan.actions.length).toBeGreaterThan(0);
    expect(result.guaranteedUpgrades.length).toBeGreaterThan(0);
    expect(result.rngFarmingTargets).toHaveLength(0);
    expect(result.targetBestSet.notesKo).toContain("실제 심크 DPS가 아니라");
  });

  it("does not recommend an item that is already equipped from Battle.net data", () => {
    const result = recommendGear({
      character: {
        ...defaultCharacter,
        equipment: {
          OFF_HAND: { id: 237837, name: "원정순찰대원의 자비", level: 285 },
        },
      },
      mode: "dungeon_craft_only",
      season: currentSeason,
      candidates: craftedGearCandidates,
    });

    expect(result.priorityUpgrades.map((row) => row.recommendedItem.itemId)).not.toContain(237837);
    expect(result.weeklyActionPlan.actions.map((row) => row.relatedItemIds || []).flat()).not.toContain(237837);
    expect(result.rejectedCandidates).toContainEqual(expect.objectContaining({
      itemId: 237837,
      reason: "duplicate_unique_equip",
      reasonKo: "이미 장착 중인 아이템입니다.",
    }));
  });

  it("does not label slots without verified candidates as keep", () => {
    const result = recommendGear({
      character: {
        ...defaultCharacter,
        equipment: {
          HEAD: { id: 123456, name: "현재 머리", level: 285 },
        },
      },
      mode: "dungeon_craft_only",
      season: currentSeason,
      candidates: [],
    });

    const head = result.slotDetails.find((row) => row.slot === "HEAD");
    expect(head?.status).toBe("no_verified_candidate");
    expect(head?.reasonKo).toContain("BIS 완료를 의미하지 않습니다");
  });

  it("marks legacy source conflicts as unsafe for default recommendation", () => {
    const candidate = legacyTargetToGearCandidate({
      id: "legacy-raid-as-dungeon",
      slot: "trinket",
      slotLabel: "장신구",
      priority: 100,
      type: "dungeon",
      target: "레이드 장신구",
      icon: "",
      itemId: 999,
      source: "레이드",
      boss: "보스",
      reason: "기존 데이터 충돌",
      check: "확인",
    });

    expect(candidate.sourceType).toBe("raid");
    expect(candidate.confidence).toBe("low");
  });
});
