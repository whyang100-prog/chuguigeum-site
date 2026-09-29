import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
// 같은 명령으로 API 서버와 React 개발 서버를 실행합니다 (Windows도 지원).
const apiPort = process.env.API_PORT || "3000";
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}
const env = {
  ...process.env,
  NODE_ENV: "development",
  PORT: apiPort,
  API_PORT: apiPort,
  APP_ORIGIN: "http://localhost:5173",
};
for (const file of [
  "server.mjs",
  join(dirname(require.resolve("vite/package.json")), "bin/vite.js"),
]) {
  const child = spawn(process.execPath, [file], { env, stdio: "inherit" });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
