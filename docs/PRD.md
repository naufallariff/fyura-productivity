# Fyura Productivity Product Requirements

**Baseline** v2.0.0 · **Updated** 2026-11-24

See the [Software Requirements Specification](SRS.md) for implementation contracts and the [refactor tracker](REFACTOR-STATE.md) for release evidence and open items.

## 1. Product vision

Fyura gives one owner a place to plan a week, record how they spent their time, review consistency, and keep projects and learning moving. The log records actual activity. A plan provides context for interpreting it. Scores describe recorded behavior in neutral language and explain what was counted.

The owner uses a verified, approved Google account and works across a desktop and a phone. A logical day follows the owner's saved IANA time zone, which defaults to Asia/Jakarta. Ordinary use requires a network connection.

### Primary workflows

1. **Plan the week.** Define weekday routines, required items, and time budgets. Identify core items that still apply on a flexible or off day.
2. **Record the day.** Set the day status, check off the routine, log time blocks, and use the focus timer. Capture ideas as they come up.
3. **Review what happened.** Check the dashboard for scored-day consistency, the recent trend, today's focus, project progress, and career follow-ups. Journal when useful and review the learning streak.
4. **Move work forward.** Update project cards and job applications, record learning progress, and grade due review cards.
5. **Store a private note.** Open Private Space with a separate PIN, manage records, and lock it when finished.

### Success measures

- The owner can complete the plan, record, and review loop from either supported viewport.
- Consistency and streak values reconcile with their source dates. Empty or uncalibrated states explain what is needed to calculate a value.
- The owner can capture an idea or navigate to a module without leaving the current task to search menus.
- Private records are available in an unlocked Private Space session and stay isolated from ordinary workspace views.

## 2. Functional requirements

### Authentication and workspace

| ID        | Acceptance criterion                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-AUT-01 | An approved, verified Google account can sign in. Any session without an authorized user is denied access to the workspace.                                      |
| FR-AUT-02 | The Auth.js session has a 30-day maximum age.                                                                                                                    |
| FR-AUT-03 | First sign-in creates or resolves the account's database identity through the login callback.                                                                    |
| FR-AUT-04 | Signing out clears the query cache and persisted scoped state.                                                                                                   |
| FR-SHL-01 | The desktop sidebar expands with the Fyura wordmark and collapses to a 64 px rail with the mark. Mobile navigation exposes primary destinations and a More menu. |
| FR-SHL-02 | Cmd+K and Ctrl+K open the command palette immediately with focus in search. Escape dismisses it. It provides navigation and quick actions.                       |
| FR-SHL-03 | Light and Dark switch immediately. The selected mode persists across navigation and reload.                                                                      |
| FR-SHL-04 | The sign-in header, expanded and collapsed sidebar, favicon, and Apple touch icon use the same geometric mark.                                                   |

### Dashboard `/dashboard`

| ID        | Acceptance criterion                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-DSB-01 | Four tonal KPI cards show weekly consistency, the 30-day trend, today's focus, and learning streak with career follow-ups.                                  |
| FR-DSB-02 | Weekly consistency uses completed required slots divided by planned required slots on recorded days. The trend smooths daily ratios across a 30-day window. |
| FR-DSB-03 | Calibration explains progress toward seven recorded days with scored items before comparative trend values appear.                                          |
| FR-DSB-04 | The workspace includes today's execution log and checklist, active project checklist progress, a mini-month for history, and a Pomodoro mode switcher.      |
| FR-DSB-05 | Frequent unchecked items use Normal days in the last seven days. Follow-ups use open applications unchanged for at least seven days.                        |
| FR-DSB-06 | KPI captions explain denominators, windows, or missing targets. Dashboard payloads exclude Private Space content.                                           |

### Daily Tracker `/daily-tracker`

