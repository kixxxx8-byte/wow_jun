export type OutlawCombatSkill =
  | "폭풍의 칼날"
  | "아드레날린 촉진"
  | "뼈주사위"
  | "난도질"
  | "도박의 연속(KIR)"
  | "Blade Rush"
  | "사악한 일격"
  | "권총 사격"
  | "미간 적중"
  | "속결"
  | "광기의 학살자"
  | "준비"
  | "발차기"
  | "교란"
  | "그림자 망토";

export type OutlawCombatAction = {
  skillKo: OutlawCombatSkill;
};

export type OutlawKeybind = {
  key: string;
  eventCode: string;
  skillKo: OutlawCombatSkill;
  labelKo: string;
};

export type OutlawCombatScenarioId =
  | "single_dummy"
  | "aoe_pull"
  | "boss_with_adds"
  | "cooldowns_locked"
  | "mistake_recovery";

export type OutlawCombatScenario = {
  id: OutlawCombatScenarioId;
  labelKo: string;
  descriptionKo: string;
};

export type OutlawCombatDifficulty = "basic" | "practical" | "pressure";

export type OutlawCombatRunOptions = {
  dynamic?: boolean;
  difficulty?: OutlawCombatDifficulty;
};

export type OutlawCombatDifficultyProfile = {
  id: OutlawCombatDifficulty;
  labelKo: string;
  descriptionKo: string;
  mechanicDurationOffset: number;
  penaltyMultiplier: number;
  wrongActionPenalty: number;
  scoreMultiplier: number;
};

export type OutlawCombatMechanic = {
  id: string;
  triggerAt: number;
  duration: number;
  titleKo: string;
  detailKo: string;
  expectedSkillKo: OutlawCombatSkill;
  severity: "medium" | "high" | "lethal";
  targetCount?: 1 | 2 | 4;
};

export type OutlawCombatState = {
  scenarioId: OutlawCombatScenarioId;
  elapsedSeconds: number;
  targets: 1 | 2 | 4;
  targetHealth: number;
  energy: number;
  comboPoints: number;
  rollStage: 0 | 1 | 2 | 3 | 4;
  opportunityStacks: 0 | 3 | 6;
  gcdRemaining: number;
  health: number;
  mistakes: number;
  score: number;
  streak: number;
  activeMechanic?: OutlawCombatMechanic;
  resolvedMechanicIds: string[];
  buffs: {
    bladeFlurry: number;
    sliceAndDice: number;
    adrenalineRush: number;
  };
  cooldowns: {
    adrenalineRush: number;
    bladeRush: number;
    betweenTheEyes: number;
    preparation: number;
    killingSpree: number;
    keepItRolling: number;
    rollTheBones: number;
    kick: number;
    feint: number;
    cloakOfShadows: number;
  };
};

export type OutlawSessionResult = "in_progress" | "success" | "failed";

export type OutlawRecommendation = {
  skillKo: OutlawCombatSkill;
  reasonKo: string;
  noteKo: string;
};

export type OutlawCombatLogEntry = {
  id: string;
  elapsedSeconds: number;
  skillKo: OutlawCombatSkill;
  result: "correct" | "okay" | "wrong" | "unavailable";
  messageKo: string;
  expectedSkillKo: OutlawCombatSkill;
  inputKey?: string;
  reactionMs?: number;
};

export type OutlawActionAvailability = {
  usable: boolean;
  reasonKo?: string;
};

export const outlawCombatDifficultyProfiles: Record<OutlawCombatDifficulty, OutlawCombatDifficultyProfile> = {
  basic: {
    id: "basic",
    labelKo: "기초",
    descriptionKo: "패턴 여유가 조금 있고 실수 피해가 낮습니다.",
    mechanicDurationOffset: 2,
    penaltyMultiplier: 0.75,
    wrongActionPenalty: 5,
    scoreMultiplier: 1,
  },
  practical: {
    id: "practical",
    labelKo: "실전",
    descriptionKo: "기본 실전 속도입니다.",
    mechanicDurationOffset: 0,
    penaltyMultiplier: 1,
    wrongActionPenalty: 8,
    scoreMultiplier: 1,
  },
  pressure: {
    id: "pressure",
    labelKo: "고압",
    descriptionKo: "패턴 시간이 짧고 실수 피해가 큽니다.",
    mechanicDurationOffset: -1,
    penaltyMultiplier: 1.3,
    wrongActionPenalty: 12,
    scoreMultiplier: 1.1,
  },
};

export const outlawCombatActions: OutlawCombatAction[] = [
  { skillKo: "폭풍의 칼날" },
  { skillKo: "아드레날린 촉진" },
  { skillKo: "뼈주사위" },
  { skillKo: "난도질" },
  { skillKo: "도박의 연속(KIR)" },
  { skillKo: "Blade Rush" },
  { skillKo: "사악한 일격" },
  { skillKo: "권총 사격" },
  { skillKo: "미간 적중" },
  { skillKo: "속결" },
  { skillKo: "광기의 학살자" },
  { skillKo: "준비" },
  { skillKo: "발차기" },
  { skillKo: "교란" },
  { skillKo: "그림자 망토" },
];

