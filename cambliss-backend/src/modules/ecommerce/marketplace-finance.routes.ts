import { Router, Request, Response } from "express";
import { financialLedgerService } from "./financial-ledger.service";
import { sellerVerificationService } from "./seller-verification.service";
import SettlementProviderFactory from "../payments/settlement-provider.factory";

const router = Router();
const settlementProvider = SettlementProviderFactory.getProvider();

/**
 * 1. FINANCIAL OVERVIEW & KPIS
 */
router.get("/overview", async (req: Request, res: Response) => {
  try {
    const ledger = await financialLedgerService.getFinancialLedger();
    const orders = await financialLedgerService.getAllMasterOrders();
    const settlements = await financialLedgerService.getSellerSettlements();
    const returns = await financialLedgerService.getOrderReturns();

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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. MULTI-SELLER CHECKOUT ORDER CREATION
 */
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, customerEmail, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Items array is required" });
    }

    const masterOrder = await financialLedgerService.createMultiSellerOrder({
      customerId: customerId || "cust_guest_01",
      customerName: customerName || "Anand Mahindra",
      customerEmail: customerEmail || "anand@mahindra.com",
      items,
    });

    res.status(201).json({ success: true, order: masterOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. RECORD CUSTOMER PAYMENT CAPTURE
 */
router.post("/orders/:id/capture-payment", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const { gatewayPaymentId, gatewayOrderId } = req.body;

    const order = await financialLedgerService.recordCustomerPayment(
      orderId,
      gatewayPaymentId || `pay_rzp_${Date.now()}`,
      gatewayOrderId
    );

    res.json({ success: true, order, message: "Payment recorded and double-entry ledger written." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. GET ALL ORDERS (MASTER & SPLIT SELLER SUB-ORDERS)
 */
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const orders = await financialLedgerService.getAllMasterOrders();
    res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. MARK ORDER DELIVERED (STARTS 7-DAY RETURN WINDOW)
 */
router.post("/orders/:orderId/deliver", async (req: Request, res: Response) => {
  try {
    const sellerOrderId = req.params.orderId as string;
    const { trackingNumber, courierPartner } = req.body;

    const deliveredSubOrder = await financialLedgerService.markOrderDelivered(
      sellerOrderId,
      trackingNumber,
      courierPartner
    );

    res.json({ success: true, order: deliveredSubOrder, message: "Order marked delivered. Return window active." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. AMAZON-STYLE REFUND (FULL OR PARTIAL WITH RECOVERY DEBIT)
 */
router.post("/orders/:orderId/refund", async (req: Request, res: Response) => {
  try {
    const sellerOrderId = req.params.orderId as string;
    const { masterOrderId, refundType, partialAmount, reason, initiatedBy } = req.body;

    if (!masterOrderId) {
      return res.status(400).json({ success: false, error: "masterOrderId is required" });
    }

    const result = await financialLedgerService.processAmazonStyleRefund({
      masterOrderId,
      sellerOrderId,
      refundType: refundType || "FULL",
      partialAmount: partialAmount ? Number(partialAmount) : undefined,
      reason: reason || "Customer dissatisfied / Return accepted",
      initiatedBy: initiatedBy || "Cambliss Support Desk",
    });

    res.json({
      success: true,
      message: "Refund processed successfully with ledger reversals.",
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. EVALUATE SETTLEMENT ELIGIBILITY
 */
router.get("/settlements/eligibility", async (req: Request, res: Response) => {
  try {
    const simulateExpiry = req.query.simulateExpiry === "true";
    const eligibility = await financialLedgerService.evaluateSettlementEligibility(simulateExpiry);
    res.json({ success: true, ...eligibility });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. EXECUTE SELLER SETTLEMENT DISPATCH VIA RAZORPAY VIRTUAL ACCOUNT
 */
router.post("/settlements/dispatch", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) {
      return res.status(400).json({ success: false, error: "sellerId is required" });
    }

    const settlement = await financialLedgerService.executeSellerSettlement(sellerId);
    res.json({ success: true, settlement, message: "Settlement instruction sent via Razorpay Virtual Accounts." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. GET SETTLEMENTS & RETURNS LISTS
 */
router.get("/settlements", async (req: Request, res: Response) => {
  try {
    const settlements = await financialLedgerService.getSellerSettlements();
    res.json({ success: true, count: settlements.length, settlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/returns", async (req: Request, res: Response) => {
  try {
    const returns = await financialLedgerService.getOrderReturns();
    res.json({ success: true, count: returns.length, returns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. GET IMMUTABLE FINANCIAL LEDGER ENTRIES
 */
router.get("/ledger", async (req: Request, res: Response) => {
  try {
    const entries = await financialLedgerService.getFinancialLedger();
    res.json({ success: true, count: entries.length, entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 11. RECONCILIATION SUMMARY
 */
router.get("/reconciliation", async (req: Request, res: Response) => {
  try {
    const report = await financialLedgerService.getReconciliationReport();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 12. SELLER KYC & VERIFICATION QUEUE
 */
router.get("/kyc/queue", async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const queue = await sellerVerificationService.getKycQueue(status);
    res.json({ success: true, count: queue.length, dossiers: queue });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 13. TRIGGER AI PRELIMINARY DATA COLLECTION
 */
router.post("/kyc/:sellerId/ai-scrape", async (req: Request, res: Response) => {
  try {
    const sellerId = req.params.sellerId as string;
    const updatedDossier = await sellerVerificationService.runAiDataCollection(sellerId);
    res.json({
      success: true,
      message: "AI agent preliminary intelligence collection completed.",
      dossier: updatedDossier,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 14. SUPPORT TEAM MANUAL REVIEW DECISION (HUMAN-IN-THE-LOOP)
 */
router.post("/kyc/:sellerId/decision", async (req: Request, res: Response) => {
  try {
    const sellerId = req.params.sellerId as string;
    const { decision, reviewerName, notes } = req.body;

    if (!decision || !reviewerName) {
      return res.status(400).json({ success: false, error: "decision and reviewerName are required" });
    }

    const result = await sellerVerificationService.submitManualReviewDecision(
      sellerId,
      decision,
      reviewerName,
      notes
    );

    res.json({
      success: true,
      message: `Seller marked ${decision}. Audit record logged.`,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 15. IDEMPOTENT RAZORPAY WEBHOOK HANDLER
 */
router.post("/webhooks/razorpay", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
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
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.masterOrderId;
      if (orderId) {
        await financialLedgerService.recordCustomerPayment(orderId, paymentEntity.id);
      }
    }

    res.json({ status: "ok", received: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
