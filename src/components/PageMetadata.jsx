import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { t, useLanguage } from "../i18n/index";
import { SITE_ORIGIN, publicPaths, pageMetadata } from "../lib/site";

export default function PageMetadata() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  useEffect(() => {
    const info = pageMetadata(pathname);
    document.title = t(info.title);
    function meta(selector, attribute, value, content) {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    }
    meta(
      'meta[name="description"]',
      "name",
      "description",
      t(info.description),
    );
    meta(
      'meta[name="robots"]',
      "name",
      "robots",
      publicPaths.includes(pathname) ? "index,follow" : "noindex,follow",
    );
    meta('meta[property="og:title"]', "property", "og:title", t(info.title));
    meta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      t(info.description),
    );
    meta(
      'meta[property="og:url"]',
      "property",
      "og:url",
      SITE_ORIGIN + pathname,
    );
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_ORIGIN + pathname;
  }, [pathname, language]);
  return null;
}
