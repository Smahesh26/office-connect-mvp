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
const auth_middleware_1 = require("../../middleware/auth.middleware");
const insights_service_1 = require("./insights.service");
const llm_service_1 = require("./llm.service");
const insightsRouter = (0, express_1.Router)();
insightsRouter.use(auth_middleware_1.authenticateJWT);
insightsRouter.get("/executive", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const insights = yield (0, insights_service_1.generateExecutiveInsights)(organizationId);
        return res.json(insights);
    }
    catch (error) {
        console.error("Error generating executive insights:", error);
        return res.status(500).json({
            error: "Failed to generate executive insights",
            message: error.message,
        });
    }
}));
insightsRouter.get("/ceo-report", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        const format = (_c = (_b = req.query.format) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : "json";
        if (!organizationId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!["json", "text"].includes(format)) {
            return res.status(400).json({ error: "Invalid format. Use json or text." });
        }
        const report = yield (0, insights_service_1.generateCEOReport)(organizationId);
        const llmNarrativeResult = yield (0, llm_service_1.generateExecutiveNarrativeDetailed)({
            revenueGrowthPercent: typeof ((_d = report.insights.revenueInsights[0]) === null || _d === void 0 ? void 0 : _d.metric) === "string"
                ? parseFloat(report.insights.revenueInsights[0].metric.replace("%", "")) || 0
                : 0,
            netProfit: 0,
            outstandingReceivables: 0,
            cashBalance: 0,
            inventoryAlerts: report.insights.inventoryInsights
                .filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
                .map((entry) => `${entry.title}: ${entry.message}`),
            hrAlerts: report.insights.hrInsights
                .filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
                .map((entry) => `${entry.title}: ${entry.message}`),
            cashFlowRisks: report.insights.cashFlowInsights
                .filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
                .map((entry) => `${entry.title}: ${entry.message}`),
            expenseAlerts: report.insights.expenseInsights
                .filter((entry) => entry.severity === "ALERT" || entry.severity === "WARNING")
                .map((entry) => `${entry.title}: ${entry.message}`),
            revenueHighlights: report.insights.revenueInsights
                .filter((entry) => entry.severity === "SUCCESS" || entry.severity === "INFO")
                .map((entry) => `${entry.title}: ${entry.message}`),
        });
        const llmNarrative = llmNarrativeResult.content;
        if (format === "text") {
            const lines = [
                "CAMBLISS CEO EXECUTIVE REPORT",
                `Generated At: ${report.generatedAt.toISOString()}`,
                `LLM Status: ${llmNarrativeResult.mode} (${llmNarrativeResult.model})`,
                "",
                "SUMMARY",
                report.summary,
                "",
                "LLM NARRATIVE",
                llmNarrative,
                "",
                "HIGHLIGHTS",
                ...report.highlights.map((item, index) => `${index + 1}. ${item}`),
                "",
                "RISKS",
                ...report.risks.map((item, index) => `${index + 1}. ${item}`),
                "",
                "RECOMMENDATIONS",
                ...report.recommendations.map((item, index) => `${index + 1}. ${item}`),
                "",
                "PREDICTIVE SIGNALS",
                `Forecast Revenue (Next Month): ₹${report.predictiveSignals.nextMonthRevenueForecast.toFixed(2)}`,
                `Customer Churn Risk: ${report.predictiveSignals.customerChurnRisk}`,
                `Credit Risk Score: ${report.predictiveSignals.creditRiskScore}/100`,
            ];
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.status(200).send(lines.join("\n"));
        }
        return res.json(Object.assign(Object.assign({}, report), { llmNarrative, llmStatus: llmNarrativeResult.mode, llmModel: llmNarrativeResult.model }));
    }
    catch (error) {
        console.error("Error generating CEO report:", error);
        return res.status(500).json({
            error: "Failed to generate CEO report",
            message: error.message,
        });
    }
}));
exports.default = insightsRouter;
