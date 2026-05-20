import { AlertTriangle, Ban, Check, ChevronDown, EyeOff, Hammer, Map, PackageCheck, Route, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Character, WowheadBisReport } from "../../types";
import { gearRecommendationProfiles } from "./domain/profiles";
import type { GearCoachPreferences, GearRecommendationMode, GearRecommendationResult, GearSourceType, PriorityUpgrade } from "./domain/gearTypes";
import { confidenceLabelKo, getDisplayItemName, getDisplaySourceName, sourceTypeLabelKo } from "./domain/localization";

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
  const [detailsFilter, setDetailsFilter] = useState<"all" | "replace" | "keep" | "no_verified_candidate" | "insufficient_data">("all");
  const visibleSlotDetails = result.slotDetails.filter((row) => detailsFilter === "all" || row.status === detailsFilter);

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
          <h1>장비 추천</h1>
          <p>현재 기준: {result.modeLabelKo} · 레이드 아이템 제외 모드에서는 레이드 후보를 숨기고, 현재 시즌 검증 후보와 한국어 이름을 우선합니다.</p>
        </div>
        <div className="gear-coach-character">
          <PackageCheck size={20} />
          <span>{character.name} · {character.realm || character.realmSlug || "서버 확인 중"}</span>
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
        <article className="panel gear-summary-card"><small>장비 점수</small><b>{result.currentScore} → {result.targetScore}</b><span>{result.modeLabelKo} 기준</span></article>
        <article className="panel gear-summary-card"><small>교체 목표</small><b>{result.priorityUpgrades.length}부위</b><span>{result.priorityUpgrades[0]?.slotLabelKo || "검증 후보 부족"}</span></article>
        <article className="panel gear-summary-card"><small>추천 파밍</small><b>{result.farmingRoutes.length}개</b><span>제작 {result.guaranteedUpgrades.length} · 파밍 {result.rngFarmingTargets.length}</span></article>
      </section>

      <section className="panel gear-score-note">
        <ShieldCheck size={18} />
        <p>추천 점수는 실제 심크 DPS가 아니라 현재 장비, 시즌 보상, 획득 경로, 획득 난이도, 사용자 선호를 반영한 추천 우선도입니다.</p>
      </section>

      <section className="panel gear-plan-panel">
        <div className="section-head compact"><div><p className="eyebrow">이번 주</p><h2>이번 주 추천 행동</h2></div><Sparkles size={18} /></div>
        <p className="gear-section-copy">{result.weeklyActionPlan.summaryKo}</p>
        <div className="gear-action-list">
          {result.weeklyActionPlan.actions.length ? result.weeklyActionPlan.actions.map((action, index) => (
            <article key={action.id}>
              <span className="rank">{index + 1}</span>
              <div><b>{action.titleKo}</b><p>{action.descriptionKo}</p></div>
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
          {(["all", "replace", "keep", "no_verified_candidate", "insufficient_data"] as const).map((item) => (
            <button key={item} type="button" className={detailsFilter === item ? "active" : ""} onClick={() => setDetailsFilter(item)}>
              {item === "all" ? "전체" : item === "replace" ? "교체 필요" : item === "keep" ? "유지" : item === "no_verified_candidate" ? "후보 없음" : "정보 부족"}
            </button>
          ))}
        </div>
        <div className="slot-detail-grid">
          {visibleSlotDetails.map((slot) => (
            <article key={slot.slot} className={`slot-detail-card ${slot.status}`}>
              <small>{slot.slotLabelKo}</small>
              <b>{slot.status === "replace" ? "교체 필요" : slot.status === "keep" ? "유지" : slot.status === "no_verified_candidate" ? "후보 없음" : "정보 부족"}</b>
              <span>현재: {slot.currentItem?.name || "장비 정보 없음"}</span>
              <span>추천: {slot.recommendedItem ? getDisplayItemName(slot.recommendedItem) : "등록된 추천 없음"}</span>
              <p>{slot.reasonKo}</p>
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
