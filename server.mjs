import { appPaths, publicPaths } from "./src/lib/site.js";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { database } from "./db.mjs";
import { featureRoutes } from "./features.mjs";
const root = new URL("./dist/", import.meta.url);
const db = process.env.TURSO_DATABASE_URL ? database() : null;
if (process.env.NODE_ENV === "production" && !db)
  throw new Error(
    "Turso database must be configured before production deployment",
  );
const seed = JSON.parse(
  await readFile(new URL("./data/venues.json", import.meta.url), "utf8"),
);
const features = featureRoutes(db);
// 빌드된 공개 파일만 제공합니다. src나 환경변수 파일은 제공하지 않습니다.
const files = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/hub": ["shell.html", "text/html; charset=utf-8"],
  "/etiquette": ["etiquette/index.html", "text/html; charset=utf-8"],
  "/robots.txt": ["robots.txt", "text/plain; charset=utf-8"],
  "/sitemap.xml": ["sitemap.xml", "application/xml; charset=utf-8"],
  ...Object.fromEntries(
    appPaths
      .filter((path) => !publicPaths.includes(path))
      .map((path) => [path, ["shell.html", "text/html; charset=utf-8"]]),
  ),
  "/favicon.svg": ["favicon.svg", "image/svg+xml"],
};
const assetTypes = {
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  woff2: "font/woff2",
};

export const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  );
  const json = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, "http://localhost");
    const { pathname, searchParams } = url;
    if (await features(req, res, url, json)) return;
    if (!["GET", "HEAD"].includes(req.method)) {
      json(405, { error: "Method not allowed" });
      return;
    }
    if (pathname === "/healthz") {
      if (db) await db.execute("SELECT id FROM venues LIMIT 1");
      json(200, { status: "ok", storage: db ? "turso" : "development-seed" });
      return;
    }
    if (pathname === "/api/venues") {
      const q = (searchParams.get("q") ?? "").slice(0, 100);
      const region = (searchParams.get("region") ?? "").slice(0, 20);
      let venues;
      if (db) {
        const where = [],
          args = [];
        if (region) {
          where.push("region = ?");
          args.push(region);
        }
        if (q) {
          where.push("(instr(name, ?) > 0 OR instr(district, ?) > 0)");
          args.push(q, q);
        }
        const r = await db.execute({
          sql: `SELECT id, name, region, district, meal, source, source_name AS sourceName, checked_at AS checkedAt, price_date AS priceDate, status FROM venues ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY region, name LIMIT 5000`,
          args,
        });
        venues = r.rows;
      } else
        venues = seed.filter(
          (v) =>
            (!region || v.region === region) &&
            (!q || `${v.name} ${v.district}`.includes(q)),
        );
      json(200, {
        venues,
        coverage: "partial",
        storage: db ? "turso" : "development-seed",
      });
      return;
    }
    if (
      pathname.endsWith("/") &&
      pathname !== "/" &&
      appPaths.includes(pathname.slice(0, -1))
    ) {
      res.writeHead(301, { Location: pathname.slice(0, -1) + url.search });
      res.end();
      return;
    }
    if (
      (appPaths.includes(pathname) && !publicPaths.includes(pathname)) ||
      pathname === "/hub"
    ) {
      res.setHeader("X-Robots-Tag", "noindex, follow");
    }
    const match = pathname.match(
      /^\/assets\/([a-zA-Z0-9_.-]+\.(js|css|svg|png|woff2))$/,
    );
    const asset =
      files[pathname] ||
      (match ? ["assets/" + match[1], assetTypes[match[2]]] : null);
    if (!asset) {
      json(404, { error: "Not found" });
      return;
    }
    let content;
    try {
      content = await readFile(new URL(asset[0], root));
    } catch (error) {
      if (error.code === "ENOENT") {
        json(404, {
          error:
            pathname === "/" || pathname === "/hub"
              ? "Run npm run build before npm start"
              : "Not found",
        });
        return;
      }
      throw error;
    }
    res.writeHead(200, {
      "Content-Type": asset[1],
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (e) {
    if (!e.status) console.error("Request failed:", e.code || e.name);
    json(e.status || 503, {
      error: e.status
        ? e.message
        : "일시적으로 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () =>
    console.log(`Listening on port ${port}`),
  );
}
