import { AlertTriangle, Ban, Check, ChevronDown, EyeOff, Hammer, Map, PackageCheck, Route, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Character, WowheadBisReport } from "../../types";
import { midnightS1Items } from "./data/midnightS1Items";
import { evaluateCharacterGear, gearStatusLabels, type GearSlotStatus } from "./domain/gearInspection";
import { gearRecommendationProfiles } from "./domain/profiles";
import type { GearCoachPreferences, GearRecommendationMode, GearRecommendationResult, GearSourceType, PriorityUpgrade } from "./domain/gearTypes";
import { confidenceLabelKo, getDisplayItemName, getDisplaySourceName, sourceTypeLabelKo } from "./domain/localization";
import { specProfiles, statLabelKo, type SpecKey } from "./domain/specGuides";

const modeOrder: GearRecommendationMode[] = ["dungeon_craft_only", "dungeon_craft_raid", "no_raid", "all_sources", "craft_priority", "trinket_priority"];

function priorityLabel(value: PriorityUpgrade["priority"]) {
  if (value === "very_high") return "매우 높음";
  if (value === "high") return "높음";
  if (value === "medium") return "중간";
  return "낮음";
}

function currentItemName(upgrade: PriorityUpgrade) {
  return upgrade.currentItem?.name || "현재 장비 정보 없음";
}

function sourceTone(source: GearSourceType) {
  if (source === "craft") return "craft";
  if (source === "raid") return "raid";
  if (source === "unknown") return "unknown";
  return "dungeon";
}

function characterSpecKey(character: Character): SpecKey {
  const classText = `${character.className || ""} ${character.spec || ""} ${character.specName || ""}`.toLowerCase();
  if (/devourer|악마사냥꾼|demon/.test(classText)) return "demon-hunter-devourer";
  if (/무법|outlaw/.test(classText)) return "rogue-outlaw";
  if (/잠행|subtlety/.test(classText)) return "rogue-subtlety";
  return "rogue-assassination";
}

type Props = {
  character: Character;
  result: GearRecommendationResult;
  mode: GearRecommendationMode;
  preferences: GearCoachPreferences;
  bisReport: WowheadBisReport | null;
  bisLoading: boolean;
  bisError: string;
  disabled: boolean;
  onModeChange: (mode: GearRecommendationMode) => void;
  onPreferencesChange: (preferences: GearCoachPreferences) => void;
  onRefreshBis: () => void;
  onJumpDungeons: () => void;
};

