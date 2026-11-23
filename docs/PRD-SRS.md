# Fyura Productivity: Product Requirements and Software Specification

| Attribute     | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Document      | PRD and SRS, combined                                                |
| Version       | 2.1 (living document)                                                |
| Date          | 24 November 2026                                                     |
| Status        | Active baseline for v2 UI architecture audit and refactor            |
| Owner         | Repository owner (single user)                                       |
| Repository    | github.com/naufallariff/fyura-productivity                           |
| Active branch | `refactor/v2-ui-architecture` (branched from `main` @ `1ab2bef`)     |
| Languages     | English (interface and this document), Indonesian (locale catalogue) |

## Revision History

| Version | Date        | Change                                                                                                                          |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 20 Nov 2026 | First combined draft                                                                                                            |
| 2.0     | 20 Nov 2026 | Added design system, UI architecture, token model, palette specification, and full technical baseline                           |
| 2.1     | 24 Nov 2026 | Synced post-PR #4 Git baseline (`1ab2bef`), upgraded design tokens to OKLCH 60-30-10, capped glass blur, and added v2 module UX |

---

## Contents

1. Introduction
2. Product Requirements
3. Information Architecture and User Flows
4. Design System
5. Technical Architecture
6. Data Architecture
7. Security Requirements
8. Non-Functional Requirements
9. Functional Requirements
10. Interface Requirements
11. Testing and Quality
12. Infrastructure and Operations
13. Roadmap
14. Current Status
15. Risks, Debt, and Open Decisions
16. Glossary and References

---

## 1. Introduction

### 1.1 Purpose

This document specifies what Fyura Productivity must do, how it is built, and how its quality is verified. It serves three readers: the owner deciding priorities, the engineer or AI agent implementing a batch, and the reviewer checking whether a batch is complete.

### 1.2 Scope

Fyura Productivity is a personal, single-user web application. It replaces a Google Apps Script system that could not be extended safely. The application covers daily time tracking, derived checklists, consistency scoring, planning, project boards, job applications, spaced-repetition learning, rich-text journaling, reflection, idea capture, and a private space protected by a second credential.

Out of scope for version 1: multi-user collaboration, native mobile applications, payment or financial integration, browser tab blocking, and any neurobiological claims about behaviour.

### 1.3 Definitions

| Term               | Meaning                                                              |
| ------------------ | -------------------------------------------------------------------- |
| Logical day        | The calendar date in the user's time zone, used to group all records |
| Checklist snapshot | A frozen copy of a day's checklist, created on the first check       |
| EWMA               | Exponentially weighted moving average, used for smoothed trends      |
| Calibration        | The period (seven recorded days) before comparisons are shown        |
| WIP                | Work in progress: the number of active items in a category           |
| SM-2               | The SuperMemo 2 spaced-repetition algorithm                          |
| RLS                | Row-level security, enforced by PostgreSQL                           |
| Cursor             | A key-based page position, stable under concurrent writes            |
| Soft delete        | Marking a record as deleted without removing it                      |
| DomainError        | An expected failure carrying a stable, machine-readable code         |

### 1.4 References