| ID        | Acceptance criterion                                                                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-DTK-01 | Normal, Sick, Flexible, and Off apply the checklist scoring rules for the selected date.                                                                       |
| FR-DTK-02 | Day and Week views show a time grid in the owner's zone with a current-time indicator.                                                                         |
| FR-DTK-03 | Pointer drag to create, move, and resize uses 15-minute snapping. The resize handle has a 20 px hit area. The block dialog provides a keyboard alternative.    |
| FR-DTK-04 | Cross-midnight blocks save as linked rows. Their time is adjusted by deleting and recreating the pair. Overlaps are rejected and optimistic changes roll back. |
| FR-DTK-05 | Checking an item saves its desired state. The first check freezes the day's plan snapshot.                                                                     |
| FR-DTK-06 | The timer records 1 to 240 minute focus sessions. A completed deep focus session creates a time block when it does not overlap.                                |
| FR-DTK-07 | History supports date, category, and literal text filters with cursor pagination.                                                                              |
| FR-DTK-08 | Mini-month and category filters work from the desktop rail and mobile controls drawer. Deselected categories are dimmed on the grid.                           |

### Weekly Plan `/weekly-plan`

| ID        | Acceptance criterion                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FR-WPL-01 | A new item appears last on its weekday.                                                                                           |
| FR-WPL-02 | Items can be edited and soft-deleted.                                                                                             |
| FR-WPL-03 | Reordering a day persists the full order. A stale ordered set receives a conflict.                                                |
| FR-WPL-04 | Required, optional, and core flags affect scoring according to the day status. Planned Work minutes can set today's focus target. |

### Projects `/projects` and `/projects/[boardId]`

| ID        | Acceptance criterion                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-PRJ-01 | The board index pages through active or archived boards. Board columns scroll horizontally with snap points, card counts, and list actions.                |
| FR-PRJ-02 | List and card moves persist with server-computed positions and roll back if rejected.                                                                      |
| FR-PRJ-03 | Each active list has an inline multiline card composer. Enter submits and Shift+Enter inserts a newline.                                                   |
| FR-PRJ-04 | Card faces show relevant labels, due state, and checklist progress. Sorting by due date puts undated cards last and persists the entire active list order. |
| FR-PRJ-05 | The floating BoardDock provides Inbox, Planner, Board, and Switch Boards. It remains reachable above mobile navigation.                                    |
| FR-PRJ-06 | Active card filters suspend drag reordering.                                                                                                               |
| FR-PRJ-07 | Boards, lists, and cards can be archived. Confirmed list deletion removes the list and its cards.                                                          |

### Career `/career`

| ID        | Acceptance criterion                                                                         |
| --------- | -------------------------------------------------------------------------------------------- |
| FR-CAR-01 | Applications support Applied, Screening, Interview, Offer, Rejected, Ghosted, and Withdrawn. |
| FR-CAR-02 | Each status change records the previous status, new status, and time.                        |
| FR-CAR-03 | Open applications unchanged for at least seven logical days need follow-up.                  |
| FR-CAR-04 | Each activity kind has a daily count between 0 and 1000.                                     |
| FR-CAR-05 | Application links use HTTPS.                                                                 |
| FR-CAR-06 | The module presents summary counts, a status board, and a list of applications.              |

### Learning `/learning`

| ID        | Acceptance criterion                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| FR-LRN-01 | Subjects have a type, a status, and a name unique to the account.                                                      |
| FR-LRN-02 | The owner sees a warning above three active subjects and can still save.                                               |
| FR-LRN-03 | Books, courses, and research track progress against an optional total. Recorded progress cannot exceed that total.     |
| FR-LRN-04 | One progress entry per material per logical date is replaced when edited.                                              |
| FR-LRN-05 | First progress moves a queued material to Active.                                                                      |
| FR-LRN-06 | Purge requires an archived material. Linked review cards survive as standalone cards.                                  |
| FR-LRN-07 | The owner grades due cards from 0 to 5. SM-2 schedules the next review and concurrent grading accepts a single answer. |
| FR-LRN-08 | A new card is due today and may be standalone or linked to a material in a selected subject.                           |

### Journal and Tadabur `/journal`

