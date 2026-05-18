import type { DungeonBoss, DungeonGuide } from "../types";
import { legacyDiagramInfo, legacyDungeonData, officialDungeonGuides } from "./dungeonGuideData";

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

export type RichDungeonGuide = DungeonGuide & {
  meta: {
    href: string;
    loot: string;
    why: string;
  };
};

const officialDungeonGuideById = officialDungeonGuides as unknown as Partial<Record<string, DungeonGuidePatch>>;

function mergeDungeonGuide(guide: (typeof legacyDungeonData)[number]): RichDungeonGuide {
  const official = officialDungeonGuideById[guide.id] || {};
  const overview = [...(official.overview || guide.overview)];
  const bosses = [...(official.bosses || guide.bosses)].map((boss) => ({ ...boss, do: [...boss.do] }));
  const merged = {
    ...guide,
    ...official,
    href: wythicDungeonLinks[guide.id] || `https://wythic.com/ko/dungeon/${guide.id}`,
    overview,
    bosses,
  } as DungeonGuide;
  return {
    ...merged,
    meta: {
      href: merged.href,
      loot: "현재 개인 목표 아이템 없음",
      why: `${merged.route}. ${merged.danger} 구간만 먼저 확인하면 실수 확률이 줄어듭니다.`,
    },
  };
}

export const dungeonGuideCatalog = legacyDungeonData.map(mergeDungeonGuide);
export { legacyDiagramInfo };
