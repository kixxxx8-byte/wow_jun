import { Brain, Check, Clock3, History, Loader2, Sparkles } from "lucide-react";
import { EmptyState, Field, StatusPill } from "../components/ui";
import { itemIcon, targets } from "../domain/planning";
import type { AiPlan, AiPreferences, Target, TodaySnapshot, View } from "../types";

const preferenceLabels = {
  timeBudget: { "30m": "30분", "60m": "1시간", "120m": "2시간", custom: "직접 판단" },
  goal: { gear: "장비 파밍", score: "점수", light: "가볍게", push: "빡세게", maintenance: "정비" },
  energy: { low: "낮음", normal: "보통", high: "높음" },
  party: { solo: "솔로", premade: "고정/지인", either: "상관없음" },
  risk: { safe: "안전", balanced: "균형", aggressive: "공격적" },
};

function TargetItemIcon({ target, className = "", placeholder = "목표" }: { target?: Target | null; className?: string; placeholder?: string }) {
  const icon = target ? itemIcon({ icon: target.icon }) : "";
  return icon ? (
    <span className={`item-icon ${className}`.trim()}><img src={icon} alt="" loading="lazy" /></span>
  ) : (
    <span className={`item-icon placeholder ${className}`.trim()}>{placeholder}</span>
  );
}

function targetById(id?: string | null) {
  if (!id) return null;
  const target = targets.find((row) => row.id === id) || null;
  return target?.itemId ? null : target;
}

function isReferenceBisText(...values: Array<unknown>) {
  const text = values.filter(Boolean).join(" ");
  return /BIS 교체 후보|참고 BIS|시즌 BIS|wowhead-bis|Wowhead 암살 도적 BIS/i.test(text);
}

function isReferenceBisAction(action: AiPlan["actions"][number]) {
  return isReferenceBisText(action.targetId, action.title, action.reason, ...action.evidence);
}

function ActionCard({
  action,
  onDone,
  onJump,
  disabled,
}: {
  action: AiPlan["actions"][number];
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
  disabled: boolean;
}) {
  const targetView: View = action.type === "item" || action.type === "maintenance" ? "gear" : action.type === "dungeon" ? "dungeons" : "today";
  const target = targetById(action.targetId);
  return (
    <article className={`ai-action ${action.type} ${target ? "with-icon" : ""}`}>
      <span className="rank">{action.rank}</span>
      {target ? <TargetItemIcon target={target} className="ai-action-icon" /> : null}
      <div>
        <div className="line">
          <b>{action.title}</b>
          <small>{action.estimatedTime}</small>
        </div>
        <p>{action.reason}</p>
        <details className="evidence-details">
          <summary>근거</summary>
          <div className="chip-row">
            {action.evidence.slice(0, 6).map((item) => <span key={item}>{item}</span>)}
          </div>
        </details>
      </div>
      <div className="row-actions">
        {action.type === "dungeon" || action.type === "item" || action.type === "maintenance" ? (
          <button type="button" onClick={() => onJump(targetView)}>보기</button>
        ) : null}
        <button type="button" disabled={disabled || !action.targetId} onClick={() => onDone(action.targetId)}>
          <Check size={15} /> 완료
        </button>
      </div>
    </article>
  );
}

