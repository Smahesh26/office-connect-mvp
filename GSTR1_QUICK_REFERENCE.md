# GSTR-1 Export Engine - Quick Reference Card

## Installation (Copy-Paste Ready)

```bash
# 1. Ensure database has Invoice and Customer models
# 2. Update src/index.ts
import gstrRoutes from "./modules/gst/gstr.routes";
app.use("/api/gst", gstrRoutes);

# 3. Run tests
npm test -- gstr.service.test.ts
```

## API Endpoints

```
GET /api/gst/gstr1/report?month=1&year=2025
GET /api/gst/gstr1/report?month=1&year=2025&format=csv
GET /api/gst/gstr1/report?month=1&year=2025&format=json-submission
GET /api/gst/gstr1/export-csv?month=1&year=2025
```

## Service Functions

```typescript
// Generate report
const report = await generateGSTR1Report(orgId, month, year);

// Export to CSV
const csv = generateGSTR1CSV(report);

// Export to JSON
const json = generateGSTR1JSON(report);
```

## Report Output

```typescript
{
  period: { month, year, startDate, endDate },
  b2b: [ { gstin, invoiceNumber, invoiceDate, ... } ],
  b2c: [ { invoiceNumber, invoiceDate, ... } ],
  summary: {
    totalB2BInvoices, totalB2CInvoices,
    totalTaxableValue, totalCGST, totalSGST, totalIGST,
    totalTax, totalInvoiceValue
  },
  generatedAt: Date
}
```

## Frontend Component

```tsx
import GSTR1ExportComponent from '@/components/GSTR1Export';

<GSTR1ExportComponent organizationId="org-id" />
```

## Quick Verification

```bash
# Test with cURL
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/gst/gstr1/report?month=1&year=2025" | jq

# Should show: period, b2b array, b2c array, summary
```

## Invoice Classification Rules

| Condition | Category |
|-----------|----------|
| Customer has valid gstNumber | B2B |
| Customer has null/empty gstNumber | B2C |

## Tax Calculation Example

```
Input:
  Taxable: ₹1,000
  Intra-state: CGST 9% + SGST 9%

Output:
  CGST: ₹90
  SGST: ₹90
  Total: ₹180
  Invoice: ₹1,180
```

## Error Codes

| Error | Cause | Fix |
|-------|-------|-----|
| 400 Missing parameters | month/year not provided | Add ?month=1&year=2025 |
| 401 Unauthorized | No auth token | Add Authorization header |
| 500 Invalid month | month > 12 | Use 1-12 |
| 500 Invalid year | year < 2000 | Use valid year |

## Common Use Cases

```typescript
// Get this month's report
const month = new Date().getMonth() + 1;
const year = new Date().getFullYear();
const report = await generateGSTR1Report(orgId, month, year);

// Download CSV
const csv = generateGSTR1CSV(report);
saveFile(`GSTR1_${month}_${year}.csv`, csv);

// Check tax liability
console.log(`Pay: ₹${report.summary.totalTax}`);

// Check invoices
console.log(`B2B: ${report.summary.totalB2BInvoices}`);
console.log(`B2C: ${report.summary.totalB2CInvoices}`);
```

## Database Indexes (Recommended)

```sql
CREATE INDEX idx_invoices_org_status_date 
ON invoices(organizationId, status, issuedAt);

CREATE INDEX idx_customers_gst 
ON customers(gstNumber);
```

## Testing

```bash
# All tests
npm test -- gstr

# Watch mode
npm test -- gstr --watch

# Coverage
npm test -- gstr --coverage
```

## File Locations

```
Backend:
  src/modules/gst/gstr.service.ts        (Logic)
  src/modules/gst/gstr.routes.ts         (API)
  src/modules/gst/gstr.service.test.ts   (Unit tests)
  src/modules/gst/gstr.routes.test.ts    (Integration tests)

Frontend:
  components/GSTR1Export.tsx             (React component)

Documentation:
  GSTR1_DOCUMENTATION.md                 (API reference)
  GSTR1_INTEGRATION_GUIDE.md             (Setup guide)
  GSTR1_USAGE_EXAMPLES.md                (Real-world examples)
  README_GSTR1.md                        (Overview)
```

