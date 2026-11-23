# Fyura Productivity — Visual & Interaction Design Brief (v2)

## 1. Aesthetic Direction (Apple HIG + Dribbble Editorial Craft)

- **Dual Theme (`light` & `dark`)**: Perceptual OKLCH color system (`app/globals.css`). Light mode uses warm/cool tinted off-white canvas (`L: 0.98`) with crisp elevated white cards (`L: 1.00`); Dark mode uses deep slate-navy stepped elevation (`L: 0.145` canvas -> `L: 0.188` surface -> `L: 0.228` elevated), never flat `#000000`.
- **Glassmorphism Dose Cap**: Apply `backdrop-filter: blur(16px)` ONLY to the collapsible navigation shell, floating docks, and active modals/popovers. Data cards use solid tinted surfaces (`1px` subtle border + soft shadow) to guarantee WCAG 2.2 AA contrast (`>= 4.5:1`) and 60fps scrolling.
- **Data Precision**: Every figure, timer, score, and schedule slot uses `tabular-nums` and includes a 1-sentence contextual explanation.

## 2. Module-Specific UX & Layout Contracts

### A. Dashboard (`/dashboard`) — Colorful Bento Command Center

- **Inspiration**: LearnZimTPS / TaskFlow colorful KPI cards + Nexora sparklines + Notion Life OS & user's `My Dashboard` layout.
- **Top Row (4 Tonal KPI Cards)**:
  1. Weekly Consistency (Indigo/Blue tint, percentage + delta vs last week, or `Calibration` badge if `< 7` recorded days).
  2. 30-Day EWMA Trend (Emerald tint, smooth SVG area/sparkline chart).
  3. Today's Focus & Time Blocks (Amber/Orange tint, circular progress ring `completed / target hours`).
  4. Learning Streak & Career Follow-ups (Violet/Rose tint, active streak flame + overdue 7-day follow-up counter).
