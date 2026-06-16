import { Router, Request, Response } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { generateCEOReport, generateExecutiveInsights } from "./insights.service";
import { generateExecutiveNarrativeDetailed } from "./llm.service";

const insightsRouter = Router();

insightsRouter.use(authenticateJWT);

insightsRouter.get("/executive", async (req: Request, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const insights = await generateExecutiveInsights(organizationId);
		return res.json(insights);
	} catch (error: any) {
		console.error("Error generating executive insights:", error);
		return res.status(500).json({
			error: "Failed to generate executive insights",
			message: error.message,
		});
	}
});

insightsRouter.get("/ceo-report", async (req: Request, res: Response) => {
	try {
		const organizationId = req.user?.organizationId;
		const format = (req.query.format as string | undefined)?.toLowerCase() ?? "json";

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!["json", "text"].includes(format)) {
			return res.status(400).json({ error: "Invalid format. Use json or text." });
		}

		const report = await generateCEOReport(organizationId);
		const llmNarrativeResult = await generateExecutiveNarrativeDetailed({
			revenueGrowthPercent:
				typeof report.insights.revenueInsights[0]?.metric === "string"
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

		return res.json({
			...report,
			llmNarrative,
			llmStatus: llmNarrativeResult.mode,
			llmModel: llmNarrativeResult.model,
		});
	} catch (error: any) {
		console.error("Error generating CEO report:", error);
		return res.status(500).json({
			error: "Failed to generate CEO report",
			message: error.message,
		});
	}
});

export default insightsRouter;
