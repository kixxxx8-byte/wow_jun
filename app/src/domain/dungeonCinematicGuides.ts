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

const wowheadSeasonOverview: DungeonGuideSource = {
  labelKo: "Wowhead 시즌 던전 개요",
  href: "https://www.wowhead.com/guide/midnight/dungeons-overview-locations-details",
};

const wowheadSources: Record<string, DungeonGuideSource> = {
  magisters: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/magisters-terrace-dungeon-overview-location-rewards",
  },
  maisara: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/maisara-caverns-dungeon-overview-location-rewards",
  },
  xenas: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/nexus-point-xenas-dungeon-overview-location-rewards",
  },
  windrunner: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/windrunner-spire-dungeon-overview-location-rewards",
  },
  algethar: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/algethar-academy-dungeon-overview-mythic-plus",
  },
  seat: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/seat-of-the-triumvirate-dungeon-overview-mythicplus",
  },
  skyreach: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/skyreach-dungeon-overview-mythicplus",
  },
  saron: {
    labelKo: "Wowhead 던전 저널",
    href: "https://www.wowhead.com/guide/midnight/pit-of-saron-dungeon-overview-mythic-plus",
  },
};

const methodWindrunner: DungeonGuideSource = {
  labelKo: "Method M+ 가이드",
  href: "https://www.method.gg/guides/dungeons/windrunner-spire",
};

const mageTableWindrunner: DungeonGuideSource = {
  labelKo: "Around the Mage Table 공략",
  href: "https://www.aroundthemagetable.com/guides/windrunner-spire",
};

const confidenceLabelKo: Record<DungeonGuideConfidence, string> = {
  verified: "검수 완료",
  cross_checked: "교차 검수",
  reviewing: "검수 중",
  needs_feedback: "피드백 필요",
};

function sourceSet(dungeonId: string, extras: DungeonGuideSource[] = []) {
  return [wowheadSources[dungeonId], wowheadSeasonOverview, ...extras].filter(Boolean);
}

function audit(dungeonId: string, confidence: DungeonGuideConfidence, summaryKo: string, extras: DungeonGuideSource[] = []): DungeonGuideAudit {
  return {
    confidence,
    confidenceLabelKo: confidenceLabelKo[confidence],
    summaryKo,
    lastChecked: "2026-06-04",
    sources: sourceSet(dungeonId, extras),
    needsUserFeedback: confidence === "needs_feedback",
  };
}

function phase(
  dungeonId: string,
  id: string,
  bossKo: string,
  phaseKo: string,
  oneLineKo: string,
  watchKo: string,
  moveKo: string,
  interruptKo: string,
  defensiveKo: string,
  failRecoveryKo: string,
  animationType: DungeonCinematicAnimation,
  severity: DungeonCinematicSeverity,
  confidence: DungeonGuideConfidence = "cross_checked",
): DungeonCinematicPhase {
  return {
    id,
    bossKo,
    phaseKo,
    oneLineKo,
    watchKo,
    moveKo,
    interruptKo,
    defensiveKo,
    failRecoveryKo,
    animationType,
    severity,
    audit: audit(dungeonId, confidence, `${bossKo} 핵심 패턴을 Wowhead 던전 저널 기준으로 요약했습니다.`),
  };
}

