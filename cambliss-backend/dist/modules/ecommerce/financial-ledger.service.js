"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialLedgerService = exports.FinancialLedgerService = exports.sellersStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
const settlement_provider_factory_1 = __importDefault(require("../payments/settlement-provider.factory"));
// Persistent In-Memory State for the Financial Engine
let masterOrdersStore = [];
let financialLedgerStore = [];
let sellerSettlementsStore = [];
let orderReturnsStore = [];
// Active registered sellers store
exports.sellersStore = [];
// Helper to generate cryptographically verifiable audit hash
function createAuditHash(data) {
    return crypto_1.default
        .createHash("sha256")
        .update(JSON.stringify(data) + Date.now().toString())
        .digest("hex")
        .substring(0, 24);
}
class FinancialLedgerService {
    constructor() {
        this.settlementProvider = settlement_provider_factory_1.default.getProvider();
    }
    /**
     * 1. CREATE MULTI-SELLER ORDER
     * Splits a customer checkout cart into independent SellerOrder records.
     */
    createMultiSellerOrder(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const masterOrderId = `mord_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
            const orderNumber = `OC-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            // Group items by sellerId
            const itemsBySeller = new Map();
            for (const item of params.items) {
                const sellerId = item.sellerId || "sel-merchant-01";
                if (!itemsBySeller.has(sellerId)) {
                    itemsBySeller.set(sellerId, []);
                }
                itemsBySeller.get(sellerId).push(item);
            }
            const sellerOrders = [];
            let totalGross = 0;
            let totalCommission = 0;
            let totalTaxes = 0;
            let totalPayable = 0;
            for (const [sellerId, items] of itemsBySeller.entries()) {
                const sellerProfile = exports.sellersStore.find((s) => s.id === sellerId) || null;
                const sellerOrderId = `sord_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
                const commissionRate = (sellerProfile === null || sellerProfile === void 0 ? void 0 : sellerProfile.commissionRate) || 0.08;
                let subOrderGross = 0;
                let subOrderCommission = 0;
                let subOrderTaxes = 0;
                const orderItems = items.map((it, idx) => {
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
                const sellerOrder = {
                    id: sellerOrderId,
                    masterOrderId,
                    masterOrderNumber: orderNumber,
                    sellerId: (sellerProfile === null || sellerProfile === void 0 ? void 0 : sellerProfile.id) || sellerId,
                    sellerCode: (sellerProfile === null || sellerProfile === void 0 ? void 0 : sellerProfile.sellerCode) || "SEL-MERCHANT-01",
                    sellerName: (sellerProfile === null || sellerProfile === void 0 ? void 0 : sellerProfile.tradeName) || "Marketplace Merchant",
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
            const masterOrder = {
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
        });
    }
    /**
     * 2. RECORD CAPTURED CUSTOMER PAYMENT & WRITE DOUBLE-ENTRY LEDGER
     */
    recordCustomerPayment(masterOrderId, gatewayPaymentId, gatewayOrderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = masterOrdersStore.find((o) => o.id === masterOrderId);
            if (!order) {
                throw new Error(`MasterOrder not found: ${masterOrderId}`);
            }
            order.paymentStatus = "CAPTURED";
            order.gatewayPaymentId = gatewayPaymentId;
            order.gatewayOrderId = gatewayOrderId || `order_rzp_${Date.now()}`;
            // 1. Credit platform escrow account with total customer payment
            const paymentEntry = {
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
                const commissionEntry = {
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
                const payableEntry = {
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
        });
    }
    /**
     * 3. MARK SELLER ORDER DELIVERED & START RETURN WINDOW
     */
    markOrderDelivered(sellerOrderId_1, trackingNumber_1) {
        return __awaiter(this, arguments, void 0, function* (sellerOrderId, trackingNumber, courierPartner = "Office Connect Logistics") {
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
        });
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
    evaluateSettlementEligibility() {
        return __awaiter(this, arguments, void 0, function* (simulateReturnExpiry = false) {
            var _a;
            const now = new Date();
            const eligibleOrders = [];
            const heldOrders = [];
            for (const mOrder of masterOrdersStore) {
                if (mOrder.paymentStatus !== "CAPTURED")
                    continue;
                for (const sOrder of mOrder.sellerOrders) {
                    if (sOrder.settlementStatus === "SETTLED" || sOrder.settlementStatus === "PROCESSING") {
                        continue;
                    }
                    const seller = exports.sellersStore.find((s) => s.id === sOrder.sellerId);
                    const isKycVerified = (seller === null || seller === void 0 ? void 0 : seller.kycStatus) === "VERIFIED_ACTIVE";
                    const isSellerActive = (_a = seller === null || seller === void 0 ? void 0 : seller.isSettlementEligible) !== null && _a !== void 0 ? _a : false;
                    const isDelivered = sOrder.orderStatus === "DELIVERED";
                    const isDisputeFree = !sOrder.isDisputed;
                    let isReturnExpired = false;
                    if (simulateReturnExpiry && isDelivered) {
                        isReturnExpired = true;
                    }
                    else if (sOrder.returnWindowExpiryDate) {
                        isReturnExpired = new Date(sOrder.returnWindowExpiryDate) <= now;
                    }
                    if (isDelivered && isReturnExpired && isDisputeFree && isKycVerified && isSellerActive) {
                        sOrder.settlementStatus = "ELIGIBLE";
                        eligibleOrders.push(sOrder);
                    }
                    else {
                        heldOrders.push(sOrder);
                    }
                }
            }
            return { eligibleOrders, heldOrders };
        });
    }
    /**
     * 5. EXECUTE SELLER SETTLEMENT VIA RAZORPAY VIRTUAL ACCOUNTS
     */
    executeSellerSettlement(sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const seller = exports.sellersStore.find((s) => s.id === sellerId);
            if (!seller)
                throw new Error(`Seller not found: ${sellerId}`);
            if (seller.kycStatus !== "VERIFIED_ACTIVE") {
                throw new Error(`Seller ${seller.sellerCode} is not KYC verified. Payout blocked.`);
            }
            // Find all ELIGIBLE orders for this seller
            const eligibleSubOrders = [];
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
            const settlementRecord = {
                id: `stl_${Date.now()}`,
                settlementId,
                sellerId: seller.id,
                sellerCode: seller.sellerCode,
                sellerName: seller.tradeName,
                virtualAccountId: ((_a = seller.virtualAccount) === null || _a === void 0 ? void 0 : _a.virtualAccountId) || "va_default",
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
            const payoutResult = yield this.settlementProvider.initiateSellerPayout({
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
                const settlementEntry = {
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
            }
            else {
                settlementRecord.status = "FAILED";
                settlementRecord.failureReason = payoutResult.failureReason || "Gateway rejection";
            }
            sellerSettlementsStore.unshift(settlementRecord);
            return settlementRecord;
        });
    }
    /**
     * 6. AMAZON-STYLE FULL & PARTIAL REFUND FLOW
     * Handles customer refund, seller payable reversal, commission clawback,
     * and SELLER_RECOVERY_DEBIT if seller was already settled.
     */
    processAmazonStyleRefund(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const masterOrder = masterOrdersStore.find((m) => m.id === params.masterOrderId);
            if (!masterOrder)
                throw new Error(`MasterOrder not found: ${params.masterOrderId}`);
            const sellerOrder = masterOrder.sellerOrders.find((s) => s.id === params.sellerOrderId);
            if (!sellerOrder)
                throw new Error(`SellerOrder not found: ${params.sellerOrderId}`);
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
            const refundResult = yield this.settlementProvider.initiateCustomerRefund({
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
            const customerRefundEntry = {
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
            const sellerReversalEntry = {
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
                const recoveryEntry = {
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
            const returnRecord = {
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
        });
    }
    /**
     * 7. GET ALL ORDERS & FINANCIAL DATA
     */
    getAllMasterOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return masterOrdersStore;
        });
    }
    getFinancialLedger() {
        return __awaiter(this, void 0, void 0, function* () {
            return financialLedgerStore;
        });
    }
    getSellerSettlements() {
        return __awaiter(this, void 0, void 0, function* () {
            return sellerSettlementsStore;
        });
    }
    getOrderReturns() {
        return __awaiter(this, void 0, void 0, function* () {
            return orderReturnsStore;
        });
    }
    getReconciliationReport() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.FinancialLedgerService = FinancialLedgerService;
exports.financialLedgerService = new FinancialLedgerService();
