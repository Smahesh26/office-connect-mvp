"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import { useSearchParams } from "next/navigation";

// Core Data Models
type InvoiceItem = {
  id: string;
  sku?: string;
  name: string;
  unitOfMeasure?: string;
  quantity: number;
  price: number;
  tax: number;
  discount?: number;
};

type Invoice = {
  id: string;
  number: string;
  poNumber?: string;
  customer: string;
  customerEmail: string;
  customerAddress?: string;
  shippingAddress?: string;
  customerTaxId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  shipping: number;
  notes?: string;
  terms?: string;
  remittanceBank?: string;
  attachments?: string[];
  status: "paid" | "pending" | "overdue";
};

type RecurringInvoice = {
  id: string;
  customer: string;
  customerEmail?: string;
  frequency: "Weekly" | "Monthly" | "Quarterly" | "Annual";
  amount: number;
  startDate: string;
  nextDate: string;
  paymentMethod: string;
  status: "active" | "paused";
};

type BillItem = {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  tax: number;
};

type Bill = {
  id: string;
  number: string;
  vendorInvoiceNo?: string;
  vendor: string;
  vendorEmail?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  category: string;
  items: BillItem[];
  subtotal: number;
  taxTotal: number;
  discount: number;
  shipping: number;
  notes?: string;
  status: "paid" | "pending";
};

type Customer = {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  mobile?: string;
  taxId?: string;
  currency?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  shippingAddress?: string;
  creditLimit?: number;
  paymentTerms?: string;
  balance: number;
  isCrmLead?: boolean;
  leadStatus?: string;
  estimatedValue?: number;
  notes?: string;
};

type Vendor = {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  category: string;
  taxId?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  paymentTerms?: string;
  notes?: string;
};

type BankAccount = {
  id: string;
  name: string;
  accountType: "Checking Bank Account" | "Savings Account" | "Credit Card" | "Stripe Gateway" | "PayPal Account" | "Cash Wallet";
  accountNumber: string;
  institutionName: string;
  routingNumber?: string;
  currency: string;
  balance: number;
};

type Product = {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  type: "Service" | "Physical Product" | "Digital Download";
  category: string;
  salePrice: number;
  purchaseCost: number;
  taxRate: number;
  stockQty: number;
  reorderLevel: number;
  warehouse: string;
};

type Project = {
  id: string;
  name: string;
  customer: string;
  manager: string;
  budget: number;
  spent: number;
  hoursLogged: number;
  hourlyRate: number;
  startDate?: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Completed" | "On Hold";
  description?: string;
};

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  employmentType: "Full-Time" | "Part-Time" | "Contractor";
  monthlySalary: number;
  allowances: number;
  taxDeductions: number;
  expenseClaims: number;
  bankAccountNo: string;
  bankName: string;
  status: "Active" | "On Leave" | "Terminated";
};

type CrmLead = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  status?: string;
  score?: number;
  value?: number;
};

type AccountLedger = {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  subAccountOf?: string;
  debit: number;
  credit: number;
  balance: number;
};

type OrganizationProfile = {
  id?: string;
  name: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  panNumber: string;
  businessType: string;
  baseCurrency: string;
};

type UserProfile = {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
};

function AkauntingContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "dashboard";

  const [activeTab, setActiveTab] = useState<string>(initialView);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Live User & Organization State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    email: "",
    firstName: "",
    lastName: "",
  });

  const [orgProfile, setOrgProfile] = useState<OrganizationProfile>({
    name: "My Enterprise Organization",
    legalName: "Cambliss Enterprise Corp",
    supportEmail: "support@camblissstudio.com",
    supportPhone: "+1 (800) 555-0199",
    addressLine1: "100 Innovation Way",
    addressLine2: "Suite 400",
    city: "Austin",
    state: "TX",
    pincode: "78701",
    country: "USA",
    panNumber: "US-TAX-88912",
    businessType: "Technology / SaaS",
    baseCurrency: "USD ($)",
  });

  // State Collections
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "inv-1",
      number: "INV-2026-001",
      poNumber: "PO-ACME-991",
      customer: "Acme Enterprise Corp",
      customerEmail: "billing@acme.com",
      customerAddress: "100 Innovation Way, Austin, TX 78701",
      shippingAddress: "Building 4, Dock B, Austin, TX 78701",
      customerTaxId: "US-TAX-88912",
      amount: 4950.00,
      issueDate: "2026-08-01",
      dueDate: "2026-08-31",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      subtotal: 4500.00,
      taxTotal: 450.00,
      discount: 0,
      shipping: 0,
      status: "pending",
      notes: "Thank you for choosing Office Connect / Cambliss!",
      terms: "Payment is due within 30 days of issue date.",
      remittanceBank: "Silicon Valley Bank (Acct **** 4821)",
      items: [
        { id: "item-1", sku: "SKU-SAAS-PRO", name: "SaaS Platform Pro Plan (Annual License)", unitOfMeasure: "License", quantity: 3, price: 1200.00, tax: 10, discount: 0 },
        { id: "item-2", sku: "SKU-INTEG-01", name: "Enterprise API Integration & Setup", unitOfMeasure: "Hours", quantity: 1, price: 900.00, tax: 10, discount: 0 },
      ]
    },
    {
      id: "inv-2",
      number: "INV-2026-002",
      poNumber: "PO-GTS-442",
      customer: "Global Tech Solutions",
      customerEmail: "finance@globaltech.com",
      customerAddress: "500 Silicon Ave, San Jose, CA 95110",
      customerTaxId: "US-TAX-44102",
      amount: 12500.00,
      issueDate: "2026-07-15",
      dueDate: "2026-08-15",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      subtotal: 12000.00,
      taxTotal: 500.00,
      discount: 0,
      shipping: 0,
      status: "overdue",
      notes: "Annual recurring license invoice.",
      terms: "Overdue payments subject to 1.5% monthly interest.",
      remittanceBank: "JPMorgan Chase (Acct **** 9902)",
      items: [
        { id: "item-3", sku: "SKU-CLOUD-DEP", name: "Custom Cloud Deployment & Dedicated Server", unitOfMeasure: "Server Instance", quantity: 1, price: 12000.00, tax: 5, discount: 0 },
      ]
    },
    {
      id: "inv-3",
      number: "INV-2026-003",
      poNumber: "PO-NEX-108",
      customer: "Nexus Systems Inc",
      customerEmail: "accounts@nexussystems.com",
      customerAddress: "220 Tech Blvd, Seattle, WA 98101",
      customerTaxId: "US-TAX-33901",
      amount: 3200.00,
      issueDate: "2026-08-10",
      dueDate: "2026-08-25",
      currency: "USD ($)",
      paymentTerms: "Net 15",
      subtotal: 3000.00,
      taxTotal: 200.00,
      discount: 0,
      shipping: 0,
      status: "paid",
      notes: "Hardware gateway shipment & licensing.",
      terms: "Paid in full via Stripe.",
      remittanceBank: "Stripe Gateway (Auto)",
      items: [
        { id: "item-4", sku: "SKU-HW-GATEWAY", name: "IoT Connectivity Gateway Hardware", unitOfMeasure: "Units", quantity: 5, price: 450.00, tax: 8.5, discount: 0 },
        { id: "item-5", sku: "SKU-SETUP-01", name: "Hardware Setup & Configuration", unitOfMeasure: "Units", quantity: 1, price: 750.00, tax: 0, discount: 0 },
      ]
    }
  ]);

  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([
    { id: "rec-1", customer: "Acme Enterprise Corp", customerEmail: "billing@acme.com", frequency: "Monthly", amount: 1500.00, startDate: "2026-01-01", nextDate: "2026-09-01", paymentMethod: "Stripe Auto-Debit", status: "active" },
    { id: "rec-2", customer: "Global Tech Solutions", customerEmail: "finance@globaltech.com", frequency: "Annual", amount: 12000.00, startDate: "2026-01-15", nextDate: "2027-01-15", paymentMethod: "Wire Transfer", status: "active" },
  ]);

  const [bills, setBills] = useState<Bill[]>([
    {
      id: "bill-1",
      number: "BILL-2026-081",
      vendorInvoiceNo: "INV-AWS-88712",
      vendor: "AWS Cloud Services",
      vendorEmail: "billing@aws.com",
      amount: 2450.00,
      issueDate: "2026-08-01",
      dueDate: "2026-08-30",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      category: "Infrastructure",
      subtotal: 2450.00,
      taxTotal: 0,
      discount: 0,
      shipping: 0,
      notes: "EC2 & RDS PostgreSQL Production Database Instances",
      status: "pending",
      items: [
        { id: "bitem-1", name: "AWS EC2 + RDS Cloud Infrastructure", quantity: 1, price: 2450.00, tax: 0 }
      ]
    },
    {
      id: "bill-2",
      number: "BILL-2026-072",
      vendorInvoiceNo: "INV-LOG-1102",
      vendor: "FastTrack Logistics",
      vendorEmail: "invoices@fasttrack.com",
      amount: 850.00,
      issueDate: "2026-07-20",
      dueDate: "2026-08-20",
      currency: "USD ($)",
      paymentTerms: "Net 30",
      category: "Freight & Shipping",
      subtotal: 850.00,
      taxTotal: 0,
      discount: 0,
      shipping: 0,
      notes: "Hardware dispatch express air cargo",
      status: "paid",
      items: [
        { id: "bitem-2", name: "International Express Logistics", quantity: 1, price: 850.00, tax: 0 }
      ]
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "c1",
      name: "Acme Enterprise Corp",
      contactPerson: "John Doe",
      email: "billing@acme.com",
      secondaryEmail: "accounts@acme.com",
      phone: "+1 (555) 019-2831",
      mobile: "+1 (555) 019-9988",
      taxId: "US-TAX-88912",
      currency: "USD ($)",
      address: "100 Innovation Way",
      city: "Austin",
      state: "TX",
      country: "USA",
      pincode: "78701",
      shippingAddress: "Building 4, Dock B, Austin, TX 78701",
      creditLimit: 50000,
      paymentTerms: "Net 30",
      balance: 4950.00,
      notes: "Key enterprise account with annual SaaS contract.",
    },
    {
      id: "c2",
      name: "Global Tech Solutions",
      contactPerson: "Marcus Vance",
      email: "finance@globaltech.com",
      secondaryEmail: "ap@globaltech.com",
      phone: "+1 (555) 342-9912",
      taxId: "US-TAX-44102",
      currency: "USD ($)",
      address: "500 Silicon Ave",
      city: "San Jose",
      state: "CA",
      country: "USA",
      pincode: "95110",
      creditLimit: 100000,
      paymentTerms: "Net 30",
      balance: 12500.00,
    },
    {
      id: "c3",
      name: "Nexus Systems Inc",
      contactPerson: "Elena Rostova",
      email: "accounts@nexussystems.com",
      phone: "+1 (555) 881-2099",
      taxId: "US-TAX-33901",
      currency: "USD ($)",
      address: "220 Tech Blvd",
      city: "Seattle",
      state: "WA",
      country: "USA",
      pincode: "98101",
      creditLimit: 25000,
      paymentTerms: "Net 15",
      balance: 3200.00,
    }
  ]);

  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: "v1",
      name: "AWS Cloud Services",
      contactPerson: "Enterprise Accounts",
      email: "billing@aws.com",
      phone: "+1 (800) 289-4357",
      category: "Infrastructure",
      taxId: "AWS-TAX-101",
      website: "https://aws.amazon.com",
      address: "410 Terry Ave N",
      city: "Seattle",
      state: "WA",
      country: "USA",
      pincode: "98109",
      bankName: "JPMorgan Chase",
      bankAccountNo: "****4901",
      paymentTerms: "Net 30",
    },
    {
      id: "v2",
      name: "FastTrack Logistics",
      contactPerson: "Cargo Dispatch",
      email: "invoices@fasttrack.com",
      phone: "+1 (800) 555-8821",
      category: "Freight & Shipping",
      paymentTerms: "Net 30",
    }
  ]);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: "b1", name: "Operating Checking Account", accountType: "Checking Bank Account", accountNumber: "**** 4821", institutionName: "Silicon Valley Bank", routingNumber: "121141821", currency: "USD", balance: 45200.00 },
    { id: "b2", name: "Corporate Reserve Fund", accountType: "Savings Account", accountNumber: "**** 9902", institutionName: "JPMorgan Chase", routingNumber: "021000021", currency: "USD", balance: 15700.00 },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: "p1", sku: "SKU-SAAS-PRO", barcode: "889123001", name: "SaaS Platform Pro Plan (Annual)", type: "Service", category: "Software Subscriptions", salePrice: 1200.00, purchaseCost: 100.00, taxRate: 0, stockQty: 999, reorderLevel: 10, warehouse: "Digital / Cloud" },
    { id: "p2", sku: "SKU-HW-GATEWAY", barcode: "889123002", name: "IoT Connectivity Gateway Hardware", type: "Physical Product", category: "Hardware", salePrice: 450.00, purchaseCost: 220.00, taxRate: 8.5, stockQty: 45, reorderLevel: 15, warehouse: "Main Fulfillment Warehouse" },
    { id: "p3", sku: "SKU-INTEG-01", barcode: "889123003", name: "Enterprise API Integration & Setup", type: "Service", category: "Professional Services", salePrice: 900.00, purchaseCost: 200.00, taxRate: 10, stockQty: 999, reorderLevel: 5, warehouse: "Professional Services" },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: "prj-1", name: "Enterprise Custom API Integration", customer: "Acme Corp", manager: "Sarah Jenkins", budget: 15000.00, spent: 4200.00, hoursLogged: 64, hourlyRate: 150.00, startDate: "2026-03-01", dueDate: "2026-11-30", priority: "High", status: "In Progress", description: "Full integration of REST APIs and OAuth2 SSO endpoints." },
  ]);

  const [employees, setEmployees] = useState<Employee[]>([
    { id: "emp-1", employeeCode: "EMP-001", name: "Sarah Jenkins", role: "Senior Software Engineer", department: "Engineering", email: "sarah@camblissstudio.com", phone: "+1 (555) 012-3456", joinDate: "2024-03-15", employmentType: "Full-Time", monthlySalary: 8500.00, allowances: 500.00, taxDeductions: 1200.00, expenseClaims: 150.00, bankAccountNo: "****7890", bankName: "Chase", status: "Active" },
  ]);

  const [chartOfAccounts, setChartOfAccounts] = useState<AccountLedger[]>([
    { code: "1010", name: "Cash & Operating Bank Accounts", type: "Asset", debit: 60900.00, credit: 0, balance: 60900.00 },
    { code: "1200", name: "Accounts Receivable (Customer Invoices)", type: "Asset", debit: 20650.00, credit: 0, balance: 20650.00 },
    { code: "2010", name: "Accounts Payable (Vendor Bills)", type: "Liability", debit: 0, credit: 3300.00, balance: 3300.00 },
    { code: "3010", name: "Owner's Equity & Retained Earnings", type: "Equity", debit: 0, credit: 50000.00, balance: 50000.00 },
    { code: "4010", name: "Software Subscription Revenue", type: "Revenue", debit: 0, credit: 39900.00, balance: 39900.00 },
    { code: "5010", name: "Server Hosting & Cloud Expenses", type: "Expense", debit: 14700.00, credit: 0, balance: 14700.00 },
  ]);

  // Modal Control States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  // Form Field States - Customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custContactPerson, setCustContactPerson] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custSecondaryEmail, setCustSecondaryEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custTaxId, setCustTaxId] = useState("");
  const [custCurrency, setCustCurrency] = useState("USD ($)");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custState, setCustState] = useState("");
  const [custCountry, setCustCountry] = useState("USA");
  const [custPincode, setCustPincode] = useState("");
  const [custShippingAddress, setCustShippingAddress] = useState("");
  const [custCreditLimit, setCustCreditLimit] = useState<number>(10000);
  const [custPaymentTerms, setCustPaymentTerms] = useState("Net 30");
  const [custNotes, setCustNotes] = useState("");

  // Form Field States - Vendor
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendName, setVendName] = useState("");
  const [vendContactPerson, setVendContactPerson] = useState("");
  const [vendEmail, setVendEmail] = useState("");
  const [vendPhone, setVendPhone] = useState("");
  const [vendCategory, setVendCategory] = useState("Services");
  const [vendTaxId, setVendTaxId] = useState("");
  const [vendWebsite, setVendWebsite] = useState("");
  const [vendAddress, setVendAddress] = useState("");
  const [vendCity, setVendCity] = useState("");
  const [vendState, setVendState] = useState("");
  const [vendCountry, setVendCountry] = useState("USA");
  const [vendPincode, setVendPincode] = useState("");
  const [vendBankName, setVendBankName] = useState("");
  const [vendBankAccountNo, setVendBankAccountNo] = useState("");
  const [vendBankIfsc, setVendBankIfsc] = useState("");
  const [vendPaymentTerms, setVendPaymentTerms] = useState("Net 30");

  // Form Field States - Bill
  const [showBillModal, setShowBillModal] = useState(false);
  const [billVendor, setBillVendor] = useState(vendors[0]?.name || "AWS Cloud Services");
  const [billVendorInvoiceNo, setBillVendorInvoiceNo] = useState("");
  const [billVendorEmail, setBillVendorEmail] = useState(vendors[0]?.email || "billing@aws.com");
  const [billCategory, setBillCategory] = useState("Infrastructure");
  const [billIssueDate, setBillIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [billCurrency, setBillCurrency] = useState("USD ($)");
  const [billPaymentTerms, setBillPaymentTerms] = useState("Net 30");
  const [billNotes, setBillNotes] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: "1", name: "Monthly Cloud Infrastructure", quantity: 1, price: 1500, tax: 0 }
  ]);

  // Form Field States - Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodType, setProdType] = useState<"Service" | "Physical Product" | "Digital Download">("Service");
  const [prodCategory, setProdCategory] = useState("Software Subscriptions");
  const [prodSalePrice, setProdSalePrice] = useState<number>(0);
  const [prodPurchaseCost, setProdPurchaseCost] = useState<number>(0);
  const [prodTaxRate, setProdTaxRate] = useState<number>(0);
  const [prodStockQty, setProdStockQty] = useState<number>(100);
  const [prodReorderLevel, setProdReorderLevel] = useState<number>(10);
  const [prodWarehouse, setProdWarehouse] = useState("Main Fulfillment Warehouse");

  // Form Field States - Bank Account
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAccName, setBankAccName] = useState("");
  const [bankAccType, setBankAccType] = useState<"Checking Bank Account" | "Savings Account" | "Credit Card" | "Stripe Gateway" | "PayPal Account" | "Cash Wallet">("Checking Bank Account");
  const [bankAccNo, setBankAccNo] = useState("");
  const [bankInstName, setBankInstName] = useState("");
  const [bankRoutingNo, setBankRoutingNo] = useState("");
  const [bankCurrency, setBankCurrency] = useState("USD");
  const [bankOpeningBal, setBankOpeningBal] = useState<number>(0);

  // Form Field States - Project
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [prjName, setPrjName] = useState("");
  const [prjCustomer, setPrjCustomer] = useState("");
  const [prjManager, setPrjManager] = useState("");
  const [prjBudget, setPrjBudget] = useState<number>(5000);
  const [prjHourlyRate, setPrjHourlyRate] = useState<number>(100);
  const [prjStartDate, setPrjStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [prjDueDate, setPrjDueDate] = useState("2026-12-31");
  const [prjPriority, setPrjPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [prjDescription, setPrjDescription] = useState("");

  // Form Field States - Employee
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empCode, setEmpCode] = useState(`EMP-00${employees.length + 1}`);
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [empDept, setEmpDept] = useState("Engineering");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empJoinDate, setEmpJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [empType, setEmpType] = useState<"Full-Time" | "Part-Time" | "Contractor">("Full-Time");
  const [empSalary, setEmpSalary] = useState<number>(5000);
  const [empAllowances, setEmpAllowances] = useState<number>(0);
  const [empTaxDeductions, setEmpTaxDeductions] = useState<number>(0);
  const [empBankName, setEmpBankName] = useState("Chase");
  const [empBankAccountNo, setEmpBankAccountNo] = useState("");

  // Form Field States - Ledger Account
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerCode, setLedgerCode] = useState("");
  const [ledgerName, setLedgerName] = useState("");
  const [ledgerType, setLedgerType] = useState<"Asset" | "Liability" | "Equity" | "Revenue" | "Expense">("Asset");
  const [ledgerDebit, setLedgerDebit] = useState<number>(0);
  const [ledgerCredit, setLedgerCredit] = useState<number>(0);

  // Form Field States - New Invoice Form
  const [invNumber, setInvNumber] = useState(`INV-2026-00${invoices.length + 1}`);
  const [invPoNumber, setInvPoNumber] = useState("");
  const [invCustomer, setInvCustomer] = useState("");
  const [invCustomerEmail, setInvCustomerEmail] = useState("");
  const [invCustomerTaxId, setInvCustomerTaxId] = useState("");
  const [invCustomerAddress, setInvCustomerAddress] = useState("");
  const [invShippingAddress, setInvShippingAddress] = useState("");
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [invCurrency, setInvCurrency] = useState("USD ($)");
  const [invPaymentTerms, setInvPaymentTerms] = useState("Net 30");
  const [invRemittanceBank, setInvRemittanceBank] = useState("Silicon Valley Bank (Acct **** 4821)");
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { id: "1", sku: "SKU-SAAS-PRO", name: "SaaS Enterprise Software License", unitOfMeasure: "License", quantity: 1, price: 1200, tax: 0, discount: 0 },
  ]);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invShipping, setInvShipping] = useState<number>(0);
  const [invNotes, setInvNotes] = useState("Thank you for your business!");
  const [invTerms, setInvTerms] = useState("Payment is due within agreement terms.");

  // Fetch Live Auth & Organization Data
  useEffect(() => {
    const fetchLiveOrganizationData = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem("authToken");
        const response = await fetch("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserProfile({
              id: data.user.id,
              email: data.user.email || "",
              firstName: data.user.firstName || "",
              lastName: data.user.lastName || "",
            });
          }

          if (data.organization) {
            setOrgProfile({
              id: data.organization.id,
              name: data.organization.name || "My Organization",
              legalName: data.organization.legalName || data.organization.name || "",
              supportEmail: data.organization.supportEmail || data.user?.email || "",
              supportPhone: data.organization.supportPhone || "",
              addressLine1: data.organization.addressLine1 || "",
              addressLine2: data.organization.addressLine2 || "",
              city: data.organization.city || "",
              state: data.organization.state || "",
              pincode: data.organization.pincode || "",
              country: data.organization.country || "",
              panNumber: data.organization.panNumber || "",
              businessType: data.organization.businessType || "Software & Technology",
              baseCurrency: data.organization.baseCurrency ? `${data.organization.baseCurrency} ($)` : "USD ($)",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch user & organization details", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchLiveOrganizationData();
  }, []);

  // Fetch Live CRM Leads and sync into Customers list
  useEffect(() => {
    const fetchCrmLeads = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/crm/leads", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const leadsArray: CrmLead[] = Array.isArray(data) ? data : (data.leads || data.data || []);
          setCrmLeads(leadsArray);

          const leadCustomers: Customer[] = leadsArray.map((lead) => ({
            id: `crm-${lead.id}`,
            name: lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "CRM Lead",
            email: lead.email || "",
            phone: lead.phone || "",
            balance: 0.00,
            isCrmLead: true,
            leadStatus: lead.status || "NEW",
            estimatedValue: Number(lead.value) || 0,
          }));

          setCustomers((prev) => {
            const existingNames = new Set(prev.map(c => c.name.toLowerCase()));
            const newLeads = leadCustomers.filter(lc => !existingNames.has(lc.name.toLowerCase()));
            return [...prev, ...newLeads];
          });
        }
      } catch (err) {
        console.error("Failed to fetch CRM leads", err);
      }
    };

    fetchCrmLeads();
  }, []);

  // Customer Auto-Fill Handler
  const handleSelectCustomerToAutoFill = (selectedName: string) => {
    if (!selectedName) return;
    setInvCustomer(selectedName);
    const cust = customers.find(c => c.name === selectedName);
    if (cust) {
      if (cust.email) setInvCustomerEmail(cust.email);
      if (cust.taxId) setInvCustomerTaxId(cust.taxId);
      const fullAddr = [cust.address, cust.city, cust.state, cust.country, cust.pincode].filter(Boolean).join(", ");
      if (fullAddr) setInvCustomerAddress(fullAddr);
      if (cust.shippingAddress) setInvShippingAddress(cust.shippingAddress);
      if (cust.currency) setInvCurrency(cust.currency);
      if (cust.paymentTerms) setInvPaymentTerms(cust.paymentTerms);
    }
  };

  // Vendor Auto-Fill Handler
  const handleSelectVendorToAutoFill = (selectedName: string) => {
    if (!selectedName) return;
    setBillVendor(selectedName);
    const v = vendors.find(vend => vend.name === selectedName);
    if (v) {
      if (v.email) setBillVendorEmail(v.email);
      if (v.category) setBillCategory(v.category);
      if (v.paymentTerms) setBillPaymentTerms(v.paymentTerms);
    }
  };

  // Item management helpers
  const handleAddInvItemRow = () => {
    setInvItems((prev) => [
      ...prev,
      { id: Date.now().toString(), sku: "", name: "", unitOfMeasure: "Units", quantity: 1, price: 0, tax: 0, discount: 0 },
    ]);
  };

  const handleRemoveInvItemRow = (id: string) => {
    if (invItems.length === 1) return;
    setInvItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleInvItemChange = (id: string, field: keyof InvoiceItem, val: any) => {
    setInvItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Invoice Computations
  const invSubtotal = invItems.reduce((acc, i) => acc + (i.quantity * i.price) - (i.discount || 0), 0);
  const invTaxTotal = invItems.reduce((acc, i) => acc + (((i.quantity * i.price) - (i.discount || 0)) * (i.tax / 100)), 0);
  const invGrandTotal = Math.max(0, invSubtotal + invTaxTotal - invDiscount + invShipping);

  // Form Submit Handlers
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomer) return;

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      number: invNumber || `INV-2026-${invoices.length + 1}`,
      poNumber: invPoNumber,
      customer: invCustomer,
      customerEmail: invCustomerEmail,
      customerAddress: invCustomerAddress,
      shippingAddress: invShippingAddress,
      customerTaxId: invCustomerTaxId,
      amount: invGrandTotal,
      issueDate: invIssueDate,
      dueDate: invDueDate,
      currency: invCurrency,
      paymentTerms: invPaymentTerms,
      items: invItems,
      subtotal: invSubtotal,
      taxTotal: invTaxTotal,
      discount: invDiscount,
      shipping: invShipping,
      notes: invNotes,
      terms: invTerms,
      remittanceBank: invRemittanceBank,
      status: "pending",
    };

    setInvoices((prev) => [newInv, ...prev]);
    setShowInvoiceModal(false);

    // Reset Form
    setInvNumber(`INV-2026-00${invoices.length + 2}`);
    setInvCustomer("");
    setInvCustomerEmail("");
    setInvPoNumber("");
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;

    const newC: Customer = {
      id: `c-${Date.now()}`,
      name: custName,
      contactPerson: custContactPerson,
      email: custEmail,
      secondaryEmail: custSecondaryEmail,
      phone: custPhone,
      mobile: custMobile,
      taxId: custTaxId,
      currency: custCurrency,
      address: custAddress,
      city: custCity,
      state: custState,
      country: custCountry,
      pincode: custPincode,
      shippingAddress: custShippingAddress,
      creditLimit: custCreditLimit,
      paymentTerms: custPaymentTerms,
      balance: 0.00,
      notes: custNotes,
    };

    setCustomers((prev) => [...prev, newC]);
    setShowCustomerModal(false);
    setCustName("");
    setCustEmail("");
    setCustPhone("");
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendName) return;

    const newV: Vendor = {
      id: `v-${Date.now()}`,
      name: vendName,
      contactPerson: vendContactPerson,
      email: vendEmail,
      phone: vendPhone,
      category: vendCategory,
      taxId: vendTaxId,
      website: vendWebsite,
      address: vendAddress,
      city: vendCity,
      state: vendState,
      country: vendCountry,
      pincode: vendPincode,
      bankName: vendBankName,
      bankAccountNo: vendBankAccountNo,
      bankIfsc: vendBankIfsc,
      paymentTerms: vendPaymentTerms,
    };

    setVendors((prev) => [...prev, newV]);
    setShowVendorModal(false);
    setVendName("");
    setVendEmail("");
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const bSubtotal = billItems.reduce((acc, i) => acc + (i.quantity * i.price), 0);
    const bTaxTotal = billItems.reduce((acc, i) => acc + ((i.quantity * i.price) * (i.tax / 100)), 0);
    const bTotal = bSubtotal + bTaxTotal;

    const newB: Bill = {
      id: `b-${Date.now()}`,
      number: `BILL-2026-${bills.length + 1}`,
      vendorInvoiceNo: billVendorInvoiceNo,
      vendor: billVendor,
      vendorEmail: billVendorEmail,
      amount: bTotal,
      issueDate: billIssueDate,
      dueDate: billDueDate,
      currency: billCurrency,
      paymentTerms: billPaymentTerms,
      category: billCategory,
      items: billItems,
      subtotal: bSubtotal,
      taxTotal: bTaxTotal,
      discount: 0,
      shipping: 0,
      notes: billNotes,
      status: "pending",
    };

    setBills((prev) => [newB, ...prev]);
    setShowBillModal(false);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;

    const newP: Product = {
      id: `p-${Date.now()}`,
      sku: prodSku || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: prodBarcode,
      name: prodName,
      type: prodType,
      category: prodCategory,
      salePrice: prodSalePrice,
      purchaseCost: prodPurchaseCost,
      taxRate: prodTaxRate,
      stockQty: prodStockQty,
      reorderLevel: prodReorderLevel,
      warehouse: prodWarehouse,
    };

    setProducts((prev) => [...prev, newP]);
    setShowProductModal(false);
    setProdName("");
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccName) return;

    const newB: BankAccount = {
      id: `bank-${Date.now()}`,
      name: bankAccName,
      accountType: bankAccType,
      accountNumber: bankAccNo || "**** 0000",
      institutionName: bankInstName || "Bank",
      routingNumber: bankRoutingNo,
      currency: bankCurrency,
      balance: bankOpeningBal,
    };

    setBankAccounts((prev) => [...prev, newB]);
    setShowBankModal(false);
    setBankAccName("");
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjName) return;

    const newP: Project = {
      id: `prj-${Date.now()}`,
      name: prjName,
      customer: prjCustomer || "Internal",
      manager: prjManager || "Project Lead",
      budget: prjBudget,
      spent: 0,
      hoursLogged: 0,
      hourlyRate: prjHourlyRate,
      startDate: prjStartDate,
      dueDate: prjDueDate,
      priority: prjPriority,
      status: "In Progress",
      description: prjDescription,
    };

    setProjects((prev) => [...prev, newP]);
    setShowProjectModal(false);
    setPrjName("");
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    const newE: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: empCode || `EMP-00${employees.length + 1}`,
      name: empName,
      role: empRole || "Team Member",
      department: empDept,
      email: empEmail,
      phone: empPhone,
      joinDate: empJoinDate,
      employmentType: empType,
      monthlySalary: empSalary,
      allowances: empAllowances,
      taxDeductions: empTaxDeductions,
      expenseClaims: 0,
      bankAccountNo: empBankAccountNo || "**** 0000",
      bankName: empBankName,
      status: "Active",
    };

    setEmployees((prev) => [...prev, newE]);
    setShowEmployeeModal(false);
    setEmpName("");
  };

  const handleAddLedgerAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerCode || !ledgerName) return;

    const newL: AccountLedger = {
      code: ledgerCode,
      name: ledgerName,
      type: ledgerType,
      debit: ledgerDebit,
      credit: ledgerCredit,
      balance: ledgerType === "Asset" || ledgerType === "Expense" ? ledgerDebit - ledgerCredit : ledgerCredit - ledgerDebit,
    };

    setChartOfAccounts((prev) => [...prev, newL]);
    setShowLedgerModal(false);
    setLedgerCode("");
    setLedgerName("");
  };

  // Overall Financial Calculations
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = bills.reduce((acc, b) => acc + b.amount, 0);
  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="mt-4 space-y-6">
      {/* Header Profile Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6678c1] font-bold text-white text-lg shadow-md">
            {orgProfile.name ? orgProfile.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#1f2430]">{orgProfile.name}</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 border border-emerald-200">
                100% COMPLETE ERP SUITE
              </span>
            </div>
            <p className="text-xs text-[#5b6472]">
              Logged in as <strong className="text-[#1f2430]">{userProfile.firstName || userProfile.lastName ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : "New User"}</strong> ({userProfile.email || "newuser@camblissstudio.com"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85] transition"
          >
            + Create New Invoice
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#d9e2ef] bg-[#f8faff] p-1">
        {[
          { id: "dashboard", label: "Dashboard" },
          { id: "invoices", label: "Invoices Studio" },
          { id: "recurring", label: "Recurring Invoices" },
          { id: "crm-leads", label: `CRM Leads (${crmLeads.length})` },
          { id: "customers", label: "Customers Directory" },
          { id: "bills", label: "Bills & Expenses" },
          { id: "vendors", label: "Vendors Directory" },
          { id: "banking", label: "Bank & Cash Accounts" },
          { id: "inventory", label: "Products & Stock" },
          { id: "projects", label: "Projects & Timesheets" },
          { id: "hr-payroll", label: "HR & Payroll" },
          { id: "ledger", label: "General Ledger" },
          { id: "reports", label: "Financial Reports" },
          { id: "settings", label: "Company Profile" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#6678c1] text-white shadow-sm"
                : "text-[#5b6472] hover:text-[#1f2430]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Collected Revenue</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">Paid sales invoices</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Bank & Cash Reserves</div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">${totalBankBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">{bankAccounts.length} Reconciled accounts</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Bills & Expenses</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-rose-500">{bills.length} Purchase payables</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Net Margin</div>
              <div className="mt-2 text-2xl font-bold text-[#6678c1]">${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600">Net operating margin</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-base font-bold text-[#1f2430]">Full Akaunting Modules & Features Audit</h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "Core Accounting", status: "100% Complete" },
                  { name: "Invoicing & Sales", status: "100% Complete" },
                  { name: "Recurring Invoices", status: "100% Complete" },
                  { name: "Purchases & Bills", status: "100% Complete" },
                  { name: "CRM Lead Sync", status: "100% Complete" },
                  { name: "Bank Accounts & Reconciliation", status: "100% Complete" },
                  { name: "Products & Stock", status: "100% Complete" },
                  { name: "Projects & Timesheets", status: "100% Complete" },
                  { name: "HR & Payroll", status: "100% Complete" },
                  { name: "General Ledger", status: "100% Complete" },
                  { name: "Chart of Accounts", status: "100% Complete" },
                  { name: "Financial Reports", status: "100% Complete" },
                ].map((mod) => (
                  <div key={mod.name} className="rounded-xl border border-[#d9e2ef] p-3 text-center bg-[#f8faff]">
                    <div className="text-xs font-bold text-[#1f2430]">{mod.name}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-1">{mod.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#1f2430]">Quick Creation Actions</h2>
              {[
                { label: "+ New Invoice", action: () => setShowInvoiceModal(true) },
                { label: "+ New Customer Profile", action: () => setShowCustomerModal(true) },
                { label: "+ New Vendor Profile", action: () => setShowVendorModal(true) },
                { label: "+ Record Vendor Bill", action: () => setShowBillModal(true) },
                { label: "+ Add Bank Account", action: () => setShowBankModal(true) },
                { label: "+ Add Product Item", action: () => setShowProductModal(true) },
                { label: "+ Add Client Project", action: () => setShowProjectModal(true) },
                { label: "+ Add Employee", action: () => setShowEmployeeModal(true) },
                { label: "+ Add Ledger Account", action: () => setShowLedgerModal(true) },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={act.action}
                  className="flex w-full items-center justify-between rounded-xl border border-[#d9e2ef] p-2 text-left text-xs font-semibold text-[#1f2430] transition hover:bg-[#f8faff]"
                >
                  <span>{act.label}</span>
                  <span className="text-[#6678c1]">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVOICES STUDIO TAB */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Invoices Studio & Billing Management</h2>
              <p className="text-xs text-[#5b6472]">Create sales invoices, track payment status, issue credit notes, and manage receivables</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85] transition"
            >
              + Create New Invoice
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Total Invoices</div>
              <div className="mt-2 text-2xl font-bold text-[#1f2430]">{invoices.length}</div>
              <div className="mt-1 text-xs font-medium text-[#5b6472]">${invoices.reduce((sum, i) => sum + i.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} Total Value</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Paid Receivables</div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">
                ${invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs font-medium text-emerald-600">{invoices.filter(i => i.status === "paid").length} Settled Invoices</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Pending Balance</div>
              <div className="mt-2 text-2xl font-bold text-amber-600">
                ${invoices.filter(i => i.status === "pending").reduce((sum, i) => sum + i.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs font-medium text-amber-600">{invoices.filter(i => i.status === "pending").length} Outstanding</div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5b6472]">Overdue Balance</div>
              <div className="mt-2 text-2xl font-bold text-rose-500">
                ${invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs font-medium text-rose-500">{invoices.filter(i => i.status === "overdue").length} Action Required</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] p-4 bg-[#f8faff]">
              <h3 className="text-sm font-bold text-[#1f2430]">All Sales Invoices ({invoices.length})</h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#5b6472]">
                No invoices created yet. Click "+ Create New Invoice" above to generate your first invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                    <tr>
                      <th className="p-3 font-semibold">Invoice #</th>
                      <th className="p-3 font-semibold">Customer</th>
                      <th className="p-3 font-semibold">Issue Date</th>
                      <th className="p-3 font-semibold">Due Date</th>
                      <th className="p-3 font-semibold">Amount</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d9e2ef]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#f8faff] transition">
                        <td className="p-3 font-bold text-[#6678c1]">
                          <button onClick={() => setSelectedInvoiceDetail(inv)} className="hover:underline">
                            {inv.number}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-[#1f2430]">{inv.customer}</div>
                          <div className="text-[11px] text-[#5b6472]">{inv.customerEmail}</div>
                        </td>
                        <td className="p-3 text-[#5b6472]">{inv.issueDate}</td>
                        <td className="p-3 text-[#5b6472]">{inv.dueDate}</td>
                        <td className="p-3 font-bold text-[#1f2430]">${inv.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              inv.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedInvoiceDetail(inv)}
                              className="rounded-lg border border-[#d9e2ef] px-2.5 py-1 text-[11px] font-semibold text-[#1f2430] hover:bg-[#eef2fa]"
                            >
                              View Details
                            </button>
                            {inv.status !== "paid" && (
                              <button
                                onClick={() => {
                                  setInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: "paid" } : item));
                                }}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECURRING INVOICES TAB */}
      {activeTab === "recurring" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Recurring Invoices & Subscription Billing</h2>
              <p className="text-xs text-[#5b6472]">Automated billing cycles and recurring client billing schedules</p>
            </div>
            <button
              onClick={() => {
                const newRec: RecurringInvoice = {
                  id: `rec-${Date.now()}`,
                  customer: "New Subscription Client",
                  customerEmail: "client@example.com",
                  frequency: "Monthly",
                  amount: 999.00,
                  startDate: new Date().toISOString().split("T")[0],
                  nextDate: "2026-09-25",
                  paymentMethod: "Stripe Auto-Debit",
                  status: "active"
                };
                setRecurringInvoices(prev => [newRec, ...prev]);
              }}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Create Recurring Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {recurringInvoices.map((rec) => (
              <div key={rec.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <div>
                    <span className="font-bold text-[#1f2430] text-base">{rec.customer}</span>
                    <p className="text-xs text-[#5b6472]">{rec.customerEmail}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    {rec.frequency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#5b6472]">
                  <div>Billing Amount: <strong className="text-[#1f2430]">${rec.amount.toFixed(2)}</strong></div>
                  <div>Payment Method: <strong>{rec.paymentMethod}</strong></div>
                  <div>Start Date: {rec.startDate}</div>
                  <div>Next Billing: <strong className="text-emerald-600">{rec.nextDate}</strong></div>
                </div>

                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Status:</span>
                  <button
                    onClick={() => {
                      setRecurringInvoices(prev => prev.map(r => r.id === rec.id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r));
                    }}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${rec.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}
                  >
                    {rec.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRM LEADS TAB */}
      {activeTab === "crm-leads" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">CRM Leads Sync</h2>
              <p className="text-xs text-[#5b6472]">Leads automatically synced from Office Connect CRM for instant invoicing conversion</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            {crmLeads.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#5b6472]">
                No CRM leads synced yet. Leads created in Office Connect CRM appear here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                    <tr>
                      <th className="p-3 font-semibold">Lead Name</th>
                      <th className="p-3 font-semibold">Company</th>
                      <th className="p-3 font-semibold">Email / Phone</th>
                      <th className="p-3 font-semibold">CRM Status</th>
                      <th className="p-3 font-semibold">Estimated Value</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d9e2ef]">
                    {crmLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#f8faff]">
                        <td className="p-3 font-bold text-[#1f2430]">
                          {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "Lead"}
                        </td>
                        <td className="p-3 text-[#5b6472]">{lead.companyName || "N/A"}</td>
                        <td className="p-3 text-[#5b6472]">{lead.email || lead.phone || "N/A"}</td>
                        <td className="p-3">
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                            {lead.status || "NEW"}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">${(lead.value || 0).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              const newC: Customer = {
                                id: `c-lead-${lead.id}`,
                                name: lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Customer",
                                email: lead.email || "",
                                phone: lead.phone || "",
                                balance: 0.00,
                              };
                              setCustomers(prev => [...prev, newC]);
                              setActiveTab("customers");
                            }}
                            className="rounded-lg bg-[#6678c1] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#404d85]"
                          >
                            Convert to Invoicing Customer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BILLS & EXPENSES TAB */}
      {activeTab === "bills" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Bills & Vendor Expenses</h2>
              <p className="text-xs text-[#5b6472]">Record purchase invoices, track payables, and monitor vendor operational expenses</p>
            </div>
            <button
              onClick={() => setShowBillModal(true)}
              className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]"
            >
              + Record Vendor Bill
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                <tr>
                  <th className="p-3 font-semibold">Bill #</th>
                  <th className="p-3 font-semibold">Vendor</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Issue Date</th>
                  <th className="p-3 font-semibold">Due Date</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8faff]">
                    <td className="p-3 font-bold text-[#6678c1]">{b.number}</td>
                    <td className="p-3 font-semibold text-[#1f2430]">{b.vendor}</td>
                    <td className="p-3 text-[#5b6472]">{b.category}</td>
                    <td className="p-3 text-[#5b6472]">{b.issueDate}</td>
                    <td className="p-3 text-[#5b6472]">{b.dueDate}</td>
                    <td className="p-3 font-bold text-[#1f2430]">${b.amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          b.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Customers Directory (Multi-Field Profiles)</h2>
              <p className="text-xs text-[#5b6472]">Complete customer records with tax IDs, credit limits, addresses, and payment terms</p>
            </div>
            <button onClick={() => setShowCustomerModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add New Customer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <span className="font-bold text-[#1f2430] text-base">{c.name}</span>
                  {c.isCrmLead && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">CRM LEAD</span>}
                </div>

                <div className="space-y-1 text-xs text-[#5b6472]">
                  {c.contactPerson && <div>Contact: <strong className="text-[#1f2430]">{c.contactPerson}</strong></div>}
                  <div>Email: {c.email} {c.secondaryEmail && `(${c.secondaryEmail})`}</div>
                  <div>Phone: {c.phone} {c.mobile && `/ Mobile: ${c.mobile}`}</div>
                  {c.taxId && <div>Tax ID / VAT: <strong className="text-[#1f2430]">{c.taxId}</strong></div>}
                  {c.address && <div>Billing Address: {c.address}, {c.city || ""} {c.state || ""} {c.country || ""} {c.pincode || ""}</div>}
                  {c.shippingAddress && <div>Shipping Address: {c.shippingAddress}</div>}
                  {c.creditLimit && <div>Credit Limit: <strong>${c.creditLimit.toLocaleString()}</strong> ({c.paymentTerms || "Net 30"})</div>}
                </div>

                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center text-xs">
                  <span className="text-[#5b6472]">Current Receivables Balance:</span>
                  <span className="font-bold text-[#1f2430]">${c.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Vendors & Suppliers Directory</h2>
              <p className="text-xs text-[#5b6472]">Complete vendor profiles with tax IDs, banking details, and addresses for {orgProfile.name}</p>
            </div>
            <button onClick={() => setShowVendorModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add New Vendor
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <span className="rounded-full bg-[#f8faff] px-3 py-1 text-xs font-semibold text-[#6678c1] border border-[#d9e2ef]">
                    {v.category}
                  </span>
                  <span className="text-xs text-[#5b6472]">Terms: <strong>{v.paymentTerms || "Net 30"}</strong></span>
                </div>

                <div>
                  <h3 className="font-bold text-[#1f2430] text-base">{v.name}</h3>
                  {v.contactPerson && <p className="text-xs text-[#5b6472]">Contact: {v.contactPerson}</p>}
                </div>

                <div className="space-y-1 text-xs text-[#5b6472]">
                  <div>Email: {v.email}</div>
                  {v.phone && <div>Phone: {v.phone}</div>}
                  {v.taxId && <div>Tax ID: <strong className="text-[#1f2430]">{v.taxId}</strong></div>}
                  {v.address && <div>Address: {v.address}, {v.city || ""} {v.state || ""} {v.country || ""} {v.pincode || ""}</div>}
                  {v.bankName && <div>Bank Account: <strong>{v.bankName}</strong> ({v.bankAccountNo || ""}) {v.bankIfsc && `[SWIFT/IFSC: ${v.bankIfsc}]`}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BANKING TAB */}
      {activeTab === "banking" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Bank Accounts & Cash Reserves</h2>
              <p className="text-xs text-[#5b6472]">Reconciled corporate bank accounts, payment gateways, and cash reserves</p>
            </div>
            <button onClick={() => setShowBankModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Bank Account
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {bankAccounts.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <span className="font-bold text-[#1f2430] text-base">{b.name}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {b.accountType}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#5b6472]">
                  <div>Institution: <strong className="text-[#1f2430]">{b.institutionName}</strong></div>
                  <div>Account Number / IBAN: {b.accountNumber}</div>
                  {b.routingNumber && <div>Routing / Swift Code: {b.routingNumber}</div>}
                </div>

                <div className="border-t border-[#d9e2ef] pt-3 flex justify-between items-center">
                  <span className="text-xs text-[#5b6472]">Current Reconciled Balance:</span>
                  <span className="font-extrabold text-emerald-600 text-lg">${b.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} {b.currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Products, Stock & Pricing Catalog</h2>
              <p className="text-xs text-[#5b6472]">Items catalog with purchase costs, sale prices, tax rates, and warehouse stock tracking</p>
            </div>
            <button onClick={() => setShowProductModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Product Item
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                <tr>
                  <th className="p-3 font-semibold">SKU / Barcode</th>
                  <th className="p-3 font-semibold">Item Name</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Sale Price</th>
                  <th className="p-3 font-semibold">Cost Price</th>
                  <th className="p-3 font-semibold">Stock Qty</th>
                  <th className="p-3 font-semibold">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8faff]">
                    <td className="p-3 font-bold text-[#6678c1]">
                      <div>{p.sku}</div>
                      {p.barcode && <div className="text-[10px] text-[#5b6472]">EAN: {p.barcode}</div>}
                    </td>
                    <td className="p-3 font-semibold text-[#1f2430]">{p.name}</td>
                    <td className="p-3 text-[#5b6472]">{p.type}</td>
                    <td className="p-3 font-bold text-[#1f2430]">${p.salePrice.toFixed(2)}</td>
                    <td className="p-3 text-[#5b6472]">${p.purchaseCost.toFixed(2)}</td>
                    <td className="p-3 font-bold text-emerald-600">{p.stockQty}</td>
                    <td className="p-3 text-[#5b6472]">{p.warehouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Projects & Client Timesheets</h2>
              <p className="text-xs text-[#5b6472]">Track client projects, project budgets, hourly billing rates, and hours logged</p>
            </div>
            <button onClick={() => setShowProjectModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Client Project
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projects.map((prj) => (
              <div key={prj.id} className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
                  <div>
                    <span className="font-bold text-[#1f2430] text-base">{prj.name}</span>
                    <p className="text-xs text-[#5b6472]">Client: <strong>{prj.customer}</strong></p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {prj.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#5b6472]">
                  <div>Budget: <strong className="text-[#1f2430]">${prj.budget.toLocaleString()}</strong></div>
                  <div>Hourly Rate: <strong>${prj.hourlyRate}/hr</strong></div>
                  <div>Hours Logged: <strong className="text-blue-600">{prj.hoursLogged} hrs</strong></div>
                  <div>Manager: <strong>{prj.manager}</strong></div>
                  <div>Start Date: {prj.startDate || "N/A"}</div>
                  <div>Target Due: {prj.dueDate}</div>
                </div>

                {prj.description && (
                  <div className="text-xs text-[#5b6472] bg-[#f8faff] p-2.5 rounded-xl border border-[#d9e2ef]">
                    {prj.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR & PAYROLL TAB */}
      {activeTab === "hr-payroll" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">HR, Employees & Payroll Audit</h2>
              <p className="text-xs text-[#5b6472]">Employee database, salary structures, tax deductions, and expense reimbursements</p>
            </div>
            <button onClick={() => setShowEmployeeModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Employee
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                <tr>
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Employee Name</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Department</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Monthly Salary</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f8faff]">
                    <td className="p-3 font-bold text-[#6678c1]">{emp.employeeCode}</td>
                    <td className="p-3 font-semibold text-[#1f2430]">{emp.name}</td>
                    <td className="p-3 text-[#5b6472]">{emp.role}</td>
                    <td className="p-3 text-[#5b6472]">{emp.department}</td>
                    <td className="p-3 text-[#5b6472]">{emp.employmentType}</td>
                    <td className="p-3 font-bold text-[#1f2430]">${emp.monthlySalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEDGER TAB */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">General Ledger & Chart of Accounts</h2>
              <p className="text-xs text-[#5b6472]">Double-entry general ledger, account trial balances, and financial classifications</p>
            </div>
            <button onClick={() => setShowLedgerModal(true)} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#404d85]">
              + Add Ledger Account
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
                <tr>
                  <th className="p-3 font-semibold">Account Code</th>
                  <th className="p-3 font-semibold">Account Name</th>
                  <th className="p-3 font-semibold">Classification Type</th>
                  <th className="p-3 font-semibold">Debit ($)</th>
                  <th className="p-3 font-semibold">Credit ($)</th>
                  <th className="p-3 font-semibold">Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9e2ef]">
                {chartOfAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-[#f8faff]">
                    <td className="p-3 font-bold text-[#6678c1]">{acc.code}</td>
                    <td className="p-3 font-semibold text-[#1f2430]">{acc.name}</td>
                    <td className="p-3 text-[#5b6472]">{acc.type}</td>
                    <td className="p-3 text-[#5b6472]">${acc.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-[#5b6472]">${acc.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 font-bold text-[#1f2430]">${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FINANCIAL REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[#1f2430]">Financial Reports & Statement Audits</h2>
              <p className="text-xs text-[#5b6472]">P&L Statement, Balance Sheet, Accounts Receivable Aging, and Tax Reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-[#1f2430] text-sm">Profit & Loss Statement</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span>Gross Operating Revenue</span>
                  <strong className="text-emerald-600">${totalRevenue.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Cost of Goods & Expenses</span>
                  <strong className="text-rose-500">${totalExpenses.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between font-bold pt-1 text-sm">
                  <span>Net Operating Income</span>
                  <span className="text-[#6678c1]">${netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-[#1f2430] text-sm">Balance Sheet Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span>Total Current Assets</span>
                  <strong className="text-[#1f2430]">${(totalBankBalance + 20650).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Total Liabilities (AP)</span>
                  <strong className="text-[#1f2430]">${totalExpenses.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between font-bold pt-1 text-sm">
                  <span>Owner's Equity</span>
                  <span className="text-emerald-600">${(totalBankBalance + 20650 - totalExpenses).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-[#1f2430] text-sm">Receivables Aging Audit</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span>Current (0 - 30 Days)</span>
                  <strong className="text-emerald-600">${invoices.filter(i => i.status === "pending").reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Overdue (31+ Days)</span>
                  <strong className="text-rose-500">${invoices.filter(i => i.status === "overdue").reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY PROFILE / SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f2430]">Company Profile & Accounting Defaults</h2>
            <p className="text-xs text-[#5b6472] mt-1">Configure company details, tax registration numbers, and invoicing preferences</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
                <div className="font-semibold text-[#5b6472]">Company Name</div>
                <div className="font-bold text-[#1f2430] text-sm mt-1">{orgProfile.name}</div>
              </div>
              <div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
                <div className="font-semibold text-[#5b6472]">Legal Entity Name</div>
                <div className="font-bold text-[#1f2430] text-sm mt-1">{orgProfile.legalName || orgProfile.name}</div>
              </div>
              <div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
                <div className="font-semibold text-[#5b6472]">Support Email</div>
                <div className="font-bold text-[#1f2430] text-sm mt-1">{orgProfile.supportEmail || "support@company.com"}</div>
              </div>
              <div className="rounded-xl border border-[#d9e2ef] p-4 bg-[#f8faff]">
                <div className="font-semibold text-[#5b6472]">Tax / VAT ID</div>
                <div className="font-bold text-[#1f2430] text-sm mt-1">{orgProfile.panNumber || "US-TAX-88912"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICE DETAIL MODAL */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1f2430]">{selectedInvoiceDetail.number}</h3>
                <p className="text-xs text-[#5b6472]">PO #: {selectedInvoiceDetail.poNumber || "N/A"} | Currency: {selectedInvoiceDetail.currency}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                selectedInvoiceDetail.status === "paid" ? "bg-emerald-100 text-emerald-800" : selectedInvoiceDetail.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
              }`}>
                {selectedInvoiceDetail.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#5b6472] block">Billed To:</span>
                <strong className="text-[#1f2430] block text-sm">{selectedInvoiceDetail.customer}</strong>
                <span className="text-[#5b6472] block">{selectedInvoiceDetail.customerEmail}</span>
                {selectedInvoiceDetail.customerTaxId && <span className="text-[#5b6472] block">Tax ID: {selectedInvoiceDetail.customerTaxId}</span>}
                <span className="text-[#5b6472] block mt-1">Billing Address: {selectedInvoiceDetail.customerAddress || "N/A"}</span>
                {selectedInvoiceDetail.shippingAddress && <span className="text-[#5b6472] block">Shipping Destination: {selectedInvoiceDetail.shippingAddress}</span>}
              </div>
              <div className="text-right space-y-1">
                <span className="text-[#5b6472] block">Issue Date: <strong>{selectedInvoiceDetail.issueDate}</strong></span>
                <span className="text-[#5b6472] block">Due Date: <strong>{selectedInvoiceDetail.dueDate}</strong></span>
                <span className="text-[#5b6472] block">Payment Terms: <strong>{selectedInvoiceDetail.paymentTerms}</strong></span>
                {selectedInvoiceDetail.remittanceBank && <span className="text-[#5b6472] block">Bank Remittance: <strong>{selectedInvoiceDetail.remittanceBank}</strong></span>}
              </div>
            </div>

            <div className="rounded-xl border border-[#d9e2ef] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faff] border-b border-[#d9e2ef] text-[#5b6472]">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Tax %</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9e2ef]">
                  {selectedInvoiceDetail.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-[#6678c1]">{item.sku || "N/A"}</td>
                      <td className="p-3 font-semibold text-[#1f2430]">{item.name}</td>
                      <td className="p-3 text-center text-[#5b6472]">{item.unitOfMeasure || "Units"}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                      <td className="p-3 text-right text-[#5b6472]">{item.tax}%</td>
                      <td className="p-3 text-right font-bold text-[#1f2430]">
                        ${((item.quantity * item.price) * (1 + item.tax / 100)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-xs space-y-1">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-[#5b6472]">
                  <span>Subtotal:</span>
                  <strong>${selectedInvoiceDetail.subtotal.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-[#5b6472]">
                  <span>Tax Total:</span>
                  <strong>${selectedInvoiceDetail.taxTotal.toFixed(2)}</strong>
                </div>
                {selectedInvoiceDetail.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <strong>-${selectedInvoiceDetail.discount.toFixed(2)}</strong>
                  </div>
                )}
                {selectedInvoiceDetail.shipping > 0 && (
                  <div className="flex justify-between text-[#5b6472]">
                    <span>Shipping & Handling:</span>
                    <strong>+${selectedInvoiceDetail.shipping.toFixed(2)}</strong>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#1f2430] border-t border-[#d9e2ef] pt-2">
                  <span>Grand Total Amount:</span>
                  <span className="text-[#6678c1]">${selectedInvoiceDetail.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {(selectedInvoiceDetail.notes || selectedInvoiceDetail.terms) && (
              <div className="grid grid-cols-2 gap-4 text-xs border-t border-[#d9e2ef] pt-4">
                {selectedInvoiceDetail.notes && (
                  <div className="bg-[#f8faff] p-3 rounded-xl border border-[#d9e2ef]">
                    <span className="font-bold text-[#1f2430] block">Notes to Customer:</span>
                    <p className="text-[#5b6472] mt-1">{selectedInvoiceDetail.notes}</p>
                  </div>
                )}
                {selectedInvoiceDetail.terms && (
                  <div className="bg-[#f8faff] p-3 rounded-xl border border-[#d9e2ef]">
                    <span className="font-bold text-[#1f2430] block">Terms & Conditions:</span>
                    <p className="text-[#5b6472] mt-1">{selectedInvoiceDetail.terms}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-[#d9e2ef] pt-4">
              <button onClick={() => setSelectedInvoiceDetail(null)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL WITH GLOBAL DATA AUTO-FILL SELECTORS */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
              <h3 className="text-lg font-bold text-[#1f2430]">Create New Sales Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-sm font-bold text-[#5b6472]">✕</button>
            </div>

            {/* Quick Select Customer Banner */}
            <div className="rounded-xl border border-[#6678c1]/30 bg-[#f8faff] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#6678c1]">⚡ Quick Auto-Fill from Saved Customer / CRM Profile:</label>
                <span className="text-[11px] font-medium text-[#5b6472]">{customers.length} Saved Records</span>
              </div>
              <select
                onChange={(e) => handleSelectCustomerToAutoFill(e.target.value)}
                className="w-full rounded-xl border border-[#6678c1]/40 bg-white p-2.5 text-xs font-bold text-[#1f2430] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6678c1]"
              >
                <option value="">-- Choose Existing Customer Profile to Auto-Fill All Form Fields --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    🏢 {c.name} ({c.email || "No email"}) {c.taxId ? `[Tax ID: ${c.taxId}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Invoice Number *</label>
                  <input type="text" value={invNumber} onChange={(e) => setInvNumber(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">PO / Order Ref Number</label>
                  <input type="text" placeholder="e.g. PO-9918" value={invPoNumber} onChange={(e) => setInvPoNumber(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Company Name *</label>
                  <input type="text" placeholder="e.g. Acme Enterprise" value={invCustomer} onChange={(e) => setInvCustomer(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs font-bold text-[#1f2430]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Email</label>
                  <input type="email" placeholder="billing@acme.com" value={invCustomerEmail} onChange={(e) => setInvCustomerEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Tax / VAT ID</label>
                  <input type="text" placeholder="US-TAX-88912" value={invCustomerTaxId} onChange={(e) => setInvCustomerTaxId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Billing Currency</label>
                  <select value={invCurrency} onChange={(e) => setInvCurrency(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs bg-white">
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="CAD ($)">CAD ($)</option>
                    <option value="AUD ($)">AUD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Issue Date</label>
                  <input type="date" value={invIssueDate} onChange={(e) => setInvIssueDate(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Due Date</label>
                  <input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Billing Address</label>
                  <input type="text" placeholder="100 Innovation Way, Austin, TX" value={invCustomerAddress} onChange={(e) => setInvCustomerAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Shipping / Destination Address</label>
                  <input type="text" placeholder="Building 4 Dock B, Austin, TX" value={invShippingAddress} onChange={(e) => setInvShippingAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              {/* Line Items with Product Catalog Select */}
              <div className="space-y-2 border-t border-b border-[#d9e2ef] py-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-[#1f2430]">Invoice Items & Product Line Items</h4>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const prodSku = e.target.value;
                        if (!prodSku) return;
                        const prod = products.find((p) => p.sku === prodSku);
                        if (prod) {
                          setInvItems((prev) => [
                            ...prev,
                            {
                              id: Date.now().toString(),
                              sku: prod.sku,
                              name: prod.name,
                              quantity: 1,
                              price: prod.salePrice,
                              tax: prod.taxRate,
                              unitOfMeasure: prod.type === "Service" ? "License" : "Units",
                            },
                          ]);
                        }
                      }}
                      className="rounded-xl border border-[#6678c1]/40 bg-[#f8faff] px-3 py-1.5 text-xs font-bold text-[#6678c1] shadow-sm"
                    >
                      <option value="">+ Add Product Item from Catalog...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.sku}>
                          📦 {p.name} (${p.salePrice.toFixed(2)}) — SKU: {p.sku}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddInvItemRow} className="text-xs font-bold text-[#6678c1] hover:underline">
                      + Add Custom Line Item
                    </button>
                  </div>
                </div>

                {invItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="SKU Code"
                      value={item.sku || ""}
                      onChange={(e) => handleInvItemChange(item.id, "sku", e.target.value)}
                      className="col-span-2 rounded-xl border border-[#d9e2ef] p-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Item Description *"
                      value={item.name}
                      onChange={(e) => handleInvItemChange(item.id, "name", e.target.value)}
                      className="col-span-4 rounded-xl border border-[#d9e2ef] p-2 text-xs font-semibold"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleInvItemChange(item.id, "quantity", parseFloat(e.target.value) || 1)}
                      className="col-span-2 rounded-xl border border-[#d9e2ef] p-2 text-xs text-center"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Price ($)"
                      value={item.price}
                      onChange={(e) => handleInvItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                      className="col-span-2 rounded-xl border border-[#d9e2ef] p-2 text-xs text-right font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Tax %"
                      value={item.tax}
                      onChange={(e) => handleInvItemChange(item.id, "tax", parseFloat(e.target.value) || 0)}
                      className="col-span-1 rounded-xl border border-[#d9e2ef] p-2 text-xs text-center"
                    />
                    <button type="button" onClick={() => handleRemoveInvItemRow(item.id)} className="col-span-1 text-center font-bold text-rose-500 hover:text-rose-700">✕</button>
                  </div>
                ))}
              </div>

              {/* Adjustments & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Customer Notes</label>
                    <textarea rows={2} value={invNotes} onChange={(e) => setInvNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5b6472]">Payment Terms & Remittance Instructions</label>
                    <textarea rows={2} value={invTerms} onChange={(e) => setInvTerms(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-[#f8faff] p-4 rounded-xl border border-[#d9e2ef]">
                  <div className="flex justify-between items-center">
                    <span>Subtotal:</span>
                    <strong>${invSubtotal.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax Total:</span>
                    <strong>${invTaxTotal.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Order Discount ($):</span>
                    <input type="number" value={invDiscount} onChange={(e) => setInvDiscount(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-[#d9e2ef] p-1 text-right text-xs" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping Fee ($):</span>
                    <input type="number" value={invShipping} onChange={(e) => setInvShipping(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-[#d9e2ef] p-1 text-right text-xs" />
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-[#1f2430] border-t border-[#d9e2ef] pt-2">
                    <span>Grand Total:</span>
                    <span className="text-[#6678c1] text-base">${invGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#404d85]">Save & Issue Sales Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Customer Profile</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Customer Company Name *</label>
                  <input type="text" placeholder="e.g. Acme Enterprise" value={custName} onChange={(e) => setCustName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Primary Contact Person</label>
                  <input type="text" placeholder="John Doe" value={custContactPerson} onChange={(e) => setCustContactPerson(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Primary Billing Email *</label>
                  <input type="email" placeholder="billing@acme.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Secondary Email</label>
                  <input type="email" placeholder="ap@acme.com" value={custSecondaryEmail} onChange={(e) => setCustSecondaryEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Office Phone Number</label>
                  <input type="text" placeholder="+1 (555) 019-2831" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Direct Mobile</label>
                  <input type="text" placeholder="+1 (555) 998-1122" value={custMobile} onChange={(e) => setCustMobile(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / VAT / GSTIN</label>
                  <input type="text" placeholder="US-TAX-88912" value={custTaxId} onChange={(e) => setCustTaxId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Credit Limit ($)</label>
                  <input type="number" value={custCreditLimit} onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#5b6472]">Street Address</label>
                  <input type="text" placeholder="100 Innovation Way" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">City</label>
                  <input type="text" placeholder="Austin" value={custCity} onChange={(e) => setCustCity(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">State / Province</label>
                  <input type="text" placeholder="TX" value={custState} onChange={(e) => setCustState(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Country</label>
                  <input type="text" value={custCountry} onChange={(e) => setCustCountry(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Zip / Pincode</label>
                  <input type="text" placeholder="78701" value={custPincode} onChange={(e) => setCustPincode(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Customer Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VENDOR MODAL */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Vendor Profile</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Company Name *</label>
                  <input type="text" placeholder="e.g. AWS Cloud Services" value={vendName} onChange={(e) => setVendName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Contact Person</label>
                  <input type="text" placeholder="Enterprise Accounts" value={vendContactPerson} onChange={(e) => setVendContactPerson(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Email</label>
                  <input type="email" placeholder="billing@aws.com" value={vendEmail} onChange={(e) => setVendEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Phone</label>
                  <input type="text" placeholder="+1 (800) 289-4357" value={vendPhone} onChange={(e) => setVendPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Expense Category</label>
                  <input type="text" placeholder="Infrastructure" value={vendCategory} onChange={(e) => setVendCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Tax ID / VAT / GSTIN</label>
                  <input type="text" placeholder="AWS-TAX-101" value={vendTaxId} onChange={(e) => setVendTaxId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bank Name for Remittance</label>
                  <input type="text" placeholder="JPMorgan Chase" value={vendBankName} onChange={(e) => setVendBankName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Bank Account / IBAN #</label>
                  <input type="text" placeholder="**** 4901" value={vendBankAccountNo} onChange={(e) => setVendBankAccountNo(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowVendorModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Vendor Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Record Vendor Bill / Expense</h3>

            {/* Quick Auto-Fill Vendor */}
            <div className="rounded-xl border border-[#6678c1]/30 bg-[#f8faff] p-3 space-y-1.5">
              <label className="text-xs font-bold text-[#6678c1]">⚡ Quick Auto-Fill from Saved Vendors:</label>
              <select
                onChange={(e) => handleSelectVendorToAutoFill(e.target.value)}
                className="w-full rounded-xl border border-[#6678c1]/40 bg-white p-2 text-xs font-bold text-[#1f2430] shadow-sm"
              >
                <option value="">-- Choose Existing Vendor Profile --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    🏬 {v.name} ({v.category}) — {v.email || "No email"}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleAddBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Name *</label>
                  <input type="text" value={billVendor} onChange={(e) => setBillVendor(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs font-bold text-[#1f2430]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Vendor Invoice #</label>
                  <input type="text" placeholder="INV-AWS-88712" value={billVendorInvoiceNo} onChange={(e) => setBillVendorInvoiceNo(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Expense Category</label>
                  <input type="text" value={billCategory} onChange={(e) => setBillCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Due Date</label>
                  <input type="date" value={billDueDate} onChange={(e) => setBillDueDate(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowBillModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BANK ACCOUNT MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Bank / Cash Account</h3>
            <form onSubmit={handleAddBank} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Display Name *</label>
                  <input type="text" placeholder="Operating Checking Account" value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Institution / Bank Name</label>
                  <input type="text" placeholder="Silicon Valley Bank" value={bankInstName} onChange={(e) => setBankInstName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Type</label>
                  <select value={bankAccType} onChange={(e) => setBankAccType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs bg-white">
                    <option value="Checking Bank Account">Checking Bank Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Stripe Gateway">Stripe Gateway</option>
                    <option value="PayPal Account">PayPal Account</option>
                    <option value="Cash Wallet">Cash Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Number / IBAN</label>
                  <input type="text" placeholder="**** 4821" value={bankAccNo} onChange={(e) => setBankAccNo(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Routing / Swift Code</label>
                  <input type="text" placeholder="121141821" value={bankRoutingNo} onChange={(e) => setBankRoutingNo(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Opening Balance ($)</label>
                  <input type="number" value={bankOpeningBal} onChange={(e) => setBankOpeningBal(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowBankModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Bank Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Product Item</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Product Name *</label>
                  <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">SKU Code</label>
                  <input type="text" placeholder="SKU-SAAS-PRO" value={prodSku} onChange={(e) => setProdSku(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Sale Price ($)</label>
                  <input type="number" value={prodSalePrice} onChange={(e) => setProdSalePrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Purchase Cost ($)</label>
                  <input type="number" value={prodPurchaseCost} onChange={(e) => setProdPurchaseCost(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Stock Quantity</label>
                  <input type="number" value={prodStockQty} onChange={(e) => setProdStockQty(parseInt(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Warehouse Location</label>
                  <input type="text" value={prodWarehouse} onChange={(e) => setProdWarehouse(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowProductModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Product Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add New Client Project</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Project Name *</label>
                  <input type="text" value={prjName} onChange={(e) => setPrjName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Client / Customer</label>
                  <input type="text" value={prjCustomer} onChange={(e) => setPrjCustomer(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Budget ($)</label>
                  <input type="number" value={prjBudget} onChange={(e) => setPrjBudget(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Hourly Billing Rate ($)</label>
                  <input type="number" value={prjHourlyRate} onChange={(e) => setPrjHourlyRate(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowProjectModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Employee Profile</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Full Name *</label>
                  <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Role / Designation</label>
                  <input type="text" value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Work Email</label>
                  <input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Monthly Base Salary ($)</label>
                  <input type="number" value={empSalary} onChange={(e) => setEmpSalary(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LEDGER ACCOUNT MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1f2430]">Add Chart of Accounts Ledger Entry</h3>
            <form onSubmit={handleAddLedgerAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Code *</label>
                  <input type="text" placeholder="e.g. 1050" value={ledgerCode} onChange={(e) => setLedgerCode(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Account Name *</label>
                  <input type="text" placeholder="e.g. Petty Cash" value={ledgerName} onChange={(e) => setLedgerName(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Classification Type</label>
                  <select value={ledgerType} onChange={(e) => setLedgerType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs bg-white">
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5b6472]">Opening Balance ($)</label>
                  <input type="number" value={ledgerDebit} onChange={(e) => setLedgerDebit(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
                <button type="button" onClick={() => setShowLedgerModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2 text-xs">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#404d85]">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AkauntingPage() {
  return (
    <WorkspaceShell>
      <Suspense
        fallback={
          <div className="flex h-[400px] w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6678c1] border-t-transparent" />
          </div>
        }
      >
        <AkauntingContent />
      </Suspense>
    </WorkspaceShell>
  );
}
