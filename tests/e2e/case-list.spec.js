import { test, expect } from "@playwright/test";

test("같은 회원 승인 사례 전체 조회와 조건 변경 시 첫 페이지", async ({
  page,
}) => {
  const headers = {
    Origin: "http://127.0.0.1:4175",
    "X-Requested-With": "chuguigeum",
  };
  await page.request.post("/api/auth/login", {
    headers,
    data: { username: "e2e_admin", password: "test-admin-password-123" },
  });
  for (let i = 0; i < 21; i++) {
    const created = await page.request.post("/api/cases", {
      headers,
      data: {
        kind: "funeral",
        relation: "best",
        amount: 100000,
        attendance: "absent",
        people: 2,
        event_month: new Date().toISOString().slice(0, 7),
        story: `목록 페이지 확인용 사례 번호 ${i}입니다.`,
        consent: true,
      },
    });
    expect(created.status()).toBe(201);
  }
  const own = await (await page.request.get("/api/cases")).json();
  for (const item of own.cases.filter((item) =>
    item.story.startsWith("목록 페이지 확인용"),
  )) {
    expect(
      (
        await page.request.patch("/api/admin/cases/" + item.id, {
          headers,
          data: { status: "approved" },
        })
      ).ok(),
    ).toBe(true);
  }
  await page.goto("/#/admin");
  const review = page.locator(".guide-grid > section").nth(1);
  await expect(review.locator("article.item")).toHaveCount(5);
  await review.getByRole("button", { name: "다음 사례", exact: true }).click();
  await expect(review.getByText("2페이지", { exact: true })).toBeVisible();
  await expect(review.locator("article.item")).toHaveCount(5);
  await page.goto("/#/cases");
  const filters = page.locator(".filters select");
  await filters.nth(0).selectOption("funeral");
  await filters.nth(1).selectOption("best");
  await filters.nth(2).selectOption("absent");
  await filters.nth(3).selectOption("2");
  const region = page.getByRole("region", { name: "승인된 사례" });
  await expect(region.locator("article.item")).toHaveCount(5);
  await expect(region).toContainText("승인 사례 21건");
  await region.getByRole("button", { name: "다음 사례" }).click();
  await expect(region.locator("article.item")).toHaveCount(5);
  await expect(region.getByText("2페이지", { exact: true })).toBeVisible();
  await filters.nth(0).selectOption("wedding");
  await expect(region.locator("article.item")).toHaveCount(0);
  await filters.nth(0).selectOption("funeral");
  await expect(region.locator("article.item")).toHaveCount(5);
});
