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
    nameKo: "진균나락",
    nameEn: "Sporefall",
    shortKo: "진균나락",
    summaryKo: "하란다르의 단일 우두머리 공격대입니다. 부식수렁은 쫄 정리, 독 시전 차단, 버섯 처리, 광역 피해 생존이 반복되는 전투입니다.",
    statusKo: "부식수렁 실전 공략 작성 완료 · 튜닝 변화는 계속 확인 필요",
    confidence: "cross_checked",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Wowhead 진균나락 개요", href: "https://www.wowhead.com/ko/guide/midnight/raids/sporefall-overview-location-rewards-boss" },
      { labelKo: "Wowhead 부식수렁 공략", href: "https://www.wowhead.com/guide/midnight/raids/sporefall-rotmire-boss-strategy-abilities-cheat-sheet-rewards" },
      { labelKo: "Method 부식수렁 공략", href: "https://www.method.gg/guides/sporefall/rotmire" },
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "rotmire-loop",
        nameKo: "부식수렁: 전투 루프",
        nameEn: "Rotmire",
        order: 1,
        roleFocusKo: "전투는 한 페이즈가 반복됩니다. 쫄을 늦게 잡거나 버섯 처리가 밀리면 다음 광역 피해 때 복구가 어려워집니다.",
        watchKo: "부식수렁의 기력, 새로 깨어나는 곰팡이 쫄, 바닥에 남는 시체 더미, 광역 피해 타이밍을 같이 봅니다.",
        moveKo: "근딜은 보스 뒤를 유지하되, 대상자 바닥은 지정된 옆 공간에 버립니다. 쫄 처리 위치와 시체 더미 위로 전장을 더럽히지 않는 것이 핵심입니다.",
        defensiveKo: "큰 광역 피해가 오기 전 체력이 흔들리면 교란을 먼저 켭니다. 광역과 개인 대상 피해가 겹치면 생석/물약을 아끼지 않습니다.",
        rogueNoteKo: "딜 욕심보다 루프 유지가 우선입니다. 폭풍의 칼날은 쫄이 붙는 순간 켜고, 쫄이 남은 상태에서 광역 피해가 오면 생존기를 먼저 누릅니다.",
        confidence: "cross_checked",
      },
      {
        id: "rotmire-add-control",
        nameKo: "쫄 정리와 시체 더미",
        nameEn: "Awaken Fungi",
        order: 2,
        roleFocusKo: "부식수렁은 쫄 제어형 전투입니다. 쫄을 늦게 잡으면 다음 폭발/광역 구간에서 전장이 무너집니다.",
        watchKo: "쫄이 깨어나는 위치와 죽은 뒤 남는 처리 구역을 봅니다. 두 처리 구역이 더러워지면 공대 이동 경로가 줄어듭니다.",
        moveKo: "쫄은 공대가 정한 처치 위치로 모읍니다. 바닥 대상자는 쫄 처치 위치와 겹치지 않게 옆으로 빠집니다.",
        defensiveKo: "쫄이 살아 있는데 광역 피해가 겹치면 교란을 미리 켭니다. 피가 50% 아래면 생석을 먼저 사용합니다.",
        rogueNoteKo: "쫄 타이밍에는 폭풍의 칼날 유지가 우선입니다. 스턴이 필요한 쫄은 비열한 습격/급소 가격으로 보조하고, 딜 사이클보다 차단과 위치를 먼저 봅니다.",
        confidence: "cross_checked",
      },
      {
        id: "rotmire-poison-burst",
        nameKo: "독 시전 차단",
        nameEn: "Poison Burst",
        order: 3,
        roleFocusKo: "독 시전은 방치하면 힐 부담이 크게 올라갑니다. 차단 배정이 비면 근딜이 즉시 메워야 합니다.",
        watchKo: "쫄 이름표와 시전바를 켜고 독 계열 시전이 올라오는지 확인합니다.",
        moveKo: "차단 사거리 밖으로 밀려나지 않게 쫄 옆을 유지합니다. 바닥 회피 후 바로 다시 차단 사거리로 복귀합니다.",
        defensiveKo: "차단이 새거나 독 피해가 겹치면 교란을 켜고, 마법성 디버프 여부는 그망 사용 가능성을 확인합니다.",
        rogueNoteKo: "발차기는 클릭 금지입니다. 차단 콜이 비면 딜을 멈추고 발차기부터 누릅니다.",
        confidence: "cross_checked",
      },
      {
        id: "rotmire-bloom",
        nameKo: "버섯 폭발 구간",
        nameEn: "Fungal Bloom",
        order: 4,
        roleFocusKo: "기력이 차오른 뒤 오는 광역 구간입니다. 남은 쫄이나 버섯 처리가 밀리면 전멸 위험이 커집니다.",
        watchKo: "부식수렁 기력, 남은 쫄 체력, 버섯 생성 위치, 공대 생존기 콜을 동시에 봅니다.",
        moveKo: "버섯 처리 동선은 짧게 잡고, 폭발 직전에는 힐 범위 안으로 복귀합니다. 근딜은 마지막까지 욕심내다가 혼자 바깥에 남지 않습니다.",
        defensiveKo: "광역 피해 직전 교란을 기본값으로 생각합니다. 개인 대상 디버프나 쫄 피해가 겹치면 생석/물약까지 씁니다.",
        rogueNoteKo: "이 구간은 로그 욕심보다 생존입니다. 미간 적중/속결보다 살아남고 쫄을 끝내는 판단이 우선입니다.",
        confidence: "cross_checked",
      },
      {
        id: "rotmire-mythic-note",
        nameKo: "신화 탄력 인원 주의",
        nameEn: "Mythic Flex",
        order: 5,
        roleFocusKo: "진균나락은 신화 난이도에서 15~25인 탄력 구성이 가능한 공격대로 소개되었습니다.",
        watchKo: "인원수에 따라 쫄 처리, 차단 배정, 생존기 순서가 달라질 수 있습니다.",
        moveKo: "인원이 적으면 개인 책임이 커지고, 인원이 많으면 바닥 배치가 더 중요해집니다.",
        defensiveKo: "공대 생존기 배정이 얇은 조합에서는 개인 생존기를 더 일찍 씁니다.",
        rogueNoteKo: "도적은 차단, 스턴, 교란, 그망으로 빈 구멍을 메우는 역할입니다. 공대가 흔들릴수록 유틸 사용 로그가 더 중요합니다.",
        confidence: "reviewing",
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
    summaryKo: "키메루스 관련 레이드로 알려진 한밤 시즌1 레이드입니다. 보스별 세부 기믹은 검수 중입니다.",
    statusKo: "기본 레이드 카드 준비 · 상세 패턴 검수 중",
    confidence: "reviewing",
    lastChecked: "2026-06-25",
    sources: [
      { labelKo: "Wowhead 한밤 레이드 치트시트", href: "https://www.wowhead.com/guide/midnight/raids/all-boss-cheat-sheets" },
    ],
    bosses: [
      {
        id: "chimaerus",
        nameKo: "키메루스",
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
    nameKo: "쿠엘다나스 진격로",
    nameEn: "March on Quel'Danas",
    shortKo: "진격로",
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
