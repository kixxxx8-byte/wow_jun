import { Activity, Crosshair, Map as MapIcon, ShieldAlert, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, StatusPill } from "../components/ui";
import { dungeonGuideCatalog, legacyDiagramInfo, WOW_KR_YOUTUBE, type RichDungeonGuide } from "../domain/dungeonCatalog";
import { itemIcon } from "../domain/planning";
import type { DungeonGuideFeedback, DungeonGuideFeedbackType, Target, TodaySnapshot } from "../types";

type DiagramKey = keyof typeof legacyDiagramInfo;

const auditTone: Record<RichDungeonGuide["audit"]["confidence"], "ok" | "warn" | "err"> = {
  verified: "ok",
  cross_checked: "ok",
  reviewing: "warn",
  needs_feedback: "err",
};

function TargetItemIcon({ target, className = "", placeholder = "목표" }: { target?: Target | null; className?: string; placeholder?: string }) {
  const icon = target ? itemIcon({ icon: target.icon }) : "";
  return icon ? (
    <span className={`item-icon ${className}`.trim()}><img src={icon} alt="" loading="lazy" /></span>
  ) : (
    <span className={`item-icon placeholder ${className}`.trim()}>{placeholder}</span>
  );
}

function microGuideSearchText(guide: RichDungeonGuide) {
  const micro = guide.microGuide;
  const cinematic = guide.cinematicGuide;
  const top = micro?.topPriority.flatMap((item) => Object.values(item)) || [];
  const boss = guide.bosses.flatMap((row) => row.microNote ? Object.values(row.microNote) : []);
  const cinematicText = cinematic ? [
    cinematic.titleKo,
    cinematic.subtitleKo,
    cinematic.oneLineKo,
    cinematic.audit.confidenceLabelKo,
    cinematic.audit.summaryKo,
    ...cinematic.audit.sources.flatMap((source) => [source.labelKo, source.href]),
    ...cinematic.survivalFocusKo,
    ...cinematic.phases.flatMap((phase) => [
      phase.phaseKo,
      phase.bossKo,
      phase.oneLineKo,
      phase.watchKo,
      phase.moveKo,
      phase.interruptKo,
      phase.defensiveKo,
      phase.failRecoveryKo,
      phase.audit.confidenceLabelKo,
      phase.audit.summaryKo,
      ...phase.audit.sources.flatMap((source) => [source.labelKo, source.href]),
    ]),
    ...cinematic.trashAlerts.flatMap((alert) => Object.values(alert)),
    ...cinematic.defensivePlan.flatMap((plan) => Object.values(plan)),
    ...cinematic.failRecovery.flatMap((row) => Object.values(row)),
  ] : [];
  return [micro?.focusKo, micro?.oneLineKo, ...top, ...boss, ...cinematicText].filter(Boolean).join(" ");
}

function GuideAuditBadge({ audit }: { audit: RichDungeonGuide["audit"] }) {
  return (
    <div className={`guide-audit guide-audit-${audit.confidence}`} aria-label={`공략 신뢰도 ${audit.confidenceLabelKo}`}>
      <b>{audit.confidenceLabelKo}</b>
      <span>{audit.lastChecked}</span>
    </div>
  );
}

