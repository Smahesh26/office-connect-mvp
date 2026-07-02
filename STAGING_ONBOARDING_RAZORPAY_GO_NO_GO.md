# Staging Go/No-Go Report: Onboarding + Razorpay Callback

Date: 2026-06-28

## Scope

- Profile-completion onboarding gate behavior.
- Razorpay order creation + payment verification callback flow.
- Required runtime/env readiness.
- Supporting automated checks (frontend + backend).

## Evidence collected

1. Frontend automated regression tests added and executed.
   - `cambliss-frontend/lib/video-connect.test.ts`
   - Result: `8/8 tests passed`
2. Frontend lint executed.
   - Result: `PASS`
3. Backend full suite executed after security/regression additions.
   - Result: `11/11 suites passed, 113/113 tests passed`
4. Backend Jest open-handle mitigation applied and validated.
   - Added global after-env teardown to close Prisma resources.
   - Result: backend tests complete cleanly without post-run open-handle warning.
5. Environment readiness checks (presence-only, no secret values printed):
   - Backend `.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, `DATABASE_URL` present.
   - Frontend `.env.local`: `NEXT_PUBLIC_RAZORPAY_KEY_ID` present.
   - Frontend rewrite origin: `BACKEND_ORIGIN` missing (defaults to `http://localhost:4000`).

## Gate-by-gate checklist

1. Onboarding gate routes users to profile completion before dashboard/module access.
   - Status: PASS (implemented in dashboard/shell/login/register flows).
2. Profile completion persists organization + onboarding metadata.
   - Status: PASS (wired to `/api/auth/me/organization` and `/api/auth/me/onboarding`).
3. Razorpay order generation endpoint available and wired.
   - Status: PASS (`POST /api/subscription/create-order`).
4. Razorpay signature verification endpoint available and wired.
   - Status: PASS (`POST /api/subscription/verify-payment`).
5. Post-verification onboarding state updates payment completion flag.
   - Status: PASS (frontend updates onboarding with `paymentCardOnboarded: true` after verify success).
6. Live callback lifecycle validated in staging with real payment event.
   - Status: NOT VERIFIED (requires running app against staging backend + actual Razorpay checkout/callback roundtrip).
7. Frontend-to-backend routing for staging origin is explicitly configured.
   - Status: BLOCKED (`BACKEND_ORIGIN` not set; currently defaults to localhost).

## Decision

- Recommendation: **NO-GO for external staging sign-off** until blockers below are completed.

## Blockers

1. `BACKEND_ORIGIN` is not configured in frontend staging env.
2. End-to-end live Razorpay checkout + callback verification has not been executed in staging.

## Exit criteria to flip to GO

1. Set `BACKEND_ORIGIN` in staging frontend environment to the staging backend URL.
2. Execute one successful real-card (or Razorpay test-card) checkout in staging and capture:
   - Order created (`/create-order` 200)
   - Payment verified (`/verify-payment` 200)
   - Onboarding row updated (`paymentCardOnboarded=true`)
   - User redirected to dashboard with gates unlocked.
3. Execute one failed/cancelled payment path and confirm user remains gated to profile completion.
4. Re-run:
   - `cambliss-frontend`: `npm test`, `npm run lint`
   - `cambliss-backend`: `npm test`, `npx tsc --noEmit`

## Notes

- Frontend currently contains a live-looking Razorpay key identifier in `.env.local`; ensure staging and production key separation policy is enforced.
