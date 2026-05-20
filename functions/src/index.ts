import { randomUUID } from "node:crypto";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();

const region = "asia-northeast3";
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const bnetClientId = defineSecret("BNET_CLIENT_ID");
const bnetClientSecret = defineSecret("BNET_CLIENT_SECRET");
const bnetSecrets = [bnetClientId, bnetClientSecret];
const db = admin.firestore();
const AI_DAILY_LIMIT = 200;

type HttpErrorCode = 400 | 401 | 404 | 405 | 429 | 500 | 502;
type AiTrigger = "manual";

class HttpError extends Error {
  constructor(public status: HttpErrorCode, message: string) {
    super(message);
  }
}

const planSchema = {
  type: "object",
  required: [
    "id",
    "generatedAt",
    "model",
    "mode",
    "title",
    "summary",
    "confidence",
    "actions",
    "timePlans",
    "avoid",
    "assumptions",
    "dataWarnings",
    "sources",
  ],
  properties: {
    id: { type: "string" },
    generatedAt: { type: "string" },
    model: { type: "string" },
    mode: { type: "string", enum: ["data_only", "web_augmented"] },
    title: { type: "string" },
    summary: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        required: ["rank", "title", "type", "reason", "evidence", "estimatedTime", "targetId", "dungeonId"],
        properties: {
          rank: { type: "number" },
          title: { type: "string" },
          type: { type: "string", enum: ["dungeon", "item", "maintenance", "sync", "avoid"] },
          reason: { type: "string" },
          evidence: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 6,
          },
          estimatedTime: { type: "string" },
          targetId: { type: "string" },
          dungeonId: { type: "string" },
        },
      },
    },
    timePlans: {
      type: "object",
      required: ["short", "normal", "long"],
      properties: {
        short: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
        normal: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
        long: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
      },
    },
    avoid: { type: "array", items: { type: "string" }, maxItems: 5 },
    assumptions: { type: "array", items: { type: "string" }, maxItems: 6 },
    dataWarnings: { type: "array", items: { type: "string" }, maxItems: 6 },
    sources: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        required: ["title", "url"],
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
      },
    },
  },
} as const;

const systemPrompt = [
  "You are an AI command planner for a personal World of Warcraft dashboard.",
  "Answer in Korean.",
  "Use the provided snapshot and preferences as the primary evidence.",
  "Do not invent unknown facts. Put uncertainty in assumptions or dataWarnings.",
  "Sort recommendations by what the user should do today, immediately and practically.",
  "Each action.evidence item must cite concrete data present in the snapshot.",
  "If targetId or dungeonId is unknown, return an empty string.",
  "If web search is off, return an empty sources array.",
  "If snapshot.gearRecommendation is present, explain and prioritize only those engine results.",
  "Do not invent item names, dungeon names, sources, or upgrades outside snapshot.gearRecommendation.",
  "Do not recommend raid items when the gear recommendation mode excludes raid.",
  "Never describe recommendationScore as DPS or simulated damage.",
].join("\n");

function getBearer(req: { headers: Record<string, string | string[] | undefined> }) {
  const raw = req.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.startsWith("Bearer ")) throw new HttpError(401, "Firebase auth token is required.");
  return value.slice("Bearer ".length);
}

function getSecretValue(secret: { value: () => string } | null, envName: string) {
  if (!secret) return process.env[envName] || "";
  try {
    return secret.value() || process.env[envName] || "";
  } catch {
    return process.env[envName] || "";
  }
}

function stringQuery(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || "");
  return typeof value === "string" ? value : "";
}

function safeReturnTo(value: unknown) {
  const raw = stringQuery(value) || "/v8/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/v8/";
  return raw;
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "https://local.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

function callbackUrl(req: { get(name: string): string | undefined; protocol: string }) {
  const host = (req.get("x-forwarded-host") || req.get("host") || "hokkaido-trip-c1907.web.app").split(",")[0].trim();
  const proto = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  return `${proto}://${host}/auth/bnet/callback`;
}

function assertPlanRequest(body: unknown) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Request body is empty.");
  const data = body as Record<string, unknown>;
  if (typeof data.characterId !== "string") throw new HttpError(400, "characterId is required.");
  if (typeof data.date !== "string") throw new HttpError(400, "date is required.");
  if (typeof data.snapshotHash !== "string") throw new HttpError(400, "snapshotHash is required.");
  if (data.trigger !== "manual") throw new HttpError(400, "trigger must be manual.");
  if (!data.preferences || typeof data.preferences !== "object") throw new HttpError(400, "preferences is required.");
  if (!data.snapshot || typeof data.snapshot !== "object") throw new HttpError(400, "snapshot is required.");
  return data as Record<string, unknown> & {
    date: string;
    preferences: { useWeb?: unknown };
    snapshotHash: string;
    trigger: AiTrigger;
  };
}

async function assertUsageAvailable(uid: string, date: string) {
  const ref = db.collection("wowGuideUsers").doc(uid).collection("aiUsage").doc(date);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    const count = Number(data.count || 0);
    const last = data.lastGeneratedAt as admin.firestore.Timestamp | undefined;
    const now = admin.firestore.Timestamp.now();
    if (count >= AI_DAILY_LIMIT) throw new HttpError(429, "Daily AI generation limit reached.");
    if (last && now.toMillis() - last.toMillis() < 60_000) {
      throw new HttpError(429, "AI plan can be generated once per minute.");
    }
  });
}

async function recordUsage(uid: string, date: string) {
  const ref = db.collection("wowGuideUsers").doc(uid).collection("aiUsage").doc(date);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = Number(snap.data()?.count || 0);
    tx.set(
      ref,
      {
        count: count + 1,
        lastGeneratedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

function geminiText(data: Record<string, unknown>) {
  const candidates = data.candidates;
  if (!Array.isArray(candidates)) return "";
  const first = candidates[0] as { content?: { parts?: Array<{ text?: string }> } } | undefined;
  return first?.content?.parts?.map((part) => part.text || "").join("") || "";
}

function parseGeminiJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed) as Record<string, unknown>;
}

async function callGemini(payload: Record<string, unknown>, useWeb: boolean) {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const apiKey = getSecretValue(geminiApiKey, "GEMINI_API_KEY");
  if (!apiKey) throw new HttpError(500, "GEMINI_API_KEY secret is not configured.");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(payload) }],
          },
        ],
        tools: useWeb ? [{ googleSearch: {} }, { urlContext: {} }] : undefined,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: planSchema,
          temperature: 0.25,
        },
      }),
    },
  );

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof data.error === "object" && data.error
        ? String((data.error as { message?: unknown }).message || "Gemini request failed.")
        : "Gemini request failed.";
    throw new HttpError(res.status === 429 ? 429 : 502, message);
  }
  const text = geminiText(data);
  if (!text) throw new HttpError(502, "Gemini did not return structured JSON.");
  return parseGeminiJson(text);
}

