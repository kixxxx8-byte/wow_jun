import {
  Brain,
  Check,
  Clock3,
  Database,
  History,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { AiRequestError, requestTodayPlan } from "./api/ai";
import { auth, db } from "./api/firebase";
import { requestItemTooltip, requestWowheadBis } from "./api/items";
import { ConfirmDialog, DataCard, EmptyState, Field, LockState, MetricCard, Panel, StatusPill, Toast } from "./components/ui";
import { dungeonGuideCatalog, legacyDiagramInfo, WOW_KR_YOUTUBE } from "./domain/dungeonCatalog";
import type { RichDungeonGuide } from "./domain/dungeonCatalog";
import {
  appliedEnhancementText,
  buildFallbackPlan,
  buildSnapshotHash,
  buildTodaySnapshot,
  defaultCharacter,
  defaultPreferences,
  gearReadinessScore,
  itemIcon,
  itemMeta,
  normalizeRealm,
  statTotals,
  targets,
} from "./domain/planning";
import type {
  AiPlan,
  AiPreferences,
  AiTrigger,
  BnetSyncResponse,
  Character,
  EquipmentItem,
  EquipmentRow,
  ItemTooltipData,
  Target,
  TodaySnapshot,
  TodayTask,
  V8Settings,
  View,
  WowheadBisItem,
  WowheadBisReport,
} from "./types";

type RioProfile = {
  thumbnail_url?: string;
  mythic_plus_recent_runs?: Array<Record<string, unknown>>;
  mythic_plus_scores_by_season?: Array<{ scores?: { all?: number; dps?: number } }>;
  gear?: { item_level_equipped?: number };
};

type ItemFilter = "all" | "urgent" | "dungeon" | "craft";
type AutoState = "idle" | "blocked" | "cached" | "generating" | "ready" | "error";
type SelectionPhase = "idle" | "db" | "renewing" | "revealed";

type DiagramKey = keyof typeof legacyDiagramInfo;
const AI_DAILY_LIMIT = 200;
const itemTooltipCache = new Map<number, ItemTooltipData>();
let wowheadTooltipsPromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    whTooltips?: Record<string, unknown>;
    $WowheadPower?: { refreshLinks?: () => void };
  }
}

const preferenceLabels = {
  timeBudget: { "30m": "30분", "60m": "1시간", "120m": "2시간", custom: "직접 판단" },
  goal: { gear: "장비 파밍", score: "점수", light: "가볍게", push: "빡세게", maintenance: "정비" },
  energy: { low: "낮음", normal: "보통", high: "높음" },
  party: { solo: "솔로", premade: "고정/지인", either: "상관없음" },
  risk: { safe: "안전", balanced: "균형", aggressive: "공격적" },
};

const subtletyTalentBuilds = [
  {
    label: "단일 대상 · 기만자 추천",
    note: "대부분의 실전 보스와 쐐기 기본 선택지",
    import: "CUQAAAAAAAAAAAAAAAAAAAAAAAgx2MAAAAAwsMGLTMbbjxMjZwMzMzYMbDzYbbmZmZmZMYMz2AAAAwgxAGzmhBGYW0CtYDzAmZwMGA",
  },
  {
    label: "단일 대상 · 죽음추적자",
    note: "순수 단일만 앞서지만 2타겟 이상에서 빠르게 밀림",
    import: "CUQAAAAAAAAAAAAAAAAAAAAAAAgx2MAAAAAwsMGLTMbbjxMjZwMzMzYMbDzMbbjZMzMjBjZWGAAAAGMmFzyADYBsMMhMLYGmZAmZGA",
  },
  {
    label: "쐐기 · 기만자 추천",
    note: "쐐기 기본 빌드",
    import: "CUQAAAAAAAAAAAAAAAAAAAAAAAgx2MAAAAAwsMGLTMbbjxMjZMegZmZGjZbYGbbzMzMzMjBjZWGAAAAGMGwY2MMwAziWoFbYGwMDmxA",
  },
];

const subtletyRotation = [
  "어둠의 춤은 은밀한 기술이 준비됐거나 어둠의 칼날이 켜졌을 때 사용",
  "어둠의 칼날은 어둠의 춤 안에서 사용",
  "은밀한 기술은 어둠의 춤 중 6+ 콤보 포인트에서 사용",
  "최후의 일격은 6+ 콤보 포인트 소모기로 사용",
  "2타겟 이하는 절개, 3타겟 이상은 검은 화약",
  "어둠의 춤 안에서는 1-3타겟 그림자 일격, 그 이상은 표창 폭풍",
  "어둠의 춤 밖에서는 1타겟 기습, 광역은 표창 폭풍",
];

const subtletyOptimizations = [
  "풀링 전 어둠의 춤 1회로 강화 콤보 포인트 2개를 들고 시작 가능",
  "어둠의 칼날 쿨이 10초 미만이면 어둠의 춤 + 은밀한 기술을 잠시 묶어 두 번의 어둠의 춤을 맞추기",
  "어둠의 춤 직전에는 마무리 일격을 급하게 쓰지 말고 그림자 기술 스택을 조금 남기기",
  "기만자는 어둠의 춤 진입 시 풀 콤보 포인트, 죽음추적자는 낮은 콤보 포인트 진입을 선호",
  "큰 광역에서는 특화 물약이 더 나을 수 있고, 빛의 부대기 사용 전 물약을 먼저 쓰기",
];

