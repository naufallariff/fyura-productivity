import { z } from "zod";
import {
  BUNDLE_IDS,
  DEFAULT_BUNDLE,
  DEFAULT_MODE,
  MODES,
  type BundleId,
  type Mode,
} from "./bundles";

export const ThemeSelectionSchema = z
  .object({
    bundle: z.enum(BUNDLE_IDS),
    mode: z.enum(MODES),
  })
  .strict();

export interface ThemeSelection {
  readonly bundle: BundleId;
  readonly mode: Mode;
}

export const DEFAULT_SELECTION: ThemeSelection = {
  bundle: DEFAULT_BUNDLE,
  mode: DEFAULT_MODE,
};

/** Accepts stored or submitted values. Anything invalid falls back to the default. */
export function parseSelection(input: unknown): ThemeSelection {
  const parsed = ThemeSelectionSchema.safeParse(input);
  return parsed.success ? parsed.data : DEFAULT_SELECTION;
}
