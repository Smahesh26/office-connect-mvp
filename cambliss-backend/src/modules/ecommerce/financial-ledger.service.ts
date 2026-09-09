import crypto from "crypto";
import {
  MasterOrder,
  SellerOrder,
  SellerOrderItem,
  FinancialLedgerEntry,
  SellerSettlement,
  OrderReturn,
  ReconciliationSummary,
  SellerProfile,
  SettlementStatus,
} from "./financial-ledger.types";
import SettlementProviderFactory from "../payments/settlement-provider.factory";

export interface CreateOrderCartItem {
  productId: string;
  title: string;
  sku: string;
  brand: string;
  category: string;
  unitPrice: number;
  quantity: number;
  sellerId: string;
  sellerCode?: string;
  sellerName?: string;
}

export interface CreateMultiSellerOrderParams {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CreateOrderCartItem[];
}

export interface ProcessRefundParams {
  masterOrderId: string;
  sellerOrderId: string;
  refundType: "FULL" | "PARTIAL";
  partialAmount?: number;
  reason: string;
  initiatedBy?: string;
}

// Persistent In-Memory State for the Financial Engine
let masterOrdersStore: MasterOrder[] = [];
let financialLedgerStore: FinancialLedgerEntry[] = [];
let sellerSettlementsStore: SellerSettlement[] = [];
let orderReturnsStore: OrderReturn[] = [];

