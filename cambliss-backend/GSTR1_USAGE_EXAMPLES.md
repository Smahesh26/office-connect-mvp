# GSTR-1 Export Engine - Usage Examples

## Real-World Scenarios

### Scenario 1: Simple Monthly B2B Report

**Situation**: A consulting firm wants to export January 2025 invoices to registered customers.

**Setup**: 3 invoices issued to registered customers during January 2025

**Code Usage**:
```typescript
import { generateGSTR1Report, generateGSTR1CSV } from "./modules/gst/gstr.service";

// Step 1: Generate the report
const report = await generateGSTR1Report("org-123", 1, 2025);

// Step 2: Check summary
console.log(`Total B2B Invoices: ${report.summary.totalB2BInvoices}`);
console.log(`Total Tax: ₹${report.summary.totalTax}`);

// Step 3: Export to CSV
const csvContent = generateGSTR1CSV(report);
saveToFile("GSTR1_01_2025.csv", csvContent);
```

**Expected Output**:
```
GSTR-1 RETURN
Month: 01, Year: 2025

B2B INVOICES - SUPPLIES TO REGISTERED CUSTOMERS
GSTIN,Invoice Number,Invoice Date,...
"27AAPFT5055K1Z0","INV-0001","01/01/2025",...
"27AAPFT5055K1Z0","INV-0002","05/01/2025",...
"27AAPFT5055K1Z0","INV-0003","15/01/2025",...

B2B Summary: 3 invoices
```

---

### Scenario 2: Mixed B2B and B2C Report

**Situation**: An e-commerce store has invoices for both business customers (B2B) and retail customers (B2C).

**Data**:
```
B2B Invoices (Feb 2025):
- Customer A (GST: 27AAPFT5055K1Z0): ₹10,000 (₹1,800 tax)
- Customer B (GST: 09AABCT5678F0Z9): ₹15,000 (₹2,700 tax)

B2C Invoices (Feb 2025):
- Website Sales: ₹20 invoices totaling ₹5,000 (₹900 tax)
```

**Code**:
```typescript
const report = await generateGSTR1Report("org-456", 2, 2025);

// Check split
console.log(`B2B: ${report.summary.totalB2BInvoices} invoices`);  // Output: 2
console.log(`B2C: ${report.summary.totalB2CInvoices} invoices`);  // Output: 20

// Summary
console.log(`Total Taxable: ₹${report.summary.totalTaxableValue}`);  // ₹30,000
console.log(`Total Tax: ₹${report.summary.totalTax}`);              // ₹5,400

// Download CSV
res.header('Content-Type', 'text/csv');
res.send(generateGSTR1CSV(report));
```

**CSV Structure** (abbreviated):
```
B2B INVOICES
...27AAPFT5055K1Z0... (₹10,000)
...09AABCT5678F0Z9... (₹15,000)

B2C INVOICES
...Website Transaction 001... (₹250)
...Website Transaction 002... (₹250)
... (18 more entries)
```

---

### Scenario 3: Inter-State Supplies with IGST

**Situation**: A manufacturing company exports goods across states within India.

**Data** (March 2025):
```
Intra-State (TN to TN): ₹50,000 → CGST ₹4,500 + SGST ₹4,500
Interstate (TN to MH): ₹30,000 → IGST ₹5,400
Interstate (TN to UP): ₹40,000 → IGST ₹7,200
```

**Code**:
```typescript
const report = await generateGSTR1Report("org-789", 3, 2025);

// Review tax breakdown
const summary = report.summary;
console.log("Tax Breakdown:");
console.log(`- CGST (Intra-state): ₹${summary.totalCGST}`);        // ₹4,500
console.log(`- SGST (Intra-state): ₹${summary.totalSGST}`);        // ₹4,500
console.log(`- IGST (Interstate): ₹${summary.totalIGST}`);         // ₹12,600
console.log(`- Total Tax: ₹${summary.totalTax}`);                  // ₹21,600
console.log(`- Total Invoice Value: ₹${summary.totalInvoiceValue}`); // ₹120,000

// Export for filing
const jsonData = generateGSTR1JSON(report);
// Submit to GST portal
```

**Result**:
```json
"summary": {
  "totalTaxableValue": 120000.00,
  "totalCGST": 4500.00,
  "totalSGST": 4500.00,
  "totalIGST": 12600.00,
  "totalTax": 21600.00
}
```

