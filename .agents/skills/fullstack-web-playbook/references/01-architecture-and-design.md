# Stage 1 & 2: System Architecture, UI/UX, Modern CSS, Visual Design, and Accessibility

## 1. Initial System Planning and Rendering Architecture

Select the rendering and application model based on data volatility, SEO needs, and interactivity density:

- **Static Site Generation (SSG) / Incremental Static Regeneration (ISR):**
  - Best for marketing pages, documentation, blogs, and product catalogs where content updates periodically.
  - Delivers sub-100ms Time to First Byte (TTFB) directly from CDN edge nodes with zero origin compute per request.
- **Streaming Server-Side Rendering (SSR):**
  - Best for personalized dashboards, e-commerce search, and dynamic feeds requiring fresh data and SEO indexing.
  - Flushes shell HTML immediately while resolving slower database queries out-of-order.
- **Single-Page Application (SPA) with Islands / Selective Hydration:**
  - Best for dense collaborative editors, canvases, and offline-first tools.
  - Pair with the View Transitions API for native-feeling route changes and keep initial JS payloads minimal.
- **Domain-Driven Repository Structure:**
  - Organize code by business domain (`src/features/auth`, `src/features/checkout`, `src/shared/ui`) rather than dumping hundreds of files into flat technical folders (`components/`, `hooks/`, `utils/`).

### Architecture Decision Checklist

1. **Set Hard Performance Budgets Upfront:** Target initial compressed JS under 100 KB, LCP under 2.5s on 4G mobile, INP under 200ms, and CLS under 0.1.
2. **Single Source of Truth for Contracts:** Share TypeScript types and runtime validation schemas (e.g., Zod) across frontend forms and backend API handlers.
3. **Explicit State Ownership:**
   - **URL State:** Search queries, filters, pagination cursors, active tabs, and modal routes (always shareable and Back-button friendly).
   - **Server Cache State:** Remote entities managed via stale-while-revalidate caching, request deduplication, and optimistic mutations.
   - **Ephemeral UI State:** Local hover, open popovers, and unsaved form drafts kept close to the owning component.

---

## 2. UI/UX Foundations and User Experience

- **Content-First Noise Reduction:** Strip decorative chrome, redundant borders, and competing callouts so primary actions and data hierarchy stand out immediately.
- **Form-Factor Adaptation:** Design fluidly across mobile touchscreens, tablets, wide desktops, and foldable viewports. Enforce `min-height: 44px; min-width: 44px` on all interactive touch targets.
- **Natural Platform Interactions:**
  - `Escape` key always closes active modals, menus, and popovers.
  - Browser Back button restores previous view or filter state cleanly.
  - Drag-and-drop interactions always provide accessible keyboard move alternatives.
  - Horizontal scroll containers display visual scrollability hints (`mask-image` edge fades or scroll indicators).
- **Progressive Disclosure:** Hide advanced settings behind `<details>`, drawers, or multi-step wizards so beginners see a clean default interface.

---

## 3. Modern CSS Patterns (Replacing Legacy JavaScript)

### Parent and Sibling State Styling (`:has()`)

Style parent containers or adjacent siblings based on child state without JavaScript event listeners:

```css
/* Highlight pricing tier card when its internal radio/checkbox is selected */
.pricing-card:has(input:checked) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-subtle);
}

/* Display field error text only after user interaction reveals :user-invalid */
.field-group:has(input:user-invalid) .error-message {
  display: block;
}
```

### Container Queries (`@container`)

Build truly portable components that adapt to their parent container width rather than the global viewport:

```css
.card-grid {
  container-type: inline-size;
  container-name: card-wrapper;
}

@container card-wrapper (min-width: 480px) {
  .product-card {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 1.5rem;
  }
}
```

### Animating to Intrinsic Sizes (`interpolate-size` and `@starting-style`)

Animate accordions, drawers, and top-layer popovers smoothly to `height: auto` without hardcoding `max-height`:

