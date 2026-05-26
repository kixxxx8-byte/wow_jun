import type {
  AiPlan,
  AiPreferences,
  Character,
  DataFreshness,
  DungeonGuide,
  DungeonRecommendation,
  EquipmentItem,
  EquipmentRow,
  EquipmentSlot,
  FreshnessItem,
  MaintenanceRow,
  Target,
  TodaySnapshot,
  TodayTask,
} from "../types";
import { dungeonGuideCatalog } from "./dungeonCatalog";

const icon = (name: string) => `https://wow.zamimg.com/images/wow/icons/large/${name}.jpg`;

export const defaultCharacter: Character = {
  id: "default_azshara_seungseon",
  name: "승선을준비하라",
  realm: "아즈샤라",
  realmSlug: "azshara",
  region: "kr",
  className: "Rogue",
  specName: "암살",
  itemLevel: 253,
  equipment: {},
  media: {},
};

const slotMap: Record<string, string[]> = {
  head: ["HEAD"],
  neck: ["NECK"],
  shoulder: ["SHOULDER"],
  back: ["BACK"],
  chest: ["CHEST"],
  wrist: ["WRIST"],
  hands: ["HANDS"],
  waist: ["WAIST"],
  legs: ["LEGS"],
  feet: ["FEET"],
  finger: ["FINGER_1", "FINGER_2"],
  finger2: ["FINGER_1", "FINGER_2"],
  trinket: ["TRINKET_1", "TRINKET_2"],
  trinket2: ["TRINKET_1", "TRINKET_2"],
  weapon: ["MAIN_HAND", "OFF_HAND"],
  offhand: ["OFF_HAND", "MAIN_HAND"],
};

export const equipmentSlots: EquipmentSlot[] = [
  { key: "HEAD", label: "머리", group: "armor", enchant: false, gem: false },
  { key: "NECK", label: "목", group: "jewelry", enchant: false, gem: true, note: "보석 홈 확인" },
  { key: "SHOULDER", label: "어깨", group: "armor", enchant: false, gem: false },
  { key: "BACK", label: "망토", group: "armor", enchant: true, gem: false, note: "망토 마부 확인" },
  { key: "CHEST", label: "가슴", group: "armor", enchant: true, gem: false, note: "가슴 마부 확인" },
  { key: "WRIST", label: "손목", group: "armor", enchant: true, gem: false, note: "손목 마부 확인" },
  { key: "HANDS", label: "손", group: "armor", enchant: false, gem: false },
  { key: "WAIST", label: "허리", group: "armor", enchant: false, gem: true, note: "허리 보석 확인" },
  { key: "LEGS", label: "다리", group: "armor", enchant: true, gem: false, note: "다리 강화 확인" },
  { key: "FEET", label: "발", group: "armor", enchant: true, gem: false, note: "신발 마부 확인" },
  { key: "FINGER_1", label: "반지 1", group: "jewelry", enchant: true, gem: false, note: "반지 마부 확인" },
  { key: "FINGER_2", label: "반지 2", group: "jewelry", enchant: true, gem: false, note: "반지 마부 확인" },
  { key: "TRINKET_1", label: "장신구 1", group: "trinket", enchant: false, gem: false },
  { key: "TRINKET_2", label: "장신구 2", group: "trinket", enchant: false, gem: false },
  { key: "MAIN_HAND", label: "주무기", group: "weapon", enchant: true, gem: false, note: "무기 마부/룬 확인" },
  { key: "OFF_HAND", label: "보조무기", group: "weapon", enchant: true, gem: false, note: "보조무기 상태 확인" },
];

const enhancementDetails: Record<string, string> = {
  NECK: "보석 홈이 있으면 보석 장착 여부를 확인하세요.",
  BACK: "망토 마법부여를 확인하세요.",
  CHEST: "가슴 마법부여를 확인하세요.",
  WRIST: "손목 마법부여를 확인하세요.",
  WAIST: "허리 보석 홈이 있으면 보석을 장착하세요.",
  LEGS: "다리 방어구 강화를 확인하세요.",
  FEET: "신발 마법부여를 확인하세요.",
  FINGER_1: "반지 마법부여를 확인하세요.",
  FINGER_2: "반지 마법부여를 확인하세요.",
  MAIN_HAND: "무기 마법부여 또는 룬 상태를 확인하세요.",
  OFF_HAND: "보조무기 마법부여 또는 룬 상태를 확인하세요.",
};