- Woźniak, P. A. (1987). SuperMemo algorithm (SM-2).
- Anderson, D. J. (2010). _Kanban: Successful Evolutionary Change for Your Technology Business_. Blue Hole Press. Basis for explicit, soft WIP limits.
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance. _Psychological Bulletin_, 119(2). Basis for task-focused feedback.
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed. _European Journal of Social Psychology_, 40(6). Background only, not a design rule.
- W3C. _Web Content Accessibility Guidelines (WCAG) 2.2_. Target level AA.
- W3C. _Media Queries Level 5_, including `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Indonesia. _Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi_. Principles of minimisation, purpose limitation, and erasure.
- European Union. _General Data Protection Regulation_, Articles 5 and 17. Used as a comparison for minimisation and erasure.
- Vendor documentation: Next.js 16, Auth.js, Drizzle ORM, Supabase, TanStack Query, dnd-kit, Tailwind CSS 4, Zod 4, TipTap, DOMPurify.

---

## 2. Product Requirements

### 2.1 Problem statement

Personal productivity tools fail in predictable ways. This product addresses seven root problems. Each one is linked to a strategy and to requirements later in this document.

| ID  | Problem                 | Observable symptom                                                                   | Root cause                                                                                |
| --- | ----------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| P1  | Logging is abandoned    | Habits are recorded separately from time, and a forgotten entry feels like a failure | One activity recorded in two places. No distinction between "not done" and "not recorded" |
| P2  | Scores mislead          | A score falls because of illness or a day off                                        | The denominator ignores day status. No calibration period                                 |
| P3  | Plan overwrites history | Editing the plan changes past days                                                   | Checklists are not frozen per day                                                         |
| P4  | Data is fragmented      | Projects, jobs, learning, and notes do not connect                                   | No unified data model with consistent ownership                                           |
| P5  | Sensitive data leaks    | Private entries risk appearing in shared views                                       | No boundary between private and shared data                                               |
| P6  | Material is forgotten   | Items due for review never return                                                    | No scheduling for spaced repetition                                                       |
| P7  | Development degrades    | Broken migrations, schema drift, accumulating dead code                              | Unordered migrations, unbounded refactors, no automated security checks                   |

### 2.2 Product vision

A calm, trustworthy system that shows reality clearly and helps the owner improve it without punishment.

### 2.3 Product principles

1. **Record what happened.** Plans are references. The log is authoritative.
2. **Every number has a sentence.** A figure without an explanation is not shown.
3. **Smoothing before judgement.** Trends are averaged, and early data is labelled as calibration.
4. **Imperfect days still count.** Illness, rest, and missed items do not reset anything.
5. **One source, many views.** A single record feeds the timeline, checklist, dashboard, and history.
6. **Private means private.** Sensitive data is isolated at the storage, query, and interface layers.

### 2.4 Goals and success measures

| ID  | Goal                   | Measure                                                 | Target                                   | Verification               |
| --- | ---------------------- | ------------------------------------------------------- | ---------------------------------------- | -------------------------- |
| G1  | Sustained logging      | Days with at least one checklist item recorded per week | At least five of seven, over eight weeks | Dashboard history          |
| G2  | Fast capture           | Time to record one time block                           | Under 30 seconds                         | Manual timing              |
| G3  | Understandable numbers | Share of figures with an explanatory sentence           | 100 percent                              | Design review              |
| G4  | Privacy                | Private data appearing outside the private space        | Zero                                     | Automated tests and review |
| G5  | Controlled schema      | Schema changes outside ordered migrations               | Zero                                     | Migration review           |
| G6  | Responsiveness         | INP, LCP, and cached dashboard load                     | Under 200 ms, under 2.5 s, under 300 ms  | Not yet measured           |

### 2.5 Users

One user: the repository owner. Sign-in is restricted to a configured allowlist of verified Google accounts. No administrator role exists in version 1.

Usage contexts: a desktop browser for planning and review, and a phone for quick logging. The application must be fully usable from 390 px wide.

### 2.6 Scope by module

| Module         | Capabilities                                                                         | Build status                            |
| -------------- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| Authentication | Google sign-in, allowlist, 30-day session, client cache cleared on sign-out          | Built and verified in Git (`1ab2bef`)   |
| Settings       | Colour bundle, mode, time zone with device suggestion                                | Built                                   |
| Weekly plan    | Seven day cards, required and optional items, ordering                               | Built                                   |
| Daily tracker  | Timeline, status, checklist, focus timer, history                                    | Built, v2 calendar UX planned           |
| Dashboard      | Consistency, trend, today, output, frequent misses, career, learning streak          | Built, v2 Bento UX planned              |
| Projects       | Boards, lists, cards, labels, checklists, due dates, drag, filters                   | Built, v2 Trello UX planned             |
| Career         | Board, table, status history, follow-ups, activity counters, summary                 | Built (`GET /api/v1/career/jobs` fixed) |
| Learning       | Subjects with WIP warning, materials, daily progress, two-step deletion, SM-2 review | Built                                   |
| Journal        | Entries by type, late marking, learning streak, reflection tab                       | Built, v2 rich-text toolbar planned     |
| Capture        | Ideas, statuses, tags, literal search, tag cloud                                     | Built                                   |
| Private space  | PIN gate, lockout, session, idle guard                                               | Built, browser verification pending     |

**Not yet built:** recovery log, reflection analytics, notifications, calendar synchronisation, weekly and monthly reviews, data export, account deletion, global `Cmd+K` command palette.

### 2.7 Functional summary

Each module is specified in detail in Section 9. The summary below lists the principal user stories.

| ID    | As the owner, I want to                          | So that                                    |
| ----- | ------------------------------------------------ | ------------------------------------------ |
| US-01 | sign in with Google                              | I can access my data only from my account  |
| US-02 | set my time zone                                 | my days begin at my local midnight         |
| US-03 | plan each weekday                                | my checklist matches my intended routine   |
| US-04 | record blocks on a timeline                      | my log reflects what actually happened     |
| US-05 | check off items each day                         | I can see my consistency                   |
| US-06 | mark a day as sick or off                        | rest does not lower my numbers             |
| US-07 | read a consistency score with an explanation     | I understand what it means                 |
| US-08 | track projects on a board                        | I can see progress without a separate tool |
| US-09 | track job applications and follow-ups            | no opportunity is forgotten                |
| US-10 | review material on a schedule                    | I retain what I study                      |
| US-11 | write a formatted journal entry and track streak | my effort is visible and honest            |
| US-12 | capture an idea in seconds                       | ideas are not lost                         |
| US-13 | store private entries behind a second PIN        | sensitive notes stay separate              |

### 2.8 Product constraints

- One user per deployment.
- Data from the development phase is treated as disposable and is not migrated to production.
- Time zone defaults to `Asia/Jakarta` and is stored per account.
- Third-party services: Google OAuth, Supabase, Sentry (optional). Email delivery is not yet selected.

### 2.9 Assumptions

- The owner has a verified Google account.
- The owner keeps the private PIN secret. The PIN cannot be recovered in version 1, and this is disclosed at creation.
- Network access is available for normal use. Offline operation is not required.

### 2.10 Dependencies

| Dependency          | Role                       | Failure impact                 |
| ------------------- | -------------------------- | ------------------------------ |
| Google OAuth        | Sign-in                    | No access until restored       |
| Supabase PostgreSQL | All persistent data        | Application unavailable        |
| Vercel (planned)    | Hosting and scheduled jobs | No public deployment           |
| Sentry (optional)   | Error reporting            | Errors not reported externally |

---

## 3. Information Architecture and User Flows

### 3.1 Site map

```
/login                        Google sign-in
/dashboard                    Bento command center: consistency, trend, today, focus, career, streak
/daily-tracker                Google Calendar-style timeline, status, checklist, focus timer, history
/weekly-plan                  Seven-day plan
/projects                     Board index
/projects/[boardId]           Trello-style Kanban workspace and floating dock
/career                       Summary, board, table
/learning                     Materials tab, reviews tab
/journal                      Rich-text journal tab, tadabur tab
/capture                      Ideas and tags
/private                      PIN gate, then private session
/settings                     Colour bundle, mode, time zone
```

Legacy routes (`/today`, `/habits`, `/focus`, `/calendar`, `/plan`, `/review`, `/tadabur`, `/notifications`) redirect temporarily through `next.config.ts`.

### 3.2 Navigation model

The shell follows a Notion-inspired collapsible structure with three sections, identified in the sidebar with a small uppercase label. On desktop the sidebar is collapsible, paired with a top breadcrumb bar and a `0 ms` Command Palette (`Cmd+K` or `Ctrl+K`) for instant navigation and quick capture. On mobile a bottom bar carries the four primary destinations, and a "More" sheet carries the rest.

| Section   | Items                                           |
| --------- | ----------------------------------------------- |
| Main      | Dashboard, Daily Tracker, Projects, Weekly Plan |
| Workspace | Career, Learning, Journal, Capture Idea         |
| Private   | Private                                         |

The account menu sits at the foot of the sidebar. It holds settings, a notifications placeholder, and sign-out.

### 3.3 Primary user flows

**Daily flow.**

1. Open Daily Tracker. The default date is today in the user's zone.
2. Set the day status if it differs from Normal.
3. Check items in the checklist. The first check freezes the day.
4. Record blocks by dragging across 15-minute slots on the timeline or using the block dialog.
5. Start a focus session if needed. A completed deep-work session adds a block.
6. Write a learning journal entry with rich formatting when relevant. The streak updates on the dashboard.

**Weekly flow.**

1. Open Weekly Plan. Review each weekday's items.
2. Open the dashboard. Compare this week with last week, and check frequent misses.

**Project flow.**

1. Create a board. Add lists and cards inline with `+ Add a card`.
2. Move cards and lists with a drag, or use the card dialog on narrow screens.
3. Filter by label, due date, or text. Dragging pauses while a filter is active, so positions stay consistent.

**Career flow.**

1. Add an application. It starts in Applied.
2. Change its status from the board card. Each change is recorded.
3. Watch the follow-up flag, and log daily activity.

**Learning flow.**

1. Create a subject. Warnings appear above three active subjects.
2. Add material with an optional total. Log progress per day.
3. Answer due review cards with a 0 to 5 grade.

**Private flow.**

1. Create a PIN on first visit, or enter it.
2. The session lasts ten minutes and extends while active.
3. Lock manually at any time.

### 3.4 Empty, loading, and error states

Every module defines six resilient UI states:

- **Empty:** explains the next useful action in one sentence.
- **Loading:** a structural skeleton of the final layout, with `aria-busy` set.
- **Error:** a clear message with a retry action that names the failure without blaming the user.
- **Stale:** subtle indicator when background revalidation is in progress.
- **Partial:** graceful degradation when optional widgets or metrics are still in calibration.
- **Overflow:** strict truncation, horizontal scroll-snap containers, or cursor pagination so long titles never break layout geometry.

---

## 4. Design System

### 4.1 Design principles

| Principle | Expression                                                                       |
| --------- | -------------------------------------------------------------------------------- |
| Calm      | Tinted neutral surfaces, 35% to 45% negative space, zero sudden layout shifts    |
| Precise   | Tabular numerals (`tabular-nums`) for all figures, 4 pt / 8 pt spatial alignment |
| Honest    | Numbers always accompanied by their baseline meaning in one plain sentence       |
| Tactile   | Immediate press feedback, snappy Apple-style deceleration curves                 |
| Inclusive | WCAG 2.2 AA, reduced motion, reduced transparency, minimum 44 px touch targets   |

### 4.2 Visual language: Apple HIG clarity + Notion modularity

The interface synthesizes Apple Human Interface Guidelines (crisp spatial hierarchy, restrained translucency, tactile micro-physics) with Notion's modular workspace calm.

- **Glassmorphism Dose Cap**: Translucent `backdrop-filter: blur(16px)` surfaces are strictly capped to **at most 2 focal layers per viewport** (the collapsible navigation shell, floating bottom docks, and active modals or popovers).
- **Elevated Data Cards**: Dashboard cards, Kanban cards, and timeline blocks use solid or near-solid stepped elevation surfaces (`--bg-surface`, `--bg-surface-elevated`) with `1 px` hairline borders (`--border-subtle`) and soft elevation shadows. Text is never placed over unshielded background blur.

### 4.3 Colour architecture (60-30-10 Anti-Slop Discipline)

- **60% Tinted Neutral Canvas (`--bg-canvas`)**: Warm or cool tinted off-white in light mode (`L: 0.98`) and deep slate-navy in dark mode (`L: 0.145`), eliminating eye strain and flat `#000000` black.
- **30% Stepped Surfaces (`--bg-surface`, `--bg-surface-elevated`)**: Crisp white cards in light mode (`L: 1.00`) and stepped dark surfaces (`L: 0.188` to `L: 0.228`) in dark mode.
- **10% Calibrated Categorical Accents**: Purposeful pastel/tonal washes paired with crisp saturated foregrounds for KPI cards, calendar blocks, and project labels. Single viewport clusters limit active hues to 3 or 4 colours so the interface feels vibrant and structured rather than chaotic AI slop.

Three colour bundles ship for global chrome accents:

| Bundle          | Character            | Use                      |
| --------------- | -------------------- | ------------------------ |
| Ocean (default) | Cool blue, clear     | General use              |
| Sage            | Muted green, quiet   | Low-stimulation sessions |
| Dusk            | Warm violet, evening | Night use                |

A bundle changes the background tint, subtle ambient glow, and primary chrome accent only. Text colours and status colours are fixed across all bundles.

### 4.4 Modes

Two modes exist: **light** (default) and **dark**. There is no "follow system" option, because the owner chose a deliberate default. Mode and bundle are stored per account and applied before first paint through server-rendered `data-mode` and `data-bundle` attributes.

### 4.5 Token architecture

Tokens are defined in three layers using perceptual **OKLCH** colour space (`oklch(L C H)`) in `app/globals.css`. Components read only the semantic layer; zero raw hex literals are permitted in `.tsx` files.

| Layer     | Purpose                       | Example                                        |
| --------- | ----------------------------- | ---------------------------------------------- |
| Primitive | Perceptual OKLCH scale values | `--ocean-600: oklch(0.52 0.12 240)`            |
| Semantic  | Role in the interface         | `--color-accent`, `--color-ink`, `--bg-canvas` |
| Component | Scoped usage in a component   | `--card-bg`, `--dock-surface`                  |

Derived values such as hover, border, soft category washes, and muted ink are computed by `lib/theme/derive.ts` and exported as semantic CSS custom properties.

### 4.6 Contrast and category colour rules

#### 4.6.1 Contrast requirements

Every text token must meet its ratio against the surface it sits on:

| Pair                      | Minimum ratio | Standard                             |
| ------------------------- | ------------- | ------------------------------------ |
| Ink on surface            | 4.5 : 1       | WCAG 2.2 AA, normal text             |
| Ink-muted on surface      | 4.5 : 1       | WCAG 2.2 AA, normal text             |
| Accent on canvas          | 3 : 1         | WCAG 2.2 AA, non-text and large text |
| Text on accent (button)   | 4.5 : 1       | WCAG 2.2 AA                          |
| Negative and warning text | 4.5 : 1       | WCAG 2.2 AA                          |

`lib/theme/validate.ts` checks each bundle in both modes. The check runs in unit tests, so a palette that fails cannot merge.

#### 4.6.2 Category hues

Measured categories and the block timeline use perceptual OKLCH hue tokens, separate from the bundle accent, so colour carries category meaning:

| Category | Hue     |
| -------- | ------- |
| Worship  | teal    |
| Learning | indigo  |
| Work     | orange  |
| Career   | rose    |
| Fitness  | emerald |
| Rest     | sky     |
| Social   | amber   |
| Leisure  | violet  |

Each hue provides a tonal soft background (`--cat-*-soft`) and a high-contrast foreground (`--cat-*`). Category colour is never the only signal: every block also carries its text label.

### 4.7 Typography

