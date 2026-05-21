export type SecondaryStat = "crit" | "haste" | "mastery" | "versatility";
export type MainStat = "agility" | "intellect" | "strength";
export type SpecKey = "rogue-assassination" | "rogue-outlaw" | "rogue-subtlety" | "demon-hunter-devourer";

export const statLabelKo: Record<SecondaryStat | MainStat, string> = {
  agility: "민첩성",
  intellect: "지능",
  strength: "힘",
  crit: "치명타",
  haste: "가속",
  mastery: "특화",
  versatility: "유연성",
};

export type SpecProfile = {
  specKey: SpecKey;
  classNameKo: string;
  specNameKo: string;
  mainStat: MainStat;
  statPriority: SecondaryStat[];
  statPriorityTextKo: string;
  statNotes: string[];
  importantSlots: Array<"weapon" | "trinket" | "tier" | "ring" | "neck" | "embellishment">;
  specialRules: {
    trinketsNeedManualCheck: boolean;
    weaponsAreHighPriority: boolean;
    tierSetIsHighPriority: boolean;
    craftedItemsAreFlexible: boolean;
    hasteBreakpointNote?: string;
  };
  source: {
    name: "Wowhead";
    url: string;
    lastChecked: string;
  };
  disclaimer: string;
};

export type ClassGuide = {
  specKey: SpecKey;
  heroTitleKo: string;
  heroSummaryKo: string;
  metrics: Array<{ title: string; value: string; detail: string }>;
  rotation: string[];
  gearChecks: string[];
  cautions: string[];
};

export const guideSpecOrder: SpecKey[] = [
  "rogue-assassination",
  "rogue-outlaw",
  "rogue-subtlety",
  "demon-hunter-devourer",
];

export const specProfiles: Record<SpecKey, SpecProfile> = {
  "rogue-assassination": {
    specKey: "rogue-assassination",
    classNameKo: "도적",
    specNameKo: "암살",
    mainStat: "agility",
    statPriority: ["crit", "haste", "mastery", "versatility"],
    statPriorityTextKo: "민첩성/아이템 레벨 > 치명타 > 가속 > 특화 > 유연성",
    statNotes: [
      "치명타와 가속을 우선 보되, 실제 가치는 장비 조합과 특성에 따라 달라집니다.",
      "독, 출혈, 쿨기 타이밍이 맞지 않으면 스탯만 좋아도 체감 성능이 낮을 수 있습니다.",
    ],
    importantSlots: ["weapon", "trinket", "tier", "embellishment"],
    specialRules: {
      trinketsNeedManualCheck: true,
      weaponsAreHighPriority: true,
      tierSetIsHighPriority: true,
      craftedItemsAreFlexible: true,
    },
    source: {
      name: "Wowhead",
      url: "https://www.wowhead.com/ko/guide/classes/rogue/assassination/overview-pve-dps",
      lastChecked: "2026-05-21",
    },
    disclaimer: "Wowhead 암살 도적 가이드를 기준으로 한 요약 판정입니다.",
  },
  "rogue-outlaw": {
    specKey: "rogue-outlaw",
    classNameKo: "도적",
    specNameKo: "무법",
    mainStat: "agility",
    statPriority: ["haste", "crit", "versatility", "mastery"],
    statPriorityTextKo: "민첩성/아이템 레벨 > 가속 목표 구간 > 치명타/유연성 > 특화",
    statNotes: [
      "무법은 가속과 운용감의 영향이 커서 단순 스탯 점수만으로 판단하지 않습니다.",
      "칼날 부채식 광역 유지와 자원 순환 때문에 무기와 장신구 확인 우선도가 높습니다.",
    ],
    importantSlots: ["weapon", "trinket", "tier", "ring", "embellishment"],
    specialRules: {
      trinketsNeedManualCheck: true,
      weaponsAreHighPriority: true,
      tierSetIsHighPriority: true,
      craftedItemsAreFlexible: true,
      hasteBreakpointNote: "가속은 무법의 자원 순환과 운용감에 직접 영향을 줍니다.",
    },
    source: {
      name: "Wowhead",
      url: "https://www.wowhead.com/guide/classes/rogue/outlaw/overview-pve-dps",
      lastChecked: "2026-05-21",
    },
    disclaimer: "Wowhead 무법 도적 가이드를 기준으로 한 요약 판정입니다.",
  },
  "rogue-subtlety": {
    specKey: "rogue-subtlety",
    classNameKo: "도적",
    specNameKo: "잠행",
    mainStat: "agility",
    statPriority: ["mastery", "haste", "crit", "versatility"],
    statPriorityTextKo: "민첩성/아이템 레벨 > 특화 > 가속 기준점 > 치명타 > 유연성",
    statNotes: [
      "기만자와 죽음추적자 모두 특화 가치가 높지만, 가속 기준점은 운용감에 영향을 줍니다.",
      "쐐기와 다중 대상에서는 특화 비중이 더 중요해질 수 있습니다.",
    ],
    importantSlots: ["weapon", "trinket", "tier", "embellishment"],
    specialRules: {
      trinketsNeedManualCheck: true,
      weaponsAreHighPriority: true,
      tierSetIsHighPriority: true,
      craftedItemsAreFlexible: true,
      hasteBreakpointNote: "기만자는 약 700 가속, 죽음추적자는 더 높은 가속 기준을 확인합니다.",
    },
    source: {
      name: "Wowhead",
      url: "https://www.wowhead.com/guide/classes/rogue/subtlety/overview-pve-dps",
      lastChecked: "2026-05-21",
    },
    disclaimer: "Wowhead 잠행 도적 가이드를 기준으로 한 요약 판정입니다.",
  },
  "demon-hunter-devourer": {
    specKey: "demon-hunter-devourer",
    classNameKo: "악마사냥꾼",
    specNameKo: "Devourer",
    mainStat: "intellect",
    statPriority: ["mastery", "haste", "crit", "versatility"],
    statPriorityTextKo: "지능/아이템 레벨 > 특화/가속 > 치명타 > 유연성",
    statNotes: [
      "Devourer는 공허 변신과 Collapsing Star 운용 때문에 특화와 가속 가치가 큽니다.",
      "빌드에 따라 가속과 특화 우선도가 바뀔 수 있어 최종 비교는 시뮬레이션이 필요합니다.",
    ],
    importantSlots: ["weapon", "trinket", "tier", "embellishment"],
    specialRules: {
      trinketsNeedManualCheck: true,
      weaponsAreHighPriority: true,
      tierSetIsHighPriority: true,
      craftedItemsAreFlexible: true,
    },
    source: {
      name: "Wowhead",
      url: "https://www.wowhead.com/guide/classes/demon-hunter/devourer/overview-pve-dps",
      lastChecked: "2026-05-21",
    },
    disclaimer: "Wowhead Devourer Demon Hunter 가이드를 기준으로 한 요약 판정입니다.",
  },
};