export const outlawDefaultKeybinds: OutlawKeybind[] = [
  { key: "Q", eventCode: "KeyQ", skillKo: "폭풍의 칼날", labelKo: "광역 스위치" },
  { key: "R", eventCode: "KeyR", skillKo: "아드레날린 촉진", labelKo: "흐름 열기" },
  { key: "F", eventCode: "KeyF", skillKo: "뼈주사위", labelKo: "주사위" },
  { key: "5", eventCode: "Digit5", skillKo: "난도질", labelKo: "유지" },
  { key: "Shift+F", eventCode: "Shift+KeyF", skillKo: "도박의 연속(KIR)", labelKo: "좋은 주사위 고정" },
  { key: "E", eventCode: "KeyE", skillKo: "Blade Rush", labelKo: "공격 쿨기" },
  { key: "1", eventCode: "Digit1", skillKo: "사악한 일격", labelKo: "기본 생성기" },
  { key: "2", eventCode: "Digit2", skillKo: "권총 사격", labelKo: "기회 반응" },
  { key: "4", eventCode: "Digit4", skillKo: "미간 적중", labelKo: "핵심 마무리" },
  { key: "3", eventCode: "Digit3", skillKo: "속결", labelKo: "마무리" },
  { key: "Shift+E", eventCode: "Shift+KeyE", skillKo: "광기의 학살자", labelKo: "강한 쿨기" },
  { key: "Shift+R", eventCode: "Shift+KeyR", skillKo: "준비", labelKo: "쿨기 재진입" },
  { key: "C", eventCode: "KeyC", skillKo: "발차기", labelKo: "차단" },
  { key: "V", eventCode: "KeyV", skillKo: "교란", labelKo: "광역 생존" },
  { key: "Shift+C", eventCode: "Shift+KeyC", skillKo: "그림자 망토", labelKo: "마법 생존" },
];

export function getOutlawKeybindByCode(eventCode: string, shiftKey: boolean): OutlawKeybind | undefined {
  const normalizedCode = shiftKey ? `Shift+${eventCode}` : eventCode;
  return outlawDefaultKeybinds.find((keybind) => keybind.eventCode === normalizedCode);
}

export const outlawCombatScenarios: OutlawCombatScenario[] = [
  {
    id: "single_dummy",
    labelKo: "단일 허수아비",
    descriptionKo: "단일 대상에서 버프, CP, 미간 적중 우선순위를 반복합니다.",
  },
  {
    id: "aoe_pull",
    labelKo: "광역 풀",
    descriptionKo: "2타겟 이상에서 폭풍의 칼날을 먼저 켜고 광역 흐름을 잡습니다.",
  },
  {
    id: "boss_with_adds",
    labelKo: "보스 + 쫄",
    descriptionKo: "보스 단일 중 쫄이 붙은 상황처럼 광역 전환을 연습합니다.",
  },
  {
    id: "cooldowns_locked",
    labelKo: "쿨기 막힘",
    descriptionKo: "핵심 쿨기가 막혔을 때 준비로 다시 여는 타이밍을 봅니다.",
  },
  {
    id: "mistake_recovery",
    labelKo: "실수 복구",
    descriptionKo: "낮은 주사위, 꺼진 폭풍의 칼날, CP 과잉을 바로잡습니다.",
  },
];

export const outlawScenarioMechanics: Record<OutlawCombatScenarioId, OutlawCombatMechanic[]> = {
  single_dummy: [
    {
      id: "single-kick-1",
      triggerAt: 6,
      duration: 4,
      titleKo: "위험 시전",
      detailKo: "보스가 끊어야 하는 시전을 시작했습니다.",
      expectedSkillKo: "발차기",
      severity: "high",
    },
    {
      id: "single-defensive-1",
      triggerAt: 14,
      duration: 5,
      titleKo: "광역 피해",
      detailKo: "큰 광역 피해가 곧 들어옵니다.",
      expectedSkillKo: "교란",
      severity: "medium",
    },
  ],
  aoe_pull: [
    {
      id: "aoe-switch-1",
      triggerAt: 2,
      duration: 6,
      titleKo: "쫄이 붙음",
      detailKo: "적이 여러 마리입니다. 광역 스위치가 먼저입니다.",
      expectedSkillKo: "폭풍의 칼날",
      severity: "high",
      targetCount: 4,
    },
    {
      id: "aoe-kick-1",
      triggerAt: 8,
      duration: 3,
      titleKo: "위험 시전",
      detailKo: "쫄 하나가 위험한 주문을 시전합니다.",
      expectedSkillKo: "발차기",
      severity: "lethal",
    },
    {
      id: "aoe-defensive-1",
      triggerAt: 15,
      duration: 4,
      titleKo: "광역 폭발",
      detailKo: "피하기 어려운 광역 피해가 겹칩니다.",
      expectedSkillKo: "교란",
      severity: "high",
    },
  ],
  boss_with_adds: [
    {
      id: "boss-adds-1",
      triggerAt: 4,
      duration: 7,
      titleKo: "쫄 합류",
      detailKo: "보스 옆에 쫄이 붙었습니다. 단일에서 광역으로 전환합니다.",
      expectedSkillKo: "폭풍의 칼날",
      severity: "high",
      targetCount: 4,
    },
    {
      id: "boss-magic-1",
      triggerAt: 11,
      duration: 4,
      titleKo: "마법 디버프",
      detailKo: "해제 전까지 위험한 마법 피해가 들어옵니다.",
      expectedSkillKo: "그림자 망토",
      severity: "high",
    },
  ],
  cooldowns_locked: [
    {
      id: "locked-kick-1",
      triggerAt: 5,
      duration: 4,
      titleKo: "시전 겹침",
      detailKo: "딜 쿨기가 막힌 와중에 차단할 시전이 올라옵니다.",
      expectedSkillKo: "발차기",
      severity: "high",
    },
  ],
  mistake_recovery: [
    {
      id: "recovery-defensive-1",
      triggerAt: 3,
      duration: 4,
      titleKo: "체력 위험",
      detailKo: "이미 흐름이 꼬인 상태에서 광역 피해가 들어옵니다.",
      expectedSkillKo: "교란",
      severity: "high",
    },
    {
      id: "recovery-magic-1",
      triggerAt: 10,
      duration: 4,
      titleKo: "마법 피해",
      detailKo: "맞으면 크게 흔들리는 마법 피해입니다.",
      expectedSkillKo: "그림자 망토",
      severity: "lethal",
    },
  ],
};