| Role              | Size        | Weight | Tracking                            | Leading |
| ----------------- | ----------- | ------ | ----------------------------------- | ------- |
| Display (figures) | 36 to 64 px | 600    | -0.04 em                            | 1.05    |
| Page title        | 24 to 30 px | 600    | -0.02 em                            | 1.2     |
| Section title     | 14 px       | 600    | 0                                   | 1.4     |
| Body              | 14 to 16 px | 400    | 0                                   | 1.5     |
| Label and caption | 11 to 12 px | 500    | 0.02 em, uppercase for group labels | 1.4     |

Figures use tabular numerals (`tabular-nums`) so columns align. Prose blocks in Journal and Tadabur are constrained to a readable measure of `55ch` to `75ch`.

Body text and form inputs on phones use a minimum of `16 px` to prevent automatic zoom on input focus.

### 4.8 Spacing, radius, and elevation

| Token          | Value                          | Use                         |
| -------------- | ------------------------------ | --------------------------- |
| Spacing scale  | 4 px / 8 px base rhythm        | All gaps and padding        |
| Radius control | 10 px (`rounded-lg`)           | Buttons, inputs, list items |
| Radius inner   | 12 px (`rounded-xl`)           | Kanban cards, inner tiles   |
| Radius card    | 16 to 20 px (`rounded-2xl`)    | Bento panels and containers |
| Radius sheet   | 28 px (top corners)            | Mobile bottom sheets        |
| Radius pill    | 9999 px (`rounded-full`)       | Chips, docks, status pills  |
| Shadow raised  | 0 8px 24px oklch(0 0 0 / 0.06) | Floating docks and popovers |

### 4.9 Iconography

Icons come from Lucide (`lucide-react`) at stroke width 1.75. Sizes: 16 px in dense rows, 18 px in buttons, 20 px in navigation. Icon-only buttons always carry an accessible name.

### 4.10 Motion

| Interaction           | Duration or model                | Property               |
| --------------------- | -------------------------------- | ---------------------- |
| Keyboard palette      | `0 ms` (instant response)        | `opacity`, `transform` |
| Press feedback        | `120 ms`, `active:scale-[0.97]`  | `transform`            |
| Popover and dock      | `160 ms` to `200 ms`, snappy out | `transform`, `opacity` |
| Card and item reorder | `dnd-kit` spring physics         | `transform`            |
| Pin entry             | `220 ms`                         | `transform`, `opacity` |
| Session ring          | `1 s` linear                     | `stroke-dashoffset`    |

Rules:

- Animate strictly GPU-composited properties (`transform`, `opacity`, `clip-path`). Never use `transition-all` or animate layout `width`/`height` directly.
- Standard deceleration curve: `--ease-out-snappy: cubic-bezier(0.23, 1, 0.32, 1)`.
- `prefers-reduced-motion: reduce` removes transforms and keeps instant opacity transitions.
- `prefers-reduced-transparency: reduce` replaces translucent chrome with solid surfaces and disables backdrop blur.

### 4.11 Responsive breakpoints

| Name | Width       | Layout                                    |
| ---- | ----------- | ----------------------------------------- |
| Base | 0 to 639 px | Single column, bottom navigation, sheets  |
| `sm` | 640 px      | Two columns where content allows          |
| `md` | 768 px      | Sidebar visible, bottom navigation hidden |
| `lg` | 1024 px     | Three-column workspace layouts            |
| `xl` | 1280 px     | Wide tables and board columns             |

The minimum supported width is 390 px. Horizontal scroll is used only for boards, timelines, and week cards, and each has a scroll-snap container.

### 4.12 Component inventory

| Family          | Components                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces        | `Card`, `CardHeader`, `Panel`, `Dialog` (native, bottom sheet on mobile), `FloatingDock`                                                        |
| Controls        | `Button` (primary, secondary, ghost, danger, pending state), `Field`, `Input`, `Textarea`, `RichTextEditor`, `Segmented`, `TabNav`              |
| Data display    | `KpiCard`, `Sparkline`, `Ring`, `ProgressBar`, `Pill`, `Avatar`                                                                                 |
| Feedback        | `EmptyState`, `Skeleton`, `PageSkeleton`, `Tooltip`                                                                                             |
| Shell           | `Sidebar`, `SidebarProfile`, `MobileNav`, `CommandPalette`, `PageHeader`, `PageFrame`, `SignOutButton`                                          |
| Module-specific | Timeline grid, block card, mini month, checklist row, board, list column, card face, inline card composer, job card, streak fire, pin pad, ring |

Every primitive accepts an accessible label and forwards refs where a library needs them.

### 4.13 Accessibility

| Requirement                     | Implementation                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Keyboard operation              | Every action reachable by Tab or `Cmd+K`. Drag has keyboard sensors and dialog backup |
| Focus visibility                | Two-pixel accent ring on `:focus-visible`                                             |
| Touch targets                   | Minimum 44 px in both dimensions with at least 8 px gap                               |
| Names                           | Icon-only buttons have `aria-label`. Form fields have associated labels               |
| Live regions                    | Validation and save results use `role="status"` or `role="alert"`                     |
| Current state                   | `aria-current` on navigation, `aria-pressed` on toggles, `aria-checked` on checkboxes |
| Language                        | `lang` set on the document. Locale-aware formatting                                   |
| Skip link                       | First focusable element jumps to main content                                         |
| Contrast                        | Enforced by unit tests on every bundle and mode                                       |
| Reduced motion and transparency | Honoured through media queries                                                        |

### 4.14 Copywriting and microcopy hygiene

- **Tone**: Calm, direct, and honest.
- **Action labels**: Concise `Verb + Object` labels (`Create block`, `Add card`, `Lock private space`, `Start focus`).
- **Banned patterns**:
  - Zero em-dashes (`—`) inside UI headings, labels, tooltips, or helper text.
  - Zero hollow marketing clichés (`Seamless`, `Unlock`, `Supercharge`, `AI-powered`, `Revolutionary`).
  - Zero symbols or emoji inside interface text.

---

## 5. Technical Architecture

### 5.1 System overview

```
Browser (desktop and phone)
    │  HTTPS
    ▼
Next.js 16 (App Router, Cache Components, proxy.ts)
    ├── Server components   render with requireUser() and connection()
    ├── Server actions      writes from the client, wrapped in runAction
    └── Route handlers      reads for TanStack Query under /api/v1
            │
            ▼
Services (server/services)         use cases, DomainError
            │
            ▼
Repositories (server/db)           Drizzle, always inside withUser()
            │
            ▼
PostgreSQL on Supabase (Singapore) RLS with FORCE, role app_runtime

Supporting: Google OAuth, Sentry, GitHub Actions, Vercel (planned)
```

### 5.2 Technology stack

| Layer                      | Package                                                  | Version                 |
| -------------------------- | -------------------------------------------------------- | ----------------------- |
| Framework                  | next                                                     | 16.4.5                  |
| UI runtime                 | react, react-dom                                         | 19.3.0                  |
| Language                   | typescript                                               | ^5                      |
| Styling                    | tailwindcss, @tailwindcss/postcss                        | ^4, ^4.3.5              |
| Turbopack styling          | @tailwindcss/turbopack                                   | ^4                      |
| Authentication             | next-auth                                                | 5.0.0-beta.32           |
| Database client            | postgres                                                 | ^3.4.9                  |
| ORM                        | drizzle-orm                                              | ^0.45.4                 |
| Migrations                 | drizzle-kit                                              | ^0.31.11                |
| Validation                 | zod                                                      | ^4.6.7                  |
| PIN hashing                | @node-rs/argon2                                          | ^2.2.2                  |
| Server state               | @tanstack/react-query                                    | ^5.107.1                |
| Drag and drop              | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities     | ^6.3.1, ^10.0.0, ^3.2.2 |
| Rich text (planned v2)     | @tiptap/react, @tiptap/starter-kit, isomorphic-dompurify | Planned in v2 batch     |
| Icons                      | lucide-react                                             | ^1.70.0                 |
| Error reporting            | @sentry/nextjs                                           | ^11.11.0                |
| Environment                | dotenv                                                   | ^18.0.9                 |
| Server-only guard          | server-only                                              | ^0.0.1                  |
| Unit and integration tests | vitest, @vitest/coverage-v8                              | ^5.1.0                  |
| Linting                    | eslint, eslint-config-next                               | ^9, 16.4.5              |
| Formatting                 | prettier, prettier-plugin-tailwindcss                    | ^3.9.10, ^0.8.1         |
| Git hooks                  | husky, lint-staged                                       | ^9.1.7, ^17.6.0         |
| Script runner              | tsx                                                      | ^4.23.15                |
| Cross-platform env         | cross-env                                                | ^10.1.0                 |
| Package manager            | pnpm                                                     | 12.18.0                 |
| Runtime types              | @types/node, @types/react, @types/react-dom              | ^22.20.5, ^19, ^19      |

### 5.3 Repository layout

```
app/              routes, layouts, route handlers, global error and not-found pages
features/         module UI and server actions, one folder per module
domain/           pure business rules (no framework imports)
server/           services, repositories, validation, auth, private gate, observability
client/           query client, cache policies, hooks, persistence, API fetch
components/       shared UI primitives and shell
lib/              i18n catalogues, theme, navigation, UI helpers
drizzle/          migrations and snapshots
scripts/          migration runner, migration sorter, message audit
tests/            mirrors source: domain, server/db, client, ui, theme, i18n
types/            augmentation for Auth.js
```

### 5.4 Layer contract

