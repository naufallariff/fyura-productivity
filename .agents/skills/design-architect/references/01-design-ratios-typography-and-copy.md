# Design Ratios, Typography, and Authentic Persuasive Copywriting

## 1. Mathematical Design Ratios & Spatial Proportion Systems

Use deliberate mathematical ratios so layout, spacing, and typography feel structurally balanced rather than arbitrary:

| Ratio Name                  |            Value            | Primary Application                                                                                                   | Concrete Example                                                                                   |
| :-------------------------- | :-------------------------: | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Golden Ratio ($\phi$)**   |           `1.618`           | Hero split compositions, primary-to-sidebar column ratios, card aspect proportions, and editorial display hierarchies | `61.8%` primary content column + `38.2%` contextual sidebar (`grid-template-columns: 1.618fr 1fr`) |
| **Rule of Thirds**          |  `1 : 2` (`33.3% / 66.7%`)  | Focal point placement in graphic posters, hero visuals, and asymmetric Bento grids                                    | Anchor headline/CTA along the left or top third intersection rather than dead center               |
| **4pt / 8pt Spatial Grid**  |  `4px` micro / `8px` base   | All component padding, gaps, icon alignments, and vertical rhythm                                                     | `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px` (never arbitrary `13px` or `27px`)            |
| **Container Aspect Ratios** | `16:9`, `4:3`, `1:1`, `4:5` | Media frames, cards, thumbnails, and social/marketing assets                                                          | Lock explicit `aspect-ratio` CSS so media never triggers Cumulative Layout Shift (`CLS`)           |

### Density-Calibrated Spacing Scales

- **Spacious / Editorial (`--density: low`):** `24px-96px` section spacing (`gap-6` to `gap-24`) for landing pages, portfolios, and luxury brands.
- **Balanced Product UI (`--density: mid`):** `16px-48px` spacing (`gap-4` to `gap-12`) for standard SaaS workflows and settings.
- **High-Density Operational (`--density: high`):** `8px-24px` spacing (`gap-2` to `gap-6`) for analytics dashboards, trading terminals, and admin tables.

---

## 2. Typography Architecture & Modular Scales

### Choosing the Right Modular Type Scale

Select a ratio based on product personality and viewport range, using `clamp()` for fluid responsiveness:

- **Minor Third (`1.200`) / Major Third (`1.250`):** Compact, high-density SaaS apps and dashboards where headings must not overpower data tables.
- **Perfect Fourth (`1.333`) / Augmented Fourth (`1.414`):** Modern marketing pages, documentation, and editorial interfaces needing strong visual contrast between display titles and body copy.
- **Golden Ratio (`1.618`):** Bold brand statements, posters, and minimalist showcase headers.

### Typographic Craft Rules

1. **Readable Measure (Line Length):** Constrain long-form body copy to **`55ch-75ch`** (`max-w-prose` / `65ch`). Wider lines fatigue the eye; narrower lines cause choppy reading.
2. **Line Height & Tracking Calibration:**
   - **Display & Headings (`32px-72px`):** Tight line-height (`1.05-1.20`), negative letter-spacing (`-0.02em` to `-0.035em`), and `text-wrap: balance` to prevent single-word orphans.
   - **Body Copy (`15px-18px`):** Comfortable line-height (`1.50-1.65`), neutral tracking (`0em`), and `text-wrap: pretty`.
   - **Micro Labels, Badges & Overlines (`11px-13px`):** Uppercase or small-caps with positive tracking (`+0.04em` to `+0.08em`) and `font-weight: 500-600`.
3. **Tabular Numerals:** Always set `font-variant-numeric: tabular-nums` on KPI counters, prices, timestamps, and table columns so digits align vertically and never jitter when updating.
4. **Font Pairing Discipline:** Pair at most **2 font families** (e.g., geometric or humanist display sans + neutral legible body sans, or editorial serif display + clean grotesque sans) plus 1 monospace font for code/IDs.

