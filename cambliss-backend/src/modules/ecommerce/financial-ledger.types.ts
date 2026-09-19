/**
 * Financial Ledger & Multi-Vendor Marketplace Types
 * Designed for Amazon-style multi-seller order splitting, immutable double-entry ledger,
 * Razorpay Virtual Account settlements, and AI-assisted seller verification.
 */

export type KycStatus =
  | "KYC_PENDING"
  | "AI_DATA_COLLECTED"
  | "MANUAL_REVIEW"
  | "VERIFIED_ACTIVE"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED"
  | "SUSPENDED";

export type SellerOrderStatus =
  | "PAYMENT_RECEIVED"
  | "ORDER_CONFIRMED"
  | "SELLER_PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURN_REQUESTED"
  | "REFUNDED"
  | "CANCELLED";

export type SettlementStatus =
  | "HELD"               // Return window active or conditions not yet met
  | "ELIGIBLE"           // All 6 conditions met, awaiting payout dispatch
  | "PROCESSING"         // Payout instruction sent to gateway
  | "SETTLED"            // Credited to seller bank via Virtual Account
  | "FAILED"             // Payout failed at gateway
  | "REVERSED";          // Reversal/clawback applied

export type LedgerEntryType =
  | "CUSTOMER_PAYMENT"        // Customer payment captured by marketplace gateway
  | "PLATFORM_COMMISSION"     // Marketplace take-rate cut
  | "SELLER_PAYABLE"          // Net amount owed to seller (Gross - Commission - Taxes)
  | "SELLER_SETTLEMENT"       // Payout released to seller via Razorpay Virtual Account
  | "CUSTOMER_REFUND"         // Money refunded to customer
  | "SELLER_REVERSAL"         // Deduction from seller payable due to return/refund
  | "SELLER_RECOVERY_DEBIT"   // Debt entry if refund happens after seller was settled
  | "TAX_TCS_DEDUCTION";      // 1% TCS / GST withholding

export type ReturnWorkflowStatus =
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "PRODUCT_PICKED_UP"
  | "PRODUCT_RECEIVED"
  | "RETURN_ACCEPTED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "REFUND_FAILED";

export interface RazorpayVirtualAccountInfo {
  virtualAccountId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
  entityName: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  sellerCode: string;           // e.g. "SEL-MERCHANT-01"
  storeSlug: string;            // e.g. "my-store"
  businessName: string;
  tradeName: string;
  ownerName: string;
  email: string;
  phone: string;
  pan: string;
  gstin: string;
  category: string;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  virtualAccount?: RazorpayVirtualAccountInfo;
  kycStatus: KycStatus;
  isSettlementEligible: boolean;
  commissionRate: number;       // e.g. 0.08 (8%)
  createdAt: string;
  updatedAt: string;
}

export interface AiCollectedVerificationData {
  gstinVerified: boolean;
  gstinTradeName: string;
  gstinStateCode: string;
  panChecksumValid: boolean;
  mcaRegisteredEntity?: string;
  pincodeServiceable: boolean;
  domainRegistrationDate?: string;
  scrapedCatalogMatchScore: number; // 0 - 100
  flaggedMismatches: string[];
  confidenceScore: number;          // 0 - 100
  collectedAt: string;
}

export interface SellerKycDossier {
  sellerId: string;
  sellerCode: string;
  submittedInfo: {
    businessName: string;
    tradeName: string;
    ownerName: string;
    email: string;
    phone: string;
    pan: string;
    gstin: string;
    warehouseAddress: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  submittedDocuments: {
    panDocUrl?: string;
    gstDocUrl?: string;
    bankChequeUrl?: string;
    photoIdUrl?: string;
  };
  aiCollectedData?: AiCollectedVerificationData;
  checklist: {
    panMatchesLegalName: boolean;
    gstinActiveOnPortal: boolean;
    bankPennyDropSuccess: boolean;
    videoKycDone: boolean;
    warehousePinServiceable: boolean;
  };
  kycStatus: KycStatus;
  reviewerName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  resubmissionNotes?: string;
  auditTrail: {
    action: string;
    by: string;
    timestamp: string;
    notes?: string;
  }[];
}

export interface MasterOrder {
  id: string;
  orderNumber: string;           // e.g. "OC-ORD-2026-9042"
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalGrossAmount: number;     // Sum of all seller sub-orders
  totalCommissionAmount: number;
  totalTaxesAmount: number;
  totalSellerPayableAmount: number;
  paymentGateway: "RAZORPAY" | "MOCK";
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  paymentStatus: "PENDING" | "CAPTURED" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
  sellerOrders: SellerOrder[];
  createdAt: string;
}

export interface SellerOrderItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  brand: string;
  category: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  commissionRate: number;
  commissionAmount: number;
  taxRate: number;              // 18% GST on commission / fees
  taxAmount: number;
  sellerPayable: number;
}

export interface SellerOrder {
  id: string;
  masterOrderId: string;
  masterOrderNumber: string;
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  items: SellerOrderItem[];
  grossAmount: number;
  commissionAmount: number;
  taxDeductionAmount: number;
  netPayableAmount: number;
  orderStatus: SellerOrderStatus;
  settlementStatus: SettlementStatus;
  settlementId?: string;
  settledAt?: string;
  deliveredAt?: string;
  returnWindowExpiryDate?: string;
  refundedAmount: number;
  isDisputed: boolean;
  trackingNumber?: string;
  courierPartner?: string;
  createdAt: string;
}

export interface FinancialLedgerEntry {
  id: string;
  entryType: LedgerEntryType;
  masterOrderId?: string;
  sellerOrderId?: string;
  sellerId?: string;
  sellerCode?: string;
  debitAmount: number;          // Outflow / deduction
  creditAmount: number;         // Inflow / credit
  currency: string;             // "INR"
  referenceId: string;          // e.g. Razorpay Payment ID or Settlement ID
  idempotencyKey: string;
  description: string;
  auditHash: string;
  createdAt: string;
}

export interface SellerSettlement {
  id: string;
  settlementId: string;         // e.g. "OC-STL-2026-0012"
  sellerId: string;
  sellerCode: string;
  sellerName: string;
  virtualAccountId: string;
  bankAccountNo: string;
  bankIfsc: string;
  amount: number;
  currency: string;
  orderCount: number;
  sellerOrderIds: string[];
  status: SettlementStatus;
  providerReference?: string;   // Razorpay Payout/Transfer ID
  initiatedAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface OrderReturn {
  id: string;
  returnId: string;             // e.g. "OC-RET-2026-441"
  masterOrderId: string;
  sellerOrderId: string;
  sellerId: string;
  status: ReturnWorkflowStatus;
  reason: string;
  itemIds: string[];
  refundType: "FULL" | "PARTIAL";
  requestedRefundAmount: number;
  approvedRefundAmount?: number;
  sellerReversalAmount?: number;
  commissionReversalAmount?: number;
  sellerRecoveryStatus?: "NOT_APPLICABLE" | "OFFSET_PENDING" | "RECOVERED";
  gatewayRefundId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationSummary {
  reconciliationDate: string;
  totalGatewayPayments: number;
  totalDatabasePayments: number;
  paymentDiscrepanciesCount: number;
  totalGatewayRefunds: number;
  totalDatabaseRefunds: number;
  refundDiscrepanciesCount: number;
  totalSettlementsInitiated: number;
  totalSettlementsCredited: number;
  unmatchedTransactions: {
    id: string;
    type: "PAYMENT" | "REFUND" | "SETTLEMENT";
    expectedAmount: number;
    gatewayAmount: number;
    reason: string;
  }[];
}
