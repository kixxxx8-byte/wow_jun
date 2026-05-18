import { expect, test } from "@playwright/test";

test("read-only shell and core tabs stay usable", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: /WJ\+ Command/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google 로그인" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "캐릭터를 먼저 선택해주세요" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "주요 화면" });

  for (const tab of ["오늘", "AI 작전실", "장비", "던전", "가이드", "메모/설정"]) {
    await nav.getByRole("button", { name: tab, exact: true }).click();
    await expect(page.locator("main")).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(hasOverflow).toBe(false);
  }
});

test("no character is auto-selected on first load", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("캐릭터를 선택해주세요")).toBeVisible();
  await expect(page.locator("select").first()).toHaveValue("");
  await expect(page.getByRole("heading", { name: "캐릭터를 먼저 선택해주세요" })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("rogue guide tab exposes subtlety and locks other specs", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "가이드", exact: true }).click();
  await expect(page.getByRole("heading", { name: "도적 가이드" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "잠행 도적 핵심 결론" })).toBeVisible();
  await expect(page.getByText("암살 도적")).toBeVisible();
  await expect(page.getByText("무법 도적")).toBeVisible();
  await expect(page.getByText("항목 생성 완료 · 세부 가이드 잠금").first()).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});