export function GearRecommendationPage({
  character,
  result,
  mode,
  preferences,
  bisReport,
  bisLoading,
  bisError,
  disabled,
  onModeChange,
  onPreferencesChange,
  onRefreshBis,
  onJumpDungeons,
}: Props) {
  const [detailsFilter, setDetailsFilter] = useState<"all" | GearSlotStatus>("all");
  const activeSpec = specProfiles[characterSpecKey(character)];
  const inspection = evaluateCharacterGear({ character, specProfile: activeSpec, seasonItems: midnightS1Items });
  const visibleSlotDetails = inspection.evaluations.filter((row) => detailsFilter === "all" || row.status === detailsFilter);

  const updatePreferences = (patch: Partial<GearCoachPreferences>) => onPreferencesChange({ ...preferences, ...patch });
  const hideRecommendation = (id: string) => updatePreferences({ hiddenRecommendationIds: Array.from(new Set([...preferences.hiddenRecommendationIds, id])) });
  const markOwned = (itemId: number) => updatePreferences({ alreadyOwnedItemIds: Array.from(new Set([...preferences.alreadyOwnedItemIds, itemId])) });
  const avoidDungeon = (key?: string) => {
    if (!key) return;
    updatePreferences({ avoidedDungeons: Array.from(new Set([...preferences.avoidedDungeons, key])) });
  };

  return (
    <div className="gear-coach">
      <section className="gear-coach-hero panel">
        <div>
          <p className="eyebrow">장비 코치 v9</p>
          <h1>장비 점검</h1>
          <p>한밤 시즌1 후보 DB와 {activeSpec.classNameKo} {activeSpec.specNameKo} 기준으로 현재 장비를 점검합니다. 이 화면은 정밀 DPS 시뮬레이션이 아니라 교체 우선순위 내비게이션입니다.</p>
        </div>
        <div className="gear-coach-character">
          <PackageCheck size={20} />
          <span>{character.name} · {character.realm || character.realmSlug || "서버 확인 중"} · {activeSpec.specNameKo}</span>
        </div>
      </section>

      <section className="mode-chip-row" aria-label="추천 기준 선택">
        {modeOrder.map((item) => (
          <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => onModeChange(item)} disabled={disabled}>
            {gearRecommendationProfiles[item].labelKo}
          </button>
        ))}
      </section>

      <section className="gear-summary-grid">
        <article className="panel gear-summary-card"><small>교체 확인</small><b>{inspection.summary.upgradeCandidates}부위</b><span>무기/교체 후보 포함</span></article>
        <article className="panel gear-summary-card"><small>특수 점검</small><b>{inspection.summary.trinketChecks + inspection.summary.tierChecks}부위</b><span>장신구 {inspection.summary.trinketChecks} · 티어 {inspection.summary.tierChecks}</span></article>
        <article className="panel gear-summary-card"><small>DB 미등록</small><b>{inspection.summary.dbMissing}부위</b><span>BIS 완료 의미 아님</span></article>
      </section>

      <section className="panel gear-score-note">
        <ShieldCheck size={18} />
        <p>{activeSpec.disclaimer} 실제 DPS 최종 비교는 SimulationCraft 또는 Raidbots 확인이 필요합니다. 추천 점수는 DPS가 아니라 현재 장비와 후보 DB를 비교한 점검 우선도입니다.</p>
      </section>

      <section className="panel gear-score-note">
        <ShieldCheck size={18} />
        <p>스탯 기준: {activeSpec.statPriorityTextKo} · {activeSpec.statNotes[0]}</p>
        <a className="link-btn" href={activeSpec.source.url} target="_blank" rel="noreferrer">Wowhead 가이드 보기</a>
      </section>

      <section className="panel gear-plan-panel">
        <div className="section-head compact"><div><p className="eyebrow">오늘 할 일</p><h2>장비 점검 우선순위</h2></div><Sparkles size={18} /></div>
        <p className="gear-section-copy">무기, 장신구, 제작, 티어, DB 미등록 부위를 우선순위로 정리했습니다.</p>
        <div className="gear-action-list">
          {inspection.todo.length ? inspection.todo.map((action, index) => (
            <article key={`${action.slot}-${action.label}`}>
              <span className="rank">{index + 1}</span>
              <div><b>{action.label}</b><p>{action.action}</p></div>
            </article>
          )) : <article><span className="rank">!</span><div><b>검증 후보 부족</b><p>확실하지 않은 아이템은 추천하지 않고 제외 후보에서만 보여줍니다.</p></div></article>}
        </div>
      </section>

      <section className="panel">
        <div className="section-head compact"><div><p className="eyebrow">우선순위</p><h2>교체 우선순위</h2></div><PackageCheck size={18} /></div>
        <div className="upgrade-list">
          {result.priorityUpgrades.map((upgrade, index) => (
            <article key={`${upgrade.slot}-${upgrade.recommendedItem.itemId}`} className="upgrade-card">
              <div className="upgrade-card-head">
                <span className="rank">{index + 1}</span>
                <div><b>{upgrade.slotLabelKo}</b><span>{priorityLabel(upgrade.priority)} · {upgrade.confidenceLabelKo}</span></div>
                <span className={`source-badge ${sourceTone(upgrade.sourceType)}`}>{sourceTypeLabelKo[upgrade.sourceType]}</span>
              </div>
              <dl>
                <div><dt>현재</dt><dd>{currentItemName(upgrade)}</dd></div>
                <div><dt>추천</dt><dd>{getDisplayItemName(upgrade.recommendedItem)}</dd></div>
                <div><dt>획득처</dt><dd>{getDisplaySourceName(upgrade.recommendedItem)}</dd></div>
              </dl>
              <p>{upgrade.reasonKo}</p>
              {upgrade.recommendedItem.trinketMeta ? <small className="trinket-warning">장신구 추천은 실제 DPS와 차이가 있을 수 있습니다. SimC/Raidbots 확인 권장.</small> : null}
              <div className="feedback-actions">
                <button type="button" onClick={() => hideRecommendation(String(upgrade.recommendedItem.itemId))} disabled={disabled}><EyeOff size={14} /> 숨기기</button>
                <button type="button" onClick={() => avoidDungeon(upgrade.recommendedItem.sourceDungeonKey)} disabled={disabled || !upgrade.recommendedItem.sourceDungeonKey}><Ban size={14} /> 던전 제외</button>
                <button type="button" onClick={() => markOwned(upgrade.recommendedItem.itemId)} disabled={disabled}><Check size={14} /> 획득함</button>
              </div>
            </article>
          ))}
          {!result.priorityUpgrades.length ? <div className="empty-inline">현재 모드에서 기본 추천으로 노출할 검증 후보가 없습니다.</div> : null}
        </div>
      </section>

      <section className="panel">
        <div className="section-head compact"><div><p className="eyebrow">파밍 루트</p><h2>추천 파밍 루트</h2></div><Route size={18} /></div>
        <div className="route-list">
          {result.farmingRoutes.map((route, index) => (
            <article key={`${route.routeType}-${route.sourceKey || route.sourceNameKo}`}>
              <span className="rank">{index + 1}</span>
              <div>
                <b>{route.sourceNameKo}</b>
                <p>{route.reasonKo}</p>
                <small>대상 아이템: {route.targetItems.map((item) => `${item.slotLabelKo} ${item.nameKo}`).join(", ")}</small>
              </div>
              {route.routeType === "dungeon" ? <button type="button" onClick={onJumpDungeons}><Map size={14} /> 공략 보기</button> : null}
            </article>
          ))}
          {!result.farmingRoutes.length ? <div className="empty-inline">검증된 파밍 루트가 아직 없습니다.</div> : null}
        </div>
      </section>

      <div className="gear-subgrid">
        <section className="panel">
          <div className="section-head compact"><div><p className="eyebrow">제작</p><h2>제작 추천</h2></div><Hammer size={18} /></div>
          {result.guaranteedUpgrades.length ? result.guaranteedUpgrades.map((upgrade) => (
            <article key={`craft-${upgrade.recommendedItem.itemId}`} className="compact-recommendation">
              <b>{upgrade.slotLabelKo} · {getDisplayItemName(upgrade.recommendedItem)}</b>
              <p>{upgrade.reasonKo}</p>
              <small>{upgrade.certaintyLabelKo}</small>
            </article>
          )) : <div className="empty-inline">제작 확정 강화 후보가 없습니다.</div>}
        </section>
        <section className="panel">
          <div className="section-head compact"><div><p className="eyebrow">장신구</p><h2>장신구 추천</h2></div><AlertTriangle size={18} /></div>
          {result.priorityUpgrades.filter((row) => row.slot.includes("TRINKET")).length ? result.priorityUpgrades.filter((row) => row.slot.includes("TRINKET")).map((upgrade) => (
            <article key={`trinket-${upgrade.recommendedItem.itemId}`} className="compact-recommendation">
              <b>{getDisplayItemName(upgrade.recommendedItem)}</b>
              <p>{upgrade.recommendedItem.trinketMeta?.notesKo || "장신구는 실제 심크 확인을 권장합니다."}</p>
              <small>{confidenceLabelKo(upgrade.recommendedItem.confidence)}</small>
            </article>
          )) : <div className="empty-inline">기본 추천에 노출할 장신구 후보가 없습니다.</div>}
        </section>
      </div>

      <section className="panel">
        <div className="section-head compact"><div><p className="eyebrow">부위</p><h2>부위별 상세</h2></div></div>
        <div className="slot-filter-row">
          {(["all", "upgrade-candidate", "weapon-priority", "crafted-recommended", "trinket-check", "tier-check", "keep", "db-missing", "unsupported"] as const).map((item) => (
            <button key={item} type="button" className={detailsFilter === item ? "active" : ""} onClick={() => setDetailsFilter(item)}>
              {item === "all" ? "전체" : gearStatusLabels[item]}
            </button>
          ))}
        </div>
        <div className="slot-detail-grid">
          {visibleSlotDetails.map((slot) => (
            <article key={slot.slot} className={`slot-detail-card ${slot.status}`}>
              <small>{slot.slotLabelKo}</small>
              <b>{slot.statusLabelKo}</b>
              <span>현재: {slot.currentItem?.name || "장비 정보 없음"}</span>
              <span>스탯: {slot.currentItem?.secondaryStats.length ? slot.currentItem.secondaryStats.map((stat) => statLabelKo[stat]).join(" · ") : "확인 필요"}</span>
              <span>후보: {slot.topCandidate ? slot.topCandidate.item.nameKo : "DB 미등록"}</span>
              <p>{slot.summary}</p>
              {slot.topCandidate ? (
                <div className="slot-candidate-list">
                  {slot.candidates.slice(0, 3).map((candidate) => (
                    <section key={candidate.item.itemId}>
                      <b>{candidate.item.nameKo}</b>
                      <span>{candidate.item.sourceNameKo} · 점검 점수 {candidate.score}</span>
                      <small>{candidate.reasons[0] || candidate.item.note || "전문화 기준 후보입니다."}</small>
                    </section>
                  ))}
                </div>
              ) : null}
              {slot.warnings.length ? <small className="trinket-warning">{slot.warnings.join(" ")}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <details className="panel rejected-panel">
        <summary><ChevronDown size={16} /> 왜 안 보이나요? / 제외된 후보 {result.rejectedCandidates.length}개</summary>
        <div className="rejected-list">
          {result.rejectedCandidates.slice(0, 12).map((item) => (
            <article key={`${item.itemId}-${item.reason}`}>
              <b>{item.nameKo || "한국어 이름 확인 중"}</b>
              <span>{item.reasonKo}</span>
            </article>
          ))}
        </div>
      </details>

      <section className="panel reference-bis-panel">
        <div className="section-head compact">
          <div><p className="eyebrow">참고 자료</p><h2>참고 BIS</h2></div>
          <button type="button" onClick={onRefreshBis} disabled={disabled || bisLoading}>{bisLoading ? "불러오는 중" : "참고 자료 새로고침"}</button>
        </div>
        <p>참고 BIS는 추천 엔진의 최종 판단이 아닙니다. 현재 시즌 검증과 사용자 모드 필터를 통과한 후보만 기본 추천에 표시됩니다.</p>
        {bisError ? <small className="error-copy">{bisError}</small> : <small>{bisReport ? `${bisReport.items.length}개 참고 항목 · ${new Date(bisReport.fetchedAt).toLocaleString("ko-KR")}` : "참고 자료 대기"}</small>}
      </section>
    </div>
  );
}
