# Fyura Productivity: Product Requirements and Software Specification

| Attribute     | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Document      | PRD and SRS, combined                                                |
| Version       | 2.0 (living document)                                                |
| Date          | 20 November 2026                                                     |
| Status        | Draft for owner review                                               |
| Owner         | Repository owner (single user)                                       |
| Repository    | github.com/naufallariff/fyura-productivity                           |
| Active branch | `refactor/redesign`                                                  |
| Languages     | English (interface and this document), Indonesian (locale catalogue) |

## Revision History

| Version | Date        | Change                                                                                               |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| 1.0     | 20 Nov 2026 | First combined draft                                                                                 |
| 2.0     | 20 Nov 2026 | Adds design system, UI architecture, token model, palette specification, and full technical baseline |

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

This document specifies what Fyura Productivity must do, how it is built, and how its quality is verified. It serves three readers: the owner deciding priorities, the engineer implementing a batch, and the reviewer checking whether a batch is complete.

### 1.2 Scope

Fyura Productivity is a personal, single-user web application. It replaces a Google Apps Script system that could not be extended safely. The application covers daily time tracking, derived checklists, consistency scoring, planning, project boards, job applications, spaced-repetition learning, journaling, reflection, idea capture, and a private space protected by a second credential.

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
- Vendor documentation: Next.js 16, Auth.js, Drizzle ORM, Supabase, TanStack Query, dnd-kit, Tailwind CSS 4, Zod 4.

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

| Module         | Capabilities                                                                         | Build status                        |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| Authentication | Google sign-in, allowlist, 30-day session, client cache cleared on sign-out          | Built                               |
| Settings       | Colour bundle, mode, time zone with device suggestion                                | Built                               |
| Weekly plan    | Seven day cards, required and optional items, ordering                               | Built                               |
| Daily tracker  | Timeline, status, checklist, focus timer, history                                    | Built, browser verification partial |
| Dashboard      | Consistency, trend, today, output, frequent misses, career, learning streak          | Built, browser verification pending |
| Projects       | Boards, lists, cards, labels, checklists, due dates, drag, filters                   | Built                               |
| Career         | Board, table, status history, follow-ups, activity counters, summary                 | Built, one route pending (see 14.3) |
| Learning       | Subjects with WIP warning, materials, daily progress, two-step deletion, SM-2 review | Built                               |
| Journal        | Entries by type, late marking, learning streak, reflection tab                       | Built                               |
| Capture        | Ideas, statuses, tags, literal search, tag cloud                                     | Built                               |
| Private space  | PIN gate, lockout, session, idle guard                                               | Built, browser verification pending |

