import { describe, expect, it } from "vitest";
import { dungeonGuideCatalog } from "./dungeonCatalog";
import { buildFallbackPlan, buildSnapshotHash, buildTodaySnapshot, defaultCharacter, defaultPreferences, equipmentRows, gearReadinessScore, itemIcon, maintenanceRows, statTotals, targets, todayTasks } from "./planning";

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
    expect(offHand?.comparisonItem).toBeNull();
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

  it("calculates local gear readiness without treating reference BIS as active targets", () => {
    const rows = equipmentRows(defaultCharacter);
    const readiness = gearReadinessScore(rows);

    expect(readiness.current).toBeLessThanOrEqual(100);
    expect(readiness.target).toBeGreaterThanOrEqual(readiness.current);
    expect(readiness.urgent).toBe(0);
    expect(rows.every((row) => row.target === null)).toBe(true);
  });

  it("does not create enhancement chores when equipment or conditional sockets are not verified", () => {
    expect(maintenanceRows(defaultCharacter)).toHaveLength(0);
    expect(todayTasks(defaultCharacter).map((task) => task.id)).not.toContain("maintenance-WAIST");

    const character = {
      ...defaultCharacter,
      equipment: {
        WAIST: { name: "허리 장비", level: 300 },
        BACK: { name: "망토 장비", level: 300 },
      },
    };

    const maintenance = maintenanceRows(character);
    expect(maintenance.map((row) => row.slotKey)).toContain("BACK");
    expect(maintenance.map((row) => row.slotKey)).not.toContain("WAIST");
    expect(todayTasks(character).map((task) => task.id)).not.toContain("maintenance-BACK");
  });

  it("only asks for gems when an empty socket is explicitly known", () => {
    const character = {
      ...defaultCharacter,
      equipment: {
        WAIST: { name: "빈 홈 허리", level: 300, sockets: [{}] },
      },
    };

    const waist = maintenanceRows(character).find((row) => row.slotKey === "WAIST");
    expect(waist?.enhancement.label).toBe("보석 확인");
    expect(todayTasks(character).map((task) => task.id)).not.toContain("maintenance-WAIST");
  });

  it("prefers Battle.net item media icon URLs when present", () => {
    expect(itemIcon({ iconUrl: "https://example.test/icon.jpg", icon: "inv_fallback" })).toBe("https://example.test/icon.jpg");
    expect(itemIcon({ icon: "inv_fallback" })).toContain("inv_fallback.jpg");
  });

  it("has real item ids for primary target tooltips and explicit labels for pending targets", () => {
    const primaryIds = ["trinket-alnseer", "trinket-box", "ring-hope", "ring-midnight-eye", "weapon-victory", "weapon-mercy", "cloak-terrace"];
    primaryIds.forEach((id) => {
      const target = targets.find((row) => row.id === id);
      expect(target?.itemId).toBeTypeOf("number");
    });
    expect(targets.some((row) => row.source === "사론의 구덩이")).toBe(false);
  });

  it("does not recommend an item that is already equipped in the paired slot group", () => {
    const rows = equipmentRows({
      ...defaultCharacter,
      equipment: {
        TRINKET_1: { id: 249343, name: "알른 선견자의 응시", level: 272 },
        TRINKET_2: { id: 193701, name: "알게타르 수수께끼 상자", level: 272 },
        FINGER_1: { id: 249919, name: "희망의 신도레이 고리", level: 285 },
      },
    });
    const trinketTargets = rows.filter((row) => row.slot.group === "trinket").map((row) => row.target?.itemId).filter(Boolean);
    const ringTargets = rows.filter((row) => row.slot.group === "jewelry" && row.slotKey.startsWith("FINGER")).map((row) => row.target?.itemId).filter(Boolean);

    expect(trinketTargets).not.toContain(249343);
    expect(trinketTargets).not.toContain(193701);
    expect(ringTargets).not.toContain(249919);
    expect(ringTargets).toHaveLength(0);
  });

  it("assigns different targets to paired equipment slots", () => {
    const rows = equipmentRows(defaultCharacter);
    const pairedTargets = rows
      .filter((row) => ["FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2", "MAIN_HAND", "OFF_HAND"].includes(row.slotKey))
      .map((row) => row.target?.itemId)
      .filter(Boolean);

    expect(new Set(pairedTargets).size).toBe(pairedTargets.length);
  });

  it("uses the rich dungeon catalog as the canonical guide source", () => {
    expect(dungeonGuideCatalog).toHaveLength(8);
    expect(dungeonGuideCatalog.every((guide) => guide.bosses.length > 0)).toBe(true);
    expect(dungeonGuideCatalog.some((guide) => guide.videoUrl && guide.meta.href.includes("wythic.com"))).toBe(true);
  });

  it("adds personal survival micro notes without replacing the simple guide", () => {
    expect(dungeonGuideCatalog.every((guide) => guide.microGuide?.topPriority.length && guide.microGuide.topPriority.length >= 3)).toBe(true);
    expect(dungeonGuideCatalog.some((guide) => guide.microGuide?.topPriority.some((note) => note.defensiveKo.includes("교란") || note.defensiveKo.includes("그망")))).toBe(true);
    expect(dungeonGuideCatalog.some((guide) => guide.bosses.some((boss) => boss.microNote?.deathRiskKo))).toBe(true);
    expect(dungeonGuideCatalog.some((guide) => [guide.route, guide.danger, guide.microGuide?.oneLineKo].join(" ").includes("차단"))).toBe(true);
  });

  it("adds a cinematic Windrunner field guide without changing the rest of the dungeon catalog", () => {
    const windrunner = dungeonGuideCatalog.find((guide) => guide.id === "windrunner");
    expect(dungeonGuideCatalog).toHaveLength(8);
    expect(windrunner?.cinematicGuide?.titleKo).toContain("윈드러너");
    expect(windrunner?.cinematicGuide?.phases).toHaveLength(4);
    expect(windrunner?.cinematicGuide?.oneLineKo).toContain("어보미-벤시-대상자");
    expect(windrunner?.cinematicGuide?.phases.find((phase) => phase.id === "windrunner-hook-interrupt")?.moveKo).toContain("내장 걸쇠 - 칼리스 - 대상자");
    windrunner?.cinematicGuide?.phases.forEach((phase) => {
      expect(phase.oneLineKo).toBeTruthy();
      expect(phase.watchKo).toBeTruthy();
      expect(phase.moveKo).toBeTruthy();
      expect(phase.defensiveKo).toBeTruthy();
      expect(phase.animationType).toBeTruthy();
    });
  });
});