| Layer        | Responsibility                                | Forbidden                                                                   |
| ------------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| `domain`     | Rules, calculations, value objects            | Any import from `server`, `client`, `features`, `app`, or framework modules |
| `server`     | Persistence, use cases, security              | Browser APIs, React                                                         |
| `client`     | Caching, requests, persistence in the browser | Direct database access                                                      |
| `features`   | UI and orchestration                          | Value imports from `server` (types only)                                    |
| `components` | Presentation                                  | Business rules                                                              |
| `app`        | Routing and composition                       | Repository calls                                                            |

### 5.5 Rendering model

- **Server components** render module pages. Each page calls `connection()` before reading request-scoped data, so Cache Components never prerenders user data.
- **Client components** handle interaction. They read through TanStack Query and write through server actions.
- **Suspense** wraps each page with a skeleton fallback that matches the final layout.
- **Current day** is computed on the server from the stored time zone and passed down as a prop. Components never call `new Date()` during render.

### 5.6 Request lifecycle

**Server render.**

1. `connection()` marks the render as dynamic.
2. `requireUser()` verifies the Auth.js session. Failure redirects to `/login`.
3. The page calls a service. The service opens `withUser`, which sets `app.user_id` for the transaction with `set_config(..., true)`.
4. Repository queries run. RLS filters rows at the database.
5. The page renders with the data.

**Client read.**

1. TanStack Query calls a route handler under `/api/v1`.
2. `apiUserId()` checks the session and returns 401 when absent.
3. `consumeRateLimit` applies the read budget.
4. The service runs. The response is JSON with `Cache-Control: private, no-cache`.
5. The client validates the body with a Zod schema before it enters the cache.

**Client write.**

1. A component calls a server action.
2. `requireUser()` runs outside any try block, so redirects are not caught.
3. `consumeRateLimit` applies the write budget.
4. `runAction` executes the service and converts any failure into a stable code.
5. The result object returns to the client. The mutation invalidates related query keys, or rolls back an optimistic change on failure.

### 5.7 Caching strategy

| Data              | Policy                                                          | Scope                            |
| ----------------- | --------------------------------------------------------------- | -------------------------------- |
| Standard reads    | `staleTime` 5 min, `gcTime` 30 min                              | Per user, keyed with `scopedKey` |
| Private data      | No persistence. Cleared on sign-out                             | Never shared, never stored       |
| Persisted storage | Non-private only. `assertPersistable` refuses private scopes    | Browser                          |
| Sign-out          | Clears query cache and persisted keys before the session ends   | Client                           |
| After writes      | Targeted invalidation, optimistic updates where latency matters | Client                           |

Cache keys always include the user identifier. Switching accounts cannot reveal another account's cached data.

### 5.8 Concurrency and consistency

| Problem                       | Mechanism                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Two taps on the same checkbox | Writes share a mutation scope, so they run in order. The last request reflects the final desired state |
| Two reviews of one card       | `SELECT ... FOR UPDATE` on the card row. The second review sees the new due date and is refused        |
| Two placements in one list    | Positions computed from neighbours inside the transaction. A stale neighbour causes a `CONFLICT`       |
| Gap exhaustion in positions   | Respacing of the affected list, then one retry                                                         |
| Concurrent counter updates    | Single `INSERT ... ON CONFLICT DO UPDATE` with clamping in SQL                                         |
| Stale list in another tab     | Reorder requests carry the full ordered set. Mismatches are rejected                                   |
| Duplicate snapshot creation   | Unique index on (user, date, source) with `ON CONFLICT DO NOTHING`                                     |
| Partial multi-row writes      | One transaction per use case                                                                           |

### 5.9 Error model

Expected failures are `DomainError` instances with one of these codes:

| Code                | HTTP status | Meaning                                           |
| ------------------- | ----------- | ------------------------------------------------- |
| `VALIDATION_FAILED` | 400         | Input rejected by a schema                        |
| `UNAUTHORIZED`      | 401         | No valid session                                  |
| `NOT_FOUND`         | 404         | Record absent or not owned                        |
| `CONFLICT`          | 409         | Concurrent or invariant conflict                  |
| `RATE_LIMITED`      | 429         | Budget exceeded                                   |
| `INTERNAL`          | 500         | Unexpected failure, generic message to the client |

Unexpected errors are logged by name and request identifier only. Messages from thrown errors never reach the client or the log.

### 5.10 Internationalisation architecture

- Two catalogues: `en.json` and `id.json`, flat dotted keys.
- `t(key, params)` interpolates named placeholders and throws on a missing parameter.
- `tPlural` selects `one` and `other` forms.
- Catalogues are checked by tests for identical keys, identical placeholders, no emoji, and paired plural forms.
- A script reports unused and missing keys. Keys built dynamically from known prefixes are recognised.

### 5.11 Observability

- A request identifier is attached to every request in `proxy.ts`.
- Structured logs record event names and identifiers.
- Sentry captures unhandled errors when `SENTRY_DSN` is set. Client and server configurations are separate.
- Log redaction removes known sensitive fields before output.

---

## 6. Data Architecture

### 6.1 Data groups

| Group                  | Tables                                                                                               | Owner column |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| Identity and settings  | `users`, `user_settings`, `private_pin`, `audit_log`                                                 | `user_id`    |
| Daily tracking         | `day_logs`, `time_blocks`, `focus_sessions`, `journal_entries`                                       | `user_id`    |
| Plan and checklist     | `weekly_plan_items`, `checklist_entries`                                                             | `user_id`    |
| Projects               | `boards`, `board_lists`, `board_cards`, `board_labels`, `board_card_labels`, `board_checklist_items` | `user_id`    |
| Capture and reflection | `ideas`, `idea_tags`, `tadabur_entries`                                                              | `user_id`    |
| Career                 | `jobs`, `job_events`, `career_activities`                                                            | `user_id`    |
| Learning               | `subjects`, `learning_items`, `reading_progress`, `review_cards`                                     | `user_id`    |
| Infrastructure         | `rate_limits`                                                                                        | `user_id`    |

Total: 27 tables.

### 6.2 Entity relationships (summary)

- A **board** owns lists, cards, labels, and checklist items. A **card** belongs to one list and can carry many labels. A label belongs to one board.
- A **day log** holds the status for one user-day. **Time blocks** and **focus sessions** reference the same date.
- A **checklist entry** is a snapshot row. Its `source_item_id` points to the weekly plan item it came from, and is nulled if that item is later removed.
- A **job** has many **job events**, which form its status history. **Career activities** are counters per user, day, and kind.
- A **subject** has many **learning items**. A **learning item** has many **reading progress** rows (one per day) and may own **review cards**. A review card may stand alone after its item is purged.
- An **idea** has many **idea tags**.

### 6.3 Integrity rules

| Rule                  | Implementation                                                                 |
| --------------------- | ------------------------------------------------------------------------------ |
| Ownership             | Every child references its parent with a composite key that includes `user_id` |
| One record per period | Unique indexes on (user, date), (item, date), (user, date, kind), and similar  |
| Valid ranges          | Check constraints on minutes, surah, ayat, weekday, quality, and EF            |
| Valid vocabularies    | Check constraints on status, kind, category, and source                        |
| Bounded text          | Check constraints on length for titles, bodies, links, and tags                |
| Time semantics        | `timestamptz` for instants, `date` for logical days                            |
| Cursor stability      | Millisecond timestamps written from application code to match ISO cursors      |

### 6.4 Indexing strategy

- Every index leads with `user_id`, so per-user queries touch only that user's rows.
- Partial indexes exclude archived and deleted rows where the query always filters them.
- Cursor indexes match the sort order (for example `(user_id, updated_at, id)`).
- Foreign key columns are indexed where the parent is queried by child.

### 6.5 Migration strategy

- Schema lives in `server/db/schema.ts`. It is the single source of truth.
- `pnpm db:generate` runs `drizzle-kit generate`, then `scripts/sort-migration.mjs`, which orders `CREATE TABLE` before `CREATE INDEX` before constraints. This prevents foreign keys referencing indexes that do not yet exist.
- `pnpm db:migrate` applies pending migrations through the migration role, using the direct connection on port 5432.
- Custom migrations hold row-level security, functions, and grants. Each new user table requires one.
- Applied migrations are never edited. Corrections are new migrations.
- The current history is one baseline and eight follow-up migrations.

### 6.6 Retention and deletion

| Entity                                     | Deletion                 | Recovery                                            |
| ------------------------------------------ | ------------------------ | --------------------------------------------------- |
| Time blocks, ideas, tadabur entries        | Soft delete              | Not exposed in version 1                            |
| Jobs, boards, lists, cards, learning items | Archive                  | Restore from the archive view                       |
| Learning items                             | Permanent, after archive | Not recoverable. Review cards are detached and kept |
| Journal entries                            | Soft delete              | Not exposed                                         |
| Account                                    | Not yet available        | Planned (see 14.4, U12)                             |

---

## 7. Security Requirements

### 7.1 Threat model (summary)

| Threat                                        | Asset         | Control                                                  |
| --------------------------------------------- | ------------- | -------------------------------------------------------- |
| Unauthorised sign-in                          | All data      | Verified-email allowlist, OAuth only                     |
| Session theft                                 | All data      | HTTP-only cookie, 30-day maximum, rotation by Auth.js    |
| Cross-user data access                        | All data      | RLS with FORCE, per-transaction identity, composite keys |
| Direct API access via the platform REST layer | All data      | Revoked privileges for `anon` and `authenticated`        |
| PIN guessing                                  | Private space | Lockout with progressive delay                           |
| PIN database leak                             | Private space | Argon2id with server-side pepper                         |
| Session cookie forgery                        | Private space | HMAC signature with `AUTH_SECRET`                        |
| Injection or XSS through input                | All data      | Parameterised queries, strict Zod schemas, DOMPurify     |
| Cached sensitive responses                    | All data      | `no-store` headers                                       |
| Leakage through logs                          | All data      | Logs carry names and identifiers only                    |
| Abuse through request volume                  | Availability  | Per-user fixed-window rate limits                        |

