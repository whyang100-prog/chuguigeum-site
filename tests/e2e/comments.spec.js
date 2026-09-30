import { test, expect } from "@playwright/test";

const headers = {
  Origin: "http://127.0.0.1:4175",
  "X-Requested-With": "chuguigeum",
};
test("승인 사례 1건에서 회원 댓글·원문·언어 전환·관리자 삭제", async ({
  page,
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4175",
  });
  const member = await context.newPage();
  try {
    await context.request.post("/api/auth/register", {
      headers,
      data: {
        username: "comment_member",
        password: "comment-password-123",
        consent: true,
      },
    });
    await context.request.post("/api/cases", {
      headers,
      data: {
        kind: "funeral",
        relation: "close",
        amount: 150000,
        attendance: "no-meal",
        people: 1,
        event_month: new Date().toISOString().slice(0, 7),
        story: "댓글 기능을 확인하기 위해 등록한 조의금 사례입니다.",
        consent: true,
      },
    });
    await page.request.post("/api/auth/login", {
      headers,
      data: { username: "e2e_admin", password: "test-admin-password-123" },
    });
    await page.goto("/admin");
    const adminCard = page.locator("article.item").filter({
      hasText: "댓글 기능을 확인하기 위해 등록한 조의금 사례입니다.",
    });
    page.once("dialog", (dialog) => dialog.accept());
    await adminCard.getByRole("button", { name: "승인", exact: true }).click();
    await expect(adminCard.getByText("공개 중", { exact: true })).toBeVisible();
    await member.goto("/cases");
    await member.locator(".filters select").nth(0).selectOption("funeral");
    await member.locator(".filters select").nth(1).selectOption("close");
    await member.locator(".filters select").nth(2).selectOption("no-meal");
    const card = member
      .locator(".hub-grid > section")
      .first()
      .locator("article.item")
      .filter({
        hasText: "댓글 기능을 확인하기 위해 등록한 조의금 사례입니다.",
      });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "댓글 보기 · 소통하기" }).click();
    await expect(
      card.getByText("아직 댓글이 없어요. 첫 의견을 남겨 보세요."),
    ).toBeVisible();
    const raw = "저도 비슷한 경험이 있어요! <img src=x onerror=alert(1)>";
    await card.getByLabel("댓글 작성", { exact: true }).fill(raw);
    await card.getByRole("button", { name: "댓글 등록", exact: true }).click();
    await expect(card.getByText(raw, { exact: true })).toBeVisible();
    await expect(card.locator(".comment-list img")).toHaveCount(0);
    await expect(card.getByText("사례 작성자", { exact: true })).toBeVisible();
    await expect(card.locator(".comment-list")).not.toContainText(
      "comment_member",
    );
    await member
      .getByRole("combobox", { name: "Language / 언어 / 言語" })
      .selectOption("en");
    await expect(
      card.getByRole("button", { name: "Delete comment", exact: true }),
    ).toBeVisible();
    await expect(card.getByText(raw, { exact: true })).toBeVisible();
    await member.setViewportSize({ width: 390, height: 844 });
    expect(
      await member.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await adminCard
      .getByRole("button", { name: "댓글 보기 · 소통하기" })
      .click();
    await expect(adminCard.getByText(raw, { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await adminCard
      .getByRole("button", { name: "댓글 삭제", exact: true })
      .click();
    await expect(adminCard.getByText(raw, { exact: true })).toHaveCount(0);
    await member.getByRole("button", { name: "Refresh comments" }).click();
    await expect(member.getByText(raw, { exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
