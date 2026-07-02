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
const globals_1 = require("@jest/globals");
const llm_service_1 = require("./llm.service");
(0, globals_1.describe)("LLM Service", () => {
    (0, globals_1.it)("should return fallback narrative when OPENAI_API_KEY is not configured", () => __awaiter(void 0, void 0, void 0, function* () {
        const previousKey = process.env.OPENAI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        const narrative = yield (0, llm_service_1.generateExecutiveNarrative)({
            revenueGrowthPercent: -12.5,
            netProfit: 125000,
            outstandingReceivables: 500000,
            cashBalance: 250000,
            inventoryAlerts: ["Dead stock in SKU A"],
            hrAlerts: ["Overtime dependency warning"],
            cashFlowRisks: ["Receivables above 40% of revenue"],
            expenseAlerts: ["Expense spike above 30%"],
            revenueHighlights: ["Top product growth in West region"],
        });
        (0, globals_1.expect)(typeof narrative).toBe("string");
        (0, globals_1.expect)(narrative.length).toBeGreaterThan(30);
        if (previousKey) {
            process.env.OPENAI_API_KEY = previousKey;
        }
    }));
});
