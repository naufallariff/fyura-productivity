import type { Mode } from "./bundles";

interface ModeConstants {
  readonly page: string;
  readonly surface: string;
  readonly elevated: string;
  readonly ink: string;
  readonly inkMuted: string;
  readonly inkSubtle: string;
  readonly onAccent: string;
  readonly positive: string;
  readonly negative: string;
  readonly warning: string;
  readonly info: string;
  readonly shadowCard: string;
  readonly shadowRaised: string;
}

export const MODE_CONSTANTS: Readonly<Record<Mode, ModeConstants>> = {
  light: {
    page: "oklch(0.99 0.003 240)",
    surface: "oklch(1 0 0)",
    elevated: "oklch(0.995 0.002 240)",
    ink: "oklch(0.15 0.01 240)",
    inkMuted: "oklch(0.42 0.012 240)",
    inkSubtle: "oklch(0.51 0.01 240)",
    onAccent: "oklch(1 0 0)",
    positive: "oklch(0.52 0.15 155)",
    negative: "oklch(0.52 0.2 25)",
    warning: "oklch(0.51 0.11 75)",
    info: "oklch(0.52 0.13 240)",
    shadowCard: "0 1px 3px oklch(0 0 0 / 0.04), 0 4px 12px oklch(0 0 0 / 0.03)",
    shadowRaised: "0 8px 24px oklch(0 0 0 / 0.06)",
  },
  dark: {
    page: "oklch(0.155 0.009 240)",
    surface: "oklch(0.188 0.012 240)",
    elevated: "oklch(0.228 0.014 240)",
    ink: "oklch(0.92 0.005 240)",
    inkMuted: "oklch(0.68 0.01 240)",
    inkSubtle: "oklch(0.64 0.008 240)",
    onAccent: "oklch(0.12 0.005 240)",
    positive: "oklch(0.7 0.13 155)",
    negative: "oklch(0.7 0.18 25)",
    warning: "oklch(0.78 0.14 75)",
    info: "oklch(0.7 0.12 240)",
    shadowCard: "0 1px 3px oklch(0 0 0 / 0.2), 0 4px 12px oklch(0 0 0 / 0.15)",
    shadowRaised: "0 8px 24px oklch(0 0 0 / 0.25)",
  },
};