function normalizePlan(
  plan: Record<string, unknown>,
  body: { preferences: unknown; snapshotHash: string; trigger: AiTrigger },
  useWeb: boolean,
) {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  return {
    ...plan,
    id: typeof plan.id === "string" && plan.id ? plan.id : randomUUID(),
    generatedAt: typeof plan.generatedAt === "string" ? plan.generatedAt : new Date().toISOString(),
    model,
    mode: useWeb ? "web_augmented" : "data_only",
    snapshotHash: body.snapshotHash,
    trigger: body.trigger,
    preferences: body.preferences,
  };
}

async function persistPlan(
  uid: string,
  plan: Record<string, unknown>,
  body: { preferences: unknown; snapshotHash: string; trigger: AiTrigger; date: string },
) {
  const id = typeof plan.id === "string" && plan.id ? plan.id : randomUUID();
  const saved = {
    ...plan,
    id,
    snapshotHash: body.snapshotHash,
    trigger: body.trigger,
    preferences: body.preferences,
    savedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const userRef = db.collection("wowGuideUsers").doc(uid);
  const settingsPatch: Record<string, unknown> = {
    latestAiPlanId: id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const batch = db.batch();
  batch.set(userRef.collection("aiPlans").doc(id), saved, { merge: true });
  batch.set(userRef.collection("settings").doc("v8"), settingsPatch, { merge: true });
  await batch.commit();
  return saved;
}

async function handleGearApi(
  req: { method: string; path: string; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (["/api/gear/candidates", "/gear/candidates"].includes(req.path)) {
    if (req.method !== "GET") throw new HttpError(405, "Only GET requests are allowed.");
    res.status(200).json({
      candidates: [],
      messageKo: "v9 Gear Coach 후보 데이터는 클라이언트 보수적 시드와 검증 스크립트에서 관리됩니다.",
    });
    return;
  }
  if (["/api/gear/recommend", "/gear/recommend"].includes(req.path)) {
    if (req.method !== "POST") throw new HttpError(405, "Only POST requests are allowed.");
    res.status(200).json({
      mode: "dungeon_craft_only",
      modeLabelKo: "던전 + 제작만",
      seasonId: "current",
      seasonLabelKo: "현재 시즌",
      summaryKo: "v9 추천 엔진은 현재 클라이언트에서 계산됩니다. 서버 API는 단계적으로 연결됩니다.",
      currentScore: 0,
      targetScore: 0,
      targetBestSet: { labelKo: "서버 연결 대기", items: [], recommendationScore: 0 },
      weeklyActionPlan: { summaryKo: "서버 추천 연결 대기", actions: [] },
      guaranteedUpgrades: [],
      rngFarmingTargets: [],
      priorityUpgrades: [],
      farmingRoutes: [],
      slotDetails: [],
      rejectedCandidates: [],
      warnings: [{ id: "server-pending", severity: "info", messageKo: "현재 릴리스에서는 클라이언트 v9 엔진 결과를 사용합니다." }],
    });
    return;
  }
  if (["/api/gear/compare-modes", "/gear/compare-modes", "/api/gear/farming-routes", "/gear/farming-routes"].includes(req.path)) {
    if (req.method !== "POST") throw new HttpError(405, "Only POST requests are allowed.");
    res.status(200).json({ results: [], routes: [], messageKo: "v9 Gear Coach 서버 비교 API는 단계적으로 연결됩니다." });
    return;
  }
  if (["/api/gear/explain", "/gear/explain"].includes(req.path)) {
    if (req.method !== "POST") throw new HttpError(405, "Only POST requests are allowed.");
    const body = req.body as { result?: { summaryKo?: unknown; weeklyActionPlan?: { summaryKo?: unknown } } } | undefined;
    res.status(200).json({
      explanationKo: [
        typeof body?.result?.summaryKo === "string" ? body.result.summaryKo : "추천 결과를 기준으로 설명합니다.",
        typeof body?.result?.weeklyActionPlan?.summaryKo === "string" ? body.result.weeklyActionPlan.summaryKo : "",
        "AI는 추천 결과 밖의 새 아이템이나 던전을 만들지 않습니다.",
      ].filter(Boolean).join(" "),
    });
    return;
  }
  throw new HttpError(404, "Unknown gear API path.");
}

export const api = onRequest({ region, cors: true, secrets: [geminiApiKey, ...bnetSecrets] }, async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (["/api/items/tooltip", "/items/tooltip"].includes(req.path)) {
      await handleItemTooltip(req, res);
      return;
    }
    if (["/api/items/bis", "/items/bis"].includes(req.path)) {
      await handleWowheadBis(req, res);
      return;
    }
    if (req.path.startsWith("/api/gear/") || req.path.startsWith("/gear/")) {
      await handleGearApi(req, res);
      return;
    }
    if (req.method !== "POST") throw new HttpError(405, "Only POST requests are allowed.");
    if (!["/api/ai/today-plan", "/ai/today-plan"].includes(req.path)) {
      throw new HttpError(404, "Unknown API path.");
    }

    const token = getBearer(req);
    const decoded = await admin.auth().verifyIdToken(token);
    const body = assertPlanRequest(req.body);
    const useWeb = body.preferences.useWeb === true;

    await assertUsageAvailable(decoded.uid, body.date);
    const aiPlan = await callGemini({ ...body, uid: decoded.uid }, useWeb);
    const normalizedPlan = normalizePlan(aiPlan, body, useWeb);
    const saved = await persistPlan(decoded.uid, normalizedPlan, body);
    await recordUsage(decoded.uid, body.date);
    res.status(200).json(saved);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error.";
    res.status(status).json({ error: message });
  }
});

type BattleNetToken = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: admin.firestore.Timestamp;
};

type BnetCharacterRef = {
  name: string;
  realmSlug: string;
  realmName: string;
  region: string;
};
type BnetSyncWarning = {
  name: string;
  realmSlug: string;
  stage?: string;
  error: string;
};