export function createOutlawScenarioState(scenarioId: OutlawCombatScenarioId): OutlawCombatState {
  const base: OutlawCombatState = {
    scenarioId,
    elapsedSeconds: 0,
    targets: 1,
    targetHealth: 100,
    energy: 100,
    comboPoints: 0,
    rollStage: 0,
    opportunityStacks: 0,
    gcdRemaining: 0,
    health: 100,
    mistakes: 0,
    score: 0,
    streak: 0,
    resolvedMechanicIds: [],
    buffs: {
      bladeFlurry: 0,
      sliceAndDice: 0,
      adrenalineRush: 0,
    },
    cooldowns: {
      adrenalineRush: 0,
      bladeRush: 0,
      betweenTheEyes: 0,
      preparation: 0,
      killingSpree: 0,
      keepItRolling: 0,
      rollTheBones: 0,
      kick: 0,
      feint: 0,
      cloakOfShadows: 0,
    },
  };

  if (scenarioId === "aoe_pull") {
    return { ...base, targets: 4, energy: 95 };
  }

  if (scenarioId === "boss_with_adds") {
    return {
      ...base,
      targets: 2,
      energy: 80,
      comboPoints: 3,
      rollStage: 2,
      opportunityStacks: 3,
      buffs: { ...base.buffs, sliceAndDice: 22 },
      cooldowns: { ...base.cooldowns, adrenalineRush: 28, rollTheBones: 15 },
    };
  }

  if (scenarioId === "cooldowns_locked") {
    return {
      ...base,
      targets: 2,
      energy: 70,
      comboPoints: 2,
      rollStage: 2,
      buffs: { ...base.buffs, bladeFlurry: 8, sliceAndDice: 18 },
      cooldowns: {
        ...base.cooldowns,
        adrenalineRush: 35,
        bladeRush: 18,
        betweenTheEyes: 12,
        preparation: 0,
        killingSpree: 28,
        keepItRolling: 70,
        rollTheBones: 18,
      },
    };
  }

  if (scenarioId === "mistake_recovery") {
    return {
      ...base,
      targets: 4,
      energy: 55,
      comboPoints: 7,
      rollStage: 1,
      opportunityStacks: 6,
      buffs: { ...base.buffs, bladeFlurry: 0, sliceAndDice: 4 },
      cooldowns: { ...base.cooldowns, adrenalineRush: 18, bladeRush: 0, betweenTheEyes: 0 },
    };
  }

  return base;
}

