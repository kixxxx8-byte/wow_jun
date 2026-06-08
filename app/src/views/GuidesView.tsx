import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MetricCard, StatusPill } from "../components/ui";
import { classGuides, guideSpecOrder, specLabel, specProfiles } from "../features/gear/domain/specGuides";
import type { ClassGuide } from "../features/gear/domain/specGuides";

function OutlawPracticalGuide({ guide }: { guide: ClassGuide }) {
  if (!guide.coreSummary || !guide.deepGuide || !guide.practiceGuide || !guide.keybindGuide || !guide.masteryGuide || !guide.visualGuides) return null;

  return (
    <>
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
