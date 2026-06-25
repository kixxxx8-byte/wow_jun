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
  await expect(page.locator("select").first()).toHaveValue("");
  await expect(page.locator("select").first()).toBeDisabled();
  await expect(page.getByText("로그인 전 기본 데이터 기준입니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인하고 AI 판단" })).toBeEnabled();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("logged-out preview keeps mutating controls locked", async ({ page }) => {
  await page.goto("./");
  const nav = page.getByRole("navigation", { name: "주요 화면" });

  await nav.getByRole("button", { name: "장비 점검", exact: true }).click();
  await expect(page.getByRole("heading", { name: "장비 점검", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "던전 + 제작만" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "참고 자료 새로고침" })).toBeDisabled();

  await nav.getByRole("button", { name: "Wythic", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wythic 참고 보기" })).toBeVisible();
  await expect(page.getByText("개인 Wythic 분석은 로그인 후 사용")).toBeVisible();

  await nav.getByRole("button", { name: "메모/설정", exact: true }).click();
  await expect(page.getByText("로그인 후 메모 저장 가능")).toBeVisible();
  await expect(page.locator("textarea").first()).toBeDisabled();
  await expect(page.getByRole("button", { name: /AI 재생성/ })).toBeDisabled();

  await nav.getByRole("button", { name: "AI 작전실", exact: true }).click();
  await expect(page.getByRole("heading", { name: "추천을 만드는 곳이 아니라, 현재 판단을 설명하는 곳" })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인 후 AI 설명 받기" })).toBeEnabled();
});

test("guide tab exposes all supported specs with a shared template", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "가이드", exact: true }).click();
  await expect(page.getByRole("heading", { name: "한밤 시즌1 전문화 가이드" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "암살 도적 핵심 결론" })).toBeVisible();
  await page.getByRole("button", { name: /무법/ }).click();
  await expect(page.getByRole("heading", { name: "무법 도적 핵심 결론" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "무법 연습장" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "무법 실전 허수아비" })).toBeVisible();
  await expect(page.getByText("다음 위험 패턴")).toBeVisible();
  await expect(page.getByText("세션 결과")).toBeVisible();
  await expect(page.getByText("타겟 체력")).toBeVisible();
  await expect(page.getByText("기본 키맵")).toBeVisible();
  await expect(page.getByLabel("무법 실전 허수아비 모드").getByLabel("동적 전장")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 난이도").getByRole("button", { name: "고압" }).click();
  await expect(page.getByText("패턴 시간이 짧고 실수 피해가 큽니다.")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 모드").getByLabel("동적 전장").check();
  await expect(page.getByText("동적 전장 켜짐")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 모드").getByLabel("동적 전장").uncheck();
  await page.getByLabel("무법 실전 허수아비 난이도").getByRole("button", { name: "실전" }).click();
  await expect(page.getByLabel("무법 실전 허수아비 추천 스킬").getByText("폭풍의 칼날", { exact: true })).toBeVisible();
  await page.getByLabel("무법 실전 허수아비").getByLabel("실전 모드").check();
  await expect(page.getByLabel("무법 실전 허수아비 추천 스킬").getByText("직접 판단")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비").getByLabel("실전 모드").uncheck();
  await page.getByRole("button", { name: "1초 진행" }).click();
  await page.getByRole("button", { name: "1초 진행" }).click();
  await expect(page.getByText("지금 위험 패턴")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비").getByLabel("키보드 입력").check();
  await page.keyboard.press("KeyC");
  await expect(page.locator(".outlaw-combat-feedback").getByText("C 입력")).toBeVisible();
  await expect(page.locator(".outlaw-combat-feedback").getByText("발차기")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 시나리오").getByRole("button", { name: "광역 풀" }).click();
  await page.getByRole("button", { name: "1초 진행" }).click();
  await page.getByRole("button", { name: "1초 진행" }).click();
  await page.getByLabel("무법 실전 허수아비 스킬 버튼").getByRole("button", { name: "사악한 일격" }).click();
  await expect(page.locator(".outlaw-combat-feedback").getByText("지금은 폭풍의 칼날부터 봐야 합니다.")).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 시나리오").getByRole("button", { name: "광역 풀" }).click();
  await page.getByLabel("무법 실전 허수아비 스킬 버튼").getByRole("button", { name: "폭풍의 칼날" }).click();
  await expect(page.locator(".outlaw-combat-feedback").getByText("좋습니다. 지금은 폭풍의 칼날이 맞습니다.")).toBeVisible();
  await expect(page.getByLabel("무법 실전 허수아비 스킬 버튼").getByRole("button", { name: /속결/ })).toBeDisabled();
  await expect(page.getByText("마무리 일격을 쓰기엔 CP가 부족합니다.").first()).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 시나리오").getByRole("button", { name: "단일 허수아비" }).click();
  await expect(page.getByLabel("무법 실전 허수아비 추천 스킬").getByText("뼈주사위", { exact: true })).toBeVisible();
  await page.getByLabel("무법 실전 허수아비 시나리오").getByRole("button", { name: "쿨기 막힘" }).click();
  await expect(page.getByLabel("무법 실전 허수아비 추천 스킬").getByText("준비", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "순서대로 눌러보기" })).toBeVisible();
  await expect(page.getByLabel("무법 도적 순차 연습").getByText("현재 단계: 광역 스위치")).toBeVisible();
  await page.getByLabel("무법 도적 연습 스킬 버튼").getByRole("button", { name: "사악한 일격" }).click();
  await expect(page.getByText("지금은 폭풍의 칼날 차례입니다.")).toBeVisible();
  await page.getByLabel("무법 도적 연습 스킬 버튼").getByRole("button", { name: "폭풍의 칼날" }).click();
  await expect(page.getByText("좋습니다. 다음은 아드레날린 촉진입니다.")).toBeVisible();
  await expect(page.getByLabel("무법 도적 다음 추천 스킬").getByText("폭풍의 칼날")).toBeVisible();
  await page.getByRole("button", { name: "준비 타이밍" }).click();
  await expect(page.getByLabel("무법 도적 다음 추천 스킬").getByText("준비")).toBeVisible();
  await expect(page.getByRole("heading", { name: "초간단 실전 사이클" })).toBeVisible();
  await expect(page.getByText("처음엔 이것만 따라가도 됩니다")).toBeVisible();
  await expect(page.getByText("버프 준비")).toBeVisible();
  await expect(page.getByText("쿨기 톡톡")).toBeVisible();
  await expect(page.getByRole("heading", { name: "마무리 쾅" })).toBeVisible();
  await expect(page.getByLabel("버프 준비 스킬 목록").getByText("도박의 연속(KIR)")).toBeVisible();
  await expect(page.getByText("권총 사격은 반짝인다고 무조건 누르지 않습니다.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "쿨기 > 마무리 일격 > 생성기" })).toBeVisible();
  await expect(page.getByText("2. 정밀 가이드")).toBeVisible();
  await expect(page.getByText("3. 이것만 따라해라 실전 편")).toBeVisible();
  await expect(page.getByText("4. 스킬창/키bind 배치 가이드")).toBeVisible();
  await expect(page.getByText("5. 숙련자를 위한 완벽함으로 가는 법")).toBeVisible();
  await expect(page.getByLabel("무법 도적 우선순위 사다리")).toBeVisible();
  await expect(page.getByLabel("무법 도적 오프닝 타임라인")).toBeVisible();
  await expect(page.getByLabel("도박의 연속 KIR 판단 트리")).toBeVisible();
  await expect(page.getByLabel("Supercharger 미간 적중 보류 다이어그램")).toBeVisible();
  await expect(page.getByLabel("무법 도적 추천 스킬창 배치 다이어그램")).toBeVisible();
  await expect(page.getByText("발차기, 교란, 그림자 망토, 소멸은 클릭 금지입니다.")).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "던전을 선택하세요" })).toBeVisible();
  await expect(page.getByLabel("던전 선택").getByRole("button")).toHaveCount(8);
  await page.getByLabel("던전 선택").getByRole("button", { name: /윈드러너 첨탑/ }).click();
  await expect(page.getByText("초정밀 생존 노트").first()).toBeVisible();
  await expect(page.getByText("오늘 죽지 말 것").first()).toBeVisible();
  await expect(page.getByText("검수 기준").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /상세 작전 보기/ })).toHaveCount(1);
  await page.getByPlaceholder("던전, 보스, 위험 요소 검색").fill("그망");
  await expect(page.getByText("오늘 죽지 말 것").first()).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("dungeon tab exposes cinematic field guides and locked feedback in preview", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "던전", exact: true }).click();
  await page.getByLabel("던전 선택").getByRole("button", { name: /윈드러너 첨탑/ }).click();
  await expect(page.getByRole("heading", { name: "윈드러너 첨탑 실전 작전" })).toBeVisible();
  await expect(page.getByText("바닥은 외곽, 갈고리는 어보미-벤시-대상자, 막넴은 화살로 바람 고리를 넘습니다.")).toBeVisible();
  await expect(page.getByText("검수 기준")).toBeVisible();
  await expect(page.locator(".cinematic-phase-grid:visible, .cinematic-selected-phase:visible").getByText("교차 검수").first()).toBeVisible();
  await expect(page.locator(".cinematic-motion:visible").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "윈드러너 첨탑 상세 작전 보기" })).toBeVisible();
  await expect(page.getByText("쫄 구간 위험 시전")).toBeVisible();
  await expect(page.locator(".guide-feedback-panel:visible").getByRole("heading", { name: /피드백/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인 후 피드백 저장 가능" })).toBeDisabled();
  await page.getByRole("button", { name: /마법정원/ }).click({ force: true });
  await expect(page.getByRole("heading", { name: "마법학자의 정원 실전 작전" })).toBeVisible();
  await page.getByPlaceholder("던전, 보스, 위험 요소 검색").fill("바람 고리");
  await page.getByLabel("던전 선택").getByRole("button", { name: /윈드러너 첨탑/ }).click();
  await expect(page.getByRole("heading", { name: "윈드러너 첨탑 실전 작전" })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("raid tab opens one selected raid at a time", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "레이드", exact: true }).click();
  await expect(page.getByRole("heading", { name: "레이드 작전" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "레이드를 선택하세요" })).toBeVisible();
  await expect(page.getByLabel("레이드 선택").getByRole("button")).toHaveCount(4);
  await page.getByLabel("레이드 선택").getByRole("button", { name: /꿈의 균열/ }).click();
  await expect(page.getByRole("heading", { name: "꿈의 균열" })).toBeVisible();
  await expect(page.getByText("검수 전 패턴은 확정 콜로 쓰지 않습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "레이드 목록" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "키메루스" })).toBeVisible();
  await page.getByRole("button", { name: "레이드 목록" }).click();
  await expect(page.getByRole("heading", { name: "레이드를 선택하세요" })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});

test("raid tab exposes detailed Sporefall Rotmire guide", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "레이드", exact: true }).click();
  await page.getByLabel("레이드 선택").getByRole("button", { name: /진균나락/ }).click();
  await expect(page.getByRole("heading", { name: "진균나락" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "부식수렁: 전투 루프" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "쫄 정리와 시체 더미" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "독 시전 차단" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "버섯 폭발 구간" })).toBeVisible();
  await expect(page.getByText("폭풍의 칼날은 쫄이 붙는 순간 켜고")).toBeVisible();
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

test("top navigation exposes every tab on narrow browser widths", async ({ page }) => {
  await page.setViewportSize({ width: 540, height: 760 });
  await page.goto("./");
  const nav = page.getByRole("navigation", { name: "주요 화면" });
  const labels = ["오늘", "AI 작전실", "장비 점검", "Wythic", "던전", "레이드", "가이드", "메모/설정"];

  for (const label of labels) {
    const button = nav.getByRole("button", { name: label, exact: true });
    await expect(button).toBeVisible();
    const fits = await button.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    });
    expect(fits).toBe(true);
  }

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(hasOverflow).toBe(false);
});
