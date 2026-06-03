export type DungeonCinematicAnimation = "twister_breath" | "hook_interrupt" | "add_interrupt" | "arrow_hide";
export type DungeonCinematicSeverity = "high" | "lethal" | "control";
export type DungeonGuideConfidence = "verified" | "cross_checked" | "reviewing" | "needs_feedback";

export type DungeonGuideSource = {
  labelKo: string;
  href: string;
};

export type DungeonGuideAudit = {
  confidence: DungeonGuideConfidence;
  confidenceLabelKo: string;
  summaryKo: string;
  lastChecked: string;
  sources: DungeonGuideSource[];
  needsUserFeedback?: boolean;
};

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
  audit: DungeonGuideAudit;
};

export type DungeonCinematicGuide = {
  dungeonId: string;
  titleKo: string;
  subtitleKo: string;
  oneLineKo: string;
  audit: DungeonGuideAudit;
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

const windrunnerSources: DungeonGuideSource[] = [
  { labelKo: "Wowhead 던전 저널", href: "https://www.wowhead.com/guide/midnight/windrunner-spire-dungeon-overview-location-rewards" },
  { labelKo: "Method M+ 가이드", href: "https://www.method.gg/guides/dungeons/windrunner-spire" },
  { labelKo: "Around the Mage Table 공략", href: "https://www.aroundthemagetable.com/guides/windrunner-spire" },
];

const crossCheckedAudit = (summaryKo: string): DungeonGuideAudit => ({
  confidence: "cross_checked",
  confidenceLabelKo: "교차 검수",
  summaryKo,
  lastChecked: "2026-06-04",
  sources: windrunnerSources,
});

export const dungeonCinematicGuides: Record<string, DungeonCinematicGuide> = {
  windrunner: {
    dungeonId: "windrunner",
    titleKo: "윈드러너 첨탑 실전 작전",
    subtitleKo: "근딜/도적 기준 · 던전 저널과 M+ 가이드를 대조한 생존 공략",
    oneLineKo: "바닥은 외곽, 갈고리는 어보미-벤시-대상자, 막넴은 화살로 바람 고리를 넘습니다.",
    audit: crossCheckedAudit("던전 저널과 M+ 공략을 대조했고, 사용자 실전 피드백으로 보정 중입니다."),
    survivalFocusKo: [
      "엠버돈: 상승기류 바닥은 외곽에 두고, 광풍 때 전방/회오리 경로를 먼저 봅니다.",
      "버려진 듀오: 칼리스 절규는 내장 걸쇠 갈고리가 칼리스를 맞아야 끊깁니다.",
      "잠못 드는 심장: 화살을 이용해 바람 고리를 넘고, Bolt Gale 전방은 파티에 긋지 않습니다.",
    ],
    phases: [
      {
        id: "windrunner-twister-breath",
        phaseKo: "상승기류 배치 + 광풍 회피",
        bossKo: "재뿔 여명",
        oneLineKo: "상승기류 대상자는 외곽에 깔고, 광풍에는 딜보다 회피가 먼저입니다.",
        watchKo: "내 상승기류 디버프, 바닥 위치, 광풍 중 전방 브레스와 회오리 경로",
        moveKo: "상승기류는 외곽에 배치. 광풍 중에는 중앙 돌파보다 빈 길로 짧게 이동",
        interruptKo: "차단 기믹보다 위치 기믹. 근딜은 전방을 맞지 않는 각도 유지",
        defensiveKo: "광풍 지속 피해나 상승기류 도트가 겹치면 교란. 연속 피격이면 생석",
        failRecoveryKo: "회오리를 맞고 튕기면 즉시 딜 중단, 다음 전방을 피할 공간부터 확보합니다.",
        animationType: "twister_breath",
        severity: "high",
        audit: crossCheckedAudit("상승기류 외곽 배치와 광풍 회피 기준을 대조했습니다."),
      },
      {
        id: "windrunner-hook-interrupt",
        phaseKo: "갈고리로 광역 차단",
        bossKo: "칼리스 & 내장 걸쇠",
        oneLineKo: "갈고리 대상자는 칼리스 뒤로 가서 어보미-벤시-대상자 선을 만듭니다.",
        watchKo: "칼리스 절규 시전, 내장 걸쇠 갈고리 대상 표식, 칼리스와 내 위치",
        moveKo: "내장 걸쇠 - 칼리스 - 대상자 순서가 되게 칼리스 뒤쪽으로 이동",
        interruptKo: "칼리스 Shadow Bolt는 발차기. 절규는 갈고리로만 끊는다고 보고 위치부터 맞춤",
        defensiveKo: "갈고리 실패나 절규 중첩이 보이면 교란. 마법 피해가 겹치면 그망",
        failRecoveryKo: "절규가 새면 다음 행동보다 생석/물약과 개인 생존기로 먼저 버팁니다.",
        animationType: "hook_interrupt",
        severity: "lethal",
        audit: crossCheckedAudit("갈고리 라인은 사용자 피드백을 반영해 어보미-벤시-대상자 순서로 보정했습니다."),
      },
      {
        id: "windrunner-add-interrupt",
        phaseKo: "도약 유도 + 소환쫄 처리",
        bossKo: "사령관 크롤루크",
        oneLineKo: "먼 대상 도약을 관리하고, 66/33% 쫄은 체인 라이트닝 차단이 우선입니다.",
        watchKo: "Reckless Leap 대상 거리, Intimidating Shout 안전 원, 66/33% Rallying Bellow",
        moveKo: "도약은 파티 공간을 망치지 않게 유도. 외침 전에는 혼자 떨어지지 않기",
        interruptKo: "Phantasmal Mystic의 Chain Lightning 우선 발차기. Bladestorm 대상이면 카이팅",
        defensiveKo: "도약/외침/쫄 광역이 겹치면 교란. 출혈이 겹치면 생석 사용",
        failRecoveryKo: "혼자 떨어져 공포 각이면 즉시 파티원 쪽으로 붙고, 늦었으면 생존기부터 사용합니다.",
        animationType: "add_interrupt",
        severity: "control",
        audit: crossCheckedAudit("도약, 외침, 66/33% 쫄 처리 우선순위를 대조했습니다."),
      },
      {
        id: "windrunner-arrow-hide",
        phaseKo: "화살 점프 + 바람 고리 넘기",
        bossKo: "잠못 드는 심장",
        oneLineKo: "화살은 바람 고리를 넘는 도구입니다. 대상자는 전방을 파티 밖으로 돌립니다.",
        watchKo: "Turbulent Arrows 위치, Bullseye Windblast 충격 지점, Bolt Gale 대상",
        moveKo: "고리 전에 화살 위치를 선점. 같은 화살에 여러 명이 겹치지 않게 분산",
        interruptKo: "차단 기믹보다 이동 기믹. Bolt Gale 대상이면 움직이지 말고 전방을 파티 밖으로 고정",
        defensiveKo: "Bolt Gale 대상이면 교란/그망/소멸 계열로 채널 피해를 줄이거나 끊을 준비",
        failRecoveryKo: "화살을 놓쳐 고리를 맞을 각이면 이동기와 생존기를 동시에 사용해 다음 안전 구간까지 버팁니다.",
        animationType: "arrow_hide",
        severity: "lethal",
        audit: crossCheckedAudit("화살 점프와 Bolt Gale 전방 처리 기준을 재검수했습니다."),
      },
    ],
    trashAlerts: [
      {
        titleKo: "칼리스 구간 쫄",
        watchKo: "Shadow Bolt, Poison Blades, Pulsing Shriek 캐스팅",
        interruptKo: "발차기 우선. 보호막/절규류는 빠르게 점사 후 차단",
        defensiveKo: "저주/도트/광역이 겹치면 교란과 생석 준비",
      },
      {
        titleKo: "크롤루크 구간 쫄",
        watchKo: "Break Ranks, Chain Lightning, Flame Nova, Throw Axe",
        interruptKo: "Chain Lightning 우선. 스턴으로 Arrow Rain/Gore Whirl 보조",
        defensiveKo: "도약/출혈/광역이 겹치면 교란",
      },
    ],
    defensivePlan: [
      { triggerKo: "광풍 + 전방/회오리", actionKo: "교란을 켜고 딜을 멈춘 뒤 빈 길을 먼저 잡습니다." },
      { triggerKo: "갈고리 차단 실패", actionKo: "절규 중첩이 쌓이므로 그망/교란 후 생석/물약으로 복구합니다." },
      { triggerKo: "Bolt Gale 대상", actionKo: "전방을 파티 밖으로 고정하고 교란/그망/소멸 가능 여부를 봅니다." },
    ],
    failRecovery: [
      { mistakeKo: "상승기류를 중앙에 깜", recoveryKo: "다음 광풍 전에 외곽 쪽 빈 공간을 확보하고 중앙 돌파를 피합니다." },
      { mistakeKo: "칼리스 갈고리 라인을 놓침", recoveryKo: "절규 중첩 피해를 개인 생존기로 버티고 다음 갈고리 대상 위치를 미리 콜합니다." },
      { mistakeKo: "막넴 화살을 놓침", recoveryKo: "고리 피격 각이면 이동기와 그망/교란을 같이 쓰고 다음 화살을 선점합니다." },
    ],
  },
};
