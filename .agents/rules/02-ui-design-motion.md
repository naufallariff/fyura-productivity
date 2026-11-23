---
trigger: glob
globs: "app/**/*.tsx, components/**/*.tsx, features/**/*.tsx, app/globals.css"
---

# Visual Design, Tailwind v4 & Motion Craft Guardrails

- Follow `@.agents/skills/design-architect/SKILL.md` and `@.agents/skills/ui-motion-craft/SKILL.md`.
- **Anti-Slop & Glass Cap:** Limit `backdrop-filter: blur()` to at most 2 focal layers per view (navigation shell and active modal/popover). Use solid tinted elevation surfaces for cards so text contrast exceeds 4.5:1 (WCAG 2.2 AA).
- **Color & Tokens:** Use OKLCH semantic CSS variables from `app/globals.css` supporting both `[data-mode="light"]` and `[data-mode="dark"]`. Zero raw hex literals in `.tsx` files.
- **Tailwind CSS v4 Canonical Classes:** Use `bg-linear-to-r`, `shadow-xs`, `outline-hidden`, `ring-3`, `shrink-0` (never legacy v3 `bg-gradient-*`, `shadow-sm`, `outline-none`, `flex-shrink-0`).
- **60fps Motion:** Animate strictly `transform`, `opacity`, and `clip-path`. Never use `transition-all`. Use `--ease-out-snappy: cubic-bezier(0.23, 1, 0.32, 1)` (`140ms-220ms`), tactile press `active:scale-[0.97]`, and `0ms` duration on keyboard-triggered actions (`Cmd+K`).
- **Accessibility & Mobile:** Minimum `44x44px` touch targets, `tabular-nums` on all metrics/timers, `16px` base input font size on mobile (`>=390px`), and full support for `prefers-reduced-motion`.