```css
:root {
  interpolate-size: allow-keywords;
}

.accordion-panel {
  height: 0;
  overflow: hidden;
  transition: height 250ms ease;
}

.accordion[open] .accordion-panel {
  height: auto;
}

/* Smooth entry animation for top-layer <dialog> and [popover] */
dialog[open] {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    display 200ms allow-discrete;
}

@starting-style {
  dialog[open] {
    opacity: 0;
    transform: translateY(12px);
  }
}
```

### Layout, Cascade, and Clipping Best Practices

- **Cascade Layers (`@layer`):** Declare `@layer reset, tokens, base, components, utilities;` at the top of your stylesheet to prevent specificity wars and eliminate `!important`.
- **Fluid Scaling:** Use `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` for responsive typography and spacing without abrupt breakpoint jumps.
- **Individual Transform Properties:** Write `translate`, `rotate`, and `scale` independently in CSS so hover/active states do not overwrite each other.
- **Non-Scrolling Visual Clipping:** Use `overflow: clip` with `overflow-clip-margin` instead of `overflow: hidden` when clipping decorative elements so `position: sticky` descendants continue working.

---

## 4. Visual Design, Color Systems, and Typography

- **Three-Tier Design Token Architecture:**
  1. **Primitive Tokens:** Raw palette values (`--blue-600: #2563eb`).
  2. **Semantic Tokens:** Intent-based aliases (`--surface-card`, `--text-primary`, `--border-subtle`).
  3. **Component Tokens:** Scoped component overrides (`--button-bg`, `--input-radius`).
- **Native Light and Dark Mode (`light-dark()`):**
  Declare `color-scheme: light dark;` on `:root` to automatically adapt native form controls, scrollbars, and semantic color tokens:

```css
:root {
  color-scheme: light dark;
  --surface-bg: light-dark(#ffffff, #0f172a);
  --text-main: light-dark(#0f172a, #f8fafc);
}
```

- **Browser UI Theming:** Include `<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">` and its dark counterpart so mobile browser bars blend seamlessly with the page.
- **Typographic Polish and Zero-CLS Font Loading:**
  - Apply `text-wrap: balance` on headings (under 4 lines) and `text-wrap: pretty` on body copy to prevent awkward single-word orphans.
  - Eliminate font-swap Cumulative Layout Shift (CLS) by matching fallback metrics with `size-adjust`, `ascent-override`, and `descent-override` inside `@font-face`.
  - Apply `font-variant-numeric: tabular-nums` on financial figures, countdown timers, and data tables so numeric columns align vertically.
- **Custom Scrollbars:** Style scrollbars cleanly with `scrollbar-width: thin` and `scrollbar-color`, ensuring sufficient contrast in high-contrast modes.

---

## 5. Accessibility Standards (WCAG 2.2 AA+)

- **Color Contrast and Forced Colors:** Maintain at least `4.5:1` contrast for normal text and `3:1` for large text and UI icons. Verify layout legibility under `@media (forced-colors: active)`.
- **Respect OS Text Scale:** Define font sizes in `rem` (never `px`) so users who scale browser/OS base font sizes (e.g., from 16px to 24px) experience proportional scaling without clipped containers.
- **Keyboard Focus Visibility:**
  - Never strip `outline: none` without providing a high-contrast `:focus-visible` ring (`outline: 2px solid var(--focus-ring); outline-offset: 2px`).
  - Keep DOM order aligned with visual layout; avoid positive `tabindex` values (`tabindex="1"`).
- **Accessible Error and Status Announcements:**
  - Associate error descriptions via `aria-describedby` and mark invalid fields with `aria-invalid="true"`.
  - Announce toast notifications and async status changes using `aria-live="polite"` (or `role="alert"` for critical errors) without stealing keyboard focus.
- **Accessible CSS Generated Content:** Provide empty alt text after a slash on decorative pseudo-elements (`content: url("icon.svg") / "";`) so screen readers do not announce raw filenames.
