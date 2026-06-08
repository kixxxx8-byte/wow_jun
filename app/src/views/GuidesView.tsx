import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { MetricCard, StatusPill } from "../components/ui";
import { classGuides, guideSpecOrder, specLabel, specProfiles } from "../features/gear/domain/specGuides";
import type { ClassGuide } from "../features/gear/domain/specGuides";
import {
  advanceOutlawTime,
  applyOutlawAction,
  createOutlawScenarioState,
  getOutlawActionAvailability,
  getOutlawKeybindByCode,
  getOutlawRecommendation,
  outlawCombatActions,
  outlawDefaultKeybinds,
  outlawCombatScenarios,
  outlawScenarioMechanics,
  scoreOutlawAction,
} from "../features/gear/domain/outlawCombatSim";
import type { OutlawCombatLogEntry, OutlawCombatScenarioId } from "../features/gear/domain/outlawCombatSim";

type OutlawPracticeState = {
  targets: 1 | 2 | 4;
  comboPoints: number;
  rollStage: 0 | 1 | 2 | 3 | 4;
  adrenalineRush: "ready" | "active" | "cooldown";
  bladeFlurryActive: boolean;
  bladeRushReady: boolean;
  betweenTheEyesReady: boolean;
  preparationReady: boolean;
  killingSpreeReady: boolean;
  keepItRollingReady: boolean;
  opportunityStacks: 0 | 3 | 6;
};

type OutlawSequenceScenario = {
  labelKo: string;
  descriptionKo: string;
  steps: Array<{
    skillKo: string;
    titleKo: string;
    reasonKo: string;
  }>;
};

const initialOutlawPracticeState: OutlawPracticeState = {
  targets: 2,
  comboPoints: 0,
  rollStage: 0,
  adrenalineRush: "ready",
  bladeFlurryActive: false,
  bladeRushReady: true,
  betweenTheEyesReady: true,
  preparationReady: true,
  killingSpreeReady: true,
  keepItRollingReady: true,
  opportunityStacks: 0,
};

const outlawPracticePresets: Array<{ labelKo: string; state: OutlawPracticeState }> = [
  {
    labelKo: "광역 시작",
    state: initialOutlawPracticeState,
  },
  {
    labelKo: "단일 반복",
    state: {
      ...initialOutlawPracticeState,
      targets: 1,
      comboPoints: 4,
      rollStage: 2,
      adrenalineRush: "cooldown",
      bladeFlurryActive: false,
      bladeRushReady: false,
      betweenTheEyesReady: true,
      preparationReady: false,
      killingSpreeReady: true,
      keepItRollingReady: false,
      opportunityStacks: 3,
    },
  },
  {
    labelKo: "마무리 직전",
    state: {
      ...initialOutlawPracticeState,
      targets: 1,
      comboPoints: 6,
      rollStage: 3,
      adrenalineRush: "active",
      bladeFlurryActive: false,
      bladeRushReady: false,
      betweenTheEyesReady: true,
      preparationReady: false,
      killingSpreeReady: true,
      keepItRollingReady: true,
      opportunityStacks: 0,
    },
  },
  {
    labelKo: "준비 타이밍",
    state: {
      ...initialOutlawPracticeState,
      targets: 2,
      comboPoints: 2,
      rollStage: 2,
      adrenalineRush: "cooldown",
      bladeFlurryActive: true,
      bladeRushReady: false,
      betweenTheEyesReady: false,
      preparationReady: true,
      killingSpreeReady: false,
      keepItRollingReady: false,
      opportunityStacks: 0,
    },
  },
];

