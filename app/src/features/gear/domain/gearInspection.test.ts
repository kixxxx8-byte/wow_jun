import { describe, expect, it } from "vitest";
import type { Character } from "../../../types";
import { midnightS1Items } from "../data/midnightS1Items";
import { evaluateCharacterGear, evaluateGearSlot, getGearCandidatesForSlot } from "./gearInspection";
import { advanceOutlawTime, applyOutlawAction, createOutlawScenarioState, getOutlawRecommendation, scoreOutlawAction } from "./outlawCombatSim";
import type { OutlawCombatState } from "./outlawCombatSim";
import { classGuides, specProfiles } from "./specGuides";

const character: Character = {
  id: "azshara:test",
  name: "테스트",
  realm: "아즈샤라",
  className: "도적",
  specName: "암살",
  equipment: {
    WRIST: { id: 1001, name: "현재 손목", level: 260, stats: [{ name: "치명타", value: 100 }, { name: "유연성", value: 80 }] },
    OFF_HAND: { id: 1002, name: "현재 보조무기", level: 260 },
    TRINKET_1: { id: 1003, name: "현재 장신구", level: 260 },
    HEAD: { id: 1004, name: "현재 머리", level: 260 },
  },
};

function advanceOutlawMany(state: OutlawCombatState, seconds: number) {
  return Array.from({ length: seconds }).reduce<OutlawCombatState>((nextState) => advanceOutlawTime(nextState, 1), state);
}

