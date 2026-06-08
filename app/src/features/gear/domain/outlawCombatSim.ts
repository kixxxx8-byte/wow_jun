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
  | "준비";

export type OutlawCombatAction = {
  skillKo: OutlawCombatSkill;
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

export type OutlawCombatState = {
  scenarioId: OutlawCombatScenarioId;
  elapsedSeconds: number;
  targets: 1 | 2 | 4;
  energy: number;
  comboPoints: number;
  rollStage: 0 | 1 | 2 | 3 | 4;
  opportunityStacks: 0 | 3 | 6;
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
  };
};

export type OutlawRecommendation = {
  skillKo: OutlawCombatSkill;
  reasonKo: string;
  noteKo: string;
};

export type OutlawCombatLogEntry = {
  id: string;
  elapsedSeconds: number;
  skillKo: OutlawCombatSkill;
  result: "correct" | "okay" | "wrong";
  messageKo: string;
  expectedSkillKo: OutlawCombatSkill;
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
];

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

export function createOutlawScenarioState(scenarioId: OutlawCombatScenarioId): OutlawCombatState {
  const base: OutlawCombatState = {
    scenarioId,
    elapsedSeconds: 0,
    targets: 1,
    energy: 100,
    comboPoints: 0,
    rollStage: 0,
    opportunityStacks: 0,
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

export function advanceOutlawTime(state: OutlawCombatState, seconds: number): OutlawCombatState {
  const recovery = state.buffs.adrenalineRush > 0 ? 18 : 10;
  const nextEnergy = Math.min(100, state.energy + recovery * seconds);
  const tick = (value: number) => Math.max(0, Math.round((value - seconds) * 10) / 10);

  return {
    ...state,
    elapsedSeconds: Math.round((state.elapsedSeconds + seconds) * 10) / 10,
    energy: Math.round(nextEnergy),
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
    },
  };
}

export function applyOutlawAction(state: OutlawCombatState, action: OutlawCombatAction): OutlawCombatState {
  const withCosts = applySkillEffect(state, action.skillKo);
  return advanceOutlawTime(withCosts, 1);
}

function applySkillEffect(state: OutlawCombatState, skillKo: OutlawCombatSkill): OutlawCombatState {
  const spendEnergy = (amount: number) => Math.max(0, state.energy - amount);
  const gainCp = (amount: number) => Math.min(7, state.comboPoints + amount);

  if (skillKo === "폭풍의 칼날") {
    return { ...state, buffs: { ...state.buffs, bladeFlurry: 12 } };
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
      energy: Math.min(100, state.energy + 25),
      comboPoints: gainCp(1),
      cooldowns: { ...state.cooldowns, bladeRush: 30 },
    };
  }

  if (skillKo === "사악한 일격") {
    const nextOpportunity = state.opportunityStacks === 0 ? 3 : state.opportunityStacks;
    return {
      ...state,
      energy: spendEnergy(45),
      comboPoints: gainCp(1),
      opportunityStacks: nextOpportunity,
    };
  }

  if (skillKo === "권총 사격") {
    return {
      ...state,
      energy: spendEnergy(35),
      comboPoints: gainCp(state.opportunityStacks >= 3 ? 2 : 1),
      opportunityStacks: 0,
    };
  }

  if (skillKo === "미간 적중") {
    return {
      ...state,
      comboPoints: 0,
      cooldowns: { ...state.cooldowns, betweenTheEyes: 18 },
    };
  }

  if (skillKo === "속결") {
    return { ...state, comboPoints: 0, energy: spendEnergy(25) };
  }

  if (skillKo === "광기의 학살자") {
    return {
      ...state,
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

  return state;
}