**Not yet built:** recovery log, reflection analytics, notifications, calendar synchronisation, weekly and monthly reviews, data export, account deletion, keyboard shortcuts for global capture.

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
| US-11 | write a journal entry and see my learning streak | my effort is visible and honest            |
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
/dashboard                    Consistency, trend, today, output, misses, career, streak
/daily-tracker                Timeline, checklist, focus timer, history
/weekly-plan                  Seven-day plan
/projects                     Board index
/projects/[boardId]           Board workspace
/career                       Summary, board, table
/learning                     Materials tab, reviews tab
/journal                      Journal tab, tadabur tab
/capture                      Ideas and tags
/private                      PIN gate, then private session
/settings                     Colour bundle, mode, time zone
```

Legacy routes (`/today`, `/habits`, `/focus`, `/calendar`, `/plan`, `/review`, `/tadabur`, `/notifications`) redirect temporarily through `next.config.ts`.

### 3.2 Navigation model

The shell has three sections, identified in the sidebar with a small uppercase label. On desktop the sidebar is fixed and collapsible. On mobile a bottom bar carries the four primary destinations, and a "More" sheet carries the rest.

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
4. Record blocks by dragging on the timeline or using the block dialog.
5. Start a focus session if needed. A completed deep-work session adds a block.
6. Write a learning journal entry when relevant. The streak updates on the dashboard.

**Weekly flow.**

1. Open Weekly Plan. Review each weekday's items.
2. Open the dashboard. Compare this week with last week, and check frequent misses.

**Project flow.**

1. Create a board. Add lists and cards.
2. Move cards with a drag, or use the card dialog on narrow screens.
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

Every module defines three states, and each is designed rather than left to default:

- **Empty:** explains the next useful action in one sentence.
- **Loading:** a skeleton of the final layout, with `aria-busy` set.
- **Error:** a message with a retry action. The message names the failure without blaming the user.

---

## 4. Design System

### 4.1 Design principles

| Principle | Expression                                                       |
| --------- | ---------------------------------------------------------------- |
| Calm      | Low contrast surfaces, generous spacing, no sudden motion        |
| Precise   | Tabular numerals for all figures, consistent alignment           |
| Honest    | Numbers always accompanied by their meaning                      |
| Tactile   | Immediate press feedback, springs that respect momentum          |
| Inclusive | WCAG 2.2 AA, reduced motion, reduced transparency, 44 px targets |

### 4.2 Visual language: glass

The interface uses a glass material. Surfaces are semi-transparent with a backdrop blur, a hairline border, and a soft shadow. The material is applied through a single `glass` utility, so every surface can be adjusted in one place.

Glass is used for cards, panels, sheets, and the sidebar. Dialogs use the same material on a dimmed backdrop. Text is never placed directly on a blurred background without a solid or near-solid surface behind it.

### 4.3 Colour bundles

A bundle defines the base palette for backgrounds, accents, and glow. Three bundles ship:

| Bundle          | Character            | Use                      |
| --------------- | -------------------- | ------------------------ |
| Ocean (default) | Cool blue, clear     | General use              |
| Sage            | Muted green, quiet   | Low-stimulation sessions |
| Dusk            | Warm violet, evening | Night use                |

A bundle changes the background, glow, and accent only. Text colours and status colours are fixed across all bundles, so meaning never depends on the chosen bundle.

### 4.4 Modes

Two modes exist: **light** (default) and **dark**. There is no "follow system" option, because the owner chose a deliberate default. Mode and bundle are stored per account and applied before first paint through server-rendered data attributes.

### 4.5 Token architecture

Tokens are defined in three layers. Components read only the semantic layer.

| Layer     | Purpose                               | Example                                           |
| --------- | ------------------------------------- | ------------------------------------------------- |
| Primitive | Raw values from the palette generator | `ocean-600: #1a6fa3`                              |
| Semantic  | Role in the interface                 | `--color-accent`, `--color-ink`, `--color-canvas` |
| Component | Usage in a component                  | `button.primary.bg`                               |

The semantic layer is generated from each bundle's seed values. Seeds are: canvas, glow (two stops), accent, and the ink ramp. Derived values such as hover, border, and muted ink are computed by `lib/theme/derive.ts`.

### 4.6 Palette specification

#### 4.6.1 Mode constants

These values are fixed across bundles.

| Token               | Light                  | Dark                      | Purpose                |
| ------------------- | ---------------------- | ------------------------- | ---------------------- |
| `--color-ink`       | `#0b1d2e`              | `#eef4f8`                 | Primary text           |
| `--color-ink-muted` | `#4f6375`              | `#9fb1c2`                 | Secondary text         |
| `--color-negative`  | `#b42318`              | `#f97066`                 | Errors and overdue     |
| `--color-positive`  | `#067647`              | `#4ade80`                 | Completion             |
| `--color-warning`   | `#b54708`              | `#fdb022`                 | Due today and cautions |
| `--color-line`      | `rgb(11 29 46 / 0.12)` | `rgb(238 244 248 / 0.14)` | Hairline borders       |

#### 4.6.2 Bundle seeds

| Seed   | Ocean light | Ocean dark | Sage light | Sage dark | Dusk light | Dusk dark |
| ------ | ----------- | ---------- | ---------- | --------- | ---------- | --------- |
| Canvas | `#eef6fb`   | `#07131f`  | `#f1f6f1`  | `#0b1510` | `#f6f3fb`  | `#120d1d` |
| Glow A | `#8ec9ea`   | `#1d4f78`  | `#a9d3b4`  | `#2b5a3f` | `#c5b4e6`  | `#3e2f63` |
| Glow B | `#c3e4f5`   | `#144061`  | `#d3ead9`  | `#1f4632` | `#e3d9f3`  | `#2a1f47` |
| Accent | `#1a6fa3`   | `#5ab4e6`  | `#2e7d4f`  | `#6fc795` | `#6b4fb3`  | `#a58ae0` |

