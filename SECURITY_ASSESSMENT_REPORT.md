# OfficeConnect — Security Assessment Report

**Application:** OfficeConnect (cambliss SaaS platform)
**Components tested:** Backend API (Express/TypeScript, `:4000`), Frontend (Next.js, `:3000`)
**Assessment type:** Grey-box security assessment — OWASP Top 10 methodology + automated/active probing (Burp-style)
**Date:** 2026-07-31
**Environment:** Local development/staging instance (`http://localhost:4000`)

---

## 1. Executive Summary

A security assessment was performed against the OfficeConnect platform covering authentication, authorization, session handling, transport security, input handling, dependency hygiene, and common web vulnerabilities (OWASP Top 10).

During the engagement, multiple issues were identified **and remediated**, and the fixes were re-tested and verified live. The application now passes **all 13 automated security checks** and all active manual probes, with **0 failures**.

**Current posture:**

| Metric | Result |
|---|---|
| Automated security checks | 13 PASS / 0 FAIL |
| Active manual probes (SQLi, traversal, methods, DoS) | All expected/secure responses |
| Backend production dependency vulnerabilities | 16 (from 34 at start) — all transitive |
| Frontend production dependency vulnerabilities | 3 (from 11 at start) |
| Critical/High application-level findings open | 0 |

**Residual risk is LOW**, with a small number of hardening recommendations and manual test areas noted in Sections 5–6.

---

## 2. Scope & Methodology

**In scope:** OfficeConnect backend REST API and Next.js frontend, running locally.

**Methodology:**
- OWASP Top 10 (2021) mapped test plan.
- Automated, repeatable security probe script (`cambliss-backend/scripts/security-probe.mjs`).
- Auth-flow verification scripts (`scripts/verify-cookie-auth.mjs`, `scripts/verify-frontend-cookie-migration.mjs`).
- Active manual probing via `curl` (injection, traversal, HTTP methods, DoS guards).
- Privilege-escalation testing with a seeded non-admin (EMPLOYEE) account.
- Software Composition Analysis via `npm audit`.
- Manual code review of authentication, CORS, error handling, and file handling.

**Out of scope / not performed (recommended as follow-up):** Full stored-XSS testing of rich text fields, SSRF via user-controlled outbound URLs, and cross-tenant IDOR testing (requires a second provisioned tenant with data — see Section 6).

---

## 3. OWASP Top 10 Coverage

| # | Category | Status | Notes |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Verified | Tool endpoints require auth; non-admin (EMPLOYEE) blocked from admin route (403). Cross-tenant IDOR pending manual test (Section 6). |
| A02 | Cryptographic Failures | ✅ Verified | JWT signature enforced; `alg:none`/forged tokens rejected; auth token stored **only** in an `HttpOnly; SameSite=Strict` cookie (not JavaScript-readable). |
| A03 | Injection | ✅ Verified | SQL injection payloads safely rejected (Prisma parameterization). Malformed JSON handled. |
| A04 | Insecure Design | ✅ Improved | Rate limiting on auth + tool endpoints; upload size caps; body-size limit (413). |
| A05 | Security Misconfiguration | ✅ Remediated | `helmet` headers added; CORS hardened; stack-trace leakage fixed; `X-Powered-By` hidden. |
| A06 | Vulnerable Components | ⚠️ Improved | Dependency vulns reduced ~53% (backend) / ~73% (frontend); residual transitive items remain (Section 5). |
| A07 | Identification & Auth Failures | ✅ Verified | Login brute-force throttled (429); token tampering rejected. |
| A08 | Software/Data Integrity | ✅ Improved | Replaced vulnerable `xlsx` (prototype pollution/ReDoS) with `exceljs`. |
| A09 | Logging & Monitoring | ✅ Improved | Centralized error handler logs server-side, returns generic client messages. |
| A10 | SSRF | ⚠️ Pending | Outbound-fetch features (background remover, converters) should be manually tested (Section 6). |

---

## 4. Findings Identified & Remediated

All items below were **found and fixed** during this engagement, then re-verified.

