import {
  readStoredLocale,
  resolveLocaleFromNavigator,
} from "@app-i18n/config";
import { localizedPath } from "../i18n/config";

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isZhTwPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === "/zh-TW" || path.startsWith("/zh-TW/");
}

const BOT_UA =
  /googlebot|google-inspectiontool|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|discordbot|applebot|semrushbot|ahrefsbot|petalbot|bytespider/i;

function isCrawler(): boolean {
  return BOT_UA.test(navigator.userAgent);
}

/** Client-side locale redirect; skipped for crawlers so each language URL stays indexable. */
export function runLocaleRedirect(): void {
  if (isCrawler()) return;

  const path = normalizePath(window.location.pathname);
  const stored = readStoredLocale();
  const preferred = stored ?? resolveLocaleFromNavigator();
  const suffix = `${window.location.search}${window.location.hash}`;

  if (preferred === "zh-TW" && !isZhTwPath(path)) {
    window.location.replace(localizedPath("zh-TW", path) + suffix);
    return;
  }

  if (preferred === "en" && isZhTwPath(path) && stored === "en") {
    window.location.replace(localizedPath("en", path) + suffix);
  }
}