export const targets: Target[] = [
  { id: "trinket-alnseer", slot: "trinket", slotLabel: "장신구", priority: 100, type: "dungeon", target: "알른 선견자의 응시", itemId: 249343, icon: icon("inv_eye_02"), source: "레이드", boss: "키마이루스", reason: "Wowhead 암살 도적 BIS 기준 최상위 장신구입니다.", check: "현재 장신구 두 칸에 이미 같은 아이템이 있는지 먼저 확인" },
  { id: "trinket-box", slot: "trinket2", slotLabel: "장신구 2", priority: 96, type: "dungeon", target: "알게타르 수수께끼 상자", itemId: 193701, icon: icon("inv_misc_lockbox_1"), source: "알게타르 대학", boss: "도라고사", reason: "참고 BIS 보조 장신구 후보입니다. 현재 시즌 표에 있을 때만 유지합니다.", check: "다른 장신구와 중복 추천하지 않고, 이미 착용 중이면 제외" },
  { id: "ring-hope", slot: "finger", slotLabel: "반지", priority: 92, type: "dungeon", target: "희망의 신도레이 고리", itemId: 249919, icon: icon("inv_jewelry_ring_161"), source: "레이드", boss: "벨로렌", reason: "참고 BIS 첫 번째 반지 후보입니다.", check: "반지 두 칸 전체 착용 아이템과 중복 여부 확인" },
  { id: "ring-midnight-eye", slot: "finger2", slotLabel: "반지 2", priority: 89, type: "dungeon", target: "한밤의 눈", itemId: 249920, icon: icon("inv_jewelry_ring_162"), source: "한밤의 몰락", boss: "드랍처 확인", reason: "두 번째 반지는 같은 아이템 반복이 아니라 별도 BIS 후보로 추적합니다.", check: "이미 다른 반지 칸에 있으면 오늘 목표에서 제외" },
  { id: "weapon-victory", slot: "weapon", slotLabel: "주무기", priority: 88, type: "dungeon", target: "굶주린 승리", itemId: 249925, icon: icon("inv_weapon_shortblade_101"), source: "레이드", boss: "보라시우스", reason: "참고 BIS 주무기 후보입니다.", check: "주무기/보조무기 전체에서 이미 착용 중이면 중복 추천 제외" },
  { id: "weapon-mercy", slot: "offhand", slotLabel: "보조무기", priority: 82, type: "craft", target: "원정순찰대원의 자비", itemId: 237837, icon: icon("inv_knife_1h_artifactfangs_d_06"), source: "제작", boss: "전문기술", reason: "참고 BIS 보조무기 후보입니다.", check: "주무기와 같은 아이템을 반복 추천하지 않음" },
  { id: "cloak-terrace", slot: "back", slotLabel: "망토", priority: 78, type: "dungeon", target: "저항하는 수호자의 외투", itemId: 260312, icon: icon("inv_cape_special_ardenweald_d_01"), source: "마법학자의 정원", boss: "드랍처 확인", reason: "현재 시즌 BIS 표에 있는 던전 망토 후보입니다.", check: "낡은 과거 시즌 망토 후보 대신 현재 시즌 표 기준으로 확인" },
  { id: "legs-windrunner", slot: "legs", slotLabel: "다리", priority: 74, type: "dungeon", target: "머무는 유산의 다리싸개", itemId: 251087, icon: icon("inv_pants_leather_raidrogue_s_01"), source: "윈드러너 첨탑", boss: "드랍처 확인", reason: "현재 시즌 BIS 표에 있는 던전 다리 후보입니다.", check: "다리 강화보다 아이템 교체가 먼저 필요한지 확인" },
  { id: "wrist-craft", slot: "wrist", slotLabel: "손목", priority: 68, type: "craft", target: "실버문 요원의 굴절보호대", itemId: 244576, icon: icon("inv_bracer_leather_raidrogue_s_01"), source: "제작", boss: "전문기술", reason: "참고 BIS 제작 손목 후보입니다.", check: "제작 전 현재 손목 마부와 제작 비용 확인" },
  { id: "feet-cosmos", slot: "feet", slotLabel: "발", priority: 64, type: "dungeon", target: "나무 지붕 방랑자의 발등싸개", itemId: 249382, icon: icon("inv_boots_leather_raidrogue_s_01"), source: "공결탑 제나스", boss: "Crown of the Cosmos", reason: "현재 시즌 BIS 표에 있는 발 후보입니다.", check: "신발 마부와 현재 템렙을 같이 확인" },
];

const activeGearTargets: Target[] = [];

