# Dashboard Architecture, Data Visualization, Pitch Slides, and Motion Choreography

## 1. Dashboard Design Principles (First Glance, Quiet, Wordless, Honest)

Every analytical or operational screen must answer **one primary question at first glance** within 3 seconds without hovering:

- **Monitor Sequence:** Structure visual hierarchy in strict order: **Header** (title, date range, global filter) -> **KPI Summary Cards** (3-6 headline numbers with context) -> **Primary View / Problem Surface** -> **Ranked Breakdowns** -> **Detail Tables**.
- **Quiet Until Something Is Wrong:** Keep healthy baseline metrics calm (neutral grey + one primary entity hue for people/traffic, one hue for money). Reserve bright warm/amber/red tones exclusively for anomalies requiring action, and place the corrective action right beside the flagged row or cell.
- **Wordless UI Discipline:** Display concise labels (`1-3` words), tabular numbers (`font-variant-numeric: tabular-nums`), units, and one-word baselines (`"vs prev 7d"`, `"target 85%"`). Move explanatory sentences inside tooltips or empty-state guidance; never clutter cards with narrative prose.
- **Data Honesty Rules:**
  - Every headline KPI must answer _"Compared to what?"_ using a clear baseline (previous elapsed period, target, or historical sparkline).
  - Use `-` (hyphen) for missing data (never a fake `$0` or `0%`, and avoid em-dashes), `<0.1%` for tiny non-zero ratios, and label estimated/incomplete periods with dashed lines.
  - Guard tiny denominators: when a prior period base is under `~5`, display `"was 1"` in neutral grey instead of screaming `-100%` in red.
  - Flip delta colors semantically for **lower-is-better** metrics (churn, CAC, CPL, latency: decrease = green, increase = red), and keep volume/spend deltas neutral grey unless tied to a budget threshold.

---

## 2. Visual Encoding Ladder & Chart Selection

Choose the highest-accuracy visual encoding (Cleveland & McGill) for the analytical task:

| Rank  | Encoding Channel             | Best Chart / Component                                              | When to Use                                                                         |
| :---: | :--------------------------- | :------------------------------------------------------------------ | :---------------------------------------------------------------------------------- |
| **1** | **Position on Common Scale** | Line chart, scatter plot, dot plot                                  | Time-series trends, multi-series comparisons, variance over time                    |
| **2** | **Length on Common Scale**   | Horizontal bar chart, **Bullet Graph**, **Share Bar** (`3px` track) | Ranked category comparisons, actual-vs-target progress (`value + goal + remaining`) |
| **3** | **Angle / Slope**            | Slopegraph, sparkline trend                                         | Two-point before/after shifts, compact inline trend history                         |
| **4** | **Area / Grid Matrix**       | **Calendar / Matrix Heatmap**                                       | Two-dimensional density patterns (day-of-week x hour, cohort retention)             |
| **5** | **Color Hue / Saturation**   | Status pill, anomaly highlight cell                                 | Categorical grouping or drawing immediate eye salience to threshold breaches        |

- **Avoid Pie/Donut Charts** for >3 categories or close values; replace them with sorted horizontal bar charts or segmented share bars.
- **Multi-Width Responsiveness:** On dashboards, let grid columns expand cleanly across wide monitors (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`) rather than trapping content in a narrow centered column surrounded by dead whitespace.

---

## 3. Strategic Slide Decks & Pitch Storytelling

When generating executive presentations, pitch decks, or product keynotes:

- **Duarte Sparkline Narrative Arc:** Alternate deliberately between **"What Is"** (current pain, market friction, status quo) and **"What Could Be"** (transformed outcome, product breakthrough), placing major pattern-break proof points at the **1/3** and **2/3** deck positions.
- **One Idea Per Slide:** Cap slide copy to a bold assertion headline (`<= 10` words), one supporting visual or data chart (Chart.js / SVG bound to design tokens), and a single takeaway; never use walls of bullet points.
- **Token & Keyboard Hygiene:** Bind all slide colors/typography to CSS variables (`var(--bg-canvas)`, `var(--accent-primary)`), support `ArrowLeft` / `ArrowRight` keyboard navigation, and display a subtle progress indicator.

---

## 4. Motion Choreography & GSAP / UI Polish Integration

Coordinate macro-choreography with micro-interaction physics (`emil-design-eng` standards):

- **Purposeful Motion Tiers:**
  - **Tier 1: High-Frequency Controls (`0ms` or `100-200ms`):** Never animate keyboard command palettes (`Cmd+K`). Keep buttons (`scale(0.97)` on `:active`), dropdowns, and tooltips under `250ms` using crisp `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`).
  - **Tier 2: Content & Card Stagger (`30-60ms` delay step):** When revealing Bento grids or KPI cards on initial load, stagger entrance opacity + subtle `8px` vertical travel with total sequence under `450ms`; never block pointer interaction while animating.
  - **Tier 3: Editorial & Scroll Choreography (GSAP / ScrollTrigger):** Reserve pinned sections, SVG path draws, and parallax depth for marketing storytelling pages; clean up all GSAP contexts (`gsap.context()`) on component unmount.
- **Compositor & Accessibility Mandatory Guardrails:** Animate strictly `transform`, `opacity`, and `clip-path`, and honor `@media (prefers-reduced-motion: reduce)` by disabling positional travel while preserving gentle opacity transitions.