type BnetSyncStatus = "synced" | "partial" | "stale";
type BnetProfileStatus = "ok" | "failed";
type BnetGearStatus = "ok" | "failed" | "empty" | "stale";
type BnetMediaStatus = "ok" | "failed" | "empty";

type BnetStoredCharacter = Record<string, unknown> & {
  id: string;
  name: string;
  realm?: string;
  realmSlug?: string;
  region?: string;
  equipment?: Record<string, unknown>;
  syncStatus: BnetSyncStatus;
  profileStatus: BnetProfileStatus;
  gearStatus: BnetGearStatus;
  mediaStatus: BnetMediaStatus;
  syncError?: string;
  gearError?: string;
  mediaError?: string;
  profileSyncedAt?: string;
  gearSyncedAt?: string;
  syncedAt: string;
  updatedAt: string;
  equipmentSlotCount: number;
  lastSyncRunId: string;
  seenInLastSync: boolean;
};

const BNET_SYNC_CHARACTER_LIMIT = 50;
const BNET_HYDRATE_CONCURRENCY = 3;
const BNET_ITEM_MEDIA_CONCURRENCY = 4;
const BNET_ITEM_MEDIA_LIMIT = 160;
const ITEM_TOOLTIP_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const WOWHEAD_BIS_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const WOWHEAD_ASSASSINATION_BIS_URL = "https://www.wowhead.com/guide/classes/rogue/assassination/bis-gear";

let bnetClientTokenCache: { accessToken: string; expiresAt: number } | null = null;

function bnetConfig() {
  const clientId = getSecretValue(bnetClientId, "BNET_CLIENT_ID");
  const clientSecret = getSecretValue(bnetClientSecret, "BNET_CLIENT_SECRET");
  if (!clientId) throw new HttpError(500, "BNET_CLIENT_ID secret is not configured.");
  if (!clientSecret) throw new HttpError(500, "BNET_CLIENT_SECRET secret is not configured.");
  return {
    clientId,
    clientSecret,
    region: process.env.BNET_REGION || "kr",
    locale: process.env.BNET_LOCALE || "ko_KR",
  };
}

function bnetHost(regionName: string) {
  return `https://${regionName}.api.blizzard.com`;
}

function bnetNamespace(regionName: string) {
  return `profile-${regionName}`;
}

function bnetStaticNamespace(regionName: string) {
  return `static-${regionName}`;
}

function tokenRef(uid: string) {
  return db.collection("wowGuidePrivate").doc(uid).collection("tokens").doc("bnet");
}

async function tokenRequest(body: URLSearchParams, redirectUri?: string) {
  const { clientId, clientSecret } = bnetConfig();
  if (redirectUri) body.set("redirect_uri", redirectUri);
  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = typeof data.error_description === "string" ? data.error_description : "Battle.net token request failed.";
    throw new HttpError(401, message);
  }
  return data;
}

async function bnetClientAccessToken() {
  if (bnetClientTokenCache && bnetClientTokenCache.expiresAt > Date.now() + 120_000) {
    return bnetClientTokenCache.accessToken;
  }
  const token = await tokenRequest(new URLSearchParams({ grant_type: "client_credentials" }));
  const accessToken = String(token.access_token || "");
  const expiresIn = Number(token.expires_in || 0);
  if (!accessToken) throw new HttpError(401, "Battle.net client token was not returned.");
  bnetClientTokenCache = {
    accessToken,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 0) * 1000,
  };
  return accessToken;
}