- **Middle Workspace (Split 8:4 Grid)**:
  - _Left (8 cols)_: **Today's Execution Log & Checklist** (interactive inline check-off with optimistic updates) + **Active Projects Snapshot** (mini progress bars).
  - _Right (4 cols)_: **Mini Month Calendar** (with event dot indicators) + **Embedded Focus Timer Widget** (25:00 Pomodoro / Short Break / Long Break pill switcher, inspired by user's Notion right sidebar).

### B. Projects (`/projects/[boardId]`) — Trello-Exact Kanban

- **Inspiration**: User's Trello `Grand Masterplan` board.
- **Layout**: Horizontal scroll-snap board (`w-[280px] shrink-0` columns) with column header icon, card count badge, and `...` column menu.
- **Card Face**: Crisp elevated card showing colored label bars/pills, title, description indicator icon, due date badge (`overdue`, `today`, `upcoming`), and checklist progress pill (`0/4`, `2/3`).
- **Interactions**:
  - Smooth 60fps drag-and-drop (`@dnd-kit`) for both cards (across/within lists) and list reordering, with automatic drag lock when filters are active.
  - Inline `+ Add a card` button at the bottom of every column (opens inline textarea, `Enter` submits immediately).
  - **Floating Bottom Board Dock**: Centered glass pill bar at viewport bottom with quick triggers: `Inbox` (pulls from Capture ideas), `Planner`, `Board`, and `Switch Boards`.

### C. Daily Tracker (`/daily-tracker`) — Google Calendar-Exact Time Blocking

- **Inspiration**: User's Google Calendar week/day grid (`GMT+7`).
- **Layout (2-Panel)**:
  - _Left Control Rail (`w-64`, drawer on mobile)_: Primary `+ Create` button, interactive **Mini Month Calendar**, **Day Status** selector (`Normal`, `Sick`, `Flexible`, `Off`), and **Categories** filter list with colored checkboxes (`Worship`, `Learning`, `Work`, `Career`, `Fitness`, `Rest`, `Social`, `Leisure`) that dim unselected blocks rather than hiding them.
  - _Main Time Grid_: Hourly timeline (`00:00` – `23:59`, `GMT+7` gutter) supporting **Day** and **Week** views, with a live current-time indicator line + dot.
- **Pointer Mechanics**:
  - **Drag-to-Create**: Click and drag across empty 15-minute slots to create a block with instant visual preview.
  - **Drag-to-Move & Bottom Resize Handle**: Move blocks or drag the bottom edge in 15-minute increments; reject overlaps with optimistic rollback, and auto-split cross-midnight blocks into two linked rows.

### D. Notion-Style Workspace & Rich Journaling (`/journal`, Shell)

- **Inspiration**: User's Notion workspace (`My Dashboard`).
- **Shell**: Collapsible left sidebar with categorized sections (`Main`, `Workspace`, `Private`), top breadcrumb bar, and instant `0ms` Command Palette (`Cmd+K` / `Ctrl+K`).
- **Journal & Tadabur Editor**: Replace plain `<textarea>` with a Notion-like rich-text editor (`TipTap`) featuring:
  - **Floating Bubble Toolbar** on text selection (Bold, Italic, Underline, Strikethrough, Inline Code, Highlight, `https://` Link).
  - **Sticky Block Toolbar & Slash Menu (`/`)** (Headings H1–H3, Bullet List, Numbered List, To-Do Checkbox, Callout/Quote, Divider).
  - Strict HTML sanitization (`DOMPurify`) before rendering.

## 3. Spatial Ratios, Anti-Slop Color Discipline & Copywriting Rules

### A. Spatial Grid & Proportions

- **Base Rhythm**: Strict `4px` / `8px` spatial scale (`gap-2`, `gap-4`, `gap-6`, `p-4`, `p-6`).
- **Negative Space**: Maintain `35%–45%` breathing room across dashboard and workspace canvases; never cram widgets edge-to-edge without clear visual grouping.
- **Readable Measure**: Constrain journal bodies, reflection entries, and empty-state descriptions to `55ch–75ch` (`max-w-prose`).
- **Radius Hierarchy**: Outer panels/cards `16px–20px` (`rounded-2xl`), inner cards/items `12px` (`rounded-xl`), buttons/inputs `10px` (`rounded-lg`), status pills `9999px` (`rounded-full`).
- **Touch & Mobile Floor**: Every interactive control must be at least `44x44px` with `>= 8px` separation, tested down to `390px` viewport width without horizontal page overflow.

### B. 60-30-10 Anti-Slop Color Calibration

- **60% Canvas**: Tinted neutral background (`--bg-canvas`) that reduces eye strain in both light and dark modes.
- **30% Elevated Surfaces**: Crisp stepped card surfaces (`--bg-surface`, `--bg-surface-elevated`) separated by `1px` hairline borders (`--border-subtle`) and subtle elevation shadows—not muddy transparent glass everywhere.
- **10% Purposeful Color Accents**: Use soft pastel/tonal washes (`--cat-*-soft`) paired with crisp saturated foregrounds (`--cat-*`) for KPI cards, calendar blocks, and project labels. Never use more than 3–4 active hues in a single viewport cluster so the interface feels colorful and structured rather than chaotic AI slop.

### C. Natural Copywriting & Microcopy Hygiene

- **Tone**: Calm, direct, and honest—matching Apple HIG clarity and Notion's quiet utility.
- **Action Labels**: Use concise `Verb + Object` labels (`Create block`, `Add card`, `Lock private space`, `Start focus`).
- **Banned Patterns**:
  - Zero em-dashes (`—`) in any UI heading, label, tooltip, or helper text (use commas, colons, or periods).
  - Zero AI marketing clichés (`Seamless`, `Unlock`, `Supercharge`, `AI-powered`, `Revolutionary`, `Elevate`).
  - Zero judgmental streak/miss language; always explain numbers with a neutral 1-sentence baseline.
