export type DungeonCinematicAnimation = "twister_breath" | "hook_interrupt" | "add_interrupt" | "arrow_hide";
export type DungeonCinematicSeverity = "high" | "lethal" | "control";

export type DungeonCinematicPhase = {
  id: string;
  phaseKo: string;
  bossKo: string;
  oneLineKo: string;
  watchKo: string;
  moveKo: string;
  interruptKo: string;
  defensiveKo: string;
  failRecoveryKo: string;
  animationType: DungeonCinematicAnimation;
  severity: DungeonCinematicSeverity;
};

export type DungeonCinematicGuide = {
  dungeonId: string;
  titleKo: string;
  subtitleKo: string;
  oneLineKo: string;
  survivalFocusKo: string[];
  phases: DungeonCinematicPhase[];
  trashAlerts: {
    titleKo: string;
    watchKo: string;
    interruptKo: string;
    defensiveKo: string;
  }[];
  defensivePlan: {
    triggerKo: string;
    actionKo: string;
  }[];
  failRecovery: {
    mistakeKo: string;
    recoveryKo: string;
  }[];
};

export const dungeonCinematicGuides: Record<string, DungeonCinematicGuide> = {
  windrunner: {
    dungeonId: "windrunner",
    titleKo: "윈드러너 첨탑 실전 작전",
    subtitleKo: "근딜/도적 기준 · 죽는 패턴부터 먼저 보는 완성형 공략",
    oneLineKo: "회오리 길을 먼저 보고, 갈고리는 어보미-벤시-대상자 순서로 맞추고, 화살은 늦지 않게 밟습니다.",
    survivalFocusKo: [
      "광풍 중에는 딜보다 회오리 길 찾기가 먼저입니다.",
      "칼리스 광역 시전은 내장 걸쇠-칼리스-대상자 라인으로 갈고리를 맞춰 끊습니다.",
      "막넴 화살 점프 실패는 즉사급이므로 미리 이동합니다.",
    ],
    phases: [
      {
        id: "windrunner-twister-breath",
        phaseKo: "회오리 + 전방 브레스",
        bossKo: "재뿔 여명",
        oneLineKo: "보스 뒤만 고집하지 말고, 회오리 빈 길을 먼저 봅니다.",
        watchKo: "회오리 시작 방향, 보스 전방, 외곽에 깔린 상승 기류",
        moveKo: "중앙을 가로지르지 말고 보스 옆면으로 짧게 이동",
        interruptKo: "차단보다 이동 우선. 위험 시전이 아니면 발차기 욕심 금지",
        defensiveKo: "광풍 시작에 교란. 연속 피해로 체력 50% 아래면 생석",
        failRecoveryKo: "회오리 길을 놓쳤으면 딜 중단 후 외곽 빈 공간으로 먼저 빠집니다.",
        animationType: "twister_breath",
        severity: "high",
      },
      {
        id: "windrunner-hook-interrupt",
        phaseKo: "갈고리로 광역 차단",
        bossKo: "칼리스 & 내장 걸쇠",
        oneLineKo: "갈고리 대상이면 칼리스 반대편으로 빠져 어보미-벤시-대상자 순서의 선을 만듭니다.",
        watchKo: "칼리스 캐스팅 바, 내장 걸쇠 위치, 내 갈고리 대상 여부",
        moveKo: "내장 걸쇠 - 칼리스 - 대상자 순서가 되게 칼리스 반대편으로 이동",
        interruptKo: "일반 발차기보다 갈고리 라인 유도가 핵심. 보조로 스턴/실명 준비",
        defensiveKo: "갈고리 실패가 보이면 바로 교란, 마법 피해가 겹치면 그망",
        failRecoveryKo: "광역 차단 실패 후에는 생석/물약을 먼저 쓰고 산개합니다.",
        animationType: "hook_interrupt",
        severity: "lethal",
      },
      {
        id: "windrunner-add-interrupt",
        phaseKo: "쫄 소환 + 위험 시전",
        bossKo: "사령관 크롤루크",
        oneLineKo: "쫄 캐스팅은 딜보다 먼저입니다. 이름표와 캐스팅 바를 봅니다.",
        watchKo: "전투 부대 소환, 칼날 폭풍 대상, 위협의 외침 타이밍",
        moveKo: "칼날 폭풍 대상이면 파티와 쫄에서 멀리 빠짐",
        interruptKo: "발차기 먼저, 없으면 스턴/실명. 공포 전 파티 위치 확인",
        defensiveKo: "쫄 시전이 새거나 공포 실패가 보이면 교란",
        failRecoveryKo: "차단이 새면 다음 차단자를 보지 말고 개인 생존기를 먼저 누릅니다.",
        animationType: "add_interrupt",
        severity: "control",
      },
      {
        id: "windrunner-arrow-hide",
        phaseKo: "화살 점프 + 영혼샘 숨기",
        bossKo: "잠못 드는 심장",
        oneLineKo: "화살은 늦게 밟지 않습니다. 뜬 뒤 영혼샘 뒤로 숨습니다.",
        watchKo: "바닥 화살, 퍼지는 고리, 돌풍 사격 대상, 남는 영혼샘",
        moveKo: "화살 쪽으로 미리 이동 후 점프, 착지 후 영혼샘 뒤로 들어감",
        interruptKo: "차단보다 이동과 안전지대가 우선. 위험 바닥 유도 확인",
        defensiveKo: "화살 실패나 고리 겹침이 보이면 그망/교란, 착지 후 생석",
        failRecoveryKo: "화살을 놓쳤으면 다음 안전지대까지 그망 또는 생존기를 먼저 씁니다.",
        animationType: "arrow_hide",
        severity: "lethal",
      },
    ],
    trashAlerts: [
      {
        titleKo: "쫄 캐스팅",
        watchKo: "이름표 위 캐스팅 바",
        interruptKo: "발차기 우선, 쿨이면 스턴/실명",
        defensiveKo: "시전이 새면 교란으로 광역 피해 대비",
      },
      {
        titleKo: "끌려가기/위치 꼬임",
        watchKo: "대상자 경로와 보스 방향",
        interruptKo: "채널형 위험 시전은 즉시 차단",
        defensiveKo: "끌림 직후 체력 흔들리면 생석",
      },
    ],
    defensivePlan: [
      { triggerKo: "광풍 시작", actionKo: "교란을 먼저 켜고 회오리 길을 봅니다." },
      { triggerKo: "갈고리 차단 실패", actionKo: "그망 또는 교란 후 생석/물약으로 복구합니다." },
      { triggerKo: "화살 점프 실패", actionKo: "다음 안전지대까지 생존기를 아끼지 않습니다." },
    ],
    failRecovery: [
      { mistakeKo: "회오리 길을 늦게 봄", recoveryKo: "공격을 멈추고 가까운 외곽 빈 공간으로 이동합니다." },
      { mistakeKo: "칼리스 광역을 못 끊음", recoveryKo: "파티 체력이 흔들리기 전에 개인 생존기와 생석을 먼저 사용합니다." },
      { mistakeKo: "막넴 화살을 놓침", recoveryKo: "그망/교란으로 다음 패턴까지 버티고 다음 화살 위치를 미리 잡습니다." },
    ],
  },
};
