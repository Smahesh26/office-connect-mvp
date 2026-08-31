# Office Connect Multi-Vendor Marketplace — Product & Information Architecture Specification

## 1. Executive Vision & Core Architectural Tenets

Office Connect Multi-Vendor Marketplace is a premier, enterprise-grade digital commerce platform engineered to deliver Amazon/Flipkart-scale marketplace capabilities with bespoke, modern design standards, information density, and strict domain separation.

### Core Architectural Axiom: Product vs. Seller Listing
In our marketplace:
- **Global Catalog Product (Canonical Asset)**: Represents the immutable physical or digital good (e.g., *Sony WH-1000XM5 Noise-Cancelling Headphones*, Global SKU, EAN/UPC, Master Brand, Master Taxonomy, Global Specifications, Canonical Gallery). Managed and approved at the platform catalog level.
- **Seller Listing (Merchant Offer)**: Represents an individual seller's operational commercial offer linked to that Product (e.g., *Apex Electronics* offering SKU for ₹24,999 with 48-hr dispatch vs. *CloudDirect* offering same SKU for ₹25,499 with 24-hr express shipping). Pricing, SKU inventory, warranty terms, dispatch SLAs, and seller return policies attach exclusively to the **Listing**.

---

## 2. Comprehensive Navigation & Information Architecture (IA)

```
                                  ┌─────────────────────────────────────────┐
                                  │      OFFICE CONNECT MARKETPLACE IA      │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
         │                                             │                                             │
┌────────▼────────┐                           ┌────────▼────────┐                           ┌────────▼────────┐
│ CUSTOMER FRONT  │                           │  SELLER PORTAL  │                           │   ADMIN PANEL   │
│  (Storefront)   │                           │(Merchant Hub)   │                           │ (Platform Ops)  │
└─────────────────┘                           └─────────────────┘                           └─────────────────┘
```

---

## Part I: Customer Storefront Hierarchy

### 1. Homepage (`/`)
- **Purpose**: Welcomes buyers, establishes marketplace trust, facilitates immediate search/discovery, highlights curated global categories, flash events, and top-rated verified merchant storefronts.
- **Primary User**: Guest Shoppers, Registered Customers, B2B Procurement Officers.
- **Important Information Displayed**: Global multi-category search with autocomplete, category visual cards, verified store showcase carousel, personalized recommendations, flash deals with stock scarcity indicators, trust guarantees (100% Escrow Protection, 48-Hr Delivery, Certified Genuine).
- **Primary Actions**: Search catalog, click category pill, click product card, access Shopping Bag.
- **Secondary Actions**: Click vendor brand badge to open dedicated Storefront, access Seller Onboarding link, switch currency/locale.
- **Navigation Relationship**: Root hub; branches to Search Results, Category Listing, Product Details, Dedicated Seller Storefronts, and Auth.
- **Mobile Behavior**: Sticky compact search bar at top, horizontal scrolling category chips with touch inertia, 2-column high-density product grid, fixed bottom navigation bar (Home, Categories, Bag, Orders, Profile).

### 2. Search & Autocomplete Results (`/search?q=[query]`)
- **Purpose**: Provides instant, faceted search results across thousands of global products and seller listings with zero visual noise.
- **Primary User**: High-intent buyers seeking specific SKUs, brands, or categories.
- **Important Information Displayed**: Keyword match count, applied filters breadcrumbs, multi-facet sidebar (Category, Price Range slider, Brand checkboxes, Seller Rating, Prime/Express Delivery toggle, Seller Location), Sort dropdown (Relevance, Price: Low to High, Price: High to Low, Customer Rating, Newest Arrivals).
- **Primary Actions**: Filter faceted criteria, sort results, click Product Card, 1-Click Quick Add to Bag.
- **Secondary Actions**: Save search, toggle List/Grid view, clear all filters.
- **Navigation Relationship**: Invoked from global header search; branches directly to Product Details or filtered Category views.
- **Mobile Behavior**: Collapsible slide-over bottom sheet for multi-select filter matrix; sticky top bar with "Sort" and "Filter (Active: 3)" pills.

### 3. Categories Hub (`/categories`)
- **Purpose**: Visual directory of the entire multi-level marketplace taxonomy.
- **Primary User**: Exploratory shoppers browsing broad product departments.
- **Important Information Displayed**: L1 Root Categories (Electronics, Apparel, Industrial Spares, Beauty, Cloud SaaS), child L2 subcategories, item count per department, featured hero category banners.
- **Primary Actions**: Select specific L1/L2 department to navigate to listing page.
- **Secondary Actions**: Search within taxonomy hierarchy.
- **Navigation Relationship**: Accessed via Header navigation menu; leads directly to Category Listing Page (`/category/[slug]`).
- **Mobile Behavior**: Accordion tree-view or nested vertical category drawer with iconography.

### 4. Category Listing Page (`/category/[slug]`)
- **Purpose**: Department-specific catalog browser showing all listings under a specific taxonomy node.
- **Primary User**: Shoppers browsing a defined vertical (e.g., "Laptops & Enterprise Computing").
- **Important Information Displayed**: Category banner description, subcategory filter chips, active brand carousels, faceted product listing grid, featured merchant highlights for this vertical.
- **Primary Actions**: Select subcategory, filter by technical specifications (e.g., RAM, Processor, Voltage), click Product Card.
- **Secondary Actions**: Compare selected products side-by-side.
- **Navigation Relationship**: Children of Categories Hub; routes to Product Details.
- **Mobile Behavior**: Subcategories displayed as swipeable pill ribbon above product feed.

### 5. Product Listing Grid (`/products`)
- **Purpose**: Global catalog listing view supporting universal filtering, promotions, and brand curation.
- **Primary User**: Universal shoppers.
- **Important Information Displayed**: Comprehensive listing cards showing thumbnail, brand name, canonical product title, multi-seller starting price (`From ₹XX,XXX`), seller count (`Available from 4 verified sellers`), review aggregate rating, shipping badge.
- **Primary Actions**: Click card to open PDP, Quick Add to Cart with default Buy-Box winner.
- **Secondary Actions**: Add to Wishlist (heart toggle).
- **Navigation Relationship**: Reached from global links, campaign banners, and footer directories.
- **Mobile Behavior**: Infinite scroll with skeleton loading placeholders and back-to-top floating button.

