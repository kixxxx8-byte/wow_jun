import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MetricCard, StatusPill } from "../components/ui";
import { classGuides, guideSpecOrder, specLabel, specProfiles } from "../features/gear/domain/specGuides";

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
