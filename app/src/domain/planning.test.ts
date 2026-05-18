import { describe, expect, it } from "vitest";
import { dungeonGuideCatalog } from "./dungeonCatalog";
import { buildFallbackPlan, buildSnapshotHash, buildTodaySnapshot, defaultCharacter, defaultPreferences, equipmentRows, gearReadinessScore, itemIcon, statTotals, targets } from "./planning";

describe("today planning domain", () => {
  it("builds a complete AI snapshot", () => {
    const snapshot = buildTodaySnapshot({ character: defaultCharacter, cloudReady: true, recentRuns: [{ dungeon: "알게타르 대학" }] });

    expect(snapshot.character.name).toBe("승선을준비하라");
    expect(snapshot.equipmentRows.length).toBeGreaterThan(10);
    expect(snapshot.todayTasks.length).toBeGreaterThan(0);
    expect(snapshot.dungeonRecommendations.length).toBeGreaterThan(0);
    expect(snapshot.dataFreshness.cloud.tone).toBe("ok");
  });

  it("creates a local fallback plan from today tasks", () => {
    const preferences = defaultPreferences();
    const snapshot = buildTodaySnapshot({ character: defaultCharacter, cloudReady: false });
    const plan = buildFallbackPlan(snapshot, preferences);

    expect(plan.model).toBe("local-fallback");
    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.timePlans.short.length).toBeGreaterThan(0);
    expect(plan.dataWarnings.length).toBeGreaterThan(0);
  });

  it("changes the snapshot hash when AI preferences change", () => {
    const snapshot = buildTodaySnapshot({ character: defaultCharacter, cloudReady: true });
    const base = defaultPreferences();
    const changed = { ...base, goal: "push" as const };

    expect(buildSnapshotHash(snapshot, base)).not.toBe(buildSnapshotHash(snapshot, changed));
  });

  it("does not display a neighboring weapon as the current empty offhand", () => {
    const character = {
      ...defaultCharacter,
      equipment: {
        MAIN_HAND: {
          name: "main weapon",
          level: 300,
          stats: [{ type: "CRIT_RATING", value: 10 }],
        },
      },
    };
    const rows = equipmentRows(character);
    const mainHand = rows.find((row) => row.slotKey === "MAIN_HAND");
    const offHand = rows.find((row) => row.slotKey === "OFF_HAND");

    expect(mainHand?.equippedItem?.name).toBe("main weapon");
    expect(offHand?.equippedItem).toBeNull();
    expect(offHand?.item).toBeNull();
    expect(offHand?.comparisonItem?.name).toBe("main weapon");
    expect(statTotals(rows).crit).toBe(10);
  });

  it("marks failed Battle.net equipment data as stale for planning confidence", () => {
    const snapshot = buildTodaySnapshot({
      character: {
        ...defaultCharacter,
        equipment: {},
        syncStatus: "partial",
        gearStatus: "failed",
        gearError: "equipment 503",
      },
      cloudReady: true,
    });

    expect(snapshot.dataFreshness.bnet.tone).toBe("err");
    expect(snapshot.dataFreshness.bnet.detail).toContain("equipment 503");
    expect(snapshot.todayTasks.some((task) => task.command === "sync")).toBe(true);
  });

  it("calculates local gear readiness from replacement and enhancement work", () => {
    const rows = equipmentRows(defaultCharacter);
    const readiness = gearReadinessScore(rows);

    expect(readiness.current).toBeLessThanOrEqual(100);
    expect(readiness.target).toBeGreaterThanOrEqual(readiness.current);
    expect(readiness.urgent).toBeGreaterThan(0);
  });

  it("prefers Battle.net item media icon URLs when present", () => {
    expect(itemIcon({ iconUrl: "https://example.test/icon.jpg", icon: "inv_fallback" })).toBe("https://example.test/icon.jpg");
    expect(itemIcon({ icon: "inv_fallback" })).toContain("inv_fallback.jpg");
  });

  it("has real item ids for primary target tooltips and explicit labels for pending targets", () => {
    const primaryIds = ["trinket-box", "trinket-sun", "ring-star", "ring-void", "weapon-krick", "weapon-offhand", "feet-boots"];
    primaryIds.forEach((id) => {
      const target = targets.find((row) => row.id === id);
      expect(target?.itemId).toBeTypeOf("number");
    });
    expect(targets.find((row) => row.id === "hands-dungeon")?.tooltipName).toBeTruthy();
  });

  it("uses the rich dungeon catalog as the canonical guide source", () => {
    expect(dungeonGuideCatalog).toHaveLength(8);
    expect(dungeonGuideCatalog.every((guide) => guide.bosses.length > 0)).toBe(true);
    expect(dungeonGuideCatalog.some((guide) => guide.videoUrl && guide.meta.href.includes("wythic.com"))).toBe(true);
  });
});
