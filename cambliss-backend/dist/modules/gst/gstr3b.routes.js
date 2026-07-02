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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gstr3b_service_1 = require("./gstr3b.service");
const router = (0, express_1.Router)();
// Note: Add your authentication middleware
// import { authMiddleware } from "../../middleware/auth.middleware";
// router.use(authMiddleware);
/**
 * GET /gst/gstr3b/summary
 * Generate GSTR-3B monthly summary
 * Query params: month (1-12), year (e.g., 2026)
 */
router.get("/gstr3b/summary", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { month, year, format = "json" } = req.query;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!month || !year) {
            return res.status(400).json({
                error: "Missing required query parameters: month, year",
            });
        }
        const monthInt = parseInt(month, 10);
        const yearInt = parseInt(year, 10);
        if (isNaN(monthInt) || isNaN(yearInt)) {
            return res.status(400).json({
                error: "month and year must be valid integers",
            });
        }
        const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(organizationId, monthInt, yearInt);
        if (format === "json-filing") {
            // Government portal format
            const filingJSON = (0, gstr3b_service_1.generateGSTR3BJSON)(summary);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", `attachment; filename="GSTR3B_${monthInt.toString().padStart(2, "0")}_${yearInt}.json"`);
            return res.json(filingJSON);
        }
        if (format === "text") {
            // Human-readable text report
            const report = (0, gstr3b_service_1.generateGSTR3BReport)(summary);
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.send(report);
        }
        // Default: return full summary object
        res.json(summary);
    }
    catch (error) {
        console.error("Error generating GSTR-3B summary:", error);
        res.status(500).json({
            error: "Failed to generate GSTR-3B summary",
            message: error.message,
        });
    }
}));
/**
 * GET /gst/gstr3b/payment-challan
 * Get payment challan details for tax payment
 */
router.get("/gstr3b/payment-challan", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { month, year } = req.query;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!month || !year) {
            return res.status(400).json({
                error: "Missing required query parameters: month, year",
            });
        }
        const monthInt = parseInt(month, 10);
        const yearInt = parseInt(year, 10);
        const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(organizationId, monthInt, yearInt);
        // Payment challan details
        const challan = {
            period: `${String(monthInt).padStart(2, "0")}/${yearInt}`,
            dueDate: new Date(yearInt, monthInt, 20), // 20th of next month
            paymentDetails: [
                {
                    taxType: "CGST",
                    amount: summary.netPayable.cgst,
                    code: "0401", // CGST payment code
                },
                {
                    taxType: "SGST",
                    amount: summary.netPayable.sgst,
                    code: "0402", // SGST payment code
                },
                {
                    taxType: "IGST",
                    amount: summary.netPayable.igst,
                    code: "0403", // IGST payment code
                },
            ],
            totalPayable: summary.netPayable.total,
            availableCredit: summary.itcCarryForward.total,
        };
        res.json(challan);
    }
    catch (error) {
        console.error("Error generating payment challan:", error);
        res.status(500).json({
            error: "Failed to generate payment challan",
            message: error.message,
        });
    }
}));
/**
 * GET /gst/gstr3b/comparison
 * Compare current month with previous months
 */
router.get("/gstr3b/comparison", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { year, months = "3" } = req.query;
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!year) {
            return res.status(400).json({
                error: "Missing required query parameter: year",
            });
        }
        const yearInt = parseInt(year, 10);
        const monthsCount = parseInt(months, 10);
        const currentMonth = new Date().getMonth() + 1;
        const comparisons = [];
        // Fetch last N months
        for (let i = 0; i < monthsCount; i++) {
            let month = currentMonth - i;
            let adjustedYear = yearInt;
            if (month <= 0) {
                month += 12;
                adjustedYear -= 1;
            }
            try {
                const summary = yield (0, gstr3b_service_1.generateGSTR3BSummary)(organizationId, month, adjustedYear);
                comparisons.push({
                    period: `${String(month).padStart(2, "0")}/${adjustedYear}`,
                    outputGST: summary.outputGST.total,
                    inputGST: summary.inputGST.total,
                    netPayable: summary.netPayable.total,
                    salesInvoices: summary.metadata.totalSalesInvoices,
                    purchaseInvoices: summary.metadata.totalPurchaseInvoices,
                });
            }
            catch (error) {
                // Skip months with no data
            }
        }
        res.json({
            comparison: comparisons,
            trend: comparisons.length >= 2
                ? comparisons[0].netPayable > comparisons[1].netPayable
                    ? "increasing"
                    : "decreasing"
                : "stable",
        });
    }
    catch (error) {
        console.error("Error generating comparison:", error);
        res.status(500).json({
            error: "Failed to generate comparison",
            message: error.message,
        });
    }
}));
exports.default = router;