---

## 3. Anti-Slop Punctuation, Microcopy & Authenticity Rules

### Punctuation & Tone Hygiene

1. **Em-Dash Ban in UI Copy:** Never use the em-dash character inside agent-authored UI copy, headings, labels, tooltips, or microcopy. Replace it with a comma (`,`), period (`.`), colon (`:`), or parentheses `()`. _(If the user supplies their own copy containing em-dashes, ask whether to keep or replace them rather than silently altering their text.)_
2. **Specific Verb + Object CTAs:** Ban generic AI defaults like `"Get Started"`, `"Learn More"`, `"Try Now"`, `"Explore"`, `"Submit"`, or `"OK"`. Write outcome-specific CTAs tied to the exact workflow (`"Start 14-Day Sandbox"`, `"Inspect Live Schema"`, `"Export Audit CSV"`, `"Create Workspace"`).
3. **Concrete Language Over AI Buzzwords:** Ban hollow clichés such as `"AI Powered"`, `"Next Generation"`, `"Revolutionary"`, `"Seamless"`, `"Cutting Edge"`, `"Intelligent"`, `"Ultimate"`, `"Powerful"`, and `"Effortless"`. State concrete mechanics, exact steps, and measurable user outcomes instead.
4. **Constructive Error Messages:** State **what happened** and **how to fix it** directly beside the field (`"Password needs at least 12 characters"` instead of `"Invalid input"`).
5. **Wordless Dashboard Discipline:** On analytical screens, cap labels at 1-3 words (`"Net Revenue"`, `"Active Users"`). Move explanatory sentences into tooltips or empty-state guidance.

### Zero-Fabrication & Proof Rules

- **Verified Metrics Only:** Never invent statistics (`"10K+ Users"`, `"99.9% Uptime"`, `"500M Requests"`, `"120+ Countries"`). Omit numbers completely or use `[REAL DATA]` when real figures are unavailable.
- **Real Testimonials Only:** Never generate fictional customer quotes, stock/AI-generated avatars, invented names, or fake job titles. Omit the testimonials section when no verified quotes exist.
- **Product-Specific FAQs Only:** Never pad pages with generic filler FAQs (`"Is my data secure?"`, `"Can I cancel anytime?"`). Only include FAQs addressing real product questions.
- **No Unverified Claims:** Never add fake compliance badges (`"SOC 2 compliant"`, `"ISO 27001"`, `"HIPAA certified"`, `"Enterprise-grade encryption"`) or unmeasured performance claims (`"300% faster"`).
- **Explicit Placeholders:** Every unverified claim, stat, or destination must carry an unmistakable placeholder marker (`[REAL DATA]`, `"Coming soon"`) rather than realistic-sounding fake copy.

---

## 4. Persuasive Copywriting Frameworks (Landing Pages & Decks)

| Framework                                         | Structure                                                                                                                                                         | Best Use Case                                              |
| :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| **PAS (Problem - Agitate - Solution)**            | Name the user's acute pain -> Highlight the cost of inaction -> Present the product as the clear relief                                                           | SaaS hero sections, developer tools, B2B landing pages     |
| **AIDA (Attention - Interest - Desire - Action)** | Bold pattern-interrupt hook -> Concrete capability proof -> Real outcome/proof -> Frictionless CTA                                                                | Product launches, marketing campaigns, onboarding flows    |
| **FAB (Features - Advantages - Benefits)**        | Technical capability (`What it is`) -> Operational edge (`Why it's better`) -> Human/business result (`What you gain`)                                            | Pricing tiers, feature comparison matrices, investor decks |
| **Duarte Sparkline (Pitch Narrative)**            | Alternate between **"What Is"** (status-quo friction) and **"What Could Be"** (transformed future), placing pattern-break proof points at 1/3 and 2/3 of the flow | Strategic presentations, product keynotes, pitch decks     |