### 7.2 Authentication

- Auth.js 5 with the Google provider.
- A sign-in callback accepts only accounts whose email is verified and present in `ALLOWED_EMAILS`.
- The JWT callback resolves the database user identifier once and stores it in the token.
- Session maximum age is 30 days.

### 7.3 Authorisation

- Pages and actions call `requireUser()`. It returns the signed-in user or redirects.
- Route handlers call `apiUserId()`. It returns the identifier or the caller responds with 401.
- Authorisation within the database is enforced by RLS, not by application code alone.

### 7.4 Row-level security

- Every user-owned table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
- One owner policy per table: `user_id = app_current_user_id()` for both `USING` and `WITH CHECK`.
- `app_current_user_id()` reads `app.user_id`, set per transaction by `withUser`.
- The table `users` is the single exception to `FORCE`, because the login function must insert rows. Its policy still restricts reads and updates to the owner.
- A test (`rls-coverage`) fails if any table lacks RLS, lacks `FORCE`, or grants access to `anon`.

### 7.5 Database roles and privileges

| Role                    | Purpose                 | Privileges                                                               |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `postgres` (migration)  | Schema changes          | Owner, used only by the migration script                                 |
| `app_runtime`           | Application             | Select, insert, update, delete on owned tables. Execute on two functions |
| `anon`, `authenticated` | Supabase platform roles | All privileges revoked on the public schema                              |

The application connects as `app_runtime` through the pooler with `prepare: false`, which is required for transaction-mode pooling.

### 7.6 Private space

| Control        | Requirement                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| PIN format     | Exactly six digits                                                                                         |
| Storage        | Argon2id hash with pepper from `PRIVATE_PIN_PEPPER`. The plaintext is never stored                         |
| Encryption     | Sensitive private records encrypted at rest via AES-256-GCM (`server/crypto/column-cipher.ts`, tracked U9) |
| Lockout        | After five failures, a delay that grows with repeated failures. Failure count resets on success            |
| Session        | HMAC-signed cookie valid for ten minutes, extended on activity                                             |
| Idle guard     | Pings the server on user activity, at most once per minute. Returns to the gate when the session expires   |
| Manual lock    | Clears the session cookie immediately                                                                      |
| Data isolation | No private table is read by the dashboard, reviews, or any shared service                                  |
| Disclosure     | PIN recovery is not available in version 1. This is stated on the creation screen                          |

### 7.7 Input and output

- Every boundary validates input with a Zod schema in strict mode, so unknown fields are rejected.
- Rich-text HTML from Journal and Tadabur editors must be sanitized with `DOMPurify` (allowing only safe formatting tags and `https://` links) before storage and rendering.
- Search text is escaped for `LIKE` wildcards, so `%` and `_` match literally.
- Links must use `https`.
- Responses carry `Cache-Control: no-store` when sensitive and `private, no-cache` otherwise.
- Error responses contain a stable code and a fixed message, never a stack trace or a thrown message.

### 7.8 Rate limiting

| Budget | Limit | Window                           | Storage             |
| ------ | ----- | -------------------------------- | ------------------- |
| Writes | 60    | 60 seconds, aligned to the clock | `rate_limits` table |
| Reads  | 300   | 60 seconds, aligned to the clock | `rate_limits` table |

Storage in PostgreSQL makes the limit hold across serverless instances. The increment is a single atomic upsert.

### 7.9 Secrets and configuration

- All environment variables are validated at startup with Zod. The application refuses to start on invalid configuration.
- `.env.local` is excluded from version control.
- `.env.example` documents every variable with no real values.
- The pepper and the auth secret must be unique per environment.
- Cron endpoints must verify bearer secrets using `crypto.timingSafeEqual` (`server/cron/auth.ts`, tracked U10).

### 7.10 Headers (target)

| Header                    | Value                                              | Status               |
| ------------------------- | -------------------------------------------------- | -------------------- |
| Content-Security-Policy   | Restrictive, with per-request nonces in `proxy.ts` | Target (tracked U11) |
| X-Frame-Options           | `DENY`                                             | Target (tracked U11) |
| X-Content-Type-Options    | `nosniff`                                          | Target (tracked U11) |
| Referrer-Policy           | `strict-origin-when-cross-origin`                  | Target (tracked U11) |
| Strict-Transport-Security | Set by the hosting platform                        | Platform             |

Adding per-request CSP nonces in `proxy.ts` and static security headers in `next.config.ts` is tracked as U11.

### 7.11 Privacy principles

- **Minimisation.** Only data needed for a stated feature is collected.
- **Purpose limitation.** Private data is used only inside the private space.
- **Erasure.** Account-level export and erasure are planned (U12). Until then, the owner can delete records through the interface where soft deletion applies.
- **Transparency.** Scoring rules are documented in this specification and in the code.

---

## 8. Non-Functional Requirements

| ID     | Category        | Requirement                                                                   | Verification                              |
| ------ | --------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| NFR-01 | Performance     | INP under 200 ms; LCP under 2.5 s; cached dashboard under 300 ms              | Lighthouse and DevTools. Not yet measured |
| NFR-02 | Performance     | Animation uses `transform`, `opacity`, and `clip-path` only                   | Code review                               |
| NFR-03 | Performance     | Lists paginate with cursors, 25 items per page, maximum 50                    | Database tests                            |
| NFR-04 | Performance     | Search input debounced at 300 ms                                              | Code review                               |
| NFR-05 | Security        | RLS with FORCE on all user tables, except `users`                             | `rls-coverage` test                       |
| NFR-06 | Security        | `anon` and `authenticated` have no access to public tables                    | `rls-coverage` test                       |
| NFR-07 | Security        | Strict validation at every input boundary                                     | Validation tests                          |
| NFR-08 | Security        | Sensitive responses carry `no-store`                                          | Code review of `server/api/guard.ts`      |
| NFR-09 | Security        | Per-user rate limits, 60 writes and 300 reads per minute                      | Repository test                           |
| NFR-10 | Security        | Invalid environment prevents startup                                          | `env` test                                |
| NFR-11 | Privacy         | Private data never enters client cache or persistent storage                  | Persistence test and review               |
| NFR-12 | Privacy         | Logs contain no user input                                                    | Redaction test                            |
| NFR-13 | Reliability     | Multi-row writes use one transaction                                          | Service tests                             |
| NFR-14 | Reliability     | Optimistic updates roll back on failure                                       | Hook review                               |
| NFR-15 | Accessibility   | WCAG 2.2 AA; targets at least 44 px; reduced motion and transparency honoured | Manual audit. Automated audit not yet run |
| NFR-16 | Localisation    | Identical keys in both catalogues                                             | `messages` test                           |
| NFR-17 | Localisation    | Dates and numbers via `Intl`; logical days in the user's zone                 | Zone tests                                |
| NFR-18 | Maintainability | Applied migrations are never edited                                           | Process review                            |
| NFR-19 | Maintainability | `domain` has no framework imports                                             | Dependency review                         |
| NFR-20 | Observability   | Request identifier on every request; errors to Sentry when configured         | `proxy.ts` review                         |
| NFR-21 | Portability     | Usable from 390 px                                                            | Browser test                              |
| NFR-22 | Delivery        | CI runs lint, typecheck, test, and build                                      | GitHub Actions                            |
| NFR-23 | Maintainability | Test suites run without a network except the database suite                   | Test configuration                        |

---

## 9. Functional Requirements

Requirement format: identifier, statement, acceptance criteria.

### 9.1 Authentication (FR-AUT)

| ID        | Requirement                    | Acceptance                                                     |
| --------- | ------------------------------ | -------------------------------------------------------------- |
| FR-AUT-01 | Sign in with Google            | Succeeds only for verified emails on the allowlist             |
| FR-AUT-02 | Session lifetime               | Expires 30 days after sign-in                                  |
| FR-AUT-03 | First sign-in creates the user | A `users` row exists after the callback                        |
| FR-AUT-04 | Sign-out clears client state   | Query cache and persisted keys cleared before the session ends |

### 9.2 Settings (FR-SET)

| ID        | Requirement            | Acceptance                                                   |
| --------- | ---------------------- | ------------------------------------------------------------ |
| FR-SET-01 | Choose a colour bundle | Ocean, Sage, or Dusk; persists across reloads                |
| FR-SET-02 | Choose a mode          | Light or dark; no system option                              |
| FR-SET-03 | Choose a time zone     | Only valid IANA names accepted                               |
| FR-SET-04 | Device suggestion      | Shown only when the device zone differs from the stored zone |

### 9.3 Weekly plan (FR-WPL)

| ID        | Requirement                       | Acceptance                                                      |
| --------- | --------------------------------- | --------------------------------------------------------------- |
| FR-WPL-01 | Add an item to a weekday          | Appears last in that day                                        |
| FR-WPL-02 | Edit and delete items             | Deletion is soft                                                |
| FR-WPL-03 | Reorder within a day              | Order persists. A stale ordered set is rejected with `CONFLICT` |
| FR-WPL-04 | Mark required, optional, and core | Only required items score. Core items apply on off days         |

### 9.4 Daily tracker (FR-DTK)