## Environment Variables Needed

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
API_URL=http://localhost:3000
```

## Response Sizes

| Operation | Size |
|-----------|------|
| 100 invoices | ~15 KB JSON |
| 1,000 invoices | ~150 KB JSON |
| 10,000 invoices | ~1.5 MB JSON |

## Default Behavior

- Invoice Status: Only ISSUED invoices included
- Date Filtering: Based on invoice issuedAt date
- Decimal Places: All values rounded to 2 places
- Empty Months: Return empty arrays (no error)

## Advanced: Custom Tax Rates

```typescript
// Modify in gstr.service.ts
const CGST_RATE = 0.09;  // 9%
const SGST_RATE = 0.09;  // 9%
const IGST_RATE = 0.18;  // 18%
```

## Advanced: Enable Caching

```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 });

export const generateGSTR1Report = async (...) => {
  const key = `gstr1:${orgId}:${month}:${year}`;
  if (cache.has(key)) return cache.get(key);
  
  const report = await ...;
  cache.set(key, report);
  return report;
};
```

## Debugging

```typescript
// Enable logging
console.log(`Processing ${invoices.length} invoices`);
console.log(`B2B: ${b2b.length}, B2C: ${b2c.length}`);
console.log(`Total Tax: ₹${summary.totalTax}`);

// Check calculations
console.log(
  `Sum: ${summary.totalCGST + summary.totalSGST + summary.totalIGST} = ${summary.totalTax}`
);
```

## Troubleshooting Checklist

- [ ] Routes registered in main app
- [ ] Database has Invoice and Customer models
- [ ] Authentication middleware configured
- [ ] Authorization header includes valid token
- [ ] Test invoices created with correct status
- [ ] Invoice dates fall within selected month
- [ ] Customer GST numbers populated for B2B
- [ ] Tests passing

## Performance Tips

1. **Use indexes** (see Database Indexes above)
2. **Cache results** (see Advanced section)
3. **Batch operations** (process multiple months together)
4. **Monitor response** time with new Date().getTime()
5. **Archive old** reports to save space

## Month/Year Format

```
Month: 1-12 (January = 1, December = 12)
Year: 2000-current (e.g., 2025)

Example: Month=3, Year=2025 → March 2025
```

## CSV Format Preview

```
GSTR-1 RETURN
Month: 01, Year: 2025
Generated: 2025-02-15T10:30:00.000Z

B2B INVOICES - SUPPLIES TO REGISTERED CUSTOMERS
GSTIN,Invoice Number,Invoice Date,...
"27AAPFT5055K1Z0","INV-001","15/01/2025",...

B2B Summary: 20 invoices

B2C INVOICES - SUPPLIES TO UNREGISTERED CUSTOMERS
Invoice Number,Invoice Date,...
"INV-B2C-001","20/01/2025",...

B2C Summary: 5 invoices

GSTR-1 SUMMARY
Total Invoices,25
Total Taxable Value,"450000.00"
Total CGST,"20250.00"
Total SGST,"20250.00"
Total IGST,"0.00"
Total Tax,"40500.00"
Total Invoice Value,"490500.00"
```

## Summary Calculations (All Automatic)

```
totalTaxableValue = sum of all invoice subtotals
totalCGST = sum of all cgstAmount
totalSGST = sum of all sgstAmount  
totalIGST = sum of all igstAmount
totalTax = totalCGST + totalSGST + totalIGST
totalInvoiceValue = totalTaxableValue + totalTax
```

---

**Keep this card handy for quick reference!**

For detailed info, see: `GSTR1_DOCUMENTATION.md`
For setup help, see: `GSTR1_INTEGRATION_GUIDE.md`
For examples, see: `GSTR1_USAGE_EXAMPLES.md`