function CinematicMotion({ type }: { type: NonNullable<RichDungeonGuide["cinematicGuide"]>["phases"][number]["animationType"] }) {
  return (
    <svg className={`cinematic-motion cinematic-${type}`} viewBox="0 0 320 190" role="img" aria-label="패턴 이동 모션 다이어그램">
      <defs>
        <radialGradient id={`safe-${type}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d9fff6" />
          <stop offset="100%" stopColor="#7ed7cb" />
        </radialGradient>
      </defs>
      <rect className="arena" x="12" y="12" width="296" height="166" rx="18" />
      <circle className="boss-dot" cx="160" cy="92" r="18" />
      <text className="motion-label boss-label" x="160" y="98">BOSS</text>
      <circle className="player-dot" cx="160" cy="142" r="8" />
      <text className="motion-label player-label" x="178" y="147">나</text>
      {type === "twister_breath" ? (
        <>
          <path className="danger-cone" d="M160 92 L95 34 L225 34 Z" />
          <path className="twister twister-one" d="M44 156 C88 118 82 70 132 38" />
          <path className="twister twister-two" d="M270 152 C218 120 236 70 190 38" />
          <path className="safe-path" d="M160 142 C185 132 205 116 220 96" />
        </>
      ) : null}
      {type === "hook_interrupt" ? (
        <>
          <circle className="enemy-dot secondary" cx="78" cy="92" r="15" />
          <text className="motion-label" x="78" y="98">어보미</text>
          <text className="motion-label" x="160" y="70">벤시</text>
          <path className="hook-line" d="M78 92 C110 74 133 88 160 92 S202 110 236 92" />
          <circle className="safe-zone" cx="236" cy="92" r="22" />
          <text className="motion-label" x="236" y="98">대상자</text>
          <path className="safe-path" d="M160 142 C184 124 208 106 236 92" />
        </>
      ) : null}
      {type === "add_interrupt" ? (
        <>
          <rect className="cast-bar-bg" x="72" y="34" width="176" height="16" rx="8" />
          <rect className="cast-bar-fill" x="72" y="34" width="176" height="16" rx="8" />
          <circle className="enemy-dot add-one" cx="95" cy="118" r="13" />
          <circle className="enemy-dot add-two" cx="225" cy="118" r="13" />
          <path className="interrupt-pulse" d="M160 142 L95 118 M160 142 L225 118" />
        </>
      ) : null}
      {type === "arrow_hide" ? (
        <>
          <path className="arrow-pad" d="M90 145 L118 112 L146 145 Z" />
          <path className="jump-arc" d="M160 142 C148 92 124 85 118 112" />
          <circle className="safe-zone" cx="236" cy="68" r="28" />
          <rect className="pillar" x="224" y="52" width="24" height="46" rx="8" />
          <path className="danger-ring" d="M55 95 C98 35 222 35 265 95" />
        </>
      ) : null}
    </svg>
  );
}

const feedbackLabels: Record<DungeonGuideFeedbackType, string> = {
  wrong: "틀림",
  mechanic_wrong: "기믹 틀림",
  order_wrong: "순서 틀림",
  unclear: "애매함",
  too_long: "너무 김",
  mobile_hard: "모바일 불편",
  worked: "도움됨",
  needs_more_detail: "더 자세히",
};

function DungeonGuideFeedbackPanel({
  guide,
  phase,
  loggedIn,
  feedback,
  onFeedback,
}: {
  guide: RichDungeonGuide;
  phase?: NonNullable<RichDungeonGuide["cinematicGuide"]>["phases"][number];
  loggedIn: boolean;
  feedback: DungeonGuideFeedback[];
  onFeedback: (input: Omit<DungeonGuideFeedback, "id" | "createdAt">) => void;
}) {
  const [feedbackType, setFeedbackType] = useState<DungeonGuideFeedbackType>("wrong");
  const [message, setMessage] = useState("");
  const guideFeedback = feedback.filter((item) => item.dungeonId === guide.id && (!phase || item.phaseId === phase.id));
  const save = () => {
    if (!loggedIn) return;
    onFeedback({
      dungeonId: guide.id,
      phaseId: phase?.id,
      bossName: phase?.bossKo,
      feedbackType,
      message: message.trim(),
    });
    setMessage("");
  };
  return (
    <section className="guide-feedback-panel" aria-label={`${guide.name} 공략 피드백`}>
      <div className="guide-feedback-head">
        <div>
          <p className="eyebrow">Guide feedback</p>
          <h3>{phase ? `${phase.bossKo} 피드백` : "공략 피드백"}</h3>
        </div>
        {guideFeedback.length ? <StatusPill tone="warn">사용자 피드백 있음 {guideFeedback.length}</StatusPill> : <StatusPill tone="ok">검수 루프 대기</StatusPill>}
      </div>
      <p>{loggedIn ? "틀린 부분이나 실제로 잘 맞은 부분을 남기면 다음 검수 기준으로 사용합니다." : "로그인 후 틀린 기믹, 애매한 설명, 실제로 도움된 내용을 저장할 수 있습니다."}</p>
      <div className="feedback-type-row" role="group" aria-label="피드백 종류">
        {(Object.keys(feedbackLabels) as DungeonGuideFeedbackType[]).map((type) => (
          <button key={type} type="button" className={feedbackType === type ? "active" : ""} onClick={() => setFeedbackType(type)} disabled={!loggedIn}>
            {feedbackLabels[type]}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="예: 2넴 쫄 차단 순서가 다름 / 갈고리 위치 설명이 애매함"
        disabled={!loggedIn}
      />
      <button type="button" onClick={save} disabled={!loggedIn}>
        {loggedIn ? "피드백 저장" : "로그인 후 피드백 저장 가능"}
      </button>
    </section>
  );
}

function PhaseBriefCard({
  phase,
}: {
  phase: NonNullable<RichDungeonGuide["cinematicGuide"]>["phases"][number];
}) {
  return (
    <article className={`cinematic-phase severity-${phase.severity}`}>
      <div className="cinematic-phase-copy">
        <small>{phase.bossKo}</small>
        <GuideAuditBadge audit={phase.audit} />
        <h3>{phase.phaseKo}</h3>
        <strong>{phase.oneLineKo}</strong>
        <dl>
          <div><dt>볼 것</dt><dd>{phase.watchKo}</dd></div>
          <div><dt>움직임</dt><dd>{phase.moveKo}</dd></div>
          <div><dt>차단/스턴</dt><dd>{phase.interruptKo}</dd></div>
          <div><dt>생존기</dt><dd>{phase.defensiveKo}</dd></div>
          <div><dt>실패 시 복구</dt><dd>{phase.failRecoveryKo}</dd></div>
        </dl>
      </div>
      <CinematicMotion type={phase.animationType} />
    </article>
  );
}

function CinematicDungeonGuide({
  guide,
  priority,
  loggedIn,
  feedback,
  onFeedback,
}: {
  guide: RichDungeonGuide;
  priority?: TodaySnapshot["dungeonRecommendations"][number];
  loggedIn: boolean;
  feedback: DungeonGuideFeedback[];
  onFeedback: (input: Omit<DungeonGuideFeedback, "id" | "createdAt">) => void;
}) {
  const cinematic = guide.cinematicGuide;
  const [activePhaseId, setActivePhaseId] = useState("");
  if (!cinematic) return null;
  const selectedPhase = cinematic.phases.find((phase) => phase.id === activePhaseId) || cinematic.phases[0];
  return (
    <section className="panel cinematic-dungeon-guide" aria-label={`${guide.name} 상세 작전`}>
      <div className="cinematic-hero">
        <div>
          <p className="eyebrow">완성형 실전 공략</p>
          <h2>{cinematic.titleKo}</h2>
          <p>{cinematic.subtitleKo}</p>
        </div>
        <div className="cinematic-callout">
          <Zap size={18} />
          <b>{cinematic.oneLineKo}</b>
          {priority?.count ? <span>오늘 목표 아이템 {priority.count}개와 연결됨</span> : <span>장비 목표가 없어도 생존 루틴으로 사용</span>}
        </div>
      </div>
      <div className="cinematic-sources" aria-label="공략 검수 출처">
        <span>검수 기준</span>
        {cinematic.audit.sources.map((source) => (
          <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.labelKo}</a>
        ))}
        <small>{cinematic.audit.summaryKo}</small>
      </div>
      <div className="cinematic-survival">
        <div><ShieldAlert size={18} /><b>오늘 죽지 말 것 3개</b></div>
        {cinematic.survivalFocusKo.map((item) => <article key={item}>{item}</article>)}
      </div>
      <div className="cinematic-phase-tabs" aria-label={`${guide.name} 보스별 패턴 선택`}>
        {cinematic.phases.map((phase, index) => (
          <button
            key={phase.id}
            type="button"
            className={selectedPhase.id === phase.id ? "active" : ""}
            onClick={() => setActivePhaseId(phase.id)}
          >
            <span>{index + 1}</span>
            {phase.bossKo}
          </button>
        ))}
      </div>
      <div className="cinematic-phase-grid">
        {cinematic.phases.map((phase, index) => (
          <PhaseBriefCard key={phase.id} phase={{ ...phase, bossKo: `${index + 1} · ${phase.bossKo}` }} />
        ))}
      </div>
      <div className="cinematic-desktop-feedback">
        <DungeonGuideFeedbackPanel guide={guide} phase={cinematic.phases[0]} loggedIn={loggedIn} feedback={feedback} onFeedback={onFeedback} />
      </div>
      <div className="cinematic-selected-phase">
        <PhaseBriefCard phase={selectedPhase} />
        <DungeonGuideFeedbackPanel guide={guide} phase={selectedPhase} loggedIn={loggedIn} feedback={feedback} onFeedback={onFeedback} />
      </div>
      <div className="cinematic-bottom-grid">
        <section>
          <div><Crosshair size={17} /><h3>쫄 구간 위험 시전</h3></div>
          {cinematic.trashAlerts.map((alert) => (
            <article key={alert.titleKo}>
              <b>{alert.titleKo}</b>
              <span>{alert.watchKo}</span>
              <small>{alert.interruptKo} · {alert.defensiveKo}</small>
            </article>
          ))}
        </section>
        <section>
          <div><ShieldAlert size={17} /><h3>내 생존기 콜</h3></div>
          {cinematic.defensivePlan.map((plan) => (
            <article key={plan.triggerKo}><b>{plan.triggerKo}</b><span>{plan.actionKo}</span></article>
          ))}
        </section>
        <section>
          <div><Activity size={17} /><h3>실수 복구법</h3></div>
          {cinematic.failRecovery.map((row) => (
            <article key={row.mistakeKo}><b>{row.mistakeKo}</b><span>{row.recoveryKo}</span></article>
          ))}
        </section>
      </div>
    </section>
  );
}

function DungeonGuideCard({ guide, priority, onOpenCinematic }: { guide: RichDungeonGuide; priority?: TodaySnapshot["dungeonRecommendations"][number]; onOpenCinematic: (id: string) => void }) {
  const worstBoss = guide.bosses.find((boss) => boss.risk === "최상" || boss.risk === "치명") || guide.bosses[0];
  const loot = priority?.targets.length ? priority.targets.map((target) => `${target.slotLabel} ${target.target}`).join(", ") : priority?.loot || guide.meta.loot;
  const microTop = guide.microGuide?.topPriority.slice(0, 3) || [];
  return (
    <article className={`dungeon-guide ${priority?.count ? "priority" : ""}`} id={`dungeon-${guide.id}`}>
      <header className="dungeon-guide-head">
        <div>
          <p className="eyebrow">{guide.short} · {guide.timer}</p>
          <div className="dungeon-title-row">
            <h3>{guide.name}</h3>
            <GuideAuditBadge audit={guide.audit} />
          </div>
          <p>{guide.meta.why}</p>
          <p className="guide-audit-summary">{guide.audit.summaryKo}</p>
        </div>
        <div className="dungeon-score-box">
          <StatusPill tone={priority?.count ? "warn" : "ok"}>{priority?.count ? `오늘 목표 ${priority.count}` : guide.danger}</StatusPill>
          <StatusPill tone={auditTone[guide.audit.confidence]}>{guide.audit.confidenceLabelKo}</StatusPill>
          <strong>{worstBoss?.ko || worstBoss?.name || "핵심 보스"}</strong>
          <small>{worstBoss?.one || guide.route}</small>
          {guide.cinematicGuide ? <button type="button" onClick={() => onOpenCinematic(guide.id)} aria-label={`${guide.name} 상세 작전 보기`}>상세 작전 보기</button> : null}
        </div>
      </header>
      <div className="dungeon-brief-grid">
        <section><b>루트</b><p>{guide.route}</p></section>
        <section>
          <b>먹을 것</b>
          {priority?.targets.length ? (
            <div className="loot-icon-row">
              {priority.targets.slice(0, 5).map((target) => <TargetItemIcon key={target.id} target={target} className="loot-item-icon" />)}
              <p>{loot}</p>
            </div>
          ) : <p>{loot}</p>}
        </section>
        <section><b>주의</b><p>{guide.danger}</p></section>
        <section>
          <b>공식 영상</b>
          <p>{guide.videoUrl ? <a href={guide.videoUrl} target="_blank" rel="noreferrer">{guide.videoTitle || guide.sourceLabel || "공식 가이드"}</a> : <a href={WOW_KR_YOUTUBE} target="_blank" rel="noreferrer">공식 유튜브</a>}</p>
        </section>
        <section><b>외부 분석</b><p><a href={guide.meta.href} target="_blank" rel="noreferrer">Wythic 보기</a></p></section>
      </div>
      <div className="overview-pills">
        {guide.overview.map((item) => <span key={item}>{item}</span>)}
      </div>
      {guide.microGuide ? (
        <section className="micro-survival-panel" aria-label={`${guide.name} 초정밀 생존 노트`}>
          <div className="micro-survival-head">
            <div>
              <p className="eyebrow">Rogue survival</p>
              <h4>오늘 죽지 말 것</h4>
            </div>
            <StatusPill tone="warn">초정밀 생존 노트</StatusPill>
          </div>
          <p className="micro-focus">{guide.microGuide.focusKo}</p>
          <div className="micro-note-grid">
            {microTop.map((item) => (
              <article key={item.labelKo}>
                <b>{item.labelKo}</b>
                <strong>{item.oneLineKo}</strong>
                <span>{item.deathRiskKo}</span>
                <small>생존기: {item.defensiveKo}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="boss-grid">
        {guide.bosses.map((boss) => (
          <section key={boss.name} className={`boss-card risk-${boss.risk}`}>
            <div className="boss-topline">
              <span className="risk-pill">{boss.risk}</span>
              <h4>{boss.ko || boss.name}</h4>
            </div>
            <p className="boss-one">{boss.one}</p>
            <div className="boss-body">
              <div>
                <b>해야 할 것</b>
                <ul>{boss.do.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="diagram-box">
                {(() => {
                  const diagram = boss.diagram ? legacyDiagramInfo[boss.diagram as DiagramKey] : null;
                  return (
                    <>
                      <b>{diagram?.name || "패턴"}</b>
                      <ol>{(diagram?.steps || ["위치 확인", "위험 시전 차단", "큰 피해 전 생존기"]).map((step) => <li key={step}>{step}</li>)}</ol>
                    </>
                  );
                })()}
              </div>
            </div>
            <p className="healer-note"><b>힐러/생존 메모</b>{boss.healer || "큰 피해 전 개인 생존기와 차단을 확인합니다."}</p>
            {boss.microNote ? (
              <details className="boss-micro-note">
                <summary>내 생존 체크</summary>
                <div className="boss-micro-grid">
                  <span><b>죽는 이유</b>{boss.microNote.deathRiskKo}</span>
                  <span><b>볼 것</b>{boss.microNote.watchKo}</span>
                  <span><b>이동</b>{boss.microNote.moveKo}</span>
                  <span><b>차단/스턴</b>{boss.microNote.interruptKo}</span>
                  <span><b>생존기</b>{boss.microNote.defensiveKo}</span>
                  <span><b>근딜 주의</b>{boss.microNote.meleeWarningKo}</span>
                </div>
              </details>
            ) : null}
          </section>
        ))}
      </div>
      <div className="route-actions">
        {guide.videoUrl ? <a className="link-btn" href={guide.videoUrl} target="_blank" rel="noreferrer">공식 영상</a> : null}
        <a className="link-btn" href={guide.meta.href} target="_blank" rel="noreferrer">Wythic</a>
      </div>
    </article>
  );
}

export default function DungeonsView({
  recommendations,
  gearRecommendation,
  loggedIn = false,
  feedback = [],
  onFeedback = () => undefined,
}: {
  recommendations: TodaySnapshot["dungeonRecommendations"];
  gearRecommendation?: TodaySnapshot["gearRecommendation"];
  loggedIn?: boolean;
  feedback?: DungeonGuideFeedback[];
  onFeedback?: (input: Omit<DungeonGuideFeedback, "id" | "createdAt">) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyTargets, setOnlyTargets] = useState(false);
  const [activeCinematicId, setActiveCinematicId] = useState("windrunner");
  const priorityById = useMemo(() => new Map(recommendations.map((row) => [row.id, row])), [recommendations]);
  const sorted = useMemo(() => [...dungeonGuideCatalog].sort((a, b) => {
    const priorityA = priorityById.get(a.id);
    const priorityB = priorityById.get(b.id);
    return (priorityB?.score || 0) - (priorityA?.score || 0) || (priorityB?.count || 0) - (priorityA?.count || 0) || a.name.localeCompare(b.name, "ko");
  }), [priorityById]);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = sorted.filter((guide) => {
    const priority = priorityById.get(guide.id);
    if (onlyTargets && !priority?.count) return false;
    if (!normalizedQuery) return true;
    return [guide.name, guide.short, guide.en, guide.danger, guide.route, microGuideSearchText(guide)].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const top = sorted[0];
  const activeCinematicGuide = visible.find((guide) => guide.id === activeCinematicId && guide.cinematicGuide) || visible.find((guide) => guide.cinematicGuide);
  return (
    <div className="view-stack">
      {gearRecommendation?.farmingRoutes.length ? (
        <section className="panel today-gear-coach">
          <div className="section-head compact"><div><p className="eyebrow">장비 루트</p><h2>장비 추천 파밍 루트</h2></div><MapIcon size={18} /></div>
          <div className="today-gear-actions">
            {gearRecommendation.farmingRoutes.slice(0, 3).map((route) => (
              <article key={`${route.routeType}-${route.sourceKey || route.sourceNameKo}`}>
                <b>{route.sourceNameKo}</b>
                <span>{route.reasonKo}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">Dungeon</p><h2>던전 컨닝</h2></div>
          <a className="link-btn" href="https://wythic.com/ko/dungeon" target="_blank" rel="noreferrer">Wythic 전체</a>
        </div>
        <div className="dungeon-tools">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="던전, 보스, 위험 요소 검색" />
          <button type="button" className={onlyTargets ? "active" : ""} onClick={() => setOnlyTargets((value) => !value)}>오늘 목표만</button>
        </div>
        {top ? (
          <section className="dungeon-command">
            <div>
              <p className="eyebrow">Dungeon briefing</p>
              <h3>{top.name}</h3>
              <p>{top.route} · {top.danger}</p>
            </div>
            <div className="command-actions">
              {top.videoUrl ? <a className="link-btn primary-link" href={top.videoUrl} target="_blank" rel="noreferrer">공식 영상</a> : null}
              <a className="link-btn" href={top.meta.href} target="_blank" rel="noreferrer">Wythic</a>
              <a className="link-btn" href={WOW_KR_YOUTUBE} target="_blank" rel="noreferrer">WoW 한국 유튜브</a>
            </div>
          </section>
        ) : null}
        <div className="dungeon-tabs">
          {visible.map((guide, index) => {
            const priority = priorityById.get(guide.id);
            return (
              <a
                key={guide.id}
                className={guide.id === (activeCinematicGuide?.id || "") || (!activeCinematicGuide && index === 0) ? "active" : ""}
                href={`#dungeon-${guide.id}`}
                onClick={() => {
                  if (guide.cinematicGuide) setActiveCinematicId(guide.id);
                }}
              >
                {guide.short || guide.name}
                <span>{priority?.count ? `목표 ${priority.count}` : guide.timer}</span>
              </a>
            );
          })}
        </div>
        {activeCinematicGuide ? (
          <CinematicDungeonGuide
            guide={activeCinematicGuide}
            priority={priorityById.get(activeCinematicGuide.id)}
            loggedIn={loggedIn}
            feedback={feedback}
            onFeedback={onFeedback}
          />
        ) : null}
        <div className="dungeon-guide-list">
          {visible.map((guide) => {
            const priority = priorityById.get(guide.id);
            return <DungeonGuideCard key={guide.id} guide={guide} priority={priority} onOpenCinematic={setActiveCinematicId} />;
          })}
          {!visible.length ? <EmptyState title="검색 결과 없음" body="검색어를 줄이거나 오늘 목표만 필터를 꺼보세요." /> : null}
        </div>
      </section>
    </div>
  );
}
