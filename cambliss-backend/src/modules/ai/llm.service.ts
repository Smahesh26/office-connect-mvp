import OpenAI from "openai";

export interface ExecutiveNarrativeInput {
	revenueGrowthPercent: number;
	netProfit: number;
	outstandingReceivables: number;
	cashBalance: number;
	inventoryAlerts: string[];
	hrAlerts: string[];
	cashFlowRisks: string[];
	expenseAlerts: string[];
	revenueHighlights: string[];
}

export type LLMMode = "LLM_ON" | "FALLBACK_MODE";

export interface ExecutiveNarrativeResult {
	content: string;
	mode: LLMMode;
	model: string;
}

const createFallbackNarrative = (data: ExecutiveNarrativeInput): string => {
	const tone =
		data.revenueGrowthPercent < -20
			? "Revenue performance is under pressure and needs immediate intervention."
			: data.revenueGrowthPercent > 20
				? "Revenue momentum is strong this period."
				: "Revenue trend is relatively stable this period.";

	const receivablesRisk =
		data.outstandingReceivables > 0 && data.netProfit > 0
			? `Outstanding receivables are ₹${data.outstandingReceivables.toFixed(2)} and should be monitored closely for collection velocity.`
			: "Receivables exposure remains within manageable range based on available signals.";

	const liquidity =
		data.cashBalance <= 0
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

	const riskSentence =
		topRisks.length > 0
			? `Key risk signals include: ${topRisks.join("; ")}.`
			: "No major high-severity risk alerts are currently detected.";

	const recommendations = [
		"Accelerate receivables follow-up for delayed accounts.",
		"Review high-growth expense categories with tighter approval controls.",
		"Prioritize actions on dead stock and overtime-heavy teams.",
	];

	return [tone, receivablesRisk, liquidity, riskSentence, `Recommended actions: ${recommendations.join(" ")}`].join(
		" ",
	);
};

const buildPrompt = (data: ExecutiveNarrativeInput): string => {
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

export const generateExecutiveNarrative = async (insightData: ExecutiveNarrativeInput): Promise<string> => {
	const result = await generateExecutiveNarrativeDetailed(insightData);
	return result.content;
};

export const generateExecutiveNarrativeDetailed = async (
	insightData: ExecutiveNarrativeInput,
): Promise<ExecutiveNarrativeResult> => {
	const apiKey = process.env.OPENAI_API_KEY;
	const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
	if (!apiKey) {
		return {
			content: createFallbackNarrative(insightData),
			mode: "FALLBACK_MODE",
			model,
		};
	}

	const openai = new OpenAI({ apiKey });
	const prompt = buildPrompt(insightData);

	try {
		const response = await openai.chat.completions.create({
			model,
			temperature: 0.3,
			messages: [
				{ role: "system", content: "You are a professional CFO advisor." },
				{ role: "user", content: prompt },
			],
		});

		const content = response.choices[0]?.message?.content?.trim();
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
	} catch {
		return {
			content: createFallbackNarrative(insightData),
			mode: "FALLBACK_MODE",
			model,
		};
	}
};
