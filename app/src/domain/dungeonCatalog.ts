import type { DungeonBoss, DungeonGuide } from "../types";
import { dungeonCinematicGuides, type DungeonCinematicGuide, type DungeonGuideAudit, type DungeonGuideConfidence } from "./dungeonCinematicGuides";
import { legacyDiagramInfo, legacyDungeonData, officialDungeonGuides } from "./dungeonGuideData";
import { dungeonMicroGuides, type DungeonMicroGuide, type DungeonMicroNote } from "./dungeonMicroGuides";

export const WOW_KR_YOUTUBE = "https://www.youtube.com/@WorldofWarcraftKR";

export const wythicDungeonLinks: Record<string, string> = {
  magisters: "https://wythic.com/ko/dungeon/magisters-terrace",
  maisara: "https://wythic.com/ko/dungeon/maisara-caverns",
  xenas: "https://wythic.com/ko/dungeon/nexus-point-xenas",
  windrunner: "https://wythic.com/ko/dungeon/windrunner-spire",
  algethar: "https://wythic.com/ko/dungeon/algeth-ar-academy",
  seat: "https://wythic.com/ko/dungeon/seat-of-the-triumvirate",
  skyreach: "https://wythic.com/ko/dungeon/skyreach",
  saron: "https://wythic.com/ko/dungeon/pit-of-saron",
};

type DungeonGuidePatch = Partial<Omit<DungeonGuide, "overview" | "bosses">> & {
  overview?: readonly string[];
  bosses?: readonly (Omit<DungeonBoss, "do"> & { do: readonly string[] })[];
};

export type RichDungeonBoss = DungeonBoss & { microNote?: DungeonMicroNote };

export type RichDungeonGuide = Omit<DungeonGuide, "bosses"> & {
  microGuide?: DungeonMicroGuide;
  cinematicGuide?: DungeonCinematicGuide;
  audit: DungeonGuideAudit;
  bosses: RichDungeonBoss[];
  meta: {
    href: string;
    loot: string;
    why: string;
  };
};

const officialDungeonGuideById = officialDungeonGuides as unknown as Partial<Record<string, DungeonGuidePatch>>;

const fallbackAuditByGuideId: Record<string, { confidence: DungeonGuideConfidence; summaryKo: string }> = {
  windrunner: {
    confidence: "cross_checked",
    summaryKo: "상세 작전은 복수 출처와 사용자 피드백으로 재검수했습니다.",
  },
  magisters: {
    confidence: "reviewing",
    summaryKo: "빠른 컨닝용 요약은 유지하지만, 보스별 세부 기믹은 추가 검수 중입니다.",
  },
  maisara: {
    confidence: "reviewing",
    summaryKo: "심플 공략 단계이며, 상세 생존 노트는 패턴별 재검수가 필요합니다.",
  },
  xenas: {
    confidence: "reviewing",
    summaryKo: "주요 위험 요소 중심 요약이며, 세부 타이밍은 추가 확인이 필요합니다.",
  },
  algethar: {
    confidence: "needs_feedback",
    summaryKo: "기존 시즌 경험 기반 요약이라 현재 시즌 기준 사용자 피드백이 필요합니다.",
  },
  seat: {
    confidence: "reviewing",
    summaryKo: "던전 흐름은 정리되어 있으나, 보스별 세부 처리 검수가 필요합니다.",
  },
  skyreach: {
    confidence: "needs_feedback",
    summaryKo: "현재 시즌 쐐기 기준 세부 기믹 피드백이 필요합니다.",
  },
  saron: {
    confidence: "needs_feedback",
    summaryKo: "레거시 던전 기반 요약이라 현재 시즌 튜닝 기준 검수가 필요합니다.",
  },
};

const confidenceLabelKo: Record<DungeonGuideConfidence, string> = {
  verified: "검수 완료",
  cross_checked: "교차 검수",
  reviewing: "검수 중",
  needs_feedback: "피드백 필요",
};

function buildGuideAudit(guideId: string, cinematicGuide?: DungeonCinematicGuide): DungeonGuideAudit {
  if (cinematicGuide?.audit) return cinematicGuide.audit;
  const fallback = fallbackAuditByGuideId[guideId] || {
    confidence: "reviewing" as const,
    summaryKo: "기본 공략은 표시하지만, 세부 기믹 검수가 필요합니다.",
  };
  return {
    confidence: fallback.confidence,
    confidenceLabelKo: confidenceLabelKo[fallback.confidence],
    summaryKo: fallback.summaryKo,
    lastChecked: "2026-06-04",
    sources: [],
    needsUserFeedback: fallback.confidence === "needs_feedback",
  };
}

function mergeDungeonGuide(guide: (typeof legacyDungeonData)[number]): RichDungeonGuide {
  const official = officialDungeonGuideById[guide.id] || {};
  const microGuide = dungeonMicroGuides[guide.id];
  const cinematicGuide = dungeonCinematicGuides[guide.id];
  const overview = [...(official.overview || guide.overview)];
  const bosses = [...(official.bosses || guide.bosses)].map((boss) => ({
    ...boss,
    do: [...boss.do],
    microNote: microGuide?.bossNotes?.[boss.name] || microGuide?.bossNotes?.[boss.ko || ""],
  }));
  const merged = {
    ...guide,
    ...official,
    href: wythicDungeonLinks[guide.id] || `https://wythic.com/ko/dungeon/${guide.id}`,
    overview,
    bosses,
    microGuide,
    cinematicGuide,
  };
  return {
    ...merged,
    bosses,
    microGuide,
    cinematicGuide,
    audit: buildGuideAudit(guide.id, cinematicGuide),
    meta: {
      href: merged.href,
      loot: "현재 개인 목표 아이템 없음",
      why: `${merged.route}. ${merged.danger} 구간만 먼저 확인하면 실수 확률이 줄어듭니다.`,
    },
  };
}

export const dungeonGuideCatalog = legacyDungeonData.map(mergeDungeonGuide);
export { legacyDiagramInfo };
