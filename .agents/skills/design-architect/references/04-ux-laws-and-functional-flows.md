# UX Laws, Industry Reasoning Matrix, Functional Flows, and RTL Hygiene

## 1. Foundational Cognitive & Interaction UX Laws

Every interface decision must optimize human perception, decision speed, and motor ergonomics:

| UX Law                | Core Principle                                                                | Concrete UI & Product Rule                                                                                                                                                                          |
| :-------------------- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fitts's Law**       | Time to acquire a target depends on distance and target size                  | Make primary touch/click targets **`>= 44x44px`** (`>= 36px` dense desktop) with **`>= 8px` gap** between adjacent interactive targets. Anchor primary actions near the user's current focal point. |
| **Hick's Law**        | Decision time increases logarithmically with the number of choices            | Cap top-level navigation to **`5-7` items**, group complex settings via **Progressive Disclosure**, and highlight one clear default/recommended action.                                             |
| **Miller's Law**      | Working memory holds `7 +/- 2` chunks of information                          | Chunk long forms into `3-5` logical steps, format long numbers/codes with spaces (`4242 .... 4242`), and group dense dashboards into scannable cards.                                               |
| **Jakob's Law**       | Users spend most of their time on other sites and expect familiar conventions | Place search top-right/top-center, primary navigation top or left, account/settings top-right, and follow standard keyboard shortcuts (`Esc` closes overlays, `Cmd/Ctrl+K` opens search).           |
| **Doherty Threshold** | Productivity soars when system response stays under **`400ms`**               | Provide immediate optimistic UI updates or instant skeleton/spinner feedback within `100ms` so the interface never feels frozen.                                                                    |
| **Postel's Law**      | Be liberal in what you accept, conservative in what you send                  | Accept flexible user input formats (phone spaces, hyphens, case-insensitive emails) and normalize cleanly on submit.                                                                                |

### Mobile-First & One-Handed Ergonomics (One UI / ColorOS Synthesis)

- **Thumb-Zone Reachability:** Place primary mobile navigation, floating action buttons, and bottom sheets in the lower-half comfort zone (`bottom-0` / `pb-safe`) rather than forcing top-corner stretches on tall screens.
- **Viewing vs. Interaction Separation:** Keep editorial titles and passive status indicators in the upper viewport while anchoring interactive filters, tabs, and primary actions within effortless thumb reach.
- **Zero-Trap Mobile Navigation:** Keep mobile headers uncluttered; collapse secondary links into an accessible slide-over or bottom sheet with full keyboard/escape support and never trap horizontal scroll (`overflow-x-hidden` on root + `min-w-0` on flex/grid children).

---

## 2. Product & Industry Reasoning Matrix

Calibrate visual style, palette temperature, typography, and anti-patterns to the product domain:

| Domain                         | Recommended Aesthetic                                     | Palette & Typography Direction                                                     | Anti-Patterns to Avoid                                                        |
| :----------------------------- | :-------------------------------------------------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Fintech & Personal Finance** | Crisp, high-trust, calm precision                         | Cool slate neutrals, deep navy/emerald trust accents, `tabular-nums` sans          | Neon crypto-casino gradients, low-contrast grey numbers, unlabelled estimates |
| **B2B SaaS & Developer Tools** | Modular Bento / Swiss precision, high information clarity | Neutral dark/light surfaces, single crisp brand accent, geometric sans + monospace | Gratuitous 3D bloat blocking workflows, animated command palettes (`Cmd+K`)   |
| **AI & Creative Workspace**    | Spatial, content-first, progressive canvas                | High-contrast monochrome ink with subtle iridescent/violet focus states            | Wall-of-controls upfront before the user types a single prompt                |
| **E-Commerce & Consumer**      | Editorial, tactile, conversion-focused                    | Warm off-white canvas, high-contrast sticky CTA, editorial serif + clean sans      | Hidden shipping costs, carousel auto-advance hijacking user scroll            |
| **Healthcare & Education**     | Calm, accessible, high legibility                         | Soft warm neutrals, `>= 7:1` AAA text contrast, humanist sans (`16-18px` base)     | Dense walls of jargon, tiny `11px` labels, color-only status alerts           |

---

## 3. Functional Completeness, State Resilience & Core Web Vitals

### Zero Dead Controls & Theme Integrity

- **Every Control Must Work:** Never ship dead links (`href="#"`), non-functional search inputs, decorative filter chips that do nothing, or orphaned hamburger menus. Wire real interactive state (`useState`, URL params, modal/drawer triggers) or remove the control.
- **Single-Source Theme Toggle:** Implement light/dark mode switching cleanly using one unified class/attribute strategy (`.dark` on `<html>` synced with `localStorage` and `prefers-color-scheme`) without flash-of-wrong-theme or conflicting CSS overrides.

### Design All 6 UI States

Never ship only the happy path. Explicitly design:

1. **Empty State:** Explain value + provide a single primary CTA to create the first item.
2. **Loading State:** Layout-matched skeleton placeholders (preserving exact dimensions so `CLS < 0.1`).
3. **Stale / Revalidating State:** Keep existing data visible with a subtle non-blocking refresh indicator.
4. **Error State:** Plain-language explanation + concrete recovery action (`"Retry"` button), preserving user form input.
5. **Partial / Tiny Data State:** Graceful handling for 1 item or `N < 5` without broken charts or misleading `-100%` deltas.
6. **Overflow / Worst-Case State:** Long unbroken strings (`min-w-0` + `wrap-anywhere`), `99+` badge caps, and RTL layout resilience.

### Accessible Forms & Media Performance (`Core Web Vitals`)

- **Accessible Form Architecture:** Always pair inputs with visible `<label>` elements (never placeholder-only labels), show inline validation errors immediately below the offending field (`aria-describedby`), and auto-focus the first invalid field on failed submission.
- **CLS & LCP Hygiene:** Always specify explicit `width` and `height` (or `aspect-ratio`) on `<img>`, `<video>`, and embeds so layout shift stays near zero; add `fetchpriority="high"` on above-the-fold hero media and `loading="lazy"` on below-the-fold assets.

---

## 4. Internationalization & RTL (`dir="rtl"`) Hygiene

When building multilingual or right-to-left interfaces (Arabic, Hebrew, Persian, Urdu):

- **Use CSS Logical Properties Exclusively:** Replace physical left/right utilities (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`) with logical equivalents (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`).
- **Directional Icon Auditing:** Mirror directional UI icons (back arrows, chevrons, sidebars, progress bars) using `rtl:rotate-180` or `rtl:-scale-x-100`, while keeping non-directional symbols (checkmarks, clocks, media play buttons, brand logos) unmirrored.