export const classGuides: Record<SpecKey, ClassGuide> = {
  "rogue-assassination": {
    specKey: "rogue-assassination",
    heroTitleKo: "암살 도적 핵심 결론",
    heroSummaryKo: "암살은 독과 출혈을 유지하면서 쿨기 구간의 피해를 정리하는 전문화입니다. 장비 점검에서는 무기, 장신구, 티어, 제작 장식 부위를 먼저 확인합니다.",
    metrics: [
      { title: "주 능력치", value: "민첩성", detail: "아이템 레벨과 함께 확인" },
      { title: "우선 스탯", value: "치명/가속", detail: "기본 점검 기준" },
      { title: "중요 부위", value: "무기·장신구", detail: "별도 확인" },
    ],
    rotation: [
      "독과 출혈 유지가 먼저입니다.",
      "주요 쿨기 전에는 자원과 버프 상태를 정리합니다.",
      "광역에서는 다중 대상 유지와 폭발 구간을 따로 확인합니다.",
      "최종 딜 비교는 현재 장비 기준으로 Raidbots Top Gear를 확인합니다.",
    ],
    gearChecks: [
      "단검과 보조무기는 교체 우선순위를 높게 둡니다.",
      "장신구는 효과와 내부 쿨이 중요하므로 단순 스탯으로 확정하지 않습니다.",
      "제작템은 치명/가속 또는 현재 부족한 보조 스탯을 맞추는 용도로 봅니다.",
      "티어 부위는 세트 효과가 깨지는지 먼저 확인합니다.",
    ],
    cautions: [
      "치명타가 높아도 현재 장비 조합에 따라 실제 효율은 달라질 수 있습니다.",
      "추천 점수는 DPS 수치가 아니라 교체 우선순위입니다.",
    ],
  },
  "rogue-outlaw": {
    specKey: "rogue-outlaw",
    heroTitleKo: "무법 도적 핵심 결론",
    heroSummaryKo: "무법은 가속과 자원 순환, 무기 성능의 체감이 큰 전문화입니다. 장비 점검에서는 무기와 장신구를 최우선 확인 대상으로 둡니다.",
    metrics: [
      { title: "주 능력치", value: "민첩성", detail: "무기 DPS와 함께 확인" },
      { title: "우선 스탯", value: "가속", detail: "운용감 영향 큼" },
      { title: "중요 부위", value: "무기", detail: "가장 먼저 확인" },
    ],
    rotation: [
      "주요 버프와 자원 상황을 보면서 마무리 일격을 낭비하지 않습니다.",
      "광역에서는 Blade Flurry 유지 여부가 장비 체감보다 먼저 영향을 줍니다.",
      "쿨기와 장신구를 억지로 묶기보다 실제 전투 길이에 맞춰 확인합니다.",
      "무기 교체는 아이템 레벨, 무기 종류, 특수효과를 함께 봅니다.",
    ],
    gearChecks: [
      "주무기와 보조무기는 다른 부위보다 우선 확인합니다.",
      "장신구는 사용 효과보다 실제 전투 리듬과 맞는지 확인합니다.",
      "반지와 목걸이는 보조 스탯 조합이 중요합니다.",
      "제작템은 부족한 가속/치명/유연 보완용으로 봅니다.",
    ],
    cautions: [
      "무법은 스탯보다 운용과 버프 상황이 결과를 크게 흔들 수 있습니다.",
      "가속이 높다고 항상 정답은 아니며 현재 장비 기준 시뮬레이션이 필요합니다.",
    ],
  },
  "rogue-subtlety": {
    specKey: "rogue-subtlety",
    heroTitleKo: "잠행 도적 핵심 결론",
    heroSummaryKo: "잠행은 Shadow Dance 중심의 짧은 폭딜 창을 정교하게 쓰는 전문화입니다. 기존 잠행 메모는 유지하되 새 가이드 구조에 맞춰 장비 점검 기준과 함께 정리합니다.",
    metrics: [
      { title: "권장 방향", value: "기만자", detail: "쐐기/대부분 실전" },
      { title: "우선 스탯", value: "특화·가속", detail: "기준점 확인" },
      { title: "중요 부위", value: "무기·티어", detail: "세트 보호" },
    ],
    rotation: [
      "어둠의 춤 창 안에 강한 기술을 밀어 넣는 것이 핵심입니다.",
      "기만자는 대부분 실전에서 안정적인 기본 선택지로 둡니다.",
      "죽음추적자는 순수 단일에서 비교하되, 대상이 늘면 가치가 바뀔 수 있습니다.",
      "가속 기준점과 장신구 사용 타이밍은 현재 장비 기준으로 다시 확인합니다.",
    ],
    gearChecks: [
      "특화와 가속이 붙은 후보를 우선 확인합니다.",
      "티어 교체는 2세트/4세트 유지 여부를 먼저 봅니다.",
      "장신구는 단순 스탯보다 폭딜 창과 맞는지가 중요합니다.",
      "제작템은 특화/가속 조합을 만들 수 있는지 확인합니다.",
    ],
    cautions: [
      "가속 목표는 하드캡이 아니라 운용 기준점입니다.",
      "쿨기 밖 템포가 느린 것은 정상적인 설계라 무조건 가속만 올리지 않습니다.",
    ],
  },
  "demon-hunter-devourer": {
    specKey: "demon-hunter-devourer",
    heroTitleKo: "Devourer Demon Hunter 핵심 결론",
    heroSummaryKo: "Devourer는 25야드 공허 기반 캐스터 성격을 가진 악마사냥꾼 전문화입니다. 공허 변신, 영혼 파편, Collapsing Star 운용 때문에 특화와 가속 방향을 함께 봅니다.",
    metrics: [
      { title: "주 능력치", value: "지능", detail: "가죽 장비 기반" },
      { title: "우선 스탯", value: "특화·가속", detail: "빌드별 변화" },
      { title: "중요 부위", value: "장신구", detail: "효과 확인" },
    ],
    rotation: [
      "공허 변신 전후로 자원과 영혼 파편을 준비합니다.",
      "Void Ray와 Collapsing Star 타이밍을 전투 흐름에 맞춥니다.",
      "이동이 잦은 전투에서는 캐스팅 가능한 위치를 먼저 잡습니다.",
      "근접 하이브리드 선택지는 특성과 전투 패턴에 맞춰 확인합니다.",
    ],
    gearChecks: [
      "특화/가속 후보를 우선 확인하되, 빌드에 따라 순서가 바뀔 수 있습니다.",
      "장신구는 공허 변신 구간과 맞는지 별도 확인합니다.",
      "무기와 제작템은 지능과 보조 스탯 방향을 함께 봅니다.",
      "세트 효과가 있다면 단순 아이템 레벨만으로 교체하지 않습니다.",
    ],
    cautions: [
      "Devourer는 새 전문화라 로그와 시뮬레이션 업데이트에 따라 기준이 바뀔 수 있습니다.",
      "추천 점수는 현재 앱의 점검용 기준이며 실제 DPS 확정값이 아닙니다.",
    ],
  },
};

export function specLabel(profile: SpecProfile) {
  return `${profile.classNameKo} ${profile.specNameKo}`;
}