describe("gear inspection", () => {
  it("registers all supported guide profiles", () => {
    expect(Object.keys(specProfiles).sort()).toEqual([
      "demon-hunter-devourer",
      "rogue-assassination",
      "rogue-outlaw",
      "rogue-subtlety",
    ]);
    expect(Object.values(specProfiles).every((profile) => profile.source.url.includes("wowhead.com"))).toBe(true);
  });

  it("keeps the detailed outlaw guide data separate from other specs", () => {
    const outlaw = classGuides["rogue-outlaw"];
    const serializedOutlaw = JSON.stringify(outlaw);
    expect(outlaw.simpleCycleGuide?.titleKo).toBe("초간단 실전 사이클");
    expect(outlaw.simpleCycleGuide?.subtitleKo).toContain("처음엔 이것만");
    expect(outlaw.simpleCycleGuide?.steps.map((step) => step.titleKo)).toEqual(["버프 준비", "쿨기 톡톡", "버블 모으기", "마무리 쾅", "다시 반복"]);
    expect(outlaw.coreSummary?.headlineKo).toContain("쿨기 > 마무리 일격 > 생성기");
    expect(outlaw.deepGuide?.some((item) => item.titleKo.includes("미간 적중"))).toBe(true);
    expect(outlaw.deepGuide?.some((item) => item.titleKo.includes("Supercharger"))).toBe(true);
    expect(outlaw.keybindGuide?.summaryKo).toContain("스킬창");
    expect(outlaw.masteryGuide?.some((item) => item.titleKo.includes("숙련자를 위한 완벽함으로 가는 법"))).toBe(true);
    expect(outlaw.visualGuides?.keybindLayout.some((item) => item.labelKo === "미간 적중")).toBe(true);
    expect(serializedOutlaw).toContain("도박의 연속");
    expect(serializedOutlaw).toContain("도박의 연속(KIR)");
    expect(serializedOutlaw).toContain("Supercharger");
    expect(serializedOutlaw).not.toContain("계속 굴리기(KIR)");

    expect(classGuides["rogue-assassination"].simpleCycleGuide).toBeUndefined();
    expect(classGuides["rogue-assassination"].coreSummary).toBeUndefined();
    expect(classGuides["rogue-subtlety"].masteryGuide).toBeUndefined();
  });

  it("finds slot candidates without returning already equipped items", () => {
    const candidates = getGearCandidatesForSlot({
      slot: "OFF_HAND",
      specProfile: specProfiles["rogue-assassination"],
      currentItem: { ...character.equipment!.OFF_HAND!, slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      seasonItems: midnightS1Items,
    });

    expect(candidates.some((item) => item.itemId === 237837)).toBe(true);
    expect(getGearCandidatesForSlot({
      slot: "OFF_HAND",
      specProfile: specProfiles["rogue-assassination"],
      currentItem: { id: 237837, name: "원정순찰대원의 자비", slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      seasonItems: midnightS1Items,
    })).toHaveLength(0);
  });

  it("keeps shared leather candidates visible for Devourer while separating equipped items", () => {
    const candidates = getGearCandidatesForSlot({
      slot: "WRIST",
      specProfile: specProfiles["demon-hunter-devourer"],
      currentItem: { id: 777, name: "악사 손목", slot: "WRIST", slotLabelKo: "손목", armorType: "leather", secondaryStats: [] },
      seasonItems: midnightS1Items,
    });

    expect(candidates.some((item) => item.itemId === 244576)).toBe(true);
  });

  it("uses special statuses for craft, trinket, weapon, and missing DB", () => {
    const profile = specProfiles["rogue-assassination"];
    expect(evaluateGearSlot({
      slot: "WRIST",
      currentItem: { ...character.equipment!.WRIST!, slot: "WRIST", slotLabelKo: "손목", secondaryStats: ["crit", "versatility"] },
      specProfile: profile,
      seasonItems: midnightS1Items,
    }).status).toBe("crafted-recommended");

    expect(evaluateGearSlot({
      slot: "TRINKET_1",
      currentItem: { ...character.equipment!.TRINKET_1!, slot: "TRINKET_1", slotLabelKo: "장신구 1", secondaryStats: [] },
      specProfile: profile,
      seasonItems: midnightS1Items,
    }).status).toBe("trinket-check");
    expect(evaluateGearSlot({
      slot: "TRINKET_1",
      currentItem: { ...character.equipment!.TRINKET_1!, slot: "TRINKET_1", slotLabelKo: "장신구 1", secondaryStats: [] },
      specProfile: profile,
      seasonItems: midnightS1Items,
    }).topCandidate?.item.trinketTier?.tier).toBe("주의");

    expect(evaluateGearSlot({
      slot: "OFF_HAND",
      currentItem: { ...character.equipment!.OFF_HAND!, slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      specProfile: profile,
      seasonItems: midnightS1Items,
    }).status).toBe("weapon-priority");

    const missing = evaluateGearSlot({
      slot: "HEAD",
      currentItem: { ...character.equipment!.HEAD!, slot: "HEAD", slotLabelKo: "머리", secondaryStats: [] },
      specProfile: profile,
      seasonItems: midnightS1Items,
    });
    expect(missing.status).toBe("db-missing");
    expect(missing.summary).toContain("BIS라는 의미는 아닙니다");
  });

  it("builds character summary and todo items", () => {
    const result = evaluateCharacterGear({
      character,
      specProfile: specProfiles["rogue-assassination"],
      seasonItems: midnightS1Items,
    });

    expect(result.summary.craftedRecommended).toBeGreaterThan(0);
    expect(result.summary.trinketChecks).toBeGreaterThan(0);
    expect(result.todo.length).toBeGreaterThan(0);
  });
});

describe("outlaw combat simulator", () => {
  it("prioritizes Blade Flurry when multiple targets are active", () => {
    const state = createOutlawScenarioState("aoe_pull");
    expect(getOutlawRecommendation(state).skillKo).toBe("폭풍의 칼날");
  });

  it("prioritizes Keep It Rolling when Roll the Bones is strong", () => {
    const state = {
      ...createOutlawScenarioState("single_dummy"),
      rollStage: 3 as const,
      buffs: { bladeFlurry: 0, sliceAndDice: 18, adrenalineRush: 0 },
      cooldowns: { ...createOutlawScenarioState("single_dummy").cooldowns, keepItRolling: 0, rollTheBones: 30 },
    };

    expect(getOutlawRecommendation(state).skillKo).toBe("도박의 연속(KIR)");
  });

  it("uses Between the Eyes at high combo points", () => {
    const state = {
      ...createOutlawScenarioState("single_dummy"),
      comboPoints: 6,
      rollStage: 2 as const,
      buffs: { bladeFlurry: 0, sliceAndDice: 18, adrenalineRush: 0 },
      cooldowns: { ...createOutlawScenarioState("single_dummy").cooldowns, bladeRush: 15, betweenTheEyes: 0, rollTheBones: 30 },
    };

    expect(getOutlawRecommendation(state).skillKo).toBe("미간 적중");
  });

  it("does not recommend Pistol Shot only because opportunity exists", () => {
    const state = {
      ...createOutlawScenarioState("single_dummy"),
      comboPoints: 0,
      rollStage: 2 as const,
      opportunityStacks: 3 as const,
      buffs: { bladeFlurry: 0, sliceAndDice: 18, adrenalineRush: 0 },
      cooldowns: { ...createOutlawScenarioState("single_dummy").cooldowns, bladeRush: 15, rollTheBones: 30 },
    };

    expect(getOutlawRecommendation(state).skillKo).toBe("아드레날린 촉진");
  });

  it("uses Preparation only when core cooldowns are locked", () => {
    expect(getOutlawRecommendation(createOutlawScenarioState("cooldowns_locked")).skillKo).toBe("준비");
    expect(getOutlawRecommendation(createOutlawScenarioState("single_dummy")).skillKo).not.toBe("준비");
  });

  it("records why a wrong button is wrong", () => {
    const result = scoreOutlawAction(createOutlawScenarioState("aoe_pull"), { skillKo: "사악한 일격" });
    expect(result.result).toBe("wrong");
    expect(result.messageKo).toContain("폭풍의 칼날");
    expect(result.messageKo).toContain("2타겟 이상");
  });

  it("surfaces timed mechanics above damage buttons", () => {
    const firstMechanic = advanceOutlawMany(createOutlawScenarioState("aoe_pull"), 2);
    const afterFlurry = applyOutlawAction(firstMechanic, { skillKo: "폭풍의 칼날" });
    const state = advanceOutlawMany(afterFlurry, 5);
    expect(state.activeMechanic?.titleKo).toBe("위험 시전");
    expect(getOutlawRecommendation(state).skillKo).toBe("발차기");
  });

  it("resolves mechanics and rewards correct reactions", () => {
    const firstMechanic = advanceOutlawMany(createOutlawScenarioState("aoe_pull"), 2);
    const afterFlurry = applyOutlawAction(firstMechanic, { skillKo: "폭풍의 칼날" });
    const state = advanceOutlawMany(afterFlurry, 5);
    const next = applyOutlawAction(state, { skillKo: "발차기" });
    expect(next.resolvedMechanicIds).toContain("aoe-kick-1");
    expect(next.score).toBeGreaterThan(state.score);
    expect(next.streak).toBeGreaterThan(0);
  });

  it("penalizes missed lethal mechanics over time", () => {
    const firstMechanic = advanceOutlawMany(createOutlawScenarioState("aoe_pull"), 2);
    const afterFlurry = applyOutlawAction(firstMechanic, { skillKo: "폭풍의 칼날" });
    const activeKick = advanceOutlawMany(afterFlurry, 5);
    const state = advanceOutlawMany(activeKick, 4);
    expect(state.health).toBeLessThan(100);
    expect(state.mistakes).toBeGreaterThan(0);
  });
});

