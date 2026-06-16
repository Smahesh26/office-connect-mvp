import React, { useState } from "react";
import { Download, FileText, AlertCircle } from "lucide-react";

interface GSTR1ExportProps {
	organizationId: string;
}

interface ReportData {
	period: {
		month: number;
		year: number;
	};
	b2b: Array<{
		gstin: string;
		invoiceNumber: string;
		invoiceDate: string;
		invoiceValue: number;
		taxableValue: number;
		cgstAmount: number;
		sgstAmount: number;
		igstAmount: number;
	}>;
	b2c: Array<{
		invoiceNumber: string;
		invoiceDate: string;
		invoiceValue: number;
		taxableValue: number;
		cgstAmount: number;
		sgstAmount: number;
		igstAmount: number;
	}>;
	summary: {
		totalB2BInvoices: number;
		totalB2CInvoices: number;
		totalTaxableValue: number;
		totalCGST: number;
		totalSGST: number;
		totalIGST: number;
		totalTax: number;
		totalInvoiceValue: number;
	};
}

const GSTR1ExportComponent: React.FC<GSTR1ExportProps> = ({ organizationId }) => {
	const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reportData, setReportData] = useState<ReportData | null>(null);

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

	const handleGenerateReport = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr1/report?month=${selectedMonth}&year=${selectedYear}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate GSTR-1 report");
			}

			const data = await response.json();
			setReportData(data);
		} catch (err: any) {
			setError(err.message || "An error occurred while generating the report");
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadCSV = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr1/export-csv?month=${selectedMonth}&year=${selectedYear}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("authToken")}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to download CSV");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `GSTR1_${String(selectedMonth).padStart(2, "0")}_${selectedYear}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err: any) {
			setError(err.message || "An error occurred while downloading the CSV");
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadJSON = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/gst/gstr1/report?month=${selectedMonth}&year=${selectedYear}&format=json-submission`,
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

			const data = await response.json();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `GSTR1_${String(selectedMonth).padStart(2, "0")}_${selectedYear}.json`;
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

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<div className="bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">GSTR-1 Return Generator</h1>
				<p className="text-gray-600">
					Generate GST Return (Form GSTR-1) for supplies to registered and unregistered customers
				</p>
			</div>

			{/* Period Selection */}
			<div className="bg-white rounded-lg shadow-lg p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Select Period</h2>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					{/* Month Selector */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Month
						</label>
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
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Year
						</label>
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
							onClick={handleGenerateReport}
							disabled={loading}
							className="w-full px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
						>
							{loading ? "Generating..." : "Generate Report"}
						</button>
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-2">
						<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
						<p className="text-red-700">{error}</p>
					</div>
				)}
			</div>

			{/* Download Buttons */}
			{reportData && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Export Options</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<button
							onClick={handleDownloadCSV}
							disabled={loading}
							className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
						>
							<Download className="w-5 h-5" />
							Download CSV
						</button>

						<button
							onClick={handleDownloadJSON}
							disabled={loading}
							className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
						>
							<FileText className="w-5 h-5" />
							Download JSON
						</button>
					</div>
				</div>
			)}

			{/* Report Summary */}
			{reportData && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-6">Report Summary</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
							<p className="text-blue-600 text-sm font-medium">B2B Invoices</p>
							<p className="text-3xl font-bold text-blue-900">
								{reportData.summary.totalB2BInvoices}
							</p>
						</div>

						<div className="bg-green-50 rounded-lg p-4 border border-green-200">
							<p className="text-green-600 text-sm font-medium">B2C Invoices</p>
							<p className="text-3xl font-bold text-green-900">
								{reportData.summary.totalB2CInvoices}
							</p>
						</div>

						<div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
							<p className="text-orange-600 text-sm font-medium">Total Taxable</p>
							<p className="text-3xl font-bold text-orange-900">
								₹{reportData.summary.totalTaxableValue.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>

						<div className="bg-red-50 rounded-lg p-4 border border-red-200">
							<p className="text-red-600 text-sm font-medium">Total Tax</p>
							<p className="text-3xl font-bold text-red-900">
								₹{reportData.summary.totalTax.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
					</div>

					{/* Tax Breakdown */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
							<p className="text-gray-600 text-sm font-medium">CGST</p>
							<p className="text-2xl font-bold text-gray-900">
								₹{reportData.summary.totalCGST.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>

						<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
							<p className="text-gray-600 text-sm font-medium">SGST</p>
							<p className="text-2xl font-bold text-gray-900">
								₹{reportData.summary.totalSGST.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>

						<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
							<p className="text-gray-600 text-sm font-medium">IGST</p>
							<p className="text-2xl font-bold text-gray-900">
								₹{reportData.summary.totalIGST.toLocaleString("en-IN", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Invoice Details Tables */}
			{reportData && reportData.summary.totalB2BInvoices > 0 && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">B2B Invoices Details</h2>

					<div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
						<table className="w-full min-w-[860px] text-sm">
							<thead>
								<tr className="bg-gray-100 border-b border-gray-200">
									<th className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
										GSTIN
									</th>
									<th className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
										Invoice
									</th>
									<th className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
										Date
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										Taxable
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										CGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										SGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										IGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										Total
									</th>
								</tr>
							</thead>
							<tbody>
								{reportData.b2b.map((invoice, index) => (
									<tr
										key={index}
										className="border-b border-gray-200 hover:bg-gray-50"
									>
										<td className="px-4 py-2 text-gray-900 font-medium">
											{invoice.gstin}
										</td>
										<td className="px-4 py-2 text-gray-900">{invoice.invoiceNumber}</td>
										<td className="px-4 py-2 text-gray-600">{invoice.invoiceDate}</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.taxableValue.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.cgstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.sgstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.igstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right font-semibold text-gray-900">
											₹{invoice.invoiceValue.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* B2C Invoice Table */}
			{reportData && reportData.summary.totalB2CInvoices > 0 && (
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">B2C Invoices Details</h2>

					<div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
						<table className="w-full min-w-[760px] text-sm">
							<thead>
								<tr className="bg-gray-100 border-b border-gray-200">
									<th className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
										Invoice
									</th>
									<th className="px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
										Date
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										Taxable
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										CGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										SGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										IGST
									</th>
									<th className="px-4 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
										Total
									</th>
								</tr>
							</thead>
							<tbody>
								{reportData.b2c.map((invoice, index) => (
									<tr
										key={index}
										className="border-b border-gray-200 hover:bg-gray-50"
									>
										<td className="px-4 py-2 text-gray-900 font-medium">
											{invoice.invoiceNumber}
										</td>
										<td className="px-4 py-2 text-gray-600">{invoice.invoiceDate}</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.taxableValue.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.cgstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.sgstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right text-gray-900">
											₹{invoice.igstAmount.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
										<td className="px-4 py-2 text-right font-semibold text-gray-900">
											₹{invoice.invoiceValue.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
};

export default GSTR1ExportComponent;
