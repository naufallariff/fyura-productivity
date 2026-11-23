# Stage 3A: Frontend UI Engineering, Components, Behaviors, Forms, Built-in AI, and WebMCP

## 1. Semantic HTML and Web Components

Always start with native HTML elements before reaching for ARIA or custom JavaScript wrappers. Native elements provide built-in focus management, keyboard handling, form submission, and accessibility tree semantics for free.

- **Native Structural & Interactive Elements:**
  - Use `<dialog>` with `.showModal()` for true modal dialogs (automatic focus trapping, backdrop, and `Escape` dismissal) and `.show()` for non-modal dialogs.
  - Use the `popover` attribute (`popover="auto"` or `popover="manual"`) paired with `popovertarget` and `popovertargetaction` for menus, tooltips, and dropdowns without z-index wars.
  - Use `<details>` and `<summary>` (with matching `name="..."` attributes for mutually exclusive accordions) for progressive disclosure.
  - Use `<output>` for live calculation results and `<progress>` / `<meter>` for progress bars and gauges.
- **Web Components & Custom Elements Best Practices:**
  - **Custom Element Naming:** Always include a hyphen (`<ui-tabs>`, `<data-grid>`).
  - **Declarative Shadow DOM (DSD):** Render `<template shadowrootmode="open">` on the server so custom elements paint immediately during SSR without a flash of unstyled content.
  - **Form-Associated Custom Elements:** Set `static formAssociated = true;` and use `this.attachInternals()` (`setFormValue()`, `setValidity()`) so custom form controls participate natively in `<form>` submission, validation, and reset events.
  - **Styling Encapsulation:** Expose intentional styling hooks via `::part(name)` and CSS custom properties rather than forcing consumers to pierce Shadow DOM.

---

## 2. UI Components and Atoms Blueprint

### Core Accessible Component Contracts

- **Tabs (`role="tablist"`, `role="tab"`, `role="tabpanel"`):**
  - Implement roving `tabindex` (`tabindex="0"` on active tab, `-1` on inactive tabs).
  - Left/Right arrow keys move focus between tabs; `aria-selected="true"` tracks active state; `aria-controls` links tab to panel.
  - Enhance active tab underline smoothly using CSS Anchor Positioning (`anchor-name` and `position-anchor`).
- **Menus & App Menus (`role="menu"`, `role="menuitem"`):**
  - Reserve `role="menu"` strictly for application action menus (not site navigation links, which belong in `<nav><ul><li><a>`).
  - Support Arrow Up/Down navigation, `Home`/`End` jumps, type-ahead character matching, and `Escape` to close and return focus to the trigger button.
- **Carousel & Horizontal Lists:**
  - Use CSS Scroll Snap (`scroll-snap-type: x mandatory; scroll-snap-align: start;`) paired with `scroll-behavior: smooth`.
  - Provide explicit Previous/Next buttons with `aria-label`, pause auto-advance on hover/focus, and honor `prefers-reduced-motion`.
- **Toast Notifications:**
  - Render inside a top-layer `popover="manual"` container so toasts never get clipped by modal backdrops.
  - Use `aria-live="polite"` for status updates and never auto-dismiss toasts containing interactive actions (like "Undo").
- **Responsive Tables & Single-Line Overflow:**
  - Wrap wide data tables in a horizontally scrollable region with `role="region"`, `tabindex="0"`, `aria-label`, and sticky first columns (`position: sticky; left: 0;`).
  - Apply `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` only when full text remains accessible on focus/hover or expansion.

---

## 3. UI Behaviors, Motion, and View Transitions

### View Transitions API (Same-Document & Cross-Document)

Create fluid, app-like state and page transitions with minimal code:

```css
/* Enable automatic cross-document MPA route transitions */
@view-transition {
  navigation: auto;
}

/* Assign matching transition names to shared hero elements */
.product-thumbnail {
  view-transition-name: product-hero;
}

/* Customize entry/exit choreography */
::view-transition-old(root) {
  animation: 180ms ease-out both fade-out;
}
::view-transition-new(root) {
  animation: 220ms ease-in both fade-in;
}
```

