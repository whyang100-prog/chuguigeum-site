import { test, expect } from "@playwright/test";

test("검색용 HTML은 JavaScript 없이도 본문과 일반 링크를 제공", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://127.0.0.1:4175",
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await expect(page).toHaveTitle(/축의금 얼마하지/);
    await expect(
      page.getByRole("heading", { name: /금액이 고민/ }),
    ).toBeVisible();
    await expect(
      page.getByText("친밀도에 따른 기준 금액", { exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "예절 가이드", exact: true }).click();
    await expect(page).toHaveURL(/\/etiquette$/);
    await expect(page).toHaveTitle(/결혼식·장례식 예절 가이드/);
    await expect(
      page.getByRole("heading", { name: "결혼식 예절" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "장례식 예절" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("일반 경로 새로고침·메타정보·기존 해시 주소 호환", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/etiquette");
  await page.getByRole("button", { name: "개신교식" }).click();
  await expect(page.locator(".religion-body")).toContainText("헌화 후 묵념");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "결혼식 예절" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "축의금 계산", exact: true }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://chuguigeum-how-much.onrender.com/",
  );
  await page.goto("/#/etiquette");
  await expect(page).toHaveURL(/\/etiquette$/);
  await page.getByRole("link", { name: "내 경조사 기록", exact: true }).click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "로그인하고 시작해 주세요" }),
  ).toBeVisible();
  await page.goto("/hub#etiquette");
  await expect(page).toHaveURL(/\/etiquette$/);
  expect(errors).toEqual([]);
});