export function getOutlawRecommendation(state: OutlawCombatState): OutlawRecommendation {
  const sessionResult = getOutlawSessionResult(state);
  if (sessionResult === "success") {
    return {
      skillKo: "사악한 일격",
      reasonKo: "세션을 성공했습니다.",
      noteKo: "처음부터 다시 시작하거나 다른 상황을 선택하세요.",
    };
  }
  if (sessionResult === "failed") {
    return {
      skillKo: "교란",
      reasonKo: "세션이 실패했습니다.",
      noteKo: "체력이 0이 되었습니다. 처음부터 다시 시작하세요.",
    };
  }

  if (state.activeMechanic) {
    return {
      skillKo: state.activeMechanic.expectedSkillKo,
      reasonKo: `${state.activeMechanic.titleKo}: ${state.activeMechanic.detailKo}`,
      noteKo: "실전에서는 생존/차단/광역 전환이 딜 버튼보다 먼저입니다.",
    };
  }

  if (state.targets >= 2 && state.buffs.bladeFlurry <= 0) {
    return {
      skillKo: "폭풍의 칼날",
      reasonKo: "2타겟 이상인데 광역 스위치가 꺼져 있습니다.",
      noteKo: "무법 광역은 폭풍의 칼날이 켜져 있어야 뒤 버튼들이 의미가 생깁니다.",
    };
  }

  if (state.rollStage <= 1 && state.cooldowns.rollTheBones <= 0) {
    return {
      skillKo: "뼈주사위",
      reasonKo: "뼈주사위가 없거나 1단계라 다시 굴릴 상황입니다.",
      noteKo: "낮은 주사위를 오래 유지하면 이후 CP와 쿨기 흐름이 흔들립니다.",
    };
  }

  if (state.cooldowns.keepItRolling <= 0 && state.rollStage >= 3) {
    return {
      skillKo: "도박의 연속(KIR)",
      reasonKo: "뼈주사위가 3단계 이상이라 좋은 버프를 붙잡을 수 있습니다.",
      noteKo: "2단계 예외는 숙련자 판단입니다. 연습 시뮬은 3단계 이상을 기본으로 둡니다.",
    };
  }

  if (
    state.cooldowns.preparation <= 0 &&
    state.cooldowns.adrenalineRush > 10 &&
    state.cooldowns.betweenTheEyes > 0 &&
    state.cooldowns.bladeRush > 0
  ) {
    return {
      skillKo: "준비",
      reasonKo: "아드레날린 촉진, 미간 적중, Blade Rush가 모두 막혀 있습니다.",
      noteKo: "단, 아드레날린 촉진 쿨이 곧 오면 준비를 성급히 쓰지 않습니다.",
    };
  }

  if (state.cooldowns.adrenalineRush <= 0 && state.buffs.adrenalineRush <= 0 && state.comboPoints <= 2) {
    return {
      skillKo: "아드레날린 촉진",
      reasonKo: "아드레날린 촉진이 준비됐고 CP가 낮아 흐름을 열기 좋습니다.",
      noteKo: "무법은 큰 한 방보다 쿨기를 오래 들지 않는 운영이 중요합니다.",
    };
  }

  if (state.buffs.sliceAndDice <= 0 || state.buffs.sliceAndDice <= 4) {
    return {
      skillKo: "난도질",
      reasonKo: "난도질 유지 시간이 부족합니다.",
      noteKo: "마무리 일격을 쓰기 전에 기본 공격 속도 흐름을 복구합니다.",
    };
  }

  if (state.cooldowns.bladeRush <= 0) {
    return {
      skillKo: "Blade Rush",
      reasonKo: "Blade Rush가 준비되어 있어 쿨마다 확인할 구간입니다.",
      noteKo: "광역에서는 폭풍의 칼날이 켜진 뒤 쓰는지 먼저 확인합니다.",
    };
  }

  if (state.cooldowns.betweenTheEyes <= 0 && state.comboPoints >= 6) {
    return {
      skillKo: "미간 적중",
      reasonKo: "6CP 이상이고 미간 적중이 준비되어 있습니다.",
      noteKo: "높은 CP에서 쓰는 습관이 우선입니다.",
    };
  }

  if (state.cooldowns.killingSpree <= 0 && state.comboPoints >= 5) {
    return {
      skillKo: "광기의 학살자",
      reasonKo: "광기의 학살자가 준비됐고 5CP 이상입니다.",
      noteKo: "실제 던전에서는 위험 바닥이나 이동 패턴과 겹치지 않는지도 봅니다.",
    };
  }

  if (state.comboPoints >= 6) {
    return {
      skillKo: "속결",
      reasonKo: "마무리할 CP가 충분하지만 미간 적중 우선 조건은 아닙니다.",
      noteKo: "CP를 넘치게 두지 말고 속결로 비웁니다.",
    };
  }

  if (state.opportunityStacks === 6 || (state.opportunityStacks === 3 && state.comboPoints >= 1 && state.comboPoints <= 3)) {
    return {
      skillKo: "권총 사격",
      reasonKo: "기회 중첩과 현재 CP가 권총 사격 조건에 맞습니다.",
      noteKo: "기회가 보였다는 이유만으로 누르지 않고 CP를 같이 봅니다.",
    };
  }

  return {
    skillKo: "사악한 일격",
    reasonKo: "우선 조건이 없으므로 기본 생성기로 CP를 모읍니다.",
    noteKo: "CP가 6 이상이 되면 생성기를 멈추고 마무리 일격을 봅니다.",
  };
}

