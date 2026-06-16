"use client";

import React, { useMemo, useState } from "react";

type InsightSeverity = "INFO" | "SUCCESS" | "WARNING" | "ALERT";

interface Insight {
	severity: InsightSeverity;
	title: string;
	message: string;
	metric?: string;
}

interface ExecutiveInsights {
	revenueInsights: Insight[];
	expenseInsights: Insight[];
	inventoryInsights: Insight[];
	cashFlowInsights: Insight[];
	hrInsights: Insight[];
	generatedAt: string;
}

interface CEOReportResponse {
	summary: string;
	llmNarrative?: string;
	llmStatus?: "LLM_ON" | "FALLBACK_MODE";
	llmModel?: string;
	highlights: string[];
	risks: string[];
	recommendations: string[];
	predictiveSignals: {
		nextMonthRevenueForecast: number;
		customerChurnRisk: "LOW" | "MEDIUM" | "HIGH";
		creditRiskScore: number;
	};
	insights: ExecutiveInsights;
	generatedAt: string;
}

const sectionLabel: Record<keyof ExecutiveInsights, string> = {
	revenueInsights: "Revenue",
	expenseInsights: "Expenses",
	inventoryInsights: "Inventory",
	cashFlowInsights: "Cash Flow",
	hrInsights: "HR",
	generatedAt: "Generated",
};

