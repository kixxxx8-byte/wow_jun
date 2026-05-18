import type { AiPlan, AiPlanRequest } from "../types";

export class AiRequestError extends Error {
  status: number;
  rateLimitKind: "minute" | "daily" | null;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
    this.rateLimitKind = status === 429 && message.includes("Daily") ? "daily" : status === 429 ? "minute" : null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseAiPlan(value: unknown): AiPlan {
  if (!value || typeof value !== "object") throw new Error("AI 응답이 비어 있습니다.");
  const plan = value as Partial<AiPlan>;
  if (typeof plan.id !== "string") throw new Error("AI 응답에 id가 없습니다.");
  if (typeof plan.title !== "string" || typeof plan.summary !== "string") throw new Error("AI 응답 제목/요약 형식이 올바르지 않습니다.");
  if (!Array.isArray(plan.actions) || plan.actions.length === 0) throw new Error("AI 응답에 실행 항목이 없습니다.");
  if (!plan.timePlans || !isStringArray(plan.timePlans.short) || !isStringArray(plan.timePlans.normal) || !isStringArray(plan.timePlans.long)) {
    throw new Error("AI 시간별 플랜 형식이 올바르지 않습니다.");
  }
  return plan as AiPlan;
}

export async function requestTodayPlan(token: string, payload: AiPlanRequest): Promise<AiPlan> {
  const res = await fetch("/api/ai/today-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiRequestError(typeof body.error === "string" ? body.error : `AI 요청 실패 (${res.status})`, res.status);
  }
  return parseAiPlan(body);
}