- **Same-Document SPA Transitions:** Wrap DOM state mutations in `document.startViewTransition(() => updateDOM())`. Always feature-detect `if (!document.startViewTransition)` and fall back to instant DOM updates.
- **Scoped & Group Transitions:** Use `view-transition-class` to style multiple transitioning cards identically without duplicating CSS rules, and `element.startViewTransition()` for isolated component transitions.
- **Move DOM Elements Without Losing State:** Use `element.moveBefore(node, child)` instead of `appendChild` when reparenting active `<video>`, `<iframe>`, or focused inputs so playback and focus state stay intact.

### CSS Scroll-Driven Animations and Anchor Positioning

- **Scroll Progress & Entry Effects:** Replace scroll event listeners with CSS `animation-timeline: scroll()` (for reading progress bars) and `animation-timeline: view()` with `animation-range: entry 0% cover 30%` (for viewport reveal animations).
- **Viewport-Aware Tooltips & Dropdowns:** Use CSS Anchor Positioning (`position-anchor`, `anchor()`, and `@position-try` fallbacks) so tooltips and dropdowns automatically flip when near viewport edges without JavaScript bounding-box calculations.
- **Reduced Motion Compliance:** Wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)` or replace spatial slides with gentle opacity crossfades when `prefers-reduced-motion: reduce` is active.

---

## 4. Smart Forms, Autofill, and Validation UX

### Frictionless Autofill Attributes

Always configure semantic `autocomplete`, `inputmode`, and `enterkeyhint` attributes to maximize browser password manager and autofill accuracy:

- **Sign-In Form:** `autocomplete="username"` (or `email`) + `autocomplete="current-password"`.
- **Sign-Up / Password Reset:** `autocomplete="new-password"` + explicit password rules displayed upfront.
- **SMS One-Time Passcode (OTP):** Single input with `autocomplete="one-time-code"`, `inputmode="numeric"`, `pattern="[0-9]*"`, and `maxlength="6"` (never split into 6 separate inputs that break paste and OS auto-fill).
- **Payment & Address Forms:** Standard tokens (`cc-name`, `cc-number`, `cc-exp`, `cc-csc`, `street-address`, `postal-code`, `country`).
- **Auto-Sizing Inputs:** Apply `field-sizing: content;` on `<textarea>` and `<input>` elements so fields expand naturally with user input without JavaScript resize observers.

### Validation and International Input (IME) Safety

- **Validate After Interaction:** Never show red error states while the user is still typing their first character. Use CSS `:user-invalid` and `:user-valid`, or validate on `blur` and re-validate on `input` only after a field has been touched/submitted.
- **IME-Safe Enter Key Handling:** When handling `Enter` to submit chat messages or tags, always check `if (event.isComposing || event.keyCode === 229) return;` so Japanese, Chinese, or Korean Input Method Editors (IME) do not submit prematurely while confirming character composition.

---

## 5. Browser Built-in AI APIs and WebMCP

### Chrome Built-in AI (On-Device Gemini Nano)

Offload privacy-sensitive or low-latency text tasks directly to the browser when available:

```js
// Feature-detect and check model availability before calling Built-in AI APIs
if ("LanguageModel" in self) {
  const availability = await LanguageModel.availability();
  if (availability !== "unavailable") {
    const session = await LanguageModel.create({
      systemPrompt: "Summarize user feedback into 3 concise bullet points.",
    });
    const result = await session.prompt(userText);
  }
}
```

- Supported task APIs include `LanguageModel` (Prompt API), `Summarizer`, `Translator`, and `LanguageDetector`. Always provide a server-side fallback when on-device models are unsupported or downloading.

### WebMCP (Exposing Web App Capabilities to AI Agents)

Make web applications cleanly operable by browser-integrated AI agents without brittle DOM scraping:

- **Declarative Agentic Forms:** Add `toolname` and `tooldescription` attributes to semantic `<form>` elements (and clear `title` / `<label>` descriptions on inputs) so agents can discover and submit structured actions safely.
- **Imperative JavaScript Tools (`navigator.modelContext`):** Register structured client-side tools with JSON Schema input definitions and clear descriptions via `navigator.modelContext.registerTool(...)`, always enforcing explicit user confirmation for destructive or state-changing operations.
