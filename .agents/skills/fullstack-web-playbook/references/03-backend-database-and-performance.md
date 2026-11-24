# Stage 3B: Backend Architecture, Database Engineering, Performance Optimization, Modern JS, and WASM

## 1. Backend API Architecture and Data Contracts

Design resilient, predictable backend services that minimize network round-trips and prevent invalid state:

- **Schema-First Validation:** Validate every inbound request (body, query params, headers, cookies) at the edge/controller boundary using a runtime schema validator (e.g., Zod, Valibot, JSON Schema) before executing business logic.
- **Standardized Error Envelopes:** Return consistent RFC 9457 Problem Details (`application/problem+json`) with `type`, `title`, `status`, `detail`, and a `traceId` for fast debugging without leaking stack traces.
- **Idempotency Keys:** Require an `Idempotency-Key` header on all state-mutating payment, order, or creation endpoints (`POST`/`PATCH`) so mobile network retries never duplicate transactions.
- **Rate Limiting and Backpressure:** Apply token-bucket or sliding-window rate limits per IP and authenticated user ID, returning `429 Too Many Requests` with a `Retry-After` header.
- **Graceful Shutdown & Health Probes:** Expose lightweight `/health/live` (process alive) and `/health/ready` (database and cache reachable) endpoints, and drain active HTTP connections cleanly on `SIGTERM`.

---

## 2. Database Engineering, Modeling, and Query Optimization

### Schema Design and Integrity

- **Primary Keys:** Use time-ordered sortable identifiers (`UUIDv7` or `ULID`) instead of random `UUIDv4` for B-tree primary keys to prevent page fragmentation and index cache thrashing on high-write tables.
- **Referential & Domain Constraints:** Enforce `NOT NULL`, `FOREIGN KEY`, `UNIQUE`, and `CHECK` constraints directly in the database rather than relying solely on application-level validation.
- **Timestamps and Money:**
  - Always store timestamps in UTC (`TIMESTAMPTZ` in PostgreSQL) and format to local time zones on the client.
  - Store financial/currency values as exact integers in minor units (e.g., `BIGINT` cents/rupiah) or fixed-point `NUMERIC(19, 4)` — never `FLOAT` or `DOUBLE PRECISION`.
- **Zero-Downtime Migrations:** Use the **Expand-and-Contract** pattern (1. Add nullable column/new index `CONCURRENTLY`; 2. Dual-write and backfill in batches; 3. Switch reads; 4. Drop legacy column in a later deploy). Never run table-locking `ALTER TABLE` statements on hot production tables.

### Indexing, Query Patterns, and Connection Pooling

- **Eliminate N+1 Queries:** Use batched `IN` queries, SQL `JOIN`s, or DataLoader patterns instead of executing queries inside loops.
- **Cursor-Based Pagination:** Replace `OFFSET` pagination (`LIMIT 20 OFFSET 10000`) with keyset/cursor pagination (`WHERE (created_at, id) < (:cursor_time, :cursor_id) ORDER BY created_at DESC, id DESC LIMIT 20`) for constant $O(1)$ lookup speed at any depth.
- **Targeted Composite & Partial Indexes:**
  - Match index column order to equality predicates first, followed by range/sort columns (`CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC)`).
  - Use partial indexes for hot subsets (`CREATE INDEX idx_jobs_pending ON jobs (run_at) WHERE status = 'pending'`).
- **Connection Pooling:** Place a connection pooler (e.g., PgBouncer or built-in driver pool with strict `max` limits) between serverless/container workers and the database to prevent connection exhaustion during traffic spikes.

### Multi-Layer Caching Strategy

1. **HTTP / CDN Edge Cache:** Use `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400` with surrogate cache tags for instant invalidation.
2. **Distributed Cache (Redis/Valkey):** Cache expensive aggregations and session lookups with explicit TTLs and jitter (`ttl + random(0, 30s)`) to prevent cache stampedes.
3. **Request Memoization:** Deduplicate identical reads within a single SSR request lifecycle.

---

## 3. Core Web Vitals and Runtime Performance Engineering

### Largest Contentful Paint (LCP < 2.5s) & Resource Prioritization

