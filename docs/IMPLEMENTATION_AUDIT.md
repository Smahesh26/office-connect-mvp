# Production Reality Audit & Functionality Truth Map

**Date**: August 31, 2026  
**Auditor**: Antigravity Engineering Team  
**Scope**: Full Stack — Database, APIs, Customer Storefront, 3P Seller Portal, Super-Admin Governance Center, Authentication & Security.

---

## 1. Executive Summary & Golden Rule Assessment

> [!CAUTION]
> **Golden Rule Standard**: A feature is classified as **FUNCTIONAL (✅ LIVE)** *only* if its complete end-to-end path works:  
> `UI ──▶ Authenticated Request ──▶ RBAC Authorization ──▶ Server Validation ──▶ Business Logic ──▶ DB Transaction ──▶ External Provider ──▶ Persisted State ──▶ UI Re-render & Error Handling`.
> 
> A button or screen existing in the UI does **NOT** indicate that the feature is functional.

### Overall Status Breakdown
- **✅ LIVE (End-to-End Persisted)**: 12% (B2B SaaS Multi-Tenant Auth, User Management, Workspace Modules, Invoicing/GST engine, Raw Catalog API).
- **🟡 PARTIAL (Working with In-Memory/Gaps)**: 18% (Master Catalog & Category Tree, PDP Buy Box Scoring, Storefront Recommended Grid).
- **🔵 MOCK / SIMULATED (Interactive with hardcoded/local state)**: 45% (Multi-Vendor Cart, 4-Step Checkout, 6-Stage Order Timeline, Seller Product Creator Matrix, Seller Orders Pipeline, Admin KYB Desk, Admin Finance Engine).
- **⚪ UI ONLY (Visual component without backend)**: 20% (Dispute Arbitration, Return RMA Inspection Desk, Payout Transfers, Bulk Upload, Coupon Engine).
- **⚠ CRITICAL SECURITY RISKS**: 5% (Unprotected Public `/vendor-dashboard` and `/admin-dashboard` routes, Client-side Price/Cart Trust, Lack of Server-Derived Seller Principal).

---

## 2. Comprehensive Feature-by-Feature Truth Matrix

| Feature Domain | Feature Name | Frontend Location | Backend / API Location | DB Models Involved | External Dependencies | Current Status | What Actually Works | What is Mocked / Incomplete | Security / Blocker Concerns | Recommended Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth & Access** | Customer Authentication | `app/login`, `StorefrontAccountDropdown.tsx` | `/api/auth/login` | `User`, `Contact` | None | 🟡 PARTIAL | Login/register works for SaaS users | No B2C customer session separation | Session hijacking / token mixup | Implement dedicated B2C Customer Auth session with HttpOnly cookies |
| **Auth & Access** | Seller Portal Authentication | `app/vendor-dashboard` | None | `Store`, `StoreMember`, `User` | None | ⚪ UI ONLY | None (Route is open to all visitors) | All seller auth and tenant isolation is simulated | ⚠ **CRITICAL BLOCKER**: Anyone can access seller dashboard | Add Next.js auth middleware & derive `sellerId` from JWT server token |
| **Auth & Access** | Super-Admin RBAC | `app/admin-dashboard` | `/api/admin/*` | `User`, `Role`, `OrganizationUser` | None | ⚪ UI ONLY | Saas admin API exists | `/admin-dashboard` route is completely public | ⚠ **CRITICAL BLOCKER**: Unauthenticated public access | Protect route with `SUPER_ADMIN` server session check |
| **Catalog** | Master Product Registry | `app/storefront`, `app/categories` | `/api/catalog/products`, `/api/catalog/categories` | In-Memory `catalog.service.ts` | None | 🟡 PARTIAL | REST API returns JSON with filtering | Stored in in-memory singleton array | Data resets on server restart | Migrate `catalog.types.ts` into Prisma schema (`Product`, `Brand`, `Category`) |
| **Catalog** | Algorithmic Buy Box | `app/product/[id]`, `ProductBuyBox.tsx` | `/api/catalog/products/:id` | In-Memory `catalog.service.ts` | None | 🟡 PARTIAL | Service calculates winner from price & rating | Uses in-memory listing array | No database concurrency locking | Persist multi-seller listings in DB and query with price/SLA sorting |
| **Cart** | Multi-Vendor Cart | `app/cart`, `StorefrontCartDrawer.tsx` | `/api/storefront/cart` (stub) | `Cart`, `CartItem` | None | 🔵 MOCK | UI groups items by seller, updates qty | Stored in React local state; not persisted across devices/logout | Client can manipulate prices in payload | Create server-side cart API with database persistence and server-calculated totals |
| **Checkout** | 4-Step Checkout Engine | `app/checkout/*` | None | `Order`, `OrderItem` | Razorpay / Stripe (unwired) | 🔵 MOCK | Step navigation, address validation UI | No server order creation or payment capture | Client submits unverified totals | Build transactional checkout endpoint creating `CustomerOrder` and `SellerOrder` |
| **Orders** | Order Splitting & Fulfillment | `app/orders`, `app/orders/[id]` | None | `Order`, `OrderItem` | Courier APIs (none) | 🔵 MOCK | 6-stage timeline UI renders `OC-89412` | Order data is hard-coded in component | No real status updates or tracking webhooks | Implement `Order -> SellerOrder` splitting and status state machine |
| **Seller Ops** | 10-Section Product Studio | `components/seller-portal/product-creator/*` | `POST /api/catalog/listings` (stub) | `ProductListing` | None | 🔵 MOCK | 12-SKU matrix generator, forms | Does not persist to PostgreSQL; state resets on reload | Seller can pass arbitrary `productId` | Connect studio to authenticated `POST /api/seller/listings` API |
| **Seller Ops** | Orders Pipeline & SLA | `components/seller-portal/SellerOrdersPipeline.tsx` | None | `Order` | Bluedart / Delhivery (none) | 🔵 MOCK | Filter tabs, countdown timers | Order list is hardcoded in frontend | No carrier dispatch API | Build Seller Orders API scoped strictly by server-verified `sellerId` |
| **Finance** | Marketplace Escrow & Payouts | `components/seller-portal/SellerFinanceSuite.tsx` | None | `JournalEntry`, `Transaction` | Bank NEFT / Razorpay Route | ⚪ UI ONLY | UI displays ₹18.4L GMV, 8.5% fee | Numbers are hard-coded in TSX files | No escrow account or payout ledger | Integrate real banking split payments (Razorpay Route / Stripe Connect) |
| **Admin Ops** | 5-Stage Seller KYB Desk | `components/admin-marketplace/AdminMarketplaceDomain.tsx` | None | `Store` | PAN/GSTIN APIs (none) | 🔵 MOCK | Approve/Reject buttons toggle React state | No database persistence or document storage | Document vetting is unauthenticated | Build Admin KYB verification endpoints with persistent status |
| **Admin Ops** | Platform Commission Engine | `components/admin-marketplace/AdminFinanceDomain.tsx` | None | None | None | 🔵 MOCK | Slider modifies React state | No database table for commission rules | Commission overrides are not enforced on backend | Build `CommissionRule` table with category defaults and seller overrides |
| **Audit Log** | Immutable Audit Trail | `components/admin-marketplace/AdminOperationsDomain.tsx` | None | None | None | 🔵 MOCK | SHA-256 hash UI strings | Random client-generated hashes; not stored in DB | Not immutable; no hash-chaining | Build append-only audit ledger with cryptographic previous-hash chaining |