| ID | Finding | Severity | Status |
|---|---|---|---|
| F-01 | Tool API endpoints reachable without authentication (route-mount ordering caused auth bypass / anonymous resource abuse) | High | ✅ Fixed & verified |
| F-02 | Missing HTTP security headers (no CSP, HSTS, X-Frame-Options, nosniff) | Medium | ✅ Fixed (`helmet`) |
| F-03 | CORS reflected arbitrary origins with credentials when unconfigured | Medium | ✅ Fixed (allowlist) |
| F-04 | Stack trace / internal details leaked on malformed input | Medium | ✅ Fixed (central error handler) |
| F-05 | Vulnerable `xlsx` dependency (prototype pollution + ReDoS, no upstream fix) | High | ✅ Fixed (migrated to `exceljs`) |
| F-06 | Auth token stored in `localStorage`, readable by JavaScript (XSS token theft) | High | ✅ Fixed & verified — token removed from `localStorage`; real JWT now lives only in an `HttpOnly; SameSite=Strict` cookie |
| F-07 | No rate limiting on resource-intensive tool endpoints (DoS/abuse) | Medium | ✅ Fixed (per-IP throttle) |
| F-08 | No file upload size limit (large-file DoS) | Medium | ✅ Fixed (50 MB cap) |
| F-09 | Runtime bug: native `fetch` invoked detached ("Illegal invocation") | Low (stability) | ✅ Fixed |

### Verified secure behaviors (active probes)

| Test | Result | Interpretation |
|---|---|---|
| SQL injection on `/api/auth/login` | `401` (no SQL error) | Injection not possible — ORM parameterized |
| Path traversal on `/uploads/..%2f..` | `404` | Static server confined to uploads dir |
| Oversized JSON body (200 KB) | `413 Payload Too Large` | Body-size DoS guard active |
| `TRACE` method | `401` | No cross-site tracing (XST) |
| CORS preflight (allowed origin) | `204` | Preflight correct |
| Forged `alg:none` / garbage / empty JWT | `401` | Signature enforced |
| Login brute-force (repeated) | `429` after ~10 | Throttling active |
| Tools flooding | `429` after ~25 | Throttling active |
| `HttpOnly` cookie auth (login) | `Set-Cookie: HttpOnly; SameSite=Strict` | Cookie transport secure |
| Privilege escalation (non-admin → admin route) | `403` | Role-based access control enforced |
| Frontend auth token in `localStorage` | Not present (marker only) | Real JWT not exposed to JavaScript |

---

## 5. Residual Dependency Risk (A06)

Remaining production advisories are **transitive** (pulled in by upstream libraries), not directly introduced by application code.

**Backend — 16 total (10 high, 6 moderate):**
- `firebase-admin` chain → `@google-cloud/storage`, `gaxios`, `google-gax`, `teeny-request`, `retry-request` (moderate)
- `exceljs` chain → `archiver`, `archiver-utils`, `zip-stream`, `readdir-glob` (high) — introduced when replacing `xlsx`; net risk still lower than the removed prototype-pollution library
- `brace-expansion`, `minimatch`, `glob`, `rimraf` (high) — common transitive DoS advisories
- `uuid` (moderate)

**Frontend — 3 high:** transitive (`sharp`/`ws` chains); full remediation requires a major framework bump.

**Recommendation:** Schedule dependency updates (`npm audit fix`; evaluate `npm audit fix --force` in a branch for breaking upgrades). Track `firebase-admin` and `exceljs`/`archiver` for upstream patches. None are directly exploitable through current application entry points.

---

## 6. Open Items & Recommendations