### 6. Product Details Page (PDP) (`/product/[slug]`)
- **Purpose**: The core conversion engine. Showcases canonical product information and arbitrates multi-seller listing competition (Buy-Box algorithm).
- **Primary User**: Deciding customers evaluating SKU specifications and choosing merchant offers.
- **Important Information Displayed**: Canonical high-res media gallery with zoom, canonical specs table, Buy-Box winning seller offer (Price, Delivery ETA, Seller Rating, Fulfillment badge), **"Other Sellers on Office Connect" Comparison Table** (comparing Seller Name, Listing Price, Shipping Fee, Return Policy, Seller Tier, "Add to Cart" per seller), verified customer reviews, Q&A section, stock scarcity badge.
- **Primary Actions**: **"Add to Bag"** (default seller), **"Buy Now"** (instant 1-step checkout), select variant (Color, Size, Spec).
- **Secondary Actions**: Choose alternative seller from seller comparison list, share product, add to wishlist, ask product question.
- **Navigation Relationship**: Core destination from Home/Search/Category; links to Cart, Direct Checkout, and Seller Storefronts.
- **Mobile Behavior**: Sticky bottom purchase bar with Price, Quantity, and "Add to Bag" / "Buy Now" CTA buttons; swipeable gallery carousel.

### 7. Dedicated Seller Storefront (`/storefront?vendor=[id]` or `/store/[slug]`)
- **Purpose**: Isolated digital boutique for a specific merchant, highlighting their brand identity, credibility badges, and exclusive catalog.
- **Primary User**: Brand-loyal customers or buyers vetting merchant legitimacy.
- **Important Information Displayed**: Custom Merchant Hero Banner, Store Logo, Verified Merchant Badge, Trust Tier (`Verified / Premium`), Overall Store Rating & Reviews Count, Registered Business Address / Legal Entity, Seller Return Policy & Dispatch SLA, Seller's Active Product Grid.
- **Primary Actions**: Browse/filter seller's catalog, add items to bag, contact seller support.
- **Secondary Actions**: Follow/Favorite Store, report seller to marketplace compliance.
- **Navigation Relationship**: Reached via merchant links on PDP, order invoices, or direct marketing URLs.
- **Mobile Behavior**: Clean brand header card with quick tabs ("All Products", "About Store", "Store Reviews", "Policies").

### 8. Shopping Bag / Cart (`/cart`)
- **Purpose**: Unified multi-vendor staging area where customers review selected items, manage quantities, and observe multi-vendor shipment groupings.
- **Primary User**: Buyers readying for checkout.
- **Important Information Displayed**: Items grouped by Seller (Package 1: Fulfilled by Apex Electronics, Package 2: Fulfilled by Glow Organics), unit prices in INR, quantity steppers, seller shipping fees breakdown, coupon/promo input, price summary (Subtotal, Estimated GST, Delivery Total, Order Total).
- **Primary Actions**: **"Proceed to Secure Checkout"**.
- **Secondary Actions**: Update quantity, remove item, save for later, apply discount voucher.
- **Navigation Relationship**: Accessed via Header Bag icon or PDP "Add to Bag"; routes to Checkout.
- **Mobile Behavior**: Sticky bottom checkout bar displaying total amount and large primary action button.

### 9. Multi-Step Checkout (`/checkout`)
- **Purpose**: Frictionless, secure multi-vendor transaction execution engine.
- **Primary User**: Authenticated / Guest Customers completing purchase.
- **Important Information Displayed**: Step 1: Shipping Address (Saved addresses list or New Address modal), Step 2: Delivery Speed per Seller Package (Standard vs Express), Step 3: Billing & Tax Info (GSTIN input for B2B tax invoice), Step 4: Payment Gateway selection (UPI, Credit/Debit Cards, Net Banking, Escrow Wallet).
- **Primary Actions**: **"Place Order & Pay via Razorpay / Stripe"**.
- **Secondary Actions**: Edit address, change delivery method, review order breakdown.
- **Navigation Relationship**: Accessed from Cart; branches to Payment Gateway modal and Order Confirmation.
- **Mobile Behavior**: Linear accordion step-indicator ensuring focus without distraction; native auto-fill for addresses.

### 10. Order Confirmation & Success (`/order-confirmation/[orderId]`)
- **Purpose**: Provides instant transactional reassurance, payment receipt, and clear fulfillment expectations.
- **Primary User**: Customers post-payment.
- **Important Information Displayed**: Unique Order Reference ID, Transaction Hash, Multi-Package Delivery Timeline, Summary of Items & Sellers, Download Tax Invoice button, Delivery Address confirmation.
- **Primary Actions**: **"Track Order"** button.
- **Secondary Actions**: **"Continue Shopping"**, print receipt.
- **Navigation Relationship**: Terminal checkout screen; routes to Order Tracking or Homepage.
- **Mobile Behavior**: Clean celebratory confirmation card with 1-tap tracking link.

### 11. Customer Order History (`/orders`)
- **Purpose**: Centralized record of all past and active multi-vendor orders.
- **Primary User**: Authenticated Customers.
- **Important Information Displayed**: Chronological order list, order dates, total price, status badge (`Processing`, `Shipped`, `Delivered`, `Cancelled`), thumbnail preview of items, seller names.
- **Primary Actions**: Click order to open Order Details, **"Track Package"**, **"Buy Again"**.
- **Secondary Actions**: Filter by order status or year.
- **Navigation Relationship**: Linked from Account menu; routes to individual Order Details.
- **Mobile Behavior**: Card-based vertical feed with prominent tracking status pill.

### 12. Order Details & Live Tracking (`/orders/[id]`)
- **Purpose**: Deep-dive operational tracking, package-level status, and post-purchase actions.
- **Primary User**: Customers monitoring dispatch or initiating post-sale workflows.
- **Important Information Displayed**: Live multi-stop timeline (Order Placed → Seller Packed → Carrier Picked Up → In Transit → Out for Delivery → Delivered), Courier Partner Name & Tracking Number, Item-by-item price breakdown, Seller Contact button, Official GST Invoice download.
- **Primary Actions**: Track on Carrier Site, **"Initiate Return / Replacement"** (if within return window), **"Write Product Review"**.
- **Secondary Actions**: Cancel Item (if unfulfilled), Contact Marketplace Support.
- **Navigation Relationship**: Reached from Orders list; links to Returns wizard, Review modal, and Support.
- **Mobile Behavior**: Visual vertical progress stepper with live timestamps.

