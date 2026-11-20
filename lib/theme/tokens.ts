import type { Mode } from "./bundles";

export interface ModeConstants {
  readonly ink: string;
  readonly inkMuted: string;
  readonly glassAlpha: number;
  readonly borderAlpha: number;
  readonly shadowAlpha: number;
  readonly highlightAlpha: number;
  readonly positive: string;
  readonly negative: string;
  readonly warning: string;
  readonly info: string;
}

// Fixed per mode. Bundles never override these.
export const MODE_CONSTANTS: Readonly<Record<Mode, ModeConstants>> = {
  light: {
    ink: "#0F172A",
    inkMuted: "#4B5563",
    glassAlpha: 0.62,
    borderAlpha: 0.22,
    shadowAlpha: 0.14,
    highlightAlpha: 0.9,
    positive: "#15803D",
    negative: "#B91C1C",
    warning: "#B45309",
    info: "#0369A1",
  },
  dark: {
    ink: "#F1F5F9",
    inkMuted: "#A7B3C6",
    glassAlpha: 0.1,
    borderAlpha: 0.16,
    shadowAlpha: 0.5,
    highlightAlpha: 0.12,
    positive: "#4ADE80",
    negative: "#F87171",
    warning: "#FBBF24",
    info: "#38BDF8",
  },
};

export const RADIUS = { card: "24px", control: "14px" } as const;

// Blur is smaller on mobile to keep frame time low on weaker GPUs.
export const GLASS_BLUR = { desktop: "22px", mobile: "12px" } as const;