---

### Scenario 4: Mid-Year Report with Multiple Organizations

**Situation**: A multinational company manages multiple legal entities, each with separate GST registration.

**Implementation**:
```typescript
// Entity A (GST: 18AABCT1234F0Z5)
const reportA = await generateGSTR1Report("org-a-id", 6, 2025);

// Entity B (GST: 27AAPFT5055K1Z0)
const reportB = await generateGSTR1Report("org-b-id", 6, 2025);

// Entity C (GST: 09AABCT5678F0Z9)
const reportC = await generateGSTR1Report("org-c-id", 6, 2025);

// Consolidated view
const allReports = [reportA, reportB, reportC];
const consolidatedTotal = allReports.reduce((sum, r) => 
  sum + r.summary.totalTax, 0
);

console.log(`Total Tax across all entities: ₹${consolidatedTotal}`);

// Generate individual CSVs
allReports.forEach(report => {
  const csv = generateGSTR1CSV(report);
  saveFile(`GSTR1_Entity_${report.period.month}_${report.period.year}.csv`, csv);
});
```

---

### Scenario 5: Quarterly Report Compilation

**Situation**: Need to review April-June 2025 (Q1 FY 2025-26) data.

**Code**:
```typescript
async function generateQuarterlyReport(orgId: string, quarterMonths: number[]) {
  const reports = [];
  
  for (const month of quarterMonths) {
    const report = await generateGSTR1Report(orgId, month, 2025);
    reports.push(report);
  }
  
  // Aggregate data
  const quarterly = {
    period: "Q1 FY 2025-26",
    months: [4, 5, 6],
    totalData: reports.reduce((acc, r) => ({
      invoices: acc.invoices + r.b2b.length + r.b2c.length,
      b2b: acc.b2b + r.summary.totalB2BInvoices,
      b2c: acc.b2c + r.summary.totalB2CInvoices,
      taxableValue: acc.taxableValue + r.summary.totalTaxableValue,
      totalTax: acc.totalTax + r.summary.totalTax,
    }), {
      invoices: 0,
      b2b: 0,
      b2c: 0,
      taxableValue: 0,
      totalTax: 0
    })
  };
  
  return quarterly;
}

// Usage
const q1 = await generateQuarterlyReport("org-123", [4, 5, 6]);
console.log(`Q1 Total Tax: ₹${q1.totalData.totalTax}`);
```

**Output**:
```
Quarterly Summary
Period: Q1 FY 2025-26 (April-June 2025)
- Total Invoices: 145
- B2B Invoices: 85
- B2C Invoices: 60
- Total Taxable Value: ₹450,000.00
- Total Tax: ₹81,000.00
```

---

### Scenario 6: Accounts Payable with Tax Details

**Situation**: Finance team needs to understand tax liability before payment processing.

**Code**:
```typescript
const report = await generateGSTR1Report("org-finance", 5, 2025);

// Calculate total amount payable
const taxPayable = {
  cgst: report.summary.totalCGST,
  sgst: report.summary.totalSGST,
  igst: report.summary.totalIGST,
  totalTax: report.summary.totalTax,
  dueDate: new Date(2025, 5, 20) // 20 days after month end
};

// Credit eligibility check
const eligibleForITC = report.b2b.length > 0;

// Payment notification
sendPaymentNotification({
  to: "finance@company.com",
  subject: `GST Payment Due - May 2025 (₹${taxPayable.totalTax})`,
  body: `
    Central GST: ₹${taxPayable.cgst}
    State GST: ₹${taxPayable.sgst}
    Integrated GST: ₹${taxPayable.igst}
    ---
    Total Due: ₹${taxPayable.totalTax}
    Due Date: ${taxPayable.dueDate.toLocaleDateString('en-IN')}
    ITC Eligible: ${eligibleForITC ? 'Yes' : 'No'}
  `
});
```

---

### Scenario 7: Audit Trail and Compliance

**Situation**: Auditor needs complete invoice-level records for compliance.

