# GSTR-1 Export Engine Documentation

## Overview

The GSTR-1 Export Engine provides a complete solution for generating GST Return (Form GSTR-1) reports from invoice data. It automatically separates B2B (supplies to registered customers) and B2C (supplies to unregistered customers) transactions, calculates tax liabilities, and exports data in multiple formats (JSON, CSV).

## Key Features

### 1. **Automatic Invoice Categorization**
- **B2B Invoices**: Automatically identified when customer has a valid GST number
- **B2C Invoices**: Identified when customer has no GST number
- Date-based filtering for monthly/quarterly reports

### 2. **Tax Calculation**
- Supports CGST (Central GST), SGST (State GST), and IGST (Integrated GST)
- Automatic detection of intra-state vs inter-state supplies
- Precision: All values rounded to 2 decimal places
- Handles mixed tax scenarios in single report

### 3. **Multiple Export Formats**
- **JSON**: Structured data for programmatic integration
- **CSV**: Human-readable format for manual review/filing
- **JSON-Submission**: Optimized format for GSTR-1 filing portal

### 4. **Summary Calculations**
Automatic computation of:
- Total taxable value
- Total tax by type (CGST, SGST, IGST)
- Invoice counts by category
- Total invoice value

## API Endpoints

### Generate GSTR-1 Report

```
GET /gst/gstr1/report?month=1&year=2025&format=json
```

**Query Parameters:**
- `month` (required): Month (1-12)
- `year` (required): Fiscal year (e.g., 2025)
- `format` (optional): Response format
  - `json` (default): Full report object
  - `csv`: CSV download
  - `json-submission`: Optimized submission format

**Response (JSON):**
```json
{
  "period": {
    "month": 1,
    "year": 2025,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z"
  },
  "b2b": [
    {
      "gstin": "27AAPFT5055K1Z0",
      "invoiceNumber": "INV-001",
      "invoiceDate": "15/01/2025",
      "invoiceValue": 1180.00,
      "placeOfSupply": "27",
      "taxableValue": 1000.00,
      "cgstAmount": 90.00,
      "sgstAmount": 90.00,
      "igstAmount": 0.00,
      "totalTax": 180.00
    }
  ],
  "b2c": [
    {
      "invoiceNumber": "INV-B2C-001",
      "invoiceDate": "20/01/2025",
      "invoiceValue": 590.00,
      "placeOfSupply": "27",
      "taxableValue": 500.00,
      "cgstAmount": 45.00,
      "sgstAmount": 45.00,
      "igstAmount": 0.00,
      "totalTax": 90.00
    }
  ],
  "summary": {
    "totalB2BInvoices": 1,
    "totalB2CInvoices": 1,
    "totalTaxableValue": 1500.00,
    "totalCGST": 135.00,
    "totalSGST": 135.00,
    "totalIGST": 0.00,
    "totalTax": 270.00,
    "totalInvoiceValue": 1770.00
  },
  "generatedAt": "2025-02-15T10:30:00.000Z"
}
```

### Export as CSV

```
GET /gst/gstr1/export-csv?month=1&year=2025
```

**Response:** CSV file with structure:
```
GSTR-1 RETURN
Month: 01, Year: 2025
Generated: 2025-02-15T10:30:00.000Z

B2B INVOICES - SUPPLIES TO REGISTERED CUSTOMERS
GSTIN,Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total
"27AAPFT5055K1Z0","INV-001","15/01/2025","1180.00","27","1000.00","9.00%","9.00%","0.00%","180.00","1180.00"

B2B Summary: 1 invoices

B2C INVOICES - SUPPLIES TO UNREGISTERED CUSTOMERS
Invoice Number,Invoice Date,Invoice Value,Place of Supply,Taxable Value,CGST (%),SGST (%),IGST (%),Total Tax,Invoice Total
"INV-B2C-001","20/01/2025","590.00","27","500.00","9.00%","9.00%","0.00%","90.00","590.00"

B2C Summary: 1 invoices

GSTR-1 SUMMARY
Total Invoices,2
Total Taxable Value,"1500.00"
Total CGST,"135.00"
Total SGST,"135.00"
Total IGST,"0.00"
Total Tax,"270.00"
Total Invoice Value,"1770.00"
```

## Service Functions

### generateGSTR1Report()

Generates a complete GSTR-1 report for a given month/year.

```typescript
const report = await generateGSTR1Report(organizationId, month, year);
```

**Parameters:**
- `organizationId`: UUID of the organization
- `month`: Month number (1-12)
- `year`: Fiscal year

**Returns:** `GSTR1Report` object with all invoice data and calculations

**Error Handling:**
- Throws error if month is invalid (not 1-12)
- Throws error if year is invalid (<2000)
- Returns empty report if no invoices found

### generateGSTR1CSV()

Converts report data to CSV format.

```typescript
const csv = generateGSTR1CSV(report);
```

**Input:** `GSTR1Report` object
**Output:** CSV string with proper formatting and escaping

### generateGSTR1JSON()

Generates optimized JSON for GSTR-1 submission.

