# Fyura Productivity — Master Refactor Plan (v2 UI & Security Architecture)

| Attribute       | Value                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Document        | Atomic Execution Blueprint for Phase 3.5                                       |
| Version         | 1.0                                                                            |
| Date            | 24 November 2026                                                               |
| Status          | Ready for execution                                                            |
| Branch          | `refactor/v2-ui-architecture` (branched from `main` @ `1ab2bef`)               |
| Execution Model | Sequential batches with verification gates; no batch starts until prior passes |

---

## Table of Contents

1. [Executive Summary & Triage Matrix](#1-executive-summary--triage-matrix)
2. [v2 Visual & Motion Architecture Specification](#2-v2-visual--motion-architecture-specification)
3. [Atomic Execution Roadmap](#3-atomic-execution-roadmap)
   - [Batch 1: Security Hardening & Design Token Foundation](#batch-1-security-hardening--design-token-foundation)
   - [Batch 2: App Shell, Command Palette & Theme Infrastructure](#batch-2-app-shell-command-palette--theme-infrastructure)
   - [Batch 3: Dashboard Bento Command Center](#batch-3-dashboard-bento-command-center)
   - [Batch 4: Daily Tracker — Google Calendar Grid](#batch-4-daily-tracker--google-calendar-grid)
   - [Batch 5: Projects Kanban & Secondary Module Polish](#batch-5-projects-kanban--secondary-module-polish)
   - [Batch 6: Journal Rich-Text Editor & Private Space Encryption](#batch-6-journal-rich-text-editor--private-space-encryption)
4. [Cross-Cutting Constraints & Quality Gates](#4-cross-cutting-constraints--quality-gates)

---

## 1. Executive Summary & Triage Matrix

### 1.1 Goal

Transform the v1 Fyura Productivity interface from its current sRGB hex glass-heavy design into a production-grade v2 UI featuring perceptual OKLCH dual-theme tokens, anti-AI-slop 60-30-10 color discipline, Apple HIG + Notion spatial craft, and hardened security (AES-256-GCM column encryption, CSP nonces, DOMPurify XSS sanitization).

### 1.2 Non-Goals

- Multi-user features, mobile native apps, payment integration.
- Rewriting business logic in `domain/`, `server/services/`, or `server/db/repositories/`.
- Database schema changes beyond the `private_records` encrypted table.
- End-to-end test setup (tracked separately as U8).

### 1.3 Prioritized Triage Matrix

All findings from `docs/AUDIT-FINDINGS.md` are triaged into the execution order below. **Critical security items are resolved first** in Batch 1 before any visual work begins.

| Priority | ID           | Category      | Finding                                                      | Batch | Severity |
| :------: | :----------- | :------------ | :----------------------------------------------------------- | :---: | :------: |
|  **P0**  | SEC-01 (U11) | Security      | No CSP headers, nonces, `X-Frame-Options`, `Referrer-Policy` | **1** |   High   |
|  **P0**  | SEC-02 (U9)  | Security      | `column-cipher.ts` is an empty stub — no AES-256-GCM         | **1** |   High   |
|  **P0**  | SEC-04       | Security      | No encrypted `private_records` table or cipher pipeline      | **6** |   High   |
|  **P1**  | DS-01        | Design System | All tokens in sRGB hex — zero OKLCH perceptual tokens        | **1** |   High   |
|  **P1**  | DS-02        | Design System | No 60-30-10 stepped elevation tokens                         | **1** |   High   |
|  **P1**  | DS-03        | Performance   | Exceeds 2-layer glass blur budget; `.blobs` animation        | **1** |   High   |
|  **P2**  | Shell-01     | UI/UX         | `Cmd+K` Command Palette completely missing                   | **2** |   High   |
|  **P2**  | Shell-02     | Ergonomics    | No instant theme toggle in shell                             | **2** |  Medium  |
|  **P2**  | Shell-03     | Performance   | Sidebar width animation triggers layout reflow               | **2** |  Medium  |
|  **P3**  | Dash-01      | Layout        | Bento 4 KPI tonal card row missing                           | **3** |   High   |
|  **P3**  | Dash-02      | Functional    | 8:4 workspace split incomplete                               | **3** |   High   |
|  **P3**  | Dash-03      | Anti-Slop     | 7+ glass blur layers stacking on dashboard                   | **3** |  Medium  |
|  **P4**  | DT-01        | Mobile        | Mini Month Calendar `hidden lg:block` on mobile              | **4** |   High   |
|  **P4**  | DT-02        | Touch         | Resize handle 8px — undersized for touch                     | **4** |   High   |
|  **P4**  | DT-03        | Functional    | Day Status selector missing from control rail                | **4** |  Medium  |
|  **P5**  | PRJ-01       | UI/UX         | Floating Bottom Board Dock missing                           | **5** |   High   |
|  **P5**  | PRJ-02       | Ergonomics    | Inline card input single-line; needs `textarea`              | **5** |  Medium  |
|  **P5**  | PRJ-03       | Touch         | Card drag handle 32px — below 44px floor                     | **5** |  Medium  |
|  **P6**  | JRN-01       | Architecture  | Raw plaintext `<textarea>` — no rich-text editor             | **6** |   High   |
|  **P6**  | JRN-02       | XSS Security  | No server-side HTML sanitization (DOMPurify)                 | **6** |   High   |
|  **P6**  | JRN-03       | Typography    | Journal text unconstrained > 120ch on wide screens           | **6** |  Medium  |
|  **—**   | SEC-03 (U10) | Security      | Cron auth timing-safe ✓; route stubs = 501                   | **1** |  Medium  |
|  **—**   | SEC-05       | Security      | Rate limiting ad-hoc per feature                             | **1** |   Low    |
|  **—**   | DS-04        | Design System | Categorical accent tokens not mapped                         | **1** |  Medium  |
|  **—**   | DS-05        | Design System | Non-standard radius hierarchy                                | **1** |   Low    |
|  **—**   | DS-06        | Config        | Missing `partialPrefetching` setting                         | **1** |   Low    |

---

## 2. v2 Visual & Motion Architecture Specification

### 2.1 OKLCH 60-30-10 Dual-Theme Token Map

All color values are specified in perceptual OKLCH (`oklch(L C H)`) in `app/globals.css`. Components read **only** semantic tokens — zero raw hex/RGB literals permitted in `.tsx` files.

#### Layer 1: Primitive Palette (Ocean Bundle — Default)

```css
/* app/globals.css — Primitive Layer */
:root {
  /* Ocean Primitives */
  --ocean-50: oklch(0.97 0.012 240);
  --ocean-100: oklch(0.93 0.025 240);
  --ocean-200: oklch(0.86 0.045 240);
  --ocean-300: oklch(0.76 0.075 240);
  --ocean-400: oklch(0.65 0.11 240);
  --ocean-500: oklch(0.56 0.14 240);
  --ocean-600: oklch(0.48 0.13 240);
  --ocean-700: oklch(0.4 0.11 240);
  --ocean-800: oklch(0.33 0.085 240);
  --ocean-900: oklch(0.26 0.065 240);

  /* Sage Primitives (H ≈ 155) */
  --sage-500: oklch(0.56 0.1 155);
  /* Dusk Primitives (H ≈ 290) */
  --dusk-500: oklch(0.56 0.12 290);

  /* Neutral Primitives (tinted, NOT pure gray) */
  --neutral-50: oklch(0.985 0.005 240); /* warm-tinted off-white */
  --neutral-100: oklch(0.96 0.008 240);
  --neutral-200: oklch(0.92 0.01 240);
  --neutral-300: oklch(0.87 0.012 240);
  --neutral-400: oklch(0.7 0.015 240);
  --neutral-500: oklch(0.55 0.015 240);
  --neutral-600: oklch(0.45 0.015 240);
  --neutral-700: oklch(0.35 0.012 240);
  --neutral-800: oklch(0.25 0.01 240);
  --neutral-900: oklch(0.18 0.008 240);
  --neutral-950: oklch(0.145 0.008 240); /* dark canvas */
}
```

#### Layer 2: Semantic Tokens (60-30-10 Discipline)

```css
/* app/globals.css — Semantic Layer: Light Mode */
[data-mode="light"] {
  /* 60% — Tinted Neutral Canvas */
  --bg-canvas: var(--neutral-50); /* L: 0.985 */
  --bg-page: oklch(0.99 0.003 240); /* ultra-light page bg */

  /* 30% — Stepped Elevation Surfaces */
  --bg-surface: oklch(1 0 0); /* crisp white cards */
  --bg-surface-elevated: oklch(0.995 0.002 240);
  --border-subtle: oklch(0.9 0.01 240 / 0.6);
  --border-default: oklch(0.85 0.012 240 / 0.8);
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.04), 0 4px 12px oklch(0 0 0 / 0.03);
  --shadow-raised: 0 8px 24px oklch(0 0 0 / 0.06);

  /* 10% — Accent & Ink */
  --color-accent: var(--ocean-500);
  --color-accent-hover: var(--ocean-600);
  --color-accent-soft: oklch(0.95 0.025 240 / 0.5);
  --color-ink: oklch(0.15 0.01 240); /* ≥ 4.5:1 on white */
  --color-ink-muted: oklch(0.42 0.012 240); /* ≥ 4.5:1 on white */
  --color-ink-subtle: oklch(0.55 0.01 240);
  --color-on-accent: oklch(1 0 0); /* white text on accent */

  /* Status Colors (fixed across bundles) */
  --color-negative: oklch(0.55 0.2 25);
  --color-warning: oklch(0.7 0.16 75);
  --color-positive: oklch(0.55 0.15 155);
  --color-info: oklch(0.55 0.14 240);

  /* Glass (2-layer budget ONLY) */
  --glass-bg: oklch(1 0 0 / 0.72);
  --glass-blur: blur(16px);
  --glass-border: oklch(0.9 0.008 240 / 0.5);
}

/* app/globals.css — Semantic Layer: Dark Mode */
[data-mode="dark"] {
  /* 60% — Deep Slate-Navy Canvas */
  --bg-canvas: var(--neutral-950); /* L: 0.145 */
  --bg-page: oklch(0.155 0.009 240);

  /* 30% — Stepped Dark Surfaces */
  --bg-surface: oklch(0.188 0.012 240);
  --bg-surface-elevated: oklch(0.228 0.014 240);
  --border-subtle: oklch(0.3 0.012 240 / 0.5);
  --border-default: oklch(0.35 0.014 240 / 0.6);
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.2), 0 4px 12px oklch(0 0 0 / 0.15);
  --shadow-raised: 0 8px 24px oklch(0 0 0 / 0.25);

  /* 10% — Accent & Ink */
  --color-accent: oklch(0.7 0.12 240);
  --color-accent-hover: oklch(0.75 0.14 240);
  --color-accent-soft: oklch(0.25 0.04 240 / 0.4);
  --color-ink: oklch(0.92 0.005 240); /* ≥ 4.5:1 on L:0.188 */
  --color-ink-muted: oklch(0.68 0.01 240);
  --color-ink-subtle: oklch(0.52 0.008 240);
  --color-on-accent: oklch(0.12 0.005 240);

  /* Status Colors */
  --color-negative: oklch(0.7 0.18 25);
  --color-warning: oklch(0.78 0.14 75);
  --color-positive: oklch(0.7 0.13 155);
  --color-info: oklch(0.7 0.12 240);

  /* Glass (2-layer budget ONLY) */
  --glass-bg: oklch(0.16 0.01 240 / 0.72);
  --glass-blur: blur(16px);
  --glass-border: oklch(0.3 0.01 240 / 0.4);
}
```

#### Layer 2b: Categorical Hue Tokens (Both Modes)

```css
/* Category color tokens — calibrated per mode for WCAG AA */
[data-mode="light"] {
  --cat-worship-soft: oklch(0.93 0.04 180);
  --cat-worship: oklch(0.42 0.1 180);
  --cat-learning-soft: oklch(0.93 0.04 260);
  --cat-learning: oklch(0.42 0.12 260);
  --cat-work-soft: oklch(0.94 0.05 65);
  --cat-work: oklch(0.52 0.14 65);
  --cat-career-soft: oklch(0.93 0.04 350);
  --cat-career: oklch(0.5 0.14 350);
  --cat-fitness-soft: oklch(0.93 0.04 155);
  --cat-fitness: oklch(0.42 0.1 155);
  --cat-rest-soft: oklch(0.94 0.03 210);
  --cat-rest: oklch(0.45 0.1 210);
  --cat-social-soft: oklch(0.94 0.05 80);
  --cat-social: oklch(0.52 0.14 80);
  --cat-leisure-soft: oklch(0.93 0.04 290);
  --cat-leisure: oklch(0.45 0.12 290);
}

[data-mode="dark"] {
  --cat-worship-soft: oklch(0.22 0.03 180);
  --cat-worship: oklch(0.72 0.1 180);
  --cat-learning-soft: oklch(0.22 0.03 260);
  --cat-learning: oklch(0.72 0.12 260);
  --cat-work-soft: oklch(0.24 0.04 65);
  --cat-work: oklch(0.78 0.14 65);
  --cat-career-soft: oklch(0.22 0.03 350);
  --cat-career: oklch(0.75 0.14 350);
  --cat-fitness-soft: oklch(0.22 0.03 155);
  --cat-fitness: oklch(0.72 0.1 155);
  --cat-rest-soft: oklch(0.22 0.03 210);
  --cat-rest: oklch(0.72 0.1 210);
  --cat-social-soft: oklch(0.24 0.04 80);
  --cat-social: oklch(0.78 0.14 80);
  --cat-leisure-soft: oklch(0.22 0.03 290);
  --cat-leisure: oklch(0.72 0.12 290);
}
```

#### Layer 3: Component Tokens (Scoped per module)

```css
/* Example: Dashboard KPI cards */
[data-mode="light"] {
  --kpi-consistency-bg: oklch(0.94 0.035 260); /* Indigo tint */
  --kpi-consistency-fg: oklch(0.4 0.14 260);
  --kpi-trend-bg: oklch(0.94 0.035 155); /* Emerald tint */
  --kpi-trend-fg: oklch(0.4 0.12 155);
  --kpi-focus-bg: oklch(0.95 0.045 75); /* Amber tint */
  --kpi-focus-fg: oklch(0.5 0.16 75);
  --kpi-streak-bg: oklch(0.94 0.035 290); /* Violet tint */
  --kpi-streak-fg: oklch(0.42 0.14 290);
}
```

### 2.2 Glassmorphism 2-Layer Ceiling

**Hard rule**: `backdrop-filter: blur(16px)` is applied to **at most 2 surfaces** per viewport:

| Permitted Surface                           | Usage                   |
| :------------------------------------------ | :---------------------- |
| **Collapsible Sidebar / Mobile Bottom Nav** | Navigation shell chrome |
| **Floating Dock / Active Modal / Popover**  | Contextual overlays     |

**Everything else** (dashboard cards, Kanban columns, card items, timeline panels, checklist cards, learning panels) uses **solid stepped surfaces**:

```
bg-(--bg-surface) border border-(--border-subtle) shadow-(--shadow-card)
```

The `.glass` utility class is redefined to apply only to permitted surfaces. The `.blobs` animated background element is **retired entirely** (3× 46vw blur(64px) infinite transform — catastrophic GPU overhead).

### 2.3 Spatial Rhythm: 4pt / 8pt Grid

| Token       | Value | Tailwind       | Use                   |
| :---------- | :---- | :------------- | :-------------------- |
| `--space-1` | 4px   | `gap-1`, `p-1` | Dense inner spacing   |
| `--space-2` | 8px   | `gap-2`, `p-2` | Standard inner gaps   |
| `--space-3` | 12px  | `gap-3`, `p-3` | Compact padding       |
| `--space-4` | 16px  | `gap-4`, `p-4` | Standard card padding |
| `--space-6` | 24px  | `gap-6`, `p-6` | Section spacing       |
| `--space-8` | 32px  | `gap-8`, `p-8` | Major section gaps    |

**Banned increments**: `gap-5` (20px), `gap-7` (28px), `gap-9` (36px) — violate 4pt/8pt rhythm. Use only `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`, `gap-10`, `gap-12`.

### 2.4 Radius Hierarchy

| Level               | Value   | Tailwind       | Use                           |
| :------------------ | :------ | :------------- | :---------------------------- |
| Outer Panel/Card    | 16–20px | `rounded-2xl`  | Bento panels, page containers |
| Inner Card/Item     | 12px    | `rounded-xl`   | Kanban cards, inner tiles     |
| Button/Input        | 10px    | `rounded-lg`   | Interactive controls          |
| Status Pill         | 9999px  | `rounded-full` | Chips, docks, pills           |
| Sheet (top corners) | 28px    | Custom         | Mobile bottom sheets          |

### 2.5 GPU-Only Motion Architecture

```css
/* app/globals.css — Motion Tokens */
:root {
  --ease-out-snappy: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-smooth: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  --duration-instant: 0ms; /* Cmd+K, keyboard shortcuts */
  --duration-press: 120ms; /* :active scale feedback */
  --duration-micro: 160ms; /* Tooltip, popover enter */
  --duration-standard: 200ms; /* Popovers, dock transitions */
  --duration-modal: 280ms; /* Dialogs, drawers */
}

/* GPU-only: NEVER animate width, height, padding, margin, left, top */
/* ONLY: transform, opacity, clip-path */

/* Universal press feedback */
.press-feedback {
  transition: transform var(--duration-press) var(--ease-out-snappy);
}
.press-feedback:active {
  transform: scale(0.97);
}

/* Reduced motion: keep opacity, remove transforms */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Reduced transparency: solid chrome surfaces */
@media (prefers-reduced-transparency: reduce) {
  .glass-permitted {
    backdrop-filter: none;
    background: var(--bg-surface);
  }
}
```

| Interaction                | Duration        | Property                 | Easing              |
| :------------------------- | :-------------- | :----------------------- | :------------------ |
| `Cmd+K` palette open/close | `0ms`           | `opacity`                | Instant             |
| Button press               | `120ms`         | `transform: scale(0.97)` | `--ease-out-snappy` |
| Popover enter/exit         | `160–200ms`     | `transform`, `opacity`   | `--ease-out-snappy` |
| Card/list reorder          | Spring physics  | `transform`              | `@dnd-kit` spring   |
| Modal open                 | `280ms`         | `transform`, `opacity`   | `--ease-drawer`     |
| Session ring countdown     | `1s`            | `stroke-dashoffset`      | `linear`            |
| Stagger entrance           | `30–60ms` delay | `transform`, `opacity`   | `--ease-out-snappy` |

### 2.6 Anti-AI-Slop Copywriting Rules

1. **Tone**: Calm, direct, honest — matching Apple HIG clarity and Notion quiet utility.
2. **Action Labels**: Concise `Verb + Object` — `Create block`, `Add card`, `Lock private space`, `Start focus`.
3. **Hard Bans**:
   - Zero em-dashes (`—`) in UI headings, labels, tooltips, or helper text.
   - Zero marketing clichés: `Seamless`, `Unlock`, `Supercharge`, `AI-powered`, `Revolutionary`, `Elevate`, `Effortless`.
   - Zero judgmental streak/miss language. Always explain numbers with a neutral 1-sentence baseline.
   - Zero emoji or decorative symbols in interface text.
4. **Data Honesty**: Every metric KPI card shows `compared to what?` baseline. Missing values show `–` (en-dash), not `0`.

---

## 3. Atomic Execution Roadmap

### Batch 1: Security Hardening & Design Token Foundation

**Scope**: Resolve all P0 security issues (U9, U10, U11) and establish the OKLCH design token system that every subsequent batch builds upon.

#### Target Files

| Action   | Path                             |
| :------- | :------------------------------- |
| `modify` | `server/crypto/column-cipher.ts` |
| `modify` | `server/cron/auth.ts`            |
| `modify` | `proxy.ts`                       |
| `modify` | `next.config.ts`                 |
| `modify` | `app/globals.css`                |
| `modify` | `lib/theme/bundles.ts`           |
| `modify` | `lib/theme/color.ts`             |
| `modify` | `lib/theme/tokens.ts`            |
| `create` | `lib/theme/derive.ts`            |
| `create` | `lib/theme/validate.ts`          |
| `modify` | `lib/theme/hues.ts`              |
| `modify` | `lib/theme/css.ts`               |
| `create` | `tests/theme/contrast.test.ts`   |

#### Dependencies

No new npm packages required for this batch. All crypto uses built-in `node:crypto`.

#### Architectural Constraints

1. **CSP Nonces**: Generate per-request via `crypto.randomUUID()` in `proxy.ts`. Pass nonce to Next.js via request header; apply to `<script>` and `<style>` tags.
2. **AES-256-GCM**: `ENCRYPTION_KEY` = 64-hex string (32 bytes). 12-byte random IV per encrypt. 16-byte auth tag appended. `ENCRYPTION_KEY_VERSION` integer for key rotation.
3. **OKLCH Migration**: Replace every sRGB hex token in `bundles.ts` and `globals.css` with OKLCH equivalents. The 3-layer token architecture (Primitive → Semantic → Component) must be fully wired.
4. **Glass Purge**: Redefine `.glass` to a narrow utility. Remove `.blobs`. All cards switch to `--bg-surface` + `--border-subtle` + `--shadow-card`.
5. **Radius & Spacing**: Normalize all radius values and purge `gap-5` / non-4pt-rhythm values.
6. **Contrast Validation**: `tests/theme/contrast.test.ts` must programmatically verify WCAG AA (≥ 4.5:1 for text, ≥ 3:1 for large text/icons) for every semantic ink token against its surface in both modes × all 3 bundles.
7. **`partialPrefetching`**: Set to `true` in `next.config.ts` to clear the build warning.
8. **Non-empty `CRON_SECRET`**: Add startup validation in `server/cron/auth.ts`.

#### Edge Cases

- CSP nonce must pass through to Sentry error boundary scripts.
- `column-cipher.ts` must handle the case where `ENCRYPTION_KEY` is not set (dev mode without private features) gracefully — throw `DomainError('INTERNAL')` with clear message.
- Glass blur on sidebar must respect `prefers-reduced-transparency`.

#### Acceptance Criteria

- [ ] `proxy.ts` injects `Content-Security-Policy` with per-request nonce, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] `column-cipher.ts` exports `encryptColumn()` and `decryptColumn()` using AES-256-GCM with key versioning.
- [ ] All tokens in `globals.css` are OKLCH; zero hex/RGB literals remain.
- [ ] `.blobs` element and animation removed entirely.
- [ ] `.glass` utility only applies `backdrop-filter` on explicitly permitted surfaces.
- [ ] `tests/theme/contrast.test.ts` passes for all 3 bundles × 2 modes (6 combinations).
- [ ] No `gap-5`, `gap-7`, or `gap-9` exists anywhere in the codebase.
- [ ] `next.config.ts` includes `partialPrefetching: true`.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 1

> **Prompt for Batch 1 Execution:**
>
> You are executing Batch 1 of the Fyura Productivity v2 refactor on branch `refactor/v2-ui-architecture`.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Section 1 (Triage Matrix), Section 2 (Visual & Motion Architecture), and the Batch 1 specification. Also read `AGENTS.md`, `docs/PRD-SRS.md` §4 (Design System) and §7 (Security), and `docs/AUDIT-FINDINGS.md` §2 (Security) and §3 (Design System).
>
> **Task**: Implement the following in this exact order:
>
> 1. **Security Headers (U11)**: In `proxy.ts`, generate a per-request CSP nonce using `crypto.randomUUID()`, inject it into a strict `Content-Security-Policy` header (allowing only nonced scripts/styles and the Google OAuth origin), and add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. In `next.config.ts`, set `partialPrefetching: true`.
>
> 2. **Column Cipher (U9)**: In `server/crypto/column-cipher.ts`, implement `encryptColumn(plaintext: string): string` and `decryptColumn(ciphertext: string): string` using `node:crypto` AES-256-GCM. Consume `env.ENCRYPTION_KEY` (64-hex / 32-byte) and `env.ENCRYPTION_KEY_VERSION`. Use 12-byte random IV, 16-byte auth tag. Output format: `v{version}:{base64(iv + ciphertext + tag)}`. Throw `DomainError('INTERNAL')` if key is not set.
>
> 3. **Cron Auth (U10)**: In `server/cron/auth.ts`, ensure `CRON_SECRET` is validated as non-empty at module load. Maintain `crypto.timingSafeEqual`.
>
> 4. **OKLCH Token Migration**: Replace ALL sRGB hex tokens in `app/globals.css`, `lib/theme/bundles.ts`, `lib/theme/color.ts`, `lib/theme/tokens.ts`, `lib/theme/hues.ts`, and `lib/theme/css.ts` with the exact OKLCH token system specified in `docs/MASTER-REFACTOR-PLAN.md` §2.1 (3-layer: Primitive → Semantic → Component). Implement dual-theme via `[data-mode="light"]` and `[data-mode="dark"]` selectors.
>
> 5. **Glass Purge**: Remove the `.blobs` element and its `@keyframes` animation entirely from `globals.css`. Redefine `.glass` as a narrow utility that only works on elements with `data-glass-permitted`. Replace ALL card/panel `.glass` usages across the codebase with `bg-(--bg-surface) border border-(--border-subtle)` and `shadow-(--shadow-card)`.
>
> 6. **Spatial Normalization**: Find and fix all `gap-5`, `gap-7`, `gap-9` and non-4pt/8pt rhythm violations. Update radius tokens per the hierarchy in §2.4.
>
> 7. **Create `lib/theme/derive.ts`**: Export utility to compute hover, border, and soft category wash values from OKLCH primitives.
>
> 8. **Create `lib/theme/validate.ts`**: Export `validateContrast(fg: string, bg: string): { ratio: number; passes: boolean }` using OKLCH-to-sRGB conversion and WCAG luminance formula.
>
> 9. **Create `tests/theme/contrast.test.ts`**: Test all semantic ink/surface pairs across 3 bundles × 2 modes = 6 combinations. Assert ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass with zero errors.

---

### Batch 2: App Shell, Command Palette & Theme Infrastructure

**Scope**: Build the Notion-style collapsible shell, `0ms` Command Palette, instant theme toggle, and fix sidebar layout reflow.

#### Target Files

| Action   | Path                                                                      |
| :------- | :------------------------------------------------------------------------ |
| `create` | `components/shell/command-palette.tsx`                                    |
| `modify` | `components/shell/sidebar.tsx`                                            |
| `modify` | `components/shell/sidebar-profile.tsx`                                    |
| `modify` | `components/shell/mobile-nav.tsx`                                         |
| `modify` | `app/(app)/layout.tsx`                                                    |
| `create` | `components/ui/tooltip.tsx`                                               |
| `modify` | `lib/i18n/messages/en.json` (add palette keys — read only relevant range) |
| `modify` | `lib/i18n/messages/id.json` (add palette keys — read only relevant range) |

#### Dependencies

```bash
pnpm add cmdk
```

**React 19 Compatibility**: ✅ Verified via context7. `cmdk` peer dependencies: `react ^18 || ^19 || ^19.0.0-rc`. Uses `@radix-ui/react-dialog`, `useId`, and `useSyncExternalStore` — all React 19 stable APIs. `'use client'` directive is present in source. Fully compatible with Next.js 16 App Router.

#### Architectural Constraints

1. **Command Palette**: Use `cmdk` library. Mount in `app/(app)/layout.tsx`. Open on `Cmd+K` / `Ctrl+K` with **0ms** animation (no enter/exit transition). Support: fuzzy navigation to all 8+ views, quick actions (Create Block, Add Card, Lock Space), theme toggle.
2. **Sidebar Reflow Fix**: Replace `transition-[width] duration-300` with GPU-composited approach: use CSS `transform: translateX()` for collapse, or `contain: inline-size` with CSS variable `--sidebar-w`.
3. **Instant Theme Toggle**: Add a toggle switch in `SidebarProfile` popover. On click: immediately set `document.documentElement.setAttribute('data-mode', newMode)` and write cookie; fire background server action for persistence. Zero page reload.
4. **Shell Glass**: Sidebar and mobile nav retain `backdrop-filter: blur(16px)` (they are within the 2-layer budget) but switch from `blur(22px) saturate(140%)` to calibrated `blur(16px)` with solid-tinted fallback for `prefers-reduced-transparency`.
5. **Tooltip Component**: Create `components/ui/tooltip.tsx` for collapsed sidebar nav items — accessible, instant floating tooltip with keyboard shortcut display. Skip delay on subsequent hovers (`data-instant` pattern).
6. **Mobile Nav**: Replace arbitrary bracket CSS `[background:var(--glass-bg)]` with canonical Tailwind v4 classes: `bg-(--glass-bg)`.

#### Acceptance Criteria

- [ ] `Cmd+K` / `Ctrl+K` opens Command Palette with 0ms (instant, no animation).
- [ ] Palette supports fuzzy search across all 8+ navigation targets.
- [ ] Theme toggle in sidebar profile popover applies mode instantly without reload.
- [ ] Sidebar collapse/expand does NOT trigger layout reflow (no `transition-[width]`).
- [ ] Collapsed sidebar nav items show accessible tooltip with view name.
- [ ] Mobile nav uses canonical Tailwind v4 syntax (no bracket CSS).
- [ ] `prefers-reduced-transparency` replaces glass with solid surface.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 2

> **Prompt for Batch 2 Execution:**
>
> You are executing Batch 2 of the Fyura Productivity v2 refactor. Batch 1 is complete and verified.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Batch 2 specification, `docs/AUDIT-FINDINGS.md` §4 (Shell), and `docs/DESIGN-BRIEF.md` §2.D (Notion-Style Shell).
>
> **Prerequisites**: Ensure `cmdk` is installed: `pnpm add cmdk`.
>
> **Task**: Implement in this order:
>
> 1. **Command Palette** (`components/shell/command-palette.tsx`): Build using `cmdk`. Mount in `app/(app)/layout.tsx`. Trigger: `Cmd+K` / `Ctrl+K`. Animation: **0ms instant** (no transitions). Groups: Navigation (all 8+ views with icons), Quick Actions (Create Block, Add Card, Lock Space, Start Focus), Theme (Toggle Light/Dark). Fuzzy search filtering. Keyboard navigation: `↑↓` to select, `Enter` to execute, `Escape` to close.
>
> 2. **Sidebar Reflow Fix** (`components/shell/sidebar.tsx`): Remove `transition-[width] duration-300`. Replace with GPU-composited collapse: use `transform: translateX(-100%)` to slide off-canvas when collapsed, showing only an icon rail (`w-16`), and `transform: translateX(0)` when expanded. Apply `will-change: transform` and `transition: transform 200ms var(--ease-out-snappy)`.
>
> 3. **Instant Theme Toggle** (`components/shell/sidebar-profile.tsx`): Add a light/dark toggle switch. On change: `document.documentElement.setAttribute('data-mode', mode)`, set cookie `theme-mode` with `SameSite=Lax`, and fire a non-blocking server action to persist to `user_settings`.
>
> 4. **Tooltip** (`components/ui/tooltip.tsx`): Accessible floating tooltip for collapsed sidebar nav labels. 125ms delay on first hover, instant on subsequent hovers (`data-instant`), `transform-origin: var(--transform-origin)`, scale from 0.97 + opacity.
>
> 5. **Shell Glass Calibration**: Change sidebar and mobile nav from `blur(22px) saturate(140%)` to `blur(16px)`. Add `@media (prefers-reduced-transparency: reduce)` fallback to solid `--bg-surface`.
>
> 6. **Mobile Nav Syntax**: Replace `[background:var(--glass-bg)]` and similar bracket CSS with `bg-(--glass-bg)` canonical Tailwind v4.
>
> 7. **i18n Keys**: Add palette-related keys to `en.json` and `id.json` (command palette labels, quick action names). Follow existing flat dotted key convention.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass.

---

### Batch 3: Dashboard Bento Command Center

**Scope**: Restructure the dashboard from generic 3-column panels into the colorful Bento Command Center with 4 tonal KPI cards, 8:4 workspace split, embedded Pomodoro widget, and Mini Month calendar.

#### Target Files

| Action   | Path                                                                     |
| :------- | :----------------------------------------------------------------------- |
| `modify` | `features/dashboard/dashboard-view.tsx`                                  |
| `create` | `components/ui/kpi-card.tsx`                                             |
| `create` | `components/ui/sparkline.tsx`                                            |
| `create` | `components/dashboard/mini-month.tsx`                                    |
| `modify` | `features/daily-tracker/pomodoro/timer.tsx` (extract embeddable variant) |
| `modify` | `lib/i18n/messages/en.json` (add KPI keys — read only relevant range)    |
| `modify` | `lib/i18n/messages/id.json` (add KPI keys — read only relevant range)    |

#### Dependencies

No new npm packages required. SVG sparkline is hand-crafted.

#### Architectural Constraints

1. **Top Row — 4 Tonal KPI Cards**: Each `KpiCard` receives a tonal wash background (`--kpi-*-bg`) and foreground (`--kpi-*-fg`) from component tokens:
   - **Weekly Consistency** (Indigo): Percentage + delta vs last week, or `Calibration` badge if < 7 recorded days.
   - **30-Day EWMA Trend** (Emerald): Smooth SVG area sparkline with Bézier interpolation and gradient fill.
   - **Today's Focus Ring** (Amber): Circular progress ring (`completed / target hours`).
   - **Learning Streak & Career** (Violet): Active streak flame + overdue 7-day follow-up counter.
2. **Middle — 8:4 Split Grid**:
   - Left 8 cols: Today's Execution Log (interactive inline check-off) + Active Projects snapshot (mini progress bars).
   - Right 4 cols: Embedded Mini Month Calendar (dot indicators) + Embedded Pomodoro Timer (25:00 / Short / Long pill switcher).
3. **Glass Purge**: Replace ALL `.glass` on dashboard panels with `bg-(--bg-surface) border border-(--border-subtle) shadow-(--shadow-card)`.
4. **Sparkline**: Smooth SVG `<path>` with cubic Bézier, subtle vertical gradient fill (`stop-opacity` from `0.2` to `0.0`), `tabular-nums` on tooltips, responsive via `viewBox` + `preserveAspectRatio`.
5. **Spacing**: Strictly `gap-4 sm:gap-6` and `p-4 sm:p-6`. Zero `gap-5`.
6. **Data Honesty**: Every KPI card includes a 1-sentence contextual explanation. Missing data shows `–` with explanation, not `0`.

#### Acceptance Criteria

- [ ] Dashboard renders 4 tonal KPI cards in top row with correct category hues.
- [ ] Sparkline renders smooth Bézier SVG area chart with gradient fill.
- [ ] Focus ring renders circular SVG progress with `tabular-nums`.
- [ ] 8:4 grid layout renders Today's log + Projects on left, Mini Month + Timer on right.
- [ ] Zero `.glass` on any dashboard card — all use solid stepped surfaces.
- [ ] All spacing follows 4pt/8pt rhythm.
- [ ] Calibration badge shows when < 7 recorded days.
- [ ] Every metric has accompanying 1-sentence explanation.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 3

> **Prompt for Batch 3 Execution:**
>
> You are executing Batch 3 of the Fyura Productivity v2 refactor. Batches 1-2 are complete and verified.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Batch 3 specification, `docs/AUDIT-FINDINGS.md` §5 (Dashboard), and `docs/DESIGN-BRIEF.md` §2.A (Dashboard Bento). Read the existing `features/dashboard/dashboard-view.tsx` to understand current data flow and service calls.
>
> **Task**: Implement in this order:
>
> 1. **`components/ui/kpi-card.tsx`**: Create a reusable `KpiCard` component accepting `title`, `value`, `subtitle` (1-sentence explanation), `delta` (optional change indicator), `hue` (component token prefix), and `children` (for custom content like rings/sparklines). Renders as a tonal wash card with `--kpi-{hue}-bg` background, `--kpi-{hue}-fg` text, `rounded-2xl`, `p-4 sm:p-6`, `tabular-nums` on values.
>
> 2. **`components/ui/sparkline.tsx`**: SVG sparkline with smooth cubic Bézier path interpolation (`C` commands), area fill with vertical gradient (`stop-opacity: 0.2` → `0.0`), responsive `viewBox`, and optional tooltip on hover showing `tabular-nums` value.
>
> 3. **`components/dashboard/mini-month.tsx`**: Compact calendar grid showing current month with dot indicators for days with recorded activity. Navigate months. Clicking a day navigates to `/daily-tracker?date={isoDate}`.
>
> 4. **Restructure `features/dashboard/dashboard-view.tsx`**: Replace the existing 3-column panel grid with the Bento layout: Top row of 4 `KpiCard`s (Consistency/EWMA/Focus Ring/Streak), then an `8:4` CSS Grid middle workspace. Remove ALL `.glass` class usages; use solid surfaces.
>
> 5. **Extract embeddable Pomodoro**: Modify `features/daily-tracker/pomodoro/timer.tsx` to export a compact `EmbeddablePomodoroTimer` variant suitable for the dashboard right rail (pill switcher: 25:00 / Short / Long).
>
> 6. **i18n**: Add KPI-related keys to both `en.json` and `id.json` with calm, honest microcopy.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass.

---

### Batch 4: Daily Tracker — Google Calendar Grid

**Scope**: Fix mobile accessibility (MiniMonth drawer), resize handle touch targets, Day Status selector, category filter chip carousel, and glass purge on all tracker surfaces.

#### Target Files

| Action   | Path                                                                         |
| :------- | :--------------------------------------------------------------------------- |
| `modify` | `features/daily-tracker/workspace.tsx`                                       |
| `modify` | `features/daily-tracker/calendar/time-grid.tsx`                              |
| `create` | `components/daily-tracker/control-rail-drawer.tsx`                           |
| `create` | `components/ui/segmented-control.tsx`                                        |
| `modify` | `lib/i18n/messages/en.json` (add day status keys — read only relevant range) |
| `modify` | `lib/i18n/messages/id.json` (add day status keys — read only relevant range) |

#### Dependencies

No new npm packages required.

#### Architectural Constraints

1. **Mobile MiniMonth Drawer**: Create `control-rail-drawer.tsx` as a slide-over bottom sheet (mobile < `lg`) triggered by an icon button next to the date header. Contains MiniMonth, Day Status selector, and category filters. Use `@starting-style` for enter animation, `transform: translateY(100%)` for exit. `--ease-drawer` curve at 280ms.
2. **Resize Handle Touch Target**: Expand bottom resize handle from `h-2` (8px) to touch-accessible via pseudo-element: `before:absolute before:-bottom-2 before:h-5 before:inset-x-0`. Visible grab line remains 2px.
3. **Day Status Selector**: Create `components/ui/segmented-control.tsx` — a segmented pill control for `Normal`, `Sick`, `Flexible`, `Off`. Optimistic mutation to `logDate` day status. Place in control rail.
4. **Category Filter Chips**: On viewports < `sm`, render category pills in a horizontal scrolling carousel (`overflow-x-auto scrollbar-none flex-nowrap`) instead of wrapping vertically.
5. **Glass Purge**: Replace ALL `.glass` on tracker panels (left rail, center grid, checklist card, timer card, history panel) with solid `bg-(--bg-surface)` + `--border-subtle`. Reserve `backdrop-filter: blur(16px)` ONLY for the sticky hour header and floating dialogs.

#### Acceptance Criteria

- [ ] MiniMonth is accessible on mobile via slide-over drawer triggered by icon button.
- [ ] Resize handle has ≥ 20px touch target via pseudo-element.
- [ ] Day Status segmented control renders in control rail with optimistic mutation.
- [ ] Category filter chips scroll horizontally on mobile (< 640px) without wrapping.
- [ ] Zero `.glass` on tracker panels — all solid stepped surfaces.
- [ ] Drawer uses GPU-only `transform` animation with `--ease-drawer`.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 4

> **Prompt for Batch 4 Execution:**
>
> You are executing Batch 4 of the Fyura Productivity v2 refactor. Batches 1-3 are complete and verified.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Batch 4 specification, `docs/AUDIT-FINDINGS.md` §6 (Daily Tracker), and `docs/DESIGN-BRIEF.md` §2.C (Google Calendar Grid). Read `features/daily-tracker/workspace.tsx` and `features/daily-tracker/calendar/time-grid.tsx` to understand current layout and interactions.
>
> **Task**: Implement in this order:
>
> 1. **`components/ui/segmented-control.tsx`**: Reusable segmented pill control. Props: `options: { value: string; label: string }[]`, `value`, `onChange`. Animated active indicator using `transform: translateX()` (GPU-only). `rounded-full` pill shape, `--bg-surface-elevated` active indicator.
>
> 2. **`components/daily-tracker/control-rail-drawer.tsx`**: Mobile slide-over bottom sheet (< `lg` breakpoint). Trigger: icon button next to date header. Content: `MiniMonth`, `SegmentedControl` for Day Status (`Normal`/`Sick`/`Flexible`/`Off`), and category filter checkboxes. Animation: `transform: translateY(100%)` → `translateY(0)` at `280ms` with `--ease-drawer`. Backdrop overlay with `opacity` fade.
>
> 3. **Resize Handle**: In `time-grid.tsx`, add `before:` pseudo-element to resize handle: `before:absolute before:-bottom-2 before:h-5 before:inset-x-0 before:cursor-s-resize`. Keep visible line at 2px height.
>
> 4. **Category Chip Carousel**: In `workspace.tsx`, wrap category filter pills on `< sm` in `flex flex-nowrap overflow-x-auto scrollbar-none` with `scroll-snap-type: x mandatory`.
>
> 5. **Glass Purge**: Replace ALL `.glass` in tracker workspace with `bg-(--bg-surface) border border-(--border-subtle)`. Only the sticky hour gutter header and floating block dialog retain `backdrop-filter`.
>
> 6. **Day Status Mutation**: Wire the segmented control to fire the existing `updateDayStatus` server action with optimistic UI update via TanStack Query `onMutate`.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass.

---

### Batch 5: Projects Kanban & Secondary Module Polish

**Scope**: Build the Trello-exact Floating Bottom Board Dock, fix card/column ergonomics (textarea, touch targets, column menu), and polish secondary modules (Weekly Plan, Capture, Career, Learning, Settings).

#### Target Files

| Action   | Path                                                    |
| :------- | :------------------------------------------------------ |
| `create` | `components/projects/board-dock.tsx`                    |
| `modify` | `features/projects/board-view.tsx`                      |
| `modify` | `features/projects/list-column.tsx`                     |
| `modify` | `features/projects/card-item.tsx`                       |
| `modify` | `features/weekly-plan/week-board.tsx`                   |
| `modify` | `features/capture/capture-panel.tsx`                    |
| `modify` | `features/career/job-table.tsx`                         |
| `modify` | `features/learning/materials-panel.tsx`                 |
| `modify` | `features/settings/theme-picker.tsx`                    |
| `modify` | `lib/i18n/messages/en.json` (add dock/column menu keys) |
| `modify` | `lib/i18n/messages/id.json` (add dock/column menu keys) |

#### Dependencies

No new npm packages required.

#### Architectural Constraints

1. **Floating Bottom Board Dock**: `fixed bottom-6 left-1/2 -translate-x-1/2 z-30`. Glass permitted (within 2-layer budget): `backdrop-filter: blur(16px)`, `--glass-bg`, `--glass-border`. Pill buttons: Inbox, Planner, Board, Switch Boards. Keyboard shortcuts `1-4`. `rounded-full` shape.
2. **Inline Card Input → Textarea**: Replace `<Input>` with auto-expanding `<textarea rows={2}>`. `Enter` submits, `Shift+Enter` adds newline, `Escape` cancels.
3. **Card Drag Touch Target**: Expand from `size-8` (32px) to `min-h-11 min-w-11` (44px). Or make entire card face draggable with `TouchSensor` 250ms activation delay on mobile.
4. **Column Actions Menu**: Add `...` icon button on column header with dropdown: Add card, Sort by due date, Move list, Delete list.
5. **Glass Purge on Projects**: Columns → `bg-(--bg-surface)` + `--border-subtle`. Cards → `bg-(--bg-surface-elevated)` + `shadow-(--shadow-card)`. Only the floating bottom dock retains glass.
6. **Weekly Plan Grid**: Replace `md:grid-cols-7` with horizontal scroll at `min-w-[220px]` columns up to `xl:grid-cols-7`.
7. **Capture Tag Carousel**: Horizontal scroll pill carousel on mobile (< 640px).
8. **Career Table**: Add adaptive card layout on < 640px (`block sm:hidden`).
9. **Settings Theme Picker**: Make radio selection trigger instant optimistic `data-mode` mutation + cookie update. Remove form submission round-trip.
10. **Learning Panels**: Replace `.glass` with solid `--bg-surface` / `--bg-surface-elevated`.

#### Acceptance Criteria

- [ ] Floating bottom dock renders centered with 4 pill buttons and keyboard shortcuts.
- [ ] Inline card composer uses auto-expanding textarea with correct keyboard handling.
- [ ] Card drag targets are ≥ 44px on touch devices.
- [ ] Column header has `...` dropdown with list actions.
- [ ] Zero `.glass` on columns/cards — only dock has glass.
- [ ] Weekly plan scrolls horizontally with min 220px columns below `xl`.
- [ ] Capture tags scroll horizontally on mobile.
- [ ] Career table shows card layout on mobile.
- [ ] Theme picker applies mode instantly without server round-trip.
- [ ] Learning panels use solid stepped surfaces.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 5

> **Prompt for Batch 5 Execution:**
>
> You are executing Batch 5 of the Fyura Productivity v2 refactor. Batches 1-4 are complete and verified.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Batch 5 specification, `docs/AUDIT-FINDINGS.md` §8 (Projects), §11 (Secondary Modules), and `docs/DESIGN-BRIEF.md` §2.B (Trello-Exact Kanban). Read the target files to understand current implementations.
>
> **Task**: Implement in this order:
>
> 1. **`components/projects/board-dock.tsx`**: Floating bottom dock — `fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-full`. Glass permitted: `backdrop-filter: blur(16px)`, `--glass-bg`, `--glass-border`, `shadow-(--shadow-raised)`. Pill buttons: Inbox (links to `/capture`), Planner (links to `/weekly-plan`), Board (scrolls to board top), Switch Boards (opens board selector). Keyboard shortcuts `Alt+1` through `Alt+4`. Mount in `board-view.tsx`.
>
> 2. **Card Input → Textarea**: In `list-column.tsx`, replace `<Input>` in `AddCard` with `<textarea rows={2} className="resize-none">`. Auto-expand height on input. `Enter` → submit, `Shift+Enter` → newline, `Escape` → cancel + blur.
>
> 3. **Card Touch Target**: In `card-item.tsx`, expand drag handle to `min-h-11 min-w-11` (44px) via padding. Add `TouchSensor` with `activationConstraint: { delay: 250, tolerance: 5 }` for mobile long-press drag.
>
> 4. **Column Menu**: In `list-column.tsx`, add `...` dropdown button in column header using an accessible menu component. Items: Add card (focus inline composer), Sort by due date, Move list (opens dialog), Delete list (with confirmation).
>
> 5. **Projects Glass Purge**: Columns → `bg-(--bg-surface) border border-(--border-subtle)`. Cards → `bg-(--bg-surface-elevated) shadow-(--shadow-card)`. Remove all `[background:var(--glass-solid)]`.
>
> 6. **Secondary Modules**: Apply fixes per specification — Weekly Plan horizontal scroll, Capture tag carousel, Career card layout on mobile, Settings instant theme, Learning solid surfaces.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass.

---

### Batch 6: Journal Rich-Text Editor & Private Space Encryption

**Scope**: Migrate journal/tadabur from plaintext `<textarea>` to TipTap rich-text editor with DOMPurify XSS sanitization. Implement the encrypted `private_records` table and cipher pipeline.

#### Target Files

| Action   | Path                                                                |
| :------- | :------------------------------------------------------------------ |
| `create` | `components/editor/rich-text-editor.tsx`                            |
| `create` | `components/editor/bubble-toolbar.tsx`                              |
| `create` | `components/editor/slash-menu.tsx`                                  |
| `create` | `server/validation/sanitize.ts`                                     |
| `modify` | `features/journal/journal-day.tsx`                                  |
| `modify` | `features/journal/tadabur/entry-dialog.tsx`                         |
| `modify` | `features/journal/actions.ts`                                       |
| `modify` | `server/services/journal.ts`                                        |
| `modify` | `server/db/schema.ts` (add `private_records` table — schema change) |
| `create` | `server/db/repositories/private.ts`                                 |
| `create` | `server/services/private.ts`                                        |
| `modify` | `app/(app)/private/page.tsx`                                        |
| `modify` | `lib/i18n/messages/en.json` (add editor keys)                       |
| `modify` | `lib/i18n/messages/id.json` (add editor keys)                       |

#### Dependencies

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link isomorphic-dompurify
```

**React 19 & Next.js 16 Compatibility Notes** (verified via context7):

| Package                         | Compatibility | Notes                                                                                                                                                                                                                                                                                                              |
| :------------------------------ | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@tiptap/react`                 | ✅ Compatible | The core `@tiptap/react` and `@tiptap/starter-kit` packages work with React 19. The React 19 incompatibility warning on Tiptap docs refers specifically to their separate **UI Components** package (`@tiptap/react-ui`), which we do NOT use. We build custom bubble toolbar and slash menu components ourselves. |
| `@tiptap/starter-kit`           | ✅ Compatible | Includes: `Document`, `Paragraph`, `Text`, `Bold`, `Italic`, `Strike`, `Code`, `Heading`, `BulletList`, `OrderedList`, `ListItem`, `Blockquote`, `CodeBlock`, `HorizontalRule`, `History`. All ProseMirror-based, framework-agnostic.                                                                              |
| `@tiptap/extension-placeholder` | ✅ Compatible | Decoration-based plugin, no React dependency.                                                                                                                                                                                                                                                                      |
| `@tiptap/extension-link`        | ✅ Compatible | ProseMirror mark, no React dependency.                                                                                                                                                                                                                                                                             |
| `isomorphic-dompurify`          | ✅ Compatible | Framework-agnostic (no React peer dep). Uses `jsdom` server-side. For Node.js ≥ 22 (which this project uses), install `isomorphic-dompurify@^3.4.0` (v3.x supports `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0`). Do NOT use v4.x which requires Node ≥ 22.22.2 — verify your exact Node version first.                  |

> [!WARNING]
> **Do NOT install `@tiptap/react-ui`** (the Tiptap UI Components package). It has a known React 19 incompatibility. Build custom toolbar components using the `@tiptap/react` `useEditor` hook and `BubbleMenu` / `FloatingMenu` components from `@tiptap/react` directly.

#### Architectural Constraints

1. **Rich-Text Editor**: Build `components/editor/rich-text-editor.tsx` using `useEditor` from `@tiptap/react` with `StarterKit`, `Placeholder`, and `Link` extensions. The editor outputs HTML string via `editor.getHTML()`.
2. **Bubble Toolbar**: `components/editor/bubble-toolbar.tsx` — floating selection toolbar using `BubbleMenu` from `@tiptap/react`. Buttons: Bold, Italic, Strike, Code, Link. Origin-aware positioning via `transform-origin: var(--transform-origin)`.
3. **Slash Menu**: `components/editor/slash-menu.tsx` — block command menu triggered by `/`. Commands: Heading 1-3, Bullet List, Numbered List, To-Do, Blockquote, Divider. Rendered as a floating list below cursor.
4. **DOMPurify Sanitization**: Create `server/validation/sanitize.ts` exporting `sanitizeHtml(dirty: string): string`. Whitelist: `<p>`, `<h1>-<h3>`, `<strong>`, `<em>`, `<s>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<code>`, `<pre>`, `<hr>`, `<a href>` (only `https://`). Block: `<script>`, `<iframe>`, `<style>`, `<img>`, inline `style` attr, `javascript:` URIs, `data:` URIs, event handlers (`on*`).
5. **Server Action Integration**: In `features/journal/actions.ts`, call `sanitizeHtml()` on the HTML body BEFORE passing to `server/services/journal.ts`. The sanitized HTML is what gets stored in PostgreSQL.
6. **Readable Measure**: Constrain journal entry display to `max-w-prose` (65ch) with `leading-relaxed`.
7. **Delete Pattern Unification**: Standardize deletion across journal and tadabur with unified optimistic delete + undo toast pattern.
8. **Private Records Schema**: Add `private_records` table to `server/db/schema.ts` with columns: `id` (UUID), `user_id`, `title` (encrypted via `column-cipher.ts`), `ciphertext` (text — AES-256-GCM encrypted body), `iv` (text), `created_at`, `updated_at`, `deleted_at`. RLS policy: `user_id = app_current_user_id()`. Service and repository with full encrypt/decrypt pipeline.
9. **Private Page**: Replace placeholder content in `app/(app)/private/page.tsx` with the private records CRUD interface, using the cipher pipeline from Batch 1.
10. **Private Lockout Timer**: Add live countdown timer in `PinPad` during `LOCKED` state that ticks down seconds and auto-resets.

#### Edge Cases

- TipTap editor must be `'use client'` — it cannot render in a server component.
- `isomorphic-dompurify` runs on both server (via jsdom) and client. Import it in the server action boundary for sanitization.
- Empty editor content (`<p></p>`) should be treated as empty — validate that body has actual text content after sanitization.
- Cross-midnight private session extension must still work with encrypted records.
- PIN pad lockout countdown must use `requestAnimationFrame` or `setInterval` with cleanup.

#### Acceptance Criteria

- [ ] Journal and Tadabur editors render TipTap rich-text with working formatting.
- [ ] Floating bubble toolbar appears on text selection with Bold/Italic/Strike/Code/Link.
- [ ] Slash menu (`/`) opens with block type commands.
- [ ] All HTML is sanitized via DOMPurify before storage — `<script>`, `<iframe>`, `javascript:` URIs are stripped.
- [ ] Journal entry display is constrained to `max-w-prose` (65ch).
- [ ] `private_records` table exists with RLS and cipher pipeline.
- [ ] Private records CRUD works with AES-256-GCM encryption/decryption.
- [ ] PIN pad lockout shows live countdown timer.
- [ ] No `.glass` on any editor or private space card.

#### Verification Gate

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

#### Self-Contained Execution Prompt — Batch 6

> **Prompt for Batch 6 Execution:**
>
> You are executing Batch 6 (final) of the Fyura Productivity v2 refactor. Batches 1-5 are complete and verified.
>
> Read `docs/MASTER-REFACTOR-PLAN.md` Batch 6 specification, `docs/AUDIT-FINDINGS.md` §9 (Journal) and §10 (Private Space), `docs/DESIGN-BRIEF.md` §2.D (Notion-Style Rich Journaling), and `docs/PRD-SRS.md` §7.6 (Private Space) and §9.9 (Journal).
>
> **Prerequisites**: Install dependencies: `pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link isomorphic-dompurify@^3.4.0`.
>
> > [!WARNING]
> > Do NOT install `@tiptap/react-ui`. It is NOT compatible with React 19. Build custom toolbar components using `BubbleMenu` and `FloatingMenu` from `@tiptap/react`.
>
> **Task**: Implement in this order:
>
> 1. **`server/validation/sanitize.ts`**: Export `sanitizeHtml(dirty: string): string` using `isomorphic-dompurify`. Strict tag whitelist: `p`, `h1`, `h2`, `h3`, `strong`, `em`, `s`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `hr`, `a`. Allow `href` on `<a>` only with `https://` protocol. Block ALL `on*` event handlers, `style` attributes, `javascript:` and `data:` URIs, `<script>`, `<iframe>`, `<img>`, `<style>`.
>
> 2. **`components/editor/rich-text-editor.tsx`**: `'use client'`. Use `useEditor` from `@tiptap/react` with `StarterKit` (all defaults), `Placeholder.configure({ placeholder })`, and `Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } })`. Expose `editor.getHTML()` via `onUpdate` callback. Apply `max-w-prose leading-relaxed` to editor content area. Include `EditorContent` from `@tiptap/react`.
>
> 3. **`components/editor/bubble-toolbar.tsx`**: Use `BubbleMenu` from `@tiptap/react`. Buttons: Bold, Italic, Strikethrough, Code, Link. Each checks `editor.isActive('bold')` etc. for active state. Glass pill styling (`rounded-full`, `backdrop-filter: blur(16px)` — within 2-layer budget as a popover).
>
> 4. **`components/editor/slash-menu.tsx`**: Floating menu on `/` trigger. Commands: Heading 1-3, Bullet List, Numbered List, Blockquote, Horizontal Rule. Each calls `editor.chain().focus().toggleHeading({ level: 1 }).run()` etc.
>
> 5. **Journal Integration**: Replace `<textarea>` in `features/journal/journal-day.tsx` and `features/journal/tadabur/entry-dialog.tsx` with `<RichTextEditor>`. In `features/journal/actions.ts`, call `sanitizeHtml()` on the body before passing to the service. Constrain rendered entries to `max-w-prose`.
>
> 6. **Delete Pattern**: Replace inline 2-click delete with `ConfirmDialog` or optimistic delete + undo toast. Standardize across journal and tadabur.
>
> 7. **Private Records Schema**: Add `private_records` table to `server/db/schema.ts`. Implement `server/db/repositories/private.ts` and `server/services/private.ts` with full AES-256-GCM encrypt/decrypt pipeline using `column-cipher.ts` from Batch 1. Add RLS policy.
>
> 8. **Private Page**: Replace placeholder in `app/(app)/private/page.tsx` with CRUD interface for encrypted private records. Must use `'use client'` for editor and cipher display.
>
> 9. **Lockout Timer**: In `features/private/components/pin-pad.tsx`, add live countdown during `LOCKED` state using `useEffect` + `setInterval` that ticks seconds and auto-resets on expiry.
>
> 10. **Migration**: Run `pnpm db:generate` to generate the migration for `private_records`. Verify with `pnpm db:migrate` if database is available.
>
> **Verification**: Run `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`. All must pass.

---

## 4. Cross-Cutting Constraints & Quality Gates

### 4.1 Universal Verification Gate

Every batch MUST pass this exact command before moving to the next:

```bash
pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build
```

**Zero errors** on all four commands. Build warnings about `partialPrefetching` are resolved in Batch 1.

### 4.2 Architectural Boundaries (Enforced)

| Boundary           | Rule                                                                                           |
| :----------------- | :--------------------------------------------------------------------------------------------- |
| `domain/`          | Zero imports from `next`, `react`, `server/`, `client/`, or `features/`                        |
| `server/db/`       | Every query inside `withUser()` transaction context                                            |
| `server/services/` | Throws `DomainError`; never returns raw DB errors                                              |
| `features/`        | Server Actions return `ActionResult<T>` with Zod v4 strict validation and `consumeRateLimit()` |
| `app/`             | `connection()` + `requireUser()` + `<Suspense>` boundaries; never `new Date()` during render   |

### 4.3 Anti-Slop Checklist (Per Batch)

- [ ] Zero raw hex/RGB in `.tsx` files — only semantic OKLCH tokens.
- [ ] Zero `.glass` on data cards — only on permitted 2-layer surfaces.
- [ ] Zero `gap-5`, `gap-7`, `gap-9` — strict 4pt/8pt rhythm.
- [ ] Zero `transition-all` — explicit property lists only.
- [ ] Zero `ease-in` on UI elements — use `--ease-out-snappy` or custom curves.
- [ ] Zero em-dashes in UI copy.
- [ ] Zero marketing clichés in UI copy.
- [ ] Every metric has a 1-sentence contextual explanation.
- [ ] All touch targets ≥ 44px × 44px with ≥ 8px gap.
- [ ] `prefers-reduced-motion` honoured (transform removed, opacity kept).
- [ ] `prefers-reduced-transparency` honoured (glass replaced with solid).

### 4.4 Dependency Summary

| Batch | New Dependencies                                                                                                                 |         React 19          |          Next.js 16          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------- | :-----------------------: | :--------------------------: |
| 1     | None (uses `node:crypto`)                                                                                                        |             —             |              —               |
| 2     | `cmdk`                                                                                                                           |     ✅ `^18 \|\| ^19`     |      ✅ `'use client'`       |
| 3     | None                                                                                                                             |             —             |              —               |
| 4     | None                                                                                                                             |             —             |              —               |
| 5     | None                                                                                                                             |             —             |              —               |
| 6     | `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-link`, `isomorphic-dompurify@^3.4.0` | ✅ Core editor compatible | ✅ `'use client'` for editor |

### 4.5 Risk Register

| Risk                                            | Likelihood | Impact | Mitigation                                                                                 |
| :---------------------------------------------- | :--------- | :----- | :----------------------------------------------------------------------------------------- |
| OKLCH not supported in older browsers           | Low        | Medium | All target browsers (latest Chrome/Edge/Firefox/Safari) support OKLCH. No polyfill needed. |
| TipTap upgrade breaks React 19 compat           | Low        | High   | Pin exact versions. Use only `@tiptap/react` core, NOT `@tiptap/react-ui`.                 |
| `isomorphic-dompurify` jsdom overhead on server | Low        | Low    | Sanitization runs only on write path (not reads). jsdom initialization is cached.          |
| Glass blur jank on low-end devices              | Medium     | Medium | 2-layer cap eliminates stacking. `prefers-reduced-transparency` fallback.                  |
| CSP nonce breaks Sentry/third-party scripts     | Medium     | Medium | Test Sentry error boundary with nonced script. Add Sentry origin to CSP `script-src`.      |
| `private_records` migration on existing DB      | Low        | High   | New table only — no data migration needed. RLS applied immediately.                        |

### 4.6 Batch Execution Timeline (Estimated)

| Batch | Scope                | Estimated Size | Sequential Dependency                     |
| :---- | :------------------- | :------------- | :---------------------------------------- |
| 1     | Security + Tokens    | Large          | Foundation — must complete first          |
| 2     | Shell + Palette      | Medium         | Depends on Batch 1 tokens                 |
| 3     | Dashboard Bento      | Medium         | Depends on Batch 1 tokens + Batch 2 shell |
| 4     | Daily Tracker        | Medium         | Depends on Batch 1 tokens                 |
| 5     | Projects + Secondary | Large          | Depends on Batch 1 tokens                 |
| 6     | Journal + Private    | Large          | Depends on Batch 1 cipher + tokens        |

---

_End of Master Refactor Plan._
