import { describe, expect, it } from "vitest";
import type { Character } from "../../../types";
import { midnightS1ItemRecords, midnightS1Items } from "../data/midnightS1Items";
import { evaluateCharacterGear, evaluateGearSlot, getGearCandidatesForSlot, trinketTierForSpec } from "./gearInspection";
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

  it("finds slot candidates and only returns an equipped item when a higher variant exists", () => {
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
      currentItem: { id: 237837, name: "원정순찰대원의 자비", level: 276, slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      seasonItems: midnightS1Items,
    })).toHaveLength(0);
    expect(getGearCandidatesForSlot({
      slot: "OFF_HAND",
      specProfile: specProfiles["rogue-assassination"],
      currentItem: { id: 237837, name: "원정순찰대원의 자비", level: 263, slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      seasonItems: midnightS1Items,
    }).some((item) => item.itemId === 237837)).toBe(true);
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

  it("shares leather and trinket candidates with Devourer without mixing rogue-only weapons", () => {
    const profile = specProfiles["demon-hunter-devourer"];
    const wrist = getGearCandidatesForSlot({
      slot: "WRIST",
      specProfile: profile,
      currentItem: { id: 9991, name: "현재 손목", level: 250, slot: "WRIST", slotLabelKo: "손목", secondaryStats: [] },
      seasonItems: midnightS1Items,
    });
    const offhand = getGearCandidatesForSlot({
      slot: "OFF_HAND",
      specProfile: profile,
      currentItem: { id: 9992, name: "현재 보조무기", level: 250, slot: "OFF_HAND", slotLabelKo: "보조무기", secondaryStats: [] },
      seasonItems: midnightS1Items,
    });
    const trinkets = getGearCandidatesForSlot({
      slot: "TRINKET_1",
      specProfile: profile,
      currentItem: { id: 9993, name: "현재 장신구", level: 250, slot: "TRINKET_1", slotLabelKo: "장신구 1", secondaryStats: [] },
      seasonItems: midnightS1Items,
    });

    expect(wrist.some((item) => item.shareScope === "crafted_shared")).toBe(true);
    expect(trinkets.some((item) => item.shareScope === "shared_trinket")).toBe(true);
    expect(offhand.some((item) => item.shareScope === "rogue_weapon")).toBe(false);
  });

  it("keeps trinket tiers spec-specific and flags conflict-prone picks for simming", () => {
    const gaze = midnightS1ItemRecords.find((item) => item.itemId === 249343)!;
    const contract = midnightS1ItemRecords.find((item) => item.itemId === 260235)!;

    expect(trinketTierForSpec(gaze, specProfiles["rogue-assassination"])?.tier).toBe("S");
    expect(trinketTierForSpec(gaze, specProfiles["rogue-outlaw"])?.tier).toBe("A");
    expect(trinketTierForSpec(contract, specProfiles["rogue-outlaw"])?.tier).toBe("S");
    expect(trinketTierForSpec(contract, specProfiles["rogue-subtlety"])?.confidence).toBe("medium");
    expect(trinketTierForSpec(contract, specProfiles["rogue-subtlety"])?.needsSim).toBe(true);
  });

  it("stores multiple upgrade track variants for a single item", () => {
    const gaze = midnightS1ItemRecords.find((item) => item.itemId === 249343)!;
    expect(gaze.variants.some((variant) => variant.track === "champion" && variant.rank === 1)).toBe(true);
    expect(gaze.variants.some((variant) => variant.track === "hero" && variant.rank === 6)).toBe(true);
    expect(gaze.variants.some((variant) => variant.track === "myth" && variant.rank === 6)).toBe(true);
    expect(new Set(gaze.variants.map((variant) => variant.variantId)).size).toBe(gaze.variants.length);
  });
});