export function scoreOutlawAction(state: OutlawCombatState, action: OutlawCombatAction): Omit<OutlawCombatLogEntry, "id" | "elapsedSeconds"> {
  const expected = getOutlawRecommendation(state);
  const availability = getOutlawActionAvailability(state, action);

  if (!availability.usable) {
    return {
      skillKo: action.skillKo,
      result: "unavailable",
      expectedSkillKo: expected.skillKo,
      messageKo: `${action.skillKo}는 지금 사용할 수 없습니다. ${availability.reasonKo ?? ""} 지금 봐야 할 버튼은 ${expected.skillKo}입니다.`,
    };
  }

  if (action.skillKo === expected.skillKo) {
    return {
      skillKo: action.skillKo,
      result: "correct",
      expectedSkillKo: expected.skillKo,
      messageKo: `좋습니다. 지금은 ${action.skillKo}이 맞습니다. ${expected.reasonKo}`,
    };
  }

  const okaySkills: OutlawCombatSkill[] = [];
  if (state.comboPoints >= 6 && action.skillKo === "속결") okaySkills.push("속결");
  if (state.cooldowns.bladeRush <= 0 && action.skillKo === "Blade Rush" && state.targets <= 1) okaySkills.push("Blade Rush");
  if (state.activeMechanic?.expectedSkillKo === "교란" && action.skillKo === "그림자 망토") okaySkills.push("그림자 망토");
  if (state.activeMechanic?.expectedSkillKo === "그림자 망토" && action.skillKo === "교란") okaySkills.push("교란");

  if (okaySkills.includes(action.skillKo)) {
    return {
      skillKo: action.skillKo,
      result: "okay",
      expectedSkillKo: expected.skillKo,
      messageKo: `가능은 하지만 ${expected.skillKo}를 먼저 확인하는 편이 좋습니다. ${expected.reasonKo}`,
    };
  }

  return {
    skillKo: action.skillKo,
    result: "wrong",
    expectedSkillKo: expected.skillKo,
    messageKo: `지금은 ${expected.skillKo}부터 봐야 합니다. ${expected.reasonKo}`,
  };
}

export function advanceOutlawTime(state: OutlawCombatState, seconds: number, options?: OutlawCombatRunOptions): OutlawCombatState {
  if (getOutlawSessionResult(state) !== "in_progress") return state;

  const difficulty = getOutlawDifficultyProfile(options);
  const recovery = state.buffs.adrenalineRush > 0 ? 18 : 10;
  const nextEnergy = Math.min(100, state.energy + recovery * seconds);
  const tick = (value: number) => Math.max(0, Math.round((value - seconds) * 10) / 10);
  const activeMechanic = state.activeMechanic;
  const expiredMechanic = activeMechanic && state.elapsedSeconds + seconds > activeMechanic.triggerAt + activeMechanic.duration;
  const penalty = expiredMechanic ? getMechanicPenalty(activeMechanic, difficulty) : 0;

  const nextState: OutlawCombatState = {
    ...state,
    elapsedSeconds: Math.round((state.elapsedSeconds + seconds) * 10) / 10,
    energy: Math.round(nextEnergy),
    gcdRemaining: tick(state.gcdRemaining),
    health: Math.max(0, state.health - penalty),
    mistakes: state.mistakes + (expiredMechanic ? 1 : 0),
    streak: expiredMechanic ? 0 : state.streak,
    activeMechanic: expiredMechanic ? undefined : state.activeMechanic,
    resolvedMechanicIds: expiredMechanic ? [...state.resolvedMechanicIds, activeMechanic.id] : state.resolvedMechanicIds,
    buffs: {
      bladeFlurry: tick(state.buffs.bladeFlurry),
      sliceAndDice: tick(state.buffs.sliceAndDice),
      adrenalineRush: tick(state.buffs.adrenalineRush),
    },
    cooldowns: {
      adrenalineRush: tick(state.cooldowns.adrenalineRush),
      bladeRush: tick(state.cooldowns.bladeRush),
      betweenTheEyes: tick(state.cooldowns.betweenTheEyes),
      preparation: tick(state.cooldowns.preparation),
      killingSpree: tick(state.cooldowns.killingSpree),
      keepItRolling: tick(state.cooldowns.keepItRolling),
      rollTheBones: tick(state.cooldowns.rollTheBones),
      kick: tick(state.cooldowns.kick),
      feint: tick(state.cooldowns.feint),
      cloakOfShadows: tick(state.cooldowns.cloakOfShadows),
    },
  };

  return activateNextMechanic(applyDynamicBattlefield(nextState, state.elapsedSeconds, options), options);
}

export function applyOutlawAction(state: OutlawCombatState, action: OutlawCombatAction, options?: OutlawCombatRunOptions): OutlawCombatState {
  if (getOutlawSessionResult(state) !== "in_progress") return state;

  const difficulty = getOutlawDifficultyProfile(options);
  const scored = scoreOutlawAction(state, action);
  if (scored.result === "unavailable") {
    return {
      ...state,
      mistakes: state.mistakes + 1,
      streak: 0,
      score: Math.max(0, state.score - Math.round(30 * difficulty.penaltyMultiplier)),
    };
  }

  const withMechanicResult = resolveMechanicIfNeeded(applySkillEffect(state, action.skillKo), action.skillKo, scored.result);
  const withScore = {
    ...withMechanicResult,
    gcdRemaining: 1,
    score: Math.max(0, withMechanicResult.score + getActionScore(scored.result, difficulty)),
    mistakes: withMechanicResult.mistakes + (scored.result === "wrong" ? 1 : 0),
    streak: scored.result === "correct" ? withMechanicResult.streak + 1 : 0,
    health: Math.max(0, withMechanicResult.health - (scored.result === "wrong" ? difficulty.wrongActionPenalty : 0)),
  };
  return advanceOutlawTime(withScore, 1, options);
}

