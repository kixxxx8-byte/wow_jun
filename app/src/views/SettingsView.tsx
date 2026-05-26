import { Brain, RotateCcw, Settings, Wrench } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, DataCard, EmptyState, Panel } from "../components/ui";
import type { Character, V8Settings } from "../types";

type GearStatusSummary = {
  label: string;
  detail: string;
  tone: "ok" | "warn" | "err";
};

export default function SettingsView({
  settings,
  loggedIn,
  userId,
  character,
  selectedGearStatus,
  equipmentSlotCount,
  autoState,
  snapshotHash,
  aiError,
  aiLoading,
  onNoteChange,
  onClear,
  onGenerate,
  onConnect,
}: {
  settings: V8Settings;
  loggedIn: boolean;
  userId: string;
  character: Character;
  selectedGearStatus: GearStatusSummary;
  equipmentSlotCount: number;
  autoState: string;
  snapshotHash: string;
  aiError: string;
  aiLoading: boolean;
  onNoteChange: (note: string) => void;
  onClear: () => void;
  onGenerate: () => void;
  onConnect: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const bnetSummary = settings.lastBnetSyncSummary;
  const bnetSummaryText = bnetSummary
    ? `${bnetSummary.found}개 발견 · ${bnetSummary.synced}개 장비 · ${bnetSummary.partial || 0}개 부분 · ${bnetSummary.stale || 0}개 보관 · ${bnetSummary.staleCleaned || 0}개 정리 · 아이콘 ${bnetSummary.iconRequested || 0}개`
    : "기록 없음";
  const bnetWarnings = settings.lastBnetSyncWarnings || [];
  return (
    <div className="settings-grid">
      <Panel className="notes-panel">
        <div className="section-head"><div><p className="eyebrow">Notes</p><h2>개인 메모</h2></div></div>
        {!loggedIn ? <EmptyState title="로그인 후 메모 저장 가능" body="메모와 완료/숨김 상태는 계정에 저장되는 개인 데이터라 로그인 후 편집할 수 있습니다." /> : null}
        <textarea value={settings.note || ""} onChange={(event) => onNoteChange(event.target.value)} placeholder="예: 오늘은 사론 8단 이상 2회, 장신구 우선, 피곤하면 안전 루트" disabled={!loggedIn} />
      </Panel>
      <Panel>
        <div className="section-head"><div><p className="eyebrow">Settings</p><h2>상태와 초기화</h2></div><Settings size={18} /></div>
        <div className="settings-list">
          <DataCard title="AI 수동 진단" value={autoState} detail={`snapshot ${snapshotHash}`} tone={autoState === "error" ? "err" : autoState === "ready" || autoState === "cached" ? "ok" : "warn"} />
          <DataCard title="Battle.net" value={settings.lastBnetSyncAt ? "동기화 기록 있음" : "기록 없음"} detail={settings.lastBnetSyncAt ? bnetSummaryText : "연결 후 장비 동기화"} tone={settings.lastBnetSyncAt ? "ok" : "warn"} />
          <DataCard title="Raider.IO" value={settings.lastRioRefreshAt ? "갱신 기록 있음" : "기록 없음"} detail={settings.lastRioRefreshAt ? new Date(settings.lastRioRefreshAt).toLocaleString("ko-KR") : "로그인 후 자동 갱신"} tone={settings.lastRioRefreshAt ? "ok" : "warn"} />
        </div>
        <div className="settings-actions">
          <button type="button" onClick={() => setConfirmClear(true)} disabled={!loggedIn}><RotateCcw size={16} /> 완료/숨김 초기화</button>
          <button type="button" onClick={onGenerate} disabled={!loggedIn || aiLoading}><Brain size={16} /> AI 재생성</button>
          <button type="button" onClick={onConnect} disabled={!loggedIn}><Wrench size={16} /> Battle.net 연결</button>
        </div>
        <details className="diagnostics-box">
          <summary>진단 정보</summary>
          <dl>
            <div><dt>UID</dt><dd>{userId || "로그인 전"}</dd></div>
            <div><dt>선택 캐릭터</dt><dd>{character.id || "없음"}</dd></div>
            <div><dt>Snapshot</dt><dd>{snapshotHash}</dd></div>
            <div><dt>Sync run</dt><dd>{bnetSummary?.syncRunId || character.lastSyncRunId || "기록 없음"}</dd></div>
            <div><dt>마지막 Battle.net</dt><dd>{settings.lastBnetSyncAt || "기록 없음"}</dd></div>
            <div><dt>Battle.net 요약</dt><dd>{bnetSummaryText}</dd></div>
            <div><dt>Gear status</dt><dd>{selectedGearStatus.label} · {selectedGearStatus.detail}</dd></div>
            <div><dt>장비 슬롯</dt><dd>{equipmentSlotCount}</dd></div>
            <div><dt>장비 에러</dt><dd>{character.gearError || character.syncError || "없음"}</dd></div>
            <div><dt>부분 동기화</dt><dd>{bnetWarnings.length ? bnetWarnings.slice(0, 6).map((item) => `${item.name} · ${item.realmSlug}${item.stage ? ` · ${item.stage}` : ""}: ${item.error}`).join(" / ") : "없음"}</dd></div>
            <div><dt>마지막 Raider.IO</dt><dd>{settings.lastRioRefreshAt || "기록 없음"}</dd></div>
            <div><dt>최근 AI 에러</dt><dd>{aiError || "없음"}</dd></div>
            <div><dt>배포 경로</dt><dd>/v8/</dd></div>
          </dl>
        </details>
      </Panel>
      {confirmClear ? (
        <ConfirmDialog
          title="완료/숨김을 초기화할까요?"
          body="오늘 완료 처리와 숨김 처리만 비웁니다. 캐릭터, 메모, AI 히스토리는 유지됩니다."
          confirmLabel="초기화"
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            setConfirmClear(false);
            onClear();
          }}
        />
      ) : null}
    </div>
  );
}
