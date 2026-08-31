# Office Connect Multi-Vendor Marketplace — Design System Specification

## 1. Design Philosophy
- **Modern Premium Commerce**: Clean typography, high information density, subtle borders, restrained color accents.
- **Strict Separation**: Consumer Storefront (visual, clean, fast) vs. Seller/Admin Portal (high density, operational, data-focused).
- **Zero Generic Styling**: No AI-generated gradients, no excessive pill shapes, no low-contrast text.

---

## 2. Typography Hierarchy (Inter Font Family)
| Token | Size / Weight | Line Height | Application |
|---|---|---|---|
| **Display 2XL** | 24px / 800 (Black) | 1.2 | Homepage Hero, Category Headlines |
| **Headline XL** | 20px / 800 (Black) | 1.25 | Section Titles, Product Details Title |
| **Headline LG** | 16px / 700 (Bold) | 1.3 | Card Titles, Modal Headers, Table Headers |
| **Body Base** | 14px / 500 (Medium) | 1.5 | Description text, Specs, Checkout Accordion |
| **Body SM** | 13px / 400 (Regular) | 1.4 | Dense table cells, form labels |
| **Caption XS** | 11px-12px / 700 (Bold)| 1.2 | SKU codes, badges, stock counters, metadata |
| **Tabular Figures** | Monospace / 700 | 1.0 | Financial numbers, Price amounts, Bank IBAN/UTR |

---

## 3. Semantic Color Tokens
- **Background & Surfaces**:
  - App Canvas: `#f8fafc` (Slate 50)
  - Card Surface: `#ffffff` (Pure White)
  - Subsurface / Table Row hover: `#f1f5f9` (Slate 100)
- **Text & Contrast**:
  - Primary Text: `#0f172a` (Slate 900)
  - Secondary Text: `#334155` (Slate 700)
  - Muted Metadata: `#64748b` (Slate 500)
- **Brand & Action**:
  - Primary CTA: `#404d85`
  - Hover Action: `#323d6a`
  - Active / Pressed: `#252f5a`
- **Commerce Specific**:
  - Price: `#0f172a` (Black text for maximum readability)
  - Discount Tag: `#dc2626` (Red 600)
  - Rating Star: `#f59e0b` (Amber 500)
  - In-Stock: `#059669` (Emerald 600)

---

## 4. Phase 3 — Customer Storefront Shell & Navigation Architecture
The global storefront layout encapsulates the universal multi-vendor marketplace shell:
- **`StorefrontShell`**: Master layout wrapper enclosing AnnouncementBar, Header, CategoryRibbon, MainContent, and Footer.
- **`StorefrontAnnouncementBar`**: Configurable promotional message ribbon (Free delivery, Returns, dismissible).
- **`StorefrontLocationSelector`**: Multi-region delivery address and pincode popover.
- **`StorefrontSearchBar`**: Dominant marketplace search input with category dropdown prefix and keyboard focus.
- **`StorefrontAccountDropdown`**: Dual state support (Logged-out with Sign In/Register vs. Logged-in with Orders, Wishlist, Addresses, Reviews, Notifications, and Portal Switchers).
- **`StorefrontCategoriesBar`**: Multi-department mega-menu ribbon with structured subcategory grids.
- **`StorefrontMobileDrawer`**: Touch-friendly mobile navigation drawer with expandable department accordions.
- **`StorefrontFooter`**: Grouped multi-column directory (Shop, Customer Service, Sell With Us, About, Trust Badges, Payment Gateway logos, and Mobile Accordions).

---

## 5. Visual Inspection Showcase Routes
- 🔗 **`/storefront-shell-demo`** — Live Storefront Shell & Navigation Inspection Demo
- 🔗 **`/design-system`** — UI Primitives & Atomic Component Catalog
