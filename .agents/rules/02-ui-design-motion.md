---
trigger: glob
globs: "app/**/*.tsx, components/**/*.tsx, features/**/*.tsx, app/globals.css, lib/theme/**/*.ts"
---

# UI design and motion

Use the design-architect and ui-motion-craft skills and the visual requirements in @docs/SRS.md.

- Use three-layer OKLCH tokens. Derive semantic tokens from primitives and consume semantic or component roles in UI. Check all three palettes in both `data-mode` values. Aim for 60% tinted canvas, 30% stepped surfaces, and 10% accents.
- Limit backdrop blur to two visible glass surfaces per view. Use solid data cards and a reduced-transparency fallback. Align elements to a 4 px grid and use an 8 px layout rhythm.
- Follow canonical Tailwind v4 and existing semantic controls. Provide keyboard alternatives, visible focus, readable inputs, and 44 px primary touch targets. Use `tabular-nums` for metrics. Check contrast, long content, and 390 px layouts.
- Keep motion on composited transform and opacity. Use clip-path only when verified to stay composited. Avoid `transition-all` and animated layout, shadows, or blur. Honor reduced motion. Use shared easing for press feedback, and apply theme changes and keyboard palette activation immediately.
- Reuse the shared brand mark where the identity is needed. Use the shared TipTap editor and server `sanitizeHtml()` contract for rich text.