#### 4.6.3 Derived tokens

| Token                   | Derivation                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `--color-accent-soft`   | Accent at 14 percent alpha over the glass surface                                  |
| `--color-accent-strong` | Accent darkened by 12 percent (light) or lightened by 12 percent (dark)            |
| `--glass-bg`            | Surface at 72 percent alpha (light) or 42 percent (dark)                           |
| `--glass-solid`         | Surface blended with canvas at 92 percent, for text areas and reduced transparency |
| `--glass-border`        | White at 60 percent (light) or 12 percent (dark)                                   |

#### 4.6.4 Contrast requirements

Every text token must meet its ratio against the surface it sits on:

| Pair                      | Minimum ratio | Standard                             |
| ------------------------- | ------------- | ------------------------------------ |
| Ink on glass-solid        | 4.5 : 1       | WCAG 2.2 AA, normal text             |
| Ink-muted on glass-solid  | 4.5 : 1       | WCAG 2.2 AA, normal text             |
| Accent on canvas          | 3 : 1         | WCAG 2.2 AA, non-text and large text |
| Text on accent (button)   | 4.5 : 1       | WCAG 2.2 AA                          |
| Negative and warning text | 4.5 : 1       | WCAG 2.2 AA                          |

`lib/theme/validate.ts` checks each bundle in both modes. The check runs in unit tests, so a palette that fails cannot merge.

#### 4.6.5 Category hues

Measured categories and the block timeline use hue tokens, separate from the bundle accent, so colour carries category meaning:

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

Each hue has a deep and a bright variant. Category colour is never the only signal: every block also carries its label.

### 4.7 Typography

| Role              | Size        | Weight | Tracking                            | Leading |
| ----------------- | ----------- | ------ | ----------------------------------- | ------- |
| Display (figures) | 40 to 72 px | 600    | -0.04 em                            | 1.05    |
| Page title        | 24 to 30 px | 600    | -0.02 em                            | 1.2     |
| Section title     | 14 px       | 600    | 0                                   | 1.4     |
| Body              | 14 to 16 px | 400    | 0                                   | 1.5     |
| Label and caption | 11 to 12 px | 500    | 0.02 em, uppercase for group labels | 1.4     |

Figures use tabular numerals (`tabular-nums`) so columns align. The type stack is the system UI stack, with the font loaded only if the system stack is insufficient.

Body text on phones is 16 px to prevent automatic zoom on input focus.

### 4.8 Spacing, radius, and elevation

| Token          | Value                      | Use                         |
| -------------- | -------------------------- | --------------------------- |
| Spacing scale  | 4 px base (Tailwind scale) | All gaps and padding        |
| Radius control | 14 px                      | Buttons, inputs, list items |
| Radius card    | 22 px                      | Panels and cards            |
| Radius sheet   | 28 px (top corners)        | Mobile sheets               |
| Radius pill    | 999 px                     | Chips and status pills      |
| Shadow raised  | 0 8 24 rgb(0 0 0 / 0.08)   | Floating glass              |

### 4.9 Iconography

Icons come from Lucide (`lucide-react`) at stroke width 1.75. Sizes: 16 px in dense rows, 18 px in buttons, 20 px in navigation. Icon-only buttons always carry an accessible name. Text in the interface contains no symbols, arrows, or emoji.

### 4.10 Motion

| Interaction           | Duration or model                | Property                    |
| --------------------- | -------------------------------- | --------------------------- |
| Press feedback        | Scale to 0.97 or 0.90, immediate | `transform`                 |
| Sidebar collapse      | 300 ms, spring easing            | `width` (layout transition) |
| Card and item reorder | Library default                  | `transform`                 |
| Pin entry             | 300 ms                           | `transform`, `opacity`      |
| Session ring          | 1 s linear                       | `stroke-dashoffset`         |

