# Stage 4, 5, and 6: Security, Privacy, Quality Testing, PWA, and Production Deployment

## 1. Web Security and Modern Authentication

### Passkeys (WebAuthn) as Primary Phishing-Resistant Authentication

Implement Passkeys (`navigator.credentials.create` / `navigator.credentials.get`) alongside or replacing legacy passwords:

- **Registration:** Generate a cryptographically random `challenge` (at least 16 bytes) on the server, bind `rp.id` strictly to your effective domain, set `residentKey: 'required'` and `userVerification: 'preferred'`, and verify attestation + `origin` + `rpIdHash` on the backend.
- **Conditional UI (Autofill Passkeys):** Pass `mediation: 'conditional'` to `navigator.credentials.get()` on sign-in inputs annotated with `autocomplete="username webauthn"` so users can sign in with a single biometric tap from the browser autofill dropdown.
- **Passkey Lifecycle Management:** Use `PublicKeyCredential.signalUnknownCredential()`, `signalAllAcceptedCredentials()`, and `signalCurrentUserDetails()` to keep browser/OS password managers synchronized when users revoke or rename passkeys.
- **Email Ownership Verification:** Verify email addresses with short-lived, single-use magic links or OTP codes hashed at rest before linking accounts.

### XSS Prevention: Sanitizer API and Trusted Types

Eliminate DOM-based Cross-Site Scripting (XSS) by banning raw HTML string sinks:

- **Sanitize Untrusted HTML:** Use the native `element.setHTML(untrustedMarkup)` (Sanitizer API) or a hardened sanitizer (DOMPurify) before inserting user-generated rich text. Never assign untrusted strings to `innerHTML`, `outerHTML`, or `document.write()`.
- **Enforce Trusted Types via CSP:**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM_NONCE}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  require-trusted-types-for 'script';
  trusted-types default sanitize-policy;
```

- **Secure External Subresources:** Always attach `integrity="sha384-..."` (Subresource Integrity / SRI) and `crossorigin="anonymous"` to third-party scripts/stylesheets, and isolate untrusted embeds in `<iframe sandbox="allow-scripts">` without `allow-same-origin`.
- **Origin & PostMessage Validation:** Always check `event.origin === EXPECTED_ORIGIN` inside `window.addEventListener('message', ...)` and set explicit `targetOrigin` in `postMessage()`. Never pass `'*'` for sensitive data.
- **Session & CSRF Protection:** Store session tokens in `HttpOnly; Secure; SameSite=Lax` (or `Strict`) cookies, rotate session IDs on login/privilege escalation, and validate `Origin` / `Sec-Fetch-Site` headers on state-changing requests.
- **Client-Side Cryptography:** Use the native Web Crypto API (`crypto.subtle` with `AES-GCM` 256-bit and `ECDSA` / `Ed25519` signatures) and `crypto.getRandomValues()` — never `Math.random()` or custom crypto implementations.

---

## 2. Privacy Engineering and Browser Tracking Protections

- **Data Minimization & Local-First Processing:** Process sensitive user inputs (documents, images, local preferences) on-device using IndexedDB, OPFS, or Built-in AI APIs rather than uploading raw PII to backend servers.
- **First-Party Cookie Hygiene:** Scope cookies narrowly (`__Host-` prefix with `Secure; Path=/; HttpOnly` and no `Domain` attribute) to prevent subdomain cookie injection and third-party tracking leakage.
- **Federated Identity & Storage Access:** Use FedCM (`navigator.credentials.get({ identity: ... })`) for privacy-preserving federated sign-in without third-party tracking cookies, and request `document.requestStorageAccess()` only on explicit user gestures when embedded cross-site storage is genuinely required.
- **Strict Referrer & Permissions Policies:**
  - Send `Referrer-Policy: strict-origin-when-cross-origin` so full URL paths with tokens or search queries never leak to third-party origins.
  - Lock down unused hardware APIs with `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.

---

## 3. Quality Assurance and Automated Testing Strategy

Structure automated testing around a fast, deterministic pyramid:

1. **Static Analysis & Type Checking (Seconds):**
   - Run TypeScript (`tsc --noEmit`), ESLint (including `eslint-plugin-jsx-a11y` and security lint rules), and Prettier in pre-commit hooks and CI.
2. **Unit & Integration Tests (Seconds):**
   - Test pure domain logic, state reducers, schema validators, and database queries (against real ephemeral PostgreSQL/Redis containers via Testcontainers rather than brittle SQL mocks).
3. **End-to-End (E2E) & Visual Regression Tests (Minutes):**
   - Use Playwright across Chromium, Firefox, and WebKit viewports (mobile + desktop) to verify critical user journeys (sign-up, passkey/auth flow, checkout, form validation).
4. **Automated Accessibility & Core Web Vitals Audits:**
   - Run `@axe-core/playwright` on every key route in CI to fail builds on WCAG 2.2 AA violations.
   - Run Lighthouse CI (`lhci autorun`) with enforced performance, accessibility, and best-practices thresholds before merging.

---

## 4. Progressive Web App (PWA) Capabilities

- **Web App Manifest (`manifest.webmanifest`):**
  - Provide `name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`, `background_color`, and maskable + standard PNG icons (`192x192` and `512x512`).
- **Custom Install Experience:**
  - Listen for `beforeinstallprompt`, call `event.preventDefault()`, and display an unobtrusive in-app "Install App" button at a moment of high user engagement (never on initial page load).
- **Resilient Service Worker Caching:**
  - **App Shell & Hashed Assets:** `Cache-First` (immutable content-hashed JS/CSS bundles).
  - **HTML Navigations:** `Network-First` with fast offline fallback page.
  - **API Reads:** `Stale-While-Revalidate` for non-sensitive catalog/profile data; never cache authenticated financial/PII endpoints in shared caches.
- **Origin Migration:** When moving a PWA to a new domain, configure `scope_extensions` and clean 301 redirects so installed app shortcuts and storage migrate smoothly.

---

## 5. Production Deployment, Observability, and Release Safety

### Security & Transport Headers Baseline

Configure your CDN/reverse proxy to serve these headers on every HTML response:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
```

### CI/CD Pipeline and Safe Rollout Checklist

1. **Immutable Artifact Builds:** Build container/edge bundles once in CI, verify dependency lockfiles (`npm ci`), and scan dependencies (`npm audit` / Trivy / Snyk) for critical CVEs.
2. **Database Migration Gate:** Run backward-compatible schema migrations _before_ rolling out new application instances.
3. **Progressive Rollout:** Deploy via **Canary** (1% -> 10% -> 50% -> 100%) or **Blue-Green** deployment with automated rollback triggers tied to HTTP 5xx error rates and p95 latency spikes.
4. **Post-Deploy Verification & Observability:**
   - Run automated synthetic smoke tests against production immediately after cutover.
   - Track structured JSON logs (with correlation `traceId` and scrubbed PII), OpenTelemetry distributed traces, and real-user Core Web Vitals (LCP, INP, CLS) alerts.