| ID        | Requirement                     | Acceptance                                                                                                             |
| --------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-DTK-01 | Set day status                  | Normal, Sick, Flexible, or Off. Status changes scoring                                                                 |
| FR-DTK-02 | Google Calendar-style time grid | Hourly timeline (`00:00` to `23:59`, user time zone gutter) supporting Day and Week views with live current-time line  |
| FR-DTK-03 | Drag-to-create and resize       | Click-drag across empty 15-min slots to create with live preview; move or resize bottom edge in 15-min snaps           |
| FR-DTK-04 | Block across midnight           | Stored as two linked rows. Edited as a pair in the dialog. Overlapping blocks refused with rollback                    |
| FR-DTK-05 | Daily checklist                 | A check writes the desired state, not a toggle. The first check freezes the day                                        |
| FR-DTK-06 | Focus timer                     | Durations 1 to 240 minutes. Session always recorded. Completed deep-work sessions add a block when it does not overlap |
| FR-DTK-07 | History                         | Filters for date, category, and text. Literal text search. Pages of 25                                                 |
| FR-DTK-08 | Category filter and mini-month  | Left rail mini-month navigator and category checkboxes that dim unselected categories rather than hiding them          |

### 9.5 Dashboard (FR-DSB)

| ID        | Requirement                 | Acceptance                                                                                       |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| FR-DSB-01 | Bento command center layout | Four tonal KPI cards on top row, split 8:4 middle workspace with execution log and side widgets  |
| FR-DSB-02 | Weekly consistency & trend  | Share of required items completed on recorded days; 30-day EWMA (`alpha = 0.25`) sparkline chart |
| FR-DSB-03 | Calibration                 | Comparisons hidden and labelled `Calibration` until seven recorded days                          |
| FR-DSB-04 | Embedded focus & calendar   | Right-hand sidebar embeds interactive mini-month calendar and Pomodoro focus timer switcher      |
| FR-DSB-05 | Frequent unchecked items    | Counted only on Normal days, over the last seven days; neutral wording                           |
| FR-DSB-06 | No private data & clarity   | Dashboard service reads no private table; every figure has an accompanying explanatory sentence  |

### 9.6 Projects (FR-PRJ)

| ID        | Requirement            | Acceptance                                                                                   |
| --------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| FR-PRJ-01 | Trello-exact Kanban    | Horizontal scroll-snap columns (`280 px`), column card count, and `...` column actions       |
| FR-PRJ-02 | Move cards and lists   | 60 fps drag-and-drop for both cards and lists. Positions computed on server with rollback    |
| FR-PRJ-03 | Inline card composer   | `+ Add a card` at the bottom of every column opens an inline input submitting on `Enter`     |
| FR-PRJ-04 | Card face & checklists | Shows label bars, due date status (`overdue`, `today`, `upcoming`), and checklist count pill |
| FR-PRJ-05 | Floating bottom dock   | Centered glass dock at viewport bottom for `Inbox`, `Planner`, `Board`, and `Switch Boards`  |
| FR-PRJ-06 | Filters and dragging   | Dragging disabled while a filter is active                                                   |
| FR-PRJ-07 | Archive                | Boards, lists, and cards archive. No permanent deletion in the interface                     |

### 9.7 Career (FR-CAR)

| ID        | Requirement       | Acceptance                                                   |
| --------- | ----------------- | ------------------------------------------------------------ |
| FR-CAR-01 | Seven statuses    | Any status may change to any other. Every change is recorded |
| FR-CAR-02 | Status history    | Each event stores from-status, to-status, and time           |
| FR-CAR-03 | Follow-up flag    | Open applications unchanged for seven days are flagged       |
| FR-CAR-04 | Activity counters | Count per kind per day, between 0 and 1000, never negative   |
| FR-CAR-05 | Links             | Only `https`                                                 |
| FR-CAR-06 | Summary           | Counts per status, open applications, and follow-ups needed  |

### 9.8 Learning (FR-LRN)

| ID        | Requirement                   | Acceptance                                                                 |
| --------- | ----------------------------- | -------------------------------------------------------------------------- |
| FR-LRN-01 | Subjects with type and status | Names unique per user                                                      |
| FR-LRN-02 | Soft WIP limit                | Warning above three active subjects; save not refused                      |
| FR-LRN-03 | Materials with optional total | Progress may not exceed a set total                                        |
| FR-LRN-04 | Daily progress                | A day's figures replace, not add to, earlier figures for that day          |
| FR-LRN-05 | Automatic activation          | A queued material becomes active on first progress                         |
| FR-LRN-06 | Two-step deletion             | Only archived materials can be purged. Review cards are kept as standalone |
| FR-LRN-07 | SM-2 review                   | Due cards graded 0 to 5. Simultaneous grading accepts one answer           |
| FR-LRN-08 | New review card               | Due today                                                                  |

### 9.9 Journal and reflection (FR-JRN, FR-TAD)

| ID        | Requirement               | Acceptance                                                                                     |
| --------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| FR-JRN-01 | Notion-style rich editor  | TipTap editor with floating selection bubble toolbar, sticky block toolbar, and `/` slash menu |
| FR-JRN-02 | Entries by date and type  | Five types. Body required and sanitized via `DOMPurify`                                        |
| FR-JRN-03 | Late marking              | Marked when written more than one day after its date. Never refused                            |
| FR-JRN-04 | Learning streak & delete  | Day counts when Learning block and `LEARNING` entry share logical date; soft deletion          |
| FR-TAD-01 | Reflection by verse range | Surah 1 to 114. Last verse not before first. Upper bound 286                                   |
| FR-TAD-02 | Filters in the URL        | Surah and date filters survive reload and back navigation                                      |
| FR-TAD-03 | Soft deletion             | A second delete of the same entry reports not found                                            |

### 9.10 Capture (FR-CAP)

| ID        | Requirement                        | Acceptance                                               |
| --------- | ---------------------------------- | -------------------------------------------------------- |
| FR-CAP-01 | Ideas with Inbox, Active, Archived | Archived ideas excluded from the main list               |
| FR-CAP-02 | Tags                               | Lowercase letters, digits, hyphens. At most ten per idea |
| FR-CAP-03 | Literal search                     | `%` and `_` treated as ordinary characters               |
| FR-CAP-04 | Tag cloud                          | Counts only non-archived ideas                           |

### 9.11 Private space (FR-PRV)

| ID        | Requirement   | Acceptance                                                        |
| --------- | ------------- | ----------------------------------------------------------------- |
| FR-PRV-01 | Six-digit PIN | Hashed with Argon2id and pepper                                   |
| FR-PRV-02 | Lockout       | Five failures trigger a delay that grows with repeated failures   |
| FR-PRV-03 | Session       | HMAC-signed cookie, ten minutes, extended on activity             |
| FR-PRV-04 | Manual lock   | Clears the session immediately                                    |
| FR-PRV-05 | Isolation     | No private data on the dashboard, in notifications, or in exports |
| FR-PRV-06 | Disclosure    | PIN recovery unavailable; stated when the PIN is created          |

### 9.12 Notifications and calendar (FR-NTF, FR-KAL)

Planned for Phase 5. Not implemented.

---

## 10. Interface Requirements

### 10.1 Pages

| Route                 | Purpose                             | Primary data                                         |
| --------------------- | ----------------------------------- | ---------------------------------------------------- |
| `/login`              | Google sign-in                      | Session                                              |
| `/dashboard`          | Bento command center                | Scores, trend, today, output, misses, career, streak |
| `/daily-tracker`      | Calendar timeline, checklist, focus | Blocks, status, snapshot, sessions                   |
| `/weekly-plan`        | Seven day cards                     | Plan items                                           |
| `/projects`           | Board index                         | Boards                                               |
| `/projects/[boardId]` | Trello-style Kanban workspace       | Lists, cards, labels                                 |
| `/career`             | Summary, board, table               | Jobs, events, activities                             |
| `/learning`           | Materials and reviews               | Subjects, items, progress, cards                     |
| `/journal`            | Rich-text journal and tadabur       | Entries, streak, reflections                         |
| `/capture`            | Ideas and tags                      | Ideas, tags                                          |
| `/private`            | Gate and private session            | PIN, session                                         |
| `/settings`           | Preferences                         | Bundle, mode, time zone                              |

### 10.2 Read endpoints (route handlers)

| Method and path                             | Purpose                       |
| ------------------------------------------- | ----------------------------- |
| `GET /api/v1/weekly-plan`                   | Full weekly plan              |
| `GET /api/v1/daily-tracker/blocks`          | Blocks in a date range        |
| `GET /api/v1/daily-tracker/checklist`       | One day's checklist           |
| `GET /api/v1/daily-tracker/scores`          | Daily scores in a range       |
| `GET /api/v1/daily-tracker/history`         | Block history, cursor paged   |
| `GET /api/v1/projects/boards`               | Boards, cursor paged          |
| `GET /api/v1/projects/boards/[boardId]`     | Board, lists, labels          |
| `GET /api/v1/projects/lists/[listId]/cards` | Cards in a list, cursor paged |
| `GET /api/v1/projects/cards/[cardId]`       | Card detail                   |
| `GET /api/v1/career/jobs`                   | Job list (implemented)        |
| `GET /api/v1/career/jobs/[jobId]`           | Job detail with history       |
| `GET /api/v1/career/board`                  | All active jobs               |
| `GET /api/v1/career/summary`                | Summary counts                |
| `GET /api/v1/career/activities`             | Activity counters in a range  |
| `GET /api/v1/learning/subjects`             | Subjects                      |
| `GET /api/v1/learning/items`                | Materials, cursor paged       |
| `GET /api/v1/learning/reviews/due`          | Due review cards              |
| `GET /api/v1/tadabur/entries`               | Reflections, cursor paged     |
| `GET /api/v1/capture/ideas`                 | Ideas, cursor paged           |
| `GET /api/v1/capture/tags`                  | Tag cloud                     |

