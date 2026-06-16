import { describe, it, expect } from "@jest/globals";
import { generateExecutiveNarrative } from "./llm.service";

describe("LLM Service", () => {
	it("should return fallback narrative when OPENAI_API_KEY is not configured", async () => {
		const previousKey = process.env.OPENAI_API_KEY;
		delete process.env.OPENAI_API_KEY;

		const narrative = await generateExecutiveNarrative({
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

		expect(typeof narrative).toBe("string");
		expect(narrative.length).toBeGreaterThan(30);

		if (previousKey) {
			process.env.OPENAI_API_KEY = previousKey;
		}
	});
});
