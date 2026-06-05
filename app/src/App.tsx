import {
  Brain,
  Check,
  Database,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AiRequestError, requestTodayPlan } from "./api/ai";
import { getFirebaseServices, type FirebaseUser } from "./api/firebase";
import { requestWowheadBis } from "./api/items";
import { DataCard, EmptyState, MetricCard, Panel, StatusPill, Toast } from "./components/ui";
import { dungeonGuideCatalog } from "./domain/dungeonCatalog";
import { useGearRecommendation } from "./features/gear/hooks/useGearRecommendation";
import { defaultGearCoachPreferences } from "./features/gear/domain/gearRecommendation";
import type { GearCoachPreferences, GearRecommendationMode } from "./features/gear/domain/gearTypes";
import {
  buildFallbackPlan,
  buildSnapshotHash,
  buildTodaySnapshot,
  defaultCharacter,
  defaultPreferences,
  itemIcon,
  normalizeRealm,
  targets,
} from "./domain/planning";
import type {
  AiPlan,
  AiPreferences,
  AiTrigger,
  BnetSyncResponse,
  Character,
  DungeonGuideFeedback,
  EquipmentItem,
  EquipmentRow,
  Target,
  TodaySnapshot,
  TodayTask,
  V8Settings,
  View,
  WowheadBisReport,
} from "./types";

const DungeonsView = lazy(() => import("./views/DungeonsView"));
const AiView = lazy(() => import("./views/AiView"));
const GuidesView = lazy(() => import("./views/GuidesView"));
const SettingsView = lazy(() => import("./views/SettingsView"));
const WythicView = lazy(() => import("./views/WythicView"));
const GearRecommendationPage = lazy(() => import("./features/gear/GearRecommendationPage").then((mod) => ({ default: mod.GearRecommendationPage })));

type RioProfile = {
  thumbnail_url?: string;
  mythic_plus_recent_runs?: Array<Record<string, unknown>>;
  mythic_plus_scores_by_season?: Array<{ scores?: { all?: number; dps?: number } }>;
  gear?: { item_level_equipped?: number };
};

type AutoState = "idle" | "blocked" | "cached" | "generating" | "ready" | "error";
type SelectionPhase = "idle" | "db" | "renewing" | "revealed";

const AI_DAILY_LIMIT = 200;

const views: Array<{ id: View; label: string }> = [
  { id: "today", label: "오늘" },
  { id: "ai", label: "AI 작전실" },
  { id: "gear", label: "장비 점검" },
  { id: "wythic", label: "Wythic" },
  { id: "dungeons", label: "던전" },
  { id: "guides", label: "가이드" },
  { id: "notes", label: "메모/설정" },
];

