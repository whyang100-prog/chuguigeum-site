import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { migrate } from "./schema.mjs";
import { featureRoutes } from "./features.mjs";
import { digest, newToken } from "./auth.mjs";

test("같은 회원의 모든 승인 사례 페이지 조회와 등록 횟수 제한 해제", async () => {
  const db = createClient({ url: "file::memory:" });
  await migrate(db);
  const userId = randomUUID();
  const token = newToken();
  const date = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO users(id,username,password_hash,created_at) VALUES(?,?,?,?)",
    args: [userId, "writer", "unused", date],
  });
  await db.execute({
    sql: "INSERT INTO sessions VALUES(?,?,?)",
    args: [digest(token), userId, Date.now() + 600000],
  });
  const routes = featureRoutes(db);
  const server = http.createServer(async (req, res) => {
    const json = (status, value) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(value));
    };
    try {
      await routes(req, res, new URL(req.url, "http://localhost"), json);
    } catch (error) {
      json(error.status || 500, { error: error.message });
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const previousOrigin = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = base;
  async function call(path, body) {
    const response = await fetch(base + "/api/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: base,
        "X-Requested-With": "chuguigeum",
        Cookie: "sid=" + token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }
  try {
    for (let i = 0; i < 55; i++) {
      const result = await call("cases", {
        kind: "wedding",
        relation: "colleague",
        amount: 100000 + i,
        attendance: "meal",
        people: 1,
        event_month: date.slice(0, 7),
        story: `직장 동료에게 전달한 축의금 사례 ${i}입니다.`,
        consent: true,
      });
      assert.equal(result.status, 201, "10건을 넘어도 등록 가능");
    }
    assert.equal(
      (await call("community")).body.totalCases,
      0,
      "승인 전에는 비공개",
    );
    await db.execute("UPDATE cases SET status='approved'");
    const first = (await call("community")).body;
    const second = (await call("community?page=1")).body;
    const third = (await call("community?page=2")).body;
    assert.equal(first.totalCases, 55);
    assert.equal(first.count, 1, "통계 참여자는 회원 수 기준");
    assert.equal(first.median, null);
    assert.equal(first.cases.length, 20);
    assert.equal(second.cases.length, 20);
    assert.equal(third.cases.length, 15);
    assert.equal(
      new Set(
        [...first.cases, ...second.cases, ...third.cases].map((c) => c.id),
      ).size,
      55,
    );
    assert.ok(!JSON.stringify(first).includes(userId));
    assert.equal((await call("community?relation=close")).body.totalCases, 0);
    assert.equal((await call("community?page=-1")).status, 400);
    assert.equal((await call("community?page=3")).body.cases.length, 0);
    await db.execute({
      sql: "UPDATE cases SET status='rejected' WHERE id=?",
      args: [first.cases[0].id],
    });
    assert.equal((await call("community")).body.totalCases, 54);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    db.close();
    if (previousOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previousOrigin;
  }
});