export function getOutlawActionAvailability(state: OutlawCombatState, action: OutlawCombatAction): OutlawActionAvailability {
  const skillKo = action.skillKo;

  if (state.targetHealth <= 0) return { usable: false, reasonKo: "타겟을 처치했습니다. 새 세션을 시작하세요." };
  if (state.health <= 0) return { usable: false, reasonKo: "체력이 0이라 세션을 처음부터 다시 시작해야 합니다." };

  if (skillKo === "뼈주사위" && state.cooldowns.rollTheBones > 0) return { usable: false, reasonKo: `뼈주사위 쿨이 ${Math.ceil(state.cooldowns.rollTheBones)}초 남았습니다.` };
  if (skillKo === "도박의 연속(KIR)" && state.cooldowns.keepItRolling > 0) return { usable: false, reasonKo: `도박의 연속 쿨이 ${Math.ceil(state.cooldowns.keepItRolling)}초 남았습니다.` };
  if (skillKo === "아드레날린 촉진" && state.cooldowns.adrenalineRush > 0) return { usable: false, reasonKo: `아드레날린 촉진 쿨이 ${Math.ceil(state.cooldowns.adrenalineRush)}초 남았습니다.` };
  if (skillKo === "Blade Rush" && state.cooldowns.bladeRush > 0) return { usable: false, reasonKo: `Blade Rush 쿨이 ${Math.ceil(state.cooldowns.bladeRush)}초 남았습니다.` };
  if (skillKo === "미간 적중" && state.cooldowns.betweenTheEyes > 0) return { usable: false, reasonKo: `미간 적중 쿨이 ${Math.ceil(state.cooldowns.betweenTheEyes)}초 남았습니다.` };
  if (skillKo === "광기의 학살자" && state.cooldowns.killingSpree > 0) return { usable: false, reasonKo: `광기의 학살자 쿨이 ${Math.ceil(state.cooldowns.killingSpree)}초 남았습니다.` };
  if (skillKo === "준비" && state.cooldowns.preparation > 0) return { usable: false, reasonKo: `준비 쿨이 ${Math.ceil(state.cooldowns.preparation)}초 남았습니다.` };
  if (skillKo === "발차기" && state.cooldowns.kick > 0) return { usable: false, reasonKo: `발차기 쿨이 ${Math.ceil(state.cooldowns.kick)}초 남았습니다.` };
  if (skillKo === "교란" && state.cooldowns.feint > 0) return { usable: false, reasonKo: `교란 쿨이 ${Math.ceil(state.cooldowns.feint)}초 남았습니다.` };
  if (skillKo === "그림자 망토" && state.cooldowns.cloakOfShadows > 0) return { usable: false, reasonKo: `그림자 망토 쿨이 ${Math.ceil(state.cooldowns.cloakOfShadows)}초 남았습니다.` };

  if (skillKo === "사악한 일격" && state.energy < 45) return { usable: false, reasonKo: `기력이 ${45 - state.energy} 부족합니다.` };
  if (skillKo === "권총 사격" && state.energy < 35) return { usable: false, reasonKo: `기력이 ${35 - state.energy} 부족합니다.` };
  if (skillKo === "속결" && state.energy < 25) return { usable: false, reasonKo: `기력이 ${25 - state.energy} 부족합니다.` };

  if ((skillKo === "미간 적중" || skillKo === "속결") && state.comboPoints < 5) return { usable: false, reasonKo: "마무리 일격을 쓰기엔 CP가 부족합니다." };
  if (skillKo === "광기의 학살자" && state.comboPoints < 5) return { usable: false, reasonKo: "광기의 학살자는 5CP 이상에서 확인합니다." };
  if (skillKo === "도박의 연속(KIR)" && state.rollStage < 3) return { usable: false, reasonKo: "뼈주사위가 3단계 이상일 때 사용합니다." };

  return { usable: true };
}

export function getOutlawSessionResult(state: OutlawCombatState): OutlawSessionResult {
  if (state.targetHealth <= 0) return "success";
  if (state.health <= 0) return "failed";
  return "in_progress";
}

export function getOutlawMechanicTimeLeft(state: OutlawCombatState): number | undefined {
  if (!state.activeMechanic) return undefined;
  return Math.max(0, Math.round((state.activeMechanic.triggerAt + state.activeMechanic.duration - state.elapsedSeconds) * 10) / 10);
}