export const dungeonGuides: DungeonGuide[] = [
  {
    id: "algethar",
    short: "알게타르",
    name: "알게타르 대학",
    timer: "31:00",
    href: "https://wythic.com/ko/dungeon/algeth-ar-academy",
    videoUrl: "https://youtu.be/Bruu-k2BRw8?t=16",
    route: "보스 순서를 파티에 맞게 조정하고 막넴 고정",
    danger: "보주 처리, 바닥 정리, 3중첩 관리",
    overview: ["장신구와 반지 목표가 겹쳐 효율이 높습니다.", "보주와 바닥이 겹치는 구간에서 생존기를 아끼지 않습니다.", "점수와 장비를 동시에 노릴 때 첫 후보로 좋습니다."],
    bosses: [
      { name: "벡사무스", risk: "높음", one: "보주를 몸으로 막고 비전 웅덩이는 외곽으로 버립니다.", do: ["보주가 보스에 닿기 전에 차단", "비전 웅덩이 대상자는 외곽 이동", "광역 피해 직후 생존기 확인"], healer: "보주 처리 직후 광역 피해가 오므로 파티 체력 안정화가 중요합니다." },
      { name: "도라고사", risk: "높음", one: "균열을 정리하고 과중첩 전에 이동합니다.", do: ["비전 균열을 외곽에 배치", "중첩이 높아지면 즉시 이동", "긴 전투를 대비해 쿨기를 나눠 사용"], healer: "전투 후반 파티 피해가 누적됩니다. 큰 쿨기를 40% 이후에 남겨두세요." },
    ],
  },
  {
    id: "xenas",
    short: "제나스",
    name: "공결탑 제나스",
    timer: "30:00",
    href: "https://wythic.com/ko/dungeon/nexus-point-xenas",
    videoUrl: "https://youtu.be/2fZDscuSc-I?t=122",
    route: "짧은 동선과 중앙 보스 위주로 진행",
    danger: "광선, 공허 바닥, 차단 실패",
    overview: ["반지, 무기, 손 후보가 있어 부족 부위 보완에 좋습니다.", "광선과 바닥을 외곽으로 유도하면 난도가 크게 내려갑니다.", "차단 순서가 꼬이면 급격히 위험해집니다."],
    bosses: [
      { name: "키스레스", risk: "높음", one: "광선 대상자는 교차 지점에서 광선을 끊습니다.", do: ["광선 교차 지점 이동", "공허 바닥 외곽 유도", "차단 순서 확인"], healer: "광선 처리 중 산개가 커지므로 원거리 체력 확인이 필요합니다." },
      { name: "로스픽시스", risk: "치명", one: "분신 중 빛이 없는 진짜를 찾아 차단합니다.", do: ["분신 근처 5m 접근 금지", "진짜만 차단", "이동 경로 바닥 정리"], healer: "분신 생성 직후 이동 피해가 겹칩니다. 파티 경로를 먼저 확인하세요." },
    ],
  },
  {
    id: "saron",
    short: "사론",
    name: "사론의 구덩이",
    timer: "32:00",
    href: "https://wythic.com/ko/dungeon/pit-of-saron",
    videoUrl: "https://youtu.be/Bruu-k2BRw8?t=434",
    route: "시야 차단과 추격 패턴을 안정적으로 처리",
    danger: "광석 시야, 망령 차단, 육중한 구슬",
    overview: ["무기 후보가 있어 무기 교체가 필요할 때 가치가 큽니다.", "시야 차단을 모르면 불필요한 사망이 늘어납니다.", "긴 이동 구간은 파티 속도 차이를 줄이는 것이 중요합니다."],
    bosses: [
      { name: "가프로스트", risk: "중간", one: "광석 뒤로 숨어 시야를 끊습니다.", do: ["광석을 파티 동선 밖에 배치", "광역 시전 때 광석 뒤로 이동", "탱커 위치를 고정"], healer: "시야 차단 실패자가 나오면 즉시 생존기 콜을 고려하세요." },
      { name: "이크와 크리크", risk: "높음", one: "망령은 빠르게 차단하고 추격 대상자는 거리 벌립니다.", do: ["망령 소환 즉시 차단", "추격 대상자는 전방 이동", "독 바닥을 중앙에 남기지 않기"], healer: "추격과 망령 처리 중 산개가 커집니다. 개인 생존기를 미리 안내하세요." },
    ],
  },
  {
    id: "skyreach",
    short: "하늘탑",
    name: "하늘탑",
    timer: "28:00",
    href: "https://wythic.com/ko/dungeon/skyreach",
    videoUrl: "https://youtu.be/Bruu-k2BRw8?t=317",
    route: "직선 동선, 보스 패턴 실수 최소화",
    danger: "바람벽, 광선, 추락",
    overview: ["장신구 보조 후보 확인용으로 좋습니다.", "짧지만 실수하면 바로 사망하는 패턴이 많습니다.", "모바일에서 빠르게 읽기 쉬운 브리핑이 중요합니다."],
    bosses: [
      { name: "루크란", risk: "높음", one: "불사조와 바닥을 외곽으로 빼고 시야를 유지합니다.", do: ["불사조 경로 확인", "중앙 바닥 금지", "광역 피해 전 생존기 준비"], healer: "불사조 중첩 구간에서 파티 체력이 빠르게 흔들립니다." },
      { name: "비릭스", risk: "치명", one: "반사 광선을 외곽으로 유도하고 쫄은 빠르게 정리합니다.", do: ["광선 대상자는 외곽 이동", "쫄은 빠르게 점사", "추락 위험 구간에서 과이동 금지"], healer: "쫄 처리 실패 시 피해가 폭증합니다. 광역 쿨기를 준비하세요." },
    ],
  },
  {
    id: "magisters",
    short: "마법정원",
    name: "마법학자의 정원",
    timer: "34:00",
    href: "https://wythic.com/ko/dungeon/magisters-terrace",
    videoUrl: "https://youtu.be/2fZDscuSc-I",
    route: "차단과 해제 우선순위를 정하고 진행",
    danger: "해제, 차단, 바닥 누적",
    overview: ["방어구 보완과 정비 확인용 던전입니다.", "차단 실패가 누적되면 보스보다 쫄 구간이 더 위험합니다.", "힐러 해제 부담을 줄이는 동선이 중요합니다."],
    bosses: [
      { name: "셀린 파이어하트", risk: "높음", one: "마나 구슬을 처리하고 바닥을 외곽에 버립니다.", do: ["구슬 점사", "바닥 외곽 배치", "차단 순서 유지"], healer: "구슬 처리 중 광역 피해가 올라옵니다." },
      { name: "캘타스", risk: "치명", one: "구역을 나눠 바닥을 버리고 불사조를 빠르게 정리합니다.", do: ["4구역 배치", "불사조 점사", "광선과 바닥 겹침 방지"], healer: "후반 광역 피해가 강하므로 큰 쿨기를 남겨두세요." },
    ],
  },
  {
    id: "maisara",
    short: "마이사라",
    name: "마이사라 동굴",
    timer: "33:00",
    href: "https://wythic.com/ko/dungeon/maisara-caverns",
    videoUrl: "https://youtu.be/2fZDscuSc-I?t=304",
    route: "동시 처치와 질병 해제 중심",
    danger: "질병, 보호막, 상쇄 찾기",
    overview: ["방어구 후보 보완용으로 확인합니다.", "질병 해제와 보호막 파괴가 핵심입니다.", "상쇄 찾기 패턴을 모르면 시간이 크게 밀립니다."],
    bosses: [
      { name: "무로진과 스크엑스", risk: "높음", one: "두 보스 체력을 맞추고 질병을 빠르게 해제합니다.", do: ["체력 균등 조절", "질병 해제", "강화 대상 빠르게 처리"], healer: "질병 해제가 1순위입니다. 해제 불가 구간은 개인 생존기를 안내하세요." },
      { name: "렉크타", risk: "치명", one: "토템은 즉시 파괴하고 상쇄를 빠르게 찾습니다.", do: ["토템 점사", "상쇄 위치 확인", "광역 피해 전 산개"], healer: "토템 방치 시 복구가 어려워집니다. 광역 쿨기를 아끼지 마세요." },
    ],
  },
];