function todayKey(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function fmt(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString("ko-KR") : "-";
}

function currentCharacter(characters: Character[], activeCharacterId: string) {
  return characters.find((row) => row.id === activeCharacterId) || null;
}

function defaultCharacterId(characters: Character[], savedId?: string) {
  if (!characters.length) return "";
  if (savedId && characters.some((row) => row.id === savedId)) return savedId;
  const knownMain = characters.find((row) => row.name === "승선을준비하라" && normalizeRealm(row.realmSlug || row.realm) === "azshara");
  if (knownMain) return knownMain.id;
  const geared = characters
    .filter((row) => Object.keys(row.equipment || {}).length || row.itemLevel || row.equipped_item_level)
    .sort((a, b) => Number(b.itemLevel || b.equipped_item_level || 0) - Number(a.itemLevel || a.equipped_item_level || 0))[0];
  return geared?.id || characters[0].id;
}

function characterImage(character: Character, rio: RioProfile | null) {
  const media = character.media || {};
  return media.main || media.inset || media.avatar || rio?.thumbnail_url || "";
}

function authName(user: FirebaseUser | null) {
  if (!user) return "연결 전";
  return user.isAnonymous ? "체험 모드" : user.email || user.displayName || "Google";
}

function isPartialCharacter(character: Character) {
  return character.syncStatus === "partial";
}

function isStaleCharacter(character: Character) {
  return character.syncStatus === "stale";
}

function characterIdentityKey(character: Character) {
  return [
    (character.name || "").trim().toLowerCase(),
    (character.realmSlug || character.realm || "").trim().toLowerCase(),
    (character.region || "kr").trim().toLowerCase(),
  ].join("|");
}

function characterPickerRank(character: Character) {
  if (isStaleCharacter(character)) return 30;
  if (isPartialCharacter(character)) return 20;
  if (character.gearStatus === "ok") return 0;
  return 10;
}

function dedupeCharactersForPicker(characters: Character[]) {
  const bestByKey = new Map<string, Character>();
  characters.forEach((character) => {
    const key = characterIdentityKey(character);
    const current = bestByKey.get(key);
    if (!current || characterPickerRank(character) < characterPickerRank(current)) {
      bestByKey.set(key, character);
    }
  });
  const visibleIds = new Set(Array.from(bestByKey.values()).map((character) => character.id));
  return characters.filter((character) => visibleIds.has(character.id));
}

function equipmentSlotCount(character: Character) {
  return character.equipmentSlotCount ?? Object.keys(character.equipment || {}).length;
}

function gearStatusCopy(character: Character) {
  const count = equipmentSlotCount(character);
  if (isStaleCharacter(character) || character.gearStatus === "stale") return { label: "이전 캐릭터", detail: "이번 동기화 목록에 없음", tone: "warn" as const };
  if (character.gearStatus === "failed") return { label: "장비 조회 실패", detail: character.gearError || character.syncError || "장비 상세 조회 실패", tone: "err" as const };
  if (character.gearStatus === "empty" || !count) return { label: "장비 없음", detail: "Battle.net 장비 동기화 필요", tone: "err" as const };
  return { label: "장비 동기화", detail: `${count} slots · ${character.gearSyncedAt ? new Date(character.gearSyncedAt).toLocaleString("ko-KR") : "시간 기록 없음"}`, tone: "ok" as const };
}

function itemLevelInfo(character: Character, rio: RioProfile | null) {
  const bnetLevel = character.itemLevel || character.equipped_item_level || 0;
  const rioLevel = rio?.gear?.item_level_equipped || 0;
  if (bnetLevel) return { value: bnetLevel, source: "Battle.net" };
  if (rioLevel) return { value: rioLevel, source: "Raider.IO" };
  return { value: 0, source: "" };
}

function isPlanStale(plan: AiPlan | null, snapshotHash: string) {
  return Boolean(plan && plan.model !== "local-fallback" && plan.snapshotHash && plan.snapshotHash !== snapshotHash);
}

function slotInitial(label: string) {
  return label.replace(/\s+/g, "").slice(0, 2).toUpperCase();
}

function numericItemId(item?: EquipmentItem | null, target?: Target | null) {
  const raw = item?.id ?? target?.itemId;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function wowheadUrl(itemId: number, target?: Target | null) {
  return itemId ? `https://www.wowhead.com/ko/item=${itemId}` : target?.wowheadUrl || "https://www.wowhead.com/ko/";
}

function wythicCharacterUrl(character: Character) {
  const region = (character.region || "kr").toLowerCase();
  const realm = normalizeRealm(character.realmSlug || character.realm || "azshara");
  const name = encodeURIComponent(character.name || "");
  return `https://wythic.com/ko/character/${region}/${realm}/${name}`;
}

function equipmentTooltipLines(item?: EquipmentItem | null) {
  const lines: string[] = [];
  const level = Number(item?.level || item?.itemLevel || 0);
  if (level) lines.push(`아이템 레벨 ${level}`);
  (item?.stats || []).forEach((stat) => {
    const label = stat.display || [stat.name, stat.value ? `+${stat.value}` : ""].filter(Boolean).join(" ");
    if (label) lines.push(label);
  });
  (item?.enchantments || []).forEach((entry) => {
    const value = typeof entry === "string" ? entry : entry.displayString || entry.display || entry.name || "";
    if (value) lines.push(`마법부여: ${value}`);
  });
  (item?.sockets || []).forEach((entry) => {
    const value = typeof entry === "string" ? entry : entry.displayString || entry.display || entry.item?.name || "";
    if (value) lines.push(`보석: ${value}`);
  });
  return lines;
}

function TooltipFallbackCard({
  itemId,
  name,
  item,
  style,
  onClose,
}: {
  itemId: number;
  name: string;
  item?: EquipmentItem | null;
  style?: CSSProperties;
  onClose: () => void;
}) {
  const equippedLines = equipmentTooltipLines(item);
  const exactEquippedItem = Boolean(item);
  return (
    <section className="wow-fallback-tooltip" role="tooltip" style={style}>
      <button type="button" className="tooltip-close" onClick={onClose} aria-label="툴팁 닫기"><X size={14} /></button>
      {!itemId ? (
        <>
          <b>툴팁 준비중</b>
          <p>{name}</p>
          <small>공식 item ID가 아직 연결되지 않았습니다.</small>
        </>
      ) : exactEquippedItem ? (
        <>
          <b>{name}</b>
          {equippedLines.length ? equippedLines.slice(0, 10).map((line) => <span key={line}>{line}</span>) : <p>현재 동기화된 착용 장비 정보입니다.</p>}
          <small>보너스 ID/강화 단계가 없는 일반 itemId 조회값은 표시하지 않습니다.</small>
          <a href={wowheadUrl(itemId)} target="_blank" rel="noreferrer">Wowhead에서 보기</a>
        </>
      ) : (
        <>
          <b>{name}</b>
          <p>이 후보는 itemId만으로는 강화 단계, 등급, 보너스 ID를 확정할 수 없어 수치 툴팁을 표시하지 않습니다.</p>
          <small>정확한 수치는 Wowhead 원문 또는 Battle.net 동기화된 착용 장비 기준으로 확인하세요.</small>
          <a href={wowheadUrl(itemId)} target="_blank" rel="noreferrer">Wowhead에서 보기</a>
        </>
      )}
    </section>
  );
}

function ItemTooltipAnchor({
  item,
  target,
  label,
  iconUrl,
  className,
  placeholder,
}: {
  item?: EquipmentItem | null;
  target?: Target | null;
  label: string;
  iconUrl?: string;
  className: string;
  placeholder: string;
}) {
  const itemId = numericItemId(item, target);
  const name = item?.name || target?.tooltipName || target?.target || label;
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const updatePosition = () => {
    const node = anchorRef.current;
    if (!node || typeof window === "undefined") return;
    const rect = node.getBoundingClientRect();
    if (window.matchMedia("(max-width: 759px)").matches) {
      setPosition({});
      return;
    }
    const width = Math.min(340, window.innerWidth - 28);
    const left = Math.min(Math.max(rect.left + rect.width / 2, width / 2 + 12), window.innerWidth - width / 2 - 12);
    const top = rect.top > 260 ? rect.top - 12 : rect.bottom + 12;
    setPosition({
      left,
      top,
      width,
      transform: rect.top > 260 ? "translate(-50%, -100%)" : "translate(-50%, 0)",
    });
  };
  const openFallback = (forcePinned: boolean) => {
    updatePosition();
    setPinned(forcePinned);
    setFallbackOpen(true);
  };
  const closeFallback = () => {
    setPinned(false);
    setFallbackOpen(false);
  };

  useEffect(() => {
    if (!fallbackOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFallback();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [fallbackOpen]);

  return (
    <span className="tooltip-anchor-wrap" onMouseLeave={() => { if (!pinned) setFallbackOpen(false); }}>
      <a
        ref={anchorRef}
        className={`tooltip-item-anchor ${className}`}
        href={wowheadUrl(itemId, target)}
        target="_blank"
        rel="noreferrer"
        aria-label={`${name} 아이템 툴팁`}
        onMouseEnter={() => openFallback(false)}
        onFocus={() => openFallback(true)}
        onClick={(event) => {
          event.preventDefault();
          openFallback(true);
        }}
        style={iconUrl ? { backgroundImage: `url(${iconUrl})` } : undefined}
      >
        {!iconUrl ? placeholder : null}
      </a>
      {fallbackOpen ? <TooltipFallbackCard itemId={itemId} name={name} item={item} style={position} onClose={closeFallback} /> : null}
    </span>
  );
}

function GearItemIcon({ item, target, label, className = "" }: { item?: EquipmentRow["equippedItem"]; target?: Target | null; label: string; className?: string }) {
  const iconUrl = itemIcon(item || null) || target?.icon || "";
  return (
    <ItemTooltipAnchor
      item={item || undefined}
      target={target || undefined}
      label={label}
      iconUrl={iconUrl}
      className={`item-icon ${className} ${iconUrl ? "" : "placeholder"}`}
      placeholder={slotInitial(label)}
    />
  );
}

function TargetItemIcon({ target, className = "", placeholder = "목표" }: { target?: Target | null; className?: string; placeholder?: string }) {
  if (!target) return null;
  return (
    <ItemTooltipAnchor
      target={target}
      label={target.target}
      iconUrl={target.icon}
      className={`item-icon ${className} ${target.icon ? "" : "placeholder"}`}
      placeholder={placeholder}
    />
  );
}

function targetById(id?: string | null) {
  if (!id) return null;
  const target = targets.find((row) => row.id === id) || null;
  return target?.itemId ? null : target;
}

function targetByTask(task: TodayTask) {
  const target = targets.find((row) => row.id === task.id || row.target === task.itemName) || null;
  return target?.itemId ? null : target;
}

function isReferenceBisText(...values: Array<unknown>) {
  const text = values.filter(Boolean).join(" ");
  return /BIS 교체 후보|참고 BIS|시즌 BIS|wowhead-bis|Wowhead 암살 도적 BIS/i.test(text);
}

function isReferenceBisTask(task: TodayTask) {
  return isReferenceBisText(task.id, task.title, task.itemName, task.body, task.detail);
}

function isReferenceBisAction(action: AiPlan["actions"][number]) {
  return isReferenceBisText(action.targetId, action.title, action.reason, ...action.evidence);
}

const dungeonNameKoAliases: Record<string, string> = {
  "skyreach": "하늘탑",
  "maisara": "마이사라 동굴",
  "maisara caverns": "마이사라 동굴",
  "windrunner": "윈드러너 첨탑",
  "windrunner spire": "윈드러너 첨탑",
  "nexus-point xenas": "연결지점 제나스",
  "nexus point xenas": "연결지점 제나스",
  "xenas": "연결지점 제나스",
  "magisters' terrace": "마법학자의 정원",
  "magisters terrace": "마법학자의 정원",
  "algethar academy": "알게타르 대학",
  "algeth'ar academy": "알게타르 대학",
  "pit of saron": "사론의 구덩이",
  "seat of the triumvirate": "삼두정의 권좌",
};

function runName(run: Record<string, unknown>) {
  const raw = String(run.dungeon || run.short_name || run.name || "던전");
  const key = raw.trim().toLowerCase();
  return dungeonNameKoAliases[key] || dungeonNameKoAliases[key.replace(/[-_]/g, " ")] || raw;
}

function runCompletedAt(run: Record<string, unknown>) {
  const raw = String(run.completed_at || "");
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "최근";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function aiStatusCopy(autoState: AutoState, fallback: boolean, generatedAt: string, rateLimitKind: "minute" | "daily" | null) {
  if (rateLimitKind === "daily") return { title: "오늘 한도 도달", detail: "기본 판단은 계속 사용할 수 있고, 내일 다시 AI 생성을 쓸 수 있습니다.", tone: "warn" as const };
  if (rateLimitKind === "minute") return { title: "잠시 후 재시도", detail: "AI는 1분에 한 번 생성됩니다. 현재 화면은 기본 판단으로 유지됩니다.", tone: "warn" as const };
  if (autoState === "ready") return { title: "수동 판단 준비", detail: `생성 시각 ${new Date(generatedAt).toLocaleString("ko-KR")}`, tone: "ok" as const };
  if (autoState === "cached") return { title: "저장된 판단", detail: "이전에 직접 생성한 AI 판단을 표시하고 있습니다.", tone: "ok" as const };
  if (autoState === "generating") return { title: "AI 생성 중", detail: "오늘 데이터와 선호 조건을 묶어 실행 순서를 계산하고 있습니다.", tone: "warn" as const };
  if (autoState === "blocked") return { title: "데이터 대기", detail: "캐릭터 선택 또는 Battle.net 장비 동기화가 필요합니다.", tone: "warn" as const };
  if (autoState === "error" || fallback) return { title: "기본 판단 사용", detail: "AI가 실패해도 장비/던전 계산으로 오늘 할 일은 계속 볼 수 있습니다.", tone: "err" as const };
  return { title: "AI 수동 대기", detail: "원할 때 버튼을 눌렀을 때만 AI 진단을 실행합니다.", tone: "warn" as const };
}

function ReadOnlyPreviewNotice({ loggedIn, onLogin }: { loggedIn: boolean; onLogin: () => void }) {
  return (
    <section className="preview-strip panel">
      <div>
        <p className="eyebrow">읽기용 미리보기</p>
        <b>{loggedIn ? "캐릭터 선택 전 기본 데이터 기준입니다." : "로그인 전 기본 데이터 기준입니다."}</b>
        <span>오늘 판단, 장비 점검, 던전 공략은 미리 볼 수 있고 저장/동기화/AI 생성은 잠겨 있습니다.</span>
      </div>
      {!loggedIn ? <button className="primary-btn" type="button" onClick={onLogin}><LogIn size={16} /> 로그인하고 내 캐릭터 보기</button> : null}
    </section>
  );
}

function ViewLoading() {
  return (
    <section className="panel view-loading" role="status">
      <Loader2 className="spin" size={18} />
      <span>화면을 불러오는 중입니다.</span>
    </section>
  );
}

function SelectionStageBanner({ phase }: { phase: SelectionPhase }) {
  if (phase === "idle") return null;
  const copy = phase === "db"
    ? { title: "저장된 DB 표시 중", body: "먼저 Firestore에 저장된 캐릭터/장비/메모 기준 화면을 즉시 보여드립니다." }
    : phase === "renewing"
      ? { title: "가볍게 리뉴얼 중", body: "화면 밀도와 최신 상태를 정돈하는 중입니다." }
      : { title: "리뉴얼 화면 준비 완료", body: "이제 AI 진단을 실행할지 직접 선택할 수 있습니다." };
  return (
    <div className={`selection-stage ${phase}`}>
      <Sparkles size={16} />
      <div>
        <b>{copy.title}</b>
        <span>{copy.body}</span>
      </div>
    </div>
  );
}

function RenewalOverlay() {
  return (
    <div className="renewal-overlay" role="status" aria-live="polite">
      <section className="renewal-modal">
        <div className="mystic-frame">
          <Sparkles size={22} />
          <span />
          <span />
        </div>
        <p className="eyebrow">Light Renewal</p>
        <h2>리뉴얼 중입니다</h2>
        <p>저장된 DB를 화면에 맞게 정렬하고, 오늘 판단에 필요한 신호를 정돈하고 있습니다.</p>
        <div className="mystic-scan"><i /></div>
      </section>
    </div>
  );
}

function AiDiagnosisDialog({
  characterName,
  onYes,
  onNo,
}: {
  characterName: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="dialog-backdrop diagnosis-backdrop" role="presentation">
      <section className="confirm-dialog diagnosis-dialog panel" role="dialog" aria-modal="true" aria-labelledby="diagnosis-title">
        <div className="dialog-icon"><Brain size={22} /></div>
        <h2 id="diagnosis-title">AI 진단 하시겠습니까?</h2>
        <p>{characterName}의 저장된 장비, 오늘 할 일, 던전 추천을 기준으로 오늘의 실행 순서를 생성합니다.</p>
        <div className="dialog-actions">
          <button type="button" onClick={onNo}>아니오</button>
          <button className="primary-btn" type="button" onClick={onYes}><Sparkles size={16} /> 예, 진단</button>
        </div>
      </section>
    </div>
  );
}

function TodayView({
  loggedIn,
  snapshot,
  plan,
  fallback,
  aiError,
  autoState,
  rateLimitKind,
  onGenerate,
  aiLoading,
  onDone,
  onHide,
  onJump,
  onSync,
  syncLoading,
  recentRuns,
}: {
  loggedIn: boolean;
  snapshot: TodaySnapshot;
  plan: AiPlan;
  fallback: boolean;
  aiError: string;
  autoState: AutoState;
  rateLimitKind: "minute" | "daily" | null;
  onGenerate: () => void;
  aiLoading: boolean;
  onDone: (id?: string | null) => void;
  onHide: (id: string) => void;
  onJump: (view: View) => void;
  onSync: () => void;
  syncLoading: boolean;
  recentRuns: Array<Record<string, unknown>>;
}) {
  const aiStatus = aiStatusCopy(autoState, fallback, plan.generatedAt, rateLimitKind);
  const gearActions = snapshot.gearRecommendation?.weeklyActionPlan.actions || [];
  const gearPriorityUpgrades = snapshot.gearRecommendation?.priorityUpgrades || [];
  const topDungeonRoute = snapshot.gearRecommendation?.farmingRoutes.find((route) => route.routeType === "dungeon");
  const topDungeonGuide = topDungeonRoute?.sourceKey ? dungeonGuideCatalog.find((guide) => guide.id === topDungeonRoute.sourceKey) : dungeonGuideCatalog.find((guide) => guide.cinematicGuide?.audit.needsUserFeedback) || dungeonGuideCatalog.find((guide) => guide.id === "windrunner");
  const visiblePlanActions = plan.actions.filter((action) => !isReferenceBisAction(action));
  const visibleTodayTasks = snapshot.todayTasks.filter((task) => !isReferenceBisTask(task));
  const snapshotTargets = useMemo(() => {
    const map = new Map<string, Target>();
    snapshot.equipmentRows.forEach((row) => {
      if (row.target) map.set(row.target.id, row.target);
    });
    return map;
  }, [snapshot.equipmentRows]);
  const targetFor = (id?: string | null) => id ? snapshotTargets.get(id) || targetById(id) : null;
  return (
    <div className="view-stack">
      <section className="today-hero panel">
        <div>
          <p className="eyebrow">Today</p>
          <h1>{plan.title}</h1>
          <p>{plan.summary}</p>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={onGenerate} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="spin" size={17} /> : <Brain size={17} />}
              {loggedIn ? "AI 다시 판단" : "로그인하고 AI 판단"}
            </button>
            <button type="button" onClick={onSync} disabled={!loggedIn || syncLoading}>
              {syncLoading ? <Loader2 className="spin" size={17} /> : <Database size={17} />}
              장비 동기화
            </button>
            <button type="button" onClick={() => onJump("ai")}>AI 작전실 보기</button>
          </div>
        </div>
        <div className="ai-status-card">
          <small>AI 수동 진단</small>
          <StatusPill tone={aiStatus.tone}>{fallback ? "fallback" : plan.mode}</StatusPill>
          <b>{aiStatus.title}</b>
          <span>{aiStatus.detail}</span>
        </div>
      </section>
      <section className="coach-brief panel" aria-label="오늘 개인 코치 요약">
        <article>
          <p className="eyebrow">오늘 할 일</p>
          <h2>{gearActions[0]?.titleKo || visiblePlanActions[0]?.title || "장비 데이터 확인"}</h2>
          <span>{gearActions[0]?.descriptionKo || visiblePlanActions[0]?.reason || "내 캐릭터 기준 판단을 위해 장비 동기화와 기본 데이터를 먼저 확인합니다."}</span>
        </article>
        <article>
          <p className="eyebrow">장비에서 확인할 것</p>
          <h2>{gearPriorityUpgrades.length ? `${gearPriorityUpgrades.length}개 후보` : "장비 추천 없음"}</h2>
          <span>{gearPriorityUpgrades.length ? "검증된 후보만 장비 점검에 노출합니다." : "이유: 검증 후보 부족 · 다음 행동: Battle.net 동기화 / DB 보강 / SimC 확인"}</span>
          <button type="button" onClick={() => onJump("gear")}>장비 점검 보기</button>
        </article>
        <article>
          <p className="eyebrow">주의할 던전/패턴</p>
          <h2>{topDungeonGuide?.name || "던전 공략 확인"}</h2>
          <span>{topDungeonGuide?.cinematicGuide?.survivalFocusKo[0] || "오늘 죽지 말 것 3개를 먼저 확인합니다."}</span>
          <button type="button" onClick={() => onJump("dungeons")}>던전 공략 보기</button>
        </article>
        <article>
          <p className="eyebrow">AI 설명 상태</p>
          <h2>{aiStatus.title}</h2>
          <span>AI는 추천을 만들지 않고 현재 확인된 결과만 설명합니다.</span>
          <button type="button" onClick={() => onJump("ai")}>AI 설명 보기</button>
        </article>
      </section>
      <section className="now-strip panel">
        <div>
          <p className="eyebrow">Now</p>
          <h2>지금 할 일 3개</h2>
        </div>
        <div className="now-actions">
          {gearActions.length ? gearActions.slice(0, 3).map((action, index) => (
            <article key={action.id}>
              <span>{index + 1}</span>
              <b>{action.titleKo}</b>
              <small>{action.priority} · 장비 코치</small>
            </article>
          )) : visiblePlanActions.slice(0, 3).map((action) => {
            const target = targetFor(action.targetId);
            return (
              <article key={`${action.rank}-${action.title}`}>
                {target ? <TargetItemIcon target={target} className="now-item-icon" /> : <span>{action.rank}</span>}
                <b>{action.title}</b>
                <small>{action.estimatedTime} · {action.type}</small>
              </article>
            );
          })}
        </div>
      </section>
      {snapshot.gearRecommendation ? (
        <section className="panel today-gear-coach">
          <div className="section-head compact"><div><p className="eyebrow">장비 코치</p><h2>{snapshot.gearRecommendation.modeLabelKo}</h2></div><ShieldCheck size={18} /></div>
          <p>{snapshot.gearRecommendation.summaryKo}</p>
          <div className="today-gear-actions">
            {snapshot.gearRecommendation.priorityUpgrades.slice(0, 3).map((upgrade) => (
              <article key={`${upgrade.slot}-${upgrade.recommendedItem.itemId}`}>
                <b>{upgrade.slotLabelKo}</b>
                <span>{upgrade.recommendedItem.nameKo || "한국어 이름 확인 중"} · {upgrade.sourceNameKo}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="data-grid">
        <DataCard title="Battle.net" value={snapshot.dataFreshness.bnet.label} detail={snapshot.dataFreshness.bnet.detail} tone={snapshot.dataFreshness.bnet.tone} />
        <DataCard title="Raider.IO" value={snapshot.dataFreshness.rio.label} detail={snapshot.dataFreshness.rio.detail} tone={snapshot.dataFreshness.rio.tone} />
        <DataCard title="Cloud" value={snapshot.dataFreshness.cloud.label} detail={snapshot.dataFreshness.cloud.detail} tone={snapshot.dataFreshness.cloud.tone} />
        <DataCard title="오늘 실행" value={`${visibleTodayTasks.length}개`} detail={fallback ? "기본 계산 기준" : "AI 판단 반영"} tone={fallback ? "warn" : "ok"} />
      </div>
      <section className="split-grid">
        <div className="panel">
          <div className="section-head">
            <div><p className="eyebrow">Execute</p><h2>오늘 액션</h2></div>
          </div>
          <div className="task-list">
            {visibleTodayTasks.map((task, index) => {
              const target = targetFor(task.id) || targetByTask(task);
              return (
                <article key={task.id} className={`task-card ${task.done ? "done" : ""} ${target ? "with-icon" : ""}`}>
                  <span className="rank">{index + 1}</span>
                  {target ? <TargetItemIcon target={target} className="task-item-icon" /> : null}
                  <div>
                    <div className="line"><b>{task.title}</b><small>{task.action}</small></div>
                    <strong>{task.itemName}</strong>
                    <p>{task.body} · {task.detail}</p>
                  </div>
                  <div className="row-actions">
                    {task.command ? <button type="button" disabled={!loggedIn || syncLoading} onClick={onSync}>{task.button || "실행"}</button> : null}
                    {task.view ? <button type="button" onClick={() => onJump(task.view!)}>보기</button> : null}
                    <button type="button" disabled={!loggedIn} onClick={() => onDone(task.id)}><Check size={15} /> 완료</button>
                    <button type="button" disabled={!loggedIn} onClick={() => onHide(task.id)}><X size={15} /> 숨김</button>
                  </div>
                </article>
              );
            })}
            {!visibleTodayTasks.length ? <EmptyState title="오늘 액션 없음" body="참고 BIS 기반 이전 항목은 숨겼습니다. 장비 동기화 후 다시 판단하세요." /> : null}
          </div>
        </div>
        <div className="panel">
          <div className="section-head">
            <div><p className="eyebrow">Recent</p><h2>최근 기록</h2></div>
          </div>
          <div className="run-list">
            {recentRuns.length ? recentRuns.slice(0, 6).map((run, index) => (
              <article key={`${runName(run)}-${index}`} className="run-card">
                <b>{runName(run)}</b>
                <span><em>+{String(run.mythic_level || "?")}</em><em>{run.score ? `${Math.round(Number(run.score))}점` : "점수 없음"}</em><em>{runCompletedAt(run)}</em></span>
              </article>
            )) : <EmptyState title="최근 기록 없음" body={aiError || "Raider.IO 갱신 후 최근 런을 확인할 수 있습니다."} />}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState("");
  const [settings, setSettings] = useState<V8Settings>({ done: {}, hidden: {}, note: "", lastView: "today" });
  const [rio, setRio] = useState<RioProfile | null>(null);
  const [rioError, setRioError] = useState("");
  const [rioFetchedAt, setRioFetchedAt] = useState("");
  const [bisReport, setBisReport] = useState<WowheadBisReport | null>(null);
  const [bisLoading, setBisLoading] = useState(false);
  const [bisError, setBisError] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [view, setView] = useState<View>("today");
  const [preferences, setPreferences] = useState<AiPreferences>(defaultPreferences());
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [historyPlans, setHistoryPlans] = useState<AiPlan[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiRateLimitKind, setAiRateLimitKind] = useState<"minute" | "daily" | null>(null);
  const [autoState, setAutoState] = useState<AutoState>("idle");
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [selectionPhase, setSelectionPhase] = useState<SelectionPhase>("idle");
  const [showAiDiagnosis, setShowAiDiagnosis] = useState(false);
  const bootSyncRef = useRef("");
  const selectionTimersRef = useRef<number[]>([]);

  const loggedIn = Boolean(user && !user.isAnonymous);
  const pickerCharacters = useMemo(() => dedupeCharactersForPicker(characters), [characters]);
  const selectedCharacter = useMemo(() => currentCharacter(characters, activeCharacterId), [characters, activeCharacterId]);
  const character = selectedCharacter || defaultCharacter;
  const hasSelectedCharacter = Boolean(selectedCharacter);
  const isReadOnlyPreview = !loggedIn || !hasSelectedCharacter;
  const recentRuns = rio?.mythic_plus_recent_runs || [];
  const gearCoachPreferences = useMemo(
    () => ({ ...defaultGearCoachPreferences(), ...(settings.gearCoachPreferences || {}) }),
    [settings.gearCoachPreferences],
  );
  const gearRecommendation = useGearRecommendation(character, gearCoachPreferences.defaultMode, gearCoachPreferences);
  const snapshot = useMemo(
    () => {
      const baseSnapshot = buildTodaySnapshot({
        character,
        done: settings.done,
        hidden: settings.hidden,
        recentRuns,
        cloudReady,
        rioError,
        lastRioRefreshAt: rioFetchedAt || settings.lastRioRefreshAt,
      });
      return { ...baseSnapshot, gearRecommendation };
    },
    [character, settings.done, settings.hidden, settings.lastRioRefreshAt, recentRuns, cloudReady, rioError, rioFetchedAt, gearRecommendation],
  );
  const snapshotHash = useMemo(() => buildSnapshotHash(snapshot, preferences), [snapshot, preferences]);
  const fallbackPlan = useMemo(() => buildFallbackPlan(snapshot, preferences), [snapshot, preferences]);
  const activePlan = isPlanStale(plan, snapshotHash) ? fallbackPlan : plan || fallbackPlan;
  const avatar = characterImage(character, rio);
  const commandHeroStyle = hasSelectedCharacter && avatar
    ? ({ "--character-hero": `url(${avatar})` } as CSSProperties)
    : undefined;
  const score = rio?.mythic_plus_scores_by_season?.[0]?.scores?.all || rio?.mythic_plus_scores_by_season?.[0]?.scores?.dps || 0;
  const ilvl = itemLevelInfo(character, rio);
  const selectedGearStatus = gearStatusCopy(character);
  const activePlanStale = isPlanStale(plan, snapshotHash);
  const displayedAiUsage = Math.min(aiUsageCount, AI_DAILY_LIMIT);

  function clearSelectionTimers() {
    selectionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    selectionTimersRef.current = [];
  }

  useEffect(() => {
    if (!activeCharacterId) return;
    if (pickerCharacters.some((row) => row.id === activeCharacterId)) return;
    const active = currentCharacter(characters, activeCharacterId);
    if (!active) {
      setActiveCharacterId("");
      return;
    }
    const replacement = pickerCharacters.find((row) => characterIdentityKey(row) === characterIdentityKey(active));
    setActiveCharacterId(replacement?.id || "");
  }, [activeCharacterId, characters, pickerCharacters]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: undefined | (() => void);
    const resetCloudState = () => {
      setUser(null);
      setCloudReady(false);
      setCharacters([]);
      setActiveCharacterId("");
      setSelectionPhase("idle");
      setShowAiDiagnosis(false);
      setAiUsageCount(0);
      setSettings({ done: {}, hidden: {}, note: "", lastView: "today" });
    };

    void getFirebaseServices()
      .then(({ auth, onAuthStateChanged, signOut }) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
          if (!nextUser) {
            resetCloudState();
            return;
          }
          if (nextUser.isAnonymous) {
            resetCloudState();
            await signOut(auth).catch(() => undefined);
            return;
          }
          setUser(nextUser);
          await loadCloud(nextUser);
        });
      })
      .catch(() => {
        if (!cancelled) resetCloudState();
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => clearSelectionTimers, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bnet = params.get("bnet");
    if (!bnet) return;
    if (bnet === "connected") {
      setToast("Battle.net 연결 완료. 장비 동기화를 시작합니다.");
    } else if (bnet.startsWith("error:")) {
      setToast(`Battle.net 연결 실패: ${bnet.slice("error:".length)}`);
    }
    params.delete("bnet");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (!loggedIn || !cloudReady || !hasSelectedCharacter || !character.name) return;
    const key = `${user?.uid}:${character.id}:rio`;
    if (bootSyncRef.current === key) return;
    bootSyncRef.current = key;
    void refreshRaiderIO(false);
  }, [loggedIn, cloudReady, hasSelectedCharacter, character.id]);

  useEffect(() => {
    if (!loggedIn || !cloudReady || !user) return;
    void refreshWowheadBis(false, true);
  }, [loggedIn, cloudReady, user?.uid]);

  useEffect(() => {
    if (!loggedIn || !cloudReady || !user || !hasSelectedCharacter) {
      setAutoState(loggedIn ? "idle" : "blocked");
      return;
    }
    if (!Object.keys(character.equipment || {}).length) {
      setAutoState("blocked");
      return;
    }
    setAutoState(plan && plan.model !== "local-fallback" ? "ready" : "idle");
  }, [loggedIn, cloudReady, hasSelectedCharacter, character.id, character.equipment, plan?.id, plan?.model]);

  async function loadCloud(nextUser: FirebaseUser) {
    const { db, collection, doc, getDoc, getDocs, limit, orderBy, query } = await getFirebaseServices();
    const userRef = doc(db, "wowGuideUsers", nextUser.uid);
    const [v8Snap, mainSnap, charsSnap, plansSnap, usageSnap] = await Promise.all([
      getDoc(doc(userRef, "settings", "v8")),
      getDoc(doc(userRef, "settings", "main")).catch(() => null),
      getDocs(collection(userRef, "characters")),
      getDocs(query(collection(userRef, "aiPlans"), orderBy("generatedAt", "desc"), limit(10))).catch(() => null),
      getDoc(doc(userRef, "aiUsage", todayKey())).catch(() => null),
    ]);

    const loadedCharacters: Character[] = [];
    charsSnap.forEach((row) => loadedCharacters.push({ id: row.id, ...(row.data() as Omit<Character, "id">) }));
    const nextCharacters = loadedCharacters;
    const nextSettings = { done: {}, hidden: {}, note: "", lastView: "today", ...(v8Snap.exists() ? v8Snap.data() as V8Settings : {}) };
    const mainSettings = mainSnap?.exists() ? mainSnap.data() as { activeCharacterId?: string } : {};
    const nextActiveCharacterId = defaultCharacterId(nextCharacters, nextSettings.activeCharacterId || mainSettings.activeCharacterId);
    setCharacters(nextCharacters);
    setSettings(nextSettings);
    setActiveCharacterId(nextActiveCharacterId);
    setSelectionPhase("idle");
    setShowAiDiagnosis(false);
    setView((views.some((item) => item.id === nextSettings.lastView) ? nextSettings.lastView : "today") as View);
    const loadedPlans: AiPlan[] = [];
    plansSnap?.forEach((row) => loadedPlans.push(row.data() as AiPlan));
    setHistoryPlans(loadedPlans);
    if (loadedPlans[0]) setPlan(loadedPlans[0]);
    const usageCount = Number(usageSnap?.data()?.count || 0);
    setAiUsageCount(Number.isFinite(usageCount) ? Math.max(0, usageCount) : 0);
    setCloudReady(true);
  }

  async function googleLogin() {
    const { auth, GoogleAuthProvider, signInWithPopup } = await getFirebaseServices();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (["auth/credential-already-in-use", "auth/email-already-in-use", "auth/provider-already-linked"].includes(code || "")) {
        await signInWithPopup(auth, provider);
        return;
      }
      setToast("Google 로그인을 완료하지 못했습니다.");
    }
  }

  async function saveSettings(patch: Partial<V8Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (!loggedIn || !user) return;
    const { db, doc, serverTimestamp, setDoc } = await getFirebaseServices();
    await setDoc(doc(db, "wowGuideUsers", user.uid, "settings", "v8"), { ...next, updatedAt: serverTimestamp() }, { merge: true });
  }

  async function saveDungeonGuideFeedback(input: Omit<DungeonGuideFeedback, "id" | "createdAt">) {
    if (!loggedIn || !user) {
      setToast("로그인 후 공략 피드백 저장 가능");
      return;
    }
    const createdAt = new Date().toISOString();
    const nextFeedback: DungeonGuideFeedback = {
      ...input,
      id: `${input.dungeonId}-${input.phaseId || input.bossName || "general"}-${Date.now()}`,
      createdAt,
    };
    await saveSettings({
      dungeonGuideFeedback: [nextFeedback, ...(settings.dungeonGuideFeedback || [])].slice(0, 80),
    });
    setToast("공략 피드백을 저장했습니다.");
  }

  async function refreshRaiderIO(force = true) {
    if (!hasSelectedCharacter || !character.name) return;
    const url = new URL("https://raider.io/api/v1/characters/profile");
    url.searchParams.set("region", (character.region || "kr").toLowerCase());
    url.searchParams.set("realm", normalizeRealm(character.realmSlug || character.realm));
    url.searchParams.set("name", character.name);
    url.searchParams.set("fields", "mythic_plus_scores_by_season:current,mythic_plus_recent_runs,gear");
    try {
      if (force) setToast("Raider.IO 갱신 중");
      const res = await fetch(url.toString());
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || `Raider.IO ${res.status}`);
      setRio(body as RioProfile);
      setRioError("");
      const fetchedAt = new Date().toISOString();
      setRioFetchedAt(fetchedAt);
      if (force) {
        await saveSettings({ lastRioRefreshAt: fetchedAt });
        setToast("Raider.IO 갱신 완료");
      }
    } catch (err) {
      setRio(null);
      setRioError(err instanceof Error ? err.message : "Raider.IO 조회 실패");
      if (force) setToast("Raider.IO에서 캐릭터를 찾지 못했습니다.");
    }
  }

  async function refreshWowheadBis(force = true, silent = false) {
    if (!loggedIn || !user) {
      if (!silent) await googleLogin();
      return;
    }
    setBisLoading(true);
    setBisError("");
    try {
      if (force && !silent) setToast("참고 BIS 새로고침 중");
      const token = await user.getIdToken(true);
      const report = await requestWowheadBis(token, force);
      setBisReport(report);
      await saveSettings({ lastWowheadBisRefreshAt: report.fetchedAt });
      if (force && !silent) setToast("참고 BIS 비교 갱신 완료");
    } catch (err) {
      const message = err instanceof Error ? err.message : "참고 BIS 조회 실패";
      setBisError(message);
      if (!silent) setToast(message);
    } finally {
      setBisLoading(false);
    }
  }

  async function syncBattleNet(silent = false) {
    if (!loggedIn || !user) {
      if (!silent) await googleLogin();
      return;
    }
    setSyncLoading(true);
    try {
      if (!silent) setToast("Battle.net 장비 동기화 중");
      const token = await user.getIdToken(true);
      const res = await fetch("/api/bnet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ characterId: activeCharacterId || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as BnetSyncResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || `동기화 실패 (${res.status})`);
      if (Array.isArray(data.characters) && data.characters.length) {
        const nextCharacters = data.characters;
        const nextActiveCharacterId = defaultCharacterId(nextCharacters, activeCharacterId || settings.activeCharacterId);
        setCharacters(nextCharacters);
        setActiveCharacterId(nextActiveCharacterId);
        if (nextActiveCharacterId) {
          setPlan(null);
          setAiError("");
          setAiRateLimitKind(null);
          setAutoState("idle");
          if (nextActiveCharacterId !== settings.activeCharacterId) {
            void saveSettings({ activeCharacterId: nextActiveCharacterId });
          }
        } else if (activeCharacterId) {
          setPlan(null);
          setRio(null);
          setRioError("");
          setSelectionPhase("idle");
          setShowAiDiagnosis(false);
        }
      }
      const syncedAt = data.syncedAt || new Date().toISOString();
      await saveSettings({ lastBnetSyncAt: syncedAt, lastBnetSyncSummary: data.summary, lastBnetSyncWarnings: data.warnings?.slice(0, 12) });
      if (!silent) {
        const found = Number(data.summary?.found || data.characters?.length || 0);
        const synced = Number(data.summary?.synced || data.characters?.length || 0);
        const partial = Number(data.summary?.partial || 0);
        const failed = Number(data.summary?.failed || 0);
        const stale = Number(data.summary?.stale || 0);
        const staleCleaned = Number(data.summary?.staleCleaned || 0);
        const iconFailed = Number(data.summary?.iconFailed || 0);
        const iconText = iconFailed > 0 ? ` · 아이콘 ${iconFailed}개 실패` : "";
        const cleanupText = staleCleaned > 0 ? ` · 중복 ${staleCleaned}개 정리` : "";
        setToast(partial > 0 || stale > 0 ? `동기화 완료 · ${found}개 발견 · ${synced}개 장비 · ${partial}개 부분 · ${stale}개 보관${cleanupText}${iconText}` : failed > 0 ? `동기화 완료 · ${found}개 중 ${synced}개 성공 · ${failed}개 실패${cleanupText}${iconText}` : `동기화 완료 · ${synced}개 캐릭터${cleanupText}${iconText}`);
      }
    } catch (err) {
      if (!silent) setToast(err instanceof Error ? err.message : "Battle.net 동기화 실패");
    } finally {
      setSyncLoading(false);
    }
  }

  function connectBattleNet() {
    if (!loggedIn || !user) {
      void googleLogin();
      return;
    }
    void user.getIdToken(true).then((token) => {
      window.location.href = `/auth/bnet/start?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent("/v8/")}`;
    });
  }

  async function logout() {
    const { auth, signOut } = await getFirebaseServices();
    await signOut(auth);
  }

  async function generatePlan() {
    if (!loggedIn || !user) {
      await googleLogin();
      return;
    }
    if (!hasSelectedCharacter) {
      setToast("먼저 캐릭터를 선택해주세요.");
      return;
    }
    const gearStatus = gearStatusCopy(character);
    if (gearStatus.tone !== "ok") {
      setToast(`${gearStatus.label} 상태라 AI 신뢰도가 낮을 수 있습니다.`);
    }
    const payload = { characterId: character.id, date: todayKey(), preferences, snapshot, snapshotHash, trigger: "manual" as AiTrigger };
    setAiLoading(true);
    setAiError("");
    setAiRateLimitKind(null);
    setAutoState("generating");
    try {
      const token = await user.getIdToken(true);
      const nextPlan = await requestTodayPlan(token, payload);
      const enriched = { ...nextPlan, snapshotHash, trigger: "manual" as AiTrigger };
      setPlan(enriched);
      setHistoryPlans((items) => [enriched, ...items.filter((item) => item.id !== enriched.id)].slice(0, 10));
      setAiUsageCount((count) => Math.min(AI_DAILY_LIMIT, count + 1));
      await saveSettings({ latestAiPlanId: enriched.id });
      setAutoState("ready");
      setToast("AI 작전 생성 완료");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI 요청 실패";
      const rateLimitKind = err instanceof AiRequestError ? err.rateLimitKind : null;
      setAiRateLimitKind(rateLimitKind);
      if (rateLimitKind === "daily") setAiUsageCount(AI_DAILY_LIMIT);
      const fallback = buildFallbackPlan(snapshot, preferences, message);
      setPlan({ ...fallback, snapshotHash, trigger: "manual" as AiTrigger });
      setAiError(message);
      setAutoState("error");
      setToast("기본 판단으로 전환했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleDone(id?: string | null) {
    if (!id) return;
    await saveSettings({ done: { ...(settings.done || {}), [id]: !settings.done?.[id] } });
  }

  async function hideTask(id: string) {
    await saveSettings({ hidden: { ...(settings.hidden || {}), [id]: true } });
  }

  async function clearDoneHidden() {
    await saveSettings({ done: {}, hidden: {} });
    setToast("완료/숨김을 초기화했습니다.");
  }

  async function jump(nextView: View) {
    setView(nextView);
    await saveSettings({ lastView: nextView });
  }

  async function changeCharacter(id: string) {
    clearSelectionTimers();
    if (!id) {
      setActiveCharacterId("");
      setSelectionPhase("idle");
      setShowAiDiagnosis(false);
      setPlan(null);
      setRio(null);
      setRioError("");
      return;
    }
    setActiveCharacterId(id);
    setRio(null);
    setRioError("");
    setPlan(null);
    setAiError("");
    setAiRateLimitKind(null);
    setAutoState("idle");
    setSelectionPhase("db");
    setShowAiDiagnosis(false);
    selectionTimersRef.current = [
      window.setTimeout(() => setSelectionPhase("renewing"), 420),
      window.setTimeout(() => {
        setSelectionPhase("revealed");
        setShowAiDiagnosis(true);
      }, 1750),
    ];
    if (loggedIn && user) {
      const { db, doc, serverTimestamp, setDoc } = await getFirebaseServices();
      await Promise.all([
        saveSettings({ activeCharacterId: id }),
        setDoc(doc(db, "wowGuideUsers", user.uid, "settings", "main"), { activeCharacterId: id, updatedAt: serverTimestamp() }, { merge: true }),
      ]);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => jump("today")}>
          <span className="brand-mark">WJ+</span>
          <span><strong>WJ+ Command</strong><small>오늘 판단 · AI 작전실 · 장비 점검 · 던전 · 가이드</small></span>
        </button>
        <nav aria-label="주요 화면">
          {views.map((item) => (
            <button key={item.id} type="button" className={view === item.id ? "active" : ""} onClick={() => jump(item.id)}>{item.label}</button>
          ))}
        </nav>
        <div className="topbar-tools">
          <div className={displayedAiUsage >= AI_DAILY_LIMIT ? "ai-usage-counter warn" : "ai-usage-counter"} title={`오늘 AI 생성 ${displayedAiUsage}/${AI_DAILY_LIMIT}`}>
            <Brain size={14} />
            <span>AI</span>
            <b>{displayedAiUsage}/{AI_DAILY_LIMIT}</b>
          </div>
          <div className="account-strip account-menu">
            {loggedIn ? (
              <details>
                <summary>
                  <span className="account-state">저장 연결됨</span>
                  <span className="account-name">{authName(user)}</span>
                </summary>
                <button type="button" onClick={() => void logout()}><LogOut size={16} /> 로그아웃</button>
              </details>
            ) : (
              <button type="button" onClick={googleLogin}><LogIn size={16} /> Google 로그인</button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className={`command-bar panel ${hasSelectedCharacter && avatar ? "has-hero-image" : ""}`} style={commandHeroStyle}>
          <div className="character-hero-bg" aria-hidden="true" />
          <div className="character-picker">
            <div className="character-select-wrap">
              <label htmlFor="active-character">캐릭터</label>
              <select id="active-character" value={activeCharacterId} onChange={(event) => changeCharacter(event.target.value)} disabled={!loggedIn || !pickerCharacters.length}>
                <option value="">캐릭터 선택</option>
                {pickerCharacters.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.realm || row.realmSlug}</option>)}
              </select>
            </div>
          </div>
          <div className="quick-metrics">
            <article><small>RIO</small><b>{hasSelectedCharacter && score ? fmt(Math.round(score)) : "-"}</b></article>
            <article><small>ILVL{ilvl.source ? ` · ${ilvl.source}` : ""}</small><b>{hasSelectedCharacter && ilvl.value ? fmt(Math.round(ilvl.value)) : "-"}</b></article>
            <article><small>완료</small><b>{Object.values(settings.done || {}).filter(Boolean).length}</b></article>
          </div>
          <div className="character-status-line">
            <span>{hasSelectedCharacter ? `${selectedGearStatus.label} · ${character.specName || character.spec || "전문화"} · ${(character.region || "kr").toUpperCase()}` : loggedIn ? "캐릭터를 선택해주세요 · 저장된 DB 화면부터 표시합니다." : "캐릭터를 선택해주세요 · 로그인 후 캐릭터 목록을 불러옵니다."}</span>
          </div>
          <div className="command-actions">
            <button type="button" onClick={connectBattleNet} disabled={!loggedIn}><Database size={16} /> Battle.net 연결</button>
            <button type="button" onClick={() => syncBattleNet(false)} disabled={!loggedIn || syncLoading}>{syncLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} 장비 동기화</button>
            <button type="button" onClick={() => refreshRaiderIO(true)} disabled={!loggedIn || !hasSelectedCharacter}><RefreshCw size={16} /> Raider.IO</button>
          </div>
        </section>

        <SelectionStageBanner phase={selectionPhase} />
        {isReadOnlyPreview ? <ReadOnlyPreviewNotice loggedIn={loggedIn} onLogin={googleLogin} /> : null}

        <Suspense fallback={<ViewLoading />}>
          {view === "guides" ? (
            <GuidesView />
          ) : view === "dungeons" ? (
            <div className={`workspace-wrap ${selectionPhase === "revealed" ? "revealed" : ""}`}>
              <DungeonsView
                recommendations={snapshot.dungeonRecommendations}
                gearRecommendation={snapshot.gearRecommendation}
                loggedIn={loggedIn}
                feedback={settings.dungeonGuideFeedback || []}
                onFeedback={saveDungeonGuideFeedback}
              />
            </div>
          ) : (
            <div className={`workspace-wrap ${selectionPhase === "revealed" ? "revealed" : ""}`}>
        {view === "today" ? (
          <TodayView
            loggedIn={!isReadOnlyPreview}
            snapshot={snapshot}
            plan={activePlan}
            fallback={!plan || activePlan.model === "local-fallback"}
            aiError={aiError}
            autoState={autoState}
            rateLimitKind={aiRateLimitKind}
            onGenerate={() => generatePlan()}
            aiLoading={aiLoading}
            onDone={toggleDone}
            onHide={hideTask}
            onJump={jump}
            onSync={() => syncBattleNet(false)}
            syncLoading={syncLoading}
            recentRuns={recentRuns}
          />
        ) : null}

        {view === "ai" ? (
          <AiView
            preferences={preferences}
            snapshot={snapshot}
            activePlan={activePlan}
            currentPlan={plan}
            fallback={!plan || activePlan.model === "local-fallback"}
            activePlanStale={activePlanStale}
            aiError={aiError}
            aiLoading={aiLoading}
            disabled={isReadOnlyPreview}
            historyPlans={historyPlans}
            onPreferencesChange={setPreferences}
            onGenerate={() => generatePlan()}
            onDone={toggleDone}
            onJump={jump}
            onSelectPlan={setPlan}
          />
        ) : null}

        {view === "gear" ? (
          <GearRecommendationPage
            character={character}
            result={gearRecommendation}
            mode={gearCoachPreferences.defaultMode}
            preferences={gearCoachPreferences}
            bisReport={bisReport}
            bisLoading={bisLoading}
            bisError={bisError}
            disabled={isReadOnlyPreview}
            onModeChange={(mode: GearRecommendationMode) => saveSettings({ gearCoachPreferences: { ...gearCoachPreferences, defaultMode: mode } })}
            onPreferencesChange={(next: GearCoachPreferences) => saveSettings({ gearCoachPreferences: next })}
            onRefreshBis={() => refreshWowheadBis(true, false)}
            onJumpDungeons={() => jump("dungeons")}
          />
        ) : null}
        {view === "wythic" ? <WythicView character={character} score={score} ilvl={ilvl} onJump={jump} readOnlyPreview={isReadOnlyPreview} /> : null}
        {view === "notes" ? (
          <SettingsView
            settings={settings}
            loggedIn={!isReadOnlyPreview}
            userId={user?.uid || ""}
            character={character}
            selectedGearStatus={selectedGearStatus}
            equipmentSlotCount={equipmentSlotCount(character)}
            autoState={autoState}
            snapshotHash={snapshotHash}
            aiError={aiError}
            aiLoading={aiLoading}
            onNoteChange={(note) => saveSettings({ note })}
            onClear={clearDoneHidden}
            onGenerate={() => generatePlan()}
            onConnect={connectBattleNet}
          />
        ) : null}
          </div>
        )}
        </Suspense>
      </main>

      {selectionPhase === "renewing" ? <RenewalOverlay /> : null}
      {showAiDiagnosis && hasSelectedCharacter ? (
        <AiDiagnosisDialog
          characterName={character.name}
          onNo={() => {
            setShowAiDiagnosis(false);
            setAutoState("idle");
          }}
          onYes={() => {
            setShowAiDiagnosis(false);
            void generatePlan();
          }}
        />
      ) : null}
      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}
