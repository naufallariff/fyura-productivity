# Graphic Design, Anti-Slop Layout Craft, Logography, and 3D Spatial Design

## 1. Anti-Slop Composition & Curated Reference Synthesis

### The Swap Test & Purpose Test

- **The Swap Test:** Before finalizing any layout, check whether removing the logo and brand name leaves a recognizable, opinionated product identity. If it looks like a generic SaaS/AI boilerplate, rework the structural rhythm, typography pairing, or signature motif.
- **Purpose Over Prohibition:** Visual techniques (gradients, glassmorphism, badges, Bento grids) are valid tools when they serve a clear hierarchy or usability goal. Every decorative effect must earn its place.

### Curated Reference Synthesis (Natural Craft)

Synthesize proven design patterns from top ecosystems and design galleries without blindly cloning a single product skin:

- **Apple HIG & Liquid Glass:** Spatial depth through restrained translucent layering, crisp border hairlines, and high-contrast typographic hierarchy.
- **Google Material 3:** Tonal container grouping, clear interactive state layers, and adaptive multi-screen layouts.
- **Oppo ColorOS & Samsung One UI:** Generous rounded card containers, calm background separation, and visual breathing room around primary content blocks.
- **Dribbble & Pinterest Editorial Craft:** Bold single focal anchors, asymmetric Bento compositions, custom geometric motifs, and active negative space (`35%-50%` of canvas area).

### Anti-Template Skeletons & Effect Dose Caps

1. **Ban Default AI Landing Skeletons:** Never assemble the cliche AI landing stack (`centered badge -> 2-line gradient headline -> 2-button CTA -> fake terminal/dashboard mockup -> monochrome "Trusted by" logo bar -> 3-circle "How It Works" -> 3-column Pricing with "Most Popular" -> generic FAQ accordion`). Design around the actual user workflow and real product artifacts instead.
2. **Effect Dose Caps (Restraint = Luxury):**
   - **Glassmorphism (`backdrop-filter: blur()`):** Cap at **1-2 focal surfaces** per viewport (e.g., floating navigation bar or primary media overlay). Never apply blur to every card in a grid.
   - **Glows & Gradients:** Cap glowing borders or ambient radial blobs at **1 primary focal accent** per screen.
   - **Shadows & Elevation:** Use crisp `1px` structural borders (`--border-default`) paired with subtle elevation (`shadow-xs` / `shadow-sm`) rather than heavy muddy drop shadows.
   - **Card Grouping Discipline:** Avoid wrapping every text snippet in bordered boxes with uniform `16px` padding. Use spacing, typography scale, and subtle dividers for lightweight lists; reserve full cards for distinct interactive items.
3. **Crisp Vector & Icon Hygiene:** Build all icons, illustrations, diagrams, and geometric accents as clean, integer-aligned SVGs (`viewBox="0 0 24 24"`, consistent `1.5px` or `2px` stroke width). Never use raw emojis as UI icons, and ban cliche AI sparkle/wand/brain/robot icons for generic features.

---

## 2. Logography & Brand Mark Engineering

Design logos and wordmarks as durable, mathematically constructed vector systems:

### Geometric Construction & Proportion

- **Grid & Ratio Discipline:** Construct symbols on a square unit grid (`24x24` or `100x100`) using consistent stroke thicknesses, shared corner radii, and Golden Ratio (`1.618`) or simple integer proportions (`1:1`, `1:2`, `2:3`).
- **Optical Compensation:** Overshoot curved shapes (circles, `O`, `S`) slightly (`2%-3%`) past the baseline and cap-height so they appear optically equal in height to flat-edged geometry.
- **Wordmark Kerning & Weight:** Pair custom or refined geometric/humanist letterforms with balanced optical tracking; ensure the symbol and wordmark share matching stroke contrast and terminal geometry.

### Scalability, Safe-Zone & Color Variants

| Requirement                 | Technical Standard                                                                                                                                                                          |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Micro-Scale Legibility**  | Must remain unmistakable at **`16x16px`** (favicon) and **`24x24px`** (app header). Eliminate hairline gaps (`< 1.5px` at small sizes) that blur together.                                  |
| **Clear Space (Safe-Zone)** | Maintain a minimum protective margin equal to **`1x` the mark's cap-height or primary geometric unit** (`x`) around all four sides.                                                         |
| **Mandatory Variants**      | Always deliver 4 production SVG variants: **Full Lockup** (mark + wordmark), **Standalone Symbol**, **Monochrome Light** (`#FFFFFF` on dark), and **Monochrome Dark** (`#09090B` on light). |

---

## 3. 3D Design & WebGL / Three.js Scene Craft

When creating 3D product showcases, spatial UI cards, or interactive Three.js / React Three Fiber scenes:

- **Camera & Framing:** Use natural focal lengths (`35mm-50mm` / `fov: 35-45`) to avoid wide-angle distortion on products, and frame the subject along Rule-of-Thirds intersections with subtle depth-of-field or atmospheric fog.
- **Three-Point & Environment Lighting:**
  - **Key Light:** Primary directional light (`45 deg` off-axis) casting soft shadows to define form.
  - **Fill Light:** Softer, cooler/warmer secondary fill (`30%-40%` intensity) to prevent crushed black shadows.
  - **Rim / Back Light:** Edge highlight separating the 3D silhouette from dark or complex backgrounds, paired with a subtle studio HDRI environment map for realistic reflections.
- **Physically Based Materials (PBR):** Balance `roughness` (`0.15-0.35` for brushed metal/frosted glass, `0.6-0.85` for matte ceramic/paper) and `metalness` (`0.0` for dielectrics, `0.85-1.0` for pure metals). Never set `roughness: 0` and `metalness: 1` without a rich environment map.
- **Web 3D Performance Guardrails:** Cap `dpr={[1, 2]}`, compress textures (KTX2/WebP), dispose geometries/materials on unmount, and provide a static fallback or reduced-motion pause when `prefers-reduced-motion: reduce` is active.