export function defaultPreferences(): AiPreferences {
  return {
    timeBudget: "60m",
    goal: "gear",
    energy: "normal",
    party: "either",
    risk: "balanced",
    preferredDungeons: [],
    avoidedDungeons: [],
    freeNote: "",
    useWeb: false,
  };
}

export function normalizeRealm(realm?: string) {
  const raw = String(realm || "").trim();
  const key = raw.toLowerCase();
  const map: Record<string, string> = {
    아즈샤라: "azshara",
    azshara: "azshara",
    하이잘: "hyjal",
    hyjal: "hyjal",
    불타는군단: "burning-legion",
    "burning-legion": "burning-legion",
    헬스크림: "hellscream",
    hellscream: "hellscream",
    듀로탄: "durotan",
    durotan: "durotan",
  };
  if (/^[a-z0-9-]+$/.test(key)) return key;
  return map[raw] || map[key] || key.replace(/\s+/g, "-");
}

export function itemIcon(item?: EquipmentItem | null) {
  if (!item) return "";
  if (item.iconUrl) return item.iconUrl;
  if (item.icon?.startsWith("http")) return item.icon;
  return item.icon ? icon(item.icon) : "";
}

function itemLevel(item?: EquipmentItem | null) {
  return Number(item?.level || item?.itemLevel || 0);
}

type EnhancementValue = NonNullable<EquipmentItem["enchantments"]>[number];
type SocketValue = NonNullable<EquipmentItem["sockets"]>[number];

function textFromEnhancement(value: EnhancementValue) {
  if (typeof value === "string") return value;
  return value.displayString || value.display || value.name || value.source || "";
}

export function appliedEnhancementText(item?: EquipmentItem | null) {
  if (!item) return [];
  const enchants = (item.enchantments || []).map(textFromEnhancement).filter(Boolean);
  const sockets = (item.sockets || [])
    .map((socket) => typeof socket === "string" ? socket : socket.item?.name || socket.displayString || socket.display || "")
    .filter(Boolean);
  return [...enchants, ...sockets];
}