---

## 3. Database Truth & Data Lineage Audit

### Where Every Number Actually Comes From:
1. **Storefront Hero & Categories**: Hard-coded in `StorefrontCategoriesBar.tsx` and `StorefrontHero.tsx`.
2. **Storefront Recommended Products**: Dynamically fetched from `/api/catalog/products` (backed by in-memory array in `catalog.service.ts` with fallback).
3. **PDP Buy Box Offer**: Calculated dynamically in `catalog.service.ts` from hard-coded in-memory seller listing array.
4. **Cart Subtotal & Tax**: Calculated in React component state in `app/cart/page.tsx`.
5. **Checkout Order ID (`OC-89412`)**: Hardcoded string in `app/checkout/page.tsx`.
6. **Seller Dashboard Metrics (`Today's Sales ₹1,48,920`, `Orders 48`)**: Hardcoded constants in `SellerDashboardHeroMetrics.tsx`.
7. **Admin Dashboard Metrics (`Gross GMV ₹1.42 Cr`, `3 New KYB`)**: Hardcoded constants in `AdminMarketplaceDomain.tsx`.
8. **Audit Trail Hashes**: Generated via template strings in `AdminOperationsDomain.tsx`.

---

## 4. Critical Security & Authorization Vulnerabilities

> [!WARNING]
> ### Blocker 1: Public Exposure of Privileged Dashboards
> Currently, `/vendor-dashboard` and `/admin-dashboard` are public client routes. Any unauthenticated user who enters the URL can view merchant metrics, simulated orders, and admin controls.
> **Remediation**: Implement Next.js middleware and server-side JWT session validation redirecting unauthenticated users to `/login`.

> [!WARNING]
> ### Blocker 2: Client-Side Price & Quantity Trust
> The cart and checkout components compute pricing on the client. If an API were connected directly to these payloads without server-side recalculation, a malicious actor could submit `price: 1` for a ₹29,990 product.
> **Remediation**: At checkout submission, the server MUST fetch canonical prices from the database, compute statutory GST, apply platform commission, and reject any client-supplied totals.

> [!WARNING]
> ### Blocker 3: Lack of Server-Derived Seller Principal
> In a multi-vendor marketplace, `sellerId` must NEVER be accepted from request parameters without verifying that the authenticated user owns that specific `Store`.
> **Remediation**: All seller APIs must extract `userId` from the verified JWT cookie, resolve the associated `StoreMember` record, and enforce `WHERE storeId = :authenticatedStoreId`.

---

## 5. Architectural Remediation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASED REMEDIATION SEQUENCE:                                                                    │
│                                                                                                 │
│  [P0 - Immediate Security & Access Lockdown]                                                    │
│   1. Implement Next.js server-side route guards for /vendor-dashboard and /admin-dashboard.     │
│   2. Enforce server-side price recalculation on all transactional endpoints.                    │
│   3. Enforce tenant isolation deriving sellerId strictly from verified JWT claims.              │
│                                                                                                 │
│  [P1 - Core Data Persistence]                                                                   │
│   4. Migrate Catalog (Brand, Category, Product, ProductVariant, SellerListing) into Prisma DB. │
│   5. Implement PostgreSQL Cart & CartItem persistence API.                                      │
│   6. Build Order Splitting transaction engine (CustomerOrder -> SellerOrder[]).                │
│                                                                                                 │
│  [P2 - Financial & Operational Integrity]                                                       │
│   7. Integrate real Escrow Payment Provider (Razorpay Route / Stripe Connect).                  │
│   8. Implement append-only financial ledger for commissions, TCS/TDS, and payouts.             │
│   9. Build real document upload & verification for 5-Stage Seller KYB.                         │
│                                                                                                 │
│  [P3 - Governance & Hardening]                                                                 │
│   10. Replace client mock audit logs with server-enforced chained audit trail.                  │
│   11. Audit and sanitize all public trust/legal marketing claims.                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```
