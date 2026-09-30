import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { featureRoutes } from "./features.mjs";
import { migrate } from "./schema.mjs";
import { digest, newToken } from "./auth.mjs";

test("댓글 공개 범위·익명성·소유권·관리자·페이지·정리·요청 제한", async () => {
  const db = createClient({ url: "file::memory:" });
  await migrate(db);
  await migrate(db);
  const query = (sql, args = []) => db.execute({ sql, args });
  const accounts = {};
  for (const name of ["owner", "reader", "other", "admin"]) {
    const id = randomUUID();
    const token = newToken();
    accounts[name] = { id, cookie: "sid=" + token };
    await query(
      "INSERT INTO users(id,username,password_hash,role,created_at) VALUES(?,?,?,?,?)",
      [
        id,
        name,
        "unused",
        name === "admin" ? "admin" : "member",
        new Date().toISOString(),
      ],
    );
    await query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
      [digest(token), id, Date.now() + 600000],
    );
  }
  const makeCase = async (status = "approved", owner = accounts.owner.id) => {
    const id = randomUUID();
    await query(
      "INSERT INTO cases(id,user_id,kind,relation,amount,attendance,people,event_month,story,status,created_at) VALUES(?,?,'wedding','colleague',100000,'meal',1,?,'댓글 테스트 사례입니다.',?,?)",
      [
        id,
        owner,
        new Date().toISOString().slice(0, 7),
        status,
        new Date().toISOString(),
      ],
    );
    return id;
  };
  const approved = await makeCase();
  const pending = await makeCase("pending");
  const rejected = await makeCase("rejected");
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
  const call = async (
    path,
    method = "GET",
    account = "reader",
    data,
    origin = base,
  ) => {
    const response = await fetch(base + "/api/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "chuguigeum",
        Origin: origin,
        Cookie: accounts[account]?.cookie || "",
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, body: await response.json() };
  };
  const path = "cases/" + approved + "/comments";
  const post = (text, who = "reader", target = path) =>
    call(target, "POST", who, { body: text });
  try {
    assert.equal((await call(path, "GET", "anonymous")).status, 401);
    assert.equal(
      (await call(path, "POST", "anonymous", { body: "hello" })).status,
      401,
    );
    assert.equal(
      (
        await call(
          path,
          "POST",
          "reader",
          { body: "hello" },
          "https://wrong.example",
        )
      ).status,
      403,
    );
    for (const id of [pending, rejected, randomUUID()]) {
      assert.equal((await call(`cases/${id}/comments`)).status, 404);
      assert.equal(
        (await post("hidden", "reader", `cases/${id}/comments`)).status,
        404,
      );
    }
    assert.equal(
      (await call(`cases/${pending}/comments`, "GET", "admin")).status,
      200,
    );
    for (const invalid of ["", "   ", "a".repeat(501), null, {}])
      assert.equal((await post(invalid)).status, 400);
    assert.equal((await post(" <img src=x onerror=alert(1)> ")).status, 201);
    let thread = (await call(path)).body;
    const id = thread.comments[0].id;
    assert.equal(thread.total, 1);
    assert.equal(thread.comments[0].body, "<img src=x onerror=alert(1)>");
    assert.equal(thread.comments[0].isMine, true);
    assert.equal(thread.comments[0].canDelete, true);
    assert.ok(!JSON.stringify(thread).includes(accounts.reader.id));
    assert.equal(thread.comments[0].username, undefined);
    const other = (await call(path, "GET", "other")).body.comments[0];
    assert.equal(other.author, thread.comments[0].author);
    assert.equal(other.canDelete, false);
    assert.equal(
      (await call(path + "/" + id, "DELETE", "other", {})).status,
      404,
    );
    assert.equal(
      (await call(`cases/${pending}/comments/${id}`, "DELETE", "admin", {}))
        .status,
      404,
    );
    let stats = (await call("community")).body;
    assert.equal(stats.count, 1);
    assert.equal(stats.cases.length, 1); // 5명 미만도 사례 글·댓글은 표시합니다.
    assert.equal(stats.median, null);
    assert.equal(
      (await call(path + "/" + id, "DELETE", "reader", {})).status,
      200,
    );
    assert.equal(
      (await call(path + "/" + id, "DELETE", "reader", {})).status,
      404,
    );
    await post("관리자 삭제 대상");
    const adminId = (await call(path)).body.comments[0].id;
    assert.equal(
      (await call(path + "/" + adminId, "DELETE", "admin", {})).status,
      200,
    );
    assert.equal(
      (
        await query(
          "SELECT COUNT(*) AS n FROM admin_audit WHERE action='comment:delete'",
        )
      ).rows[0].n,
      1,
    );
    // 21개 이상에서도 페이지 경계가 겹치지 않습니다.
    for (let n = 0; n < 25; n++)
      await query("INSERT INTO case_comments VALUES(?,?,?,?,?)", [
        randomUUID(),
        approved,
        accounts.reader.id,
        "내용 " + n,
        new Date().toISOString(),
      ]);
    const page1 = (await call(path)).body;
    const page2 = (await call(path + "?page=1")).body;
    assert.equal(page1.total, 25);
    assert.equal(page1.comments.length, 20);
    assert.equal(page2.comments.length, 5);
    assert.equal(
      new Set([...page1.comments, ...page2.comments].map((c) => c.id)).size,
      25,
    );
    assert.equal((await call(path + "?page=-1")).status, 400);
    await query("UPDATE users SET status='suspended' WHERE id=?", [
      accounts.reader.id,
    ]);
    assert.equal((await call(path)).status, 401);
    assert.equal((await call(path, "GET", "other")).body.total, 0);
    assert.equal(
      (await call(path, "GET", "admin")).body.comments[0].hidden,
      true,
    );
    await query("UPDATE users SET status='active' WHERE id=?", [
      accounts.reader.id,
    ]);
    await query("UPDATE cases SET status='rejected' WHERE id=?", [approved]);
    assert.equal((await call(path)).status, 404);
    assert.equal((await post("반려 후 작성")).status, 404);
    assert.equal((await call(path, "GET", "admin")).body.canPost, false);
    await query("UPDATE cases SET status='approved' WHERE id=?", [approved]);
    // 다른 사람의 사례에 단 댓글도 계정 삭제 시 정리됩니다.
    await query("DELETE FROM users WHERE id=?", [accounts.reader.id]);
    assert.equal((await call(path, "GET", "other")).body.total, 0);
    await post("사례 작성자의 댓글", "owner");
    assert.equal(
      (await call(path, "GET", "other")).body.comments[0].isCaseAuthor,
      true,
    );
    assert.equal(
      (await call("cases/" + approved, "DELETE", "owner", {})).status,
      200,
    );
    assert.equal(
      (
        await query("SELECT COUNT(*) AS n FROM case_comments WHERE case_id=?", [
          approved,
        ])
      ).rows[0].n,
      0,
    );
    const newCase = await makeCase("approved", accounts.other.id);
    const newPath = `cases/${newCase}/comments`;
    for (let i = 0; i < 20; i++)
      assert.equal((await post("짧은 댓글", "other", newPath)).status, 201);
    assert.equal((await post("요청 제한", "other", newPath)).status, 429);
    assert.equal(
      (
        await call(`admin/cases/${newCase}`, "DELETE", "admin", {
          confirmCaseId: newCase,
        })
      ).status,
      200,
    );
    assert.equal(
      (await query("SELECT COUNT(*) AS n FROM case_comments")).rows[0].n,
      0,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    db.close();
    if (previousOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previousOrigin;
  }
});