function hasEnchant(item?: EquipmentItem | null) {
  return Boolean(item && (item.enchantments || []).map(textFromEnhancement).some(Boolean));
}

function socketText(socket: SocketValue) {
  if (typeof socket === "string") return socket;
  return socket.item?.name || socket.displayString || socket.display || "";
}

function hasFilledSocket(item?: EquipmentItem | null) {
  return Boolean(item && (item.sockets || []).map(socketText).some(Boolean));
}

function hasExplicitEmptySocket(item?: EquipmentItem | null) {
  if (!item?.sockets?.length) return false;
  return item.sockets.some((socket) => {
    if (typeof socket === "string") return /빈|empty|socket/i.test(socket) && !/보석|gem/i.test(socket);
    return !socket.item?.name && !socket.itemId && !socket.displayString && !socket.display;
  });
}

export function itemMeta(item?: EquipmentItem | null) {
  if (!item) return "장비 없음";
  const bits = [];
  const level = itemLevel(item);
  if (level) bits.push(`아이템 레벨 ${level}`);
  const stat = (item.stats || [])
    .slice(0, 2)
    .map((row) => row.display || [row.name || row.type, row.value].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" · ");
  if (stat) bits.push(stat);
  return bits.join(" · ") || "세부 정보 없음";
}

function hasEnhancement(item: EquipmentItem | null) {
  return Boolean(item && appliedEnhancementText(item).length);
}

function itemForTarget(character: Character, target: Target) {
  const equipment = character.equipment || {};
  const keys = slotMap[target.slot] || [];
  return keys
    .map((key) => equipment[key])
    .filter(Boolean)
    .sort((a, b) => itemLevel(a) - itemLevel(b))[0] || null;
}