- **Never Lazy-Load Above-the-Fold Media:** Never put `loading="lazy"` on the hero image or primary LCP element.
- **Explicit Priority Hints:** Add `fetchpriority="high"` on the hero `<img>` (and `<link rel="preload" as="image" fetchpriority="high">` if discovered late via CSS/JS), while setting `fetchpriority="low"` on offscreen carousels and non-critical background fetches.
- **Prevent Layout Shifts (CLS < 0.1):** Always specify explicit `width` and `height` attributes (or CSS `aspect-ratio`) on `<img>`, `<video>`, `<iframe>`, and ad/embed slots.
- **Responsive Modern Image Formats:** Serve AVIF/WebP via `<picture>` or `srcset` + `sizes`, and use `decoding="async"` for below-the-fold images.

### Interaction to Next Paint (INP < 200ms) & Main-Thread Scheduling

- **Break Up Long Tasks (> 50ms):** Yield back to the main thread during heavy loops or initialization using `scheduler.yield()` (with a `setTimeout(..., 0)` fallback) so user clicks and keystrokes paint immediately:

```js
async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    processSingleItem(items[i]);
    if (i % 50 === 0 && "scheduler" in window && "yield" in scheduler) {
      await scheduler.yield();
    }
  }
}
```

- **Prioritize Tasks (`scheduler.postTask`):** Schedule urgent UI updates with `{ priority: 'user-blocking' }` and defer telemetry/analytics indexing with `{ priority: 'background' }`.
- **Defer Offscreen Rendering (`content-visibility`):** Apply `content-visibility: auto; contain-intrinsic-size: auto 500px;` on long lists, comments, and below-the-fold sections to skip layout/paint work until scrolled near the viewport.
- **Debounce & Defer Scroll Work:** Use passive event listeners (`{ passive: true }`), `IntersectionObserver` instead of scroll geometry reads, and `scrollend` events for post-scroll cleanup.
- **Instant Next-Page Navigations:** Use the **Speculation Rules API** (`<script type="speculationrules">`) with `"eagerness": "moderate"` to prefetch or prerender high-probability internal links on hover/pointerdown.
- **Out-of-Order HTML Streaming:** Stream the page shell immediately and flush slower async data blocks using `<template shadowrootmode="open">` + inline swap scripts so users see content progressively without waiting for the slowest backend query.
- **Flicker-Free A/B Testing:** Resolve experiment buckets at the CDN edge or synchronously before first paint rather than hiding `<body>` with client-side anti-flicker scripts.

---

## 4. Modern JavaScript APIs and WebAssembly (WASM)

### High-Precision Timing, Observability, and Internationalization

- **Monotonic Timestamps:** Use `performance.now()` (or `performance.timeOrigin + performance.now()`) rather than `Date.now()` when measuring durations, animation frames, or event differentials, because `Date.now()` jumps backward or forward during NTP/system clock adjustments.
- **Real-User Monitoring (RUM) & INP Attribution:** Use `PerformanceObserver` with `type: 'event'` (`durationThreshold: 16`) and `type: 'long-animation-frame'` (LoAF) to pinpoint exact slow scripts and event handlers in production.
- **Global Calendars & Formatting:** Use native `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat`, and the `Temporal` API (where supported) instead of bundling heavy legacy date/locale libraries.
- **Location-Agnostic Data Capture & Analytics:** Batch analytics events and flush reliably on `visibilitychange` (`document.visibilityState === 'hidden'`) using `navigator.sendBeacon()` or `fetch(..., { keepalive: true })` instead of deprecated `unload` events (which break Back/Forward Cache `bfcache`).
- **Cross-Tab Synchronization:** Use `BroadcastChannel` or Web Locks API (`navigator.locks.request()`) to coordinate auth token refreshes, leader election, and state sync across open browser tabs.

### WebAssembly (WASM) & C++/Rust Integration

- **When to Use WASM:** Offload CPU-bound workloads—such as image/video codecs, client-side SQLite/DuckDB analytics, PDF generation, CAD/3D physics, and cryptographic hashing—to WebAssembly compiled via Emscripten (`wasm32`) or `wasm-pack`.
- **Keep JS-WASM Boundary Crossing Coarse:** Batch data transfers in typed arrays (`Uint8Array` / `Float64Array`) over linear memory rather than calling small WASM functions thousands of times per frame inside tight JS loops.
- **Run Heavy WASM in Web Workers:** Execute multi-second WASM computations inside a dedicated `Worker` (using `SharedArrayBuffer` with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` when multithreading with pthreads) so main-thread INP stays near zero.