const outlawSequenceScenarios: OutlawSequenceScenario[] = [
  {
    labelKo: "광역 오프닝",
    descriptionKo: "2타겟 이상에서 광역 스위치를 켜고 첫 미간 적중까지 가는 연습입니다.",
    steps: [
      { skillKo: "폭풍의 칼날", titleKo: "광역 스위치", reasonKo: "적이 2마리 이상이면 먼저 켜야 합니다." },
      { skillKo: "아드레날린 촉진", titleKo: "기력 흐름 열기", reasonKo: "초반 회전수를 올리고 다음 쿨기 흐름을 만듭니다." },
      { skillKo: "뼈주사위", titleKo: "버프 굴리기", reasonKo: "주사위 상태를 만들어 전투 리듬을 잡습니다." },
      { skillKo: "난도질", titleKo: "기본 유지", reasonKo: "오프닝에서 기본 공격 속도 흐름을 정리합니다." },
      { skillKo: "Blade Rush", titleKo: "첫 공격 쿨기", reasonKo: "쿨마다 확인하는 공격 쿨기를 초반에 씁니다." },
      { skillKo: "사악한 일격", titleKo: "CP 만들기", reasonKo: "미간 적중을 누를 CP를 모읍니다." },
      { skillKo: "미간 적중", titleKo: "마무리 쾅", reasonKo: "높은 CP에서 핵심 마무리 일격을 씁니다." },
    ],
  },
  {
    labelKo: "단일 기본 반복",
    descriptionKo: "단일 대상에서 버프, 쿨기, 생성기, 마무리 일격 순서를 익힙니다.",
    steps: [
      { skillKo: "뼈주사위", titleKo: "주사위 확인", reasonKo: "없거나 1단계라면 먼저 굴립니다." },
      { skillKo: "아드레날린 촉진", titleKo: "쿨기 시작", reasonKo: "CP가 낮을 때 켜면 이후 흐름이 편합니다." },
      { skillKo: "Blade Rush", titleKo: "쿨기 사용", reasonKo: "준비된 공격 쿨기는 오래 들지 않습니다." },
      { skillKo: "사악한 일격", titleKo: "기본 생성", reasonKo: "조건이 없으면 기본 생성기로 CP를 모읍니다." },
      { skillKo: "권총 사격", titleKo: "기회 반응", reasonKo: "기회 중첩과 CP가 맞을 때만 누릅니다." },
      { skillKo: "미간 적중", titleKo: "핵심 마무리", reasonKo: "6CP 이상에서 가장 먼저 확인합니다." },
    ],
  },
  {
    labelKo: "준비 후 재진입",
    descriptionKo: "핵심 쿨기가 막혔을 때 준비로 다시 흐름을 여는 연습입니다.",
    steps: [
      { skillKo: "준비", titleKo: "쿨기 다시 열기", reasonKo: "AR, 미간 적중, Blade Rush가 막혔을 때 흐름을 엽니다." },
      { skillKo: "Blade Rush", titleKo: "재진입", reasonKo: "초기화된 공격 쿨기로 다시 시작합니다." },
      { skillKo: "사악한 일격", titleKo: "CP 복구", reasonKo: "마무리 일격을 위한 CP를 다시 모읍니다." },
      { skillKo: "미간 적중", titleKo: "다시 마무리", reasonKo: "높은 CP에서 핵심 마무리 일격을 씁니다." },
    ],
  },
];

const outlawSequenceSkillPool = [
  "폭풍의 칼날",
  "아드레날린 촉진",
  "뼈주사위",
  "난도질",
  "도박의 연속(KIR)",
  "Blade Rush",
  "사악한 일격",
  "권총 사격",
  "미간 적중",
  "속결",
  "광기의 학살자",
  "준비",
];

function getOutlawPracticeRecommendation(state: OutlawPracticeState) {
  if (state.targets >= 2 && !state.bladeFlurryActive) {
    return {
      skillKo: "폭풍의 칼날",
      reasonKo: "적이 2마리 이상인데 광역 스위치가 꺼져 있습니다.",
      noteKo: "광역에서는 이걸 먼저 켜야 뒤 기술들이 광역 피해로 이어집니다.",
    };
  }

  if (state.rollStage <= 1) {
    return {
      skillKo: "뼈주사위",
      reasonKo: "뼈주사위가 없거나 1단계라 다시 굴리는 상황입니다.",
      noteKo: "좋은 주사위가 딜사이클 전체를 안정시킵니다.",
    };
  }

  if (state.keepItRollingReady && state.rollStage >= 3) {
    return {
      skillKo: "도박의 연속(KIR)",
      reasonKo: "뼈주사위가 3단계 이상이라 좋은 버프를 붙잡을 타이밍입니다.",
      noteKo: "2단계 예외는 숙련자 판단입니다. 연습기는 3단계 이상을 기본으로 둡니다.",
    };
  }

  if (
    state.preparationReady &&
    state.adrenalineRush === "cooldown" &&
    !state.betweenTheEyesReady &&
    !state.bladeRushReady
  ) {
    return {
      skillKo: "준비",
      reasonKo: "아드레날린 촉진, 미간 적중, Blade Rush가 모두 막혀 있습니다.",
      noteKo: "단, 아드레날린 촉진 쿨이 곧 돌아오는 실제 상황이면 성급히 쓰지 않습니다.",
    };
  }

  if (state.adrenalineRush === "ready" && state.comboPoints <= 2) {
    return {
      skillKo: "아드레날린 촉진",
      reasonKo: "아드레날린 촉진이 준비됐고 현재 CP가 낮습니다.",
      noteKo: "무법은 큰 한 방보다 쿨기를 자주 돌리는 흐름이 중요합니다.",
    };
  }

  if (state.bladeRushReady) {
    return {
      skillKo: "Blade Rush",
      reasonKo: "Blade Rush가 준비되어 있어 쿨마다 확인하는 구간입니다.",
      noteKo: "광역이면 폭풍의 칼날이 켜진 뒤 쓰는지 먼저 확인합니다.",
    };
  }

  if (state.betweenTheEyesReady && state.comboPoints >= 6) {
    return {
      skillKo: "미간 적중",
      reasonKo: "6CP 이상이고 미간 적중이 준비되어 있습니다.",
      noteKo: "초보 연습에서는 5CP에 급하게 쓰지 않고 높은 CP에서 쓰는 습관을 둡니다.",
    };
  }

  if (state.killingSpreeReady && state.comboPoints >= 5) {
    return {
      skillKo: "광기의 학살자",
      reasonKo: "광기의 학살자가 준비됐고 5CP 이상입니다.",
      noteKo: "이동/위험 패턴이 겹치는 실제 던전에서는 안전한 타이밍도 같이 봅니다.",
    };
  }

  if (state.comboPoints >= 6) {
    return {
      skillKo: "속결",
      reasonKo: "마무리할 CP가 충분하지만 미간 적중 우선 조건이 없습니다.",
      noteKo: "미간 적중이 쿨이면 속결로 CP를 넘치지 않게 비웁니다.",
    };
  }

  if (state.opportunityStacks === 6 || (state.opportunityStacks === 3 && state.comboPoints >= 1 && state.comboPoints <= 3)) {
    return {
      skillKo: "권총 사격",
      reasonKo: "기회 중첩과 현재 CP가 권총 사격 조건에 맞습니다.",
      noteKo: "반짝인다고 무조건 누르지 말고 현재 CP를 같이 봅니다.",
    };
  }

  return {
    skillKo: "사악한 일격",
    reasonKo: "위 조건이 모두 아니라면 기본 생성기로 CP를 모읍니다.",
    noteKo: "CP가 6 이상이 되면 생성기를 멈추고 마무리 일격을 확인합니다.",
  };
}