function numericItemId(item?: EquipmentItem | null) {
  const value = Number(item?.id || 0);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function targetItemId(target?: Target | null) {
  const value = Number(target?.itemId || 0);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function slotItemId(character: Character, slotKey: string) {
  return numericItemId(character.equipment?.[slotKey] || null);
}

function targetGroup(target: Target) {
  const keys = slotMap[target.slot] || [];
  if (keys.includes("FINGER_1") || keys.includes("FINGER_2")) return "finger";
  if (keys.includes("TRINKET_1") || keys.includes("TRINKET_2")) return "trinket";
  if (keys.includes("MAIN_HAND") || keys.includes("OFF_HAND")) return "weapon";
  return keys[0] || target.slot;
}

function slotGroup(slotKey: string) {
  if (slotKey === "FINGER_1" || slotKey === "FINGER_2") return "finger";
  if (slotKey === "TRINKET_1" || slotKey === "TRINKET_2") return "trinket";
  if (slotKey === "MAIN_HAND" || slotKey === "OFF_HAND") return "weapon";
  return slotKey;
}

function preferredSlot(target: Target) {
  const keys = slotMap[target.slot] || [];
  if (target.slot.endsWith("2")) return keys[1] || keys[0] || "";
  return keys[0] || "";
}

function openSlotsByNeed(character: Character, slotKeys: string[]) {
  return slotKeys
    .slice()
    .sort((a, b) => {
      const aLevel = itemLevel(character.equipment?.[a] || null);
      const bLevel = itemLevel(character.equipment?.[b] || null);
      if (aLevel !== bLevel) return aLevel - bLevel;
      return slotKeys.indexOf(a) - slotKeys.indexOf(b);
    });
}

function buildTargetAssignments(character: Character, done: Record<string, boolean> = {}, hidden: Record<string, boolean> = {}) {
  const assignments = new Map<string, Target>();
  const usedTargetIds = new Set<string>();
  const allGroups = Array.from(new Set(equipmentSlots.map((slot) => slotGroup(slot.key))));

  allGroups.forEach((group) => {
    const slotKeys = equipmentSlots.map((slot) => slot.key).filter((key) => slotGroup(key) === group);
    const equippedIds = new Set(slotKeys.map((key) => slotItemId(character, key)).filter(Boolean));
    const usedIds = new Set(equippedIds);

    const candidates = activeGearTargets
      .filter((target) => !done[target.id] && !hidden[target.id] && targetGroup(target) === group)
      .filter((target) => {
        const id = targetItemId(target);
        return !id || !usedIds.has(id);
      })
      .sort((a, b) => b.priority - a.priority);

    candidates.forEach((target) => {
      if (usedTargetIds.has(target.id)) return;
      const id = targetItemId(target);
      if (id && usedIds.has(id)) return;
      const preferred = preferredSlot(target);
      const orderedSlots = preferred
        ? [preferred, ...openSlotsByNeed(character, slotKeys).filter((key) => key !== preferred)]
        : openSlotsByNeed(character, slotKeys);
      const slotKey = orderedSlots.find((key) => !assignments.has(key));
      if (!slotKey) return;
      assignments.set(slotKey, target);
      usedTargetIds.add(target.id);
      if (id) usedIds.add(id);
    });
  });

  return assignments;
}

function activeTargetList(character: Character, done: Record<string, boolean> = {}, hidden: Record<string, boolean> = {}) {
  const assignedIds = new Set(Array.from(buildTargetAssignments(character, done, hidden).values()).map((target) => target.id));
  return activeGearTargets
    .filter((target) => assignedIds.has(target.id))
    .map((target) => ({ ...target, score: target.priority }))
    .sort((a, b) => b.score - a.score);
}

function enhancementStatus(slot: EquipmentSlot, item: EquipmentItem | null) {
  if (!item) return { label: "장비 없음", detail: "착용 장비 확인 후 강화 여부를 판단합니다.", tone: "ok" as const };
  if (!slot.enchant && !slot.gem) return { label: "확인 불필요", detail: "기본 강화 대상이 아닙니다.", tone: "ok" as const };
  if (slot.enchant) {
    if (hasEnchant(item)) return { label: "마부 확인됨", detail: "마법부여 흔적이 있습니다.", tone: "ok" as const };
    return { label: "마부 확인", detail: enhancementDetails[slot.key] || slot.note || "마법부여 상태 확인", tone: "warn" as const };
  }
  if (slot.gem) {
    if (hasFilledSocket(item)) return { label: "보석 확인됨", detail: "보석 장착 흔적이 있습니다.", tone: "ok" as const };
    if (hasExplicitEmptySocket(item)) return { label: "보석 확인", detail: enhancementDetails[slot.key] || slot.note || "빈 보석 홈을 확인하세요.", tone: "warn" as const };
    return { label: "조건부 확인", detail: "보석 홈이 확인될 때만 정비 대상으로 표시합니다.", tone: "ok" as const };
  }
  if (hasEnhancement(item)) return { label: "강화 확인됨", detail: "마부/보석 흔적이 있습니다.", tone: "ok" as const };
  return { label: "확인 불필요", detail: "기본 강화 대상이 아닙니다.", tone: "ok" as const };
}

export function equipmentRows(character: Character, done: Record<string, boolean> = {}): EquipmentRow[] {
  const targetAssignments = buildTargetAssignments(character, done);
  return equipmentSlots.map((slot) => {
    const equippedItem = character.equipment?.[slot.key] || null;
    const target = targetAssignments.get(slot.key) || null;
    const comparisonItem = target ? itemForTarget(character, target) : null;
    const lowLevelPenalty = equippedItem && itemLevel(equippedItem) > 0 && itemLevel(equippedItem) < 255 ? 16 : 0;
    const enhancement = enhancementStatus(slot, equippedItem);
    const score = target && !done[target.id] ? target.priority + lowLevelPenalty : enhancement.tone === "warn" ? 35 : 10;
    return {
      slot,
      slotKey: slot.key,
      slotLabel: slot.label,
      item: equippedItem,
      equippedItem,
      targetItem: null,
      comparisonItem,
      target,
      score,
      type: target?.type || "none",
      enhancement,
    };
  });
}

export function activeTargets(character: Character = defaultCharacter, done: Record<string, boolean> = {}, hidden: Record<string, boolean> = {}, limit = Infinity) {
  return activeTargetList(character, done, hidden).slice(0, limit);
}

export function maintenanceRows(character: Character, done: Record<string, boolean> = {}): MaintenanceRow[] {
  return equipmentRows(character, done)
    .filter((row) => row.enhancement.tone === "warn")
    .map((row) => ({
      todoId: `maintenance-${row.slotKey}`,
      slotKey: row.slotKey,
      slotLabel: row.slotLabel,
      item: row.equippedItem,
      priority: row.score + 20,
      enhancement: row.enhancement,
    }))
    .filter((row) => !done[row.todoId])
    .sort((a, b) => b.priority - a.priority);
}

function targetMatchesDungeon(target: Target, guide: DungeonGuide) {
  return target.source.includes(guide.name) || guide.name.includes(target.source) || target.source.includes(guide.short);
}

export function dungeonRecommendations(character: Character = defaultCharacter, done: Record<string, boolean> = {}, hidden: Record<string, boolean> = {}, limit = 4): DungeonRecommendation[] {
  const visible = activeTargets(character, done, hidden, Infinity);
  return dungeonGuideCatalog
    .map((guide) => {
      const matched = visible.filter((target) => targetMatchesDungeon(target, guide));
      return {
        id: guide.id,
        name: guide.name,
        short: guide.short,
        href: guide.href,
        why: guide.overview[0] || guide.route,
        loot: matched.length ? matched.map((target) => `${target.slotLabel} ${target.target}`).join(", ") : "직접 연결된 오늘 목표 없음",
        memo: guide.danger,
        count: matched.length,
        targets: matched,
        score: matched.reduce((sum, target) => sum + target.priority, 0),
        guide,
      };
    })
    .sort((a, b) => b.score - a.score || b.count - a.count || a.name.localeCompare(b.name, "ko"))
    .slice(0, limit);
}

export function todayTasks(character: Character, done: Record<string, boolean> = {}, hidden: Record<string, boolean> = {}): TodayTask[] {
  const rows: TodayTask[] = [];
  if (!Object.keys(character.equipment || {}).length && !hidden.sync) {
    rows.push({
      id: "sync",
      title: "장비 데이터 갱신",
      itemName: "Battle.net 장비 불러오기",
      body: "현재 착용 장비가 비어 있어 추천 정확도가 낮습니다.",
      detail: "장비, 마부/보석, 던전 우선순위를 다시 계산합니다.",
      type: "urgent",
      action: "동기화",
      command: "sync",
      button: "새로고침",
      done: Boolean(done.sync),
      score: 999,
    });
  }

  activeTargets(character, done, hidden, 6).forEach((target) => {
    rows.push({
      id: target.id,
      title: `${target.slotLabel} 교체 후보`,
      itemName: target.target,
      body: `${target.source}${target.boss ? ` · ${target.boss}` : ""}`,
      detail: target.check || target.reason,
      type: target.score >= 90 ? "urgent" : target.type,
      action: target.type === "craft" ? "제작/마부" : "파밍",
      icon: target.icon,
      score: target.score,
      view: target.type === "craft" ? "gear" : "dungeons",
      done: Boolean(done[target.id]),
    });
  });

  return rows
    .filter((row) => !hidden[row.id])
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 6);
}

function ageLabel(value?: string, warnHours = 12) {
  if (!value) return { label: "기록 없음", tone: "warn" as const, detail: "갱신 기록이 없습니다." };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: "확인 필요", tone: "warn" as const, detail: "갱신 시간을 해석하지 못했습니다." };
  const hours = (Date.now() - date.getTime()) / 36e5;
  return {
    label: hours > warnHours ? `${Math.round(hours)}시간 전` : "최신",
    tone: hours > warnHours ? "warn" as const : "ok" as const,
    detail: date.toLocaleString("ko-KR"),
  };
}

