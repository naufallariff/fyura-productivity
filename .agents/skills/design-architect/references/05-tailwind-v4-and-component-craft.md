# Tailwind CSS v4+ Canonical Standards & Accessible Component Craft

## 1. Tailwind CSS v4+ Canonical Class Rules (Anti-Warning VS Code Hygiene)

Modern VS Code Tailwind IntelliSense (`tailwindCSS.lint.suggestCanonicalClasses`) flags legacy v3 utilities and redundant arbitrary values with yellow warnings. **Always write canonical Tailwind v4+ classes:**

| Category                     | Legacy v3 / Redundant Syntax (Avoid)                     | Canonical Tailwind v4+ Syntax (Required)                          | Technical Reason                                                                                                           |
| :--------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Shadows, Blur & Radius**   | `shadow-sm`, `rounded-sm`, `blur-sm`, `backdrop-blur-sm` | `shadow-xs`, `rounded-xs`, `blur-xs`, `backdrop-blur-xs`          | v4 shifted the old `sm` step down to `xs` so bare `shadow`, `rounded`, `blur` equal `-sm`.                                 |
| **Outline & Focus Ring**     | `outline-none`, `ring`                                   | `outline-hidden`, `ring-3`                                        | `ring` defaults to `1px` in v4 (`ring-3` restores `3px`); `outline-hidden` preserves Windows High-Contrast outlines.       |
| **Gradients**                | `bg-gradient-to-r`                                       | `bg-linear-to-r` _(also `bg-linear-45`, `bg-radial`, `bg-conic`)_ | Unified `bg-linear-*` syntax supports arbitrary angles plus native radial/conic gradients.                                 |
| **Flex & Text Overflow**     | `flex-shrink-0`, `flex-grow`, `overflow-ellipsis`        | `shrink-0`, `grow`, `text-ellipsis`                               | Short canonical names enforced by v4 linter.                                                                               |
| **Color Opacity & CSS Vars** | `bg-black bg-opacity-50`, `bg-[--brand]`                 | `bg-black/50`, `bg-(--brand)`                                     | `*-opacity-*` utilities are removed; CSS custom properties use parentheses `(--var)` instead of square brackets `[--var]`. |
| **Important Modifier**       | `!flex`, `!p-4`                                          | `flex!`, `p-4!`                                                   | The `!` modifier always goes at the **end** of the utility class in v4.                                                    |
| **Dynamic Spacing & Sizes**  | `w-[500px]`, `mt-[8px]`, `max-w-[65ch]`                  | `w-125`, `mt-2`, `max-w-prose`                                    | v4 calculates spacing dynamically (`125 * 0.25rem = 500px`), making arbitrary pixel brackets redundant.                    |
| **Text Wrap & Grid**         | `break-words`, `grid-cols-[repeat(3,minmax(0,1fr))]`     | `wrap-break-word` / `wrap-anywhere`, `grid-cols-3`                | Native v4 text-wrapping utilities and canonical grid tracks.                                                               |

---

## 2. CSS-First Tailwind v4 Configuration (`@import "tailwindcss"`)

- **No `tailwind.config.js` Needed for Standard Projects:** Configure design tokens directly in CSS using `@theme`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --color-brand: oklch(0.56 0.215 255);
  --color-surface: var(--bg-surface);
  --ease-snappy: cubic-bezier(0.23, 1, 0.32, 1);
}
```

- **CSS Modules / Vue / Svelte `<style>` Blocks:** Whenever using `@apply` or `@variant` inside isolated component stylesheets, include `@reference "../app/globals.css";` at the top of the block so v4 resolves theme variables without duplicating output CSS.
- **Container Queries Out of the Box:** Use `@container` on parent wrappers and `@sm:`, `@md:`, `@lg:` variants on child cards so components adapt to their container width rather than only viewport breakpoints.

---

## 3. Accessible Component Architecture & Engineering Hygiene

- **Headless Primitives First:** Build interactive overlays, dialogs, popovers, selects, and tabs on **Radix UI**, **Base UI**, or **React Aria** (via `shadcn/ui`) so focus traps, `Escape` dismissal, roving `tabindex`, and ARIA roles work automatically.
- **Semantic HTML & Interactive Affordances:**
  - Use `<button>` for actions and `<a>` / `<Link>` for navigation. Never attach `onClick` to a `<div>` without `role="button"`, `tabIndex={0}`, and keyboard handlers.
  - Pair every icon-only button with `aria-label` and `aria-hidden="true"` on the decorative `<svg>`.
  - Include explicit `cursor-pointer` on interactive controls/tabs/cards (and `disabled:cursor-not-allowed` on disabled buttons) plus visible keyboard focus indicators (`focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brand/50`).
- **Clean Component Variants:** Use `class-variance-authority` (`cva`) + `tailwind-merge` (`cn()`) for multi-variant design system components, keeping base layout classes separate from state/variant overrides.
- **Direct Source Editing (No Script-Patching):** When refactoring or fixing UI files, edit the component or CSS source directly. Never write throwaway `.py` or `.js` regex/string-replace scripts to patch markup or styles.