export const dungeonCinematicGuides: Record<string, DungeonCinematicGuide> = {
  magisters: {
    dungeonId: "magisters",
    titleKo: "마법학자의 정원 실전 작전",
    subtitleKo: "억제장, 보주, 선 처리 중심 · 검수 중 상세 공략",
    oneLineKo: "보주는 몸으로 막고, 룬 표식은 억제장 순서, 막넴 선은 절대 가로지르지 않습니다.",
    audit: audit("magisters", "reviewing", "Wowhead 던전 저널 기준으로 정리했으며, M+ 세부 타이밍은 사용자 피드백이 필요합니다."),
    survivalFocusKo: [
      "아르카노트론: 보주가 보스에 닿기 전에 몸으로 막습니다.",
      "세라넬: 룬 표식 대상자는 억제장 순서를 보고 들어갑니다.",
      "데겐트리우스: 선과 구역을 버리지 않고, 공허 폭탄은 외곽에 정리합니다.",
    ],
    phases: [
      phase("magisters", "magisters-orb-block", "아르카노트론 쿠스토스", "보주 차단 + 바닥 외곽", "보주는 가까운 것 하나만 책임지고 바로 빠집니다.", "보주 방향, 보스 에너지, 내 주변 바닥", "가까운 보주만 막고 중앙 바닥을 남기지 않음", "차단보다 보주 처리 우선", "보주/광역 피해 전 교란, 연속 피해면 생석", "보주를 놓쳤으면 다음 광역에 교란을 먼저 켭니다.", "add_interrupt", "high", "reviewing"),
      phase("magisters", "magisters-rune-zone", "세라넬 선래시", "룬 표식 + 억제장", "룬은 동시에 지우지 말고 억제장에서 순서대로 처리합니다.", "내 룬 표식, 억제장 위치, 100 에너지", "내 순서 전에는 억제장 근처에서 대기", "큰 시전보다 표식 순서 유지 우선", "내 순서에 체력이 낮으면 교란, 겹침은 그망", "순서를 놓쳤으면 억제장 밖에서 대기하고 다음 콜을 봅니다.", "arrow_hide", "lethal", "reviewing"),
      phase("magisters", "magisters-line-control", "데겐트리우스", "구역 유지 + 공허선 회피", "선은 넘지 않고, 내 구역 안에서만 짧게 이동합니다.", "내 구역, 공허선 방향, 튕기는 구슬", "정해진 구역 유지. 공허 폭탄은 외곽", "차단보다 선 회피 우선", "선 겹침이면 그망 또는 교란 후 이동", "구역을 잃었으면 딜을 멈추고 빈 칸부터 복구합니다.", "twister_breath", "lethal", "reviewing"),
    ],
    trashAlerts: [
      { titleKo: "비전 바닥", watchKo: "대상 바닥과 넉백 방향", interruptKo: "위험 시전 발차기", defensiveKo: "연속 바닥 피격 전 교란" },
      { titleKo: "도서관 쫄", watchKo: "스턴/침묵성 시전", interruptKo: "발차기 또는 스턴", defensiveKo: "스턴 뒤 광역 피해면 생석" },
    ],
    defensivePlan: [
      { triggerKo: "보주 처리 실패", actionKo: "광역 피해 전에 교란을 먼저 켭니다." },
      { triggerKo: "룬 표식 처리", actionKo: "내 순서에만 들어가고 겹치면 그망으로 복구합니다." },
    ],
    failRecovery: [
      { mistakeKo: "룬을 동시에 지움", recoveryKo: "다음 룬 처리 전 체력 안정과 억제장 순서를 다시 봅니다." },
      { mistakeKo: "막넴 선을 넘음", recoveryKo: "딜을 멈추고 구역을 복구한 뒤 다음 선 방향을 봅니다." },
    ],
  },
  maisara: {
    dungeonId: "maisara",
    titleKo: "마이사라 동굴 실전 작전",
    subtitleKo: "덫 유도, 환영 처리, 토템 점사 중심 · Wowhead 기반",
    oneLineKo: "돌진은 덫으로 끊고, 환영은 겹치지 않게 처리하고, 토템은 즉시 점사합니다.",
    audit: audit("maisara", "cross_checked", "Wowhead 던전 저널과 기존 생존 노트를 대조했습니다."),
    survivalFocusKo: [
      "무로진/네크락스: 빙결 덫과 돌진 선을 같이 봅니다.",
      "보르다자: 추적 환영은 겹치게 터뜨리지 않습니다.",
      "라크툴: 영혼결속 토템은 보스 딜보다 먼저 처리합니다.",
    ],
    phases: [
      phase("maisara", "maisara-trap-swoop", "무로진과 네크락스", "빙결 덫 + 돌진 유도", "돌진 대상은 덫 각을 보고, 덫 위 대상자는 구조 타이밍을 봅니다.", "빙결 덫, Carrion Swoop 선, 보스 체력", "돌진선에서 벗어나고 덫을 보스/돌진 처리에 활용", "Revive Pet, 위험 시전 발차기", "돌진/깃털 광역이 겹치면 교란", "덫 처리 실패 시 산개하고 다음 돌진 선을 먼저 확인합니다.", "hook_interrupt", "high"),
      phase("maisara", "maisara-phantoms", "보르다자", "환영 추적 + 보호막 차단", "추적 환영은 겹쳐 터뜨리지 말고, 보호막이 빠진 뒤 차단합니다.", "Unstable Phantom, Deathshroud, Necrotic Convergence", "추적 대상이면 파티와 반대쪽으로 짧게 유도", "보호막이 사라진 뒤 차단/스턴", "환영 폭발이 겹치면 교란", "환영이 붙으면 이동기로 거리 벌리고 혼자 터뜨립니다.", "add_interrupt", "control"),
      phase("maisara", "maisara-totem-soul", "라크툴", "영혼결속 토템 + 영혼 복귀", "토템이 나오면 하던 딜을 끊고 바로 전환합니다.", "Crush Souls 대상, Soulbind Totem, Withering Soul", "토템을 가깝게 깔되 겹치지 않고, 영혼 복귀 동선 확보", "토템/쫄 시전은 발차기", "Deathgorged Vessel 전 교란", "영혼 복귀가 늦으면 생석을 쓰고 안전 동선을 먼저 잡습니다.", "arrow_hide", "lethal"),
    ],
    trashAlerts: [
      { titleKo: "추적 환영", watchKo: "대상자와 환영 거리", interruptKo: "폭발 전 스턴 보조", defensiveKo: "폭발이 겹치면 교란" },
      { titleKo: "토템/채널", watchKo: "채널 바와 토템 위치", interruptKo: "발차기 우선", defensiveKo: "채널이 새면 생석 준비" },
    ],
    defensivePlan: [
      { triggerKo: "깃털 광역", actionKo: "교란을 켜고 덫/돌진 선을 봅니다." },
      { triggerKo: "토템 다중 생성", actionKo: "광딜보다 대상 토템 점사를 우선합니다." },
    ],
    failRecovery: [
      { mistakeKo: "환영이 겹쳐 터짐", recoveryKo: "다음 환영은 파티 반대편으로 유도하고 생존기를 먼저 씁니다." },
      { mistakeKo: "토템 전환이 늦음", recoveryKo: "보스 딜을 멈추고 가장 가까운 토템부터 처리합니다." },
    ],
  },
  xenas: {
    dungeonId: "xenas",
    titleKo: "연결지점 제나스 실전 작전",
    subtitleKo: "광선 교차, 분신 판별, 진짜 차단 중심 · Wowhead 기반",
    oneLineKo: "광선은 교차점에서 처리하고, 진짜 분신만 차단하며, 막넴 분산은 겹치지 않습니다.",
    audit: audit("xenas", "cross_checked", "Wowhead 던전 저널과 기존 공략 데이터를 대조했습니다."),
    survivalFocusKo: [
      "카스레스: 역류 충전은 광선 교차점에서 짧게 처리합니다.",
      "니사라: 분신/전방/빛 장판을 보고 진짜 위험만 차단합니다.",
      "로스락시온: 분신 근처에 붙지 말고 진짜 시전을 차단합니다.",
    ],
    phases: [
      phase("xenas", "xenas-leyline-reflux", "키스레스", "역류 충전 + 광선 교차", "교차점은 오래 밟지 말고 짧게 처리 후 빠집니다.", "Leyline Arrays, Reflux Charge, 내 디버프", "교차점에 잠깐 들어갔다가 바로 이탈", "차단보다 광선 처리 우선", "광선 피격 전 교란, 실수하면 그망", "교차점을 놓쳤으면 다음 교차선으로 이동하고 딜을 끊습니다.", "twister_breath", "high"),
      phase("xenas", "xenas-nysarra-images", "니사라", "분신 + 빛 장판", "빛 장판 이득보다 전방/분신 거리 유지가 우선입니다.", "Fractured Image, Lightscar Flare, Eclipsing Step", "분신과 5m 이상 거리 유지, 빛 장판은 짧게 활용", "위험 시전만 발차기", "분신 폭발/전방 겹침이면 교란", "분신 사이에 끼면 이동기로 빠져나옵니다.", "add_interrupt", "control"),
      phase("xenas", "xenas-lothraxion-guile", "로스락시온", "진짜 분신 차단", "뿔 없는 진짜만 보고 Divine Guile을 차단합니다.", "Brilliant Dispersion, Flicker, Divine Guile", "분산 대상이면 산개하고 착지 지점 겹침 금지", "진짜 Divine Guile만 발차기", "차단 실패 각이면 그망/교란 준비", "가짜를 봤으면 멈추고 진짜 위치를 다시 확인합니다.", "hook_interrupt", "lethal"),
    ],
    trashAlerts: [
      { titleKo: "마력 광선", watchKo: "교차 지점과 흐름 방향", interruptKo: "처리 중 차단 욕심 금지", defensiveKo: "교차점 피격 전 교란" },
      { titleKo: "분신 접근", watchKo: "분신 5m 거리", interruptKo: "진짜 시전만 차단", defensiveKo: "가까워지면 그망/이동기" },
    ],
    defensivePlan: [
      { triggerKo: "광선 처리", actionKo: "교란을 켜고 교차점만 짧게 밟습니다." },
      { triggerKo: "Divine Guile 차단 실패", actionKo: "파티 피해 전 그망/교란으로 버팁니다." },
    ],
    failRecovery: [
      { mistakeKo: "가짜 분신 차단", recoveryKo: "다음 캐스팅은 이름표/외형을 다시 보고 진짜만 발차기합니다." },
      { mistakeKo: "분산 겹침", recoveryKo: "다음 분산은 미리 산개하고 착지 위치를 겹치지 않습니다." },
    ],
  },
  windrunner: {
    dungeonId: "windrunner",
    titleKo: "윈드러너 첨탑 실전 작전",
    subtitleKo: "근딜/도적 기준 · 던전 저널과 M+ 가이드를 대조한 생존 공략",
    oneLineKo: "바닥은 외곽, 갈고리는 어보미-벤시-대상자, 막넴은 화살로 바람 고리를 넘습니다.",
    audit: audit("windrunner", "cross_checked", "던전 저널과 M+ 공략을 대조했고, 사용자 실전 피드백으로 보정 중입니다.", [methodWindrunner, mageTableWindrunner]),
    survivalFocusKo: [
      "엠버돈: 상승기류 바닥은 외곽에 두고, 광풍 때 전방/회오리 경로를 먼저 봅니다.",
      "버려진 듀오: 칼리스 절규는 내장 걸쇠 갈고리가 칼리스를 맞아야 끊깁니다.",
      "잠못 드는 심장: 화살을 이용해 바람 고리를 넘고, Bolt Gale 전방은 파티에 긋지 않습니다.",
    ],
    phases: [
      phase("windrunner", "windrunner-twister-breath", "재뿔 여명", "상승기류 배치 + 광풍 회피", "상승기류 대상자는 외곽에 깔고, 광풍에는 딜보다 회피가 먼저입니다.", "내 상승기류 디버프, 바닥 위치, 광풍 중 전방 브레스와 회오리 경로", "상승기류는 외곽에 배치. 광풍 중에는 중앙 돌파보다 빈 길로 짧게 이동", "차단 기믹보다 위치 기믹. 근딜은 전방을 맞지 않는 각도 유지", "광풍 지속 피해나 상승기류 도트가 겹치면 교란. 연속 피격이면 생석", "회오리를 맞고 튕기면 즉시 딜 중단, 다음 전방을 피할 공간부터 확보합니다.", "twister_breath", "high"),
      phase("windrunner", "windrunner-hook-interrupt", "칼리스 & 내장 걸쇠", "갈고리로 광역 차단", "갈고리 대상자는 칼리스 뒤로 가서 어보미-벤시-대상자 선을 만듭니다.", "칼리스 절규 시전, 내장 걸쇠 갈고리 대상 표식, 칼리스와 내 위치", "내장 걸쇠 - 칼리스 - 대상자 순서가 되게 칼리스 뒤쪽으로 이동", "칼리스 Shadow Bolt는 발차기. 절규는 갈고리로만 끊는다고 보고 위치부터 맞춤", "갈고리 실패나 절규 중첩이 보이면 교란. 마법 피해가 겹치면 그망", "절규가 새면 다음 행동보다 생석/물약과 개인 생존기로 먼저 버팁니다.", "hook_interrupt", "lethal"),
      phase("windrunner", "windrunner-add-interrupt", "사령관 크롤루크", "도약 유도 + 소환쫄 처리", "먼 대상 도약을 관리하고, 66/33% 쫄은 체인 라이트닝 차단이 우선입니다.", "Reckless Leap 대상 거리, Intimidating Shout 안전 원, 66/33% Rallying Bellow", "도약은 파티 공간을 망치지 않게 유도. 외침 전에는 혼자 떨어지지 않기", "Phantasmal Mystic의 Chain Lightning 우선 발차기. Bladestorm 대상이면 카이팅", "도약/외침/쫄 광역이 겹치면 교란. 출혈이 겹치면 생석 사용", "혼자 떨어져 공포 각이면 즉시 파티원 쪽으로 붙고, 늦었으면 생존기부터 사용합니다.", "add_interrupt", "control"),
      phase("windrunner", "windrunner-arrow-hide", "잠못 드는 심장", "화살 점프 + 바람 고리 넘기", "화살은 바람 고리를 넘는 도구입니다. 대상자는 전방을 파티 밖으로 돌립니다.", "Turbulent Arrows 위치, Bullseye Windblast 충격 지점, Bolt Gale 대상", "고리 전에 화살 위치를 선점. 같은 화살에 여러 명이 겹치지 않게 분산", "차단 기믹보다 이동 기믹. Bolt Gale 대상이면 움직이지 말고 전방을 파티 밖으로 고정", "Bolt Gale 대상이면 교란/그망/소멸 계열로 채널 피해를 줄이거나 끊을 준비", "화살을 놓쳐 고리를 맞을 각이면 이동기와 생존기를 동시에 사용해 다음 안전 구간까지 버팁니다.", "arrow_hide", "lethal"),
    ],
    trashAlerts: [
      { titleKo: "칼리스 구간 쫄", watchKo: "Shadow Bolt, Poison Blades, Pulsing Shriek 캐스팅", interruptKo: "발차기 우선. 보호막/절규류는 빠르게 점사 후 차단", defensiveKo: "저주/도트/광역이 겹치면 교란과 생석 준비" },
      { titleKo: "크롤루크 구간 쫄", watchKo: "Break Ranks, Chain Lightning, Flame Nova, Throw Axe", interruptKo: "Chain Lightning 우선. 스턴으로 Arrow Rain/Gore Whirl 보조", defensiveKo: "도약/출혈/광역이 겹치면 교란" },
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
  algethar: {
    dungeonId: "algethar",
    titleKo: "알게타르 대학 실전 작전",
    subtitleKo: "보주, 씨앗, 중첩 관리 중심 · 복귀 던전 검수 중",
    oneLineKo: "보주는 몸으로 막고, 씨앗은 즉시 처리하며, 막넴 중첩은 욕심내지 않습니다.",
    audit: audit("algethar", "reviewing", "Wowhead Midnight 개요와 기존 던전 경험을 대조했으며, 시즌 튜닝 피드백이 필요합니다."),
    survivalFocusKo: [
      "벡사무스: 보주는 나눠 막고 비전 웅덩이는 외곽에 둡니다.",
      "크로스: 씨앗/바닥 정리로 중앙 공간을 보존합니다.",
      "도라고사: 중첩이 높으면 딜보다 이동과 생존기를 우선합니다.",
    ],
    phases: [
      phase("algethar", "algethar-orb-soak", "벡사무스", "보주 몸막 + 바닥 외곽", "가까운 보주 하나만 책임지고, 웅덩이는 외곽에 버립니다.", "보주 방향, 비전 웅덩이 대상, 보스 에너지", "보주 하나를 막고 즉시 복귀. 웅덩이는 외곽", "차단보다 보주 처리 우선", "보주 직전 교란", "보주가 새면 다음 광역 전 생석/교란을 준비합니다.", "add_interrupt", "high", "reviewing"),
      phase("algethar", "algethar-seed-cleanup", "크로스", "씨앗 + 바닥 정리", "씨앗이 보이면 하던 딜을 끊고 바로 정리합니다.", "씨앗 위치, 바닥 생성, 중앙 공간", "외곽부터 정리하고 중앙은 비워둠", "쫄 시전 발차기", "씨앗 폭발 전 교란", "중앙이 막혔으면 외곽 빈 공간부터 확보합니다.", "twister_breath", "control", "reviewing"),
      phase("algethar", "algethar-stack-control", "도라고사의 메아리", "중첩 관리 + 균열 회피", "3중첩 이상이면 딜보다 생존과 이동을 먼저 봅니다.", "내 중첩, 균열 위치, 광역 타이밍", "중첩 높으면 미리 이동. 균열은 외곽", "큰 시전만 발차기", "고중첩 광역 전 교란", "중첩이 높게 쌓였으면 무리하지 말고 다음 창까지 빠집니다.", "arrow_hide", "lethal", "reviewing"),
    ],
    trashAlerts: [
      { titleKo: "보주/광역", watchKo: "보주 라인과 보스 에너지", interruptKo: "보주 처리 우선", defensiveKo: "광역 전 교란" },
      { titleKo: "씨앗/쫄", watchKo: "씨앗 생성 위치", interruptKo: "위험 쫄 발차기", defensiveKo: "씨앗 폭발 전 생석 준비" },
    ],
    defensivePlan: [
      { triggerKo: "보주 몸막", actionKo: "교란을 켜고 하나만 책임집니다." },
      { triggerKo: "고중첩", actionKo: "딜 중단 후 이동과 생석을 우선합니다." },
    ],
    failRecovery: [
      { mistakeKo: "보주를 여러 개 맞음", recoveryKo: "다음 보주는 다른 파티원에게 맡기고 생존기를 먼저 씁니다." },
      { mistakeKo: "씨앗 처리가 늦음", recoveryKo: "중앙 공간을 회복할 때까지 딜을 줄이고 씨앗을 먼저 정리합니다." },
    ],
  },
  seat: {
    dungeonId: "seat",
    titleKo: "삼두정의 권좌 실전 작전",
    subtitleKo: "공허 바닥, 악령 메즈, 네자르 안전지대 중심 · Wowhead 기반",
    oneLineKo: "공허는 외곽, 악령은 묶고, 네자르는 안전지대부터 봅니다.",
    audit: audit("seat", "cross_checked", "Wowhead 던전 저널 기준으로 복귀 시즌 핵심 패턴을 요약했습니다."),
    survivalFocusKo: [
      "주라알: 공허 바닥을 외곽에 두고 강화 구간에 맞딜하지 않습니다.",
      "사프리쉬: 악령 메즈를 깨지 않고 전방/광역을 피합니다.",
      "네자르/루라: 안전지대와 큰 광역 타이밍을 먼저 봅니다.",
    ],
    phases: [
      phase("seat", "seat-void-pools", "주라알", "공허 바닥 + 강화 회피", "공허 바닥은 외곽에 두고, 강화 구간에는 생존기부터 봅니다.", "Decimate, Coalesced Void, 바닥 위치", "바닥은 외곽. 보스 전방/중앙 장악 피하기", "쫄/위험 시전 발차기", "강화 광역 전 교란", "바닥이 중앙에 깔리면 외곽으로 유도해 공간을 복구합니다.", "twister_breath", "high"),
      phase("seat", "seat-saprish-control", "사프리쉬", "악령 메즈 + 전방 회피", "악령은 치지 말고 묶어두며, 전방은 맞기 전에 빠집니다.", "악령 위치, 전방 시전, 메즈 상태", "악령 근처 이동 금지. 보스 옆/뒤 유지", "새는 시전 발차기/스턴", "메즈가 깨지면 교란/그망 준비", "악령이 풀리면 광딜을 멈추고 재메즈 공간을 만듭니다.", "add_interrupt", "control"),
      phase("seat", "seat-nezhar-safe", "총독 네자르", "안전지대 + 붕괴 고리", "고리보다 안전지대 위치를 먼저 확인합니다.", "Collapsing Void, Void Storm, 안전지대", "안전지대에 먼저 들어가고 욕심 딜 금지", "위험 시전 발차기", "고리 겹침 전 교란", "안전지대를 놓쳤으면 그망/이동기로 다음 공간까지 이동합니다.", "arrow_hide", "lethal"),
      phase("seat", "seat-lura-burst", "루라", "큰 광역 + 위치 유지", "광역 전 체력을 안정시키고, 바닥/공허선에 오래 서지 않습니다.", "큰 광역, 바닥, 이동 공간", "외곽 공간을 보존하고 중앙 장악 피하기", "가능한 시전만 발차기", "광역 전 교란, 피 낮으면 생석", "광역 후 바로 다음 바닥 방향을 확인합니다.", "hook_interrupt", "high"),
    ],
    trashAlerts: [
      { titleKo: "악령/공포", watchKo: "메즈 상태와 공포 시전", interruptKo: "새는 시전 발차기", defensiveKo: "공포 새면 그망/교란" },
      { titleKo: "공허 바닥", watchKo: "바닥 생성 위치", interruptKo: "시전보다 자리 우선", defensiveKo: "바닥 피격 전 교란" },
    ],
    defensivePlan: [
      { triggerKo: "공허 강화", actionKo: "교란을 켜고 바닥 위치를 먼저 봅니다." },
      { triggerKo: "안전지대 이동", actionKo: "이동기를 아끼지 말고 먼저 들어갑니다." },
    ],
    failRecovery: [
      { mistakeKo: "악령 메즈를 깸", recoveryKo: "광딜을 멈추고 새 메즈/스턴으로 시간을 법니다." },
      { mistakeKo: "안전지대 늦음", recoveryKo: "그망/교란으로 다음 안전 구간까지 이동합니다." },
    ],
  },
  skyreach: {
    dungeonId: "skyreach",
    titleKo: "하늘탑 실전 작전",
    subtitleKo: "광선, 납치, 바람/낙사 방지 중심 · Wowhead 기반 검수 중",
    oneLineKo: "광선은 외곽, 납치 쫄은 즉시 제어, 바람 구간은 낙사 방지가 먼저입니다.",
    audit: audit("skyreach", "needs_feedback", "Wowhead 던전 저널과 기존 복귀 던전 데이터를 기반으로 요약했지만, 현재 시즌 세부 처리 피드백이 필요합니다."),
    survivalFocusKo: [
      "란지트: 광선/바람 선을 외곽으로 유도합니다.",
      "아라크나스: 에너지/보호막 구간에 무리하지 않습니다.",
      "비릭스: 납치 쫄은 딜보다 먼저 차단/스턴합니다.",
    ],
    phases: [
      phase("skyreach", "skyreach-beam-edge", "란지트", "광선 유도 + 낙사 방지", "광선은 외곽으로 빼고, 바람에 밀릴 방향을 먼저 봅니다.", "광선 대상, 바람 방향, 낙사 위치", "외곽으로 유도하되 낙사선에 서지 않음", "차단보다 이동 우선", "밀림/광선 겹침 전 교란", "밀려나면 이동기로 중앙 쪽을 먼저 잡습니다.", "twister_breath", "high", "reviewing"),
      phase("skyreach", "skyreach-construct", "아라크나스", "에너지 구간 + 바닥 회피", "보호막/에너지 구간은 바닥과 광역 피해를 먼저 봅니다.", "에너지, 바닥, 보스 위치", "바닥은 외곽, 보스 주변 과밀 금지", "위험 시전 발차기", "광역 전 교란", "바닥에 갇히면 딜보다 탈출 경로를 우선합니다.", "add_interrupt", "control", "reviewing"),
      phase("skyreach", "skyreach-kidnap", "고위 현자 비릭스", "납치 쫄 + 추락 방지", "납치 쫄은 나오면 즉시 스턴/차단하고 대상자를 살립니다.", "쫄 생성, 납치 대상자, 플랫폼 가장자리", "쫄 쪽으로 즉시 이동하되 가장자리 과이동 금지", "발차기/스턴/실명 우선", "쫄 처리 실패 시 교란", "납치가 새면 대상자 쪽으로 붙어 즉시 제어합니다.", "hook_interrupt", "lethal", "reviewing"),
    ],
    trashAlerts: [
      { titleKo: "낙사 위험", watchKo: "바람 방향과 가장자리", interruptKo: "이동 우선", defensiveKo: "밀림 전 교란보다 위치 우선" },
      { titleKo: "납치 쫄", watchKo: "쫄 생성과 대상자", interruptKo: "스턴/발차기", defensiveKo: "실패 시 생석" },
    ],
    defensivePlan: [
      { triggerKo: "바람/광선 겹침", actionKo: "가장자리에서 빠지고 교란을 켭니다." },
      { triggerKo: "납치 쫄 생성", actionKo: "쿨기보다 스턴/차단을 먼저 씁니다." },
    ],
    failRecovery: [
      { mistakeKo: "가장자리로 밀림", recoveryKo: "이동기로 중앙을 잡고 다음 광선을 외곽에 유도합니다." },
      { mistakeKo: "납치 차단 실패", recoveryKo: "대상자 쪽으로 붙고 다음 CC를 바로 넣습니다." },
    ],
  },
  saron: {
    dungeonId: "saron",
    titleKo: "사론의 구덩이 실전 작전",
    subtitleKo: "광석 시야, 망령 차단, 뼈무더기 처리 중심 · Wowhead 기반",
    oneLineKo: "광석 뒤로 숨고, 망령은 차단하며, 장렬 대상은 뼈무더기 위로 갑니다.",
    audit: audit("saron", "cross_checked", "Wowhead 던전 저널 기준으로 Midnight Season 1 복귀 기믹을 정리했습니다."),
    survivalFocusKo: [
      "가프로스트: 광석을 빈 곳에 깔고 Glacial Overload는 광석 뒤로 숨습니다.",
      "이크와 크리크: 망령 소환과 추격 대상 처리를 우선합니다.",
      "티라누스: 장렬 대상은 뼈무더기 위로 가서 얼립니다.",
    ],
    phases: [
      phase("saron", "saron-ore-hide", "제련장인 가프로스트", "광석 배치 + 시야 차단", "광석은 동선 밖에 깔고, 큰 시전은 광석 뒤로 숨습니다.", "Saronite, Glacial Overload, 광석 위치", "보스 근처 빈 공간에 광석 유도 후 뒤로 숨기", "차단보다 시야 차단 우선", "시야 실패 각이면 교란/생석", "광석 위치가 나쁘면 다음 광석으로 새 시야를 만듭니다.", "arrow_hide", "lethal"),
      phase("saron", "saron-ghost-chase", "이크와 크리크", "망령 차단 + 추격 카이팅", "망령은 빠르게 차단하고, 추격 대상은 거리부터 벌립니다.", "망령 소환, 추격 대상, 독 바닥", "추격 대상이면 전방으로 빼고 독은 중앙에 남기지 않음", "망령 시전 발차기/스턴", "추격+망령 겹치면 교란", "망령이 새면 생존기 후 다음 차단 순서를 잡습니다.", "add_interrupt", "control"),
      phase("saron", "saron-bone-freeze", "스컬지군주 티라누스", "뼈무더기 얼리기 + 망령 처리", "장렬 대상은 뼈무더기 위로 올라가 얼리고, 실패한 쫄은 차단합니다.", "장렬 대상, 뼈무더기, 라임팽 위치", "뼈무더기 위로 이동하고 파티와 겹치지 않음", "구울/망령 시전 발차기", "Army of the Dead 전 교란", "뼈무더기를 놓치면 나온 쫄부터 제어합니다.", "hook_interrupt", "lethal"),
    ],
    trashAlerts: [
      { titleKo: "망령/구울", watchKo: "소환 위치와 캐스팅 바", interruptKo: "발차기 우선", defensiveKo: "차단 실패 전 교란" },
      { titleKo: "시야 차단", watchKo: "광석과 보스 시전", interruptKo: "차단 불가면 숨기", defensiveKo: "숨기 실패 시 생석" },
    ],
    defensivePlan: [
      { triggerKo: "Glacial Overload", actionKo: "광석 뒤로 먼저 숨고 늦으면 생존기를 씁니다." },
      { triggerKo: "Army of the Dead", actionKo: "교란을 켜고 차단 가능한 쫄부터 봅니다." },
    ],
    failRecovery: [
      { mistakeKo: "광석 뒤 숨기 실패", recoveryKo: "생석/교란으로 복구하고 다음 광석 위치를 미리 잡습니다." },
      { mistakeKo: "뼈무더기 실패", recoveryKo: "나온 쫄을 스턴/차단하고 보스 전방을 피합니다." },
    ],
  },
};
