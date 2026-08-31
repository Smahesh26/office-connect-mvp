# Trust Claims & Marketing Veracity Audit

**Date**: August 31, 2026  
**Auditor**: Antigravity Engineering Team  
**Objective**: Identify all factual, legal, regulatory, certification, banking, and brand authorization claims present in the customer storefront, seller portal, and admin panel, and classify their truth status.

---

## 1. Golden Rule for Public Trust & Legal Claims

> [!WARNING]
> In an enterprise marketplace, displaying certifications, banking relationships, escrow guarantees, or brand authorizations without valid legal agreements, actual technical implementation, or certified auditor sign-off introduces severe legal, regulatory, and financial liability.
>
> All demo/placeholder claims MUST be either backed by verified infrastructure or sanitized before opening the platform to public buyers or 3P sellers.

---

## 2. Complete Inventory of Trust & Regulatory Claims

| Location in Code | Exact Claim Displayed | Claim Type | Reality / Evidence Status | Risk Severity | Required Pre-Launch Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `StorefrontFooter.tsx:129` | `"ISO 27001 Certified • PCI-DSS Level 1"` | Security & Compliance Certification | 🚫 **UNVERIFIED**: No ISO 27001 certificate or Level 1 PCI-DSS Attestation of Compliance (AoC) on file. | 🔴 **HIGH LEGAL RISK** | Remove certification claim immediately; replace with generic "Secure 256-Bit SSL Encryption" until certified. |
| `StorefrontFooter.tsx:75`, `StorefrontHero.tsx:14`, `ProductBuyBox.tsx:156` | `"100% Escrow Protection: Funds held securely until verified delivery OTP scan"` | Financial & Banking Escrow Guarantee | 🚫 **MOCK INFRASTRUCTURE**: No legal tripartite escrow agreement with RBI-approved escrow bank (e.g. HDFC/ICICI) or live Razorpay Route/Stripe Connect marketplace escrow account. | 🔴 **HIGH REGULATORY RISK** | Clarify as "Secure Payment Processing" or integrate compliant payment split provider before taking public funds. |
| `StorefrontFooter.tsx:88`, `StorefrontAnnouncementBar.tsx:18` | `"Express 48-Hour Dispatch Across All Verified Stores"` | Logistics SLA Guarantee | 🟡 **UNENFORCED**: No automated carrier webhook SLA enforcement or courier dispatch integration active. | 🟡 **MEDIUM (OPERATIONAL)** | Rephrase as "Standard 2–5 Business Days Dispatch" until carrier integration with automated AWB generation is live. |
| `StorefrontFeaturedStores.tsx:63`, `SellerHeroHeader.tsx:48` | `"Verified Genuine Sellers • 5-Stage KYB Vetted"` | Merchant Credential Verification | 🟡 **MOCK WORKFLOW**: The 5-stage onboarding UI exists, but approval is simulated in React state without actual government API (MCA/GSTIN/PAN) verification. | 🟡 **MEDIUM (TRUST)** | State "Merchant Verification Required" and connect government identity verification APIs prior to merchant onboarding. |
| `StorefrontFeaturedBrands.tsx:22`, `brand/[slug]/page.tsx` | `"Sony Direct 👑 Flagship Store"`, `"Apple Direct"`, `"Keychron Official"` | Brand Authorization & Trademarks | 🚫 **DEMO PLACEHOLDER**: No formal distributor or brand authorization agreement with Sony India, Apple Inc., or Keychron. | 🔴 **HIGH TRADEMARK RISK** | Replace trademarked brand names with generic/neutral sandbox demo brands (e.g., *Apex Audio*, *Nova Tech*, *UrbanStyle*) for testing and staging environments. |
| `SectionPricingInventory.tsx:156`, `AdminSettingsDomain.tsx:88` | `"GST statutory tax rate: 18% CGST/SGST, TCS 1%, TDS 1%"` | Statutory Tax Logic | 🟡 **HARDCODED CALCULATION**: Tax rates are hard-coded in TypeScript rather than being driven by dynamic HSN lookup tables and validated by a Chartered Accountant. | 🟡 **MEDIUM (FINANCIAL)** | Mark tax calculation as provisional and mandate professional tax audit review before issuing legal tax invoices. |

---

## 3. Recommended Remediation Plan for Production Launch

1. **Sanitize Footer & Hero Badges**: Replace specific certification claims (*ISO 27001, PCI-DSS Level 1*) with verifiable statements (*"Encrypted TLS 1.3 Transmission"*).
2. **Sandbox Brand Names**: Switch all demo catalog items to non-trademarked demo brands (*"AeroTech"*, *"Lumina Studio"*, *"Pulse Audio"*) to prevent trademark infringement.
3. **Escrow Provider Alignment**: Formalize the legal payment processing terms under the Payment Aggregator guidelines before enabling live payment checkouts.
