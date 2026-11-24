# Color Science, Perceptual Scales, and Three-Layer Token Architecture

## 1. Perceptual Color Engineering (`OKLCH`) & Proportion Rules

### Why `oklch(L C H)` Over Hex/RGB/HSL

- **Perceptual Uniformity:** In `HSL`, yellow at `50%` lightness looks blindingly bright while blue at `50%` looks dark. In `oklch(Lightness Chroma Hue)`, equal `L` values produce genuinely equal perceived brightness across every hue, making accessible light/dark palettes deterministic.
- **Tinted Neutrals:** Pure `#000000` or `#FFFFFF` feels sterile. Infuse neutral grays with a tiny chroma (`C: 0.005-0.015`) aligned to the brand hue (cool slate for tech/fintech, warm stone for editorial/lifestyle).

### Palette Discipline & The `60 - 30 - 10` Visual Balance Rule

- **Active Palette Cap (Anti-Rainbow Discipline):** Restrict every interface to **2-3 core neutral/surface tones + 1 distinct primary accent** (plus reserved semantic status colors for `success`, `warning`, and `danger`). Never turn pages into multi-hue confetti unless visualizing multi-series data.
- **Ban Default AI Purple/Cyan Gradients:** Never default to generic purple-to-indigo or cyan-to-magenta AI hero gradients (`#8b5cf6` -> `#06b6d4`) unless explicitly specified by the user's brand identity.

| Share   | Layer                     | Purpose                                                                         | Example                                                                     |
| :------ | :------------------------ | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------- |
| **60%** | Dominant Canvas           | Background surfaces, page canvas, large whitespace                              | `oklch(0.985 0.004 250)` (Light) / `oklch(0.145 0.012 250)` (Dark)          |
| **30%** | Secondary Surfaces & Ink  | Elevated cards, sidebars, borders, primary/secondary text                       | `oklch(1 0 0)` cards + `oklch(0.21 0.015 250)` primary text                 |
| **10%** | Accent & Semantic Signals | Primary CTAs, active indicators, status badges (`success`, `warning`, `danger`) | Brand accent `oklch(0.58 0.21 255)` used sparingly so attention stays sharp |

---

## 2. Accessibility Contrast & Dark Mode Elevation

- **Strict Contrast Floors:**
  - Normal body text (`< 18px` regular or `< 14px` bold): **minimum `4.5:1`** WCAG AA (`7:1` AAA for long-form reading).
  - Large display headings (`>= 24px` regular or `>= 18.66px` bold), active UI borders, and icons: **minimum `3.0:1`**.
  - Never rely on color alone to convey status: always pair semantic hues with icons, text labels, or shape differences.
- **Dark Mode Surface Physics (Material 3 & Apple HIG Synthesis):**
  - Never invert light mode blindly. Use deep charcoal/slate (`L: 0.13-0.17`) instead of harsh `#000000` OLED black for general UI, and express elevation through **stepped surface lightness** (`base L: 0.14` -> `card L: 0.18` -> `popover L: 0.22`) plus subtle `1px` top/inner borders rather than heavy drop shadows.
  - Slightly reduce chroma (`-10%` to `-20%`) on saturated brand accents in dark mode so colors do not vibrate against dark backgrounds.

---

## 3. Three-Layer Design Token Architecture

Never hardcode raw color hex or `oklch()` literals inside components. Structure tokens into three cascading layers:

```text
Layer 1: Primitive Tokens   (--color-blue-500, --space-4, --radius-md)   -> Raw scale values
Layer 2: Semantic Tokens    (--bg-canvas, --text-primary, --accent-bg)   -> Purpose & theme modes
Layer 3: Component Tokens   (--btn-primary-bg, --card-border)            -> Per-component overrides
```

### Canonical CSS Token Blueprint (Light & Dark Modes)

```css
:root {
  /* 1. Primitive Palette */
  --neutral-50: oklch(0.985 0.004 250);
  --neutral-100: oklch(0.962 0.006 250);
  --neutral-200: oklch(0.915 0.008 250);
  --neutral-700: oklch(0.37 0.014 250);
  --neutral-900: oklch(0.205 0.015 250);
  --neutral-950: oklch(0.145 0.012 250);
  --brand-500: oklch(0.56 0.215 255);
  --brand-600: oklch(0.49 0.21 255);

  /* 2. Semantic Tokens (Light Default) */
  --bg-canvas: var(--neutral-50);
  --bg-surface: oklch(1 0 0);
  --bg-subtle: var(--neutral-100);
  --border-default: var(--neutral-200);
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-700);
  --accent-primary: var(--brand-600);
  --accent-primary-hover: var(--brand-500);

  /* 3. Component Tokens */
  --card-bg: var(--bg-surface);
  --card-border: var(--border-default);
  --btn-bg: var(--accent-primary);
}

.dark {
  --bg-canvas: var(--neutral-950);
  --bg-surface: oklch(0.185 0.013 250);
  --bg-subtle: oklch(0.225 0.014 250);
  --border-default: oklch(0.285 0.015 250);
  --text-primary: var(--neutral-50);
  --text-secondary: var(--neutral-100);
  --accent-primary: oklch(0.66 0.185 255);
  --accent-primary-hover: oklch(0.71 0.175 255);
}
```
