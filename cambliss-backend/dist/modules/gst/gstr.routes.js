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
const gstr_service_1 = require("./gstr.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /gst/gstr1/report
 * Generate GSTR-1 report for a specific month
 * Query params: month (1-12), year (e.g., 2025)
 */
router.get("/gstr1/report", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const report = yield (0, gstr_service_1.generateGSTR1Report)(organizationId, monthInt, yearInt);
        if (format === "csv") {
            const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.csv"`);
            return res.send(csv);
        }
        if (format === "json-submission") {
            const jsonData = (0, gstr_service_1.generateGSTR1JSON)(report);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", `attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.json"`);
            return res.json(jsonData);
        }
        // Default: return full report object
        res.json(report);
    }
    catch (error) {
        console.error("Error generating GSTR-1 report:", error);
        res.status(500).json({
            error: "Failed to generate GSTR-1 report",
            message: error.message,
        });
    }
}));
/**
 * GET /gst/gstr1/export-csv
 * Direct CSV export endpoint
 */
router.get("/gstr1/export-csv", auth_middleware_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const report = yield (0, gstr_service_1.generateGSTR1Report)(organizationId, monthInt, yearInt);
        const csv = (0, gstr_service_1.generateGSTR1CSV)(report);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.csv"`);
        res.send(csv);
    }
    catch (error) {
        console.error("Error exporting GSTR-1 CSV:", error);
        res.status(500).json({
            error: "Failed to export GSTR-1 report",
            message: error.message,
        });
    }
}));
exports.default = router;