export function dataFreshness(character: Character, recentRuns: unknown[], cloudReady: boolean, rioError?: string, lastRioRefreshAt?: string): DataFreshness {
  const equipmentCount = Object.keys(character.equipment || {}).length;
  const gearStatus = character.gearStatus || (equipmentCount ? "ok" : "empty");
  let bnet: FreshnessItem;
  if (character.syncStatus === "stale" || gearStatus === "stale") {
    bnet = { label: "이전 캐릭터", tone: "warn", detail: "이번 Battle.net 동기화에서 계정 목록에 없었습니다." };
  } else if (gearStatus === "failed") {
    bnet = { label: "장비 조회 실패", tone: "err", detail: character.gearError || character.syncError || "Battle.net 장비 상세 조회가 실패했습니다." };
  } else if (gearStatus === "empty" || !equipmentCount) {
    bnet = { label: "장비 없음", tone: "err", detail: "Battle.net 장비 동기화가 필요합니다." };
  } else {
    const freshness = ageLabel(character.gearSyncedAt || character.syncedAt || character.updatedAt || character.lastUpdated, 18);
    bnet = { ...freshness, detail: `${freshness.detail} · ${equipmentCount} slots` };
  }
  return {
    bnet,
    rio: rioError ? { label: "조회 실패", tone: "err", detail: rioError } : { ...ageLabel(lastRioRefreshAt, 6), detail: `${recentRuns.length}개 최근 기록` },
    cloud: cloudReady ? { label: "연결됨", tone: "ok", detail: "Firestore 저장 가능" } : { label: "대기", tone: "warn", detail: "로그인 후 저장됩니다." },
  };
}

export function buildTodaySnapshot(input: {
  character: Character;
  done?: Record<string, boolean>;
  hidden?: Record<string, boolean>;
  recentRuns?: unknown[];
  cloudReady?: boolean;
  rioError?: string;
  lastRioRefreshAt?: string;
}): TodaySnapshot {
  const done = input.done || {};
  const hidden = input.hidden || {};
  const recentRuns = input.recentRuns || [];
  return {
    character: input.character,
    equipmentRows: equipmentRows(input.character, done),
    todayTasks: todayTasks(input.character, done, hidden),
    maintenanceRows: maintenanceRows(input.character, done),
    dungeonRecommendations: dungeonRecommendations(input.character, done, hidden, 4),
    recentRuns,
    dataFreshness: dataFreshness(input.character, recentRuns, Boolean(input.cloudReady), input.rioError, input.lastRioRefreshAt),
  };
}