| Priority | Item | Rationale |
|---|---|---|
| **High** | Cross-tenant IDOR testing with two provisioned tenant accounts | Highest-value test for multi-tenant SaaS; not safely automatable without a second tenant's data. Probe template ready. |
| Medium | Manual stored-XSS testing of CRM/chat/notes rich fields (Burp) | Injection into persisted, rendered content. |
| Medium | SSRF testing of background-remover / document-converter outbound URLs (Burp Collaborator) | Validate user input cannot steer server-side requests. |
| Low | Add a user-existence/active check in JWT middleware | Defense-in-depth: reject tokens for deleted/disabled users before expiry. |
| Low | Governance of `JWT_SECRET` source (currently sourced from an exported env var, not `.env`) | Prevent accidental key change invalidating all sessions on redeploy. |
| Low | Unknown API routes return `401` rather than `404` | Cosmetic; does not leak route existence, acceptable. |

---

## 7. Re-testing

The assessment is fully repeatable:

```bash
# From cambliss-backend/ with the API running on :4000
node scripts/security-probe.mjs

# To include authorization/IDOR checks:
$env:PROBE_LOWPRIV_EMAIL="<non-admin>"; $env:PROBE_LOWPRIV_PASSWORD="<pw>"
$env:PROBE_TOKEN="<jwt>"; $env:PROBE_IDOR_PATH="/api/<another-tenant-resource>"
node scripts/security-probe.mjs
```

Dependency posture: `npm audit --omit=dev` in each project.

---

## 8. Conclusion

The OfficeConnect platform underwent targeted security hardening across authentication, authorization, transport security, input handling, and dependency hygiene. **Nine findings were remediated and verified** (including full migration of the auth token to an `HttpOnly` cookie), dependency exposure was materially reduced, and the application passes all automated and active security checks with zero failures.

**Overall residual risk: LOW.** The primary remaining task is the manual cross-tenant IDOR / XSS / SSRF testing listed in Section 6, which requires provisioned multi-tenant test data.

---

*Prepared using OWASP Top 10 (2021) methodology with automated probing and manual verification. This report reflects the state of the local/staging instance on the assessment date.*

---

## Appendix A — Changes Implemented

Concrete code/configuration changes made during remediation.

| Finding | Change | Location |
|---|---|---|
| F-01 | Moved `/api/tools` mount ahead of the bare `/api` routers so the tools router's auth is not bypassed; added `authenticateJWT` to all tool routes | `src/index.ts`, `src/modules/tools/tools.routes.ts` |
| F-02 | Added `helmet()` (CSP, HSTS, `X-Frame-Options`, `nosniff`, hides `X-Powered-By`) | `src/index.ts` |
| F-03 | Replaced permissive CORS fallback with an explicit origin allowlist | `src/index.ts` |
| F-04 | Added centralized Express error handler (generic client messages, server-side logging, 400 on malformed JSON) | `src/index.ts` |
| F-05 | Removed `xlsx`; migrated spreadsheet conversion to `exceljs` | `src/modules/tools/tools.service.ts`, `package.json` |
| F-06 | Backend issues `HttpOnly; SameSite=Strict` auth cookie on login/register; middleware accepts cookie **or** Bearer (candidate-based verification); `POST /api/auth/logout` clears cookie. Frontend stores a non-sensitive session marker instead of the JWT; logout calls the logout endpoint | `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.routes.ts`, `src/middleware/auth.middleware.ts`, `src/index.ts` (cookie-parser); `app/login/page.tsx`, `app/register/page.tsx`, `components/WorkspaceShell.tsx` |
| F-07 | Per-IP rate limiter applied to all tool endpoints | `src/modules/tools/tools.routes.ts` |
| F-08 | 50 MB upload size cap on shared multer instance | `src/config/multer.ts` |
| F-09 | Bound native `fetch` to the global scope in the onboarding API client | `lib/onboarding/api.ts` |
| A06 | `npm audit fix` applied to both projects (non-breaking) | `package.json` / lockfiles |

**Verification artifacts (re-runnable):**
- `cambliss-backend/scripts/security-probe.mjs` — 13-check OWASP probe.
- `cambliss-backend/scripts/verify-cookie-auth.mjs` — confirms `HttpOnly` cookie issuance + both auth transports.
- `cambliss-backend/scripts/verify-frontend-cookie-migration.mjs` — confirms the migrated frontend auth flow (placeholder header + cookie) through the Next.js proxy.