function PreferencePanel({
  preferences,
  snapshot,
  onChange,
  onGenerate,
  loading,
  disabled,
}: {
  preferences: AiPreferences;
  snapshot: TodaySnapshot;
  onChange: (preferences: AiPreferences) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const setValue = <K extends keyof AiPreferences>(key: K, value: AiPreferences[K]) => {
    if (disabled) return;
    onChange({ ...preferences, [key]: value });
  };
  const toggleDungeon = (name: string, list: "preferredDungeons" | "avoidedDungeons") => {
    if (disabled) return;
    const preferred = list === "preferredDungeons"
      ? preferences.preferredDungeons.includes(name) ? preferences.preferredDungeons.filter((item) => item !== name) : [...preferences.preferredDungeons, name]
      : preferences.preferredDungeons.filter((item) => item !== name);
    const avoided = list === "avoidedDungeons"
      ? preferences.avoidedDungeons.includes(name) ? preferences.avoidedDungeons.filter((item) => item !== name) : [...preferences.avoidedDungeons, name]
      : preferences.avoidedDungeons.filter((item) => item !== name);
    onChange({ ...preferences, preferredDungeons: preferred, avoidedDungeons: avoided });
  };

  return (
    <section className="panel input-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">조건</p>
          <h2>AI 판단 조건</h2>
        </div>
        <StatusPill tone={preferences.useWeb ? "warn" : "ok"}>{preferences.useWeb ? "최신 검색 사용" : "내 데이터 기준"}</StatusPill>
      </div>
      <div className="preference-quick">
        <span>{preferenceLabels.timeBudget[preferences.timeBudget]}</span>
        <span>{preferenceLabels.goal[preferences.goal]}</span>
        <span>{preferenceLabels.energy[preferences.energy]}</span>
        <span>{preferences.useWeb ? "최신 메타 반영" : "저장 데이터 기준"}</span>
      </div>
      <details className="advanced-settings">
        <summary>고급 조건 조정</summary>
        <div className="field-grid">
          <Field label="시간">
            <select value={preferences.timeBudget} onChange={(event) => setValue("timeBudget", event.target.value as AiPreferences["timeBudget"])} disabled={disabled}>
              {Object.entries(preferenceLabels.timeBudget).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="목표">
            <select value={preferences.goal} onChange={(event) => setValue("goal", event.target.value as AiPreferences["goal"])} disabled={disabled}>
              {Object.entries(preferenceLabels.goal).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="피로도">
            <select value={preferences.energy} onChange={(event) => setValue("energy", event.target.value as AiPreferences["energy"])} disabled={disabled}>
              {Object.entries(preferenceLabels.energy).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="파티">
            <select value={preferences.party} onChange={(event) => setValue("party", event.target.value as AiPreferences["party"])} disabled={disabled}>
              {Object.entries(preferenceLabels.party).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="위험 선호">
            <select value={preferences.risk} onChange={(event) => setValue("risk", event.target.value as AiPreferences["risk"])} disabled={disabled}>
              {Object.entries(preferenceLabels.risk).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <label className="toggle-field">
            <input type="checkbox" checked={preferences.useWeb} onChange={(event) => setValue("useWeb", event.target.checked)} disabled={disabled} />
            <span>최신 메타 반영</span>
          </label>
        </div>
        <div className="dungeon-choices">
          <span>던전 선호/제외</span>
          {snapshot.dungeonRecommendations.map((dungeon) => (
            <div className="choice-row" key={dungeon.id}>
              <b>{dungeon.short}</b>
              <button type="button" className={preferences.preferredDungeons.includes(dungeon.name) ? "active" : ""} onClick={() => toggleDungeon(dungeon.name, "preferredDungeons")} disabled={disabled}>선호</button>
              <button type="button" className={preferences.avoidedDungeons.includes(dungeon.name) ? "danger active" : "danger"} onClick={() => toggleDungeon(dungeon.name, "avoidedDungeons")} disabled={disabled}>제외</button>
            </div>
          ))}
        </div>
        <Field label="자유 메모">
          <textarea
            value={preferences.freeNote}
            placeholder="예: 오늘은 1시간만 가능, 점수보다 장신구 우선, 피곤해서 안전하게"
            onChange={(event) => setValue("freeNote", event.target.value)}
            disabled={disabled}
          />
        </Field>
      </details>
      <button className="primary-btn wide" type="button" onClick={onGenerate} disabled={loading}>
        {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        {disabled ? "로그인하고 AI 판단 받기" : "오늘의 최적 답 받기"}
      </button>
    </section>
  );
}

function PlanResult({
  plan,
  fallback,
  error,
  onDone,
  onJump,
  disabled,
  stale,
}: {
  plan: AiPlan;
  fallback: boolean;
  error: string;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
  disabled: boolean;
  stale?: boolean;
}) {
  const visibleActions = plan.actions.filter((action) => !isReferenceBisAction(action));
  const timePlans = {
    short: plan.timePlans.short.filter((item) => !isReferenceBisText(item)),
    normal: plan.timePlans.normal.filter((item) => !isReferenceBisText(item)),
    long: plan.timePlans.long.filter((item) => !isReferenceBisText(item)),
  };
  return (
    <section className="panel plan-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{fallback ? "기본 판단" : "AI 판단"}</p>
          <h2>{plan.title}</h2>
        </div>
        <StatusPill tone={stale ? "warn" : plan.confidence === "high" ? "ok" : plan.confidence === "medium" ? "warn" : "err"}>{stale ? "이전 데이터" : `신뢰도 ${plan.confidence}`}</StatusPill>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {stale ? <div className="error-box">현재 장비/선호 조건과 다른 snapshot에서 만든 AI 판단입니다. 새 데이터 기준으로 보려면 수동 재생성을 눌러주세요.</div> : null}
      <p className="plan-summary">{plan.summary}</p>
      <div className="action-stack">
        {visibleActions.map((action) => (
          <ActionCard key={`${action.rank}-${action.title}`} action={action} onDone={onDone} onJump={onJump} disabled={disabled} />
        ))}
        {!visibleActions.length ? <EmptyState title="표시할 실행 항목 없음" body="참고 BIS 기반 이전 항목은 숨겼습니다. 장비 동기화 후 다시 판단하세요." /> : null}
      </div>
      <div className="time-plan-grid">
        <article><Clock3 size={17} /><b>30분</b>{timePlans.short.map((item) => <span key={item}>{item}</span>)}</article>
        <article><Clock3 size={17} /><b>1시간</b>{timePlans.normal.map((item) => <span key={item}>{item}</span>)}</article>
        <article><Clock3 size={17} /><b>2시간</b>{timePlans.long.map((item) => <span key={item}>{item}</span>)}</article>
      </div>
      <div className="detail-grid">
        <section>
          <h3>피할 것</h3>
          {(plan.avoid.length ? plan.avoid : ["오늘 목표와 직접 연결되지 않는 반복 파밍은 뒤로 미룹니다."]).map((item) => <p key={item}>{item}</p>)}
        </section>
        <section>
          <h3>전제/경고</h3>
          {[...plan.assumptions, ...plan.dataWarnings].slice(0, 6).map((item) => <p key={item}>{item}</p>)}
        </section>
      </div>
    </section>
  );
}

export default function AiView({
  preferences,
  snapshot,
  activePlan,
  currentPlan,
  fallback,
  activePlanStale,
  aiError,
  aiLoading,
  disabled,
  historyPlans,
  onPreferencesChange,
  onGenerate,
  onDone,
  onJump,
  onSelectPlan,
}: {
  preferences: AiPreferences;
  snapshot: TodaySnapshot;
  activePlan: AiPlan;
  currentPlan: AiPlan | null;
  fallback: boolean;
  activePlanStale: boolean;
  aiError: string;
  aiLoading: boolean;
  disabled: boolean;
  historyPlans: AiPlan[];
  onPreferencesChange: (preferences: AiPreferences) => void;
  onGenerate: () => void;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
  onSelectPlan: (plan: AiPlan) => void;
}) {
  return (
    <div className="ai-grid">
      <PreferencePanel preferences={preferences} snapshot={snapshot} onChange={onPreferencesChange} onGenerate={onGenerate} loading={aiLoading} disabled={disabled} />
      <PlanResult plan={activePlan} fallback={fallback} stale={activePlanStale} error={aiError} onDone={onDone} onJump={onJump} disabled={disabled} />
      <aside className="panel history-panel">
        <div className="section-head compact"><div><p className="eyebrow">History</p><h2>판단 기록</h2></div><History size={18} /></div>
        {historyPlans.length ? historyPlans.map((item) => (
          <button key={item.id} type="button" className={currentPlan?.id === item.id ? "history-item active" : "history-item"} onClick={() => onSelectPlan(item)}>
            <b>{item.title}</b>
            <span>{new Date(item.generatedAt).toLocaleString("ko-KR")} · {item.trigger || "manual"}</span>
          </button>
        )) : <EmptyState title="저장된 AI 판단 없음" body="캐릭터 선택 후 AI 진단을 실행하면 판단 기록이 쌓입니다." />}
      </aside>
    </div>
  );
}
