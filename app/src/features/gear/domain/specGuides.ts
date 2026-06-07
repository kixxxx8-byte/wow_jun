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
  priorityGuide?: {
    summaryKo: string;
    groups: Array<{ titleKo: string; ruleKo: string; steps: string[] }>;
  };
  openerGuide?: {
    summaryKo: string;
    sequences: Array<{ titleKo: string; steps: string[] }>;
    cautions: string[];
  };
  advancedGuide?: Array<{ titleKo: string; detailKo: string; bullets: string[]; noteKo?: string }>;
  quickCheatSheet?: string[];
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
    priorityGuide: {
      summaryKo: "무법은 매 글로벌마다 위에서 아래로 내려가며 가능한 가장 높은 우선순위 행동을 고르는 방식으로 운용합니다.",
      groups: [
        {
          titleKo: "1. 쿨기",
          ruleKo: "마무리 일격과 생성기보다 먼저 확인합니다.",
          steps: [
            "아드레날린 촉진: 활성화되어 있지 않고 현재 1~2연계 점수라면 사용합니다.",
            "폭풍의 칼날: 2타겟 이상이고 비활성 상태라면 사용합니다.",
            "뼈주사위: 비활성 상태이거나 1단계라면 다시 굴려 최소 2단계 이상을 노립니다.",
            "준비: 특성 사용 시 아드레날린 촉진, 미간 적중, 광역 상황의 Blade Rush 리셋을 위해 사용합니다. 단, 아드레날린 촉진 쿨이 곧 오면 너무 빨리 쓰지 않습니다.",
            "도박의 연속: 기본은 뼈주사위 3단계 이상일 때 사용합니다.",
            "Blade Rush: 쿨마다 사용합니다.",
            "엉겅퀴 차: 직접 신경 쓰기보다 필요 시 자동 소모되는 자원 보조로 봅니다.",
          ],
        },
        {
          titleKo: "2. 마무리 일격",
          ruleKo: "기본은 6연계 점수 이상입니다. 운명결속 속결은 5연계 점수 이상 예외가 있습니다.",
          steps: [
            "난도질: 오프닝에서 한 번, 활성화되어 있지 않을 때만 직접 사용합니다.",
            "미간 적중: 가능하면 최우선 마무리 일격으로 사용합니다.",
            "광기의 학살자: 특성을 찍었고 사용 가능하면 사용합니다.",
            "속결: 위 마무리 일격을 쓸 수 없을 때 사용합니다.",
            "Coup de Grace: 직접 누르는 기술이 아니라 필요한 상황에 자동 시전되는 항목으로 봅니다.",
          ],
        },
        {
          titleKo: "3. 생성기",
          ruleKo: "쿨기와 마무리 일격 조건이 없을 때만 확인합니다.",
          steps: [
            "폭풍의 칼날: 3타겟 이상이고 Deft Maneuvers 특성이 있으면 생성기처럼 사용합니다.",
            "권총 사격: 기회가 6중첩이면 사용합니다.",
            "권총 사격: 기회가 3중첩이고 현재 1~3연계 점수일 때만 사용합니다.",
            "사악한 일격: 위 조건이 전부 없으면 기본 생성기로 사용합니다.",
          ],
        },
      ],
    },
    openerGuide: {
      summaryKo: "오프닝은 쿨기를 쌓아두는 폭딜 구조가 아니라, 빠르게 일반 우선순위로 진입하기 위한 준비 과정입니다.",
      sequences: [
        {
          titleKo: "일반 오프닝",
          steps: [
            "풀 1~2초 전: 아드레날린 촉진 + 뼈주사위 + 난도질을 준비합니다.",
            "풀 시작 후 광역이면 폭풍의 칼날을 켭니다.",
            "Blade Rush 사용 후 미간 적중까지 연계 점수를 쌓습니다.",
            "미간 적중을 사용하고, 리셋되면 다시 미간 적중까지 빌드합니다.",
            "미간 적중이 쿨일 때 준비를 사용해 다시 Blade Rush와 미간 적중 흐름으로 이어갑니다.",
            "광기의 학살자까지 빌드한 뒤 일반 우선순위로 반복합니다.",
          ],
        },
        {
          titleKo: "쐐기 시작 전",
          steps: [
            "쐐기돌을 꽂기 전 아드레날린 촉진을 미리 사용할 수 있습니다.",
            "이 운용은 납 주사위를 들고 첫 무리에 들어가기 위한 목적입니다.",
            "첫 무리 전에는 뼈주사위를 먼저 굴리고, 이후 아드레날린 촉진을 사용해 다음 뼈주사위 품질을 보강합니다.",
          ],
        },
      ],
      cautions: [
        "뼈주사위가 3단계 이상이면 도박의 연속을 잊지 않습니다.",
        "난도질은 Supercharger를 소모하지 않기 때문에 오프닝에서 수동으로 쓰는 가치가 있습니다.",
        "은신 중이라고 매번 Ambush로 여는 구조가 아닙니다. PvE에서 은신은 주로 이동 편의로 봅니다.",
      ],
    },
    advancedGuide: [
      {
        titleKo: "도박의 연속(KIR)",
        detailKo: "기본은 뼈주사위 3단계 이상이지만, Discord 자료 기준으로 2단계 예외가 있습니다.",
        bullets: [
          "납 주사위가 없고 곧 낮은 단계로 떨어질 가능성이 크면 2단계에서도 KIR을 눌러 1단계 추락을 막을 수 있습니다.",
          "납 주사위가 활성화되어 있고 KIR이 준비되어 있다면 2단계 뼈주사위도 다시 굴릴 가치가 있습니다.",
          "지속 광역에서는 Deft Maneuvers로 연계 점수 생성이 많아 2단계 이상 유지가 쉬운 편입니다.",
        ],
        noteKo: "외부 가이드는 2단계 또는 3단계 기준 표현이 갈립니다. 앱에서는 Discord 기준을 우선하고 예외 운용으로 표시합니다.",
      },
      {
        titleKo: "준비와 광기의 학살자",
        detailKo: "준비는 광기의 학살자도 초기화하지만, KS 리셋만을 위해 아낄 필요는 낮습니다.",
        bullets: [
          "오프닝에서는 KS를 아직 쓰지 않았더라도 미간 적중을 바로 다시 쓰는 쪽을 우선합니다.",
          "광기의 학살자 중 기력이 넘칠 것 같으면 다음 우선순위 행동으로 취소할 수 있지만, 보통은 끝까지 유지합니다.",
          "광기의 학살자는 6연계 점수 이상이 아니어도 5연계 점수에서 사용할 수 있는 미세 최적화가 있습니다.",
        ],
        noteKo: "예상 이득 수치는 확정 DPS가 아니라 미세 최적화 참고로만 봅니다.",
      },
      {
        titleKo: "운명결속(Fatebound) 특수 규칙",
        detailKo: "현재 메타가 아니거나 빌드가 다르면 사용하지 않는 조건부 최적화입니다.",
        bullets: [
          "운명결속, 뼈주사위 2단계 이상, 기회 3중첩, 현재 1연계 점수라면 권총 사격 대신 사악한 일격을 고려합니다.",
          "이유는 사악한 일격 발동 시 6연계 점수까지 도달할 수 있고, 실패해도 이후 권총 사격으로 정확히 높은 연계 점수를 만들 수 있기 때문입니다.",
          "1연계 점수에서 권총 사격을 먼저 쓰면 5연계 점수에 걸려 미간 적중 운용이 애매해질 수 있습니다.",
        ],
        noteKo: "운명결속 빌드 전용 예외로 표시합니다.",
      },
      {
        titleKo: "Supercharger와 미간 적중 보류",
        detailKo: "아드레날린 촉진 쿨이 약 30초 이하라면 미간 적중을 잠깐 보류하는 최적화가 있습니다.",
        bullets: [
          "아드레날린 촉진을 켠 뒤 미간 적중을 사용해 Supercharger 안에 넣는 것이 목적입니다.",
          "오프닝에서 준비로 아드레날린 촉진을 초기화했는데 기존 아드레날린 촉진이 아직 켜져 있다면, 기존 지속 중에는 미간 적중을 계속 사용합니다.",
          "준비로 얻은 다음 아드레날린 촉진은 첫 아드레날린 촉진 종료 직후 쓰거나, 미간 적중 쿨을 잠깐 기다렸다가 사용할 수 있습니다.",
        ],
        noteKo: "이 항목은 숙련자용입니다. 기본 우선순위가 흔들리면 적용하지 않습니다.",
      },
    ],
    quickCheatSheet: [
      "기본 우선순위: 쿨기 > 마무리 일격 > 생성기",
      "오프닝: 풀 1~2초 전 AR + RTB + SnD",
      "광역 시작: 폭풍의 칼날 → Blade Rush → 미간 적중까지 빌드",
      "KIR: 기본 3단계 이상, 단 2단계 예외는 상황부 미세 최적화",
      "준비: KS보다 미간 적중/아드레날린 촉진 리셋 가치가 먼저",
      "미간 적중: 5연계 점수에 급하게 쓰지 말고 높은 연계 점수에서 사용",
      "아드레날린 촉진: 너무 오래 들고 있지 말 것",
      "Supercharger: 아드레날린 촉진 쿨 30초 이하라면 미간 적중 보류를 고려",
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