### 13. Wishlist / Saved Items (`/wishlist`)
- **Purpose**: Personalized repository of saved products for future purchase consideration.
- **Primary User**: Authenticated Customers.
- **Important Information Displayed**: Saved product grid, live price updates (with price drop tags), in-stock/out-of-stock indicators, seller availability.
- **Primary Actions**: **"Move to Bag"**, **"Remove from Wishlist"**.
- **Secondary Actions**: Share Wishlist link, create custom wishlist collections.
- **Navigation Relationship**: Reached from Account navigation; links to PDP and Bag.
- **Mobile Behavior**: 2-column grid with swipe-to-delete gesture.

### 14. Customer Profile & Security (`/profile`)
- **Purpose**: Self-service account credentials and personal preferences management.
- **Primary User**: Authenticated Customers.
- **Important Information Displayed**: Full Name, Verified Email, Phone Number, Password update, Two-Factor Authentication (2FA) status, Notification preferences (Email/SMS/WhatsApp).
- **Primary Actions**: **"Save Profile Changes"**, **"Update Password"**.
- **Secondary Actions**: Deactivate account, manage privacy settings.
- **Navigation Relationship**: Account sub-view.
- **Mobile Behavior**: Streamlined form view with instant validation badges.

### 15. Saved Addresses Book (`/addresses`)
- **Purpose**: Management of multi-location delivery endpoints (Home, Office, Warehouse).
- **Primary User**: Authenticated Customers / Corporate Procurement.
- **Important Information Displayed**: Saved addresses list with Default Shipping and Default Billing tags, Recipient Name, Street Address, City, State, Pincode/ZIP, Contact Phone.
- **Primary Actions**: **"+ Add New Address"**, **"Set as Default"**, **"Edit"**.
- **Secondary Actions**: Delete address.
- **Navigation Relationship**: Account sub-view; accessible inline during Checkout.
- **Mobile Behavior**: Card list with 1-tap edit sheet.

### 16. Customer Reviews & Ratings Manager (`/my-reviews`)
- **Purpose**: Shows all reviews authored by the customer and pending unreviewed verified purchases.
- **Primary User**: Authenticated Customers.
- **Important Information Displayed**: "Unreviewed Purchases" tab (prompting review), "Submitted Reviews" tab with star rating, photo uploads, and seller public responses.
- **Primary Actions**: **"Write Review"**, **"Upload Photo/Video Proof"**.
- **Secondary Actions**: Edit existing review, delete review.
- **Navigation Relationship**: Reached from Account or Order Details.
- **Mobile Behavior**: Star-rating tap widget with camera integration for instant photo attachment.

### 17. Returns & Refunds Hub (`/returns`)
- **Purpose**: End-to-end self-service return merchandise authorization (RMA) tracking.
- **Primary User**: Customers requesting returns or tracking refund escrow releases.
- **Important Information Displayed**: Active return tickets, reason for return (Defective, Wrong Item, Changed Mind), pickup scheduling status, refund destination (Original Payment / Store Credit), refund status (`Inspection Pending`, `Approved`, `Refund Credited`).
- **Primary Actions**: **"Track Return Pickup"**, **"View Refund Credit Note"**.
- **Secondary Actions**: Cancel return request, upload additional damage photos.
- **Navigation Relationship**: Reached from Order Details or Account menu.
- **Mobile Behavior**: Stepper timeline showing physical pickup and bank refund settlement.

### 18. Notifications Inbox (`/notifications`)
- **Purpose**: Real-time customer activity stream for transactional updates, price drops, and seller messages.
- **Primary User**: Authenticated Customers.
- **Important Information Displayed**: Chronological notification cards (Order Shipped, Refund Issued, Flash Deal in Wishlist), read/unread status, direct action links.
- **Primary Actions**: Click notification to jump to relevant order/product.
- **Secondary Actions**: Mark all as read, clear history.
- **Navigation Relationship**: Triggered from Header bell icon.
- **Mobile Behavior**: Full-screen slide-in inbox with push notification permission prompt.

### 19. Customer Support & Dispute Desk (`/support`)
- **Purpose**: Multi-tier resolution center for order inquiries, delivery escalations, and seller dispute mediation.
- **Primary User**: Customers encountering order issues.
- **Important Information Displayed**: FAQ knowledge base, "My Support Tickets" list, Live Chat trigger, Contact Seller / Contact Marketplace Admin option.
- **Primary Actions**: **"Open New Support Ticket"**, **"Start Live Chat"**.
- **Secondary Actions**: View resolved dispute transcripts.
- **Navigation Relationship**: Accessible from footer and order screens.
- **Mobile Behavior**: Sticky chat bubble and collapsible categorized help accordions.

---

## Part II: Seller Portal Hierarchy (`/seller/*`)

### 1. Seller Onboarding & KYC/KYB Wizard (`/seller/onboarding`)
- **Purpose**: 5-stage verification funnel turning applicants into certified marketplace merchants.
- **Primary User**: New merchant registrants.
- **Important Information Displayed**: Step 1: Legal Entity & Incorporation (EIN/CIN/CRN, Registered Address), Step 2: Store Identity & Category, Step 3: Owner KYC (Government ID scan & verification), Step 4: Bank Payouts & Stripe/Razorpay Escrow Connect, Step 5: Tax Compliance (GSTIN / VAT / W-9 electronic declaration).
- **Primary Actions**: **"Continue to Next Step"**, **"Submit Application for Admin Vetting"**.
- **Secondary Actions**: Save draft and exit.
- **Navigation Relationship**: Gatekeeper entry point prior to portal access.
- **Mobile Behavior**: Guided full-height step wizard with mobile camera document capture.