| ID        | Acceptance criterion                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-JRN-01 | The TipTap editor supports selection formatting, HTTPS links, and block formatting through a toolbar and slash menu.                                                                                                 |
| FR-JRN-02 | Journal entries have a logical date, one of five types, an optional title, and a nonempty body. The server sanitizes submitted HTML.                                                                                 |
| FR-JRN-03 | Entries written more than one logical day late are marked and remain eligible for streaks.                                                                                                                           |
| FR-JRN-04 | A day counts toward a learning streak when it has both a Learning block and a Learning journal entry. The card shows the current streak level, lifetime best, and late-day count where applicable. Deletion is soft. |
| FR-TAD-01 | A reflection may reference Surah 1–114 and a nondecreasing verse range within the current 1–286 input bounds. It accepts the same formatting as Journal.                                                             |
| FR-TAD-02 | Surah and date filters survive reload and back navigation through URL parameters.                                                                                                                                    |
| FR-TAD-03 | Deleting a reflection is soft. Repeating deletion reports that the entry could not be found.                                                                                                                         |

### Capture `/capture`

| ID        | Acceptance criterion                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| FR-CAP-01 | Ideas move between Inbox, Active, and Archived. The default view excludes archived ideas. |
| FR-CAP-02 | Each idea can have up to ten tags using lowercase letters, digits, and hyphens.           |
| FR-CAP-03 | Search treats percent and underscore as literal characters.                               |
| FR-CAP-04 | The tag cloud counts non-archived ideas.                                                  |

### Private Space `/private`

| ID        | Acceptance criterion                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-PRV-01 | A six-digit PIN secures Private Space separately from sign-in. PIN creation discloses that recovery is unavailable in v2.                                    |
| FR-PRV-02 | Five incorrect attempts trigger a five-minute lockout. Further failures after expiry increase it up to one hour. Successful unlock resets the failure count. |
| FR-PRV-03 | An unlocked session expires after ten minutes of inactivity. A countdown shows remaining time and activity can renew the session.                            |
| FR-PRV-04 | Lock now returns to the gate. Protected operations reject a missing, invalid, or expired private session.                                                    |
| FR-PRV-05 | The owner can create, read, edit, and soft-delete encrypted private records. Private records do not appear in other modules or shared caches.                |

### Settings `/settings`

| ID        | Acceptance criterion                                                             |
| --------- | -------------------------------------------------------------------------------- |
| FR-SET-01 | Ocean, Sage, and Dusk palettes persist across reloads.                           |
| FR-SET-02 | The owner can select Light or Dark independently of palette.                     |
| FR-SET-03 | Only valid IANA time zones are accepted. Dates and times reflect the saved zone. |
| FR-SET-04 | Suggest the device time zone only when it differs from the saved zone.           |

## 3. Scope boundaries

- Team accounts, collaboration, billing, native apps, and offline operation are outside v2.
- Notification delivery, external calendar synchronization, account-level export and erasure, and PIN recovery are deferred.
- Lifetime streak totals remain part of the product. A future query optimization must preserve their meaning.
- Product usage and performance targets are tracked as requirements. Evidence for the current release lives in the [refactor tracker](REFACTOR-STATE.md).

## 4. V2 acceptance

| ID    | Acceptance check                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | At 1280×800 and 390×844, the brand renders at sign-in, icon URLs return the declared PNG sizes, and the page has no horizontal overflow or console and page errors.              |
| AC-02 | At both viewports, a disposable signed-in account can switch modes, open the palette with no entry animation, use the dashboard and tracker controls, and operate the BoardDock. |
| AC-03 | At both viewports, Journal formatting survives save and reload, and Private Space supports PIN setup, lockout, and record CRUD with zero console or page errors.                 |
| AC-04 | Missing, loading, stale, error, partial, and long-content states remain usable. High-frequency actions have visible keyboard focus and touch alternatives.                       |
| AC-05 | Typecheck, lint, enabled automated tests, and a production build pass. The opt-in database suite verifies the deployed schema and RLS.                                           |
