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
exports.generateExecutiveNarrativeDetailed = exports.generateExecutiveNarrative = void 0;
const openai_1 = __importDefault(require("openai"));
const createFallbackNarrative = (data) => {
    const tone = data.revenueGrowthPercent < -20
        ? "Revenue performance is under pressure and needs immediate intervention."
        : data.revenueGrowthPercent > 20
            ? "Revenue momentum is strong this period."
            : "Revenue trend is relatively stable this period.";
    const receivablesRisk = data.outstandingReceivables > 0 && data.netProfit > 0
        ? `Outstanding receivables are ₹${data.outstandingReceivables.toFixed(2)} and should be monitored closely for collection velocity.`
        : "Receivables exposure remains within manageable range based on available signals.";
    const liquidity = data.cashBalance <= 0
        ? "Cash position is weak and calls for short-term liquidity planning."
        : `Cash balance is ₹${data.cashBalance.toFixed(2)}, which supports near-term operating continuity.`;
    const topRisks = [
        ...data.cashFlowRisks,
        ...data.expenseAlerts,
        ...data.inventoryAlerts,
        ...data.hrAlerts,
    ]
        .filter(Boolean)
        .slice(0, 3);
    const riskSentence = topRisks.length > 0
        ? `Key risk signals include: ${topRisks.join("; ")}.`
        : "No major high-severity risk alerts are currently detected.";
    const recommendations = [
        "Accelerate receivables follow-up for delayed accounts.",
        "Review high-growth expense categories with tighter approval controls.",
        "Prioritize actions on dead stock and overtime-heavy teams.",
    ];
    return [tone, receivablesRisk, liquidity, riskSentence, `Recommended actions: ${recommendations.join(" ")}`].join(" ");
};
const buildPrompt = (data) => {
    return [
        `Revenue Growth: ${data.revenueGrowthPercent.toFixed(2)}%`,
        `Net Profit: ₹${data.netProfit.toFixed(2)}`,
        `Outstanding Receivables: ₹${data.outstandingReceivables.toFixed(2)}`,
        `Cash Balance: ₹${data.cashBalance.toFixed(2)}`,
        `Inventory Alerts: ${data.inventoryAlerts.join(" | ") || "None"}`,
        `HR Alerts: ${data.hrAlerts.join(" | ") || "None"}`,
        `Cash Flow Risks: ${data.cashFlowRisks.join(" | ") || "None"}`,
        `Expense Alerts: ${data.expenseAlerts.join(" | ") || "None"}`,
        `Revenue Highlights: ${data.revenueHighlights.join(" | ") || "None"}`,
        "",
        "Write a concise monthly executive business report (about 150-220 words).",
        "Explain performance in clear business language.",
        "Highlight critical risks and practical recommendations.",
        "Keep tone professional, CFO-style, and actionable.",
    ].join("\n");
};
const generateExecutiveNarrative = (insightData) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.generateExecutiveNarrativeDetailed)(insightData);
    return result.content;
});
exports.generateExecutiveNarrative = generateExecutiveNarrative;
const generateExecutiveNarrativeDetailed = (insightData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    if (!apiKey) {
        return {
            content: createFallbackNarrative(insightData),
            mode: "FALLBACK_MODE",
            model,
        };
    }
    const openai = new openai_1.default({ apiKey });
    const prompt = buildPrompt(insightData);
    try {
        const response = yield openai.chat.completions.create({
            model,
            temperature: 0.3,
            messages: [
                { role: "system", content: "You are a professional CFO advisor." },
                { role: "user", content: prompt },
            ],
        });
        const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!content) {
            return {
                content: createFallbackNarrative(insightData),
                mode: "FALLBACK_MODE",
                model,
            };
        }
        return {
            content,
            mode: "LLM_ON",
            model,
        };
    }
    catch (_d) {
        return {
            content: createFallbackNarrative(insightData),
            mode: "FALLBACK_MODE",
            model,
        };
    }
});
exports.generateExecutiveNarrativeDetailed = generateExecutiveNarrativeDetailed;
