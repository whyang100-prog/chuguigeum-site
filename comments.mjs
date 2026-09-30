import { randomUUID } from "node:crypto";
import { digest } from "./auth.mjs";

// 로그인·요청 출처 검증을 마친 후 features.mjs에서 호출합니다.
export async function commentRoutes({
  db,
  user,
  req,
  url,
  json,
  body,
  limit,
  fail,
}) {
  const match = url.pathname.match(
    /^\/api\/cases\/([a-f0-9-]{36})\/comments(?:\/([a-f0-9-]{36}))?$/,
  );
  if (!match) return false;
  const [, caseId, commentId] = match;
  const query = (sql, args = []) => db.execute({ sql, args });
  const admin = user.role === "admin";

  // 본인 댓글은 사례가 비공개로 바뀌어도 직접 삭제할 수 있습니다.
  if (commentId && req.method === "DELETE") {
    await body(req);
    const permission = admin ? "" : " AND user_id=?";
    const args = admin ? [commentId, caseId] : [commentId, caseId, user.id];
    const statements = [];
    if (admin) {
      statements.push({
        sql: "INSERT INTO admin_audit(id,admin_id,action,target_id,created_at) SELECT ?,?,'comment:delete',id,? FROM case_comments WHERE id=? AND case_id=?",
        args: [
          randomUUID(),
          user.id,
          new Date().toISOString(),
          commentId,
          caseId,
        ],
      });
    }
    statements.push({
      sql: "DELETE FROM case_comments WHERE id=? AND case_id=?" + permission,
      args,
    });
    const results = await db.batch(statements, "write");
    if (!results.at(-1).rowsAffected)
      fail(404, "삭제할 댓글을 찾을 수 없습니다.");
    json(200, { ok: true });
    return true;
  }
  if (commentId || !["GET", "POST"].includes(req.method)) {
    fail(405, "지원하지 않는 요청입니다.");
  }
  const parent = (
    await query(
      "SELECT c.user_id,c.status,u.status AS author_status FROM cases c JOIN users u ON u.id=c.user_id WHERE c.id=?",
      [caseId],
    )
  ).rows[0];
  if (
    !parent ||
    (!admin &&
      (parent.status !== "approved" || parent.author_status !== "active"))
  ) {
    fail(404, "공개된 사례를 찾을 수 없습니다.");
  }

  if (req.method === "GET") {
    const page = Number(url.searchParams.get("page") || 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 100000) {
      fail(400, "댓글 페이지가 올바르지 않습니다.");
    }
    const pageSize = 20;
    const visibility = admin ? "" : " AND u.status='active'";
    const [count, list] = await db.batch(
      [
        {
          sql:
            "SELECT COUNT(*) AS count FROM case_comments c JOIN users u ON u.id=c.user_id WHERE c.case_id=?" +
            visibility,
          args: [caseId],
        },
        {
          sql:
            "SELECT c.id,c.user_id,c.body,c.created_at,u.status FROM case_comments c JOIN users u ON u.id=c.user_id WHERE c.case_id=?" +
            visibility +
            " ORDER BY c.created_at DESC,c.id DESC LIMIT ? OFFSET ?",
          args: [caseId, pageSize, page * pageSize],
        },
      ],
      "read",
    );
    json(200, {
      total: Number(count.rows[0].count),
      page,
      pageSize,
      canPost:
        parent.status === "approved" && parent.author_status === "active",
      comments: list.rows.map((row) => ({
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
        // 사례마다 다른 별칭: 로그인 아이디와 내부 회원 ID는 공개하지 않습니다.
        author: digest(caseId + ":" + row.user_id).slice(0, 10),
        isMine: row.user_id === user.id,
        isCaseAuthor: row.user_id === parent.user_id,
        canDelete: admin || row.user_id === user.id,
        hidden: row.status !== "active",
      })),
    });
    return true;
  }

  const values = await body(req);
  if (
    typeof values.body !== "string" ||
    !values.body.trim() ||
    values.body.trim().length > 500
  ) {
    fail(400, "댓글은 1~500자로 입력해 주세요.");
  }
  await limit("comment:" + user.id, 20);
  // 승인 취소·회원 삭제와 동시에 요청되어도 비공개 사례에 댓글이 생성되지 않습니다.
  const inserted = await query(
    `INSERT INTO case_comments(id,case_id,user_id,body,created_at)
     SELECT ?,c.id,?,?,? FROM cases c JOIN users owner ON owner.id=c.user_id
     WHERE c.id=? AND c.status='approved' AND owner.status='active'
     AND EXISTS(SELECT 1 FROM users WHERE id=? AND status='active')`,
    [
      randomUUID(),
      user.id,
      values.body.trim(),
      new Date().toISOString(),
      caseId,
      user.id,
    ],
  );
  if (!inserted.rowsAffected) fail(404, "공개된 사례를 찾을 수 없습니다.");
  json(201, { ok: true });
  return true;
}