function applySkillEffect(state: OutlawCombatState, skillKo: OutlawCombatSkill): OutlawCombatState {
  const spendEnergy = (amount: number) => Math.max(0, state.energy - amount);
  const gainCp = (amount: number) => Math.min(7, state.comboPoints + amount);
  const damageTarget = (amount: number) => Math.max(0, state.targetHealth - amount);

  if (skillKo === "폭풍의 칼날") {
    return { ...state, targetHealth: damageTarget(state.targets >= 2 ? 4 : 1), buffs: { ...state.buffs, bladeFlurry: 12 } };
  }

  if (skillKo === "아드레날린 촉진") {
    return {
      ...state,
      buffs: { ...state.buffs, adrenalineRush: 20 },
      cooldowns: { ...state.cooldowns, adrenalineRush: 75 },
    };
  }

  if (skillKo === "뼈주사위") {
    const nextStage = state.scenarioId === "mistake_recovery" ? 3 : Math.max(2, Math.min(4, state.rollStage + 2));
    return {
      ...state,
      comboPoints: Math.max(0, state.comboPoints - 1),
      rollStage: nextStage as OutlawCombatState["rollStage"],
      cooldowns: { ...state.cooldowns, rollTheBones: 45 },
    };
  }

  if (skillKo === "난도질") {
    return {
      ...state,
      comboPoints: 0,
      buffs: { ...state.buffs, sliceAndDice: 28 },
    };
  }

  if (skillKo === "도박의 연속(KIR)") {
    return {
      ...state,
      buffs: {
        ...state.buffs,
        bladeFlurry: state.buffs.bladeFlurry > 0 ? Math.max(state.buffs.bladeFlurry, 18) : 0,
        sliceAndDice: Math.max(state.buffs.sliceAndDice, 28),
      },
      cooldowns: { ...state.cooldowns, keepItRolling: 90 },
    };
  }

  if (skillKo === "Blade Rush") {
    return {
      ...state,
      targetHealth: damageTarget(state.targets >= 2 ? 10 : 7),
      energy: Math.min(100, state.energy + 25),
      comboPoints: gainCp(1),
      cooldowns: { ...state.cooldowns, bladeRush: 30 },
    };
  }

  if (skillKo === "사악한 일격") {
    const nextOpportunity = state.opportunityStacks === 0 ? 3 : state.opportunityStacks;
    return {
      ...state,
      targetHealth: damageTarget(state.targets >= 2 && state.buffs.bladeFlurry > 0 ? 7 : 4),
      energy: spendEnergy(45),
      comboPoints: gainCp(1),
      opportunityStacks: nextOpportunity,
    };
  }

  if (skillKo === "권총 사격") {
    return {
      ...state,
      targetHealth: damageTarget(5),
      energy: spendEnergy(35),
      comboPoints: gainCp(state.opportunityStacks >= 3 ? 2 : 1),
      opportunityStacks: 0,
    };
  }

  if (skillKo === "미간 적중") {
    return {
      ...state,
      targetHealth: damageTarget(state.targets >= 2 && state.buffs.bladeFlurry > 0 ? 16 : 11),
      comboPoints: 0,
      cooldowns: { ...state.cooldowns, betweenTheEyes: 18 },
    };
  }

  if (skillKo === "속결") {
    return { ...state, targetHealth: damageTarget(state.targets >= 2 && state.buffs.bladeFlurry > 0 ? 13 : 9), comboPoints: 0, energy: spendEnergy(25) };
  }

  if (skillKo === "광기의 학살자") {
    return {
      ...state,
      targetHealth: damageTarget(12),
      comboPoints: 0,
      cooldowns: { ...state.cooldowns, killingSpree: 90 },
    };
  }

  if (skillKo === "준비") {
    return {
      ...state,
      cooldowns: {
        ...state.cooldowns,
        preparation: 120,
        bladeRush: 0,
        betweenTheEyes: 0,
        adrenalineRush: Math.min(state.cooldowns.adrenalineRush, 5),
      },
    };
  }

  if (skillKo === "발차기") {
    return { ...state, cooldowns: { ...state.cooldowns, kick: 15 } };
  }

  if (skillKo === "교란") {
    return { ...state, cooldowns: { ...state.cooldowns, feint: 12 } };
  }

  if (skillKo === "그림자 망토") {
    return { ...state, cooldowns: { ...state.cooldowns, cloakOfShadows: 90 } };
  }

  return state;
}

function applyDynamicBattlefield(state: OutlawCombatState, previousElapsedSeconds: number, options?: OutlawCombatRunOptions): OutlawCombatState {
  if (!options?.dynamic) return state;

  const crossed = (interval: number) => Math.floor(previousElapsedSeconds / interval) !== Math.floor(state.elapsedSeconds / interval);
  let nextState = state;

  if (!nextState.activeMechanic && crossed(6)) {
    const cycle: Array<OutlawCombatState["targets"]> = [1, 2, 4, 1, 4];
    const nextTargets = cycle[Math.floor(state.elapsedSeconds / 6) % cycle.length];
    nextState = {
      ...nextState,
      targets: nextTargets,
      buffs: {
        ...nextState.buffs,
        bladeFlurry: nextTargets >= 2 ? nextState.buffs.bladeFlurry : 0,
      },
    };
  }

  if (crossed(5)) {
    const opportunityStacks = Math.floor(state.elapsedSeconds / 5) % 2 === 0 ? 6 : 3;
    nextState = { ...nextState, opportunityStacks: opportunityStacks as OutlawCombatState["opportunityStacks"] };
  }

  if (!nextState.activeMechanic && crossed(7)) {
    const mechanicIndex = Math.floor(state.elapsedSeconds / 7);
    const mechanic = createDynamicMechanic(nextState, mechanicIndex, options);
    if (!nextState.resolvedMechanicIds.includes(mechanic.id)) {
      nextState = {
        ...nextState,
        targets: mechanic.targetCount ?? nextState.targets,
        activeMechanic: mechanic,
      };
    }
  }

  return nextState;
}

