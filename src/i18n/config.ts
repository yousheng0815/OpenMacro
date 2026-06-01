export const LOCALE_STORAGE_KEY = "macrokeep:locale";

/** BCP 47 tags supported by the app UI. */
export type AppLocale = "en" | "zh-TW";

export const DEFAULT_LOCALE: AppLocale = "en";

export const SUPPORTED_LOCALES: readonly AppLocale[] = [
  "en",
  "zh-TW",
] as const;

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Map browser language tags to a supported app locale. */
export function resolveLocaleFromNavigator(
  languages: readonly string[] = typeof navigator !== "undefined"
    ? navigator.languages
    : [],
): AppLocale {
  for (const tag of languages) {
    const lower = tag.toLowerCase();
    if (lower === "zh-tw" || lower === "zh-hant" || lower.startsWith("zh-hant")) {
      return "zh-TW";
    }
    if (lower.startsWith("zh") && (lower.includes("tw") || lower.includes("hk"))) {
      return "zh-TW";
    }
    if (lower === "en" || lower.startsWith("en-")) return "en";
  }
  return DEFAULT_LOCALE;
}

function readLocaleCookie(): AppLocale | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== LOCALE_STORAGE_KEY) continue;
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    if (value === "ja") return null;
    if (isAppLocale(value)) return value;
  }
  return null;
}

function localeCookieDomain(): string | undefined {
  if (typeof location === "undefined") return undefined;
  const host = location.hostname;
  if (host === "macrokeep.com" || host.endsWith(".macrokeep.com")) {
    return ".macrokeep.com";
  }
  return undefined;
}

function writeLocaleCookie(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(locale);
  const domain = localeCookieDomain();
  const domainAttr = domain ? `;domain=${domain}` : "";
  document.cookie = `${LOCALE_STORAGE_KEY}=${encoded};path=/${domainAttr};max-age=31536000;SameSite=Lax`;
}

export function readStoredLocale(): AppLocale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "ja") {
      localStorage.removeItem(LOCALE_STORAGE_KEY);
      return null;
    }
    if (raw && isAppLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return readLocaleCookie();
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  writeLocaleCookie(locale);
}

/** `Intl` / `toLocaleString` tag for the active app locale. */
export function intlLocaleTag(locale: AppLocale): string | undefined {
  if (locale === "en") return undefined;
  return locale;
}

export function documentLangAttr(locale: AppLocale): string {
  if (locale === "zh-TW") return "zh-Hant";
  return locale;
}
