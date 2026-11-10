export type Mode = "light" | "dark";

/** Semantic tokens consumed by components. Components never read palette names. */
export type ThemeTokens = {
  mode: Mode;
  bg: string;
  surface: string;
  surfaceRaised: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  danger: string;
  glowA: string;
  glowB: string;
  chart: string[];
};
