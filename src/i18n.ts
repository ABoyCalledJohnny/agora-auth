import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, LOCALES } from "./config/constants.ts";

/**
 * Parses the Accept-Language header and returns the first locale
 * that matches one of our supported locales, or undefined.
 *
 * Example header: "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
 * Parsed languages (sorted by priority): ["de-DE", "de", "en-US", "en"]
 * Match against locales ["en", "de"] → "de"
 */
function resolveFromHeader(acceptLanguageHeader: string): string | undefined {
  // Step 1: Split by comma → ["de-DE", "de;q=0.9", "en-US;q=0.8", "en;q=0.7"]
  const rawLanguages = acceptLanguageHeader.split(",");

  // Step 2: Parse each entry into a language code and its priority (0.0 – 1.0).
  //         If no ";q=" is present, the browser considers it top priority (1.0).
  const parsedLanguages = rawLanguages.map((rawEntry) => {
    const [languageCode = "", qualityValue] = rawEntry.trim().split(";q=");
    const priority = qualityValue ? parseFloat(qualityValue) : 1;
    return { languageCode: languageCode.trim(), priority };
  });

  // Step 3: Sort by priority, highest first → the user's most preferred language comes first.
  const sortedLanguages = parsedLanguages.sort((a, b) => b.priority - a.priority);

  // Step 4: Walk through sorted languages and return the first one we support.
  for (const { languageCode } of sortedLanguages) {
    // Exact match: e.g. "en" is directly in our ["en", "de"] list
    if ((LOCALES as readonly string[]).includes(languageCode)) return languageCode;

    // Prefix match: e.g. "de-DE" → take "de" (before the hyphen) and check that
    const baseLanguage = languageCode.split("-")[0] ?? "";
    if ((LOCALES as readonly string[]).includes(baseLanguage)) return baseLanguage;
  }

  // No supported language found — caller will fall back to defaultLocale
  return undefined;
}

export default getRequestConfig(async () => {
  const headersList = await headers();

  const fromHeader = resolveFromHeader(headersList.get("accept-language") ?? "");
  const locale = fromHeader ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
