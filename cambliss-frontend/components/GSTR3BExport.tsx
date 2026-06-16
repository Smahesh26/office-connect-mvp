import React, { useState } from "react";
import { Download, FileText, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GSTR3BExportProps {
	organizationId: string;
}

interface TaxBreakdown {
	cgst: number;
	sgst: number;
	igst: number;
	total: number;
}

interface GSTR3BSummaryData {
	period: {
		month: number;
		year: number;
		startDate: string;
		endDate: string;
	};
	outputGST: TaxBreakdown;
	inputGST: TaxBreakdown;
	netPayable: TaxBreakdown;
	itcCarryForward: TaxBreakdown;
	metadata: {
		totalSalesInvoices: number;
		totalPurchaseInvoices: number;
		totalOutputValue: number;
		totalInputValue: number;
	};
}

interface ComparisonData {
	months: Array<{
		month: number;
		year: number;
		outputGST: TaxBreakdown;
		inputGST: TaxBreakdown;
		netPayable: TaxBreakdown;
	}>;
	trends: {
		outputGST: { trend: "up" | "down" | "stable"; change: number };
		inputGST: { trend: "up" | "down" | "stable"; change: number };
		netPayable: { trend: "up" | "down" | "stable"; change: number };
	};
}

const GSTR3BExportComponent: React.FC<GSTR3BExportProps> = ({ organizationId }) => {
	const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
	const [compareStartMonth, setCompareStartMonth] = useState<number>(1);
	const [compareEndMonth, setCompareEndMonth] = useState<number>(3);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [summaryData, setSummaryData] = useState<GSTR3BSummaryData | null>(null);
	const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
	const [activeTab, setActiveTab] = useState<"summary" | "comparison">("summary");

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

	const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

	const formatCurrency = (amount: number) => {
		return `₹${amount.toLocaleString("en-IN", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	const handleGenerateSummary = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr3b/summary?organizationId=${organizationId}&month=${selectedMonth}&year=${selectedYear}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate GSTR-3B summary");
			}

			const result = await response.json();
			setSummaryData(result.data);
		} catch (err: any) {
			setError(err.message || "An error occurred while generating the summary");
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateComparison = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr3b/comparison?organizationId=${organizationId}&startMonth=${compareStartMonth}&endMonth=${compareEndMonth}&year=${selectedYear}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate comparison");
			}

			const result = await response.json();
			setComparisonData(result.data);
		} catch (err: any) {
			setError(err.message || "An error occurred while generating the comparison");
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadJSON = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr3b/summary?organizationId=${organizationId}&month=${selectedMonth}&year=${selectedYear}&format=json-filing`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to download JSON");
			}

			const result = await response.json();
			const blob = new Blob([JSON.stringify(result.data, null, 2)], {
				type: "application/json",
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `GSTR3B_${String(selectedMonth).padStart(2, "0")}_${selectedYear}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			setError(err.message || "An error occurred while downloading the JSON");
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadTextReport = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr3b/summary?organizationId=${organizationId}&month=${selectedMonth}&year=${selectedYear}&format=text`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to download text report");
			}

			const result = await response.json();
			const blob = new Blob([result.data], { type: "text/plain" });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `GSTR3B_${String(selectedMonth).padStart(2, "0")}_${selectedYear}.txt`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			setError(err.message || "An error occurred while downloading the text report");
		} finally {
			setLoading(false);
		}
	};

	const getTrendIcon = (trend: "up" | "down" | "stable") => {
		if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-600" />;
		if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-600" />;
		return <Minus className="w-4 h-4 text-gray-600" />;
	};

	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">GSTR-3B Summary Generator</h1>
				<p className="text-gray-600">
					Calculate monthly GST liability. Output GST (sales) - Input GST (purchases) = Net Payable
				</p>
			</div>

			{/* Tab Selector */}
			<div className="bg-white rounded-lg shadow-lg">
				<div className="overflow-x-auto">
					<div className="flex min-w-[360px] border-b border-gray-200">
					<button
						onClick={() => setActiveTab("summary")}
						className={`flex-1 whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
							activeTab === "summary"
								? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
						}`}
					>
						Monthly Summary
					</button>
					<button
						onClick={() => setActiveTab("comparison")}
						className={`flex-1 whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
							activeTab === "comparison"
								? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
						}`}
					>
						Multi-Month Comparison
					</button>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
					<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
					<p className="text-red-700">{error}</p>
				</div>
			)}

			{/* Summary Tab */}
			{activeTab === "summary" && (
				<>
					{/* Period Selection */}
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Select Period</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							{/* Month Selector */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
								<select
									value={selectedMonth}
									onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{months.map((month, index) => (
										<option key={index + 1} value={index + 1}>
											{month}
										</option>
									))}
								</select>
							</div>

							{/* Year Selector */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{years.map((year) => (
										<option key={year} value={year}>
											{year}
										</option>
									))}
								</select>
							</div>

							{/* Generate Button */}
							<div className="flex items-end">
								<button
									onClick={handleGenerateSummary}
									disabled={loading}
									className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
								>
									{loading ? "Generating..." : "Generate Summary"}
								</button>
							</div>
						</div>
					</div>

					{/* Download Options */}
					{summaryData && (
						<div className="bg-white rounded-lg shadow-lg p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Export Options</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<button
									onClick={handleDownloadJSON}
									disabled={loading}
									className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
								>
									<FileText className="w-5 h-5" />
									Download JSON (Portal Upload)
								</button>

								<button
									onClick={handleDownloadTextReport}
									disabled={loading}
									className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
								>
									<Download className="w-5 h-5" />
									Download Text Report
								</button>
							</div>
						</div>
					)}

					{/* Summary Display */}
					{summaryData && (
						<>
							{/* Key Metrics */}
							<div className="bg-white rounded-lg shadow-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-6">Tax Summary</h2>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{/* Output GST */}
									<div className="bg-green-50 rounded-lg p-6 border border-green-200">
										<p className="text-green-700 text-sm font-medium mb-2">
											OUTPUT GST (Collected)
										</p>
										<p className="text-4xl font-bold text-green-900 mb-4">
											{formatCurrency(summaryData.outputGST.total)}
										</p>
										<div className="space-y-1 text-sm">
											<div className="flex justify-between">
												<span className="text-green-700">CGST:</span>
												<span className="font-medium text-green-900">
													{formatCurrency(summaryData.outputGST.cgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-green-700">SGST:</span>
												<span className="font-medium text-green-900">
													{formatCurrency(summaryData.outputGST.sgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-green-700">IGST:</span>
												<span className="font-medium text-green-900">
													{formatCurrency(summaryData.outputGST.igst)}
												</span>
											</div>
										</div>
									</div>

									{/* Input GST */}
									<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
										<p className="text-blue-700 text-sm font-medium mb-2">
											INPUT GST (ITC Available)
										</p>
										<p className="text-4xl font-bold text-blue-900 mb-4">
											{formatCurrency(summaryData.inputGST.total)}
										</p>
										<div className="space-y-1 text-sm">
											<div className="flex justify-between">
												<span className="text-blue-700">CGST:</span>
												<span className="font-medium text-blue-900">
													{formatCurrency(summaryData.inputGST.cgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-blue-700">SGST:</span>
												<span className="font-medium text-blue-900">
													{formatCurrency(summaryData.inputGST.sgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-blue-700">IGST:</span>
												<span className="font-medium text-blue-900">
													{formatCurrency(summaryData.inputGST.igst)}
												</span>
											</div>
										</div>
									</div>

									{/* Net Payable */}
									<div className="bg-red-50 rounded-lg p-6 border border-red-200">
										<p className="text-red-700 text-sm font-medium mb-2">
											NET GST PAYABLE
										</p>
										<p className="text-4xl font-bold text-red-900 mb-4">
											{formatCurrency(summaryData.netPayable.total)}
										</p>
										<div className="space-y-1 text-sm">
											<div className="flex justify-between">
												<span className="text-red-700">CGST:</span>
												<span className="font-medium text-red-900">
													{formatCurrency(summaryData.netPayable.cgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-red-700">SGST:</span>
												<span className="font-medium text-red-900">
													{formatCurrency(summaryData.netPayable.sgst)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-red-700">IGST:</span>
												<span className="font-medium text-red-900">
													{formatCurrency(summaryData.netPayable.igst)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* ITC Carry Forward */}
							{summaryData.itcCarryForward.total > 0 && (
								<div className="bg-white rounded-lg shadow-lg p-6">
									<h2 className="text-xl font-semibold text-gray-900 mb-4">
										ITC Carry Forward (Credit Available)
									</h2>
									<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
										<p className="text-3xl font-bold text-yellow-900 mb-4">
											{formatCurrency(summaryData.itcCarryForward.total)}
										</p>
										<div className="grid grid-cols-3 gap-4 text-sm">
											<div>
												<p className="text-yellow-700">CGST</p>
												<p className="font-medium text-yellow-900">
													{formatCurrency(summaryData.itcCarryForward.cgst)}
												</p>
											</div>
											<div>
												<p className="text-yellow-700">SGST</p>
												<p className="font-medium text-yellow-900">
													{formatCurrency(summaryData.itcCarryForward.sgst)}
												</p>
											</div>
											<div>
												<p className="text-yellow-700">IGST</p>
												<p className="font-medium text-yellow-900">
													{formatCurrency(summaryData.itcCarryForward.igst)}
												</p>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Statistics */}
							<div className="bg-white rounded-lg shadow-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Transaction Statistics
								</h2>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<p className="text-gray-600 text-sm font-medium">Sales Invoices</p>
										<p className="text-2xl font-bold text-gray-900">
											{summaryData.metadata.totalSalesInvoices}
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<p className="text-gray-600 text-sm font-medium">Purchase Invoices</p>
										<p className="text-2xl font-bold text-gray-900">
											{summaryData.metadata.totalPurchaseInvoices}
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<p className="text-gray-600 text-sm font-medium">Total Sales Value</p>
										<p className="text-2xl font-bold text-gray-900">
											{formatCurrency(summaryData.metadata.totalOutputValue)}
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<p className="text-gray-600 text-sm font-medium">Total Purchase Value</p>
										<p className="text-2xl font-bold text-gray-900">
											{formatCurrency(summaryData.metadata.totalInputValue)}
										</p>
									</div>
								</div>
							</div>

							{/* Payment Due Notice */}
							<div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
								<div className="flex items-start gap-3">
									<AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
									<div>
										<h3 className="text-lg font-semibold text-orange-900 mb-2">
											Payment Due Date
										</h3>
										<p className="text-orange-800">
											GSTR-3B for {months[summaryData.period.month - 1]}{" "}
											{summaryData.period.year} must be filed and paid by{" "}
											<span className="font-bold">
												20th{" "}
												{months[summaryData.period.month === 12 ? 0 : summaryData.period.month]}
											</span>
											.
										</p>
										<p className="text-orange-700 text-sm mt-1">
											Late filing attracts penalties and interest charges.
										</p>
									</div>
								</div>
							</div>
						</>
					)}
				</>
			)}

			{/* Comparison Tab */}
			{activeTab === "comparison" && (
				<>
					{/* Comparison Period Selection */}
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Select Comparison Period</h2>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Start Month
								</label>
								<select
									value={compareStartMonth}
									onChange={(e) => setCompareStartMonth(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{months.map((month, index) => (
										<option key={index + 1} value={index + 1}>
											{month}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">End Month</label>
								<select
									value={compareEndMonth}
									onChange={(e) => setCompareEndMonth(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{months.map((month, index) => (
										<option key={index + 1} value={index + 1}>
											{month}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(parseInt(e.target.value))}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									{years.map((year) => (
										<option key={year} value={year}>
											{year}
										</option>
									))}
								</select>
							</div>

							<div className="flex items-end">
								<button
									onClick={handleGenerateComparison}
									disabled={loading}
									className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
								>
									{loading ? "Generating..." : "Compare"}
								</button>
							</div>
						</div>
					</div>

					{/* Comparison Results */}
					{comparisonData && (
						<>
							{/* Trend Indicators */}
							<div className="bg-white rounded-lg shadow-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">Trends</h2>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<div className="flex items-center justify-between gap-2 mb-2">
											<p className="text-gray-700 font-medium">Output GST</p>
											{getTrendIcon(comparisonData.trends.outputGST.trend)}
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{comparisonData.trends.outputGST.change > 0 ? "+" : ""}
											{comparisonData.trends.outputGST.change.toFixed(1)}%
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<div className="flex items-center justify-between gap-2 mb-2">
											<p className="text-gray-700 font-medium">Input GST</p>
											{getTrendIcon(comparisonData.trends.inputGST.trend)}
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{comparisonData.trends.inputGST.change > 0 ? "+" : ""}
											{comparisonData.trends.inputGST.change.toFixed(1)}%
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
										<div className="flex items-center justify-between gap-2 mb-2">
											<p className="text-gray-700 font-medium">Net Payable</p>
											{getTrendIcon(comparisonData.trends.netPayable.trend)}
										</div>
										<p className="text-2xl font-bold text-gray-900">
											{comparisonData.trends.netPayable.change > 0 ? "+" : ""}
											{comparisonData.trends.netPayable.change.toFixed(1)}%
										</p>
									</div>
								</div>
							</div>

							{/* Month-by-Month Table */}
							<div className="bg-white rounded-lg shadow-lg p-6">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Month-by-Month Breakdown
								</h2>

								<div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
									<table className="w-full min-w-[620px] text-sm">
										<thead>
											<tr className="bg-gray-100 border-b border-gray-200">
												<th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
													Period
												</th>
												<th className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
													Output GST
												</th>
												<th className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
													Input GST
												</th>
												<th className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
													Net Payable
												</th>
											</tr>
										</thead>
										<tbody>
											{comparisonData.months.map((monthData, index) => (
												<tr
													key={index}
													className="border-b border-gray-200 hover:bg-gray-50"
												>
													<td className="px-4 py-3 font-medium text-gray-900">
														{months[monthData.month - 1]} {monthData.year}
													</td>
													<td className="px-4 py-3 text-right text-gray-900">
														{formatCurrency(monthData.outputGST.total)}
													</td>
													<td className="px-4 py-3 text-right text-gray-900">
														{formatCurrency(monthData.inputGST.total)}
													</td>
													<td className="px-4 py-3 text-right font-semibold text-gray-900">
														{formatCurrency(monthData.netPayable.total)}
													</td>
												</tr>
											))}
										</tbody>
										<tfoot>
											<tr className="bg-gray-100 font-bold">
												<td className="px-4 py-3 text-gray-900">TOTAL</td>
												<td className="px-4 py-3 text-right text-gray-900">
													{formatCurrency(
														comparisonData.months.reduce(
															(sum, m) => sum + m.outputGST.total,
															0,
														),
													)}
												</td>
												<td className="px-4 py-3 text-right text-gray-900">
													{formatCurrency(
														comparisonData.months.reduce(
															(sum, m) => sum + m.inputGST.total,
															0,
														),
													)}
												</td>
												<td className="px-4 py-3 text-right text-gray-900">
													{formatCurrency(
														comparisonData.months.reduce(
															(sum, m) => sum + m.netPayable.total,
															0,
														),
													)}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
};

export default GSTR3BExportComponent;
