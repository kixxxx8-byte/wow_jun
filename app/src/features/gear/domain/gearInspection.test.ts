import { describe, expect, it } from "vitest";
import type { Character } from "../../../types";
import { midnightS1Items } from "../data/midnightS1Items";
import { evaluateCharacterGear, evaluateGearSlot, getGearCandidatesForSlot } from "./gearInspection";
import { specProfiles } from "./specGuides";

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

