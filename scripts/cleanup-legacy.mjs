// React 전환 전 화면 파일만 정리합니다. 서버, DB, .env, .git은 건드리지 않습니다.
import { readFile, lstat, mkdir, copyFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, basename, join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const project = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (!project.dependencies?.react) throw new Error("React 프로젝트에서만 실행할 수 있습니다.");
await readFile(join(root, "src/main.jsx"), "utf8");

const legacy = [
  "public/app.js",
  "public/calculator.js",
  "public/hub.js",
  "public/hub.html",
  "public/index.html",
  "public/style.css",
  "public/hub.css",
  "UPDATE-V2.md",
];
const folder = root.replace(/[\\/]+$/, "");
const backup = join(dirname(folder), `${basename(folder)}-legacy-backup-${Date.now()}`);
let count = 0;
for (const relative of legacy) {
  const source = join(root, relative);
  let info;
  try {
    info = await lstat(source);
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  if (!info.isFile()) throw new Error(`일반 파일이 아니므로 중단합니다: ${relative}`);
  const target = join(backup, relative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  await unlink(source);
  count++;
  console.log(`정리 완료: ${relative}`);
}
console.log(count ? `구버전 ${count}개를 프로젝트 밖에 백업했습니다: ${backup}` : "정리할 구버전 파일이 없습니다.");