Rules:

- Animate only `transform` and `opacity` where possible.
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- `prefers-reduced-motion: reduce` removes transforms and keeps opacity changes.
- `prefers-reduced-transparency: reduce` replaces glass with solid surfaces and disables backdrop blur.

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

| Family          | Components                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces        | `Card`, `CardHeader`, `Panel` (pattern), `Dialog` (native, bottom sheet on mobile)                                                |
| Controls        | `Button` (primary, secondary, ghost, danger, pending state), `Field`, `Input`, `Textarea`, `Segmented`, `TabNav`                  |
| Data display    | `KpiCard`, `Sparkline`, `Ring`, `ProgressBar`, `Pill`, `Avatar`                                                                   |
| Feedback        | `EmptyState`, `Skeleton`, `PageSkeleton`, `Tooltip`                                                                               |
| Shell           | `Sidebar`, `SidebarProfile`, `MobileNav`, `PageHeader`, `PageFrame`, `SignOutButton`                                              |
| Module-specific | Timeline grid, block card, mini month, checklist row, board, list column, card face, job card, streak fire, pin pad, session ring |

Every primitive accepts an accessible label and forwards refs where a library needs them.

### 4.13 Accessibility

| Requirement                     | Implementation                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Keyboard operation              | Every action reachable by Tab. Drag has keyboard sensors and a dialog alternative     |
| Focus visibility                | Two-pixel accent ring on `:focus-visible`                                             |
| Touch targets                   | Minimum 44 px in both dimensions                                                      |
| Names                           | Icon-only buttons have `aria-label`. Form fields have associated labels               |
| Live regions                    | Validation and save results use `role="status"` or `role="alert"`                     |
| Current state                   | `aria-current` on navigation, `aria-pressed` on toggles, `aria-checked` on checkboxes |
| Language                        | `lang` set on the document. Locale-aware formatting                                   |
| Skip link                       | First focusable element jumps to main content                                         |
| Contrast                        | Enforced by unit tests on every bundle and mode                                       |
| Reduced motion and transparency | Honoured through media queries                                                        |

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

| Layer                      | Package                                              | Version                 |
| -------------------------- | ---------------------------------------------------- | ----------------------- |
| Framework                  | next                                                 | 16.4.5                  |
| UI runtime                 | react, react-dom                                     | 19.3.0                  |
| Language                   | typescript                                           | ^5                      |
| Styling                    | tailwindcss, @tailwindcss/postcss                    | ^4, ^4.3.5              |
| Turbopack styling          | @tailwindcss/turbopack                               | ^4                      |
| Authentication             | next-auth                                            | 5.0.0-beta.32           |
| Database client            | postgres                                             | ^3.4.9                  |
| ORM                        | drizzle-orm                                          | ^0.45.4                 |
| Migrations                 | drizzle-kit                                          | ^0.31.11                |
| Validation                 | zod                                                  | ^4.6.7                  |
| PIN hashing                | @node-rs/argon2                                      | ^2.2.2                  |
| Server state               | @tanstack/react-query                                | ^5.107.1                |
| Drag and drop              | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities | ^6.3.1, ^10.0.0, ^3.2.2 |
| Icons                      | lucide-react                                         | ^1.70.0                 |
| Error reporting            | @sentry/nextjs                                       | ^11.11.0                |
| Environment                | dotenv                                               | ^18.0.9                 |
| Server-only guard          | server-only                                          | ^0.0.1                  |
| Unit and integration tests | vitest, @vitest/coverage-v8                          | ^5.1.0                  |
| Linting                    | eslint, eslint-config-next                           | ^9, 16.4.5              |
| Formatting                 | prettier, prettier-plugin-tailwindcss                | ^3.9.10, ^0.8.1         |
| Git hooks                  | husky, lint-staged                                   | ^9.1.7, ^17.6.0         |
| Script runner              | tsx                                                  | ^4.23.15                |
| Cross-platform env         | cross-env                                            | ^10.1.0                 |
| Package manager            | pnpm                                                 | 12.18.0                 |
| Runtime types              | @types/node, @types/react, @types/react-dom          | ^22.20.5, ^19, ^19      |

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
| Account                                    | Not yet available        | Planned (see 15.2, U12)                             |

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
| Injection through input                       | All data      | Parameterised queries, strict Zod schemas                |
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

