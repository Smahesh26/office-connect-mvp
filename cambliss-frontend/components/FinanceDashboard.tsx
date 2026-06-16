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

interface FinanceDashboardResponse {
	month: number;
	year: number;
	revenue: number;
	expenses: number;
	netProfit: number;
	payrollCost: number;
	cashBalance: number;
	outstandingReceivables: number;
	outstandingPayables: number;
	inventoryValue: number;
	monthlyGrowthPercent: number;
	workingCapital: number;
	executiveNarrative?: string;
	llmStatus?: "LLM_ON" | "FALLBACK_MODE";
	llmModel?: string;
	executiveInsights?: ExecutiveInsights;
}

const severityClass: Record<InsightSeverity, string> = {
	ALERT: "bg-red-100 text-red-800 border-red-200",
	WARNING: "bg-amber-100 text-amber-800 border-amber-200",
	INFO: "bg-blue-100 text-blue-800 border-blue-200",
	SUCCESS: "bg-green-100 text-green-800 border-green-200",
};

const formatINR = (value: number) =>
	`₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinanceDashboard() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dashboard, setDashboard] = useState<FinanceDashboardResponse | null>(null);
	const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
	const [year, setYear] = useState<number>(new Date().getFullYear());

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 4 + i);

	const riskInsights = useMemo(() => {
		if (!dashboard?.executiveInsights) {
			return [] as Insight[];
		}

		return [
			...dashboard.executiveInsights.revenueInsights,
			...dashboard.executiveInsights.expenseInsights,
			...dashboard.executiveInsights.cashFlowInsights,
			...dashboard.executiveInsights.inventoryInsights,
			...dashboard.executiveInsights.hrInsights,
		]
			.filter((insight) => insight.severity === "ALERT" || insight.severity === "WARNING")
			.slice(0, 8);
	}, [dashboard]);

	const loadDashboard = async () => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem("authToken");
			const response = await fetch(`/api/accounting/dashboard?month=${month}&year=${year}`, {
				method: "GET",
				headers: {
					Authorization: token ? `Bearer ${token}` : "",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to load finance dashboard");
			}

			const data = (await response.json()) as FinanceDashboardResponse;
			setDashboard(data);
		} catch (err: any) {
			setError(err.message || "Unable to load dashboard");
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		void loadDashboard();
	}, []);

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6 text-black">
			<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-100 shadow-xl p-6">
				<h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Finance Dashboard</h1>
				<p className="text-gray-600">Live financial metrics with AI-generated Smart CFO commentary.</p>
			</div>

			<div className="rounded-2xl border border-black/10 bg-white shadow-lg p-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
						<select
							value={month}
							onChange={(event) => setMonth(parseInt(event.target.value, 10))}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
						>
							{months.map((label, index) => (
								<option key={label} value={index + 1}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
						<select
							value={year}
							onChange={(event) => setYear(parseInt(event.target.value, 10))}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
						>
							{years.map((value) => (
								<option key={value} value={value}>
									{value}
								</option>
							))}
						</select>
					</div>
					<div className="md:col-span-2 flex items-end">
						<button
							onClick={loadDashboard}
							disabled={loading}
							className="w-full px-5 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 disabled:bg-gray-400 shadow-lg shadow-black/20"
						>
							{loading ? "Loading..." : "Refresh Dashboard"}
						</button>
					</div>
				</div>
				{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
			</div>

			{dashboard && (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Revenue</p>
							<p className="text-2xl font-bold text-gray-900">{formatINR(dashboard.revenue)}</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Expenses</p>
							<p className="text-2xl font-bold text-gray-900">{formatINR(dashboard.expenses)}</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Net Profit</p>
							<p className="text-2xl font-bold text-gray-900">{formatINR(dashboard.netProfit)}</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Growth</p>
							<p className="text-2xl font-bold text-gray-900">
								{dashboard.monthlyGrowthPercent >= 0 ? "+" : ""}
								{dashboard.monthlyGrowthPercent.toFixed(2)}%
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Cash Balance</p>
							<p className="text-xl font-bold text-gray-900">{formatINR(dashboard.cashBalance)}</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Receivables</p>
							<p className="text-xl font-bold text-gray-900">
								{formatINR(dashboard.outstandingReceivables)}
							</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Payables</p>
							<p className="text-xl font-bold text-gray-900">{formatINR(dashboard.outstandingPayables)}</p>
						</div>
						<div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white to-zinc-50 shadow-lg p-5 hover:shadow-xl transition-shadow">
							<p className="text-sm text-gray-600 mb-1">Working Capital</p>
							<p className="text-xl font-bold text-gray-900">{formatINR(dashboard.workingCapital)}</p>
						</div>
					</div>

					<div className="rounded-2xl border border-black/10 bg-white shadow-lg p-6">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
							<h2 className="text-xl font-semibold text-gray-900">Smart CFO Narrative</h2>
							{dashboard.llmStatus && (
								<span
									className={`inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${
										dashboard.llmStatus === "LLM_ON"
											? "bg-green-100 text-green-800 border-green-200"
											: "bg-amber-100 text-amber-800 border-amber-200"
									}`}
								>
									{dashboard.llmStatus}
									{dashboard.llmModel ? ` • ${dashboard.llmModel}` : ""}
								</span>
							)}
						</div>
						<p className="text-gray-700 leading-relaxed">
							{dashboard.executiveNarrative ||
								"Narrative unavailable for this period. Try refreshing after generating AI insights."}
						</p>
					</div>

					<div className="rounded-2xl border border-black/10 bg-white shadow-lg p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Top Risk Signals</h2>
						{riskInsights.length === 0 ? (
							<p className="text-sm text-gray-600">No current warning/alert risk badges.</p>
						) : (
							<div className="space-y-3">
								{riskInsights.map((insight, index) => (
									<div
										key={`${insight.title}-${index}`}
										className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-zinc-50 p-3 sm:flex-row sm:items-start sm:justify-between"
									>
										<div className="min-w-0">
											<p className="text-sm font-medium text-gray-900">{insight.title}</p>
											<p className="text-sm text-gray-600">{insight.message}</p>
										</div>
										<span
											className={`inline-flex items-center justify-center self-start sm:self-auto rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${severityClass[insight.severity]}`}
										>
											{insight.severity}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
