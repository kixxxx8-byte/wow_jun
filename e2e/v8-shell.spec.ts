import { expect, test } from "@playwright/test";

test("read-only shell and core tabs stay usable", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: /WJ\+ Command/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google 로그인" }).first()).toBeVisible();
  await expect(page.getByText("읽기용 미리보기")).toBeVisible();
  await expect(page.getByRole("heading", { name: "오늘 기본 판단" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "주요 화면" });

  for (const tab of ["오늘", "AI 작전실", "장비 점검", "던전", "가이드", "메모/설정"]) {
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
  await expect(page.getByText("로그인 전 기본 데이터 기준입니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: /AI 다시 판단/ })).toBeDisabled();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("guide tab exposes all supported specs with a shared template", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "가이드", exact: true }).click();
  await expect(page.getByRole("heading", { name: "한밤 시즌1 전문화 가이드" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "암살 도적 핵심 결론" })).toBeVisible();
  await page.getByRole("button", { name: /무법/ }).click();
  await expect(page.getByRole("heading", { name: "무법 도적 핵심 결론" })).toBeVisible();
  await page.getByRole("button", { name: /잠행/ }).click();
  await expect(page.getByRole("heading", { name: "잠행 도적 핵심 결론" })).toBeVisible();
  await page.getByRole("button", { name: /Devourer/ }).click();
  await expect(page.getByRole("heading", { name: "Devourer Demon Hunter 핵심 결론" })).toBeVisible();
  await expect(page.getByText("Wowhead 가이드 보기")).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("dungeon tab shows personal micro survival notes", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "던전", exact: true }).click();
  await expect(page.getByRole("heading", { name: "던전 컨닝" })).toBeVisible();
  await expect(page.getByText("초정밀 생존 노트").first()).toBeVisible();
  await expect(page.getByText("오늘 죽지 말 것").first()).toBeVisible();
  await page.getByPlaceholder("던전, 보스, 위험 요소 검색").fill("그망");
  await expect(page.getByText("오늘 죽지 말 것").first()).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("top navigation keeps notes settings visible on tablet widths", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 720 });
  await page.goto("./");
  const notesButton = page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "메모/설정", exact: true });
  await expect(notesButton).toBeVisible();
  const fits = await notesButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= window.innerWidth;
  });
  expect(fits).toBe(true);
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});