| Control        | Requirement                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| PIN format     | Exactly six digits                                                                                       |
| Storage        | Argon2id hash with pepper from `PRIVATE_PIN_PEPPER`. The plaintext is never stored                       |
| Lockout        | After five failures, a delay that grows with repeated failures. Failure count resets on success          |
| Session        | HMAC-signed cookie valid for ten minutes, extended on activity                                           |
| Idle guard     | Pings the server on user activity, at most once per minute. Returns to the gate when the session expires |
| Manual lock    | Clears the session cookie immediately                                                                    |
| Data isolation | No private table is read by the dashboard, reviews, or any shared service                                |
| Disclosure     | PIN recovery is not available in version 1. This is stated on the creation screen                        |

### 7.7 Input and output

- Every boundary validates input with a Zod schema in strict mode, so unknown fields are rejected.
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

### 7.10 Headers (target)

| Header                    | Value                                       | Status                   |
| ------------------------- | ------------------------------------------- | ------------------------ |
| Content-Security-Policy   | Restrictive, with nonces for inline scripts | Target, not yet verified |
| X-Frame-Options           | `DENY`                                      | Target                   |
| Referrer-Policy           | `strict-origin-when-cross-origin`           | Target                   |
| Strict-Transport-Security | Set by the hosting platform                 | Platform                 |

Adding these in `next.config.ts` is tracked as U11.

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
| NFR-02 | Performance     | Animation uses `transform` and `opacity` only                                 | Code review                               |
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
| FR-DTK-02 | Create a time block             | Overlapping blocks on the same day are refused                                                                         |
| FR-DTK-03 | Move and resize a block         | Snap to 15 minutes. Overlap refused and the change rolls back                                                          |
| FR-DTK-04 | Block across midnight           | Stored as two linked rows. Edited as a pair in the dialog                                                              |
| FR-DTK-05 | Daily checklist                 | A check writes the desired state, not a toggle. The first check freezes the day                                        |
| FR-DTK-06 | Focus timer                     | Durations 1 to 240 minutes. Session always recorded. Completed deep-work sessions add a block when it does not overlap |
| FR-DTK-07 | History                         | Filters for date, category, and text. Literal text search. Pages of 25                                                 |
| FR-DTK-08 | Category filter on the timeline | Unselected categories are dimmed, not hidden                                                                           |

### 9.5 Dashboard (FR-DSB)

| ID        | Requirement                 | Acceptance                                                             |
| --------- | --------------------------- | ---------------------------------------------------------------------- |
| FR-DSB-01 | Weekly consistency          | Share of required items completed on recorded days                     |
| FR-DSB-02 | 30-day trend                | EWMA with alpha 0.25 over daily ratios; days without a plan skipped    |
| FR-DSB-03 | Calibration                 | Comparisons hidden until seven recorded days                           |
| FR-DSB-04 | Frequent unchecked items    | Counted only on Normal days, over the last seven days; neutral wording |
| FR-DSB-05 | No private data             | The dashboard service reads no private table                           |
| FR-DSB-06 | Explanation for each figure | Each figure has an accompanying sentence                               |

### 9.6 Projects (FR-PRJ)

| ID        | Requirement              | Acceptance                                                               |
| --------- | ------------------------ | ------------------------------------------------------------------------ |
| FR-PRJ-01 | Boards, lists, cards     | A card belongs to one list at a time                                     |
| FR-PRJ-02 | Move cards and lists     | Positions computed by the server. Optimistic update with rollback        |
| FR-PRJ-03 | Labels belong to a board | A label from another board is refused                                    |
| FR-PRJ-04 | Due dates                | Status: none, complete, overdue, today, or upcoming                      |
| FR-PRJ-05 | Card checklists          | Progress shown on the card                                               |
| FR-PRJ-06 | Filters and dragging     | Dragging disabled while a filter is active                               |
| FR-PRJ-07 | Archive                  | Boards, lists, and cards archive. No permanent deletion in the interface |

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

