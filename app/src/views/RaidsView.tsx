import { ExternalLink, ShieldAlert, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, StatusPill } from "../components/ui";
import { raidConfidenceLabelKo, raidGuides, type RaidAuditConfidence, type RaidGuide } from "../domain/raidGuideData";

const toneByConfidence: Record<RaidAuditConfidence, "ok" | "warn" | "err"> = {
  cross_checked: "ok",
  reviewing: "warn",
  needs_feedback: "err",
};

function RaidSourceLinks({ raid }: { raid: RaidGuide }) {
  return (
    <div className="raid-source-row" aria-label={`${raid.nameKo} 출처`}>
      <span>검수 출처</span>
      {raid.sources.map((source) => (
        <a key={source.href} href={source.href} target="_blank" rel="noreferrer">
          {source.labelKo}
          <ExternalLink size={13} />
        </a>
      ))}
    </div>
  );
}

function RaidQuickGuide({ raid }: { raid: RaidGuide }) {
  const guide = raid.quickGuide;
  if (!guide) return null;
  return (
    <section className="raid-quick-guide" aria-label={`${raid.nameKo} 빠른 공략`}>
      <div className="raid-quick-head">
        <div>
          <p className="eyebrow">Quick guide</p>
          <h3>{guide.titleKo}</h3>
        </div>
        <strong>{guide.oneLineKo}</strong>
      </div>
      <div className="raid-quick-columns">
        <section>
          <b>지금 할 것</b>
          <ol>{guide.doFirstKo.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
        <section className="danger">
          <b>하지 말 것</b>
          <ol>{guide.avoidKo.map((item) => <li key={item}>{item}</li>)}</ol>
        </section>
      </div>
      <div className="raid-timeline">
        {guide.timelineKo.map((step) => (
          <article key={step.stepKo}>
            <b>{step.stepKo}</b>
            <span>{step.actionKo}</span>
            <small>{step.survivalKo}</small>
          </article>
        ))}
      </div>
      <details className="raid-recovery-guide">
        <summary>실수했을 때 복구법</summary>
        <div>
          {guide.recoveryKo.map((row) => (
            <article key={row.mistakeKo}>
              <b>{row.mistakeKo}</b>
              <span>{row.fixKo}</span>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}

export default function RaidsView() {
  const [query, setQuery] = useState("");
  const [selectedRaidId, setSelectedRaidId] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => raidGuides.filter((raid) => {
    if (!normalizedQuery) return true;
    return [
      raid.nameKo,
      raid.nameEn,
      raid.shortKo,
      raid.summaryKo,
      raid.statusKo,
      ...raid.bosses.flatMap((boss) => [boss.nameKo, boss.nameEn, boss.watchKo, boss.moveKo, boss.defensiveKo, boss.rogueNoteKo]),
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
  }), [normalizedQuery]);
  const selectedRaid = visible.find((raid) => raid.id === selectedRaidId) || null;

  return (
    <div className="view-stack">
      <section className="panel raid-view">
        <div className="section-head">
          <div>
            <p className="eyebrow">Raid</p>
            <h2>레이드 작전</h2>
          </div>
          {selectedRaid ? <button type="button" onClick={() => setSelectedRaidId("")}>레이드 목록</button> : null}
        </div>
        <div className="raid-tools">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="레이드, 보스, 위험 요소 검색" />
        </div>
        {!selectedRaid ? (
          <>
            <section className="raid-select-intro">
              <p className="eyebrow">Raid select</p>
              <h3>레이드를 선택하세요</h3>
              <p>던전처럼 전체 공략을 길게 이어 붙이지 않고, 선택한 레이드만 표시합니다.</p>
            </section>
            <div className="raid-picker-grid" aria-label="레이드 선택">
              {visible.map((raid) => (
                <button key={raid.id} type="button" onClick={() => setSelectedRaidId(raid.id)}>
                  <span>{raid.shortKo}</span>
                  <b>{raid.nameKo}</b>
                  <small>{raid.nameEn}</small>
                  <em>{raid.statusKo}</em>
                  <StatusPill tone={toneByConfidence[raid.confidence]}>{raidConfidenceLabelKo[raid.confidence]}</StatusPill>
                </button>
              ))}
            </div>
            {!visible.length ? <EmptyState title="검색 결과 없음" body="검색어를 줄여서 다시 확인하세요." /> : null}
          </>
        ) : (
          <>
            <section className="raid-command">
              <div>
                <p className="eyebrow">Raid briefing</p>
                <h3>{selectedRaid.nameKo}</h3>
                <p>{selectedRaid.summaryKo}</p>
              </div>
              <div className="raid-status-box">
                <StatusPill tone={toneByConfidence[selectedRaid.confidence]}>{raidConfidenceLabelKo[selectedRaid.confidence]}</StatusPill>
                <strong>{selectedRaid.statusKo}</strong>
                <small>마지막 확인: {selectedRaid.lastChecked}</small>
              </div>
            </section>
            <RaidSourceLinks raid={selectedRaid} />
            <section className="raid-warning-strip">
              <ShieldAlert size={17} />
              <span>검수 전 패턴은 확정 콜로 쓰지 않습니다. 실제 트라이 전에는 공대장 브리핑과 최신 로그/가이드를 함께 확인하세요.</span>
            </section>
            <RaidQuickGuide raid={selectedRaid} />
            <div className="raid-boss-list">
              {selectedRaid.bosses.map((boss) => (
                <article key={boss.id} className="raid-boss-card">
                  <div className="raid-boss-head">
                    <div>
                      <p className="eyebrow">Boss {boss.order}</p>
                      <h3>{boss.nameKo}</h3>
                      {boss.nameEn ? <span>{boss.nameEn}</span> : null}
                    </div>
                    <StatusPill tone={toneByConfidence[boss.confidence]}>{raidConfidenceLabelKo[boss.confidence]}</StatusPill>
                  </div>
                  <div className="raid-boss-grid">
                    <section><b>내 역할</b><p>{boss.roleFocusKo}</p></section>
                    <section><b>볼 것</b><p>{boss.watchKo}</p></section>
                    <section><b>이동</b><p>{boss.moveKo}</p></section>
                    <section><b>생존기</b><p>{boss.defensiveKo}</p></section>
                  </div>
                  <div className="raid-rogue-note">
                    <Swords size={16} />
                    <span>{boss.rogueNoteKo}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