### 10.3 Write operations

All writes are server actions in `features/*/actions.ts`. They return `ActionResult<T>`, which is either `{ ok: true, data }` or `{ ok: false, code }`.

### 10.4 Response conventions

- Errors: JSON with `error` (stable code) and `message` (fixed text).
- Cursors: base64url of `{ k, id }`, opaque to the client.
- Pages: `items` and `nextCursor`, where `nextCursor` is `null` on the last page.
- Dates: ISO calendar strings. Instants: ISO 8601 with offset.

### 10.5 Browser support

Current versions of Chrome, Edge, Firefox, and Safari. Mobile Safari and Chrome on Android are verified at 390 px.

---

## 11. Testing and Quality

### 11.1 Strategy

| Level           | Tool                          | Scope                                                    | Runs in CI       |
| --------------- | ----------------------------- | -------------------------------------------------------- | ---------------- |
| Domain          | Vitest                        | Pure rules: scoring, time, SM-2, tags, status, positions | Yes              |
| Client          | Vitest                        | Cache policies, throttle, single-flight, persistence     | Yes              |
| UI helpers      | Vitest                        | Delta formatting, sparklines, copy audit                 | Yes              |
| Theme           | Vitest                        | Bundle contrast in both modes                            | Yes              |
| Messages        | Vitest                        | Key parity, placeholders, emoji                          | Yes              |
| Database        | Vitest against PostgreSQL     | Services, repositories, RLS, rate limits                 | Separate command |
| Catalogue audit | Script                        | Unused and missing keys                                  | Manual           |
| Types           | TypeScript                    | Whole project                                            | Yes              |
| Lint            | ESLint with React hooks rules | Whole project                                            | Yes              |
| End-to-end      | Playwright                    | Core flows (pending setup)                               | Planned          |

### 11.2 Coverage of critical rules

| Rule                                    | Test location                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| EWMA recurrence and skipping            | `tests/domain/scoring`                                                         |
| Weekly weighting by slots               | `tests/domain/scoring/checklist.test.ts`                                       |
| Status exclusions (sick, flexible, off) | `tests/domain/scoring/checklist.test.ts`                                       |
| SM-2 sequence and minimum EF            | `tests/domain/learning/sm2.test.ts`                                            |
| Tag normalisation                       | `tests/domain/capture/tags.test.ts`                                            |
| Career follow-up rule                   | `tests/domain/career/status.test.ts`                                           |
| Literal search escaping                 | `tests/server/db/checklist.test.ts`, `tests/server/db/capture-tadabur.test.ts` |
| Simultaneous review locking             | `tests/server/db/learning.test.ts`                                             |
| Cursor round trip and pagination        | `tests/server/db/cursor.test.ts`, module tests                                 |
| RLS coverage and anon denial            | `tests/server/db/rls.test.ts`, `tests/server/db/rls-coverage.test.ts`          |
| Cross-user isolation                    | Module database tests                                                          |
| Time zone validation                    | `tests/time/zone.test.ts`, `tests/server/db/timezone.test.ts`                  |

### 11.3 Last recorded results

| Suite                      | Result                                                                     |
| -------------------------- | -------------------------------------------------------------------------- |
| Unit and UI (`vitest run`) | 46 files passed, 206 tests passed, 73 skipped (database tests not enabled) |
| Database (`test:db`)       | 12 files passed, 77 tests passed                                           |
| Type check                 | Zero errors                                                                |
| Lint                       | Zero errors                                                                |
| Catalogue audit            | No missing keys. Two plural keys reported as unused, retained              |
| Production build           | Not yet recorded                                                           |
| Browser verification       | Partial, see Section 14                                                    |

### 11.4 Quality gates before merge

1. `pnpm typecheck` with zero errors.
2. `pnpm lint` with zero errors.
3. `pnpm vitest run` with all files passing.
4. `pnpm test:db` with all files passing.
5. `pnpm build` completes.
6. The catalogue audit reports no missing keys.
7. Browser verification of the changed module.

### 11.5 Defect severity

| Severity | Definition                                                      | Response                                |
| -------- | --------------------------------------------------------------- | --------------------------------------- |
| S1       | Data loss, cross-user exposure, or private data leak            | Stop release. Fix before any other work |
| S2       | A core flow fails with no workaround                            | Fix before merge                        |
| S3       | A flow fails with a workaround, or visual defect on a core flow | Fix within the batch                    |
| S4       | Cosmetic or copy issue                                          | Schedule                                |

---

## 12. Infrastructure and Operations

### 12.1 Environment topology

| Environment            | Database                                          | Hosting                           | Purpose                              |
| ---------------------- | ------------------------------------------------- | --------------------------------- | ------------------------------------ |
| Local                  | Supabase development project                      | `pnpm dev` on the owner's machine | Development and browser verification |
| Continuous integration | Not used by default. Database tests run on demand | GitHub Actions                    | Lint, types, unit tests, build       |
| Production             | Supabase production project (created fresh)       | Vercel (planned)                  | Live use                             |

### 12.2 Components

| Component                       | Role                            | Status                                                                   |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| Supabase PostgreSQL (Singapore) | Persistent data                 | Active                                                                   |
| Google Cloud OAuth client       | Sign-in                         | Active                                                                   |
| GitHub repository               | Source, branches, pull requests | Active. `main` @ `1ab2bef`; active work on `refactor/v2-ui-architecture` |
| GitHub Actions                  | Quality gates                   | Configured since Phase 0                                                 |
| Branch protection               | Required checks before merge    | Configured                                                               |
| Sentry                          | Error reporting                 | Installed. Inactive without DSN                                          |
| Husky and lint-staged           | Pre-commit formatting           | Active                                                                   |
| Vercel                          | Hosting and cron                | Planned                                                                  |
| Email provider                  | Notifications                   | Not selected                                                             |

### 12.3 Deployment procedure (target)

1. Merge the release branch into `main` after all gates pass.
2. Tag the release (for example `v0.3.0`).
3. Create the production database, apply migrations with `pnpm db:migrate` using the migration connection.
4. Set environment variables in the hosting platform, including `AUTH_SECRET`, `PRIVATE_PIN_PEPPER`, and `ALLOWED_EMAILS`.
5. Deploy. Verify sign-in, one daily entry, and the private gate.
6. Enable error reporting by setting `SENTRY_DSN`.

### 12.4 Backup and recovery

- Supabase daily backups are relied upon. Retention depends on the plan.
- A restore test is recommended monthly, against a non-production project.
- Development data is not part of recovery.

### 12.5 Monitoring

| Signal                             | Source                                   | Action                                        |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Unhandled errors                   | Sentry, when configured                  | Triage by severity (11.5)                     |
| Request volume and rate-limit hits | Structured logs with request identifiers | Adjust budgets if legitimate use is throttled |
| Database health                    | Supabase dashboard                       | Investigate connection saturation             |

### 12.6 Secrets management

- Secrets live in the hosting platform and in `.env.local` on the owner's machine.
- `AUTH_SECRET` and `PRIVATE_PIN_PEPPER` are rotated only with a plan. Rotating the pepper requires re-hashing or a PIN reset.
- No secret appears in logs, documentation, or commits.

### 12.7 Cost and capacity

Single user. Expected load is far below the free or entry tiers of Supabase and Vercel. Scheduled jobs are limited to a few per day when enabled.

---

## 13. Roadmap

### 13.1 Phases

| Phase | Name                       | Objective                                                                       | Exit criteria                                                                           | Status                                 |
| ----- | -------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| 0     | Foundation                 | Repository, authentication, core schema, PIN gate, i18n, theme, CI              | Sign-in works, gate works, tests green                                                  | Complete                               |
| 1     | Daily MVP                  | Tracker, checklist, focus, dashboard, journal                                   | Seven consecutive days logged without defects; three sample days match hand calculation | Built                                  |
| 2     | Plan and career            | Weekly plan, projects, career                                                   | One application followed to its final status with history intact                        | Built                                  |
| 3     | Learning and reflection    | Learning, SM-2, tadabur, capture                                                | Three test cards produce the hand-calculated intervals                                  | Built                                  |
| 3.5   | v2 UI & Security Overhaul  | OKLCH tokens, Bento dashboard, Trello Kanban, Calendar grid, TipTap, CSP/cipher | Browser audit complete; all v2 batches verified cleanly                                 | Active (`refactor/v2-ui-architecture`) |
| 4     | Private space complete     | Recovery log, reflection analytics                                              | Access tests pass; no private data reaches shared endpoints                             | Planned                                |
| 5     | Notifications and calendar | Outbox, email, in-app, calendar read then write                                 | Seven days of testing with no duplicate reminders                                       | Planned                                |
| 6     | Review and calibration     | Weekly and monthly reviews; constant calibration                                | Constant changes recorded with data-based reasons                                       | Planned                                |
| 7     | Expansion                  | Full Indonesian coverage, theme editor, data export                             | Phases 0 to 6 stable                                                                    | Considered                             |

### 13.2 Batch history (redesign v1 — merged in PR #4)

