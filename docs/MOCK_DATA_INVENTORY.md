# Mock Data & Simulation Inventory

**Date**: August 31, 2026  
**Auditor**: Antigravity Engineering Team  
**Objective**: Catalog every hard-coded, mocked, in-memory, local-storage, and simulated data structure across the entire codebase to establish a clear single-source-of-truth migration roadmap.

---

## 1. Complete Mock Data Inventory

| Domain | Source File | Data Structure / Variable | Current Mechanism | Real Database / API Target | Migration Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Storefront** | `cambliss-backend/src/modules/catalog/catalog.service.ts` | `categories`, `brands`, `products`, `listings` | In-memory singleton array | PostgreSQL tables via Prisma: `Category`, `Brand`, `Product`, `ProductVariant`, `SellerListing` | 🟡 PARTIAL (Serves live REST API, but resets on restart) |
| **Storefront** | `cambliss-frontend/app/storefront/page.tsx` | `fallbackRecommended` | Hardcoded JSON array in component | `fetchCatalogProducts()` API | 🟡 PARTIAL (Dynamically fetches API, falls back if offline) |
| **Storefront** | `cambliss-frontend/components/storefront/StorefrontCategoriesBar.tsx` | `categories: MegaMenuData[]` | Hardcoded JSON hierarchy in component | `GET /api/catalog/categories` | 🔵 MOCK |
| **Storefront** | `cambliss-frontend/components/storefront/StorefrontSearchBar.tsx` | `categories` dropdown array | Hardcoded string array | `GET /api/catalog/categories` | 🔵 MOCK |
| **Storefront** | `cambliss-frontend/components/search/SearchAutocompletePopover.tsx` | `trendingSearches`, `recentSearches`, `mockBrandSuggestions` | Hardcoded string arrays + `localStorage` | Search suggestion index in Redis/Elasticsearch | 🔵 MOCK |
| **Storefront** | `cambliss-frontend/components/storefront/StorefrontLocationSelector.tsx` | `sampleAddresses: AddressOption[]` | Hardcoded JSON array | `GET /api/customer/addresses` | 🔵 MOCK |
| **Storefront** | `cambliss-frontend/components/storefront/StorefrontAccountDropdown.tsx` | `isLoggedIn`, mock user `Alex Johnson` | Component React State (`useState(true)`) | Auth JWT session context | 🔵 MOCK |
| **PDP** | `cambliss-frontend/app/product/[id]/page.tsx` | Product details, specs, reviews count | Hardcoded object with mock reviews | `GET /api/catalog/products/:id` | 🟡 PARTIAL |
| **Cart** | `cambliss-frontend/app/cart/page.tsx` | `cartItems` state | React `useState` | `GET /api/cart` querying PostgreSQL `CartItem` | 🔵 MOCK |
| **Checkout** | `cambliss-frontend/app/checkout/page.tsx` | Order ID `OC-89412`, steps state | React `useState` | `POST /api/checkout/orders` | 🔵 MOCK |
| **Orders** | `cambliss-frontend/app/orders/page.tsx`, `app/orders/[id]/page.tsx` | `sampleOrders` array, 6-stage timeline | Hardcoded JSON array | `GET /api/orders` querying PostgreSQL `Order` | 🔵 MOCK |
| **Seller Portal** | `components/seller-portal/SellerDashboardHeroMetrics.tsx` | `stats: Today's Sales ₹1,48,920, Orders 48` | Hardcoded props / constants | `GET /api/seller/analytics/overview` (SQL aggregates) | 🔵 MOCK |
| **Seller Portal** | `components/seller-portal/SellerOrdersPipeline.tsx` | `initialOrders: OrderItem[]` | Hardcoded array of 8 orders | `GET /api/seller/orders` (scoped by `storeId`) | 🔵 MOCK |
| **Seller Portal** | `components/seller-portal/SellerFinanceSuite.tsx` | `GMV ₹18.4L, Cut 8.5%, Payouts` | Hardcoded constants | `GET /api/seller/finance/ledger` | 🔵 MOCK |
| **Seller Portal** | `components/seller-portal/product-creator/*` | Matrix generation (12 SKUs) | Component `useState` | `POST /api/seller/listings` | 🔵 MOCK |
| **Admin Panel** | `components/admin-marketplace/AdminMarketplaceDomain.tsx` | `initialSellers`, `initialStores`, `initialCustomers` | Component `useState` with mock arrays | `GET /api/admin/marketplace/*` | 🔵 MOCK |
| **Admin Panel** | `components/admin-marketplace/AdminCommerceDomain.tsx` | `orders`, `returns`, `refunds` | Component `useState` with mock arrays | `GET /api/admin/commerce/*` | 🔵 MOCK |
| **Admin Panel** | `components/admin-marketplace/AdminFinanceDomain.tsx` | `payments`, `commissions`, `settlements` | Component `useState` with mock arrays | `GET /api/admin/finance/*` | 🔵 MOCK |
| **Admin Panel** | `components/admin-marketplace/AdminOperationsDomain.tsx` | Audit logs with SHA-256 strings | Component `useState` with mock arrays | `GET /api/admin/audit-logs` | 🔵 MOCK |

---

## 2. Strategy for Single Source of Truth

All mock arrays will be systematically replaced with authenticated PostgreSQL Prisma queries in Phase 4 & Phase 5 following the strict database migration plan.