### 2. Seller Overview Dashboard (`/seller/dashboard`)
- **Purpose**: Operational command center delivering real-time sales metrics, order alerts, and fulfillment health.
- **Primary User**: Store Owners, Store Operations Managers.
- **Important Information Displayed**: KPI Cards (Today's Gross Sales, Pending Orders Count, Low Stock SKU Alerts, Average Customer Rating, Net Escrow Payouts Pending), Revenue Trend Graph (7d / 30d / 90d), Live Orders Action Stream, Top 5 Performing SKUs.
- **Primary Actions**: Click **"Process Pending Orders"**, **"Restock Low Inventory"**, **"Create Listing"**.
- **Secondary Actions**: Download sales reconciliation report.
- **Navigation Relationship**: Root dashboard of the Seller Portal.
- **Mobile Behavior**: High-density numeric KPI tiles, prioritized urgent alert cards at top.

### 3. Master Catalog Search & Linkage (`/seller/catalog`)
- **Purpose**: Allows sellers to search the marketplace global master catalog to attach their own pricing and inventory without re-creating global product metadata.
- **Primary User**: Seller Catalog Managers.
- **Important Information Displayed**: Searchable database of approved platform products, brand filters, UPC/EAN search, existing active sellers count per product, suggested MSRP.
- **Primary Actions**: **"Sell This Product"** (launches quick listing modal with Price & Quantity).
- **Secondary Actions**: **"Request New Product Addition"** (if product does not exist in master catalog).
- **Navigation Relationship**: Catalog branch; leads to Create Listing or Request Global Product.
- **Mobile Behavior**: Barcode/UPC camera scanner to instantly match global products.

### 4. My Product Listings (`/seller/listings`)
- **Purpose**: Management table of all active, draft, and paused offers published by this seller.
- **Primary User**: Seller Inventory & Pricing Specialists.
- **Important Information Displayed**: SKU/Title, Global Product thumbnail, Seller Listing Price (INR), Compare-at Price, Stock Level, Buy-Box Win Status (`Winning Buy-Box 🏆` / `Higher Price`), Status toggle (`Active / Paused`), Total Units Sold.
- **Primary Actions**: Inline Price & Stock quick-edit, **"+ Add New Listing"**, Bulk Price Update.
- **Secondary Actions**: Pause listing, delete listing, export catalog CSV.
- **Navigation Relationship**: Listings sub-view.
- **Mobile Behavior**: Responsive cards with inline numeric steppers for price and stock.

### 5. Inventory & Stock Management (`/seller/inventory`)
- **Purpose**: Dedicated warehouse and inventory control center for SKU availability, reserve quantities, and replenishment alerts.
- **Primary User**: Warehouse Clerks, Store Managers.
- **Important Information Displayed**: SKU, Product Name, Total Physical Units, Reserved for Pending Orders, Available to Sell, Low Stock Threshold indicator, Restock Recommendations.
- **Primary Actions**: **"Update Stock Counts"**, **"Set Low Stock Alert Threshold"**.
- **Secondary Actions**: Bulk import inventory spreadsheet, print SKU barcode labels.
- **Navigation Relationship**: Sub-view of Catalog.
- **Mobile Behavior**: Fast scan-and-count interface for warehouse physical stock audits.

### 6. Order Management & Fulfillment Desk (`/seller/orders`)
- **Purpose**: Mission-critical order fulfillment pipeline for processing, packing, and dispatching multi-item shipments within SLA.
- **Primary User**: Fulfillment & Dispatch Staff.
- **Important Information Displayed**: Filter tabs (`New / Unfulfilled`, `Processing / Packed`, `Shipped`, `Delivered`, `Cancelled`), Order ID, SLA Countdown Timer (`🔥 Pack within 3h 24m`), Item Details, Shipping Address, Courier Partner, Manifest Status.
- **Primary Actions**: **"Generate Packing Slip & Shipping Label"**, **"Mark as Dispatched (Enter Tracking ID)"**, **"Schedule Carrier Pickup"**.
- **Secondary Actions**: Print thermal invoice, contact customer via platform proxy, cancel order with reason.
- **Navigation Relationship**: Core daily operational hub.
- **Mobile Behavior**: Full-width order cards with 1-tap "Scan to Ship" camera barcode verification.

### 7. Returns & Dispute Management (`/seller/returns`)
- **Purpose**: Resolution center for customer return requests, inspection outcomes, and replacement dispatches.
- **Primary User**: Customer Service & Quality Assurance Staff.
- **Important Information Displayed**: Return RMA ID, Order Reference, Customer Return Reason, Uploaded Proof Photos, Package Return Tracking, Status (`In Transit to Warehouse`, `Delivered - Needs Inspection`, `Refund Approved`, `Disputed / Fraud Reported`).
- **Primary Actions**: **"Inspect & Approve Refund"**, **"Issue Replacement Shipment"**.
- **Secondary Actions**: **"Dispute Return to Admin"** (with inspection photos and evidence).
- **Navigation Relationship**: Linked from Orders and Dashboard alerts.
- **Mobile Behavior**: Inspection checklist form with direct photo upload.

### 8. Promotions, Coupons & Deals (`/seller/promotions`)
- **Purpose**: Self-serve marketing tools to create store-level coupons, percentage discounts, and flash deal submissions.
- **Primary User**: Store Marketing Managers.
- **Important Information Displayed**: Active Campaigns list, Coupon Code, Discount Type (% or Flat INR), Usage Limit / Total Redeemed, Campaign Start & End Dates, Net Sales Generated via Campaign.
- **Primary Actions**: **"+ Create New Coupon / Discount"**, **"Submit SKU for Platform Flash Sale"**.
- **Secondary Actions**: Pause campaign, duplicate campaign, analyze ROI metrics.
- **Navigation Relationship**: Marketing branch.
- **Mobile Behavior**: Simple toggle switches to activate or pause promotional campaigns.

### 9. Customer Inquiries & Store Q&A (`/seller/customers`)
- **Purpose**: Direct pre-sale Q&A answering and post-sale messaging with customers while maintaining privacy compliance.
- **Primary User**: Seller Customer Support Representatives.
- **Important Information Displayed**: Pending Product Questions on PDP, Post-Order Inquiries, Customer Name, SLA response timer.
- **Primary Actions**: **"Answer Question (Public PDP Post)"**, **"Reply to Customer Inquiry"**.
- **Secondary Actions**: Block abusive user, escalate inquiry to Admin.
- **Navigation Relationship**: Communication branch.
- **Mobile Behavior**: Chat-style conversational interface with canned response templates.

### 10. Store Performance & Financial Analytics (`/seller/analytics`)
- **Purpose**: Deep operational intelligence covering conversion rates, revenue trends, return rates, and customer demographics.
- **Primary User**: Store Executives & Business Owners.
- **Important Information Displayed**: Gross Merchandise Value (GMV), Units Sold, Pageviews to Order Conversion Rate, Return Rate percentage, Buy-Box Win Percentage across competitive SKUs, Customer Geography heatmap.
- **Primary Actions**: Date Range selector (Custom, Last 7d, Last 30d, FY26), Export CSV / PDF Report.
- **Secondary Actions**: Drill-down into specific SKU performance.
- **Navigation Relationship**: Analytics branch.
- **Mobile Behavior**: Condensed interactive SVG chart cards with touch tooltips.

### 11. Settlements, Commission & Escrow Wallet (`/seller/settlements`)
- **Purpose**: Transparent breakdown of marketplace commission fees (e.g. 8.5%), shipping deductions, escrow holding periods, and net payout statements.
- **Primary User**: Seller Finance & Accounting Officers.
- **Important Information Displayed**: Escrow Balance (Held until delivery + return window expiry), Available for Payout Balance, Total Historical Earnings, Platform Commission Statement per Order, Tax Deductions at Source (TCS/TDS).
- **Primary Actions**: **"Request On-Demand Payout to Bank"**, **"Download Monthly GST Settlement Invoice"**.
- **Secondary Actions**: View transaction-level fee ledger.
- **Navigation Relationship**: Finance branch; links to Payouts.
- **Mobile Behavior**: Clear wallet card showing "Held in Escrow" vs "Available for Withdrawal" with instant withdrawal button.

### 12. Payout History & Bank Accounts (`/seller/payouts`)
- **Purpose**: Record of historical automated and manual bank wire / Stripe Connect transfers.
- **Primary User**: Seller Finance Officers.
- **Important Information Displayed**: Payout Reference ID, Bank Account Number (masked), Transfer Date, Status (`Initiated`, `Processing`, `Completed in Bank`), Net Transferred Amount (INR).
- **Primary Actions**: **"Update Bank Payout Account"**.
- **Secondary Actions**: Download bank transfer UTR proof receipt.
- **Navigation Relationship**: Sub-view of Settlements.
- **Mobile Behavior**: Chronological payout feed with UTR transaction codes.

### 13. Store Profile & Brand Customization (`/seller/settings`)
- **Purpose**: Visual boutique management, banner uploads, support policies, and operational configuration.
- **Primary User**: Store Owners.
- **Important Information Displayed**: Store Display Name, Custom URL Handle, Logo Uploader, Hero Banner Uploader, Business Category, Public Phone/Email, Store Operating Hours, Store Shipping & Return Policy Terms.
- **Primary Actions**: **"Save Storefront Settings"**, **"Preview Live Storefront"**.
- **Secondary Actions**: Enable Vacation / Maintenance Mode (temporarily pauses listings).
- **Navigation Relationship**: Settings branch.
- **Mobile Behavior**: Image cropping and preview tool for store banners.

### 14. Team Roles & Permission Management (`/seller/team`)
- **Purpose**: Granular RBAC allowing store owners to invite warehouse clerks, accountants, and marketing staff with scoped permissions.
- **Primary User**: Store Owners / Admins.
- **Important Information Displayed**: Active Staff List, Email, Assigned Role (`Store Manager`, `Fulfillment Operator`, `Finance Specialist`, `Catalog Editor`), Status (`Active`, `Invited`).
- **Primary Actions**: **"+ Invite Team Member"**, **"Edit Role Permissions"**.
- **Secondary Actions**: Revoke access / Remove user.
- **Navigation Relationship**: Settings branch.
- **Mobile Behavior**: User card list with role dropdown badge.

### 15. Seller Help Desk & Policy Guidelines (`/seller/support`)
- **Purpose**: Direct escalation route to Marketplace Platform Operations and official merchant policy documents.
- **Primary User**: All Seller Staff.
- **Important Information Displayed**: Marketplace SLA Guidelines, Commission Rate Card, Packaging Compliance Handbook, Open Support Tickets with Platform Ops.
- **Primary Actions**: **"Create Ticket with Marketplace Admin"**.
- **Secondary Actions**: Request callback from Seller Relationship Manager.
- **Navigation Relationship**: Support branch.
- **Mobile Behavior**: Searchable merchant FAQ database and live ticket status.

---

## Part III: Marketplace Platform Admin Hierarchy (`/admin-dashboard`)

### 1. Marketplace Executive Overview Dashboard (`/admin-dashboard`)
- **Purpose**: Platform-wide command center for marketplace health, aggregate GMV, live commission revenue, active sellers, and security health.
- **Primary User**: Super Admin, Platform Chief Executive.
- **Important Information Displayed**: Platform GMV (Today / MTD / YTD), Net Platform Commission Revenue (8.5%), Total Active Verified Sellers vs. Pending Applications, Total Active Orders, Platform Dispute Escalation Count, Server/Database Health.
- **Primary Actions**: Quick navigation to pending Seller Approvals or Dispute Arbitrations.
- **Secondary Actions**: Download executive board summary PDF.
- **Navigation Relationship**: Root dashboard of the Admin Suite.
- **Mobile Behavior**: Executive high-level KPI cards with red-flag operational alerts at the very top.

### 2. Customer Management Directory (`/admin-dashboard/customers`)
- **Purpose**: Full oversight of registered marketplace buyers, corporate accounts, and customer risk profiles.
- **Primary User**: Admin Customer Operations.
- **Important Information Displayed**: Customer Name, Email, Phone, Account Creation Date, Lifetime Order Count, Total Spend (LTV), Account Status (`Active / Flagged / Suspended`), Risk Score.
- **Primary Actions**: View Customer Detail, **"Impersonate Customer"** (for troubleshooting), **"Suspend Account"**.
- **Secondary Actions**: Reset 2FA, export customer directory CSV.
- **Navigation Relationship**: Customer domain branch.
- **Mobile Behavior**: Searchable list with quick filter chips.

### 3. Seller Directory & Performance Index (`/admin-dashboard/sellers`)
- **Purpose**: Universal registry of all active, probationary, and suspended merchant organizations.
- **Primary User**: Merchant Relationship Managers, Compliance Officers.
- **Important Information Displayed**: Legal Business Name, Store Name, Trust Tier (`New / Verified / Premium`), Total Active SKUs, Total Sales Volume, Seller Rating, Return Rate %, KYC Status (`Verified / Incomplete`).
- **Primary Actions**: View Seller Profile, **"Adjust Trust Tier"**, **"Audit Financials"**.
- **Secondary Actions**: Suspend Store, force Vacation Mode, edit custom commission rate override.
- **Navigation Relationship**: Seller domain branch.
- **Mobile Behavior**: Detailed merchant cards with tier badges.

### 4. Seller Approval & KYC/KYB Vetting Desk (`/admin-dashboard/seller-approvals`)
- **Purpose**: Compliance gate for inspecting corporate registrations, tax documents, and photo IDs before merchant launch.
- **Primary User**: Compliance Officers, Legal Admins.
- **Important Information Displayed**: Pending Seller Queue, Legal Entity Details, EIN/CIN verification match, Uploaded Government ID Scans (Front/Back modal inspection), Bank Payout Verification, Tax W-9/GSTIN status.
- **Primary Actions**: **"Approve & Activate Seller"**, **"Reject Application (Specify Compliance Deficiencies)"**.
- **Secondary Actions**: Request Additional Documentation from seller.
- **Navigation Relationship**: High-priority operational queue under Sellers.
- **Mobile Behavior**: Document inspection zoom viewer with quick approve/reject buttons.

### 5. Global Catalog Governance & Master SKU Manager (`/admin-dashboard/catalog`)
- **Purpose**: Master platform repository of canonical products; maintains global data purity and eliminates duplicate product entries.
- **Primary User**: Catalog Masters, Content Operations.
- **Important Information Displayed**: Global Product Title, Master SKU, Universal Brand, L1/L2/L3 Category, Active Seller Offers Count (`Sold by 8 merchants`), Lowest Active Price, Canonical Gallery, Global Spec sheet.
- **Primary Actions**: **"+ Create Canonical Global Product"**, **"Merge Duplicate SKUs"**.
- **Secondary Actions**: Edit global specifications, restrict SKU sales in specific jurisdictions.
- **Navigation Relationship**: Catalog domain root.
- **Mobile Behavior**: High-density SKU table with search and brand filters.

### 6. Taxonomy & Category Hierarchy Manager (`/admin-dashboard/categories`)
- **Purpose**: Structured configuration of the marketplace multi-level classification taxonomy and category attributes.
- **Primary User**: Taxonomy Specialists, Category Managers.
- **Important Information Displayed**: Recursive Category Tree (L1 Department → L2 Category → L3 Subcategory), Custom Mandatory Attributes per Category (e.g. "Shoe Size" for Footwear vs "RAM" for Computing), Default Commission Rate per Category (e.g. 12% on Fashion, 5% on Electronics), Category Icon & Banner.
- **Primary Actions**: **"+ Add Category / Subcategory"**, **"Reorder Hierarchy Tree"**, **"Set Category Commission Override"**.
- **Secondary Actions**: Map SEO metadata, delete empty categories.
- **Navigation Relationship**: Sub-view of Catalog.
- **Mobile Behavior**: Interactive drag-and-drop tree reordering view.

### 7. Global Brand Registry & Authorizations (`/admin-dashboard/brands`)
- **Purpose**: Trademark and brand protection registry ensuring only authorized sellers list licensed brand products.
- **Primary User**: Brand Protection Specialists, IP Admins.
- **Important Information Displayed**: Brand Name, Brand Logo, Authorized Trademark Owner, Gated/Ungated Status (`Ungated / Requires Brand Approval`), Number of Linked SKUs, Number of Authorized Sellers.
- **Primary Actions**: **"+ Register New Brand"**, **"Gate Brand (Require Reseller Certificate)"**.
- **Secondary Actions**: Review seller brand authorization requests.
- **Navigation Relationship**: Sub-view of Catalog.
- **Mobile Behavior**: Alphabetical brand directory with fast gating toggles.

### 8. Product Listing Moderation & Content Compliance (`/admin-dashboard/product-moderation`)
- **Purpose**: Automated and manual review desk for newly submitted merchant offers, custom descriptions, and images.
- **Primary User**: Content Moderation Team.
- **Important Information Displayed**: Newly Created / Edited Listings Queue, Flagged Price Anomalies (e.g. ₹10 for an iPhone), Prohibited Keyword Alerts, Image Policy Violations.
- **Primary Actions**: **"Approve Listing to Live Marketplace"**, **"Flag / Reject Listing"**.
- **Secondary Actions**: Ban SKU from merchant.
- **Navigation Relationship**: Sub-view of Catalog.
- **Mobile Behavior**: Fast card-swiping moderation queue.

### 9. Master Marketplace Orders & Dispatch Tracking (`/admin-dashboard/orders`)
- **Purpose**: Global bird's-eye view of every order transacted across the marketplace with cross-seller fulfillment visibility.
- **Primary User**: Platform Operations & Logistics Supervisors.
- **Important Information Displayed**: Master Order ID, Buyer Info, Seller Name(s), Item Breakdown, Total Amount (INR), Platform Fee Earned, Payment Status, Delivery Stage, Carrier Tracking ID, SLA Compliance status.
- **Primary Actions**: **"Inspect Order Ledger"**, **"Update Logistics Escalation"**.
- **Secondary Actions**: Intervene in stuck shipments, cancel fraudulent orders.
- **Navigation Relationship**: Orders domain root.
- **Mobile Behavior**: Searchable multi-status order stream.

### 10. Returns, Refunds & Dispute Arbitration Desk (`/admin-dashboard/returns`)
- **Purpose**: Ultimate tribunal for mediating buyer vs seller return disputes, authorizing forced refunds, or upholding seller claims.
- **Primary User**: Senior Dispute Arbitrators, Customer Experience Leads.
- **Important Information Displayed**: Dispute Case ID, Order ID, Buyer Claim & Photo Evidence, Seller Defense & Inspection Photos, Escrow Holding Status, Recommended Arbitration Decision.
- **Primary Actions**: **"Authorize Platform Forced Refund from Escrow"**, **"Deny Customer Claim & Release Escrow to Seller"**.
- **Secondary Actions**: Issue partial refund / marketplace credit voucher.
- **Navigation Relationship**: Post-sale domain branch.
- **Mobile Behavior**: Split-screen evidence comparator (Buyer photo vs Seller photo).

### 11. Commission Rules & Platform Fee Engine (`/admin-dashboard/commissions`)
- **Purpose**: Enterprise rule engine configuring dynamic marketplace take-rates across categories, seller tiers, and sales volumes.
- **Primary User**: Chief Financial Officer, Platform Business Operations.
- **Important Information Displayed**: Global Base Commission (e.g. 8.5%), Category-Specific Overrides (e.g. Consumer Electronics: 6%, Beauty & Cosmetics: 15%), Seller-Specific Custom Agreements, Payment Gateway Pass-Through Fees (2%), Fixed Closing Fees per Order.
- **Primary Actions**: **"+ Create Commission Rule"**, **"Update Global Commission Rates"**.
- **Secondary Actions**: Simulate commission revenue impact with forecasting calculator.
- **Navigation Relationship**: Financial domain branch.
- **Mobile Behavior**: Clean numeric configuration cards with real-time rule validators.

### 12. Settlement Engine & Escrow Batch Manager (`/admin-dashboard/settlements`)
- **Purpose**: Controls the automated holding and release of customer funds to merchant bank accounts post-delivery.
- **Primary User**: Platform Treasury & Financial Operations.
- **Important Information Displayed**: Total Funds in Escrow Account, Upcoming Scheduled Batch Payouts (e.g. Weekly Friday Batch), Completed Payouts, Delayed / Frozen Settlement Holds (for disputed sellers).
- **Primary Actions**: **"Execute Scheduled Settlement Batch"**, **"Place Settlement Freeze on Flagged Seller"**.
- **Secondary Actions**: Reconcile with bank nodal accounts, generate platform 1099/GST tax reports.
- **Navigation Relationship**: Financial domain branch.
- **Mobile Behavior**: High-security batch approval interface requiring biometric/2FA confirmation.

### 13. Payment Gateways & Transaction Logs (`/admin-dashboard/payments`)
- **Purpose**: Low-level audit log of all raw payment gateway transactions (Razorpay, Stripe, UPI, Bank Wires).
- **Primary User**: Technical Operations, Fintech Engineers.
- **Important Information Displayed**: Gateway Transaction ID, Internal Order Reference, Payment Method, Raw Gateway Response Code, Webhook Delivery Status, Fraud Risk Score, Settlement Timestamp.
- **Primary Actions**: **"Retry Failed Webhook"**, **"Initiate Gateway-Level Refund"**.
- **Secondary Actions**: Export raw transaction JSON logs.
- **Navigation Relationship**: Financial domain branch.
- **Mobile Behavior**: Technical log feed with color-coded status badges.

### 14. Marketing Campaigns & Marketplace Promotions (`/admin-dashboard/promotions`)
- **Purpose**: Management of platform-wide promotional sales (e.g., "Festival Mega Sale", "Office Tech Week"), universal coupons, and sponsored banner placements.
- **Primary User**: Chief Marketing Officer, Campaign Managers.
- **Important Information Displayed**: Active Platform Campaigns, Universal Promo Codes (e.g. `OFFICECONNECT10`), Seller Participation Rate, Co-Funded Discount Ratios (e.g. 50% Platform funded, 50% Seller funded), Total Promotional GMV Lift.
- **Primary Actions**: **"+ Launch Global Marketplace Sale"**, **"Invite Sellers to Campaign"**.
- **Secondary Actions**: Feature participating SKUs on Homepage carousel.
- **Navigation Relationship**: Marketing domain branch.
- **Mobile Behavior**: Campaign timeline view with live revenue ticker.

### 15. Content Management System (CMS) & Banners (`/admin-dashboard/cms`)
- **Purpose**: Visual editorial control of Homepage hero sliders, editorial curation boards, terms of service, and announcement bars.
- **Primary User**: Digital Merchandisers, Editorial Staff.
- **Important Information Displayed**: Homepage Hero Slide Slots (Desktop & Mobile assets), Featured Brand Tiles, Trust Banner Copy, Platform Policy Pages (Privacy, Shipping, Refund Terms).
- **Primary Actions**: **"Publish Updated Hero Carousel"**, **"Edit Policy Document"**.
- **Secondary Actions**: Schedule banner activation for future dates.
- **Navigation Relationship**: Editorial domain branch.
- **Mobile Behavior**: Direct asset preview mode showing desktop vs mobile aspect ratios.

### 16. Reviews & Ratings Moderation (`/admin-dashboard/reviews`)
- **Purpose**: Anti-fraud review filter weeding out fake reviews, competitor sabotage, profanity, and bot spam.
- **Primary User**: Trust & Safety Team.
- **Important Information Displayed**: Flagged Customer Reviews Queue, Sentiment Score, Verified Purchase Checkmark, Customer History, Reported Seller Rebuttals.
- **Primary Actions**: **"Approve Review"**, **"Remove / Suppress Fake Review"**.
- **Secondary Actions**: Issue warning to suspicious reviewer account.
- **Navigation Relationship**: Trust & Safety branch.
- **Mobile Behavior**: Rapid review moderation cards.

### 17. Platform Customer & Seller Support Hub (`/admin-dashboard/support`)
- **Purpose**: Unified omnichannel support desk managing tickets from both buyers and sellers.
- **Primary User**: Customer Support Supervisors, Seller Account Managers.
- **Important Information Displayed**: Open Ticket Queue categorized by Severity (Critical, High, Medium, Low), SLA Breach Alerts, Linked Order/Seller IDs, Omnichannel Conversation History.
- **Primary Actions**: **"Assign Ticket"**, **"Post Official Marketplace Resolution"**.
- **Secondary Actions**: Merge duplicate tickets, generate support performance scorecard.
- **Navigation Relationship**: Operations domain branch.
- **Mobile Behavior**: Mobile ticketing desk with audio notes and quick-canned macros.

### 18. Global Marketplace Analytics & BI Suite (`/admin-dashboard/analytics`)
- **Purpose**: Deep multi-dimensional business intelligence tracking marketplace growth, retention, churn, and category margins.
- **Primary User**: Executive Leadership, Business Analysts.
- **Important Information Displayed**: Cohort Retention Curves, Customer Acquisition Cost (CAC) vs Lifetime Value (LTV), Category Gross Margin Breakdown, Seller Churn Rate, Regional Order Heatmaps.
- **Primary Actions**: Custom SQL/BI Query builder, Export Data Warehouse Dumps.
- **Secondary Actions**: Schedule automated weekly executive emails.
- **Navigation Relationship**: Executive BI branch.
- **Mobile Behavior**: Optimized responsive summary charts.

### 19. Roles, Permissions & Staff Access (RBAC) (`/admin-dashboard/roles`)
- **Purpose**: Enterprise security module enforcing principle of least privilege across platform staff.
- **Primary User**: Super Admin, Chief Information Security Officer (CISO).
- **Important Information Displayed**: Admin Staff Users, Assigned Roles (`Super Admin`, `Catalog Manager`, `Dispute Arbitrator`, `Finance Officer`, `Support Agent`), Permission Matrix (Granular Read/Write/Delete checkboxes per module).
- **Primary Actions**: **"+ Create Custom Role"**, **"Assign Role to Staff Member"**.
- **Secondary Actions**: Revoke session, enforce hardware security keys (FIDO2/WebAuthn).
- **Navigation Relationship**: Security & Settings branch.
- **Mobile Behavior**: Staff directory list with status indicators.

### 20. System Configuration & Integrations (`/admin-dashboard/settings`)
- **Purpose**: Global technical configuration (Currency, Logistics API keys, SMS/Email SMTP gateways, Tax API integrations).
- **Primary User**: DevOps & System Architects.
- **Important Information Displayed**: Base Currency (`INR`), Supported Regional Currencies, Connected Courier APIs (Delhivery, Shiprocket, BlueDart), SMS Gateway (Twilio/Gupshup), Email Provider (SES/Sendgrid), Maintenance Mode master toggle.
- **Primary Actions**: **"Save Technical Settings"**, **"Test API Connectivity"**.
- **Secondary Actions**: Flush server cache, rotate API signing secrets.
- **Navigation Relationship**: Technical settings branch.
- **Mobile Behavior**: Tabbed configuration view with secret-hiding eye toggles.

### 21. Immutable Security Audit Logs (`/admin-dashboard/audit-logs`)
- **Purpose**: Compliance and forensic trail recording every administrative action, refund issuance, permission change, and login event.
- **Primary User**: Security Auditors, Compliance Officers.
- **Important Information Displayed**: Timestamp (UTC + IST), Actor (User ID, IP Address, Geolocation), Action Performed (e.g. `SELLER_APPROVED`, `FORCED_REFUND_ISSUED`, `COMMISSION_RATE_ALTERED`), Target Entity ID, Old Value vs New Value JSON diff.
- **Primary Actions**: **"Filter by Actor / Action Type"**, **"Export Cryptographically Signed Audit CSV"**.
- **Secondary Actions**: Inspect full JSON payload diff.
- **Navigation Relationship**: Compliance branch.
- **Mobile Behavior**: Monospace chronological event stream.

---

## 3. Major End-to-End Operational Flows

### Flow A: Customer Commerce Journey
```
[ Homepage / Search / Taxonomy ]
               │
               ▼
[ Product Details Page (PDP) ]
  • Inspect Canonical Specs & Reviews
  • Compare Seller Offers (Price, Rating, SLA)
  • Select Winning / Preferred Seller Offer
               │
               ▼
[ Shopping Bag (Multi-Vendor Grouped) ]
  • Package 1 (Seller A) + Package 2 (Seller B)
  • Apply Coupons / Vouchers
               │
               ▼
[ Multi-Step Checkout ]
  • Select Delivery Address & GSTIN
  • Review Package Dispatch SLAs
               │
               ▼
[ Secure Payment Gateway (Razorpay / Stripe) ]
  • 100% Funds Collected into Platform Escrow
               │
               ▼
[ Order Confirmation & Receipt ]
  • Split into Individual Seller Sub-Orders
               │
               ▼
[ Live Tracking & Post-Purchase ]
  • Multi-Package Carrier Tracking
  • Delivery Confirmation
  • Leave Verified Rating / Initiate Return
```

---

### Flow B: Seller Lifecycle & Fulfillment Flow
```
[ 5-Stage Onboarding Wizard ]
  • Legal KYB ──→ Store Identity ──→ Owner KYC ──→ Banking Payout ──→ Tax W-9/GSTIN
               │
               ▼
[ Admin Vetting & Store Approval ]
               │
               ▼
[ Catalog Linkage & SKU Listing ]
  • Match Master Catalog Canonical SKU
  • Set Listing Price, Stock Quantity & Dispatch SLA
               │
               ▼
[ Order Notification Received ]
  • SLA Countdown Triggered
               │
               ▼
[ Warehouse Fulfillment ]
  • Generate Packing Slip & Courier Shipping Label
  • Carrier Pick-Up & Real-Time Tracking Linkage
               │
               ▼
[ Delivery Confirmation & Return Window Expiry ]
               │
               ▼
[ Escrow Release & Bank Settlement ]
  • Platform Commission (8.5%) Deducted Automatically
  • Net Payout Credited to Seller Bank Account
```

---

### Flow C: Platform Admin Governance & Oversight Flow
```
[ Seller Approval Desk ]
  • Inspect Legal Documents & Approve Merchant
               │
               ▼
[ Catalog Purity & Moderation ]
  • Curate Canonical SKUs & Approve Seller Listings
               │
               ▼
[ Live Marketplace Monitoring ]
  • Track GMV, Order SLAs & Carrier Dispatch Health
               │
               ▼
[ Post-Sale Arbitration Desk ]
  • Review Disputed Return Claims
  • Authorize Forced Refund OR Release Escrow
               │
               ▼
[ Financial Settlement Oversight ]
  • Reconcile Platform Escrow vs Merchant Payouts
  • Generate Monthly GST Compliance Invoices
```

---

## 4. Domain Boundaries & Security Isolation Guardrails

1. **Customer Domain**: Has zero visibility into other customers' data or internal seller margins. Public APIs allow browsing catalog, placing orders, and managing their own account only.
2. **Seller Domain**: Operates strictly within their own `storeId` silo. Sellers cannot see other sellers' customer details beyond necessary shipping info, nor can they alter global catalog canonical metadata.
3. **Admin Domain**: Has overarching governance across organizations and stores, governed by granular RBAC permissions. Critical actions (forced refunds, bank detail overrides, commission alterations) are written to immutable audit logs.
