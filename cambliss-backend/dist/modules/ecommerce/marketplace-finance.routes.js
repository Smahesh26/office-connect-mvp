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
const express_1 = require("express");
const financial_ledger_service_1 = require("./financial-ledger.service");
const seller_verification_service_1 = require("./seller-verification.service");
const settlement_provider_factory_1 = __importDefault(require("../payments/settlement-provider.factory"));
const supply_chain_service_1 = require("../inventory/supply-chain.service");
const router = (0, express_1.Router)();
const settlementProvider = settlement_provider_factory_1.default.getProvider();
/**
 * 1. FINANCIAL OVERVIEW & KPIS
 */
router.get("/overview", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ledger = yield financial_ledger_service_1.financialLedgerService.getFinancialLedger();
        const orders = yield financial_ledger_service_1.financialLedgerService.getAllMasterOrders();
        const settlements = yield financial_ledger_service_1.financialLedgerService.getSellerSettlements();
        const returns = yield financial_ledger_service_1.financialLedgerService.getOrderReturns();
        const totalGmv = ledger
            .filter((l) => l.entryType === "CUSTOMER_PAYMENT")
            .reduce((sum, l) => sum + l.creditAmount, 0);
        const totalCommissions = ledger
            .filter((l) => l.entryType === "PLATFORM_COMMISSION")
            .reduce((sum, l) => sum + l.creditAmount, 0);
        const totalSellerSettled = ledger
            .filter((l) => l.entryType === "SELLER_SETTLEMENT")
            .reduce((sum, l) => sum + l.debitAmount, 0);
        const totalCustomerRefunds = ledger
            .filter((l) => l.entryType === "CUSTOMER_REFUND")
            .reduce((sum, l) => sum + l.debitAmount, 0);
        const totalSellerPayableOutstanding = ledger
            .filter((l) => l.entryType === "SELLER_PAYABLE")
            .reduce((sum, l) => sum + l.creditAmount, 0) - totalSellerSettled;
        res.json({
            success: true,
            data: {
                totalGmv,
                totalCommissions,
                totalSellerSettled,
                totalCustomerRefunds,
                totalSellerPayableOutstanding: Math.max(0, totalSellerPayableOutstanding),
                ordersCount: orders.length,
                settlementsCount: settlements.length,
                returnsCount: returns.length,
                ledgerEntriesCount: ledger.length,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 2. MULTI-SELLER CHECKOUT ORDER CREATION
 */
router.post("/orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { customerId, customerName, customerEmail, items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: "Items array is required" });
        }
        const masterOrder = yield financial_ledger_service_1.financialLedgerService.createMultiSellerOrder({
            customerId: customerId || "cust_guest_01",
            customerName: customerName || "Anand Mahindra",
            customerEmail: customerEmail || "anand@mahindra.com",
            items,
        });
        // Interconnected Supply Chain: Automatically trigger warehouse stock deduction & check low-stock triggers
        try {
            const orgId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || "org_default";
            yield (0, supply_chain_service_1.handleCommerceOrderStockDeduction)(masterOrder.id, items, orgId);
        }
        catch (stockErr) {
            console.error("[SupplyChain] Non-blocking stock deduction note:", stockErr);
        }
        res.status(201).json({ success: true, order: masterOrder });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 3. RECORD CUSTOMER PAYMENT CAPTURE
 */
router.post("/orders/:id/capture-payment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const { gatewayPaymentId, gatewayOrderId } = req.body;
        const order = yield financial_ledger_service_1.financialLedgerService.recordCustomerPayment(orderId, gatewayPaymentId || `pay_rzp_${Date.now()}`, gatewayOrderId);
        res.json({ success: true, order, message: "Payment recorded and double-entry ledger written." });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 4. GET ALL ORDERS (MASTER & SPLIT SELLER SUB-ORDERS)
 */
router.get("/orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield financial_ledger_service_1.financialLedgerService.getAllMasterOrders();
        res.json({ success: true, count: orders.length, orders });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 5. MARK ORDER DELIVERED (STARTS 7-DAY RETURN WINDOW)
 */
router.post("/orders/:orderId/deliver", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerOrderId = req.params.orderId;
        const { trackingNumber, courierPartner } = req.body;
        const deliveredSubOrder = yield financial_ledger_service_1.financialLedgerService.markOrderDelivered(sellerOrderId, trackingNumber, courierPartner);
        res.json({ success: true, order: deliveredSubOrder, message: "Order marked delivered. Return window active." });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 6. AMAZON-STYLE REFUND (FULL OR PARTIAL WITH RECOVERY DEBIT)
 */
router.post("/orders/:orderId/refund", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerOrderId = req.params.orderId;
        const { masterOrderId, refundType, partialAmount, reason, initiatedBy } = req.body;
        if (!masterOrderId) {
            return res.status(400).json({ success: false, error: "masterOrderId is required" });
        }
        const result = yield financial_ledger_service_1.financialLedgerService.processAmazonStyleRefund({
            masterOrderId,
            sellerOrderId,
            refundType: refundType || "FULL",
            partialAmount: partialAmount ? Number(partialAmount) : undefined,
            reason: reason || "Customer dissatisfied / Return accepted",
            initiatedBy: initiatedBy || "Cambliss Support Desk",
        });
        res.json(Object.assign({ success: true, message: "Refund processed successfully with ledger reversals." }, result));
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 7. EVALUATE SETTLEMENT ELIGIBILITY
 */
router.get("/settlements/eligibility", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const simulateExpiry = req.query.simulateExpiry === "true";
        const eligibility = yield financial_ledger_service_1.financialLedgerService.evaluateSettlementEligibility(simulateExpiry);
        res.json(Object.assign({ success: true }, eligibility));
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 8. EXECUTE SELLER SETTLEMENT DISPATCH VIA RAZORPAY VIRTUAL ACCOUNT
 */
router.post("/settlements/dispatch", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sellerId } = req.body;
        if (!sellerId) {
            return res.status(400).json({ success: false, error: "sellerId is required" });
        }
        const settlement = yield financial_ledger_service_1.financialLedgerService.executeSellerSettlement(sellerId);
        res.json({ success: true, settlement, message: "Settlement instruction sent via Razorpay Virtual Accounts." });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 9. GET SETTLEMENTS & RETURNS LISTS
 */
router.get("/settlements", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settlements = yield financial_ledger_service_1.financialLedgerService.getSellerSettlements();
        res.json({ success: true, count: settlements.length, settlements });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
router.get("/returns", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const returns = yield financial_ledger_service_1.financialLedgerService.getOrderReturns();
        res.json({ success: true, count: returns.length, returns });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 10. GET IMMUTABLE FINANCIAL LEDGER ENTRIES
 */
router.get("/ledger", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const entries = yield financial_ledger_service_1.financialLedgerService.getFinancialLedger();
        res.json({ success: true, count: entries.length, entries });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 11. RECONCILIATION SUMMARY
 */
router.get("/reconciliation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield financial_ledger_service_1.financialLedgerService.getReconciliationReport();
        res.json({ success: true, report });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 12. SELLER KYC & VERIFICATION QUEUE
 */
router.get("/kyc/queue", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = req.query.status;
        const queue = yield seller_verification_service_1.sellerVerificationService.getKycQueue(status);
        res.json({ success: true, count: queue.length, dossiers: queue });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 13. TRIGGER AI PRELIMINARY DATA COLLECTION
 */
router.post("/kyc/:sellerId/ai-scrape", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerId = req.params.sellerId;
        const updatedDossier = yield seller_verification_service_1.sellerVerificationService.runAiDataCollection(sellerId);
        res.json({
            success: true,
            message: "AI agent preliminary intelligence collection completed.",
            dossier: updatedDossier,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 14. SUPPORT TEAM MANUAL REVIEW DECISION (HUMAN-IN-THE-LOOP)
 */
router.post("/kyc/:sellerId/decision", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerId = req.params.sellerId;
        const { decision, reviewerName, notes } = req.body;
        if (!decision || !reviewerName) {
            return res.status(400).json({ success: false, error: "decision and reviewerName are required" });
        }
        const result = yield seller_verification_service_1.sellerVerificationService.submitManualReviewDecision(sellerId, decision, reviewerName, notes);
        res.json(Object.assign({ success: true, message: `Seller marked ${decision}. Audit record logged.` }, result));
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
/**
 * 15. IDEMPOTENT RAZORPAY WEBHOOK HANDLER
 */
router.post("/webhooks/razorpay", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = JSON.stringify(req.body);
        const isValid = settlementProvider.verifyWebhookSignature(rawBody, signature);
        if (!isValid && process.env.NODE_ENV === "production") {
            return res.status(400).json({ success: false, error: "Invalid webhook signature" });
        }
        const event = req.body.event;
        const payload = req.body.payload;
        console.log(`[RazorpayWebhook] Received event: ${event}`);
        // Process event types idempotently
        if (event === "payment.captured") {
            const paymentEntity = (_a = payload === null || payload === void 0 ? void 0 : payload.payment) === null || _a === void 0 ? void 0 : _a.entity;
            const orderId = (_b = paymentEntity === null || paymentEntity === void 0 ? void 0 : paymentEntity.notes) === null || _b === void 0 ? void 0 : _b.masterOrderId;
            if (orderId) {
                yield financial_ledger_service_1.financialLedgerService.recordCustomerPayment(orderId, paymentEntity.id);
            }
        }
        res.json({ status: "ok", received: true });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}));
exports.default = router;