```typescript
const json = generateGSTR1JSON(report);
```

**Input:** `GSTR1Report` object
**Output:** Simplified JSON object optimized for filing

## Frontend Component Usage

### Installation

```typescript
import GSTR1ExportComponent from '@/components/GSTR1Export';

export default function GSTReportPage() {
  return <GSTR1ExportComponent organizationId="org-id-here" />;
}
```

### Features
- Period selection (month/year dropdown)
- Real-time report generation
- CSV and JSON download options
- Interactive summary cards with totals
- Invoice-level details tables (B2B & B2C)
- Error handling and loading states

## Database Requirements

The service requires the following database tables:

### Invoices Table
```
- organizationId (UUID, FK)
- customerId (UUID, FK)
- invoiceNumber (String)
- issuedAt (DateTime)
- status (Enum: DRAFT, ISSUED, PAID, CANCELLED)
- subtotal (Decimal)
- cgstAmount (Decimal)
- sgstAmount (Decimal)
- igstAmount (Decimal)
- totalAmount (Decimal)
- placeOfSupply (String, state code)
```

### Customers Table
```
- organizationId (UUID, FK)
- gstNumber (String, nullable)
- stateCode (String)
```

## Tax Calculation Examples

### Example 1: Intra-state B2B Supply
```
Taxable Value: ₹1,000.00
CGST (9%): ₹90.00
SGST (9%): ₹90.00
IGST (0%): ₹0.00
Total Tax: ₹180.00
Invoice Value: ₹1,180.00
```

### Example 2: Inter-state B2B Supply
```
Taxable Value: ₹1,000.00
CGST (0%): ₹0.00
SGST (0%): ₹0.00
IGST (18%): ₹180.00
Total Tax: ₹180.00
Invoice Value: ₹1,180.00
```

### Example 3: Mixed Supplies in Single Report
```
B2B Invoices: 5 (Total: ₹15,000.00 + ₹2,700.00 tax)
B2C Invoices: 3 (Total: ₹5,000.00 + ₹900.00 tax)

Summary:
- Total Taxable: ₹20,000.00
- Total CGST: ₹1,620.00
- Total SGST: ₹1,620.00
- Total IGST: ₹360.00
- Total Tax: ₹3,600.00
- Total Invoice Value: ₹23,600.00
```

## Validation Rules

1. **Invoice Status**: Only `ISSUED` invoices are included
2. **Invoice Date**: Must fall within the selected month/year
3. **B2B Classification**: Customer must have non-null, non-empty GST number
4. **B2C Classification**: Customer with null or empty GST number
5. **Tax Amounts**: Must be non-negative numbers
6. **Decimal Precision**: All monetary values rounded to 2 places

## Error Handling

### Invalid Month
```
Error: Month must be between 1 and 12
Status: 500
```

### Invalid Year
```
Error: Invalid year
Status: 500
```

### Missing Parameters
```
Error: Missing required query parameters: month, year
Status: 400
```

### Unauthorized Access
```
Error: Unauthorized
Status: 401
```

## Performance Considerations

1. **Indexing**: Recommend indexes on:
   - `invoices(organizationId, status, issuedAt)`
   - `customers(gstNumber)`

2. **Large Datasets**: 
   - Reports with >10,000 invoices may take 2-3 seconds
   - Consider pagination for very large organizations

3. **Caching**:
   - Reports don't change unless invoices are edited
   - Consider caching based on organizationId + month + year

## Testing

Complete test suite includes:
- 20+ unit tests for report generation
- 10+ integration tests for API endpoints
- Edge cases: Empty months, boundary dates, mixed taxes
- CSV formatting and escaping
- Decimal precision validation

Run tests:
```bash
npm test -- gstr.service.test.ts
npm test -- gstr.routes.test.ts
```

## Integration with GSTR Filing Portal

The JSON format generated is compatible with:
- GST Common Portal (gstportal.gov.in)
- Tally on Cloud
- Zoho Books
- QuickBooks

Use `format=json-submission` for direct submission.

## Monthly Workflow

1. **Invoices Created**: Throughout the month, invoices are issued
2. **End of Month**: Download GSTR-1 report
3. **Verification**: Review summary and invoice details
4. **Export**: Download CSV or JSON
5. **Filing**: Submit to GST portal or accounting software

## Troubleshooting

### No invoices appearing in report
- Check invoice status is `ISSUED`
- Verify invoice dates fall within selected month
- Confirm organization has correct ID

### Tax amounts seem incorrect
- Verify customer GST number exists for B2B classification
- Check taxable value and tax rate calculations
- Ensure amounts are in correct decimal format

### CSV download not working
- Check browser allows pop-ups
- Verify authentication token is valid
- Check network tab for failed requests

## Future Enhancements

- GSTR-2A (ITC) integration
- GSTR-9 annual return
- Amendment/revised returns support
- Bulk invoice uploads
- E-signature integration
- Real-time GST portal submission

## Support

For issues or feature requests, contact the development team with:
- Organization ID
- Month/Year of report
- Number of invoices
- Error message (if any)