| ID        | Requirement               | Acceptance                                                                     |
| --------- | ------------------------- | ------------------------------------------------------------------------------ |
| FR-JRN-01 | Entries by date and type  | Five types. Body required                                                      |
| FR-JRN-02 | Late marking              | Marked when written more than one day after its date. Never refused            |
| FR-JRN-03 | Learning streak           | A day counts when a Learning block and a LEARNING entry share the logical date |
| FR-JRN-04 | Deletion                  | Soft                                                                           |
| FR-TAD-01 | Reflection by verse range | Surah 1 to 114. Last verse not before first. Upper bound 286                   |
| FR-TAD-02 | Filters in the URL        | Surah and date filters survive reload and back navigation                      |
| FR-TAD-03 | Soft deletion             | A second delete of the same entry reports not found                            |

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
| `/dashboard`          | Summary of the week                 | Scores, trend, today, output, misses, career, streak |
| `/daily-tracker`      | Timeline, checklist, focus, history | Blocks, status, snapshot, sessions                   |
| `/weekly-plan`        | Seven day cards                     | Plan items                                           |
| `/projects`           | Board index                         | Boards                                               |
| `/projects/[boardId]` | Board workspace                     | Lists, cards, labels                                 |
| `/career`             | Summary, board, table               | Jobs, events, activities                             |
| `/learning`           | Materials and reviews               | Subjects, items, progress, cards                     |
| `/journal`            | Journal and tadabur                 | Entries, streak, reflections                         |
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
| `GET /api/v1/career/jobs`                   | Job list (pending, see 14.3)  |
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
| End-to-end      | Playwright                    | Core flows                                               | Not yet written  |

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

| Component                       | Role                            | Status                                                   |
| ------------------------------- | ------------------------------- | -------------------------------------------------------- |
| Supabase PostgreSQL (Singapore) | Persistent data                 | Active                                                   |
| Google Cloud OAuth client       | Sign-in                         | Active                                                   |
| GitHub repository               | Source, branches, pull requests | Active. Branches: `main`, `phase-1`, `refactor/redesign` |
| GitHub Actions                  | Quality gates                   | Configured since Phase 0. Current status not recorded    |
| Branch protection               | Required checks before merge    | Configured. Required check names to be verified          |
| Sentry                          | Error reporting                 | Installed. Inactive without DSN                          |
| Husky and lint-staged           | Pre-commit formatting           | Active                                                   |
| Vercel                          | Hosting and cron                | Planned                                                  |
| Email provider                  | Notifications                   | Not selected                                             |

### 12.3 Deployment procedure (target)

1. Merge the release branch into `main` after all gates pass.
2. Tag the release (for example `v0.2.0`).
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

| Phase | Name                       | Objective                                                          | Exit criteria                                                                           | Status                                  |
| ----- | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------- |
| 0     | Foundation                 | Repository, authentication, core schema, PIN gate, i18n, theme, CI | Sign-in works, gate works, tests green                                                  | Complete                                |
| 1     | Daily MVP                  | Tracker, checklist, focus, dashboard, journal                      | Seven consecutive days logged without defects; three sample days match hand calculation | Built. Browser verification in progress |
| 2     | Plan and career            | Weekly plan, projects, career                                      | One application followed to its final status with history intact                        | Built                                   |
| 3     | Learning and reflection    | Learning, SM-2, tadabur, capture                                   | Three test cards produce the hand-calculated intervals                                  | Built                                   |
| 4     | Private space complete     | Recovery log, reflection analytics                                 | Access tests pass; no private data reaches shared endpoints                             | Planned                                 |
| 5     | Notifications and calendar | Outbox, email, in-app, calendar read then write                    | Seven days of testing with no duplicate reminders                                       | Planned                                 |
| 6     | Review and calibration     | Weekly and monthly reviews; constant calibration                   | Constant changes recorded with data-based reasons                                       | Planned                                 |
| 7     | Expansion                  | Full Indonesian coverage, theme editor, data export                | Phases 0 to 6 stable                                                                    | Considered                              |

### 13.2 Batch history (redesign)

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

**As of 20 November 2026.**

