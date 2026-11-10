import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, MESSAGE_CATALOGS, t, tPlural } from "@/lib/i18n";
import { formatPercent, formatPoints } from "@/lib/i18n/format";

const EMOJI = /\p{Extended_Pictographic}/u;
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const en = MESSAGE_CATALOGS[DEFAULT_LOCALE];
const baseKeys = (catalog: Record<string, string>) =>
  [...new Set(Object.keys(catalog).map((k) => k.replace(/\.(one|other)$/, "")))].sort();

describe("message catalogs", () => {
  it("has non-empty values for every key", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("contains no emoji in any message", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(MESSAGE_CATALOGS[locale])) {
        expect(EMOJI.test(value), `${locale}:${key}`).toBe(false);
      }
    }
  });

  it("gives every locale the same keys as the default locale", () => {
    const reference = baseKeys(en);
    for (const locale of LOCALES) {
      expect(baseKeys(MESSAGE_CATALOGS[locale]), locale).toEqual(reference);
    }
  });

  it("keeps the same placeholders in every locale", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(en)) {
        const translated = MESSAGE_CATALOGS[locale][key];
        expect(translated, `${locale}:${key}`).toBeDefined();
        expect(placeholders(translated ?? ""), `${locale}:${key}`).toEqual(placeholders(value));
      }
    }
  });

  it("pairs every plural key with both one and other", () => {
    const plurals = Object.keys(en).filter((k) => k.endsWith(".one"));
    for (const key of plurals) {
      const base = key.replace(/\.one$/, "");
      expect(en[`${base}.other`], base).toBeDefined();
    }
  });
});

describe("translation helpers", () => {
  it("interpolates parameters", () => {
    expect(t("score.calibration.progress", { count: 3, required: 7 })).toBe(
      "Calibrating: 3 of 7 days",
    );
  });

  it("throws on a missing parameter instead of printing a placeholder", () => {
    expect(() => t("score.calibration.progress", { count: 3 })).toThrow(/required/);
  });

  it("selects the plural form", () => {
    expect(tPlural("streak.days", 1)).toBe("1 day of learning");
    expect(tPlural("streak.days", 12)).toBe("12 days of learning");
  });
});

describe("number formatting", () => {
  it("formats a ratio as a percentage", () => {
    expect(formatPercent(0.75)).toBe("75%");
  });

  it("adds an explicit sign for changes", () => {
    expect(formatPercent(0.125, "en", { signed: true })).toBe("+12.5%");
    expect(formatPercent(-0.05, "en", { signed: true })).toBe("-5%");
  });

  it("formats points with a sign", () => {
    expect(formatPoints(1.2)).toBe("+1.2");
  });
});
