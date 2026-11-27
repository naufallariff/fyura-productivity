# Fyura refactor roadmap

27 November 2026. This tracks the **new UI refactor**, not whether older v2 functionality exists. Native concept completion and past test passes do not mean a page's new implementation is complete or owner-accepted.

| Stage   | Scope                                                            | New refactor status                                 | Exit condition / dependency                                                       |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1       | Tokens, logo, sidebar, navbar, background, shared Daily controls | **Clean frontend reset, ready for manual review**   | Full FigCraft navigation, preserved mark, three-control navbar                    |
| 2       | Daily                                                            | **Dummy frontend rebuilt, ready for manual review** | Review the four KPIs and Daily interactions. Revisit persistence in a later stage |
| 3       | Weekly                                                           | Not started                                         | Separate plan model; decide persisted time ranges; mobile one-day carousel        |
| 4       | Projects                                                         | Not started                                         | Existing board/data contracts; complete page and obtain verification              |
| 5       | Jobs                                                             | Not started                                         | Existing career routes/status contracts; complete page and obtain verification    |
| 6       | Finance tracker, Investments, Goals/budgets                      | Not started                                         | Workbook context, mappings and no-double-counting rules first                     |
| 7       | Notes, Journal, Learning, Ideas, Tadabur                         | Not started                                         | Reconcile models; shared editor/book family; page-by-page verification            |
| 8       | Private habits and Private journal                               | Not started                                         | Purpose redesign, private boundaries and unresolved freeze ledger rules           |
| 9       | Google Email and Calendar                                        | Not started                                         | Explicit consent/contracts; sign-in does not prove synchronization                |
| 10      | Dashboard                                                        | **Last; not started**                               | Use verified preceding modules and honest source/period metadata; exclude Private |
| Support | Profile, Settings, Login, errors                                 | Shared dependencies only                            | Refine when a current stage needs them; not a completed page redesign             |

The active [frontend architecture](FRONTEND-ARCHITECTURE.md) describes the reset and manual review. Verify Daily before starting Weekly.
