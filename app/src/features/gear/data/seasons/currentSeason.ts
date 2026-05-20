import type { SeasonConfig } from "../../domain/gearTypes";

export const CURRENT_SEASON_ID = "current";

export const currentSeason: SeasonConfig = {
  id: CURRENT_SEASON_ID,
  labelKo: "현재 시즌",
  labelEn: "Current Season",
  expansionKey: "midnight",
  isCurrent: true,
  dungeonPool: [
    { key: "magisters", nameKo: "마법학자의 정원", nameEn: "Magisters' Terrace", originalExpansion: "The Burning Crusade", isSeasonalMythicPlus: true },
    { key: "maisara", nameKo: "마이사라 동굴", nameEn: "Maisara Caverns", isSeasonalMythicPlus: true },
    { key: "xenas", nameKo: "연결지점 제나스", nameEn: "Nexus-Point Xenas", isSeasonalMythicPlus: true },
    { key: "windrunner", nameKo: "윈드러너 첨탑", nameEn: "Windrunner Spire", isSeasonalMythicPlus: true },
    { key: "algethar", nameKo: "알게타르 대학", nameEn: "Algeth'ar Academy", originalExpansion: "Dragonflight", isSeasonalMythicPlus: true },
    { key: "seat", nameKo: "삼두정의 권좌", nameEn: "Seat of the Triumvirate", originalExpansion: "Legion", isSeasonalMythicPlus: true },
    { key: "skyreach", nameKo: "하늘탑", nameEn: "Skyreach", originalExpansion: "Warlords of Draenor", isSeasonalMythicPlus: true },
    { key: "saron", nameKo: "사론의 구덩이", nameEn: "Pit of Saron", originalExpansion: "Wrath of the Lich King", isSeasonalMythicPlus: true },
  ],
  verifiedAt: "2026-05-20",
};