**Code**:
```typescript
async function generateAuditReport(orgId: string, month: number, year: number) {
  const report = await generateGSTR1Report(orgId, month, year);
  
  // Create detailed audit trail
  const auditData = {
    period: `${month}/${year}`,
    generated_at: report.generatedAt.toISOString(),
    organization_id: orgId,
    invoice_details: {
      b2b: report.b2b.map(inv => ({
        invoice_number: inv.invoiceNumber,
        gstin: inv.gstin,
        date: inv.invoiceDate,
        taxable_value: inv.taxableValue,
        tax_amount: inv.totalTax,
        tax_rate: ((inv.totalTax / inv.taxableValue) * 100).toFixed(2) + '%',
        invoice_total: inv.invoiceValue,
        gst_treatment: 'B2B Supply'
      })),
      b2c: report.b2c.map(inv => ({
        invoice_number: inv.invoiceNumber,
        date: inv.invoiceDate,
        taxable_value: inv.taxableValue,
        tax_amount: inv.totalTax,
        invoice_total: inv.invoiceValue,
        gst_treatment: 'B2C Supply'
      }))
    },
    summary: {
      total_invoices: report.summary.totalB2BInvoices + report.summary.totalB2CInvoices,
      ...report.summary
    },
    audit_hash: generateHash(JSON.stringify(report))
  };
  
  // Save to audit log
  logToAuditDatabase(auditData);
  return auditData;
}
```

---

### Scenario 8: Email with Report Attachment

**Situation**: Automatically send monthly reports to stakeholders.

**Code**:
```typescript
import { transporter } from './config/email';

async function emailMonthlyReport(
  orgId: string,
  month: number,
  year: number,
  recipientEmail: string
) {
  // Generate report
  const report = await generateGSTR1Report(orgId, month, year);
  const csv = generateGSTR1CSV(report);
  const json = generateGSTR1JSON(report);
  
  // Create email
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `GSTR-1 Report - ${month}/${year}`,
    html: `
      <h2>GSTR-1 Return - ${month}/${year}</h2>
      <p>Dear Finance Team,</p>
      <p>Your monthly GSTR-1 report is attached.</p>
      
      <h3>Summary</h3>
      <ul>
        <li>B2B Invoices: ${report.summary.totalB2BInvoices}</li>
        <li>B2C Invoices: ${report.summary.totalB2CInvoices}</li>
        <li>Total Taxable: ₹${report.summary.totalTaxableValue}</li>
        <li>Total Tax: ₹${report.summary.totalTax}</li>
      </ul>
      
      <p>Generated: ${report.generatedAt.toLocaleString('en-IN')}</p>
    `,
    attachments: [
      {
        filename: `GSTR1_${month}_${year}.csv`,
        content: csv
      },
      {
        filename: `GSTR1_${month}_${year}.json`,
        content: JSON.stringify(json, null, 2)
      }
    ]
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`Report sent to ${recipientEmail}`);
}

// Schedule for 1st of each month
cron.schedule('0 9 1 * *', async () => {
  const organizations = await getOrganizations();
  
  for (const org of organizations) {
    const lastMonth = new Date().getMonth();
    const lastYear = lastMonth === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const reportMonth = lastMonth === 0 ? 12 : lastMonth;
    
    await emailMonthlyReport(
      org.id,
      reportMonth,
      lastYear,
      org.financeEmail
    );
  }
});
```

---

### Scenario 9: Data Validation Before Submission

**Situation**: Validate GST numbers and invoice dates before submitting to portal.

**Code**:
```typescript
function validateGSTR1Report(report: GSTR1Report): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check B2B invoices have valid GST numbers
  report.b2b.forEach((inv, index) => {
    if (!inv.gstin || inv.gstin.length !== 15) {
      errors.push(`B2B Invoice ${index + 1} (${inv.invoiceNumber}): Invalid GSTIN`);
    }
    if (!inv.invoiceDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      errors.push(`B2B Invoice ${index + 1}: Invalid date format`);
    }
  });
  
  // Check tax calculations
  report.b2b.concat(report.b2c).forEach((inv, index) => {
    const calculatedTax = inv.cgstAmount + inv.sgstAmount + inv.igstAmount;
    if (Math.abs(calculatedTax - inv.totalTax) > 0.01) {
      errors.push(`Invoice ${inv.invoiceNumber}: Tax calculation mismatch`);
    }
  });
  
  // Check for zero-tax invoices
  const zeroTaxCount = report.b2b.filter(i => i.totalTax === 0).length;
  if (zeroTaxCount > 0) {
    warnings.push(`${zeroTaxCount} B2B invoices have zero tax`);
  }
  
  // Summary validation
  const expectedSum = report.b2b.reduce((sum, i) => sum + i.cgstAmount + i.sgstAmount + i.igstAmount, 0)
                   + report.b2c.reduce((sum, i) => sum + i.cgstAmount + i.sgstAmount + i.igstAmount, 0);
  
  if (Math.abs(expectedSum - report.summary.totalTax) > 0.01) {
    errors.push('Summary total tax does not match invoice sum');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    processedAt: new Date()
  };
}

// Usage
const report = await generateGSTR1Report("org-id", 7, 2025);
const validation = validateGSTR1Report(report);

if (!validation.isValid) {
  console.error("Report has errors:", validation.errors);
} else if (validation.warnings.length > 0) {
  console.warn("Report warnings:", validation.warnings);
} else {
  console.log("Report validated successfully");
}
```

