import { afterEach, describe, expect, it, vi } from "vitest";
import { AiRequestError, parseAiPlan, requestTodayPlan } from "./ai";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AI response parser", () => {
  it("accepts a valid structured plan", () => {
    const plan = parseAiPlan({
      id: "plan-1",
      generatedAt: "2026-05-15T00:00:00.000Z",
      model: "gpt-5.5",
      mode: "data_only",
      title: "알게타르 우선",
      summary: "장신구와 반지가 겹칩니다.",
      confidence: "high",
      actions: [{ rank: 1, title: "알게타르 2회", type: "dungeon", reason: "목표가 겹침", evidence: ["장신구", "반지"], estimatedTime: "40분" }],
      timePlans: { short: ["정비"], normal: ["알게타르"], long: ["알게타르", "사론"] },
      avoid: [],
      assumptions: [],
      dataWarnings: [],
      sources: [],
    });

    expect(plan.title).toBe("알게타르 우선");
  });

  it("rejects incomplete responses", () => {
    expect(() => parseAiPlan({ id: "bad" })).toThrow();
  });

  it("classifies minute rate limit errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: "AI plan can be generated once per minute." }),
    })));

    await expect(requestTodayPlan("token", {} as never)).rejects.toMatchObject({
      name: "AiRequestError",
      status: 429,
      rateLimitKind: "minute",
    } satisfies Partial<AiRequestError>);
  });
});
