import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { render } from "../dist-server/entry-server.js";
import { SITE_ORIGIN, publicPaths, pageMetadata } from "../src/lib/site.js";

const root = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", root), "utf8");
const escape = (value) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// 계정 화면은 서버가 별도 noindex 헤더와 함께 제공합니다.
await writeFile(
  new URL("shell.html", root),
  template.replace(
    "</head>",
    '<meta name="robots" content="noindex,follow" /></head>',
  ),
);
for (const path of publicPaths) {
  const info = pageMetadata(path);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(info.title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta name="description" content="${escape(info.description)}" />`,
    )
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
    .replace(
      "</head>",
      `
      <link rel="canonical" href="${SITE_ORIGIN}${path}" />
      <meta name="robots" content="index,follow" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="축의금 얼마하지?" />
      <meta property="og:title" content="${escape(info.title)}" />
      <meta property="og:description" content="${escape(info.description)}" />
      <meta property="og:url" content="${SITE_ORIGIN}${path}" />
    </head>`,
    );
  const directory = new URL(path === "/" ? "./" : path.slice(1) + "/", root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), html);
}
await writeFile(
  new URL("robots.txt", root),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
);
await writeFile(
  new URL("sitemap.xml", root),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await rm(new URL("../dist-server/", import.meta.url), {
  recursive: true,
  force: true,
});
console.log("공개 페이지 HTML, robots.txt, sitemap.xml 생성 완료");