export function buildFallbackPlan(snapshot: TodaySnapshot, preferences: AiPreferences, reason = "AI API를 사용할 수 없어 기본 판단을 표시합니다."): AiPlan {
  const now = new Date().toISOString();
  const actions = snapshot.todayTasks.slice(0, 5).map((task, index) => ({
    rank: index + 1,
    title: task.title,
    type: task.command === "sync" ? "sync" as const : task.type === "craft" ? "maintenance" as const : "dungeon" as const,
    reason: task.detail || task.body,
    evidence: [task.itemName, task.body].filter(Boolean),
    estimatedTime: preferences.timeBudget === "30m" ? "10-20분" : "20-40분",
    targetId: task.id,
    dungeonId: task.view === "dungeons" ? snapshot.dungeonRecommendations[0]?.id || "" : "",
  }));
  return {
    id: `fallback-${Date.now()}`,
    generatedAt: now,
    model: "local-fallback",
    mode: preferences.useWeb ? "web_augmented" : "data_only",
    title: snapshot.dungeonRecommendations[0]?.count ? `${snapshot.dungeonRecommendations[0].short} 우선 작전` : "오늘 기본 판단",
    summary: reason,
    confidence: snapshot.dataFreshness.bnet.tone === "ok" ? "medium" : "low",
    actions,
    timePlans: {
      short: actions.slice(0, 2).map((action) => action.title),
      normal: actions.slice(0, 3).map((action) => action.title),
      long: actions.map((action) => action.title),
    },
    avoid: snapshot.dungeonRecommendations.filter((row) => row.count === 0).slice(0, 2).map((row) => `${row.name}: 오늘 목표와 직접 연결이 약합니다.`),
    assumptions: ["기존 장비/던전 우선순위 계산을 기반으로 표시했습니다.", `사용자 목표: ${preferences.goal}`],
    dataWarnings: Object.values(snapshot.dataFreshness).filter((row) => row.tone !== "ok").map((row) => `${row.label} · ${row.detail}`),
    sources: [],
  };
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const next = (value as Record<string, unknown>)[key];
      if (typeof next !== "function" && next !== undefined) acc[key] = stable(next);
      return acc;
    }, {});
}

export function buildSnapshotHash(snapshot: TodaySnapshot, preferences: AiPreferences) {
  const source = JSON.stringify(stable({
    character: snapshot.character,
    equipmentRows: snapshot.equipmentRows.map((row) => ({
      slotKey: row.slotKey,
      item: row.equippedItem ? { name: row.equippedItem.name, level: itemLevel(row.equippedItem), enchants: appliedEnhancementText(row.equippedItem) } : null,
      targetId: row.target?.id,
      enhancement: row.enhancement,
    })),
    todayTasks: snapshot.todayTasks.map((task) => ({ id: task.id, done: task.done, score: task.score })),
    gearRecommendation: snapshot.gearRecommendation ? {
      mode: snapshot.gearRecommendation.mode,
      currentScore: snapshot.gearRecommendation.currentScore,
      targetScore: snapshot.gearRecommendation.targetScore,
      upgrades: snapshot.gearRecommendation.priorityUpgrades.map((row) => ({ slot: row.slot, itemId: row.recommendedItem.itemId, score: row.recommendationScore })),
      actions: snapshot.gearRecommendation.weeklyActionPlan.actions.map((row) => ({ id: row.id, priority: row.priority })),
    } : null,
    recentRuns: snapshot.recentRuns,
    preferences,
  }));
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function statTotals(rows: EquipmentRow[]) {
  const stats = { crit: 0, haste: 0, mastery: 0, vers: 0 };
  const map: Record<string, keyof typeof stats> = {
    CRIT_RATING: "crit",
    HASTE_RATING: "haste",
    MASTERY_RATING: "mastery",
    VERSATILITY: "vers",
    치명타: "crit",
    가속: "haste",
    특화: "mastery",
    유연성: "vers",
  };
  rows.forEach((row) => {
    (row.equippedItem?.stats || []).forEach((stat) => {
      const key = map[stat.type || ""] || map[stat.name || ""];
      if (key) stats[key] += Number(stat.value || 0);
    });
  });
  return stats;
}

export function gearReadinessScore(rows: EquipmentRow[]) {
  const urgent = rows.filter((row) => row.target && row.score >= 75).length;
  const missingEnhance = rows.filter((row) => row.enhancement.tone === "warn").length;
  const current = Math.max(0, Math.min(100, 100 - urgent * 5 - missingEnhance * 4));
  const target = Math.max(current, Math.min(100, current + urgent * 5 + missingEnhance * 4));
  return { current, target, urgent, missingEnhance };
}
