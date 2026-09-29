import { test, expect } from "@playwright/test";
import en from "../../src/i18n/en.json" with { type: "json" };
import ja from "../../src/i18n/ja.json" with { type: "json" };
const picker = (page) =>
  page.getByRole("combobox", { name: "Language / 언어 / 言語" });

test("영어·일본어 전환, 입력 유지, KRW 표시, 지역 검색, 새로고침과 모바일", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#meal").fill("80000");
  await page.getByRole("button", { name: "식사 인원 한 명 늘리기" }).click();
  await picker(page).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: /Ready to celebrate/ }),
  ).toBeVisible();
  await expect(page.locator("#meal")).toHaveValue("80000");
  await expect(page.getByTestId("calculated-amount")).toHaveText("200,000");
  await expect(page.locator(".amount")).toContainText("KRW");
  await page.getByRole("button", { name: "Seoul", exact: true }).click();
  await expect(page.locator(".venue").first()).toBeVisible();
  const venueRegions = await page
    .locator(".venue button small:first-of-type")
    .allTextContents();
  expect(venueRegions.every((text) => text.includes("Seoul"))).toBe(true);
  await picker(page).selectOption("ja");
  await expect(page.getByTestId("calculated-amount")).toHaveText("200,000");
  await expect(page.locator(".amount")).toContainText("ウォン");
  await expect(
    page.getByRole("button", { name: ja["서울"], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("link", { name: ja["예절 가이드"], exact: true })
    .click();
  await expect(
    page.getByText(
      ja[
        "한국의 일반적인 방문 상황을 기준으로 정리했어요. 가족의 뜻과 현장 안내가 우선입니다."
      ],
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: ja["개신교식"] }).click();
  await expect(page.locator(".religion-body")).toContainText("祈り");
  await page.reload();
  await expect(picker(page)).toHaveValue("ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await page
    .getByRole("link", { name: ja["사용자 사례"], exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: ja["로그인하고 시작해 주세요"] }),
  ).toBeVisible();
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const language of ["en", "ja", "ko"]) {
    await picker(page).selectOption(language);
    if (language === "en")
      await page.screenshot({
        path: "test-results/english-mobile.png",
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.getByTestId("calculated-amount")).toHaveText("10");
  expect(errors).toEqual([]);
});

test("영문 서버 오류, 회원 기록·사례의 원문 보존과 일본어 관리자", async ({
  page,
}) => {
  await page.goto("/#/login");
  await picker(page).selectOption("en");
  await page.getByLabel("Username", { exact: true }).fill("language_member");
  await page
    .getByLabel("Password", { exact: true })
    .fill("language-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Check your username and password.",
  );
  await picker(page).selectOption("ja");
  await expect(page.getByRole("status")).toContainText(
    ja[
      "아이디 또는 비밀번호를 확인해 주세요. 정지된 계정은 로그인할 수 없습니다."
    ],
  );
  await page.getByRole("link", { name: ja["처음이라면 회원가입"] }).click();
  await page.getByLabel(ja["아이디"], { exact: true }).fill("language_member");
  await page
    .getByLabel(ja["비밀번호"], { exact: true })
    .fill("language-test-password");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: ja["가입하고 시작"] }).click();
  await page
    .getByLabel(ja["상대 이름 또는 별칭"])
    .fill("친구 원문 日本語 English");
  await page.getByLabel(ja["금액 (원)"], { exact: true }).fill("150000");
  await page
    .getByLabel(ja["메모"], { exact: true })
    .fill("로그인 — 이 메모는 번역하지 않음");
  await picker(page).selectOption("en");
  await expect(
    page.getByRole("textbox", { name: "Memo", exact: true }),
  ).toHaveValue("로그인 — 이 메모는 번역하지 않음");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "친구 원문 日本語 English" }),
  ).toBeVisible();
  await expect(page.locator(".amount-small")).toHaveText("150,000 KRW");
  await page
    .getByRole("link", { name: "Community stories", exact: true })
    .click();
  await page.getByLabel(en["실제로 낸 총액 (원)"]).fill("150000");
  await page
    .getByLabel("Event month", { exact: true })
    .fill(new Date().toISOString().slice(0, 7));
  await page
    .getByLabel(en["어떤 사이였고, 왜 이 금액을 정했나요?"])
    .fill("원문 사례: 친한 친구의 결혼식에 다녀왔습니다.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
  await picker(page).selectOption("ja");
  await expect(
    page.getByText("원문 사례: 친한 친구의 결혼식에 다녀왔습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: ja["로그아웃"], exact: true }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.goto("/#/login");
  await page.getByLabel(ja["아이디"], { exact: true }).fill("e2e_admin");
  await page
    .getByLabel(ja["비밀번호"], { exact: true })
    .fill("test-admin-password-123");
  await page.getByRole("button", { name: ja["로그인"], exact: true }).click();
  await page.getByRole("link", { name: ja["관리자"], exact: true }).click();
  await expect(
    page.getByRole("heading", { name: ja["회원과 사례 관리"] }),
  ).toBeVisible();
  const card = page
    .locator("article")
    .filter({ hasText: "원문 사례: 친한 친구의 결혼식에 다녀왔습니다." });
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("language_member");
    expect(dialog.message()).not.toMatch(/[가-힣]/);
    await dialog.accept();
  });
  await card.getByRole("button", { name: ja["승인"], exact: true }).click();
  await expect(card.getByText(ja["공개 중"], { exact: true })).toBeVisible();
});
