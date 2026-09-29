// 브라우저 테스트 전용입니다. 운영 Turso 설정을 읽지 않고 임시 DB만 사용합니다.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { hashPassword } from "../auth.mjs";
const dir = await mkdtemp(join(tmpdir(), "gift-react-e2e-"));
process.env.TURSO_DATABASE_URL = pathToFileURL(join(dir, "test.db")).href;
process.env.TURSO_AUTH_TOKEN = "";
process.env.NODE_ENV = "test";
process.env.APP_ORIGIN = "http://127.0.0.1:4175";
process.env.PORT = "4175";
await import("./seed.mjs");
const db = createClient({ url: process.env.TURSO_DATABASE_URL });
await db.execute({
  sql: "INSERT INTO users(id,username,password_hash,role,created_at) VALUES (?,?,?,'admin',?)",
  args: [
    randomUUID(),
    "e2e_admin",
    await hashPassword("test-admin-password-123"),
    new Date().toISOString(),
  ],
});
db.close();
const { server } = await import("../server.mjs");
server.listen(4175, "127.0.0.1");
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  // 서버 종료 후 Windows에서는 잠금이 남을 수 있습니다. 운영 데이터와 무관한 임시 디렉터리입니다.
  try {
    await rm(dir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  } catch {
    console.warn("임시 테스트 DB 정리를 완료하지 못했습니다:", dir);
  }
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
