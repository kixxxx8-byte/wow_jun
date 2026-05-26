import { Map as MapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, StatusPill } from "../components/ui";
import { dungeonGuideCatalog, legacyDiagramInfo, WOW_KR_YOUTUBE, type RichDungeonGuide } from "../domain/dungeonCatalog";
import { itemIcon } from "../domain/planning";
import type { Target, TodaySnapshot } from "../types";

type DiagramKey = keyof typeof legacyDiagramInfo;

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
  if (!micro) return "";
  const top = micro.topPriority.flatMap((item) => Object.values(item));
  const boss = guide.bosses.flatMap((row) => row.microNote ? Object.values(row.microNote) : []);
  return [micro.focusKo, micro.oneLineKo, ...top, ...boss].join(" ");
}

function DungeonGuideCard({ guide, priority }: { guide: RichDungeonGuide; priority?: TodaySnapshot["dungeonRecommendations"][number] }) {
  const worstBoss = guide.bosses.find((boss) => boss.risk === "최상" || boss.risk === "치명") || guide.bosses[0];
  const loot = priority?.targets.length ? priority.targets.map((target) => `${target.slotLabel} ${target.target}`).join(", ") : priority?.loot || guide.meta.loot;
  const microTop = guide.microGuide?.topPriority.slice(0, 3) || [];
  return (
    <article className={`dungeon-guide ${priority?.count ? "priority" : ""}`} id={`dungeon-${guide.id}`}>
      <header className="dungeon-guide-head">
        <div>
          <p className="eyebrow">{guide.short} · {guide.timer}</p>
          <h3>{guide.name}</h3>
          <p>{guide.meta.why}</p>
        </div>
        <div className="dungeon-score-box">
          <StatusPill tone={priority?.count ? "warn" : "ok"}>{priority?.count ? `오늘 목표 ${priority.count}` : guide.danger}</StatusPill>
          <strong>{worstBoss?.ko || worstBoss?.name || "핵심 보스"}</strong>
          <small>{worstBoss?.one || guide.route}</small>
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

export default function DungeonsView({ recommendations, gearRecommendation }: { recommendations: TodaySnapshot["dungeonRecommendations"]; gearRecommendation?: TodaySnapshot["gearRecommendation"] }) {
  const [query, setQuery] = useState("");
  const [onlyTargets, setOnlyTargets] = useState(false);
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
              <a key={guide.id} className={index === 0 ? "active" : ""} href={`#dungeon-${guide.id}`}>
                {guide.short || guide.name}
                <span>{priority?.count ? `목표 ${priority.count}` : guide.timer}</span>
              </a>
            );
          })}
        </div>
        <div className="dungeon-guide-list">
          {visible.map((guide) => {
            const priority = priorityById.get(guide.id);
            return <DungeonGuideCard key={guide.id} guide={guide} priority={priority} />;
          })}
          {!visible.length ? <EmptyState title="검색 결과 없음" body="검색어를 줄이거나 오늘 목표만 필터를 꺼보세요." /> : null}
        </div>
      </section>
    </div>
  );
}
