# Fyura frontend architecture

The active preview exposes Daily Tracker at `/daily-tracker`. The home route redirects there. The sidebar keeps the complete FigCraft order; selecting a section whose page is pending displays an availability message inside the shell.

| Folder                | Role                                        |
| --------------------- | ------------------------------------------- |
| `app/`                | Next.js route entry points and metadata     |
| `layouts/`            | Shared shell and navigation, TSX            |
| `views/`              | Page composition, TSX                       |
| `components/`         | Shared controls and Daily widgets, TSX      |
| `models/` and `data/` | Types and dummy data, TS                    |
| `hooks/` and `utils/` | Client behavior and calculation helpers, TS |
| `styles/`             | Tokens and CSS                              |

Keep reusable calculation code in `domain/`. Keep JSX in view, layout, and component files. Existing server and feature action code is retained for later integration. The preview routes mount no database, authentication, cron, or API handlers. Retired route and UI files are backed up locally under `archieve/ui-before-reset/`.

Daily uses sample records dated 27 November 2026. Edits are held in memory and reset on reload. FigCraft `12530` defines Logged time, Required completion, Deep focus, and Day status. Logged time uses the union of ranges, allocation merges ranges by category, and completed timer minutes stay separate. The mini calendar is a standalone month viewer. The checklist uses a sample routine while Weekly is pending. Notes use the five public sources. The search excludes Private.

Owner review is manual for this stage. Open `/daily-tracker` and check expanded/collapsed navigation, the mobile drawer, navbar actions, metric changes, drag in both directions, overlapping blocks, history, timer pause/resume, and the notepad. Continue with Weekly after Daily review.