---

### Scenario 10: Performance Testing with Large Dataset

**Situation**: Need to ensure system handles end-of-year reports with thousands of invoices.

**Code**:
```typescript
async function performanceTest(
  orgId: string,
  invoiceCount: number = 10000
) {
  console.time("GSTR1 Report Generation");
  
  // Create test data
  const startTime = performance.now();
  const report = await generateGSTR1Report(orgId, 12, 2025);
  const endTime = performance.now();
  
  console.log(`
    Report Generation Performance:
    - Invoices processed: ${report.b2b.length + report.b2c.length}
    - Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s
    - Avg per invoice: ${((endTime - startTime) / (report.b2b.length + report.b2c.length)).toFixed(2)}ms
  `);
  
  // CSV generation
  console.time("CSV Generation");
  const csv = generateGSTR1CSV(report);
  console.timeEnd("CSV Generation");
  console.log(`CSV size: ${(csv.length / 1024).toFixed(2)} KB`);
  
  // Memory usage
  const used = process.memoryUsage();
  console.log(`
    Memory Usage:
    - Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB
    - Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB
  `);
}
```

---

## Frontend Usage Examples

### React Hooks Pattern

```typescript
import { useState } from 'react';

function ReportComponent() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/gst/gstr1/report?month=${month}&year=${year}`
      );
      const data = await response.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select value={month} onChange={e => setMonth(e.target.value)}>
        {/* Month options */}
      </select>
      <button onClick={handleGenerateReport} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Report'}
      </button>
      {report && (
        <div>
          <h3>B2B: {report.summary.totalB2BInvoices}</h3>
          <h3>B2C: {report.summary.totalB2CInvoices}</h3>
          <h3>Total Tax: ₹{report.summary.totalTax}</h3>
        </div>
      )}
    </div>
  );
}
```

---

## API Integration Examples

### cURL
```bash
# Get JSON report
curl \
  -H "Authorization: Bearer token123" \
  "http://api.example.com/api/gst/gstr1/report?month=1&year=2025"

# Download CSV
curl \
  -H "Authorization: Bearer token123" \
  "http://api.example.com/api/gst/gstr1/export-csv?month=1&year=2025" \
  -o report.csv
```

### Python
```python
import requests

headers = {'Authorization': 'Bearer token123'}
params = {'month': 1, 'year': 2025}

response = requests.get(
  'http://api.example.com/api/gst/gstr1/report',
  params=params,
  headers=headers
)

data = response.json()
print(f"B2B Invoices: {data['summary']['totalB2BInvoices']}")
print(f"Total Tax: ₹{data['summary']['totalTax']}")
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

const config = {
  headers: { 'Authorization': 'Bearer token123' }
};

const response = await axios.get(
  'http://api.example.com/api/gst/gstr1/report',
  { params: { month: 1, year: 2025 }, ...config }
);

console.log(`B2B: ${response.data.summary.totalB2BInvoices}`);
console.log(`Tax: ₹${response.data.summary.totalTax}`);
```

---

## Testing Your Implementation

All tests are included and can be run with:

```bash
npm test -- gstr.service.test.ts
npm test -- gstr.routes.test.ts --coverage
```

These examples cover:
✅ Single month reports  
✅ Mixed B2B/B2C invoices  
✅ Tax type variations  
✅ Multi-organization scenarios  
✅ Quarterly compilation  
✅ Financial reporting  
✅ Audit trails  
✅ Email automation  
✅ Data validation  
✅ Performance optimization  

All ready to use in production!