async function saveToken(uid: string, token: Record<string, unknown>) {
  const expiresIn = Number(token.expires_in || 0);
  const accessToken = String(token.access_token || "");
  if (!accessToken) throw new HttpError(401, "Battle.net access token was not returned.");
  await tokenRef(uid).set(
    {
      accessToken,
      refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : admin.firestore.FieldValue.delete(),
      tokenType: token.token_type || "bearer",
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + Math.max(expiresIn - 60, 0) * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return accessToken;
}

async function accessTokenFor(uid: string) {
  const snap = await tokenRef(uid).get();
  if (!snap.exists) throw new HttpError(401, "Battle.net 연결이 필요합니다.");
  const token = snap.data() as BattleNetToken;
  const expiresAt = token.expiresAt?.toMillis() || 0;
  if (token.accessToken && expiresAt > Date.now() + 120_000) return token.accessToken;
  if (!token.refreshToken) throw new HttpError(401, "Battle.net 연결이 만료되었습니다. 다시 연결해 주세요.");
  const refreshed = await tokenRequest(new URLSearchParams({ grant_type: "refresh_token", refresh_token: token.refreshToken }));
  return saveToken(uid, refreshed);
}

async function bnetGet(pathOrUrl: string, token: string, regionName = "kr", locale = "ko_KR", namespace = bnetNamespace(regionName)) {
  const url = pathOrUrl.startsWith("http") ? new URL(pathOrUrl) : new URL(`${bnetHost(regionName)}${pathOrUrl}`);
  if (!url.searchParams.has("namespace")) url.searchParams.set("namespace", namespace);
  if (!url.searchParams.has("locale")) url.searchParams.set("locale", locale);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : typeof data.type === "string"
          ? data.type
          : `Battle.net API request failed (${res.status}).`;
    throw new HttpError(res.status === 404 ? 404 : 502, message);
  }
  return data;
}

function itemMediaRef(regionName: string, itemId: number | string) {
  return db.collection("itemMedia").doc(safeDocId(`${regionName}-${itemId}`));
}

function iconFromMedia(data: Record<string, unknown>) {
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const iconAsset = assets.find((asset) => {
    const row = asset as { key?: unknown; value?: unknown };
    return row.key === "icon" && typeof row.value === "string";
  }) as { value?: string } | undefined;
  return iconAsset?.value || "";
}

async function itemMediaIcon(itemId: number | string, token: string, regionName: string, locale: string) {
  const ref = itemMediaRef(regionName, itemId);
  const cached = await ref.get();
  const cachedUrl = cached.exists ? String(cached.data()?.iconUrl || "") : "";
  if (cachedUrl) return { iconUrl: cachedUrl, fromCache: true };

  const media = await bnetGet(`/data/wow/media/item/${encodeURIComponent(String(itemId))}`, token, regionName, locale, bnetStaticNamespace(regionName));
  const iconUrl = iconFromMedia(media);
  if (!iconUrl) throw new Error(`Battle.net item media had no icon asset for item ${itemId}.`);
  await ref.set({
    itemId: String(itemId),
    region: regionName,
    iconUrl,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { iconUrl, fromCache: false };
}

function itemTooltipRef(regionName: string, locale: string, itemId: number | string) {
  return db.collection("itemTooltips").doc(safeDocId(`${regionName}-${locale}-${itemId}`));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function localizedName(value: unknown) {
  const row = asRecord(value);
  return String(row.name || row.display_string || row.displayString || row.type || "");
}

function displayString(value: unknown) {
  if (typeof value === "string") return value;
  const row = asRecord(value);
  return String(row.display_string || row.displayString || row.name || "");
}

function previewLine(value: unknown) {
  const row = asRecord(value);
  return displayString(row.display) || displayString(row);
}

function parseTooltipData(itemData: Record<string, unknown>, iconUrl: string, regionName: string, locale: string, itemId: number) {
  const preview = asRecord(itemData.preview_item);
  const quality = asRecord(preview.quality || itemData.quality);
  const level = asRecord(preview.level);
  const itemClass = asRecord(itemData.item_class);
  const itemSubclass = asRecord(itemData.item_subclass);
  const inventoryType = asRecord(preview.inventory_type || itemData.inventory_type);
  const binding = asRecord(preview.binding);
  const armor = asRecord(preview.armor);
  const weapon = asRecord(preview.weapon);
  const requirements = asRecord(preview.requirements);
  const requirementLevel = asRecord(requirements.level);
  const itemSet = asRecord(preview.set);

  const stats = Array.isArray(preview.stats)
    ? preview.stats.map(previewLine).filter(Boolean)
    : [];
  const sockets = Array.isArray(preview.sockets)
    ? preview.sockets.map((entry) => {
        const row = asRecord(entry);
        return displayString(row.display_string) || localizedName(row.socket_type) || localizedName(row.type);
      }).filter(Boolean)
    : [];
  const spells = Array.isArray(preview.spells)
    ? preview.spells.map((entry) => {
        const row = asRecord(entry);
        return String(row.description || displayString(row.display_string) || localizedName(row.spell));
      }).filter(Boolean)
    : [];
  const weaponLines = [
    previewLine(asRecord(weapon.damage).display),
    previewLine(asRecord(weapon.attack_speed).display),
    previewLine(asRecord(weapon.dps).display),
  ].filter(Boolean);
  const armorLine = previewLine(armor.display) || (armor.value ? `방어도 ${armor.value}` : "");

  return {
    itemId,
    region: regionName,
    locale,
    name: String(preview.name || itemData.name || `Item ${itemId}`),
    quality: localizedName(quality),
    qualityType: String(quality.type || "").toLowerCase(),
    iconUrl,
    itemLevel: Number(level.value || 0) || undefined,
    itemLevelText: displayString(level.display_string) || previewLine(level.display) || "",
    binding: localizedName(binding),
    inventoryType: localizedName(inventoryType),
    itemClass: localizedName(itemClass),
    itemSubclass: localizedName(itemSubclass),
    armor: armorLine,
    weapon: weaponLines,
    stats,
    sockets,
    spells,
    requirements: [
      displayString(requirementLevel.display_string) || previewLine(requirementLevel.display),
      previewLine(requirements.skill),
    ].filter(Boolean),
    description: String(preview.description || ""),
    setName: localizedName(itemSet),
    originalUrl: locale === "ko_KR" ? `https://www.wowhead.com/ko/item=${itemId}` : `https://www.wowhead.com/item=${itemId}`,
    updatedAt: new Date().toISOString(),
  };
}

async function cachedItemTooltip(itemId: number, regionName: string, locale: string): Promise<Record<string, unknown>> {
  const ref = itemTooltipRef(regionName, locale, itemId);
  const cached = await ref.get();
  if (cached.exists) {
    const data = cached.data() as Record<string, unknown>;
    const updatedAt = data.updatedAt as admin.firestore.Timestamp | undefined;
    if (!updatedAt || Date.now() - updatedAt.toMillis() < ITEM_TOOLTIP_CACHE_TTL_MS) {
      return {
        ...data,
        originalUrl: locale === "ko_KR" ? `https://www.wowhead.com/ko/item=${itemId}` : `https://www.wowhead.com/item=${itemId}`,
      };
    }
  }

  const token = await bnetClientAccessToken();
  const [itemResult, mediaResult] = await Promise.allSettled([
    bnetGet(`/data/wow/item/${itemId}`, token, regionName, locale, bnetStaticNamespace(regionName)),
    itemMediaIcon(itemId, token, regionName, locale),
  ]);
  if (itemResult.status === "rejected") throw itemResult.reason;
  const iconUrl = mediaResult.status === "fulfilled" ? mediaResult.value.iconUrl : "";
  const tooltip = parseTooltipData(itemResult.value, iconUrl, regionName, locale, itemId);
  await ref.set({
    ...tooltip,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return tooltip;
}

async function handleItemTooltip(req: { method: string; query: Record<string, unknown> }, res: { status: (status: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "GET") throw new HttpError(405, "Only GET requests are allowed.");
  const { region: defaultRegion, locale: defaultLocale } = bnetConfig();
  const itemId = Number(stringQuery(req.query.itemId));
  const regionName = (stringQuery(req.query.region) || defaultRegion).toLowerCase();
  const locale = stringQuery(req.query.locale) || defaultLocale;
  if (!Number.isInteger(itemId) || itemId <= 0) throw new HttpError(400, "itemId must be a positive integer.");
  if (!/^[a-z]{2}$/.test(regionName)) throw new HttpError(400, "region is invalid.");
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) throw new HttpError(400, "locale is invalid.");
  const tooltip = await cachedItemTooltip(itemId, regionName, locale);
  res.status(200).json(tooltip);
}

function wowheadBisRef(spec: string) {
  return db.collection("wowheadBis").doc(safeDocId(spec));
}

function cleanWowheadText(value: string) {
  return value
    .replace(/\\\//g, "/")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\[url[^\]]*\]([\s\S]*?)\[\/url\]/g, "$1")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeWowheadMarkup(value: string) {
  return value
    .replace(/\\\//g, "/")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"");
}

function wowheadModifiedAt(html: string) {
  const match = html.match(/"dateModified":"([^"]+)"/);
  return match?.[1] || "";
}

function bisSlotKey(slot: string, slotCounts: Record<string, number>) {
  const normalized = slot.toLowerCase();
  const direct: Record<string, string> = {
    weapon: "MAIN_HAND",
    offhand: "OFF_HAND",
    head: "HEAD",
    neck: "NECK",
    shoulders: "SHOULDER",
    shoulder: "SHOULDER",
    cloak: "BACK",
    back: "BACK",
    chest: "CHEST",
    wrist: "WRIST",
    wrists: "WRIST",
    gloves: "HANDS",
    hands: "HANDS",
    belt: "WAIST",
    waist: "WAIST",
    legs: "LEGS",
    boots: "FEET",
    feet: "FEET",
  };
  if (direct[normalized]) return direct[normalized];
  if (normalized === "ring") {
    slotCounts.ring = (slotCounts.ring || 0) + 1;
    return slotCounts.ring > 1 ? "FINGER_2" : "FINGER_1";
  }
  if (normalized === "trinket") {
    slotCounts.trinket = (slotCounts.trinket || 0) + 1;
    return slotCounts.trinket > 1 ? "TRINKET_2" : "TRINKET_1";
  }
  return slot.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function parseWowheadBisRows(html: string) {
  const normalized = unescapeWowheadMarkup(html)
    .replace(/\[\/td\]/g, "[/td]")
    .replace(/\[\/tr\]/g, "[/tr]")
    .replace(/\[\/table\]/g, "[/table]")
    .replace(/\[\/tab\]/g, "[/tab]");
  const start = normalized.indexOf("Best in Slot Gear for Assassination Rogue");
  if (start < 0) throw new HttpError(502, "Wowhead BIS table was not found.");
  const end = normalized.indexOf("[/tab]", start);
  const section = normalized.slice(start, end > start ? end : start + 12000);
  const slotCounts: Record<string, number> = {};
  const rows: Array<{ slot: string; slotKey: string; itemId: number; source: string; wowheadUrl: string }> = [];
  const rowPattern = /\[tr\]\[td\]([^[\]]+)\[\/td\]\[td\]\[item=(\d+)[^\]]*\]\[\/td\]\[td\]([\s\S]*?)\[\/td\]\[\/tr\]/g;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(section))) {
    const slot = cleanWowheadText(match[1]);
    const itemId = Number(match[2]);
    const source = cleanWowheadText(match[3]);
    if (!slot || !Number.isInteger(itemId)) continue;
    rows.push({
      slot,
      slotKey: bisSlotKey(slot, slotCounts),
      itemId,
      source,
      wowheadUrl: `https://www.wowhead.com/ko/item=${itemId}`,
    });
  }
  if (rows.length < 10) throw new HttpError(502, "Wowhead BIS table did not include enough item rows.");
  return rows;
}

async function buildWowheadBisReport(spec: string, regionName: string, locale: string) {
  if (spec !== "assassination-rogue") throw new HttpError(400, "Only assassination-rogue BIS is supported right now.");
  const res = await fetch(WOWHEAD_ASSASSINATION_BIS_URL, {
    headers: {
      "User-Agent": "WJ-Command/1.0 personal dashboard",
      Accept: "text/html",
    },
  });
  const html = await res.text();
  if (!res.ok) throw new HttpError(502, `Wowhead BIS page request failed (${res.status}).`);
  const parsedRows = parseWowheadBisRows(html);
  const warnings: string[] = [];
  const items = await Promise.all(parsedRows.map(async (row) => {
    try {
      const tooltip = await cachedItemTooltip(row.itemId, regionName, locale);
      return {
        ...row,
        name: String(tooltip.name || `Item ${row.itemId}`),
        iconUrl: String(tooltip.iconUrl || ""),
        quality: String(tooltip.quality || ""),
        qualityType: String(tooltip.qualityType || ""),
        itemLevelText: String(tooltip.itemLevelText || ""),
      };
    } catch (err) {
      warnings.push(`${row.slot} item ${row.itemId}: ${err instanceof Error ? err.message : "tooltip failed"}`);
      return {
        ...row,
        name: `Item ${row.itemId}`,
        iconUrl: "",
        quality: "",
        qualityType: "",
        itemLevelText: "",
      };
    }
  }));
  return {
    spec,
    title: "Wowhead Assassination Rogue Overall BIS",
    sourceUrl: WOWHEAD_ASSASSINATION_BIS_URL,
    modifiedAt: wowheadModifiedAt(html),
    fetchedAt: new Date().toISOString(),
    items,
    warnings,
  };
}

async function cachedWowheadBis(spec: string, force: boolean, regionName: string, locale: string) {
  const ref = wowheadBisRef(spec);
  const cached = await ref.get();
  if (!force && cached.exists) {
    const data = cached.data() as Record<string, unknown>;
    const fetchedAt = data.fetchedAt as admin.firestore.Timestamp | undefined;
    if (!fetchedAt || Date.now() - fetchedAt.toMillis() < WOWHEAD_BIS_CACHE_TTL_MS) return data;
  }
  const report = await buildWowheadBisReport(spec, regionName, locale);
  await ref.set({
    ...report,
    fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
    fetchedAtIso: report.fetchedAt,
  }, { merge: true });
  return report;
}

async function handleWowheadBis(
  req: { method: string; query: Record<string, unknown>; headers: Record<string, string | string[] | undefined> },
  res: { status: (status: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== "GET") throw new HttpError(405, "Only GET requests are allowed.");
  const token = getBearer(req);
  await admin.auth().verifyIdToken(token);
  const { region: defaultRegion, locale: defaultLocale } = bnetConfig();
  const spec = stringQuery(req.query.spec) || "assassination-rogue";
  const force = ["1", "true", "yes"].includes(stringQuery(req.query.force).toLowerCase());
  const regionName = (stringQuery(req.query.region) || defaultRegion).toLowerCase();
  const locale = stringQuery(req.query.locale) || defaultLocale;
  if (!/^[a-z]{2}$/.test(regionName)) throw new HttpError(400, "region is invalid.");
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) throw new HttpError(400, "locale is invalid.");
  const report = await cachedWowheadBis(spec, force, regionName, locale);
  const fetchedTimestamp = (report as { fetchedAt?: admin.firestore.Timestamp }).fetchedAt;
  res.status(200).json({
    ...report,
    fetchedAt: typeof (report as { fetchedAt?: unknown }).fetchedAt === "string"
      ? (report as { fetchedAt: string }).fetchedAt
      : fetchedTimestamp?.toDate().toISOString() || String((report as { fetchedAtIso?: string }).fetchedAtIso || new Date().toISOString()),
  });
}

function mediaAssets(data: Record<string, unknown>) {
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const map: Record<string, string> = {};
  assets.forEach((asset) => {
    const row = asset as { key?: unknown; value?: unknown };
    if (typeof row.key === "string" && typeof row.value === "string") map[row.key] = row.value;
  });
  return {
    avatar: map.avatar || "",
    inset: map.inset || "",
    main: map["main-raw"] || map.main || "",
  };
}

function safeDocId(value: string) {
  return value.toLowerCase().replace(/[\/#?[\]]/g, "-");
}

function characterRefFromHref(href: unknown) {
  if (typeof href !== "string") return null;
  const match = href.match(/\/profile\/wow\/character\/([^/?#]+)\/([^/?#]+)/);
  if (!match) return null;
  return {
    realmSlug: decodeURIComponent(match[1]),
    name: decodeURIComponent(match[2]),
  };
}

function extractBnetCharacters(profile: Record<string, unknown>, regionName: string) {
  const accounts = Array.isArray(profile.wow_accounts) ? profile.wow_accounts : [];
  const refs: BnetCharacterRef[] = [];
  accounts.forEach((account) => {
    const characters = Array.isArray((account as { characters?: unknown }).characters)
      ? ((account as { characters: unknown[] }).characters)
      : [];
    characters.forEach((entry) => {
      const row = entry as {
        character?: {
          href?: string;
          name?: string;
          realm?: { slug?: string; name?: string };
        };
        name?: string;
        realm?: { slug?: string; name?: string };
      };
      const hrefRef = characterRefFromHref(row.character?.href);
      const name = row.name || row.character?.name || hrefRef?.name;
      const realm = row.realm || row.character?.realm;
      const realmSlug = realm?.slug || hrefRef?.realmSlug;
      if (!name || !realmSlug) return;
      refs.push({
        name,
        realmSlug,
        realmName: realm?.name || realmSlug,
        region: regionName,
      });
    });
  });
  return refs;
}

function uniqueBnetRefs(refs: BnetCharacterRef[]) {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.region}:${ref.realmSlug}:${ref.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function storedCharacterIdentityKeys(character: Record<string, unknown>) {
  const name = String(character.name || "").trim().toLowerCase();
  const region = String(character.region || "kr").trim().toLowerCase();
  const realms = [character.realmSlug, character.realm]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(realms)).map((realm) => `${region}:${realm}:${name}`);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function syncErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  return "Unknown Battle.net sync error.";
}

function baseCharacterFromRef(ref: BnetCharacterRef, now: string, syncRunId: string, syncError = ""): BnetStoredCharacter {
  return {
    id: safeDocId(`bnet-${ref.region}-${ref.realmSlug}-${ref.name}`),
    name: ref.name,
    realm: ref.realmName,
    realmSlug: ref.realmSlug,
    region: ref.region,
    className: "",
    specName: "",
    equipment: {},
    media: {},
    syncStatus: "partial",
    profileStatus: "failed",
    gearStatus: "failed",
    mediaStatus: "empty",
    syncError,
    gearError: syncError,
    equipmentSlotCount: 0,
    lastSyncRunId: syncRunId,
    seenInLastSync: true,
    syncedAt: now,
    updatedAt: now,
  };
}

function sortStoredCharacters<T extends Record<string, unknown>>(characters: T[]) {
  return characters.sort((a, b) => {
    const statusOrder = (value: unknown) => {
      const status = String(value || "synced");
      if (status === "synced") return 0;
      if (status === "partial") return 1;
      return 2;
    };
    const status = statusOrder(a.syncStatus) - statusOrder(b.syncStatus);
    if (status !== 0) return status;
    const realm = String(a.realm || a.realmSlug || "").localeCompare(String(b.realm || b.realmSlug || ""), "ko-KR");
    if (realm !== 0) return realm;
    return String(a.name || "").localeCompare(String(b.name || ""), "ko-KR");
  });
}

function withoutUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(withoutUndefinedDeep).filter((item) => item !== undefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, entry]) => [key, withoutUndefinedDeep(entry)] as const)
        .filter(([, entry]) => entry !== undefined),
    );
  }
  return value;
}

function equipmentItem(raw: Record<string, unknown>) {
  const item = raw.item as { id?: unknown } | undefined;
  const level = raw.level as { value?: unknown } | undefined;
  const quality = raw.quality as { type?: unknown } | undefined;
  const enchantments = Array.isArray(raw.enchantments)
    ? raw.enchantments.map((entry) => {
        const row = entry as { display_string?: unknown; display?: { display_string?: unknown }; enchantment_id?: unknown };
        return {
          displayString: String(row.display_string || row.display?.display_string || ""),
          source: row.enchantment_id ? String(row.enchantment_id) : "",
        };
      })
    : [];
  const sockets = Array.isArray(raw.sockets)
    ? raw.sockets.map((entry) => {
        const row = entry as { item?: { name?: unknown; id?: unknown }; display_string?: unknown };
        return {
          item: row.item?.name ? { name: String(row.item.name) } : undefined,
          itemId: Number(row.item?.id || 0) || undefined,
          displayString: String(row.display_string || ""),
        };
      })
    : [];
  const stats = Array.isArray(raw.stats)
    ? raw.stats.map((entry) => {
        const row = entry as { type?: { type?: unknown; name?: unknown }; value?: unknown; display?: { display_string?: unknown } };
        return {
          type: String(row.type?.type || ""),
          name: String(row.type?.name || ""),
          value: Number(row.value || 0) || undefined,
          display: String(row.display?.display_string || ""),
        };
      })
    : [];

  return {
    id: typeof item?.id === "string" || typeof item?.id === "number" ? item.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "",
    level: Number(level?.value || 0) || undefined,
    quality: typeof quality?.type === "string" ? quality.type : undefined,
    enchantments,
    sockets,
    stats,
  };
}

function equipmentEntries(character: BnetStoredCharacter) {
  const equipment = (character.equipment || {}) as Record<string, Record<string, unknown>>;
  return Object.values(equipment).filter(Boolean);
}

function orderedCharactersForIconHydration(characters: BnetStoredCharacter[], selectedCharacterId = "") {
  if (!selectedCharacterId) return characters;
  return [...characters].sort((a, b) => {
    if (a.id === selectedCharacterId) return -1;
    if (b.id === selectedCharacterId) return 1;
    return 0;
  });
}

async function hydrateEquipmentIcons(characters: BnetStoredCharacter[], token: string, selectedCharacterId = "") {
  const { locale } = bnetConfig();
  const items: Array<{ character: BnetStoredCharacter; item: Record<string, unknown>; itemId: number | string; region: string }> = [];
  const seen = new Set<string>();

  orderedCharactersForIconHydration(characters, selectedCharacterId).forEach((character) => {
    const regionName = String(character.region || "kr");
    equipmentEntries(character).forEach((item) => {
      const itemId = item.id;
      if (typeof itemId !== "string" && typeof itemId !== "number") return;
      const key = `${regionName}:${itemId}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ character, item, itemId, region: regionName });
    });
  });

  let hydrated = 0;
  let failed = 0;
  const warnings: BnetSyncWarning[] = [];
  await mapWithConcurrency(items.slice(0, BNET_ITEM_MEDIA_LIMIT), BNET_ITEM_MEDIA_CONCURRENCY, async (entry) => {
    if (entry.item.iconUrl) return;
    try {
      const result = await itemMediaIcon(entry.itemId, token, entry.region, locale);
      entry.item.iconUrl = result.iconUrl;
      hydrated += result.fromCache ? 0 : 1;
    } catch (err) {
      failed += 1;
      warnings.push({
        name: entry.character.name,
        realmSlug: String(entry.character.realmSlug || ""),
        stage: "item-media",
        error: syncErrorMessage(err),
      });
    }
  });

  return {
    iconHydrated: hydrated,
    iconFailed: failed,
    iconRequested: items.length,
    warnings,
  };
}

async function hydrateCharacter(ref: BnetCharacterRef, token: string, syncRunId: string): Promise<BnetStoredCharacter> {
  const now = new Date().toISOString();
  const { locale } = bnetConfig();
  const nameSlug = encodeURIComponent(ref.name.toLowerCase());
  const realmSlug = encodeURIComponent(ref.realmSlug);
  const profile = await bnetGet(`/profile/wow/character/${realmSlug}/${nameSlug}`, token, ref.region, locale);
  const [equipmentResult, mediaResult] = await Promise.allSettled([
    bnetGet(`/profile/wow/character/${realmSlug}/${nameSlug}/equipment`, token, ref.region, locale),
    bnetGet(`/profile/wow/character/${realmSlug}/${nameSlug}/character-media`, token, ref.region, locale),
  ]);

  const equipmentData = equipmentResult.status === "fulfilled" ? equipmentResult.value as Record<string, unknown> : {};
  const gearError = equipmentResult.status === "rejected" ? syncErrorMessage(equipmentResult.reason) : "";
  const equippedItems = Array.isArray(equipmentData.equipped_items) ? equipmentData.equipped_items : [];
  const equipmentMap: Record<string, ReturnType<typeof equipmentItem>> = {};
  equippedItems.forEach((entry) => {
    const row = entry as Record<string, unknown> & { slot?: { type?: unknown } };
    const slot = typeof row.slot?.type === "string" ? row.slot.type : "";
    if (slot) equipmentMap[slot] = equipmentItem(row);
  });
  const equipmentSlotCount = Object.keys(equipmentMap).length;
  const gearStatus: BnetGearStatus = gearError ? "failed" : equipmentSlotCount ? "ok" : "empty";

  const mediaData = mediaResult.status === "fulfilled" ? mediaResult.value as Record<string, unknown> : {};
  const mediaError = mediaResult.status === "rejected" ? syncErrorMessage(mediaResult.reason) : "";
  const media = mediaAssets(mediaData);
  const mediaStatus: BnetMediaStatus = mediaError ? "failed" : Object.keys(media).length ? "ok" : "empty";
  const activeSpec = profile.active_spec as { name?: unknown } | undefined;
  const classInfo = profile.character_class as { name?: unknown } | undefined;

  return {
    id: safeDocId(`bnet-${ref.region}-${ref.realmSlug}-${ref.name}`),
    name: String(profile.name || ref.name),
    realm: ref.realmName,
    realmSlug: ref.realmSlug,
    region: ref.region,
    level: Number(profile.level || 0) || undefined,
    itemLevel: Number(profile.equipped_item_level || profile.average_item_level || 0) || undefined,
    equipped_item_level: Number(profile.equipped_item_level || 0) || undefined,
    className: String(classInfo?.name || ""),
    specName: String(activeSpec?.name || ""),
    equipment: equipmentMap,
    media,
    syncStatus: gearStatus === "ok" ? "synced" : "partial",
    profileStatus: "ok",
    gearStatus,
    mediaStatus,
    syncError: gearError || "",
    gearError,
    mediaError,
    profileSyncedAt: now,
    gearSyncedAt: gearStatus === "ok" ? now : undefined,
    equipmentSlotCount,
    lastSyncRunId: syncRunId,
    seenInLastSync: true,
    syncedAt: now,
    updatedAt: now,
  };
}

export const bnetStart = onRequest({ region, cors: true, secrets: bnetSecrets }, async (req, res) => {
  try {
    if (req.method !== "GET") throw new HttpError(405, "Only GET requests are allowed.");
    const token = stringQuery(req.query.token);
    const returnTo = safeReturnTo(req.query.returnTo);
    const decoded = await admin.auth().verifyIdToken(token);
    const { clientId } = bnetConfig();
    const state = randomUUID();
    const redirectUri = callbackUrl(req);
    await db.collection("bnetOAuthStates").doc(state).set({
      uid: decoded.uid,
      returnTo,
      redirectUri,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const authUrl = new URL("https://oauth.battle.net/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "wow.profile");
    authUrl.searchParams.set("state", state);
    res.redirect(authUrl.toString());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Battle.net 연결을 시작하지 못했습니다.";
    res.redirect(withQuery("/v8/", "bnet", `error:${message}`));
  }
});

export const bnetCallback = onRequest({ region, cors: true, secrets: bnetSecrets }, async (req, res) => {
  let returnTo = "/v8/";
  try {
    if (req.method !== "GET") throw new HttpError(405, "Only GET requests are allowed.");
    const state = stringQuery(req.query.state);
    const code = stringQuery(req.query.code);
    const error = stringQuery(req.query.error);
    if (error) throw new HttpError(401, error);
    if (!state || !code) throw new HttpError(400, "Battle.net callback is missing state or code.");
    const stateRef = db.collection("bnetOAuthStates").doc(state);
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) throw new HttpError(401, "Battle.net state has expired.");
    const stateData = stateSnap.data() as { uid?: string; returnTo?: string; redirectUri?: string };
    returnTo = safeReturnTo(stateData.returnTo);
    if (!stateData.uid || !stateData.redirectUri) throw new HttpError(401, "Battle.net state is invalid.");
    const token = await tokenRequest(new URLSearchParams({ grant_type: "authorization_code", code }), stateData.redirectUri);
    await saveToken(stateData.uid, token);
    await stateRef.delete();
    res.redirect(withQuery(returnTo, "bnet", "connected"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Battle.net 연결에 실패했습니다.";
    res.redirect(withQuery(returnTo, "bnet", `error:${message}`));
  }
});

export const bnetSync = onRequest({ region, cors: true, secrets: bnetSecrets }, async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") throw new HttpError(405, "Only POST requests are allowed.");
    const token = getBearer(req);
    const decoded = await admin.auth().verifyIdToken(token);
    const accessToken = await accessTokenFor(decoded.uid);
    const { region: regionName, locale } = bnetConfig();
    const requestedCharacterId = typeof req.body?.characterId === "string" ? req.body.characterId : "";
    const profile = await bnetGet("/profile/user/wow", accessToken, regionName, locale);
    const refs = uniqueBnetRefs(extractBnetCharacters(profile, regionName)).slice(0, BNET_SYNC_CHARACTER_LIMIT);
    console.info("Battle.net profile summary parsed", {
      accounts: Array.isArray(profile.wow_accounts) ? profile.wow_accounts.length : 0,
      characters: refs.length,
    });
    if (!refs.length) throw new HttpError(404, "Battle.net 계정에서 WoW 캐릭터를 찾지 못했습니다.");

    const warnings: BnetSyncWarning[] = [];
    const now = new Date().toISOString();
    const syncRunId = randomUUID();
    const hydrated = await mapWithConcurrency(refs, BNET_HYDRATE_CONCURRENCY, async (ref) => {
      try {
        return await hydrateCharacter(ref, accessToken, syncRunId);
      } catch (err) {
        const error = syncErrorMessage(err);
        warnings.push({
          name: ref.name,
          realmSlug: ref.realmSlug,
          stage: "profile",
          error,
        });
        return baseCharacterFromRef(ref, now, syncRunId, error);
      }
    });
    const characters = hydrated;
    const iconSummary = await hydrateEquipmentIcons(characters, accessToken, requestedCharacterId);
    warnings.push(...iconSummary.warnings);
    characters.forEach((character) => {
      if (character.gearStatus === "failed") {
        warnings.push({
          name: character.name,
          realmSlug: String(character.realmSlug || ""),
          stage: "equipment",
          error: character.gearError || "Battle.net equipment request failed.",
        });
      } else if (character.gearStatus === "empty") {
        warnings.push({
          name: character.name,
          realmSlug: String(character.realmSlug || ""),
          stage: "equipment",
          error: "Battle.net equipment response did not include equipped items.",
        });
      }
      if (character.mediaStatus === "failed") {
        warnings.push({
          name: character.name,
          realmSlug: String(character.realmSlug || ""),
          stage: "media",
          error: character.mediaError || "Battle.net media request failed.",
        });
      }
    });
    const syncedCharacters = characters.filter((character) => character.syncStatus === "synced");
    const partialCharacters = characters.filter((character) => character.syncStatus === "partial");
    const profileFailedCharacters = characters.filter((character) => character.profileStatus === "failed");
    const gearFailedCharacters = characters.filter((character) => character.gearStatus === "failed");
    const mediaFailedCharacters = characters.filter((character) => character.mediaStatus === "failed");

    const userRef = db.collection("wowGuideUsers").doc(decoded.uid);
    const existingSnap = await userRef.collection("characters").get();
    const currentIds = new Set(characters.map((character) => character.id));
    const currentIdentityKeys = new Set(characters.flatMap((character) => storedCharacterIdentityKeys(character as unknown as Record<string, unknown>)));
    const staleDocs = existingSnap.docs.filter((docSnap) => !currentIds.has(docSnap.id));
    const duplicateStaleDocs = staleDocs.filter((docSnap) => {
      const data = { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) };
      return storedCharacterIdentityKeys(data).some((key) => currentIdentityKeys.has(key));
    });
    const duplicateStaleIds = new Set(duplicateStaleDocs.map((docSnap) => docSnap.id));
    const staleCharacters = staleDocs
      .filter((docSnap) => !duplicateStaleIds.has(docSnap.id))
      .map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
          ...data,
          id: docSnap.id,
          equipment: {},
          syncStatus: "stale",
          profileStatus: data.profileStatus === "failed" ? "failed" : "ok",
          gearStatus: "stale",
          mediaStatus: data.mediaStatus === "failed" ? "failed" : Object.keys((data.media || {}) as Record<string, unknown>).length ? "ok" : "empty",
          syncError: "Character was not returned by Battle.net in the latest sync.",
          gearError: "Stale character; equipment was cleared to avoid showing old gear as current.",
          equipmentSlotCount: 0,
          lastSyncRunId: syncRunId,
          seenInLastSync: false,
          updatedAt: now,
        } as BnetStoredCharacter;
      });
    const storedWrites = [...characters, ...staleCharacters];
    const batch = db.batch();
    storedWrites.forEach((character) => {
      batch.set(userRef.collection("characters").doc(character.id), withoutUndefinedDeep(character) as Record<string, unknown>);
    });
    duplicateStaleDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    const summary = {
      found: refs.length,
      synced: syncedCharacters.length,
      partial: partialCharacters.length,
      failed: profileFailedCharacters.length,
      stale: staleCharacters.length,
      staleCleaned: duplicateStaleDocs.length,
      gearFailed: gearFailedCharacters.length,
      mediaFailed: mediaFailedCharacters.length,
      iconHydrated: iconSummary.iconHydrated,
      iconFailed: iconSummary.iconFailed,
      iconRequested: iconSummary.iconRequested,
      syncRunId,
    };
    batch.set(
      userRef.collection("settings").doc("v8"),
      {
        lastBnetSyncAt: now,
        lastBnetSyncSummary: summary,
        lastBnetSyncWarnings: warnings.slice(0, 12),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await batch.commit();
    const storedSnap = await userRef.collection("characters").get();
    const storedCharacters = sortStoredCharacters(storedSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) })));
    console.info("Battle.net sync completed", {
      ...summary,
      returned: storedCharacters.length,
      warnings: warnings.slice(0, 8),
    });
    res.status(200).json({ characters: storedCharacters, summary, warnings, syncedAt: now });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Battle.net 동기화 실패";
    res.status(status).json({ error: message });
  }
});
