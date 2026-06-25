export type RaidAuditConfidence = "cross_checked" | "reviewing" | "needs_feedback";

export type RaidBossGuide = {
  id: string;
  nameKo: string;
  nameEn?: string;
  order: number;
  roleFocusKo: string;
  watchKo: string;
  moveKo: string;
  defensiveKo: string;
  rogueNoteKo: string;
  confidence: RaidAuditConfidence;
};

export type RaidGuide = {
  id: string;
  nameKo: string;
  nameEn: string;
  shortKo: string;
  summaryKo: string;
  statusKo: string;
  confidence: RaidAuditConfidence;
  lastChecked: string;
  sources: { labelKo: string; href: string }[];
  bosses: RaidBossGuide[];
};

export const raidConfidenceLabelKo: Record<RaidAuditConfidence, string> = {
  cross_checked: "교차 검수",
  reviewing: "검수 중",
  needs_feedback: "사용자 확인 필요",
};

export const raidGuides: RaidGuide[] = [
  {
    id: "sporefall",
    nameKo: "스포어폴",
    nameEn: "Sporefall",
    shortKo: "스포어폴",
    summaryKo: "한밤 시즌1 레이드 중 하나입니다. 세부 패턴은 검수 중이므로 확정 공략처럼 표시하지 않습니다.",
    statusKo: "기본 구조 준비 · 세부 공략 검수 중",
    confidence: "reviewing",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "sporefall-overview",
        nameKo: "보스 공략 준비 중",
        order: 1,
        roleFocusKo: "근딜 생존 기준",
        watchKo: "공식/Wowhead 기준 패턴 검수 후 업데이트합니다.",
        moveKo: "확정되지 않은 이동 지시는 표시하지 않습니다.",
        defensiveKo: "큰 광역 피해와 대상자 디버프 타이밍은 검수 전까지 일반 주의로만 표시합니다.",
        rogueNoteKo: "발차기/교란/그망 타이밍은 보스별 검수 후 분리합니다.",
        confidence: "needs_feedback",
      },
    ],
  },
  {
    id: "voidspire",
    nameKo: "공허첨탑",
    nameEn: "Voidspire",
    shortKo: "공허첨탑",
    summaryKo: "한밤 시즌1 레이드 중 하나입니다. Void 계열 패턴은 순서와 안전지대 검증이 중요합니다.",
    statusKo: "레이드 선택 화면 준비 · 보스별 세부 공략 검수 중",
    confidence: "reviewing",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "voidspire-overview",
        nameKo: "보스 공략 준비 중",
        order: 1,
        roleFocusKo: "근딜 생존 기준",
        watchKo: "보스별 핵심 시전과 바닥 패턴을 검수 후 등록합니다.",
        moveKo: "안전지대/외곽 이동은 출처 교차 확인 뒤 확정합니다.",
        defensiveKo: "겹치는 광역 피해에는 교란을 우선 고려합니다.",
        rogueNoteKo: "차단 가능 시전과 그망으로 지울 수 있는 디버프는 별도 검수합니다.",
        confidence: "needs_feedback",
      },
    ],
  },
  {
    id: "dreamrift",
    nameKo: "꿈의 균열",
    nameEn: "The Dreamrift",
    shortKo: "꿈의 균열",
    summaryKo: "Chimaerus 관련 레이드로 알려진 한밤 시즌1 레이드입니다. 보스별 세부 기믹은 검수 중입니다.",
    statusKo: "기본 레이드 카드 준비 · 상세 패턴 검수 중",
    confidence: "reviewing",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "chimaerus",
        nameKo: "키마이루스",
        nameEn: "Chimaerus",
        order: 1,
        roleFocusKo: "생존 우선",
        watchKo: "큰 피해 패턴과 대상자 디버프를 우선 확인합니다.",
        moveKo: "근딜은 보스 뒤 유지, 전방/광역 패턴 때 즉시 이탈합니다.",
        defensiveKo: "체력이 흔들리는 구간에는 교란을 먼저 누르고, 마법 디버프는 그망 가능 여부를 따로 확인합니다.",
        rogueNoteKo: "기믹 세부 순서는 아직 검수 중입니다. 확정 콜처럼 사용하지 않습니다.",
        confidence: "reviewing",
      },
    ],
  },
  {
    id: "march-on-queldanas",
    nameKo: "쿠엘다나스 진군",
    nameEn: "March on Quel'Danas",
    shortKo: "쿠엘다나스",
    summaryKo: "한밤 시즌1 레이드 중 하나입니다. 스토리/공격대 찾기까지 포함된 레이드로 확인됩니다.",
    statusKo: "레이드 기본 정보 준비 · 세부 보스 공략 검수 중",
    confidence: "reviewing",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Blizzard 레이드 공지", href: "https://worldofwarcraft.blizzard.com/en-us/news/24264416" },
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "queldanas-overview",
        nameKo: "보스 공략 준비 중",
        order: 1,
        roleFocusKo: "근딜 생존 기준",
        watchKo: "보스별 핵심 패턴을 공식/Wowhead 기준으로 분리 등록합니다.",
        moveKo: "확정되지 않은 산개/집결 위치는 아직 표시하지 않습니다.",
        defensiveKo: "광역 피해 전 교란, 위험 디버프 전 그망 가능 여부를 검수합니다.",
        rogueNoteKo: "도적 기준 차단/스턴/소멸 활용 지점은 별도 업데이트 예정입니다.",
        confidence: "needs_feedback",
      },
    ],
  },
];
