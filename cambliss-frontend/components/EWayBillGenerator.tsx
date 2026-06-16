"use client";

import React, { useState } from "react";
import { Download, FileText, AlertCircle, Truck, CheckCircle, XCircle } from "lucide-react";

interface ValidationError {
	field: string;
	message: string;
}

interface TransportDetails {
	transporterName?: string;
	transporterGSTIN?: string;
	vehicleNumber?: string;
	transportMode?: "ROAD" | "RAIL" | "AIR" | "SHIP";
	distance?: number;
}

interface EWayBillHistory {
	id: string;
	transportMode: string | null;
	vehicleNumber: string | null;
	status: string;
	generatedAt: string;
}

export default function EWayBillGenerator({ invoiceId }: { invoiceId: string }) {
	const [validationStatus, setValidationStatus] = useState<{
		valid: boolean | null;
		errors: ValidationError[];
		checked: boolean;
	}>({ valid: null, errors: [], checked: false });

	const [transportDetails, setTransportDetails] = useState<TransportDetails>({
		transportMode: "ROAD",
	});

	const [generating, setGenerating] = useState(false);
	const [generatedData, setGeneratedData] = useState<any>(null);
	const [history, setHistory] = useState<EWayBillHistory[]>([]);
	const [showHistory, setShowHistory] = useState(false);

	const transportModes = [
		{ value: "ROAD", label: "Road" },
		{ value: "RAIL", label: "Rail" },
		{ value: "AIR", label: "Air" },
		{ value: "SHIP", label: "Ship/Sea" },
	];

	const validateInvoice = async () => {
		try {
			const response = await fetch("/api/gst/eway-bill/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ invoiceId }),
			});

			const data = await response.json();
			setValidationStatus({ valid: data.valid, errors: data.errors || [], checked: true });
		} catch (error) {
			console.error("Validation error:", error);
			setValidationStatus({
				valid: false,
				errors: [{ field: "system", message: "Failed to validate invoice" }],
				checked: true,
			});
		}
	};

	const generateEWayBill = async () => {
		setGenerating(true);
		try {
			const response = await fetch("/api/gst/eway-bill/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ invoiceId, transportDetails }),
			});

			const result = await response.json();

			if (result.success) {
				setGeneratedData(result.data);
				await loadHistory();
			} else {
				alert("Failed to generate E-Way Bill: " + (result.errors?.[0]?.message || "Unknown error"));
			}
		} catch (error) {
			console.error("Generation error:", error);
			alert("Failed to generate E-Way Bill");
		} finally {
			setGenerating(false);
		}
	};

	const downloadJSON = async () => {
		try {
			const params = new URLSearchParams();
			if (transportDetails.transporterName) params.append("transporterName", transportDetails.transporterName);
			if (transportDetails.transporterGSTIN) params.append("transporterGSTIN", transportDetails.transporterGSTIN);
			if (transportDetails.vehicleNumber) params.append("vehicleNumber", transportDetails.vehicleNumber);
			if (transportDetails.transportMode) params.append("transportMode", transportDetails.transportMode);
			if (transportDetails.distance) params.append("distance", transportDetails.distance.toString());

			const response = await fetch(`/api/gst/eway-bill/download/${invoiceId}?${params.toString()}`);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `EWAY_${invoiceId}_${Date.now()}.json`;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download error:", error);
			alert("Failed to download E-Way Bill JSON");
		}
	};

	const loadHistory = async () => {
		try {
			const response = await fetch(`/api/gst/eway-bill/history/${invoiceId}`);
			const result = await response.json();
			if (result.success) {
				setHistory(result.data);
			}
		} catch (error) {
			console.error("Failed to load history:", error);
		}
	};

	const cancelEWayBill = async (ewayBillId: string) => {
		if (!confirm("Are you sure you want to cancel this E-Way Bill?")) return;

		try {
			const response = await fetch(`/api/gst/eway-bill/cancel/${ewayBillId}`, {
				method: "POST",
			});

			const result = await response.json();
			if (result.success) {
				alert("E-Way Bill cancelled successfully");
				await loadHistory();
			}
		} catch (error) {
			console.error("Cancel error:", error);
			alert("Failed to cancel E-Way Bill");
		}
	};

	React.useEffect(() => {
		validateInvoice();
		loadHistory();
	}, [invoiceId]);

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="flex items-center gap-3 mb-4">
					<Truck className="w-8 h-8 text-blue-600" />
					<div>
						<h1 className="text-2xl font-bold text-gray-900">E-Way Bill Generator</h1>
						<p className="text-sm text-gray-600">Generate logistics compliance documents for India</p>
					</div>
				</div>

				{/* Validation Status */}
				{validationStatus.checked && (
					<div
						className={`p-4 rounded-lg flex items-start gap-3 ${
							validationStatus.valid
								? "bg-green-50 border border-green-200"
								: "bg-red-50 border border-red-200"
						}`}
					>
						{validationStatus.valid ? (
							<>
								<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="font-semibold text-green-900">Invoice Eligible</h3>
									<p className="text-sm text-green-700">
										This invoice meets all requirements for E-Way Bill generation.
									</p>
								</div>
							</>
						) : (
							<>
								<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="font-semibold text-red-900">Validation Failed</h3>
									<ul className="text-sm text-red-700 mt-2 space-y-1">
										{validationStatus.errors.map((error, idx) => (
											<li key={idx}>
												<strong>{error.field}:</strong> {error.message}
											</li>
										))}
									</ul>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Transport Details Form */}
			{validationStatus.valid && (
				<div className="bg-white rounded-lg shadow-sm p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Transport Details</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Transport Mode <span className="text-red-500">*</span>
							</label>
							<select
								value={transportDetails.transportMode}
								onChange={(e) =>
									setTransportDetails({
										...transportDetails,
										transportMode: e.target.value as TransportDetails["transportMode"],
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								{transportModes.map((mode) => (
									<option key={mode.value} value={mode.value}>
										{mode.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Distance (km)
							</label>
							<input
								type="number"
								value={transportDetails.distance || ""}
								onChange={(e) =>
									setTransportDetails({
										...transportDetails,
										distance: parseInt(e.target.value) || undefined,
									})
								}
								placeholder="e.g., 350"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Transporter Name
							</label>
							<input
								type="text"
								value={transportDetails.transporterName || ""}
								onChange={(e) =>
									setTransportDetails({
										...transportDetails,
										transporterName: e.target.value,
									})
								}
								placeholder="e.g., ABC Logistics"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Transporter GSTIN
							</label>
							<input
								type="text"
								value={transportDetails.transporterGSTIN || ""}
								onChange={(e) =>
									setTransportDetails({
										...transportDetails,
										transporterGSTIN: e.target.value.toUpperCase(),
									})
								}
								placeholder="e.g., 27AABCT9999A1Z5"
								maxLength={15}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Vehicle Number
							</label>
							<input
								type="text"
								value={transportDetails.vehicleNumber || ""}
								onChange={(e) =>
									setTransportDetails({
										...transportDetails,
										vehicleNumber: e.target.value.toUpperCase(),
									})
								}
								placeholder="e.g., KA01AB1234"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
							/>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 mt-6">
						<button
							onClick={generateEWayBill}
							disabled={generating}
							className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<FileText className="w-4 h-4" />
							{generating ? "Generating..." : "Generate E-Way Bill"}
						</button>

						<button
							onClick={downloadJSON}
							className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
						>
							<Download className="w-4 h-4" />
							Download JSON
						</button>
					</div>
				</div>
			)}

			{/* Generated Data Preview */}
			{generatedData && (
				<div className="bg-white rounded-lg shadow-sm p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">Generated E-Way Bill</h2>
					<div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="font-medium text-gray-700">Document No:</span>
							<span className="ml-2 text-gray-900">{generatedData.docNo}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">Document Date:</span>
							<span className="ml-2 text-gray-900">{generatedData.docDate}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">From GSTIN:</span>
							<span className="ml-2 text-gray-900">{generatedData.fromGstin}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">To GSTIN:</span>
							<span className="ml-2 text-gray-900">{generatedData.toGstin}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">Total Value:</span>
							<span className="ml-2 text-gray-900">₹{generatedData.totalValue.toLocaleString()}</span>
						</div>
						<div>
							<span className="font-medium text-gray-700">Transport Mode:</span>
							<span className="ml-2 text-gray-900">
								{
									transportModes.find((m) => m.value === transportDetails.transportMode)
										?.label
								}
							</span>
						</div>
						{generatedData.vehicleNo && (
							<div className="col-span-2">
								<span className="font-medium text-gray-700">Vehicle No:</span>
								<span className="ml-2 text-gray-900">{generatedData.vehicleNo}</span>
							</div>
						)}
					</div>

					<details className="mt-4">
						<summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
							View Full JSON
						</summary>
						<pre className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
							{JSON.stringify(generatedData, null, 2)}
						</pre>
					</details>
				</div>
			)}

			{/* History Section */}
			<div className="bg-white rounded-lg shadow-sm p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold text-gray-900">Generation History</h2>
					<button
						onClick={() => setShowHistory(!showHistory)}
						className="text-sm text-blue-600 hover:text-blue-700"
					>
						{showHistory ? "Hide" : "Show"}
					</button>
				</div>

				{showHistory && history.length > 0 && (
					<div className="space-y-3">
						{history.map((record) => (
							<div
								key={record.id}
								className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<Truck className="w-4 h-4 text-gray-400 shrink-0" />
										<span className="text-sm font-medium text-gray-900 truncate">
											{record.transportMode || "ROAD"} Transport
										</span>
										{record.vehicleNumber && (
											<span className="text-sm text-gray-600 truncate">
												• {record.vehicleNumber}
											</span>
										)}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Generated: {new Date(record.generatedAt).toLocaleString()}
									</div>
								</div>
								<div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
									<span
										className={`inline-flex items-center justify-center min-w-[90px] px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
											record.status === "GENERATED"
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{record.status}
									</span>
									{record.status === "GENERATED" && (
										<button
											onClick={() => cancelEWayBill(record.id)}
											className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
										>
											Cancel
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{showHistory && history.length === 0 && (
					<p className="text-sm text-gray-500 text-center py-4">
						No E-Way Bills generated for this invoice yet.
					</p>
				)}
			</div>

			{/* Info Box */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 className="font-semibold text-blue-900 mb-2">About E-Way Bill</h3>
				<p className="text-sm text-blue-800 mb-2">
					E-Way Bill is required when goods valued over ₹50,000 are transported in India. It applies to:
				</p>
				<ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
					<li>Inter-state movement of goods</li>
					<li>Large intra-state shipments (state-specific)</li>
					<li>Transport by road, rail, air, or ship</li>
				</ul>
				<p className="text-sm text-blue-800 mt-3">
					<strong>Note:</strong> This tool generates the JSON file required for E-Way Bill portal
					upload. Vehicle details can be updated later before starting the journey.
				</p>
			</div>
		</div>
	);
}
