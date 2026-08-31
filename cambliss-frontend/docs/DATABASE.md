# Database — Marketplace Models

## Core Marketplace Entity Relationships

```
Organization (platform)
  └── Store (seller store)
        ├── StoreMember (staff)
        ├── Category (hierarchical)
        ├── ProductListing ──→ Product (global catalog)
        ├── Cart ──→ CartItem ──→ ProductListing
        ├── Order ──→ OrderItem ──→ ProductListing
        │     └── ReturnRequest ──→ ReturnItem
        └── MarketplaceEvent (analytics)
```

## Key Models

### Product (global catalog)
- Organization-scoped canonical product
- Fields: name, sku, hsnCode, description, unitPrice, costPrice, taxRate
- One product can have many listings across stores

### ProductListing (seller's offer)
- Store-scoped listing of a Product
- Fields: sellingPrice, baseCurrency, multiCurrencyPrices, description, images, SEO
- Unique constraint: one listing per product per store
- Pricing belongs here, not on Product

### Store (seller store)
- Organization-scoped
- Fields: name, domain, description, sellerTier, payment config
- Trust tiers: new → verified → premium

### Category (hierarchical)
- Store-scoped with parent/child self-reference
- Unique constraint: name + parentId within a store

### Order
- Store-scoped, linked to Contact (customer)
- Fields: status, paymentStatus, totalAmount, currency, razorpay IDs
- Fulfillment tracking: packedAt, shippedAt, deliveredAt, trackingNumber
- Trust-based inspection flow

### Cart
- Store-scoped, linked to Contact
- CartItem references ProductListing with quantity and unitPrice

## Monetary Values
All monetary fields use `Decimal` with explicit precision:
- Prices: `Decimal(12,2)`
- Order totals: `Decimal(14,2)`
- Exchange rates: `Decimal(10,6)`
- Tax rates: `Decimal(5,2)`

Never use JavaScript `number` for money.