const severityClasses: Record<InsightSeverity, string> = {
	ALERT: "bg-red-100 text-red-800 border-red-200",
	WARNING: "bg-amber-100 text-amber-800 border-amber-200",
	SUCCESS: "bg-green-100 text-green-800 border-green-200",
	INFO: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function CEOReport() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [report, setReport] = useState<CEOReportResponse | null>(null);
	const [activeView, setActiveView] = useState<"json" | "text">("json");
	const [textReport, setTextReport] = useState<string>("");

	const generatedLabel = useMemo(() => {
		if (!report?.generatedAt) {
			return "-";
		}
		return new Date(report.generatedAt).toLocaleString();
	}, [report]);

	const fetchReport = async (format: "json" | "text") => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem("authToken");
			const url =
				format === "text"
					? "/api/ai/insights/ceo-report?format=text"
					: "/api/ai/insights/ceo-report";

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: token ? `Bearer ${token}` : "",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to generate CEO report");
			}

			if (format === "text") {
				const text = await response.text();
				setTextReport(text);
				setActiveView("text");
				return;
			}

			const data = (await response.json()) as CEOReportResponse;
			setReport(data);
			setActiveView("json");
		} catch (err: any) {
			setError(err.message || "Unable to load CEO report");
		} finally {
			setLoading(false);
		}
	};

	const downloadTextReport = () => {
		if (!textReport.trim()) {
			return;
		}
		const blob = new Blob([textReport], { type: "text/plain;charset=utf-8" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `CEO_REPORT_${Date.now()}.txt`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			<div className="bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">CEO Executive Report</h1>
				<p className="text-gray-600">
					Natural-language business insights generated from the AI intelligence engine.
				</p>
			</div>

			<div className="bg-white rounded-lg shadow-lg p-6">
				<div className="flex flex-col gap-3 sm:flex-row">
					<button
						onClick={() => fetchReport("json")}
						disabled={loading}
						className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400"
					>
						{loading ? "Generating..." : "Generate JSON Report"}
					</button>
					<button
						onClick={() => fetchReport("text")}
						disabled={loading}
						className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:bg-gray-400"
					>
						{loading ? "Generating..." : "Generate Text Report"}
					</button>
					<button
						onClick={downloadTextReport}
						disabled={!textReport}
						className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-gray-400"
					>
						Download Text
					</button>
				</div>

				{error && <p className="mt-4 text-sm text-red-600">{error}</p>}
			</div>

			{report && (
				<>
					<div className="bg-white rounded-lg shadow-lg p-6">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
							<h2 className="text-xl font-semibold text-gray-900">Executive Summary</h2>
							<div className="flex items-center gap-2">
								{report.llmStatus && (
									<span
										className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
											report.llmStatus === "LLM_ON"
												? "bg-green-100 text-green-800 border-green-200"
												: "bg-amber-100 text-amber-800 border-amber-200"
										}`}
									>
										{report.llmStatus}
										{report.llmModel ? ` • ${report.llmModel}` : ""}
									</span>
								)}
								<span className="text-sm text-gray-500">Generated: {generatedLabel}</span>
							</div>
						</div>
						<p className="text-gray-700 leading-relaxed">{report.summary}</p>
						{report.llmNarrative && (
							<div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
								<p className="text-sm font-semibold text-blue-900 mb-1">Smart CFO Narrative</p>
								<p className="text-sm text-blue-800 leading-relaxed">{report.llmNarrative}</p>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-white rounded-lg shadow-lg p-5 border border-gray-100">
							<p className="text-sm text-gray-600 mb-1">Forecast Revenue (Next Month)</p>
							<p className="text-2xl font-bold text-gray-900">
								₹{report.predictiveSignals.nextMonthRevenueForecast.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow-lg p-5 border border-gray-100">
							<p className="text-sm text-gray-600 mb-1">Customer Churn Risk</p>
							<p className="text-2xl font-bold text-gray-900">
								{report.predictiveSignals.customerChurnRisk}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow-lg p-5 border border-gray-100">
							<p className="text-sm text-gray-600 mb-1">Credit Risk Score</p>
							<p className="text-2xl font-bold text-gray-900">
								{report.predictiveSignals.creditRiskScore}/100
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="bg-white rounded-lg shadow-lg p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Highlights</h3>
							<ul className="space-y-2 text-sm text-gray-700">
								{report.highlights.length === 0 ? (
									<li>No major positive highlights yet.</li>
								) : (
									report.highlights.map((item, index) => <li key={index}>• {item}</li>)
								)}
							</ul>
						</div>

						<div className="bg-white rounded-lg shadow-lg p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Risks</h3>
							<ul className="space-y-2 text-sm text-gray-700">
								{report.risks.length === 0 ? (
									<li>No active risk flags from current rules.</li>
								) : (
									report.risks.map((item, index) => <li key={index}>• {item}</li>)
								)}
							</ul>
						</div>

						<div className="bg-white rounded-lg shadow-lg p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
							<ul className="space-y-2 text-sm text-gray-700">
								{report.recommendations.map((item, index) => (
									<li key={index}>• {item}</li>
								))}
							</ul>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-lg p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">Underlying Insights</h3>
							<span className="text-xs text-gray-500">
								View: {activeView.toUpperCase()}
							</span>
						</div>

						<div className="space-y-6">
							{(
								[
									"revenueInsights",
									"expenseInsights",
									"cashFlowInsights",
									"inventoryInsights",
									"hrInsights",
								] as const
							).map((key) => (
								<div key={key}>
									<h4 className="text-sm font-semibold text-gray-800 mb-3">
										{sectionLabel[key]}
									</h4>
									<div className="space-y-2">
										{report.insights[key].map((insight, index) => (
											<div
												key={`${key}-${index}`}
												className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-start sm:justify-between"
											>
												<div className="min-w-0">
													<p className="text-sm font-medium text-gray-900">{insight.title}</p>
													<p className="text-sm text-gray-600">{insight.message}</p>
													{insight.metric && (
														<p className="text-xs text-gray-500 mt-1">{insight.metric}</p>
													)}
												</div>
												<span
													className={`inline-flex items-center justify-center self-start sm:self-auto rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${severityClasses[insight.severity]}`}
												>
													{insight.severity}
												</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{activeView === "text" && textReport && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Text Report</h2>
					<pre className="bg-gray-900 text-green-300 rounded-lg p-4 overflow-auto text-xs leading-6 whitespace-pre-wrap">
						{textReport}
					</pre>
				</div>
			)}
		</div>
	);
}
