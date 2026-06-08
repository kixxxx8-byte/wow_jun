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
  simpleCycleGuide?: {
    titleKo: string;
    subtitleKo: string;
    steps: Array<{
      titleKo: string;
      bodyKo: string;
      skills: string[];
      cautionKo?: string;
    }>;
  };
  coreSummary?: {
    headlineKo: string;
    cards: Array<{ titleKo: string; bodyKo: string; tone?: "ok" | "warn" | "danger" }>;
    neverDo: string[];
  };
  deepGuide?: Array<{
    titleKo: string;
    whatKo: string;
    whenKo: string;
    whyKo: string;
    mistakeKo: string;
    exampleKo?: string;
  }>;
  practiceGuide?: {
    summaryKo: string;
    phases: Array<{ titleKo: string; cueKo?: string; steps: string[] }>;
  };
  keybindGuide?: {
    summaryKo: string;
    rules: string[];
    groups: Array<{
      titleKo: string;
      bindings: Array<{
        key: string;
        skillKo: string;
        reasonKo: string;
        priority?: "core" | "reactive" | "utility" | "advanced";
      }>;
    }>;
    mouseNoteKo: string;
    clickWarningKo: string;
  };
  masteryGuide?: Array<{ titleKo: string; goalKo: string; checks: string[]; warningKo?: string }>;
  visualGuides?: {
    priorityLadder: Array<{ labelKo: string; detailKo: string }>;
    openerTimeline: Array<{ labelKo: string; detailKo: string }>;
    kirTree: Array<{ conditionKo: string; actionKo: string; tone?: "ok" | "warn" }>;
    superchargerFlow: Array<{ conditionKo: string; actionKo: string }>;
    keybindLayout: Array<{ key: string; labelKo: string; groupKo: string }>;
  };
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
    heroSummaryKo: "무법은 모든 글로벌 쿨다운이 중요한 우선순위 전문화입니다. 장비 점검에서는 무기와 장신구를 먼저 보되, 실제 체감은 뼈주사위, 아드레날린 촉진, 미간 적중 운영이 크게 좌우합니다.",
    metrics: [
      { title: "주 능력치", value: "민첩성", detail: "무기 DPS와 함께 확인" },
      { title: "운용 구조", value: "쿨기 > 마격", detail: "생성기는 마지막" },
      { title: "중요 부위", value: "무기·장신구", detail: "별도 확인" },
    ],
    rotation: [
      "기본 판단 순서는 쿨기, 마무리 일격, 생성기입니다.",
      "아드레날린 촉진은 오래 들고 있지 말고, 1~2연계 점수에서 사용합니다.",
      "광역에서는 폭풍의 칼날 유지가 먼저이며, 2타겟 이상이면 비활성 상태를 만들지 않습니다.",
      "미간 적중은 높은 연계 점수에서 쓰는 핵심 마무리 일격으로 봅니다.",
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
      "아래 실전 운용은 도적 Discord 자료를 우선 반영한 요약입니다. 외부 가이드와 표현이 다른 항목은 예외로 표시했습니다.",
    ],
    simpleCycleGuide: {
      titleKo: "초간단 실전 사이클",
      subtitleKo: "처음엔 이것만 따라가도 됩니다",
      steps: [
        {
          titleKo: "버프 준비",
          bodyKo: "아드레날린 촉진을 켜고, 뼈주사위를 굴리고, 난도질을 준비합니다. 적이 2마리 이상이면 폭풍의 칼날도 켜요. 뼈주사위가 3단계 이상이면 도박의 연속(KIR)로 좋은 버프를 붙잡습니다.",
          skills: ["아드레날린 촉진", "뼈주사위", "난도질", "폭풍의 칼날", "도박의 연속(KIR)"],
          cautionKo: "폭풍의 칼날은 적이 2마리 이상일 때 먼저 확인합니다.",
        },
        {
          titleKo: "쿨기 톡톡",
          bodyKo: "Blade Rush는 쿨마다 바로 확인합니다. 광기의 학살자는 연계 점수가 충분할 때 강한 적에게 눌러요.",
          skills: ["Blade Rush", "광기의 학살자"],
          cautionKo: "광기의 학살자는 5CP 이상에서 확인합니다.",
        },
        {
          titleKo: "버블 모으기",
          bodyKo: "기본은 사악한 일격입니다. 기회가 잘 쌓였고 조건이 맞으면 권총 사격으로 톡 쏩니다.",
          skills: ["사악한 일격", "권총 사격"],
          cautionKo: "권총 사격은 반짝인다고 무조건 누르지 않습니다.",
        },
        {
          titleKo: "마무리 쾅",
          bodyKo: "6CP 이상이면 먼저 미간 적중을 봅니다. 미간 적중이 쿨이면 속결로 마무리합니다.",
          skills: ["미간 적중", "속결"],
          cautionKo: "미간 적중은 가능하면 높은 CP에서 씁니다.",
        },
        {
          titleKo: "다시 반복",
          bodyKo: "마무리했으면 다시 버블을 모읍니다. 아드레날린 촉진, 미간 적중, Blade Rush가 모두 쿨이면 준비로 흐름을 다시 열어요.",
          skills: ["준비", "아드레날린 촉진", "미간 적중", "Blade Rush"],
          cautionKo: "아드레날린 촉진 쿨이 곧 오면 준비를 성급히 쓰지 않습니다.",
        },
      ],
    },
    coreSummary: {
      headlineKo: "쿨기 > 마무리 일격 > 생성기",
      cards: [
        {
          titleKo: "판단은 위에서 아래로",
          bodyKo: "무법은 정해진 순서표를 외워 누르는 직업이 아니라, 매 글쿨마다 쿨기, 마무리 일격, 생성기 순서로 가능한 최고 행동을 고르는 전문화입니다.",
          tone: "ok",
        },
        {
          titleKo: "아드레날린 촉진은 오래 들지 않기",
          bodyKo: "전투가 계속된다면 1~2연계 점수에서 바로 켭니다. 너무 오래 들면 무법의 핵심인 쿨다운 감소 흐름이 무너집니다.",
          tone: "warn",
        },
        {
          titleKo: "미간 적중(BtE)은 높은 CP에서",
          bodyKo: "미간 적중은 가장 중요한 마무리 일격입니다. 5연계 점수에 급하게 쓰기보다 높은 연계 점수에서 쓰는 습관을 먼저 만듭니다.",
          tone: "ok",
        },
        {
          titleKo: "광역은 폭풍의 칼날 유지",
          bodyKo: "2타겟 이상이면 폭풍의 칼날이 꺼지지 않게 먼저 봅니다. 무법 광역은 이 버프가 꺼지는 순간 구조가 무너집니다.",
          tone: "danger",
        },
      ],
      neverDo: [
        "아드레날린 촉진을 이유 없이 오래 들고 있지 않기",
        "미간 적중을 5연계 점수에 습관적으로 쓰지 않기",
        "2타겟 이상에서 폭풍의 칼날이 꺼진 채 딜하지 않기",
        "발차기, 교란, 그림자 망토를 마우스로 클릭하지 않기",
        "Supercharger나 KIR 예외 때문에 기본 우선순위를 망치지 않기",
      ],
    },
    deepGuide: [
      {
        titleKo: "아드레날린 촉진(AR)",
        whatKo: "기력 회복과 글쿨 흐름을 빠르게 만들어 무법 전체 회전수를 올리는 핵심 유지 쿨기입니다.",
        whenKo: "활성화되어 있지 않고 현재 1~2연계 점수라면 사용합니다. 곧 전투가 끊기거나 몹이 바로 죽는 상황만 예외입니다.",
        whyKo: "무법은 쿨다운 감소로 다시 쿨기를 돌리는 구조라, AR을 들고 있는 시간이 곧 다음 쿨기 손실로 이어집니다.",
        mistakeKo: "초보자가 가장 자주 하는 실수는 큰 폭딜기처럼 아껴두는 것입니다. 무법의 AR은 아껴서 터뜨리는 버튼이 아니라 회전 유지 버튼입니다.",
        exampleKo: "풀 시작 직전 AR + 뼈주사위 + 난도질을 준비하면 첫 미간 적중까지 빠르게 진입합니다.",
      },
      {
        titleKo: "폭풍의 칼날(Blade Flurry)",
        whatKo: "무법 광역의 스위치입니다. 켜져 있어야 단일 우선순위가 광역 피해로 전환됩니다.",
        whenKo: "2타겟 이상이고 비활성 상태라면 즉시 사용합니다. 3타겟 이상에 Deft Maneuvers가 있으면 생성기처럼 쓰는 예외도 봅니다.",
        whyKo: "폭풍의 칼날이 꺼진 상태에서는 아무리 로테이션을 잘 눌러도 광역 구조가 성립하지 않습니다.",
        mistakeKo: "광역 풀에서 미간 적중이나 Blade Rush부터 누르고 폭풍의 칼날을 늦게 켜는 실수가 큽니다.",
        exampleKo: "쐐기 풀 시작: 폭풍의 칼날 → Blade Rush → 연계 점수 빌드 → 미간 적중.",
      },
      {
        titleKo: "뼈주사위(RTB)",
        whatKo: "전투 리듬을 바꾸는 유지 버프입니다. 단계가 낮으면 다시 굴려 최소 2단계 이상을 노립니다.",
        whenKo: "비활성 상태이거나 1단계라면 다시 굴립니다. AR 사용 후 납 주사위가 있으면 다음 RTB 품질이 좋아집니다.",
        whyKo: "좋은 RTB 상태는 연계 점수 생성, 쿨다운 회전, 치명타 흐름을 모두 안정화합니다.",
        mistakeKo: "1단계를 오래 유지하거나, 3단계 이상을 얻고도 도박의 연속(KIR)을 잊는 것입니다.",
        exampleKo: "3단계 이상이 뜨면 KIR을 눌러 좋은 상태를 붙잡습니다.",
      },
      {
        titleKo: "도박의 연속(KIR)",
        whatKo: "현재 뼈주사위 상태를 연장하는 긴 쿨기입니다.",
        whenKo: "기본은 RTB 3단계 이상입니다. 단, 납 주사위가 없고 1단계 추락 위험이 크면 2단계에서도 검토합니다.",
        whyKo: "좋은 RTB 상태를 오래 유지하면 이후 쿨다운과 연계 점수 흐름이 안정됩니다.",
        mistakeKo: "2단계 예외를 기본 규칙처럼 쓰는 것입니다. 초보자는 3단계 이상부터 먼저 익히는 편이 안전합니다.",
        exampleKo: "단일 보스, 전투 공백이 잦은 쐐기에서는 2단계 KIR 예외가 더 자주 의미를 가질 수 있습니다.",
      },
      {
        titleKo: "미간 적중(BtE)",
        whatKo: "무법의 핵심 마무리 일격입니다. 가능하면 높은 연계 점수에서 우선 사용합니다.",
        whenKo: "6연계 점수 이상에서 우선 사용합니다. 운명결속 속결 같은 일부 예외를 제외하면 5CP 미간 적중은 피합니다.",
        whyKo: "높은 CP에서 소모할수록 Zero In과 리셋 흐름을 더 안정적으로 가져갑니다.",
        mistakeKo: "5CP가 됐다고 바로 BtE를 누르거나, Supercharger 최적화 때문에 너무 오래 보류해 전체 우선순위가 무너지는 것입니다.",
        exampleKo: "AR 쿨이 약 30초 이하인 숙련자 상황에서는 BtE를 잠깐 보류해 Supercharger 안에 넣는 선택지가 있습니다.",
      },
      {
        titleKo: "권총 사격과 사악한 일격",
        whatKo: "권총 사격은 조건부 생성기, 사악한 일격은 fallback 생성기입니다.",
        whenKo: "기회 6중첩이면 권총 사격, 기회 3중첩 + 현재 1~3CP면 권총 사격, 그 외에는 사악한 일격을 누릅니다.",
        whyKo: "권총 사격을 아무 때나 누르면 CP가 애매하게 차서 좋은 마무리 일격 타이밍을 망칩니다.",
        mistakeKo: "기회가 보였다고 바로 누르는 것입니다. 현재 CP를 같이 봐야 합니다.",
        exampleKo: "운명결속 + RTB 2단계 이상 + 기회 3중첩 + 현재 1CP에서는 권총 사격 대신 사악한 일격을 고려합니다.",
      },
      {
        titleKo: "준비(Prep)",
        whatKo: "아드레날린 촉진, 미간 적중, 광역 상황의 Blade Rush 흐름을 다시 여는 버튼입니다.",
        whenKo: "핵심 쿨기가 빠진 뒤, 다음 미간 적중과 AR 회전을 살릴 수 있을 때 사용합니다. AR 쿨이 곧 오면 너무 빨리 쓰지 않습니다.",
        whyKo: "준비는 KS만 초기화하려고 아끼는 버튼이 아닙니다. BtE와 AR을 다시 여는 가치가 더 중요할 때가 많습니다.",
        mistakeKo: "광기의 학살자를 아직 안 썼다는 이유로 오프닝 준비를 늦추는 것입니다.",
        exampleKo: "오프닝에서 BtE가 쿨일 때 준비 → Blade Rush → BtE까지 다시 빌드합니다.",
      },
      {
        titleKo: "Supercharger",
        whatKo: "아드레날린 촉진과 미간 적중 타이밍을 맞출 때 생기는 숙련자용 최적화 축입니다.",
        whenKo: "AR 쿨이 약 30초 이하라면 미간 적중을 바로 쓰지 않고 AR 이후로 잠깐 보류할 수 있습니다.",
        whyKo: "BtE와 BtE 리셋 가능성을 Supercharger 안에 넣기 위한 목적입니다.",
        mistakeKo: "초보자가 이 규칙을 먼저 따라 하다가 BtE를 지나치게 오래 들고 있는 것입니다.",
        exampleKo: "기본 우선순위가 안정된 뒤에만 적용합니다. 흔들리면 그냥 높은 CP BtE를 쓰는 편이 낫습니다.",
      },
    ],
    practiceGuide: {
      summaryKo: "전투 중에는 복잡하게 외우지 말고, 현재 상황을 이 순서로만 확인합니다. 광역 여부, 쿨기, 마무리 일격, 생성기 순서입니다.",
      phases: [
        {
          titleKo: "풀 1~2초 전",
          cueKo: "준비",
          steps: [
            "독이 발라져 있는지 확인합니다.",
            "가능하면 아드레날린 촉진 + 뼈주사위 + 난도질을 준비합니다.",
            "쐐기 시작 전에는 AR로 납 주사위 상태를 만들 수 있는지 확인합니다.",
          ],
        },
        {
          titleKo: "풀 시작",
          cueKo: "진입",
          steps: [
            "광역이면 폭풍의 칼날부터 켭니다.",
            "Blade Rush를 사용하고 미간 적중까지 연계 점수를 쌓습니다.",
            "6CP 이상이면 미간 적중을 사용합니다.",
          ],
        },
        {
          titleKo: "일반 반복",
          cueKo: "우선순위",
          steps: [
            "쿨기: AR, 폭풍의 칼날, RTB, KIR, Prep, Blade Rush를 먼저 확인합니다.",
            "마무리 일격: 미간 적중, 광기의 학살자, 속결 순서로 확인합니다.",
            "생성기: 권총 사격 조건이 아니면 사악한 일격을 누릅니다.",
          ],
        },
        {
          titleKo: "BtE 쿨 / 리셋",
          cueKo: "리셋 대응",
          steps: [
            "BtE가 리셋되면 다시 높은 CP까지 빌드합니다.",
            "BtE가 쿨이고 준비가 가능하면 준비로 다음 BtE 흐름을 엽니다.",
            "AR 쿨이 30초 이하인 숙련자 상황만 BtE 보류를 검토합니다.",
          ],
        },
        {
          titleKo: "KIR 가능",
          cueKo: "뼈주사위",
          steps: [
            "RTB 3단계 이상이면 KIR을 사용합니다.",
            "2단계 예외는 납 주사위 없음, 1단계 추락 위험, 전투 공백이 있는 상황에서만 검토합니다.",
            "처음 익힐 때는 3단계 이상 규칙만 지켜도 충분합니다.",
          ],
        },
        {
          titleKo: "실수 복구",
          cueKo: "망했을 때",
          steps: [
            "폭풍의 칼날이 꺼졌다면 광역에서는 즉시 다시 켭니다.",
            "AR을 오래 들었다면 다음 1~2CP에서 바로 사용합니다.",
            "CP가 애매하면 무리한 BtE보다 다음 생성기로 6CP 이상을 만듭니다.",
          ],
        },
      ],
    },
    keybindGuide: {
      summaryKo: "스킬창/키bind는 딜 사이클보다 먼저 정리해야 합니다. 무법은 글쿨이 빠르고 반응 버튼이 많아서, 발차기와 생존기를 클릭하는 순간 던전 실수가 늘어납니다.",
      rules: [
        "1~5는 가장 자주 누르는 생성기와 마무리 일격에 둡니다.",
        "Q/E/R/F/C/V는 이동 중에도 누르기 쉬운 핵심 전투 버튼에 둡니다.",
        "Shift 조합은 긴 쿨기, 상황부 쿨기, 유틸에 둡니다.",
        "마우스 사이드 버튼이 있으면 발차기, 그림자 망토, 교란을 우선 배치합니다.",
        "차단과 생존기는 클릭 금지 영역입니다.",
      ],
      groups: [
        {
          titleKo: "주력 공격",
          bindings: [
            { key: "1", skillKo: "사악한 일격", reasonKo: "가장 기본 생성기", priority: "core" },
            { key: "2", skillKo: "권총 사격", reasonKo: "기회 중첩을 보고 빠르게 반응", priority: "core" },
            { key: "3", skillKo: "속결", reasonKo: "기본 마무리 일격", priority: "core" },
            { key: "4", skillKo: "미간 적중", reasonKo: "핵심 마무리 일격이라 손가락 접근성이 높아야 함", priority: "core" },
            { key: "5", skillKo: "난도질", reasonKo: "오프닝/유지 확인용", priority: "utility" },
          ],
        },
        {
          titleKo: "전투 유지",
          bindings: [
            { key: "Q", skillKo: "폭풍의 칼날", reasonKo: "광역 시작마다 즉시 켜야 함", priority: "core" },
            { key: "E", skillKo: "Blade Rush", reasonKo: "쿨마다 누르는 공격 쿨기", priority: "core" },
            { key: "R", skillKo: "아드레날린 촉진", reasonKo: "오래 들면 안 되는 핵심 쿨기", priority: "core" },
            { key: "F", skillKo: "뼈주사위", reasonKo: "버프 상태를 보며 자주 확인", priority: "core" },
            { key: "Shift+F", skillKo: "도박의 연속", reasonKo: "RTB 상태가 좋을 때 누르는 긴 쿨기", priority: "advanced" },
          ],
        },
        {
          titleKo: "생존/반응",
          bindings: [
            { key: "C", skillKo: "발차기", reasonKo: "차단은 마우스 클릭 금지", priority: "reactive" },
            { key: "V", skillKo: "교란", reasonKo: "광역 피해 직전 즉시 반응", priority: "reactive" },
            { key: "Shift+C", skillKo: "그림자 망토", reasonKo: "마법 피해/디버프 대응", priority: "reactive" },
            { key: "Shift+V", skillKo: "소멸", reasonKo: "위험 복구와 일부 딜 최적화", priority: "reactive" },
          ],
        },
        {
          titleKo: "고급/상황부",
          bindings: [
            { key: "Shift+R", skillKo: "준비", reasonKo: "BtE/AR 재개용", priority: "advanced" },
            { key: "Shift+E", skillKo: "광기의 학살자", reasonKo: "상황부 마무리 일격", priority: "advanced" },
            { key: "Ctrl+Q", skillKo: "물약", reasonKo: "전투 계획용", priority: "utility" },
            { key: "Ctrl+E", skillKo: "생석", reasonKo: "체력 급락 복구", priority: "reactive" },
            { key: "Ctrl+R", skillKo: "장신구", reasonKo: "사용 장신구 대응", priority: "utility" },
          ],
        },
      ],
      mouseNoteKo: "마우스 사이드 버튼이 있다면 발차기, 그림자 망토, 교란 순서로 옮기는 것을 권장합니다. 손 이동 없이 즉시 눌러야 하는 버튼부터 옮깁니다.",
      clickWarningKo: "발차기, 교란, 그림자 망토, 소멸은 클릭 금지입니다. 반응 버튼은 키bind로 눌러야 합니다.",
    },
    masteryGuide: [
      {
        titleKo: "숙련자를 위한 완벽함으로 가는 법",
        goalKo: "기본 우선순위를 흔들지 않으면서 예외 규칙만 추가합니다.",
        checks: [
          "로그에서 AR을 이유 없이 들고 있던 시간이 있는지 확인합니다.",
          "BtE가 5CP에서 습관적으로 나간 기록이 있는지 확인합니다.",
          "광역 풀에서 폭풍의 칼날이 늦게 켜진 구간을 찾습니다.",
        ],
        warningKo: "이 단계는 기본 반복이 안정된 뒤에만 봅니다.",
      },
      {
        titleKo: "KIR 2단계 예외",
        goalKo: "1단계 추락을 막을 필요가 있을 때만 2단계 KIR을 검토합니다.",
        checks: [
          "납 주사위가 없는지 확인합니다.",
          "곧 RTB를 다시 굴려야 할 위험이 있는지 확인합니다.",
          "단일 또는 전투 공백이 있는 쐐기 상황인지 확인합니다.",
        ],
        warningKo: "처음에는 RTB 3단계 이상 KIR만 지켜도 충분합니다.",
      },
      {
        titleKo: "Prep은 KS보다 BtE/AR 리셋 우선",
        goalKo: "준비를 광기의 학살자 전용 초기화 버튼으로 오해하지 않습니다.",
        checks: [
          "오프닝에서 BtE 재진입을 위해 준비를 썼는지 확인합니다.",
          "AR 쿨이 곧 돌아오는데 준비를 너무 빨리 쓰지 않았는지 확인합니다.",
          "Blade Rush와 BtE 흐름이 이어졌는지 확인합니다.",
        ],
      },
      {
        titleKo: "Supercharger-BtE 보류",
        goalKo: "AR 안에 BtE와 리셋 가능성을 넣는 숙련자용 판단입니다.",
        checks: [
          "AR 쿨이 약 30초 이하인지 확인합니다.",
          "BtE를 보류해도 전체 우선순위가 무너지지 않는지 확인합니다.",
          "첫 AR 지속 중에는 BtE를 계속 사용했는지 확인합니다.",
        ],
        warningKo: "BtE를 오래 들고 있으면 오히려 손해입니다. 자신 없으면 보류하지 않습니다.",
      },
    ],
    visualGuides: {
      priorityLadder: [
        { labelKo: "1. 쿨기", detailKo: "AR, 폭풍의 칼날, RTB, KIR, Prep, Blade Rush" },
        { labelKo: "2. 마무리 일격", detailKo: "난도질, 미간 적중(BtE), 광기의 학살자, 속결" },
        { labelKo: "3. 생성기", detailKo: "권총 사격 조건 확인 후 사악한 일격" },
      ],
      openerTimeline: [
        { labelKo: "풀 -2초", detailKo: "AR + RTB + 난도질" },
        { labelKo: "0초", detailKo: "광역이면 폭풍의 칼날" },
        { labelKo: "초반", detailKo: "Blade Rush → BtE까지 빌드" },
        { labelKo: "리셋", detailKo: "BtE 리셋 또는 Prep으로 재진입" },
        { labelKo: "반복", detailKo: "KS까지 빌드 후 일반 우선순위" },
      ],
      kirTree: [
        { conditionKo: "RTB 3단계 이상", actionKo: "도박의 연속(KIR) 사용", tone: "ok" },
        { conditionKo: "RTB 2단계 + 납 주사위 없음 + 1단계 추락 위험", actionKo: "숙련자 예외로 KIR 검토", tone: "warn" },
        { conditionKo: "RTB 1단계 또는 비활성", actionKo: "KIR이 아니라 RTB 재굴림", tone: "warn" },
      ],
      superchargerFlow: [
        { conditionKo: "AR 쿨 30초 초과", actionKo: "높은 CP BtE를 평소대로 사용" },
        { conditionKo: "AR 쿨 약 30초 이하", actionKo: "BtE 보류를 잠깐 검토" },
        { conditionKo: "AR 사용 가능", actionKo: "AR 후 BtE로 Supercharger 안에 넣기" },
        { conditionKo: "기본 우선순위 흔들림", actionKo: "보류 중단, BtE 사용" },
      ],
      keybindLayout: [
        { key: "1", labelKo: "사악한 일격", groupKo: "주력" },
        { key: "2", labelKo: "권총 사격", groupKo: "주력" },
        { key: "3", labelKo: "속결", groupKo: "주력" },
        { key: "4", labelKo: "미간 적중", groupKo: "주력" },
        { key: "5", labelKo: "난도질", groupKo: "주력" },
        { key: "Q", labelKo: "폭풍의 칼날", groupKo: "전투" },
        { key: "E", labelKo: "Blade Rush", groupKo: "전투" },
        { key: "R", labelKo: "아드레날린 촉진", groupKo: "전투" },
        { key: "F", labelKo: "뼈주사위", groupKo: "전투" },
        { key: "C", labelKo: "발차기", groupKo: "반응" },
        { key: "V", labelKo: "교란", groupKo: "반응" },
        { key: "Shift+C", labelKo: "그림자 망토", groupKo: "반응" },
      ],
    },
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