| Batch | Scope                                                        | Status   |
| ----- | ------------------------------------------------------------ | -------- |
| R0    | Design decisions                                             | Complete |
| R1    | Colour bundles and contrast validation                       | Complete |
| R2    | Glass UI primitives                                          | Complete |
| R3    | Data layer: query client, cache, debounce, throttle, cursors | Complete |
| R4    | Shell: sidebar, account menu, mobile navigation              | Complete |
| R5    | Weekly plan                                                  | Complete |
| R6a   | Checklist data, snapshots, scoring, history, focus           | Complete |
| R6b   | Daily tracker interface                                      | Complete |
| R7a   | Projects data                                                | Complete |
| R7b   | Projects interface                                           | Complete |
| R8a   | Capture and tadabur data                                     | Complete |
| R8b   | Career data                                                  | Complete |
| R8c   | Learning data                                                | Complete |
| R8d   | Journal and tadabur interface                                | Complete |
| R8e   | Capture, career, learning interfaces; shim removal           | Complete |
| R9a   | Private space                                                | Complete |
| R9b   | Time zone and dashboard                                      | Complete |
| R9c   | Settings time zone and final checks                          | Complete |

### 13.3 Decisions required before Phase 4

1. Full Phase 4 scope, or staged delivery.
2. Whether the private flame has a minimum visible level.
3. Email provider for Phase 5.
4. Whether a passkey is added beside the PIN.

### 13.4 Long-term direction

The product stays single-user. Its value is in the quality of its records and explanations, not in feature volume. Growth is measured by sustained logging and by whether the figures help the owner decide, not by the number of modules.

---

## 14. Current Status

**As of 24 November 2026.**

### 14.1 Summary

Foundation, data layer, and v1 interfaces through Phase 3 are built and merged into `main` at commit `1ab2bef` (PR #4). Active work on `refactor/v2-ui-architecture` begins with a strict read-only codebase and browser audit to produce `docs/AUDIT-FINDINGS.md` and `docs/MASTER-REFACTOR-PLAN.md` before executing the v2 UI and security overhaul.

### 14.2 Verification status

| Check                  | Result                           |
| ---------------------- | -------------------------------- |
| Type check             | Zero errors (baseline `1ab2bef`) |
| Lint                   | Zero errors (baseline `1ab2bef`) |
| Unit and UI tests      | Passing (baseline `1ab2bef`)     |
| Database tests         | Passing (baseline `1ab2bef`)     |
| Catalogue audit        | Clean                            |
| Legacy import search   | Clean                            |
| `new Date()` in `app/` | Clean                            |
| Production build       | Pending verification (`T3`)      |
| Browser verification   | Pending full v2 audit (`T4`)     |

### 14.3 Open items

| ID  | Item                      | Status / Impact                                     | Action                                                                    |
| --- | ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| T1  | `GET /api/v1/career/jobs` | **Resolved** (`eee3dae`, merged in `1ab2bef`)       | Closed                                                                    |
| T2  | Sign-out action location  | **Resolved** (`eee3dae`, merged in `1ab2bef`)       | Closed                                                                    |
| T3  | Production build          | Deployment risk                                     | Run `pnpm build` and record the result                                    |
| T4  | Browser verification      | Regressions and v2 UI gaps                          | Audit `/dashboard`, `/daily-tracker`, `/projects`, `/journal`, `/private` |
| T5  | Remote branch             | **Resolved** (`refactor/redesign` pushed & merged)  | Closed                                                                    |
| T6  | Pull request to `main`    | **Resolved** (PR #4 merged into `main` @ `1ab2bef`) | Closed                                                                    |

### 14.4 Technical debt

| ID  | Item                                                  | Priority     | Plan                                                                         |
| --- | ----------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| U1  | Obsolete habit error code (`HABIT_ARCHIVED`)          | Low          | Remove from error codes and status map                                       |
| U2  | Prop named `todayIso` in daily tracker components     | Low          | Rename to `today`                                                            |
| U3  | Board list capped at 500 without pagination           | Medium       | Add pagination when the cap approaches                                       |
| U4  | Learning streak reads all history                     | Medium       | Limit to the last 366 days                                                   |
| U5  | Balance score computed but not shown                  | Low          | Show in Phase 6, or remove                                                   |
| U6  | Streak fire component not on the journal card         | Low          | Mount `Fire` in `StreakCard`                                                 |
| U7  | Review cards not linked to materials in the UI        | Low          | Add a material selector to the card dialog                                   |
| U8  | No end-to-end tests                                   | High         | Configure `playwright.config.ts` and write 5 core flows                      |
| U9  | Column cipher stub (`server/crypto/column-cipher.ts`) | High         | Implement AES-256-GCM authenticated encryption in v2 Batch 1                 |
| U10 | Cron auth and scheduled route stubs                   | Medium       | Add `crypto.timingSafeEqual` in `server/cron/auth.ts` and mark stubs         |
| U11 | Security headers and CSP nonces                       | High         | Enforce per-request CSP nonces in `proxy.ts` and headers in `next.config.ts` |
| U12 | Account export and erasure missing                    | High         | Add before any use beyond personal                                           |
| U13 | Notification settings missing                         | Low          | Add in Phase 5                                                               |
| U14 | Build artifacts in working tree                       | **Resolved** | Cleaned and untracked in `eee3dae`                                           |
| U15 | Legacy redirects are temporary                        | Low          | Make permanent once stable                                                   |
| U16 | Remote branch backup                                  | **Resolved** | Merged into `main` @ `1ab2bef`                                               |

---

## 15. Risks, Debt, and Open Decisions

### 15.1 Risks

| ID   | Risk                                                | Likelihood | Impact | Mitigation                                                       |
| ---- | --------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------- |
| R-01 | Browser regressions after the refactor              | Medium     | High   | Browser verification per module before merge                     |
| R-02 | Production build fails                              | Medium     | High   | Run the build before merge (T3)                                  |
| R-03 | Six-digit PIN offers limited resistance to guessing | Medium     | High   | Lockout, Argon2id, and a later passkey option                    |
| R-04 | PIN cannot be recovered                             | Low        | High   | Disclosed at creation; accepted for version 1                    |
| R-05 | Dependence on a single database provider            | Low        | High   | Daily backups; restore test; export planned                      |
| R-06 | Scoring weights differ from real behaviour          | High       | Medium | Calibration after four to six weeks of data                      |
| R-07 | Schema drift outside migrations                     | Low        | High   | Migrations only; sorting script; applied migrations never edited |
| R-08 | Beta dependency (`next-auth` 5.0.0-beta.32) changes | Medium     | Medium | Pin exact version; review on upgrade                             |
| R-09 | Pooler incompatibility with prepared statements     | Low        | Medium | `prepare: false` enforced                                        |
| R-10 | Contrast degradation or blur jank on glass surfaces | Medium     | Medium | Cap `backdrop-filter` to 2 layers; use solid stepped cards       |
| R-11 | XSS via rich-text journal HTML                      | Medium     | High   | Sanitize all TipTap HTML output with `DOMPurify`                 |

### 15.2 Open decisions

| ID  | Decision                            | Options                             | Owner's input            |
| --- | ----------------------------------- | ----------------------------------- | ------------------------ |
| D1  | Scope of Phase 4                    | Full, or staged                     | Pending                  |
| D2  | Minimum visible flame level         | Yes, or no                          | Pending                  |
| D3  | Email provider                      | Resend, Postmark, other             | Pending                  |
| D4  | Passkey beside PIN                  | Add later, or not                   | Pending                  |
| D5  | Hosting                             | Vercel, or other                    | Pending                  |
| D6  | Target of five of seven logged days | Accept, or revise                   | Pending                  |
| D7  | Merge timing for v1 refactor        | Already merged in PR #4 (`1ab2bef`) | **Resolved** (`1ab2bef`) |

### 15.3 Assumptions to revisit

- Single-user operation remains true.
- Supabase free or entry tier is sufficient.
- Google sign-in remains the only identity provider.

---

## 16. Glossary and References

### 16.1 Glossary

| Term               | Definition                                        |
| ------------------ | ------------------------------------------------- |
| Batch              | A verified unit of redesign work                  |
| Bundle             | A named base palette, such as Ocean               |
| Calibration        | Period before comparisons appear                  |
| Checklist snapshot | Frozen copy of a day's checklist                  |
| Core item          | A required item that also applies on off days     |
| DomainError        | Expected failure with a stable code               |
| EWMA               | Exponentially weighted moving average             |
| Logical day        | Calendar date in the user's zone                  |
| OKLCH              | Perceptually uniform colour space (`L C H`)       |
| RLS                | Row-level security                                |
| Seed               | A base colour value from which tokens are derived |
| SM-2               | Spaced-repetition algorithm                       |
| Soft delete        | Marking a record deleted while keeping it         |
| WIP                | Work in progress                                  |

### 16.2 Standards and sources

- W3C, _Web Content Accessibility Guidelines 2.2_.
- W3C, _Media Queries Level 5_.
- W3C, _Web Storage and Cookies_ guidance on sensitive data.
- Indonesia, _Undang-Undang Nomor 27 Tahun 2022_.
- European Union, _General Data Protection Regulation_, Articles 5 and 17.
- ISO/IEC 25010:2011, product quality model. Used to structure NFRs: performance, security, reliability, maintainability, portability.
- IEEE/ISO/IEC 29148:2018, requirements engineering. Used to structure this document.
- Woźniak, P. A. (1987). SuperMemo SM-2.
- Anderson, D. J. (2010). _Kanban_.
- Kluger, A. N., & DeNisi, A. (1996). _Psychological Bulletin_, 119(2).
- Lally, P., et al. (2010). _European Journal of Social Psychology_, 40(6).
- Vendor documentation listed in Section 1.4.

---

_End of document._
