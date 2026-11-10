import en from "./messages/en.json";

export const LOCALES = ["en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type Messages = Readonly<Record<string, string>>;

/** Every catalog lives here. A new locale is one import and one entry. */
export const MESSAGE_CATALOGS: Readonly<Record<Locale, Messages>> = { en };

type Params = Readonly<Record<string, string | number>>;

/** Translates a key. Falls back to the default locale, then fails loudly if the key is missing. */
export function t(key: string, params: Params = {}, locale: Locale = DEFAULT_LOCALE): string {
  const message = MESSAGE_CATALOGS[locale][key] ?? MESSAGE_CATALOGS[DEFAULT_LOCALE][key];
  if (message === undefined) {
    throw new Error(`Missing message key: ${key}`);
  }
  return interpolate(message, params);
}

/** Plural form. Looks up "<base>.one" or "<base>.other" using the locale's plural rules. */
export function tPlural(
  baseKey: string,
  count: number,
  params: Params = {},
  locale: Locale = DEFAULT_LOCALE,
): string {
  const category = new Intl.PluralRules(locale).select(count) === "one" ? "one" : "other";
  return t(`${baseKey}.${category}`, { ...params, count }, locale);
}

function interpolate(message: string, params: Params): string {
  return message.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(`Missing message parameter: ${name}`);
    }
    return String(value);
  });
}