const views: Array<{ id: View; label: string }> = [
  { id: "today", label: "오늘" },
  { id: "ai", label: "AI 작전실" },
  { id: "gear", label: "장비" },
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

function authName(user: User | null) {
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

function tooltipItemLevelText(data: ItemTooltipData) {
  if (data.itemLevel && data.itemLevel < 100) return "";
  return data.itemLevelText || (data.itemLevel ? `아이템 레벨 ${data.itemLevel}` : "");
}

function loadWowheadTooltips() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.$WowheadPower?.refreshLinks) return Promise.resolve(true);
  if (!wowheadTooltipsPromise) {
    wowheadTooltipsPromise = new Promise((resolve) => {
      window.whTooltips = {
        colorLinks: false,
        iconizeLinks: false,
        renameLinks: false,
      };
      const existing = document.querySelector<HTMLScriptElement>("script[data-wj-wowhead-tooltips]");
      const script = existing || document.createElement("script");
      script.dataset.wjWowheadTooltips = "true";
      script.src = "https://wow.zamimg.com/js/tooltips.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      if (!existing) document.head.appendChild(script);
    });
  }
  return wowheadTooltipsPromise;
}

function useWowheadTooltips(refreshKey: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadWowheadTooltips().then((loaded) => {
      if (!alive) return;
      setReady(loaded);
      if (loaded) window.setTimeout(() => window.$WowheadPower?.refreshLinks?.(), 0);
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);
  return ready;
}

function useItemTooltip(itemId: number, enabled: boolean) {
  const [data, setData] = useState<ItemTooltipData | null>(itemTooltipCache.get(itemId) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !itemId || data) return;
    let alive = true;
    setLoading(true);
    setError("");
    requestItemTooltip(itemId)
      .then((next) => {
        itemTooltipCache.set(itemId, next);
        if (alive) setData(next);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "아이템 툴팁 조회 실패");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [data, enabled, itemId]);

  return { data, loading, error };
}

function TooltipFallbackCard({
  itemId,
  name,
  data,
  loading,
  error,
  style,
  onClose,
}: {
  itemId: number;
  name: string;
  data: ItemTooltipData | null;
  loading: boolean;
  error: string;
  style?: CSSProperties;
  onClose: () => void;
}) {
  const tooltipName = data?.name || name;
  const qualityClass = data?.qualityType ? `quality-${data.qualityType}` : "";
  return (
    <section className="wow-fallback-tooltip" role="tooltip" style={style}>
      <button type="button" className="tooltip-close" onClick={onClose} aria-label="툴팁 닫기"><X size={14} /></button>
      {!itemId ? (
        <>
          <b>툴팁 준비중</b>
          <p>{name}</p>
          <small>공식 item ID가 아직 연결되지 않았습니다.</small>
        </>
      ) : loading ? (
        <>
          <b>{tooltipName}</b>
          <p>공식 Battle.net 데이터를 불러오는 중입니다.</p>
        </>
      ) : error ? (
        <>
          <b>{tooltipName}</b>
          <p>{error}</p>
          <a href={wowheadUrl(itemId)} target="_blank" rel="noreferrer">Wowhead에서 보기</a>
        </>
      ) : data ? (
        <>
          <b className={qualityClass}>{tooltipName}</b>
          {tooltipItemLevelText(data) ? <p>{tooltipItemLevelText(data)}</p> : null}
          <small>{[data.binding, data.inventoryType, data.itemSubclass || data.itemClass].filter(Boolean).join(" · ")}</small>
          {data.armor ? <span>{data.armor}</span> : null}
          {(data.weapon || []).map((line) => <span key={line}>{line}</span>)}
          {(data.stats || []).slice(0, 8).map((line) => <span key={line}>{line}</span>)}
          {(data.sockets || []).map((line) => <span key={line}>홈: {line}</span>)}
          {(data.spells || []).slice(0, 4).map((line) => <em key={line}>{line}</em>)}
          {data.setName ? <span>{data.setName}</span> : null}
          {data.description ? <em>{data.description}</em> : null}
          {(data.requirements || []).map((line) => <small key={line}>{line}</small>)}
          <a href={wowheadUrl(itemId)} target="_blank" rel="noreferrer">Wowhead에서 보기</a>
        </>
      ) : null}
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
  const { data, loading, error } = useItemTooltip(itemId, fallbackOpen);

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
        data-wowhead={itemId ? `item=${itemId}` : undefined}
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
      {fallbackOpen ? <TooltipFallbackCard itemId={itemId} name={name} data={data} loading={loading} error={error} style={position} onClose={closeFallback} /> : null}
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

function BisItemIcon({ item }: { item?: WowheadBisItem }) {
  if (!item) return <span className="item-icon placeholder">BIS</span>;
  return (
    <ItemTooltipAnchor
      target={{ id: `bis-${item.itemId}`, slot: item.slotKey, slotLabel: item.slot, priority: 0, type: "dungeon", target: item.name, icon: item.iconUrl || "", itemId: item.itemId, wowheadUrl: wowheadUrl(item.itemId), source: "Wowhead", boss: item.source, reason: "Wowhead BIS 기준", check: "내 장비와 비교" }}
      label={item.name}
      iconUrl={item.iconUrl || ""}
      className={`item-icon bis-list-icon ${item.iconUrl ? "" : "placeholder"}`}
      placeholder="BIS"
    />
  );
}

function bisSlotPriority(slotKey: string) {
  if (slotKey.startsWith("TRINKET")) return 100;
  if (slotKey.startsWith("FINGER")) return 92;
  if (slotKey.includes("HAND")) return 88;
  if (["HEAD", "CHEST", "LEGS", "SHOULDER", "HANDS"].includes(slotKey)) return 76;
  return 68;
}

function pairedSlotKeys(slotKey: string) {
  if (slotKey.startsWith("FINGER")) return ["FINGER_1", "FINGER_2"];
  if (slotKey.startsWith("TRINKET")) return ["TRINKET_1", "TRINKET_2"];
  if (slotKey === "MAIN_HAND" || slotKey === "OFF_HAND") return ["MAIN_HAND", "OFF_HAND"];
  return [slotKey];
}

function targetFromBis(item: WowheadBisItem): Target {
  const source = item.source === "Crafting" ? "제작" : item.source;
  return {
    id: `wowhead-bis-${item.slotKey}-${item.itemId}`,
    slot: item.slotKey,
    slotLabel: item.slot,
    priority: bisSlotPriority(item.slotKey),
    type: source.includes("제작") ? "craft" : "dungeon",
    target: item.name,
    icon: item.iconUrl || "",
    itemId: item.itemId,
    wowheadUrl: wowheadUrl(item.itemId),
    source: "Wowhead BIS",
    boss: source,
    reason: "Wowhead 암살 도적 BIS 표 기준 목표입니다.",
    check: "현재 착용 장비와 같은 부위군 전체를 비교합니다.",
  };
}

function rowsWithWowheadBisTargets(rows: EquipmentRow[], report: WowheadBisReport | null) {
  if (!report?.items?.length) return rows;
  const bisBySlot = new Map(report.items.map((item) => [item.slotKey, item]));
  const equippedIdsBySlot = new Map(rows.map((row) => [row.slotKey, itemIdValue(row.equippedItem)]));
  return rows.map((row) => {
    const bis = bisBySlot.get(row.slotKey);
    if (!bis) return { ...row, target: null, type: "none" as const, score: row.enhancement.tone === "warn" ? 35 : 10 };
    const pairedIds = pairedSlotKeys(row.slotKey).map((key) => equippedIdsBySlot.get(key) || 0).filter(Boolean);
    const alreadyOwnedInGroup = pairedIds.includes(bis.itemId);
    const target = alreadyOwnedInGroup ? null : targetFromBis(bis);
    return {
      ...row,
      target,
      type: target?.type || "none" as const,
      score: target ? target.priority + (row.enhancement.tone === "warn" ? 8 : 0) : row.enhancement.tone === "warn" ? 35 : 10,
    };
  });
}

function itemIdValue(item?: EquipmentItem | null) {
  const value = Number(item?.id || 0);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function BisComparisonPanel({
  rows,
  report,
  loading,
  error,
  onRefresh,
  disabled,
}: {
  rows: EquipmentRow[];
  report: WowheadBisReport | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  disabled: boolean;
}) {
  const bisBySlot = new Map((report?.items || []).map((item) => [item.slotKey, item]));
  const comparable = rows.filter((row) => bisBySlot.has(row.slotKey));
  const matched = comparable.filter((row) => itemIdValue(row.equippedItem) === bisBySlot.get(row.slotKey)?.itemId).length;
  const targetMatched = comparable.filter((row) => row.target?.itemId && row.target.itemId === bisBySlot.get(row.slotKey)?.itemId).length;
  const fetched = report?.fetchedAt ? new Date(report.fetchedAt).toLocaleString("ko-KR") : "아직 없음";
  const topRows = comparable.slice().sort((a, b) => {
    const aBis = bisBySlot.get(a.slotKey);
    const bBis = bisBySlot.get(b.slotKey);
    const aMatch = itemIdValue(a.equippedItem) === aBis?.itemId ? 1 : 0;
    const bMatch = itemIdValue(b.equippedItem) === bBis?.itemId ? 1 : 0;
    return aMatch - bMatch || b.score - a.score;
  }).slice(0, 8);

  return (
    <section className="panel bis-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Wowhead BIS</p>
          <h2>BIS 비교</h2>
        </div>
        <div className="command-actions">
          {report?.sourceUrl ? <a className="link-btn" href={report.sourceUrl} target="_blank" rel="noreferrer">Wowhead 보기</a> : null}
          <button type="button" onClick={onRefresh} disabled={disabled || loading}>{loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} BIS 새로고침</button>
        </div>
      </div>
      <div className="bis-summary">
        <MetricCard title="현재 BIS 일치" value={report ? `${matched}/${comparable.length}` : "-"} detail="착용 장비" />
        <MetricCard title="목표와 일치" value={report ? targetMatched : "-"} detail="등록 목표 기준" />
        <MetricCard title="Wowhead 갱신" value={report ? "불러옴" : "대기"} detail={fetched} />
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {!report ? (
        <EmptyState title="Wowhead BIS 비교 대기" body="버튼을 누르면 Wowhead 암살 도적 BIS 표를 읽어 현재 장비와 비교합니다." />
      ) : (
        <div className="bis-list">
          {topRows.map((row) => {
            const bis = bisBySlot.get(row.slotKey);
            const currentMatch = itemIdValue(row.equippedItem) === bis?.itemId;
            const targetMatch = row.target?.itemId === bis?.itemId;
            return (
              <article key={row.slotKey} className={currentMatch ? "match" : targetMatch ? "target-match" : ""}>
                <div className="slot-cell"><small>{row.slotLabel}</small><b>{currentMatch ? "착용중" : targetMatch ? "목표 있음" : "차이 있음"}</b></div>
                <div className="item-cell"><GearItemIcon item={row.equippedItem} label={row.slotLabel} /><div><b>{row.equippedItem?.name || "장비 없음"}</b><span>{itemMeta(row.equippedItem)}</span></div></div>
                <div className="target-cell"><BisItemIcon item={bis} /><div><b>{bis?.name || "BIS 없음"}</b><span>{bis ? `${bis.source} · 시즌 BIS` : "Wowhead 표에서 찾지 못함"}</span></div></div>
                <StatusPill tone={currentMatch ? "ok" : targetMatch ? "warn" : "err"}>{currentMatch ? "일치" : targetMatch ? "목표" : "확인"}</StatusPill>
              </article>
            );
          })}
        </div>
      )}
      {report?.warnings?.length ? <p className="bis-warning">일부 아이템 세부 정보 조회 실패: {report.warnings.slice(0, 2).join(" / ")}</p> : null}
    </section>
  );
}

function targetById(id?: string | null) {
  return id ? targets.find((target) => target.id === id) || null : null;
}

function targetByTask(task: TodayTask) {
  return targets.find((target) => target.id === task.id || target.target === task.itemName) || null;
}

function runName(run: Record<string, unknown>) {
  return String(run.dungeon || run.short_name || run.name || "던전");
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

function LockNotice({ onLogin }: { onLogin: () => void }) {
  return (
    <LockState
      title="읽기용 미리보기"
      body="저장, Battle.net 동기화, AI 생성은 Google 로그인 후 사용할 수 있습니다."
      action="Google 로그인"
      onAction={onLogin}
    />
  );
}

function CharacterSelectPanel({
  loggedIn,
  characters,
  onSelect,
  onLogin,
  onConnect,
  onSync,
  syncLoading,
}: {
  loggedIn: boolean;
  characters: Character[];
  onSelect: (id: string) => void;
  onLogin: () => void;
  onConnect: () => void;
  onSync: () => void;
  syncLoading: boolean;
}) {
  return (
    <section className="panel character-select-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Character Gate</p>
          <h1>캐릭터를 먼저 선택해주세요</h1>
          <p>시작 화면에서는 아무 캐릭터도 자동 선택하지 않습니다. 선택하면 저장된 DB 화면을 먼저 보여준 뒤, 짧은 리뉴얼 화면을 거쳐 AI 진단 여부를 묻습니다.</p>
        </div>
        <StatusPill tone={loggedIn ? "ok" : "warn"}>{loggedIn ? `${characters.length}개 저장됨` : "로그인 필요"}</StatusPill>
      </div>

      {!loggedIn ? (
        <EmptyState title="로그인 후 캐릭터를 불러옵니다" body="Google 로그인과 Battle.net 연결을 마치면 저장된 캐릭터 목록이 여기에 표시됩니다." />
      ) : characters.length ? (
        <div className="character-choice-grid">
          {characters.map((row) => (
            <button key={row.id} type="button" className="character-choice" onClick={() => onSelect(row.id)}>
              <span className="choice-avatar">{row.name.slice(0, 2).toUpperCase()}</span>
              <span>
                <b>{row.name}</b>
                <small>{row.realm || row.realmSlug || "서버 미확인"} · {isPartialCharacter(row) ? "부분 동기화" : row.specName || row.spec || "전문화"} · {(row.region || "kr").toUpperCase()}</small>
              </span>
              <Sparkles size={18} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="저장된 캐릭터가 없습니다" body="Battle.net 연결 후 장비 동기화를 실행하면 계정의 캐릭터를 불러옵니다." />
      )}

      <div className="selection-actions">
        {!loggedIn ? <button type="button" className="primary-btn" onClick={onLogin}><LogIn size={16} /> Google 로그인</button> : null}
        <button type="button" onClick={onConnect} disabled={!loggedIn}><Database size={16} /> Battle.net 연결</button>
        <button type="button" onClick={onSync} disabled={!loggedIn || syncLoading}>
          {syncLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} 캐릭터 새로고침
        </button>
      </div>
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
  const setValue = <K extends keyof AiPreferences>(key: K, value: AiPreferences[K]) => onChange({ ...preferences, [key]: value });
  const toggleDungeon = (name: string, list: "preferredDungeons" | "avoidedDungeons") => {
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
            <select value={preferences.timeBudget} onChange={(event) => setValue("timeBudget", event.target.value as AiPreferences["timeBudget"])}>
              {Object.entries(preferenceLabels.timeBudget).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="목표">
            <select value={preferences.goal} onChange={(event) => setValue("goal", event.target.value as AiPreferences["goal"])}>
              {Object.entries(preferenceLabels.goal).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="피로도">
            <select value={preferences.energy} onChange={(event) => setValue("energy", event.target.value as AiPreferences["energy"])}>
              {Object.entries(preferenceLabels.energy).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="파티">
            <select value={preferences.party} onChange={(event) => setValue("party", event.target.value as AiPreferences["party"])}>
              {Object.entries(preferenceLabels.party).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <Field label="위험 선호">
            <select value={preferences.risk} onChange={(event) => setValue("risk", event.target.value as AiPreferences["risk"])}>
              {Object.entries(preferenceLabels.risk).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </Field>
          <label className="toggle-field">
            <input type="checkbox" checked={preferences.useWeb} onChange={(event) => setValue("useWeb", event.target.checked)} />
            <span>최신 메타 반영</span>
          </label>
        </div>
        <div className="dungeon-choices">
          <span>던전 선호/제외</span>
          {snapshot.dungeonRecommendations.map((dungeon) => (
            <div className="choice-row" key={dungeon.id}>
              <b>{dungeon.short}</b>
              <button type="button" className={preferences.preferredDungeons.includes(dungeon.name) ? "active" : ""} onClick={() => toggleDungeon(dungeon.name, "preferredDungeons")}>선호</button>
              <button type="button" className={preferences.avoidedDungeons.includes(dungeon.name) ? "danger active" : "danger"} onClick={() => toggleDungeon(dungeon.name, "avoidedDungeons")}>제외</button>
            </div>
          ))}
        </div>
        <Field label="자유 메모">
          <textarea
            value={preferences.freeNote}
            placeholder="예: 오늘은 1시간만 가능, 점수보다 장신구 우선, 피곤해서 안전하게"
            onChange={(event) => setValue("freeNote", event.target.value)}
          />
        </Field>
      </details>
      <button className="primary-btn wide" type="button" onClick={onGenerate} disabled={loading || disabled}>
        {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        오늘의 최적 답 받기
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
        {plan.actions.map((action) => (
          <ActionCard key={`${action.rank}-${action.title}`} action={action} onDone={onDone} onJump={onJump} disabled={disabled} />
        ))}
      </div>
      <div className="time-plan-grid">
        <article><Clock3 size={17} /><b>30분</b>{plan.timePlans.short.map((item) => <span key={item}>{item}</span>)}</article>
        <article><Clock3 size={17} /><b>1시간</b>{plan.timePlans.normal.map((item) => <span key={item}>{item}</span>)}</article>
        <article><Clock3 size={17} /><b>2시간</b>{plan.timePlans.long.map((item) => <span key={item}>{item}</span>)}</article>
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
  return (
    <div className="view-stack">
      <section className="today-hero panel">
        <div>
          <p className="eyebrow">Today</p>
          <h1>{plan.title}</h1>
          <p>{plan.summary}</p>
          <div className="hero-actions">
            <button className="primary-btn" type="button" onClick={onGenerate} disabled={!loggedIn || aiLoading}>
              {aiLoading ? <Loader2 className="spin" size={17} /> : <Brain size={17} />}
              AI 다시 판단
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
      <section className="now-strip panel">
        <div>
          <p className="eyebrow">Now</p>
          <h2>지금 할 일 3개</h2>
        </div>
        <div className="now-actions">
          {plan.actions.slice(0, 3).map((action) => {
            const target = targetById(action.targetId);
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
      <div className="data-grid">
        <DataCard title="Battle.net" value={snapshot.dataFreshness.bnet.label} detail={snapshot.dataFreshness.bnet.detail} tone={snapshot.dataFreshness.bnet.tone} />
        <DataCard title="Raider.IO" value={snapshot.dataFreshness.rio.label} detail={snapshot.dataFreshness.rio.detail} tone={snapshot.dataFreshness.rio.tone} />
        <DataCard title="Cloud" value={snapshot.dataFreshness.cloud.label} detail={snapshot.dataFreshness.cloud.detail} tone={snapshot.dataFreshness.cloud.tone} />
        <DataCard title="오늘 실행" value={`${snapshot.todayTasks.length}개`} detail={fallback ? "기본 계산 기준" : "AI 판단 반영"} tone={fallback ? "warn" : "ok"} />
      </div>
      <section className="split-grid">
        <div className="panel">
          <div className="section-head">
            <div><p className="eyebrow">Execute</p><h2>오늘 액션</h2></div>
          </div>
          <div className="task-list">
            {snapshot.todayTasks.map((task, index) => {
              const target = targetByTask(task);
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
                <span>+{String(run.mythic_level || "?")} · {run.score ? `${Math.round(Number(run.score))}점` : "점수 없음"} · {String(run.completed_at || "최근")}</span>
              </article>
            )) : <EmptyState title="최근 기록 없음" body={aiError || "Raider.IO 갱신 후 최근 런을 확인할 수 있습니다."} />}
          </div>
        </div>
      </section>
    </div>
  );
}

const gearMapSlotGroups = {
  left: ["HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "WRIST", "HANDS", "WAIST"],
  right: ["LEGS", "FEET", "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2"],
  bottom: ["MAIN_HAND", "OFF_HAND"],
};

function GearSlotNode({
  row,
  disabled,
  expanded,
  onDone,
  onJump,
}: {
  row: EquipmentRow;
  disabled: boolean;
  expanded?: boolean;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
}) {
  const hasTarget = Boolean(row.target);
  return (
    <article className={`gear-map-slot ${row.enhancement.tone} ${hasTarget ? "has-target" : ""}`}>
      <div className="gear-map-current">
        <GearItemIcon item={row.equippedItem} label={row.slotLabel} className="map-icon" />
        <div>
          <small>{row.slotLabel}</small>
          <b>{row.equippedItem?.name || "장비 없음"}</b>
          <span>{row.equippedItem ? itemMeta(row.equippedItem) : row.enhancement.detail}</span>
        </div>
      </div>
      <div className="gear-map-target">
        <span className="gear-map-arrow">→</span>
        {row.target ? <TargetItemIcon target={row.target} className="map-icon target-icon" /> : <span className="item-icon map-icon target-icon placeholder">목표</span>}
        <div>
          <small>{row.target?.source || row.enhancement.label}</small>
          <b>{row.target?.target || "등록된 목표 없음"}</b>
          <span>{row.target ? row.target.boss || row.target.check : row.enhancement.detail}</span>
        </div>
      </div>
      {expanded ? (
        <div className="gear-map-actions">
          {row.target ? <button type="button" onClick={() => onJump(row.target?.type === "craft" ? "gear" : "dungeons")}>보기</button> : null}
          <button type="button" disabled={disabled || !row.target} onClick={() => onDone(row.target?.id)}><Check size={14} /> 완료</button>
        </div>
      ) : null}
    </article>
  );
}

function GearMapLayout({
  rows,
  heroImage,
  readiness,
  disabled,
  expanded,
  onDone,
  onJump,
}: {
  rows: EquipmentRow[];
  heroImage: string;
  readiness: ReturnType<typeof gearReadinessScore>;
  disabled: boolean;
  expanded?: boolean;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
}) {
  const rowsBySlot = new Map(rows.map((row) => [row.slotKey, row]));
  const renderSlots = (slots: string[]) => slots.map((slot) => {
    const row = rowsBySlot.get(slot);
    return row ? <GearSlotNode key={slot} row={row} disabled={disabled} expanded={expanded} onDone={onDone} onJump={onJump} /> : null;
  });

  return (
    <div className={`gear-map-layout ${expanded ? "expanded" : ""}`}>
      <div className="gear-map-score">
        <span>장비 준비도</span>
        <b>{readiness.current}점 → {readiness.target}점</b>
        <small>우선 교체 {readiness.urgent} · 강화 확인 {readiness.missingEnhance}</small>
      </div>
      <div className="gear-map-column left">{renderSlots(gearMapSlotGroups.left)}</div>
      <div className="gear-map-hero">
        {heroImage ? <img src={heroImage} alt="" /> : <div className="gear-map-hero-fallback">WJ+</div>}
      </div>
      <div className="gear-map-column right">{renderSlots(gearMapSlotGroups.right)}</div>
      <div className="gear-map-bottom">{renderSlots(gearMapSlotGroups.bottom)}</div>
    </div>
  );
}

function GearMapModal({
  rows,
  heroImage,
  readiness,
  disabled,
  onDone,
  onJump,
  onClose,
}: {
  rows: EquipmentRow[];
  heroImage: string;
  readiness: ReturnType<typeof gearReadinessScore>;
  disabled: boolean;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop gear-map-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="gear-map-dialog" role="dialog" aria-modal="true" aria-label="장비 조감도 크게 보기" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-close" type="button" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        <div className="gear-map-dialog-head">
          <div><p className="eyebrow">Gear Overview</p><h2>장비 조감도</h2></div>
          <button type="button" onClick={() => { onClose(); onJump("gear"); }}>장비 리스트로 이동</button>
        </div>
        <GearMapLayout rows={rows} heroImage={heroImage} readiness={readiness} disabled={disabled} expanded onDone={onDone} onJump={onJump} />
      </section>
    </div>
  );
}

function GearMapPreview({
  rows,
  heroImage,
  readiness,
  disabled,
  onDone,
  onJump,
}: {
  rows: EquipmentRow[];
  heroImage: string;
  readiness: ReturnType<typeof gearReadinessScore>;
  disabled: boolean;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="gear-map-panel panel">
      <div className="section-head">
        <div><p className="eyebrow">Overview</p><h2>장비 조감도</h2></div>
        <button type="button" onClick={() => setOpen(true)}>크게 보기</button>
      </div>
      <GearMapLayout rows={rows} heroImage={heroImage} readiness={readiness} disabled={disabled} onDone={onDone} onJump={onJump} />
      {open ? <GearMapModal rows={rows} heroImage={heroImage} readiness={readiness} disabled={disabled} onDone={onDone} onJump={onJump} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

function GearView({
  character,
  rows,
  heroImage,
  filter,
  setFilter,
  bisReport,
  bisLoading,
  bisError,
  onRefreshBis,
  onDone,
  onJump,
  disabled,
}: {
  character: Character;
  rows: EquipmentRow[];
  heroImage: string;
  filter: ItemFilter;
  setFilter: (filter: ItemFilter) => void;
  bisReport: WowheadBisReport | null;
  bisLoading: boolean;
  bisError: string;
  onRefreshBis: () => void;
  onDone: (id?: string | null) => void;
  onJump: (view: View) => void;
  disabled: boolean;
}) {
  const displayRows = useMemo(() => rowsWithWowheadBisTargets(rows, bisReport), [rows, bisReport]);
  const stats = statTotals(rows);
  const readiness = gearReadinessScore(displayRows);
  const { urgent, missingEnhance } = readiness;
  const filtered = displayRows.filter((row) => {
    if (filter === "all") return true;
    if (filter === "urgent") return row.score >= 75 || row.enhancement.tone === "warn";
    if (filter === "craft") return row.type === "craft" || row.enhancement.tone === "warn";
    return row.type === filter;
  }).sort((a, b) => b.score - a.score);
  const hasEquipment = rows.some((row) => Boolean(row.equippedItem?.name));
  const gearStatus = gearStatusCopy(character);
  const showDataWarning = gearStatus.tone !== "ok" || isPartialCharacter(character) || isStaleCharacter(character);

  return (
    <div className="view-stack">
      <GearMapPreview rows={displayRows} heroImage={heroImage} readiness={readiness} disabled={disabled} onDone={onDone} onJump={onJump} />
      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">Gear</p><h2>장비 최적화</h2></div>
          <div className="filter-row">
            {(["all", "urgent", "dungeon", "craft"] as ItemFilter[]).map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "전체" : item === "urgent" ? "우선" : item === "dungeon" ? "던전" : "제작/마부"}</button>)}
          </div>
        </div>
        <div className="gear-summary">
          <MetricCard title="최적화" value={readiness.current} detail={`/100 → ${readiness.target}`} />
          <MetricCard title="우선 교체" value={urgent} detail="개" />
          <MetricCard title="강화 확인" value={missingEnhance} detail="개" />
          <MetricCard title="장비 상태" value={gearStatus.label} detail={gearStatus.detail} />
          <MetricCard title="치/가/특/유" value={`${fmt(stats.crit)} · ${fmt(stats.haste)}`} detail={`${fmt(stats.mastery)} · ${fmt(stats.vers)}`} />
        </div>
      </section>
      <BisComparisonPanel rows={displayRows} report={bisReport} loading={bisLoading} error={bisError} onRefresh={onRefreshBis} disabled={disabled} />
      {showDataWarning ? (
        <section className="sync-empty panel">
          <div>
            <p className="eyebrow">Data needed</p>
            <h2>{gearStatus.label}</h2>
            <p>{gearStatus.detail}{hasEquipment ? " · 이전 데이터가 섞이지 않도록 현재 장비 상태를 함께 표시합니다." : " · 실제 착용 장비를 불러오면 슬롯별 우선순위와 강화 누락이 더 정확해집니다."}</p>
          </div>
        </section>
      ) : null}
      <section className="gear-board panel">
        {filtered.map((row) => {
          const targetDone = row.target ? disabled : true;
          return (
            <article key={row.slotKey} className={`gear-row ${row.enhancement.tone === "warn" ? "warn" : ""}`}>
              <div className="slot-cell">
                <small>{row.slotLabel}</small>
                <b>{row.slot.group}</b>
              </div>
              <div className="item-cell">
                <GearItemIcon item={row.equippedItem} label={row.slotLabel} />
                <div><b>{row.equippedItem?.name || "장비 없음"}</b><span>{itemMeta(row.equippedItem)}</span></div>
              </div>
              <div className="target-cell">
                {row.target ? <TargetItemIcon target={row.target} className="target-list-icon" /> : null}
                <div>
                  <b>{row.target?.target || "등록된 목표 없음"}</b>
                  <span>{row.target ? `${row.target.source} · ${row.target.boss}` : row.enhancement.detail}</span>
                </div>
              </div>
              <div className={`enhance-cell ${row.enhancement.tone}`}>
                <b>{row.enhancement.label}</b>
                <span>{appliedEnhancementText(row.equippedItem).join(" · ") || row.enhancement.detail}</span>
              </div>
              <button type="button" disabled={targetDone || !row.target} onClick={() => onDone(row.target?.id)}>
                <Check size={15} /> 완료
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function DungeonsView({ recommendations }: { recommendations: TodaySnapshot["dungeonRecommendations"] }) {
  const [query, setQuery] = useState("");
  const [onlyTargets, setOnlyTargets] = useState(false);
  const priorityById = new Map(recommendations.map((row) => [row.id, row]));
  const sorted = [...dungeonGuideCatalog].sort((a, b) => {
    const priorityA = priorityById.get(a.id);
    const priorityB = priorityById.get(b.id);
    return (priorityB?.score || 0) - (priorityA?.score || 0) || (priorityB?.count || 0) - (priorityA?.count || 0) || a.name.localeCompare(b.name, "ko");
  });
  const normalizedQuery = query.trim().toLowerCase();
  const visible = sorted.filter((guide) => {
    const priority = priorityById.get(guide.id);
    if (onlyTargets && !priority?.count) return false;
    if (!normalizedQuery) return true;
    return [guide.name, guide.short, guide.en, guide.danger, guide.route].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const top = sorted[0];
  return (
    <div className="view-stack">
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

function DungeonGuideCard({ guide, priority }: { guide: RichDungeonGuide; priority?: TodaySnapshot["dungeonRecommendations"][number] }) {
  const worstBoss = guide.bosses.find((boss) => boss.risk === "최상" || boss.risk === "치명") || guide.bosses[0];
  const loot = priority?.targets.length ? priority.targets.map((target) => `${target.slotLabel} ${target.target}`).join(", ") : priority?.loot || guide.meta.loot;
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

function GuidesView() {
  return (
    <div className="view-stack guide-shell">
      <section className="panel guide-hero">
        <div>
          <p className="eyebrow">직업 가이드</p>
          <h1>도적 가이드</h1>
          <p>우선 잠행 도적만 열어두고, 암살과 무법은 자리만 잡아 잠금 처리했습니다. 내용은 사용자가 제공한 미드나이트 기준 메모를 사이트용 실전 요약으로 정리했습니다.</p>
        </div>
        <StatusPill tone="ok">잠행 공개</StatusPill>
      </section>

      <section className="panel guide-tabs-panel">
        <div className="spec-switcher" aria-label="도적 전문화">
          <button type="button" className="spec-pill locked">
            암살
            <span>준비 중</span>
          </button>
          <button type="button" className="spec-pill locked">
            무법
            <span>준비 중</span>
          </button>
          <button type="button" className="spec-pill active">
            잠행
            <span>미드나이트 요약</span>
          </button>
        </div>
      </section>

      <section className="guide-grid">
        <article className="panel guide-card lead">
          <p className="eyebrow">잠행</p>
          <h2>잠행 도적 핵심 결론</h2>
          <p>기본 추천은 기만자입니다. 죽음추적자는 순수 단일에서만 앞서지만, 추가 대상이 생기는 순간 가치가 빠르게 내려가므로 레이드 실전과 쐐기에서는 기만자를 우선으로 둡니다.</p>
          <div className="guide-metrics">
            <MetricCard title="권장 영웅 특성" value="기만자" detail="쐐기/대부분 실전" />
            <MetricCard title="가속 목표" value="650-700" detail="기만자 기준" />
            <MetricCard title="죽음추적자" value="~1100" detail="가속 기준점" />
          </div>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">스탯</p>
          <h2>스탯 우선순위</h2>
          <div className="stat-priority">민첩/아이템 레벨 &gt; 가속 기준점 &gt; 특화 = 치명 &gt; 유연</div>
          <ul className="guide-list">
            <li>기만자는 보통 가속 650-700 근처를 먼저 맞춥니다.</li>
            <li>빛의 부대기가 없다면 기만자도 약 800 가속을 목표로 잡을 수 있습니다.</li>
            <li>광역에서는 특화 가치가 크게 올라가지만, 가속 기준점을 먼저 확보하는 쪽이 안정적입니다.</li>
            <li>최종 판단은 레이드봇 Top Gear로 자기 캐릭터 기준 심크를 확인하는 것이 가장 정확합니다.</li>
          </ul>
        </article>

        <article className="panel guide-card talent-card">
          <p className="eyebrow">특성</p>
          <h2>특성 문자열</h2>
          <div className="talent-list">
            {subtletyTalentBuilds.map((build) => (
              <section key={build.label} className="talent-code">
                <b>{build.label}</b>
                <span>{build.note}</span>
                <code>{build.import}</code>
              </section>
            ))}
          </div>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">로테이션</p>
          <h2>기본 로테이션</h2>
          <ol className="guide-steps">
            {subtletyRotation.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">숙련 팁</p>
          <h2>숙련 팁</h2>
          <ul className="guide-list">
            {subtletyOptimizations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>

        <article className="panel guide-card macro-card">
          <p className="eyebrow">매크로</p>
          <h2>지연 줄이기용 매크로</h2>
          <div className="macro-grid">
            <section>
              <b>기만자</b>
              <pre>{`#showtooltip
/시전 어둠의 춤
/시전 은밀한 기술`}</pre>
            </section>
            <section>
              <b>죽음추적자</b>
              <pre>{`#showtooltip
/시전 어둠의 춤
/시전 표창 폭풍`}</pre>
            </section>
          </div>
        </article>

        <article className="panel guide-card">
          <p className="eyebrow">자주 묻는 질문</p>
          <h2>자주 헷갈리는 부분</h2>
          <ul className="guide-list">
            <li>가속 장신구와 어둠의 춤을 한 매크로에 묶는 것은 권장하지 않습니다. 깊어지는 어둠 반영 지연으로 손해가 날 수 있습니다.</li>
            <li>죽음의 무도를 더 자주 발동하려고 약한 스킬을 억지로 섞을 필요는 없습니다.</li>
            <li>쿨기 밖에서 템포가 느린 것은 정상적인 설계입니다. 무조건 더 많은 가속이 답은 아닙니다.</li>
            <li>정점 특성 조건은 복잡해 보여도 대부분 자연스럽게 맞습니다. 기본 로테이션을 먼저 안정화하는 것이 우선입니다.</li>
          </ul>
        </article>
      </section>

      <section className="locked-guide-grid">
        <article className="panel locked-guide-card">
          <ShieldCheck size={18} />
          <div><b>암살 도적</b><span>항목 생성 완료 · 세부 가이드 잠금</span></div>
        </article>
        <article className="panel locked-guide-card">
          <ShieldCheck size={18} />
          <div><b>무법 도적</b><span>항목 생성 완료 · 세부 가이드 잠금</span></div>
        </article>
      </section>
    </div>
  );
}

function SettingsView({
  settings,
  loggedIn,
  userId,
  character,
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
  autoState: AutoState;
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
  const selectedGearStatus = gearStatusCopy(character);
  return (
    <div className="settings-grid">
      <Panel className="notes-panel">
        <div className="section-head"><div><p className="eyebrow">Notes</p><h2>개인 메모</h2></div></div>
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
            <div><dt>장비 슬롯</dt><dd>{equipmentSlotCount(character)}</dd></div>
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
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
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");
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
  const recentRuns = rio?.mythic_plus_recent_runs || [];
  const snapshot = useMemo(
    () => buildTodaySnapshot({
      character,
      done: settings.done,
      hidden: settings.hidden,
      recentRuns,
      cloudReady,
      rioError,
      lastRioRefreshAt: rioFetchedAt || settings.lastRioRefreshAt,
    }),
    [character, settings.done, settings.hidden, settings.lastRioRefreshAt, recentRuns, cloudReady, rioError, rioFetchedAt],
  );
  const snapshotHash = useMemo(() => buildSnapshotHash(snapshot, preferences), [snapshot, preferences]);
  const fallbackPlan = useMemo(() => buildFallbackPlan(snapshot, preferences), [snapshot, preferences]);
  const activePlan = plan || fallbackPlan;
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
    return onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setCloudReady(false);
        setCharacters([]);
        setActiveCharacterId("");
        setSelectionPhase("idle");
        setShowAiDiagnosis(false);
        setAiUsageCount(0);
        setSettings({ done: {}, hidden: {}, note: "", lastView: "today" });
        return;
      }
      if (nextUser.isAnonymous) {
        setUser(null);
        setCloudReady(false);
        setCharacters([]);
        setActiveCharacterId("");
        setSelectionPhase("idle");
        setShowAiDiagnosis(false);
        setAiUsageCount(0);
        await signOut(auth).catch(() => undefined);
        return;
      }
      setUser(nextUser);
      await loadCloud(nextUser);
    });
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

  async function loadCloud(nextUser: User) {
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
    await setDoc(doc(db, "wowGuideUsers", user.uid, "settings", "v8"), { ...next, updatedAt: serverTimestamp() }, { merge: true });
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
      if (force && !silent) setToast("Wowhead BIS 새로고침 중");
      const token = await user.getIdToken(true);
      const report = await requestWowheadBis(token, force);
      setBisReport(report);
      await saveSettings({ lastWowheadBisRefreshAt: report.fetchedAt });
      if (force && !silent) setToast("Wowhead BIS 비교 갱신 완료");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wowhead BIS 조회 실패";
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
          <span><strong>WJ+ Command</strong><small>오늘 판단 · AI 작전실 · 장비 · 던전 · 가이드</small></span>
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
                <button type="button" onClick={() => signOut(auth)}><LogOut size={16} /> 로그아웃</button>
              </details>
            ) : (
              <button type="button" onClick={googleLogin}><LogIn size={16} /> Google 로그인</button>
            )}
          </div>
        </div>
      </header>

      {!loggedIn ? <LockNotice onLogin={googleLogin} /> : null}

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

        {view === "guides" ? (
          <GuidesView />
        ) : !hasSelectedCharacter ? (
          <CharacterSelectPanel
            loggedIn={loggedIn}
            characters={pickerCharacters}
            onSelect={changeCharacter}
            onLogin={googleLogin}
            onConnect={connectBattleNet}
            onSync={() => syncBattleNet(false)}
            syncLoading={syncLoading}
          />
        ) : (
          <div className={`workspace-wrap ${selectionPhase === "revealed" ? "revealed" : ""}`}>
        {view === "today" ? (
          <TodayView
            loggedIn={loggedIn}
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
          <div className="ai-grid">
            <PreferencePanel preferences={preferences} snapshot={snapshot} onChange={setPreferences} onGenerate={() => generatePlan()} loading={aiLoading} disabled={!loggedIn} />
            <PlanResult plan={activePlan} fallback={!plan || activePlan.model === "local-fallback"} stale={activePlanStale} error={aiError} onDone={toggleDone} onJump={jump} disabled={!loggedIn} />
            <aside className="panel history-panel">
              <div className="section-head compact"><div><p className="eyebrow">History</p><h2>판단 기록</h2></div><History size={18} /></div>
              {historyPlans.length ? historyPlans.map((item) => (
                <button key={item.id} type="button" className={plan?.id === item.id ? "history-item active" : "history-item"} onClick={() => setPlan(item)}>
                  <b>{item.title}</b>
                  <span>{new Date(item.generatedAt).toLocaleString("ko-KR")} · {item.trigger || "manual"}</span>
                </button>
              )) : <EmptyState title="저장된 AI 판단 없음" body="캐릭터 선택 후 AI 진단을 실행하면 판단 기록이 쌓입니다." />}
            </aside>
          </div>
        ) : null}

        {view === "gear" ? (
          <GearView
            character={character}
            rows={snapshot.equipmentRows}
            heroImage={avatar}
            filter={itemFilter}
            setFilter={setItemFilter}
            bisReport={bisReport}
            bisLoading={bisLoading}
            bisError={bisError}
            onRefreshBis={() => refreshWowheadBis(true, false)}
            onDone={toggleDone}
            onJump={jump}
            disabled={!loggedIn}
          />
        ) : null}
        {view === "dungeons" ? <DungeonsView recommendations={snapshot.dungeonRecommendations} /> : null}
        {view === "notes" ? (
          <SettingsView
            settings={settings}
            loggedIn={loggedIn}
            userId={user?.uid || ""}
            character={character}
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