function formatCombatSeconds(value: number) {
  if (value <= 0) return "준비";
  return `${Math.ceil(value)}초`;
}

function OutlawCombatSimulator() {
  const [scenarioId, setScenarioId] = useState<OutlawCombatScenarioId>("aoe_pull");
  const [combatState, setCombatState] = useState(() => createOutlawScenarioState("aoe_pull"));
  const [hintMode, setHintMode] = useState(true);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<OutlawCombatLogEntry[]>([]);
  const [lastFeedback, setLastFeedback] = useState("스킬 버튼을 눌러보세요. 틀려도 상태는 진행되고, 왜 손해인지 알려줍니다.");
  const [lastPromptAt, setLastPromptAt] = useState(() => Date.now());
  const recommendation = getOutlawRecommendation(combatState);
  const currentScenario = outlawCombatScenarios.find((scenario) => scenario.id === scenarioId);
  const upcomingMechanic = outlawScenarioMechanics[scenarioId].find(
    (mechanic) => mechanic.triggerAt > combatState.elapsedSeconds && !combatState.resolvedMechanicIds.includes(mechanic.id)
  );

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setCombatState((prev) => advanceOutlawTime(prev, 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    setLastPromptAt(Date.now());
  }, [recommendation.skillKo, combatState.activeMechanic?.id]);

  useEffect(() => {
    if (!keyboardMode) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLInputElement | HTMLElement | null;
      if (target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
      if (target?.tagName === "INPUT" && (target as HTMLInputElement).type !== "checkbox") return;
      const keybind = getOutlawKeybindByCode(event.code, event.shiftKey);
      if (!keybind) return;
      event.preventDefault();
      pressAction(keybind.skillKo, keybind.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardMode, combatState, lastPromptAt]);

  const selectScenario = (nextScenarioId: OutlawCombatScenarioId) => {
    setRunning(false);
    setScenarioId(nextScenarioId);
    setCombatState(createOutlawScenarioState(nextScenarioId));
    setLogs([]);
    setLastFeedback("새 상황입니다. 지금 누를 버튼을 먼저 판단해보세요.");
  };

  const resetScenario = () => {
    setRunning(false);
    setCombatState(createOutlawScenarioState(scenarioId));
    setLogs([]);
    setLastFeedback("처음 상태로 되돌렸습니다.");
  };

  function pressAction(skillKo: OutlawCombatLogEntry["skillKo"], inputKey?: string) {
    const result = scoreOutlawAction(combatState, { skillKo });
    const nextState = applyOutlawAction(combatState, { skillKo });
    const reactionMs = Math.max(0, Date.now() - lastPromptAt);
    setCombatState(nextState);
    setLastFeedback(inputKey ? `${inputKey} 입력 · ${skillKo} · ${Math.round(reactionMs / 100) / 10}초 반응 · ${result.messageKo}` : result.messageKo);
    setLogs((prev) => [
      {
        ...result,
        id: `${combatState.elapsedSeconds}-${skillKo}-${prev.length}`,
        elapsedSeconds: combatState.elapsedSeconds,
        inputKey,
        reactionMs,
      },
      ...prev,
    ].slice(0, 8));
  }

  const statusChips = [
    `시간 ${combatState.elapsedSeconds.toFixed(0)}초`,
    `대상 ${combatState.targets}마리`,
    `기력 ${combatState.energy}`,
    `CP ${combatState.comboPoints}`,
    `체력 ${combatState.health}`,
    `실수 ${combatState.mistakes}`,
    `주사위 ${combatState.rollStage || "없음"}`,
    `기회 ${combatState.opportunityStacks || "없음"}`,
  ];

  const buffChips = [
    ["폭풍의 칼날", combatState.buffs.bladeFlurry],
    ["난도질", combatState.buffs.sliceAndDice],
    ["아드레날린 촉진", combatState.buffs.adrenalineRush],
  ] as const;

  const cooldownChips = [
    ["Blade Rush", combatState.cooldowns.bladeRush],
    ["미간 적중", combatState.cooldowns.betweenTheEyes],
    ["준비", combatState.cooldowns.preparation],
    ["광기의 학살자", combatState.cooldowns.killingSpree],
    ["도박의 연속", combatState.cooldowns.keepItRolling],
    ["발차기", combatState.cooldowns.kick],
    ["교란", combatState.cooldowns.feint],
    ["그림자 망토", combatState.cooldowns.cloakOfShadows],
  ] as const;

  return (
    <section className="outlaw-combat-sim" aria-label="무법 실전 허수아비">
      <div className="outlaw-combat-head">
        <div>
          <h3>무법 실전 허수아비</h3>
          <p>정확한 DPS 심크가 아니라, 상황에 맞게 지금 뭘 눌러야 하는지 익히는 추천 우선순위 훈련용입니다.</p>
        </div>
        <label className="outlaw-hint-toggle">
          <input type="checkbox" checked={hintMode} onChange={(event) => setHintMode(event.target.checked)} />
          힌트 표시
        </label>
        <label className="outlaw-hint-toggle">
          <input type="checkbox" checked={keyboardMode} onChange={(event) => setKeyboardMode(event.target.checked)} />
          키보드 입력
        </label>
      </div>

      <div className="outlaw-combat-session">
        <div>
          <b>{currentScenario?.labelKo}</b>
          <span>{currentScenario?.descriptionKo}</span>
        </div>
        <div className="outlaw-combat-session-actions">
          <button type="button" onClick={() => setRunning((prev) => !prev)}>{running ? "정지" : "전투 시작"}</button>
          <button type="button" onClick={() => setCombatState((prev) => advanceOutlawTime(prev, 1))}>1초 진행</button>
        </div>
      </div>

      <div className="outlaw-preset-row" aria-label="무법 실전 허수아비 시나리오">
        {outlawCombatScenarios.map((scenario) => (
          <button key={scenario.id} type="button" className={scenario.id === scenarioId ? "active" : ""} onClick={() => selectScenario(scenario.id)}>
            {scenario.labelKo}
          </button>
        ))}
        <button type="button" onClick={resetScenario}>처음부터</button>
      </div>

      <div className="outlaw-combat-layout">
        <section className="outlaw-combat-main">
          <div className={combatState.activeMechanic ? "outlaw-mechanic-alert active" : "outlaw-mechanic-alert"}>
            {combatState.activeMechanic ? (
              <>
                <span>지금 위험 패턴</span>
                <b>{combatState.activeMechanic.titleKo}</b>
                <p>{combatState.activeMechanic.detailKo}</p>
                <small>{combatState.activeMechanic.expectedSkillKo}로 처리</small>
              </>
            ) : (
              <>
                <span>다음 위험 패턴</span>
                <b>{upcomingMechanic ? `${Math.max(0, Math.ceil(upcomingMechanic.triggerAt - combatState.elapsedSeconds))}초 후 · ${upcomingMechanic.titleKo}` : "현재 예정 없음"}</b>
                <p>{upcomingMechanic ? upcomingMechanic.detailKo : "지금은 딜 사이클과 버프 유지에 집중합니다."}</p>
              </>
            )}
          </div>

          <div className="outlaw-next-skill" aria-label="무법 실전 허수아비 추천 스킬">
            <span>지금 누를 버튼</span>
            <strong>{recommendation.skillKo}</strong>
            <p>{recommendation.reasonKo}</p>
            <small>{recommendation.noteKo}</small>
          </div>

          <div className="outlaw-combat-chip-grid" aria-label="무법 현재 상태">
            {statusChips.map((chip) => <span key={chip}>{chip}</span>)}
          </div>

          <div className="outlaw-sim-pad" aria-label="무법 실전 허수아비 스킬 버튼">
            {outlawCombatActions.map((action) => {
              const availability = getOutlawActionAvailability(combatState, action);
              return (
                <button
                  key={action.skillKo}
                  type="button"
                  className={hintMode && action.skillKo === recommendation.skillKo ? "recommended" : ""}
                  disabled={!availability.usable}
                  title={availability.reasonKo}
                  onClick={() => pressAction(action.skillKo)}
                >
                  <span>{action.skillKo}</span>
                  {!availability.usable ? <small>{availability.reasonKo}</small> : null}
                </button>
              );
            })}
          </div>

          <div className="outlaw-combat-feedback" aria-live="polite">
            {lastFeedback}
          </div>
        </section>

        <aside className="outlaw-combat-side">
          <div className="outlaw-combat-score">
            <b>세션 결과</b>
            <strong>{combatState.score}점</strong>
            <span>연속 정답 {combatState.streak}회</span>
          </div>
          <div>
            <b>버프</b>
            <div className="outlaw-combat-mini-grid">
              {buffChips.map(([label, value]) => <span key={label}>{label}: {formatCombatSeconds(value)}</span>)}
            </div>
          </div>
          <div>
            <b>쿨다운</b>
            <div className="outlaw-combat-mini-grid">
              {cooldownChips.map(([label, value]) => <span key={label}>{label}: {formatCombatSeconds(value)}</span>)}
            </div>
          </div>
        </aside>
      </div>

      <details className="outlaw-combat-log">
        <summary>전투 로그 보기</summary>
        {logs.length === 0 ? (
          <p>아직 누른 버튼이 없습니다. 추천 버튼을 보거나 힌트를 끄고 직접 눌러보세요.</p>
        ) : (
          <ol>
            {logs.map((log) => (
              <li key={log.id} className={log.result}>
                <b>{log.elapsedSeconds.toFixed(0)}초 · {log.inputKey ? `${log.inputKey} · ` : ""}{log.skillKo}</b>
                <span>{log.messageKo}</span>
                {log.reactionMs !== undefined ? <small>반응 {Math.round(log.reactionMs / 100) / 10}초</small> : null}
              </li>
            ))}
          </ol>
        )}
      </details>

      <div className="outlaw-keyboard-map" aria-label="무법 실전 허수아비 키맵">
        <b>기본 키맵</b>
        <div>
          {outlawDefaultKeybinds.map((keybind) => (
            <span key={keybind.eventCode}>
              <kbd>{keybind.key}</kbd>
              {keybind.skillKo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutlawSequenceTrainer() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState("첫 버튼부터 눌러보세요.");
  const scenario = outlawSequenceScenarios[scenarioIndex];
  const currentStep = scenario.steps[stepIndex];
  const completed = stepIndex >= scenario.steps.length;

  const selectScenario = (nextIndex: number) => {
    setScenarioIndex(nextIndex);
    setStepIndex(0);
    setFeedback("첫 버튼부터 눌러보세요.");
  };

  const resetScenario = () => {
    setStepIndex(0);
    setFeedback("처음부터 다시 눌러봅니다.");
  };

  const pressSkill = (skillKo: string) => {
    if (completed) {
      setFeedback("이미 완료했습니다. 다시 연습하려면 처음부터 버튼을 누르세요.");
      return;
    }

    if (skillKo !== currentStep.skillKo) {
      setFeedback(`지금은 ${currentStep.skillKo} 차례입니다. 이유: ${currentStep.reasonKo}`);
      return;
    }

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    setFeedback(nextIndex >= scenario.steps.length ? "완료. 이 흐름을 손에 익히면 됩니다." : `좋습니다. 다음은 ${scenario.steps[nextIndex].skillKo}입니다.`);
  };

  return (
    <section className="outlaw-sequence-trainer" aria-label="무법 도적 순차 연습">
      <div className="outlaw-sequence-head">
        <div>
          <h3>순서대로 눌러보기</h3>
          <p>{scenario.descriptionKo}</p>
        </div>
        <button type="button" onClick={resetScenario}>처음부터</button>
      </div>

      <div className="outlaw-preset-row">
        {outlawSequenceScenarios.map((item, index) => (
          <button key={item.labelKo} type="button" className={index === scenarioIndex ? "active" : ""} onClick={() => selectScenario(index)}>
            {item.labelKo}
          </button>
        ))}
      </div>

      <div className="outlaw-sequence-progress">
        {scenario.steps.map((step, index) => (
          <div key={`${step.skillKo}-${index}`} className={index < stepIndex ? "done" : index === stepIndex && !completed ? "current" : ""}>
            <span>{index + 1}</span>
            <b>{step.skillKo}</b>
            <small>{step.titleKo}</small>
          </div>
        ))}
      </div>

      <div className="outlaw-sequence-pad" aria-label="무법 도적 연습 스킬 버튼">
        {outlawSequenceSkillPool.map((skill) => (
          <button key={skill} type="button" onClick={() => pressSkill(skill)}>
            {skill}
          </button>
        ))}
      </div>

      <div className={completed ? "outlaw-sequence-feedback done" : "outlaw-sequence-feedback"}>
        <b>{completed ? "연습 완료" : currentStep ? `현재 단계: ${currentStep.titleKo}` : "연습 완료"}</b>
        <span>{feedback}</span>
      </div>
    </section>
  );
}

function OutlawCycleTrainer() {
  const [state, setState] = useState<OutlawPracticeState>(initialOutlawPracticeState);
  const recommendation = getOutlawPracticeRecommendation(state);

  const setPartialState = (partial: Partial<OutlawPracticeState>) => setState((prev) => ({ ...prev, ...partial }));

  return (
    <article className="panel guide-card outlaw-section-card outlaw-trainer-card">
      <p className="eyebrow">딜사이클 연습용</p>
      <h2>무법 연습장</h2>
      <p>실전 허수아비로 먼저 상황 판단을 익히고, 아래에서 손순서와 세부 조건을 보조로 확인합니다.</p>

      <OutlawCombatSimulator />
      <OutlawSequenceTrainer />

      <div className="outlaw-trainer-layout">
        <section className="outlaw-trainer-controls">
          <h3>상황 판단 보조</h3>
          <div className="outlaw-preset-row">
            {outlawPracticePresets.map((preset) => (
              <button key={preset.labelKo} type="button" onClick={() => setState(preset.state)}>
                {preset.labelKo}
              </button>
            ))}
          </div>

          <div className="outlaw-control-grid">
            <label>
              대상 수
              <select value={state.targets} onChange={(event) => setPartialState({ targets: Number(event.target.value) as OutlawPracticeState["targets"] })}>
                <option value={1}>1마리</option>
                <option value={2}>2마리</option>
                <option value={4}>4마리 이상</option>
              </select>
            </label>

            <label>
              현재 CP
              <select value={state.comboPoints} onChange={(event) => setPartialState({ comboPoints: Number(event.target.value) })}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((point) => <option key={point} value={point}>{point} CP</option>)}
              </select>
            </label>

            <label>
              뼈주사위 단계
              <select value={state.rollStage} onChange={(event) => setPartialState({ rollStage: Number(event.target.value) as OutlawPracticeState["rollStage"] })}>
                <option value={0}>없음</option>
                <option value={1}>1단계</option>
                <option value={2}>2단계</option>
                <option value={3}>3단계</option>
                <option value={4}>4단계</option>
              </select>
            </label>

            <label>
              기회 중첩
              <select value={state.opportunityStacks} onChange={(event) => setPartialState({ opportunityStacks: Number(event.target.value) as OutlawPracticeState["opportunityStacks"] })}>
                <option value={0}>없음</option>
                <option value={3}>3중첩</option>
                <option value={6}>6중첩</option>
              </select>
            </label>

            <label>
              아드레날린 촉진
              <select value={state.adrenalineRush} onChange={(event) => setPartialState({ adrenalineRush: event.target.value as OutlawPracticeState["adrenalineRush"] })}>
                <option value="ready">준비됨</option>
                <option value="active">켜짐</option>
                <option value="cooldown">쿨타임</option>
              </select>
            </label>
          </div>

          <div className="outlaw-toggle-grid">
            {[
              ["bladeFlurryActive", "폭풍의 칼날 켜짐"],
              ["bladeRushReady", "Blade Rush 준비"],
              ["betweenTheEyesReady", "미간 적중 준비"],
              ["preparationReady", "준비 사용 가능"],
              ["killingSpreeReady", "광기의 학살자 준비"],
              ["keepItRollingReady", "KIR 사용 가능"],
            ].map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(state[key as keyof OutlawPracticeState])}
                  onChange={(event) => setPartialState({ [key]: event.target.checked } as Partial<OutlawPracticeState>)}
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="outlaw-trainer-result" aria-label="무법 도적 다음 추천 스킬">
          <span>다음 버튼</span>
          <strong>{recommendation.skillKo}</strong>
          <p>{recommendation.reasonKo}</p>
          <small>{recommendation.noteKo}</small>
        </section>
      </div>

      <div className="outlaw-trainer-notes">
        <b>연습기 기준</b>
        <span>실제 전투의 이동, 보스 패턴, 장신구, 특성 차이는 반영하지 않습니다. 대신 CP 넘침 방지, 주요 쿨기 우선순위, 권총 사격 조건, 준비 타이밍 공부용으로 씁니다.</span>
      </div>
    </article>
  );
}

function OutlawPracticalGuide({ guide }: { guide: ClassGuide }) {
  if (!guide.simpleCycleGuide || !guide.coreSummary || !guide.deepGuide || !guide.practiceGuide || !guide.keybindGuide || !guide.masteryGuide || !guide.visualGuides) return null;

  return (
    <>
      <OutlawCycleTrainer />

      <article className="panel guide-card outlaw-section-card outlaw-simple-cycle-card">
        <p className="eyebrow">입문용 빠른 손순서</p>
        <h2>{guide.simpleCycleGuide.titleKo}</h2>
        <p>{guide.simpleCycleGuide.subtitleKo}</p>
        <div className="outlaw-simple-cycle-grid">
          {guide.simpleCycleGuide.steps.map((step, index) => (
            <section key={step.titleKo} className="outlaw-simple-step">
              <span className="outlaw-simple-number">{index + 1}</span>
              <div>
                <h3>{step.titleKo}</h3>
                <p>{step.bodyKo}</p>
                <div className="outlaw-skill-chip-row" aria-label={`${step.titleKo} 스킬 목록`}>
                  {step.skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
                {step.cautionKo ? <b>{step.cautionKo}</b> : null}
              </div>
            </section>
          ))}
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">1. 핵심요약</p>
        <h2>{guide.coreSummary.headlineKo}</h2>
        <div className="outlaw-summary-grid">
          {guide.coreSummary.cards.map((card) => (
            <section key={card.titleKo} className={`outlaw-summary-card ${card.tone ? `tone-${card.tone}` : ""}`}>
              <b>{card.titleKo}</b>
              <span>{card.bodyKo}</span>
            </section>
          ))}
        </div>
        <div className="outlaw-never-box">
          <h3>절대 하지 말 것</h3>
          <ul className="outlaw-never-list">
            {guide.coreSummary.neverDo.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">시각 자료</p>
        <h2>우선순위 사다리</h2>
        <div className="outlaw-visual-row">
          <div className="outlaw-ladder" aria-label="무법 도적 우선순위 사다리">
            {guide.visualGuides.priorityLadder.map((item, index) => (
              <div key={item.labelKo} className="outlaw-ladder-step">
                <span>{index + 1}</span>
                <b>{item.labelKo}</b>
                <small>{item.detailKo}</small>
              </div>
            ))}
          </div>
          <div className="outlaw-timeline" aria-label="무법 도적 오프닝 타임라인">
            {guide.visualGuides.openerTimeline.map((item) => (
              <div key={item.labelKo} className="outlaw-timeline-item">
                <b>{item.labelKo}</b>
                <span>{item.detailKo}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">2. 정밀 가이드</p>
        <h2>무엇을, 언제, 왜 누르는가</h2>
        <div className="outlaw-deep-grid">
          {guide.deepGuide.map((item) => (
            <section key={item.titleKo} className="outlaw-deep-card">
              <h3>{item.titleKo}</h3>
              <dl>
                <div>
                  <dt>무엇</dt>
                  <dd>{item.whatKo}</dd>
                </div>
                <div>
                  <dt>언제</dt>
                  <dd>{item.whenKo}</dd>
                </div>
                <div>
                  <dt>왜</dt>
                  <dd>{item.whyKo}</dd>
                </div>
                <div>
                  <dt>실수</dt>
                  <dd>{item.mistakeKo}</dd>
                </div>
              </dl>
              {item.exampleKo ? <p className="outlaw-example">{item.exampleKo}</p> : null}
            </section>
          ))}
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">3. 이것만 따라해라 실전 편</p>
        <h2>전투 중 판단 순서</h2>
        <p>{guide.practiceGuide.summaryKo}</p>
        <div className="outlaw-practice-grid">
          {guide.practiceGuide.phases.map((phase, index) => (
            <section key={phase.titleKo}>
              <span>{index + 1}</span>
              <div>
                <h3>{phase.titleKo}</h3>
                {phase.cueKo ? <b>{phase.cueKo}</b> : null}
                <ol>
                  {phase.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </section>
          ))}
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">4. 스킬창/키bind 배치 가이드</p>
        <h2>손 이동을 줄이는 기준 배치</h2>
        <p>{guide.keybindGuide.summaryKo}</p>
        <div className="outlaw-keybind-layout" aria-label="무법 도적 추천 스킬창 배치 다이어그램">
          {guide.visualGuides.keybindLayout.map((item) => (
            <div key={`${item.key}-${item.labelKo}`} className={`outlaw-keycap group-${item.groupKo}`}>
              <b>{item.key}</b>
              <span>{item.labelKo}</span>
              <small>{item.groupKo}</small>
            </div>
          ))}
        </div>
        <div className="outlaw-keybind-body">
          <section className="outlaw-keybind-rules">
            <h3>배치 원칙</h3>
            <ul>
              {guide.keybindGuide.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
            <strong>{guide.keybindGuide.clickWarningKo}</strong>
            <p>{guide.keybindGuide.mouseNoteKo}</p>
          </section>
          <div className="outlaw-keybind-grid">
            {guide.keybindGuide.groups.map((group) => (
              <section key={group.titleKo}>
                <h3>{group.titleKo}</h3>
                <div>
                  {group.bindings.map((binding) => (
                    <article key={`${binding.key}-${binding.skillKo}`} className={`outlaw-binding ${binding.priority ?? "core"}`}>
                      <b>{binding.key}</b>
                      <span>{binding.skillKo}</span>
                      <small>{binding.reasonKo}</small>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>

      <article className="panel guide-card outlaw-section-card">
        <p className="eyebrow">5. 숙련자를 위한 완벽함으로 가는 법</p>
        <h2>기본을 망치지 않는 미세 최적화</h2>
        <div className="outlaw-master-row">
          <div className="outlaw-flow" aria-label="도박의 연속 KIR 판단 트리">
            <h3>KIR 판단 트리</h3>
            {guide.visualGuides.kirTree.map((item) => (
              <div key={item.conditionKo} className={item.tone === "warn" ? "warn" : "ok"}>
                <b>{item.conditionKo}</b>
                <span>{item.actionKo}</span>
              </div>
            ))}
          </div>
          <div className="outlaw-flow" aria-label="Supercharger 미간 적중 보류 다이어그램">
            <h3>Supercharger-BtE 보류</h3>
            {guide.visualGuides.superchargerFlow.map((item) => (
              <div key={item.conditionKo}>
                <b>{item.conditionKo}</b>
                <span>{item.actionKo}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="outlaw-mastery-grid">
          {guide.masteryGuide.map((item) => (
            <section key={item.titleKo}>
              <h3>{item.titleKo}</h3>
              <p>{item.goalKo}</p>
              <ul>
                {item.checks.map((check) => <li key={check}>{check}</li>)}
              </ul>
              {item.warningKo ? <small>{item.warningKo}</small> : null}
            </section>
          ))}
        </div>
      </article>
    </>
  );
}

export default function GuidesView() {
  const [activeSpec, setActiveSpec] = useState(guideSpecOrder[0]);
  const profile = specProfiles[activeSpec];
  const guide = classGuides[activeSpec];

  return (
    <div className="view-stack guide-shell">
      <section className="panel guide-hero">
        <div>
          <p className="eyebrow">직업 가이드</p>
          <h1>한밤 시즌1 전문화 가이드</h1>
          <p>암살, 무법, 잠행, Devourer를 같은 구조로 정리했습니다. Wowhead 가이드는 기준 출처로 쓰고, 앱에서는 장비 점검에 필요한 핵심만 한국어 실전 요약으로 보여줍니다.</p>
        </div>
        <StatusPill tone="ok">4전문화 지원</StatusPill>
      </section>

      <section className="panel guide-tabs-panel">
        <div className="spec-switcher" aria-label="전문화 선택">
          {guideSpecOrder.map((specKey) => {
            const row = specProfiles[specKey];
            return (
              <button key={specKey} type="button" className={activeSpec === specKey ? "spec-pill active" : "spec-pill"} onClick={() => setActiveSpec(specKey)}>
                {row.specNameKo}
                <span>{row.classNameKo} · 한밤 시즌1</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="guide-grid">
        <article className="panel guide-card lead">
          <p className="eyebrow">{specLabel(profile)}</p>
          <h2>{guide.heroTitleKo}</h2>
          <p>{guide.heroSummaryKo}</p>
          <div className="guide-metrics">
            {guide.metrics.map((metric) => <MetricCard key={metric.title} title={metric.title} value={metric.value} detail={metric.detail} />)}
          </div>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">스탯</p>
          <h2>스탯 우선순위</h2>
          <div className="stat-priority">{profile.statPriorityTextKo}</div>
          <ul className="guide-list">
            {profile.statNotes.map((item) => <li key={item}>{item}</li>)}
            {profile.specialRules.hasteBreakpointNote ? <li>{profile.specialRules.hasteBreakpointNote}</li> : null}
            <li>최종 판단은 Raidbots Top Gear로 자기 캐릭터 기준 시뮬레이션을 확인하는 것이 가장 정확합니다.</li>
          </ul>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">로테이션</p>
          <h2>기본 로테이션</h2>
          <ol className="guide-steps">
            {guide.rotation.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>

        <OutlawPracticalGuide guide={guide} />

        <article className="panel guide-card">
          <p className="eyebrow">장비</p>
          <h2>장비 점검 포인트</h2>
          <ul className="guide-list">
            {guide.gearChecks.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">주의</p>
          <h2>주의사항</h2>
          <ul className="guide-list">
            {guide.cautions.map((item) => <li key={item}>{item}</li>)}
            <li>이 가이드는 장비 점검용 요약이며 Wowhead 원문을 대량 복제하지 않습니다.</li>
          </ul>
        </article>

        <article className="panel guide-card source-guide-card">
          <ShieldCheck size={18} />
          <div>
            <p className="eyebrow">출처</p>
            <h2>{profile.source.name} 기준</h2>
            <p>{profile.disclaimer} 실제 DPS 최종 비교는 SimulationCraft 또는 Raidbots 확인이 필요합니다.</p>
            <a className="link-btn" href={profile.source.url} target="_blank" rel="noreferrer">Wowhead 가이드 보기</a>
          </div>
        </article>
      </section>
    </div>
  );
}