function createDynamicMechanic(state: OutlawCombatState, mechanicIndex: number, options?: OutlawCombatRunOptions): OutlawCombatMechanic {
  const templates: Array<Omit<OutlawCombatMechanic, "id" | "triggerAt" | "duration"> & { key: string }> = [
    {
      key: "kick",
      titleKo: "갑작스러운 위험 시전",
      detailKo: "방금 쫄이 시전을 올렸습니다. 딜 버튼보다 차단이 먼저입니다.",
      expectedSkillKo: "발차기",
      severity: "high",
    },
    {
      key: "adds",
      titleKo: "추가 쫄 합류",
      detailKo: "대상이 늘었습니다. 광역 스위치를 다시 확인합니다.",
      expectedSkillKo: "폭풍의 칼날",
      severity: "high",
      targetCount: 4,
    },
    {
      key: "defensive",
      titleKo: "예상 밖 광역 피해",
      detailKo: "힐이 밀릴 수 있는 광역 피해입니다. 교란을 먼저 봅니다.",
      expectedSkillKo: "교란",
      severity: "high",
    },
    {
      key: "magic",
      titleKo: "마법 폭발 대상",
      detailKo: "맞으면 크게 흔들리는 마법 피해입니다. 그림자 망토로 넘깁니다.",
      expectedSkillKo: "그림자 망토",
      severity: "lethal",
    },
  ];
  const template = templates[(mechanicIndex + (state.targets >= 2 ? 1 : 0)) % templates.length];

  return {
    id: `dynamic-${state.scenarioId}-${mechanicIndex}-${template.key}`,
    triggerAt: state.elapsedSeconds,
    duration: adjustMechanicDuration(4, options),
    titleKo: template.titleKo,
    detailKo: template.detailKo,
    expectedSkillKo: template.expectedSkillKo,
    severity: template.severity,
    targetCount: template.targetCount,
  };
}

function activateNextMechanic(state: OutlawCombatState, options?: OutlawCombatRunOptions): OutlawCombatState {
  if (state.activeMechanic) return state;

  const nextMechanic = outlawScenarioMechanics[state.scenarioId].find(
    (mechanic) => state.elapsedSeconds >= mechanic.triggerAt && !state.resolvedMechanicIds.includes(mechanic.id)
  );

  if (!nextMechanic) return state;

  return {
    ...state,
    targets: nextMechanic.targetCount ?? state.targets,
    activeMechanic: {
      ...nextMechanic,
      duration: adjustMechanicDuration(nextMechanic.duration, options),
    },
  };
}

function resolveMechanicIfNeeded(state: OutlawCombatState, skillKo: OutlawCombatSkill, result: OutlawCombatLogEntry["result"]): OutlawCombatState {
  const mechanic = state.activeMechanic;
  if (!mechanic) return state;
  if (result === "wrong") return state;
  if (skillKo !== mechanic.expectedSkillKo && result !== "okay") return state;

  return {
    ...state,
    activeMechanic: undefined,
    resolvedMechanicIds: [...state.resolvedMechanicIds, mechanic.id],
    health: Math.min(100, state.health + (result === "correct" ? 3 : 0)),
  };
}

function getOutlawDifficultyProfile(options?: OutlawCombatRunOptions): OutlawCombatDifficultyProfile {
  return outlawCombatDifficultyProfiles[options?.difficulty ?? "practical"];
}

function adjustMechanicDuration(duration: number, options?: OutlawCombatRunOptions): number {
  const difficulty = getOutlawDifficultyProfile(options);
  return Math.max(2, duration + difficulty.mechanicDurationOffset);
}

function getMechanicPenalty(mechanic: OutlawCombatMechanic, difficulty: OutlawCombatDifficultyProfile): number {
  const basePenalty = mechanic.severity === "lethal" ? 35 : mechanic.severity === "high" ? 24 : 14;
  return Math.round(basePenalty * difficulty.penaltyMultiplier);
}

function getActionScore(result: OutlawCombatLogEntry["result"], difficulty: OutlawCombatDifficultyProfile): number {
  if (result === "correct") return Math.round(100 * difficulty.scoreMultiplier);
  if (result === "okay") return Math.round(35 * difficulty.scoreMultiplier);
  if (result === "unavailable") return Math.round(-30 * difficulty.penaltyMultiplier);
  return Math.round(-60 * difficulty.penaltyMultiplier);
}
