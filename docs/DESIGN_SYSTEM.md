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

## 4. Reusable Component Catalog
All components are available in `components/ui/`, `components/commerce/`, and `components/admin/`:
- **UI Primitives**: `Button`, `IconButton`, `Input`, `SearchInput`, `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea`, `Badge`, `Chip`, `Modal`, `ConfirmationDialog`, `Drawer`, `Tabs`, `AccordionItem`, `Breadcrumb`, `Pagination`, `Alert`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`.
- **Commerce Primitives**: `ProductCard`, `ProductPrice`, `Rating`, `QuantitySelector`, `WishlistButton`, `SellerBadge`, `StockIndicator`, `DeliveryInformation`.
- **Admin Primitives**: `StatCard`, `PageHeader`, `DataTable`, `BulkActionsBar`.

---

## 5. Visual Inspection Showcase Route
Access the live interactive design system showcase at:
🔗 **`/design-system`**