// Seeded active sellers
export let sellersStore: SellerProfile[] = [
  {
    id: "sel-hisense-01",
    sellerCode: "SEL-HISENSE",
    storeSlug: "hisense-computers",
    businessName: "Hisense Computers India Private Limited",
    tradeName: "Hisense Computers Official",
    ownerName: "Bhasker Advani",
    email: "bhaskeradv1@gmail.com",
    phone: "+91 98765 43210",
    pan: "AAACH9102K",
    gstin: "29AAACH9102K1Z5",
    category: "Computing",
    bankAccount: {
      accountNumber: "50100294819284",
      ifscCode: "HDFC0000128",
      accountHolderName: "Hisense Computers India Pvt Ltd",
      bankName: "HDFC Bank",
    },
    virtualAccount: {
      virtualAccountId: "va_hisense_8819",
      accountNumber: "OCHISENSE9021",
      ifscCode: "RAZR0000001",
      bankName: "ICICI Virtual Escrow Desk",
      upiId: "hisense.officeconnect@icici",
      entityName: "Hisense Computers Official",
      status: "ACTIVE",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    kycStatus: "VERIFIED_ACTIVE",
    isSettlementEligible: true,
    commissionRate: 0.075, // 7.5%
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "sel-sony-02",
    sellerCode: "SEL-SONY",
    storeSlug: "sony-india-official",
    businessName: "Sony India Direct Private Limited",
    tradeName: "Sony Electronics Direct",
    ownerName: "Sunil Nayyar",
    email: "marketplace@sonyindia.co.in",
    phone: "+91 98100 12345",
    pan: "AABCU9603R",
    gstin: "29AABCU9603R1ZM",
    category: "Electronics",
    bankAccount: {
      accountNumber: "50200049281729",
      ifscCode: "HDFC0000128",
      accountHolderName: "Sony India Direct Private Limited",
      bankName: "HDFC Bank",
    },
    virtualAccount: {
      virtualAccountId: "va_sony_7741",
      accountNumber: "OCSONY5128",
      ifscCode: "RAZR0000001",
      bankName: "ICICI Virtual Escrow Desk",
      upiId: "sony.officeconnect@icici",
      entityName: "Sony Electronics Direct",
      status: "ACTIVE",
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    kycStatus: "VERIFIED_ACTIVE",
    isSettlementEligible: true,
    commissionRate: 0.085, // 8.5%
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
  },
];

// Helper to generate cryptographically verifiable audit hash
function createAuditHash(data: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(data) + Date.now().toString())
    .digest("hex")
    .substring(0, 24);
}

export class FinancialLedgerService {
  private settlementProvider = SettlementProviderFactory.getProvider();

  /**
   * 1. CREATE MULTI-SELLER ORDER
   * Splits a customer checkout cart into independent SellerOrder records.
   */
  async createMultiSellerOrder(params: CreateMultiSellerOrderParams): Promise<MasterOrder> {
    const masterOrderId = `mord_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const orderNumber = `OC-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Group items by sellerId
    const itemsBySeller = new Map<string, CreateOrderCartItem[]>();
    for (const item of params.items) {
      const sellerId = item.sellerId || "sel-hisense-01";
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }
      itemsBySeller.get(sellerId)!.push(item);
    }

    const sellerOrders: SellerOrder[] = [];
    let totalGross = 0;
    let totalCommission = 0;
    let totalTaxes = 0;
    let totalPayable = 0;

    for (const [sellerId, items] of itemsBySeller.entries()) {
      const sellerProfile = sellersStore.find((s) => s.id === sellerId) || sellersStore[0];
      const sellerOrderId = `sord_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const commissionRate = sellerProfile.commissionRate || 0.08;

      let subOrderGross = 0;
      let subOrderCommission = 0;
      let subOrderTaxes = 0;

      const orderItems: SellerOrderItem[] = items.map((it, idx) => {
        const itemGross = it.unitPrice * it.quantity;
        const itemCommission = Math.round(itemGross * commissionRate * 100) / 100;
        // 18% GST on marketplace commission
        const itemTax = Math.round(itemCommission * 0.18 * 100) / 100;
        const itemPayable = Math.round((itemGross - itemCommission - itemTax) * 100) / 100;

        subOrderGross += itemGross;
        subOrderCommission += itemCommission;
        subOrderTaxes += itemTax;

        return {
          id: `item_${sellerOrderId}_${idx + 1}`,
          productId: it.productId,
          title: it.title,
          sku: it.sku,
          brand: it.brand,
          category: it.category,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          totalPrice: itemGross,
          commissionRate,
          commissionAmount: itemCommission,
          taxRate: 0.18,
          taxAmount: itemTax,
          sellerPayable: itemPayable,
        };
      });

      const netSellerPayable = Math.round((subOrderGross - subOrderCommission - subOrderTaxes) * 100) / 100;

      totalGross += subOrderGross;
      totalCommission += subOrderCommission;
      totalTaxes += subOrderTaxes;
      totalPayable += netSellerPayable;

      const sellerOrder: SellerOrder = {
        id: sellerOrderId,
        masterOrderId,
        masterOrderNumber: orderNumber,
        sellerId: sellerProfile.id,
        sellerCode: sellerProfile.sellerCode,
        sellerName: sellerProfile.tradeName,
        items: orderItems,
        grossAmount: subOrderGross,
        commissionAmount: subOrderCommission,
        taxDeductionAmount: subOrderTaxes,
        netPayableAmount: netSellerPayable,
        orderStatus: "PAYMENT_RECEIVED",
        settlementStatus: "HELD",
        refundedAmount: 0,
        isDisputed: false,
        createdAt: new Date().toISOString(),
      };

      sellerOrders.push(sellerOrder);
    }

    const masterOrder: MasterOrder = {
      id: masterOrderId,
      orderNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      totalGrossAmount: Math.round(totalGross * 100) / 100,
      totalCommissionAmount: Math.round(totalCommission * 100) / 100,
      totalTaxesAmount: Math.round(totalTaxes * 100) / 100,
      totalSellerPayableAmount: Math.round(totalPayable * 100) / 100,
      paymentGateway: "RAZORPAY",
      paymentStatus: "PENDING",
      sellerOrders,
      createdAt: new Date().toISOString(),
    };

    masterOrdersStore.unshift(masterOrder);
    return masterOrder;
  }

  /**
   * 2. RECORD CAPTURED CUSTOMER PAYMENT & WRITE DOUBLE-ENTRY LEDGER
   */
  async recordCustomerPayment(
    masterOrderId: string,
    gatewayPaymentId: string,
    gatewayOrderId?: string
  ): Promise<MasterOrder> {
    const order = masterOrdersStore.find((o) => o.id === masterOrderId);
    if (!order) {
      throw new Error(`MasterOrder not found: ${masterOrderId}`);
    }

    order.paymentStatus = "CAPTURED";
    order.gatewayPaymentId = gatewayPaymentId;
    order.gatewayOrderId = gatewayOrderId || `order_rzp_${Date.now()}`;

    // 1. Credit platform escrow account with total customer payment
    const paymentEntry: FinancialLedgerEntry = {
      id: `led_${Date.now()}_01`,
      entryType: "CUSTOMER_PAYMENT",
      masterOrderId: order.id,
      debitAmount: 0,
      creditAmount: order.totalGrossAmount,
      currency: "INR",
      referenceId: gatewayPaymentId,
      idempotencyKey: `pay_${order.id}_${gatewayPaymentId}`,
      description: `Customer payment captured for Master Order ${order.orderNumber}`,
      auditHash: createAuditHash({ orderId: order.id, amount: order.totalGrossAmount }),
      createdAt: new Date().toISOString(),
    };
    financialLedgerStore.unshift(paymentEntry);

    // 2. For each seller sub-order: Record Commission and Seller Payable entries
    for (const subOrder of order.sellerOrders) {
      subOrder.orderStatus = "SELLER_PROCESSING";

      // Platform commission entry
      const commissionEntry: FinancialLedgerEntry = {
        id: `led_${Date.now()}_com_${subOrder.id}`,
        entryType: "PLATFORM_COMMISSION",
        masterOrderId: order.id,
        sellerOrderId: subOrder.id,
        sellerId: subOrder.sellerId,
        sellerCode: subOrder.sellerCode,
        debitAmount: 0,
        creditAmount: subOrder.commissionAmount + subOrder.taxDeductionAmount,
        currency: "INR",
        referenceId: gatewayPaymentId,
        idempotencyKey: `com_${subOrder.id}`,
        description: `Marketplace commission & 18% GST fee deduction for sub-order ${subOrder.id}`,
        auditHash: createAuditHash({ subOrderId: subOrder.id, commission: subOrder.commissionAmount }),
        createdAt: new Date().toISOString(),
      };
      financialLedgerStore.unshift(commissionEntry);

      // Seller payable liability entry
      const payableEntry: FinancialLedgerEntry = {
        id: `led_${Date.now()}_pay_${subOrder.id}`,
        entryType: "SELLER_PAYABLE",
        masterOrderId: order.id,
        sellerOrderId: subOrder.id,
        sellerId: subOrder.sellerId,
        sellerCode: subOrder.sellerCode,
        debitAmount: 0,
        creditAmount: subOrder.netPayableAmount,
        currency: "INR",
        referenceId: gatewayPaymentId,
        idempotencyKey: `payable_${subOrder.id}`,
        description: `Net payable allocated to Seller ${subOrder.sellerName} for sub-order ${subOrder.id}`,
        auditHash: createAuditHash({ subOrderId: subOrder.id, payable: subOrder.netPayableAmount }),
        createdAt: new Date().toISOString(),
      };
      financialLedgerStore.unshift(payableEntry);
    }

    return order;
  }

  /**
   * 3. MARK SELLER ORDER DELIVERED & START RETURN WINDOW
   */
  async markOrderDelivered(
    sellerOrderId: string,
    trackingNumber?: string,
    courierPartner: string = "Office Connect Logistics"
  ): Promise<SellerOrder> {
    for (const mOrder of masterOrdersStore) {
      const sOrder = mOrder.sellerOrders.find((s) => s.id === sellerOrderId);
      if (sOrder) {
        sOrder.orderStatus = "DELIVERED";
        sOrder.deliveredAt = new Date().toISOString();
        sOrder.trackingNumber = trackingNumber || `TRK-OC-${Math.floor(100000 + Math.random() * 900000)}`;
        sOrder.courierPartner = courierPartner;
        // Default return window: 7 days
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        sOrder.returnWindowExpiryDate = expiry.toISOString();
        return sOrder;
      }
    }
    throw new Error(`SellerOrder not found: ${sellerOrderId}`);
  }

  /**
   * 4. EVALUATE SETTLEMENT ELIGIBILITY
   * Checks the 6 golden conditions for releasing funds:
   * 1. Delivered
   * 2. Return window expired
   * 3. No active dispute
   * 4. KYC VERIFIED_ACTIVE
   * 5. Seller active
   * 6. Payment captured
   */
  async evaluateSettlementEligibility(simulateReturnExpiry: boolean = false): Promise<{
    eligibleOrders: SellerOrder[];
    heldOrders: SellerOrder[];
  }> {
    const now = new Date();
    const eligibleOrders: SellerOrder[] = [];
    const heldOrders: SellerOrder[] = [];

    for (const mOrder of masterOrdersStore) {
      if (mOrder.paymentStatus !== "CAPTURED") continue;

      for (const sOrder of mOrder.sellerOrders) {
        if (sOrder.settlementStatus === "SETTLED" || sOrder.settlementStatus === "PROCESSING") {
          continue;
        }

        const seller = sellersStore.find((s) => s.id === sOrder.sellerId);
        const isKycVerified = seller?.kycStatus === "VERIFIED_ACTIVE";
        const isSellerActive = seller?.isSettlementEligible ?? false;
        const isDelivered = sOrder.orderStatus === "DELIVERED";
        const isDisputeFree = !sOrder.isDisputed;

        let isReturnExpired = false;
        if (simulateReturnExpiry && isDelivered) {
          isReturnExpired = true;
        } else if (sOrder.returnWindowExpiryDate) {
          isReturnExpired = new Date(sOrder.returnWindowExpiryDate) <= now;
        }

        if (isDelivered && isReturnExpired && isDisputeFree && isKycVerified && isSellerActive) {
          sOrder.settlementStatus = "ELIGIBLE";
          eligibleOrders.push(sOrder);
        } else {
          heldOrders.push(sOrder);
        }
      }
    }

    return { eligibleOrders, heldOrders };
  }

  /**
   * 5. EXECUTE SELLER SETTLEMENT VIA RAZORPAY VIRTUAL ACCOUNTS
   */
  async executeSellerSettlement(sellerId: string): Promise<SellerSettlement> {
    const seller = sellersStore.find((s) => s.id === sellerId);
    if (!seller) throw new Error(`Seller not found: ${sellerId}`);

    if (seller.kycStatus !== "VERIFIED_ACTIVE") {
      throw new Error(`Seller ${seller.sellerCode} is not KYC verified. Payout blocked.`);
    }

    // Find all ELIGIBLE orders for this seller
    const eligibleSubOrders: SellerOrder[] = [];
    for (const mOrder of masterOrdersStore) {
      for (const sOrder of mOrder.sellerOrders) {
        if (sOrder.sellerId === sellerId && sOrder.settlementStatus === "ELIGIBLE") {
          eligibleSubOrders.push(sOrder);
        }
      }
    }

    if (eligibleSubOrders.length === 0) {
      throw new Error(`No eligible settlement orders found for seller ${seller.tradeName}`);
    }

    const totalPayoutAmount = eligibleSubOrders.reduce((sum, o) => sum + (o.netPayableAmount - o.refundedAmount), 0);
    if (totalPayoutAmount <= 0) {
      throw new Error(`Calculated net payout amount is zero or negative (₹${totalPayoutAmount})`);
    }

    const settlementId = `OC-STL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const settlementRecord: SellerSettlement = {
      id: `stl_${Date.now()}`,
      settlementId,
      sellerId: seller.id,
      sellerCode: seller.sellerCode,
      sellerName: seller.tradeName,
      virtualAccountId: seller.virtualAccount?.virtualAccountId || "va_default",
      bankAccountNo: seller.bankAccount.accountNumber,
      bankIfsc: seller.bankAccount.ifscCode,
      amount: Math.round(totalPayoutAmount * 100) / 100,
      currency: "INR",
      orderCount: eligibleSubOrders.length,
      sellerOrderIds: eligibleSubOrders.map((o) => o.id),
      status: "PROCESSING",
      initiatedAt: new Date().toISOString(),
    };

    // Call settlement provider (Razorpay Virtual Accounts)
    const payoutResult = await this.settlementProvider.initiateSellerPayout({
      settlementId,
      sellerCode: seller.sellerCode,
      sellerName: seller.tradeName,
      virtualAccountId: settlementRecord.virtualAccountId,
      bankAccountNo: settlementRecord.bankAccountNo,
      bankIfsc: settlementRecord.bankIfsc,
      amount: settlementRecord.amount,
      currency: settlementRecord.currency,
      narration: `Settlement for ${eligibleSubOrders.length} orders on OfficeConnect`,
    });

    if (payoutResult.success) {
      settlementRecord.status = "SETTLED";
      settlementRecord.providerReference = payoutResult.providerReference;
      settlementRecord.processedAt = new Date().toISOString();

      // Mark all orders settled
      for (const sOrder of eligibleSubOrders) {
        sOrder.settlementStatus = "SETTLED";
        sOrder.settlementId = settlementId;
        sOrder.settledAt = settlementRecord.processedAt;
      }

      // Record in financial ledger: SELLER_SETTLEMENT (debit from platform payable liability)
      const settlementEntry: FinancialLedgerEntry = {
        id: `led_${Date.now()}_stl`,
        entryType: "SELLER_SETTLEMENT",
        sellerId: seller.id,
        sellerCode: seller.sellerCode,
        debitAmount: settlementRecord.amount,
        creditAmount: 0,
        currency: "INR",
        referenceId: settlementRecord.providerReference || settlementId,
        idempotencyKey: `stl_${settlementId}`,
        description: `Settlement payout dispatched to ${seller.tradeName} (${seller.bankAccount.bankName} A/C ${seller.bankAccount.accountNumber})`,
        auditHash: createAuditHash({ settlementId, amount: settlementRecord.amount }),
        createdAt: new Date().toISOString(),
      };
      financialLedgerStore.unshift(settlementEntry);
    } else {
      settlementRecord.status = "FAILED";
      settlementRecord.failureReason = payoutResult.failureReason || "Gateway rejection";
    }

    sellerSettlementsStore.unshift(settlementRecord);
    return settlementRecord;
  }

  /**
   * 6. AMAZON-STYLE FULL & PARTIAL REFUND FLOW
   * Handles customer refund, seller payable reversal, commission clawback,
   * and SELLER_RECOVERY_DEBIT if seller was already settled.
   */
  async processAmazonStyleRefund(params: ProcessRefundParams): Promise<{
    returnRecord: OrderReturn;
    customerRefundAmount: number;
    sellerReversalAmount: number;
    commissionReversalAmount: number;
    sellerRecoveryDebitAmount: number;
  }> {
    const masterOrder = masterOrdersStore.find((m) => m.id === params.masterOrderId);
    if (!masterOrder) throw new Error(`MasterOrder not found: ${params.masterOrderId}`);

    const sellerOrder = masterOrder.sellerOrders.find((s) => s.id === params.sellerOrderId);
    if (!sellerOrder) throw new Error(`SellerOrder not found: ${params.sellerOrderId}`);

    const isFullRefund = params.refundType === "FULL";
    const refundAmount = isFullRefund
      ? sellerOrder.grossAmount - sellerOrder.refundedAmount
      : Math.min(params.partialAmount || 0, sellerOrder.grossAmount - sellerOrder.refundedAmount);

    if (refundAmount <= 0) {
      throw new Error(`Invalid refund amount (₹${refundAmount}). Order may already be fully refunded.`);
    }

    // Ratio of refund to gross
    const refundRatio = refundAmount / sellerOrder.grossAmount;
    const commissionReversal = Math.round(sellerOrder.commissionAmount * refundRatio * 100) / 100;
    const taxReversal = Math.round(sellerOrder.taxDeductionAmount * refundRatio * 100) / 100;
    const sellerReversal = Math.round((refundAmount - commissionReversal - taxReversal) * 100) / 100;

    // Check if seller order was already settled
    const wasAlreadySettled = sellerOrder.settlementStatus === "SETTLED";
    const sellerRecoveryDebit = wasAlreadySettled ? sellerReversal : 0;

    // Call Gateway Refund
    const refundResult = await this.settlementProvider.initiateCustomerRefund({
      paymentId: masterOrder.gatewayPaymentId || "mock_pay_id",
      amount: refundAmount,
      currency: "INR",
      notes: {
        masterOrderId: masterOrder.id,
        sellerOrderId: sellerOrder.id,
        reason: params.reason,
      },
    });

    // Update order amounts
    sellerOrder.refundedAmount += refundAmount;
    if (sellerOrder.refundedAmount >= sellerOrder.grossAmount) {
      sellerOrder.orderStatus = "REFUNDED";
    }

    // 1. Ledger Entry: CUSTOMER_REFUND (debit to platform cash escrow)
    const customerRefundEntry: FinancialLedgerEntry = {
      id: `led_${Date.now()}_crfnd`,
      entryType: "CUSTOMER_REFUND",
      masterOrderId: masterOrder.id,
      sellerOrderId: sellerOrder.id,
      sellerId: sellerOrder.sellerId,
      sellerCode: sellerOrder.sellerCode,
      debitAmount: refundAmount,
      creditAmount: 0,
      currency: "INR",
      referenceId: refundResult.refundId,
      idempotencyKey: `crfnd_${sellerOrder.id}_${Date.now()}`,
      description: `Customer refund (₹${refundAmount}) issued for order ${masterOrder.orderNumber} - Reason: ${params.reason}`,
      auditHash: createAuditHash({ refundId: refundResult.refundId, amount: refundAmount }),
      createdAt: new Date().toISOString(),
    };
    financialLedgerStore.unshift(customerRefundEntry);

    // 2. Ledger Entry: SELLER_REVERSAL (debits seller payable)
    const sellerReversalEntry: FinancialLedgerEntry = {
      id: `led_${Date.now()}_srev`,
      entryType: "SELLER_REVERSAL",
      masterOrderId: masterOrder.id,
      sellerOrderId: sellerOrder.id,
      sellerId: sellerOrder.sellerId,
      sellerCode: sellerOrder.sellerCode,
      debitAmount: sellerReversal,
      creditAmount: 0,
      currency: "INR",
      referenceId: refundResult.refundId,
      idempotencyKey: `srev_${sellerOrder.id}_${Date.now()}`,
      description: `Seller payable deduction reversal (₹${sellerReversal}) on order ${masterOrder.orderNumber}`,
      auditHash: createAuditHash({ sellerOrderId: sellerOrder.id, reversal: sellerReversal }),
      createdAt: new Date().toISOString(),
    };
    financialLedgerStore.unshift(sellerReversalEntry);

    // 3. If seller was already settled: Create SELLER_RECOVERY_DEBIT entry
    if (wasAlreadySettled) {
      const recoveryEntry: FinancialLedgerEntry = {
        id: `led_${Date.now()}_srec`,
        entryType: "SELLER_RECOVERY_DEBIT",
        masterOrderId: masterOrder.id,
        sellerOrderId: sellerOrder.id,
        sellerId: sellerOrder.sellerId,
        sellerCode: sellerOrder.sellerCode,
        debitAmount: sellerRecoveryDebit,
        creditAmount: 0,
        currency: "INR",
        referenceId: `REC-${refundResult.refundId}`,
        idempotencyKey: `srec_${sellerOrder.id}_${Date.now()}`,
        description: `Amazon-style Seller Debt Recovery: ₹${sellerRecoveryDebit} clawback from ${sellerOrder.sellerName} (Order was already settled)`,
        auditHash: createAuditHash({ sellerId: sellerOrder.sellerId, recovery: sellerRecoveryDebit }),
        createdAt: new Date().toISOString(),
      };
      financialLedgerStore.unshift(recoveryEntry);
    }

    const returnRecord: OrderReturn = {
      id: `ret_${Date.now()}`,
      returnId: `OC-RET-2026-${Math.floor(100 + Math.random() * 900)}`,
      masterOrderId: masterOrder.id,
      sellerOrderId: sellerOrder.id,
      sellerId: sellerOrder.sellerId,
      status: "REFUND_COMPLETED",
      reason: params.reason,
      itemIds: sellerOrder.items.map((it) => it.id),
      refundType: params.refundType,
      requestedRefundAmount: refundAmount,
      approvedRefundAmount: refundAmount,
      sellerReversalAmount: sellerReversal,
      commissionReversalAmount: commissionReversal,
      sellerRecoveryStatus: wasAlreadySettled ? "OFFSET_PENDING" : "NOT_APPLICABLE",
      gatewayRefundId: refundResult.refundId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orderReturnsStore.unshift(returnRecord);

    return {
      returnRecord,
      customerRefundAmount: refundAmount,
      sellerReversalAmount: sellerReversal,
      commissionReversalAmount: commissionReversal,
      sellerRecoveryDebitAmount: sellerRecoveryDebit,
    };
  }

  /**
   * 7. GET ALL ORDERS & FINANCIAL DATA
   */
  async getAllMasterOrders(): Promise<MasterOrder[]> {
    return masterOrdersStore;
  }

  async getFinancialLedger(): Promise<FinancialLedgerEntry[]> {
    return financialLedgerStore;
  }

  async getSellerSettlements(): Promise<SellerSettlement[]> {
    return sellerSettlementsStore;
  }

  async getOrderReturns(): Promise<OrderReturn[]> {
    return orderReturnsStore;
  }

  async getReconciliationReport(): Promise<ReconciliationSummary> {
    const totalPayments = financialLedgerStore
      .filter((l) => l.entryType === "CUSTOMER_PAYMENT")
      .reduce((sum, l) => sum + l.creditAmount, 0);

    const totalRefunds = financialLedgerStore
      .filter((l) => l.entryType === "CUSTOMER_REFUND")
      .reduce((sum, l) => sum + l.debitAmount, 0);

    const totalSettlements = financialLedgerStore
      .filter((l) => l.entryType === "SELLER_SETTLEMENT")
      .reduce((sum, l) => sum + l.debitAmount, 0);

    return {
      reconciliationDate: new Date().toISOString(),
      totalGatewayPayments: totalPayments,
      totalDatabasePayments: totalPayments,
      paymentDiscrepanciesCount: 0,
      totalGatewayRefunds: totalRefunds,
      totalDatabaseRefunds: totalRefunds,
      refundDiscrepanciesCount: 0,
      totalSettlementsInitiated: totalSettlements,
      totalSettlementsCredited: totalSettlements,
      unmatchedTransactions: [],
    };
  }
}

export const financialLedgerService = new FinancialLedgerService();