### 14.1 Summary

Foundation, data layer, and interface for all planned modules through Phase 3 are built. Private gate, dashboard, and time zone are built. Automated checks pass. Remaining work is browser verification of several modules, a production build record, two missing routes or verifications, and Phases 4 to 6.

### 14.2 Verification status

| Check                  | Result      |
| ---------------------- | ----------- |
| Type check             | Zero errors |
| Lint                   | Zero errors |
| Unit and UI tests      | Passing     |
| Database tests         | Passing     |
| Catalogue audit        | Clean       |
| Legacy import search   | Clean       |
| `new Date()` in `app/` | Clean       |
| Production build       | Pending     |
| Browser verification   | Partial     |

### 14.3 Open items

| ID  | Item                      | Impact                                               | Action                                                                                                            |
| --- | ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| T1  | `GET /api/v1/career/jobs` | Career table cannot load                             | Route added in a recent commit; confirm it is present and that `app/api/v1/jobs/route.ts` is removed if it exists |
| T2  | Sign-out action location  | Sign-out may fail if imports point to a missing file | Confirm `features/auth/actions.ts` exists, or that the import resolves                                            |
| T3  | Production build          | Deployment risk                                      | Run `pnpm build` and record the result                                                                            |
| T4  | Browser verification      | Regressions undetected                               | Verify dashboard, private gate, time zone, and daily tracker                                                      |
| T5  | Remote branch             | Local work not backed up                             | Push `refactor/redesign`                                                                                          |
| T6  | Pull request to `main`    | Refactor not yet integrated                          | Open after CI passes                                                                                              |

### 14.4 Technical debt

| ID  | Item                                              | Priority | Plan                                                                     |
| --- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| U1  | Obsolete habit error code (`HABIT_ARCHIVED`)      | Low      | Remove from error codes and status map                                   |
| U2  | Prop named `todayIso` in daily tracker components | Low      | Rename to `today`                                                        |
| U3  | Board list capped at 500 without pagination       | Medium   | Add pagination when the cap approaches                                   |
| U4  | Learning streak reads all history                 | Medium   | Limit to the last 366 days                                               |
| U5  | Balance score computed but not shown              | Low      | Show in Phase 6, or remove                                               |
| U6  | Streak fire component not on the journal card     | Low      | Mount `Fire` in `StreakCard`                                             |
| U7  | Review cards not linked to materials in the UI    | Low      | Add a material selector to the card dialog                               |
| U8  | No end-to-end tests                               | High     | Write five flows: sign-in, log a block, board, application, private gate |
| U9  | Column cipher not yet used                        | Medium   | Apply to private fields in Phase 4                                       |
| U10 | Scheduled route handlers are stubs                | Medium   | Mark as stubs or remove before deployment                                |
| U11 | Security headers not verified                     | High     | Add in `next.config.ts` and verify                                       |
| U12 | Account export and erasure missing                | High     | Add before any use beyond personal                                       |
| U13 | Notification settings missing                     | Low      | Add in Phase 5                                                           |
| U14 | Build artifacts in working tree                   | Low      | Confirm ignored and untracked                                            |
| U15 | Legacy redirects are temporary                    | Low      | Make permanent once stable                                               |
| U16 | Branch not yet pushed                             | High     | Push                                                                     |

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
| R-10 | Accessibility regressions in glass surfaces         | Medium     | Medium | Reduced-transparency rule; manual audit                          |

### 15.2 Open decisions

| ID  | Decision                            | Options                            | Owner's input |
| --- | ----------------------------------- | ---------------------------------- | ------------- |
| D1  | Scope of Phase 4                    | Full, or staged                    | Pending       |
| D2  | Minimum visible flame level         | Yes, or no                         | Pending       |
| D3  | Email provider                      | Resend, Postmark, other            | Pending       |
| D4  | Passkey beside PIN                  | Add later, or not                  | Pending       |
| D5  | Hosting                             | Vercel, or other                   | Pending       |
| D6  | Target of five of seven logged days | Accept, or revise                  | Pending       |
| D7  | Merge timing for the refactor       | Now, or after browser verification | Pending       |

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
