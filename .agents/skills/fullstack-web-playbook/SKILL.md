---
name: fullstack-web-playbook
description: Comprehensive end-to-end modern web engineering playbook covering system planning, UI/UX design, frontend architecture, modern CSS, interactive components, backend APIs, database modeling, Core Web Vitals performance, Passkeys security, privacy, testing, and production deployment. Use whenever designing, building, reviewing, optimizing, securing, testing, or deploying websites and full-stack web applications.
---

# Fullstack Web Playbook

End-to-end engineering standards for building fast, accessible, secure, and resilient websites from initial system design through production deployment.

## When to Use

- Planning web application architecture, tech stacks, data schemas, or rendering strategies (SSR, SSG, streaming, SPA).
- Designing UI systems, responsive layouts, dark mode themes, typography, or accessibility compliance.
- Building frontend components, CSS-native animations, View Transitions, dialogs/popovers, forms, Web Components, or browser AI/WebMCP integrations.
- Designing backend APIs, database schemas, caching layers, edge functions, or WebAssembly compute modules.
- Optimizing Core Web Vitals (LCP, INP, CLS), asset loading priorities, and main-thread scheduling.
- Implementing authentication (Passkeys/WebAuthn), XSS defenses (Trusted Types, CSP), encryption, or privacy compliance.
- Running quality audits, automated testing, PWA setup, and CI/CD production deployments.

## Reference Library

Load the relevant reference guide before generating detailed architecture, code, or audits:

- `references/01-architecture-and-design.md`: System planning, rendering strategy selection, UI/UX principles, modern CSS (`:has()`, container queries, intrinsic sizing, design tokens), visual design, and WCAG accessibility.
- `references/02-frontend-ui-and-behaviors.md`: Semantic HTML, Web Components, accessible UI components, View Transitions API, Top Layer (`dialog`, `popover`), scroll-driven motion, autofill-ready forms, Built-in AI, and WebMCP.
- `references/03-backend-database-and-performance.md`: Backend API contracts, relational/NoSQL database modeling, indexing, caching strategies, out-of-order HTML streaming, INP and LCP optimization, resource hints, and WASM.
- `references/04-security-privacy-testing-deploy.md`: Passkeys (WebAuthn), Trusted Types, HTML sanitization, CSP, origin validation, client-side encryption, privacy-by-design, testing pyramids, PWA installation, and production deployment checklists.

## End-to-End Engineering Workflow

Follow this six-stage lifecycle when guiding or implementing a web project:

### Stage 1: Planning and System Architecture

1.  Define core user journeys, latency budgets, offline needs, and data consistency requirements before choosing frameworks.
2.  Select the simplest rendering model that meets requirements: static/SSR with streaming for content and SEO, or progressive hydration for app-like interactivity.
3.  Establish strict API contracts and shared validation schemas (such as Zod or TypeScript interfaces) between frontend and backend.

### Stage 2: UI/UX and Visual Design

1.  Build on semantic HTML landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`) and native interactive elements (`button`, `dialog`, `details`, `select`) before reaching for custom ARIA widgets.
2.  Use modern CSS primitives (`clamp()`, container queries, `:has()`, `light-dark()`, `color-contrast()`, `@starting-style`) to eliminate JavaScript layout hacks.
3.  Enforce WCAG AA contrast ratios, visible `:focus-visible` rings, OS text-scale respect (`rem`/`em`), and `prefers-reduced-motion` fallbacks from day one.

### Stage 3: Frontend and Backend Implementation

1.  Keep JavaScript bundles minimal; offload state transitions, popovers, and scroll-linked effects to native browser APIs.
2.  Design normalized database schemas with explicit foreign keys, composite indexes for query patterns, cursor-based pagination, and strict transaction boundaries.
3.  Prevent N+1 queries, rate-limit public endpoints, and implement layered caching (`Cache-Control`, `ETag`, CDN edge caching, and stale-while-revalidate).

### Stage 4: Security and Privacy Hardening

1.  Default to phishing-resistant Passkeys (WebAuthn) alongside secure session cookies (`HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`).
2.  Enforce strict Content Security Policy (CSP), Trusted Types, and DOMPurify sanitization for all user-generated content.
3.  Validate origins on cross-window messaging (`postMessage`), lock down CORS policies, and minimize third-party tracking scripts.

### Stage 5: Testing and Performance Auditing

1.  Audit Core Web Vitals against target thresholds: LCP under 2.5s, INP under 200ms, and CLS under 0.1.
2.  Break up main-thread long tasks over 50ms using `scheduler.yield()` or `requestIdleCallback`.
3.  Verify keyboard-only navigation, screen-reader announcements (`aria-live`), and end-to-end critical flows before release.

### Stage 6: Deployment and Observability

1.  Configure automated CI/CD pipelines with type-checking, linting, unit/integration tests, and preview environments.
2.  Enable Brotli/Gzip compression, HTTP/3, immutable asset hashing, and proper PWA manifest and service worker caching rules.
3.  Instrument Real User Monitoring (RUM) for Core Web Vitals, structured backend logs, error tracking, and zero-downtime rollback hooks.

## Core Engineering Guardrails

- **Platform First:** Prefer native HTML, CSS, and Web APIs over heavy third-party libraries whenever browser support is baseline.
- **No Layout Thrashing:** Never interleave DOM reads (`offsetHeight`, `getBoundingClientRect()`) and writes inside loops; animate only compositor-friendly properties (`transform`, `opacity`, `clip-path`).
- **Zero-Trust Inputs:** Validate and sanitize every input at both the UI boundary and the backend API boundary using parameterized queries.
- **Graceful Degradation:** Ensure core content and navigation work even when third-party scripts fail or network conditions degrade.
