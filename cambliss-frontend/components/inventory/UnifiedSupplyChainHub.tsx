"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
	ShoppingCart,
	Zap,
	Boxes,
	AlertTriangle,
	FileText,
	Truck,
	CheckCircle2,
	Check,
	ArrowRight,
	Activity,
} from "lucide-react";

type SupplyChainTelemetry = {
	metrics: {
		productsCount: number;
		warehousesCount: number;
		totalUnitsInStock: number;
		lowStockAlerts: number;
		commerceOrdersCount: number;
		purchaseOrdersCount: number;
		draftPOsCount: number;
	};
	activeDraftPOs: Array<{
		id: string;
		status: string;
		totalAmount: number;
		vendor?: { companyName?: string; name?: string };
		items: Array<any>;
		createdAt: string;
	}>;
	auditEventFlow: Array<{
		id: string;
		timestamp: string;
		type: string;
		title: string;
		description: string;
		referenceId: string;
		status: "SUCCESS" | "WARNING" | "INFO";
	}>;
};

export default function UnifiedSupplyChainHub({
	onSwitchToPurchaseTab,
}: {
	onSwitchToPurchaseTab?: () => void;
}) {
	const [telemetry, setTelemetry] = useState<SupplyChainTelemetry | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionNotice, setActionNotice] = useState<string | null>(null);
	const [isAutoReordering, setIsAutoReordering] = useState(false);
	const [isSimulatingSale, setIsSimulatingSale] = useState(false);

	const fetchTelemetry = async () => {
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
			const headers: Record<string, string> = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}
			const res = await fetch("/api/inventory/supply-chain/overview", { headers });
			if (res.ok) {
				const data = await res.json();
				setTelemetry(data);
			}
		} catch {
			// fallback
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchTelemetry();
	}, []);

	const handleAutoReorder = async () => {
		setIsAutoReordering(true);
		setActionNotice(null);
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}
			const res = await fetch("/api/inventory/supply-chain/auto-reorder", {
				method: "POST",
				headers,
			});
			const data = await res.json();
			if (res.ok) {
				setActionNotice(data.message || "Draft Purchase Order created successfully!");
				await fetchTelemetry();
			} else {
				setActionNotice(data.message || "Unable to generate draft PO.");
			}
		} catch (e: any) {
			setActionNotice(`Error: ${e.message}`);
		} finally {
			setIsAutoReordering(false);
		}
	};

	const handleSimulateCommerceSale = async () => {
		setIsSimulatingSale(true);
		setActionNotice(null);
		try {
			const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}
			const simOrderId = `SIM-ORD-${Date.now().toString().slice(-4)}`;
			const res = await fetch("/api/inventory/supply-chain/sync-order", {
				method: "POST",
				headers,
				body: JSON.stringify({
					orderId: simOrderId,
					items: [{ title: "Chair", quantity: 5, unitPrice: 120 }],
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setActionNotice(
					`Simulated Commerce Order #${simOrderId}: 5 units sold. Warehouse inventory decremented & audit logged!`
				);
				await fetchTelemetry();
			} else {
				setActionNotice(data.message || "Simulation failed.");
			}
		} catch (e: any) {
			setActionNotice(`Error: ${e.message}`);
		} finally {
			setIsSimulatingSale(false);
		}
	};

	return (
		<div className="space-y-6 pt-2 text-[#1f2430]">
			{/* Top Interconnection Architecture Banner */}
			<div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-[#1e2547] via-[#2f3969] to-[#404d85] p-6 text-white shadow-md md:p-8">
				<div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#c9d4ea]">
							<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
							Circular Supply Chain & Procurement Engine
						</div>
						<h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
							Unified Commerce, Inventory & PO Command Center
						</h2>
						<p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#c9d4ea]">
							Every customer order on Storefront/POS decrements warehouse inventory in real time. When stock drops below reorder thresholds, automated Purchase Orders (POs) draft directly for suppliers, replenishing stock upon goods receipt.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<button
							onClick={handleSimulateCommerceSale}
							disabled={isSimulatingSale}
							className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-300 active:scale-95 disabled:opacity-70"
						>
							<ShoppingCart className="h-4 w-4" />
							<span>{isSimulatingSale ? "Simulating Sale..." : "Simulate Commerce Checkout"}</span>
						</button>

						<button
							onClick={handleAutoReorder}
							disabled={isAutoReordering}
							className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#323d6b] shadow-md hover:bg-[#f0f4fc] active:scale-95 disabled:opacity-70"
						>
							<Zap className="h-4 w-4 text-amber-500" />
							<span>{isAutoReordering ? "Generating POs..." : "1-Click Auto-Reorder PO"}</span>
						</button>
					</div>
				</div>
			</div>

			{/* Notice banner */}
			{actionNotice && (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-900 shadow-sm animate-in fade-in duration-200">
					{actionNotice}
				</div>
			)}

			{/* CIRCULAR SUPPLY CHAIN PIPELINE FLOW */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
					Live Interconnected Supply Chain Pipeline
				</h3>

				<div className="grid grid-cols-1 md:grid-cols-5 gap-3">
					{/* STEP 1: Commerce */}
					<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 relative group hover:border-[#404d85] transition">
						<div>
							<div className="flex items-center justify-between">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
									<ShoppingCart className="h-4 w-4" />
								</span>
								<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Step 1</span>
							</div>
							<h4 className="mt-2 text-xs font-bold text-slate-900">Commerce Sales</h4>
							<p className="mt-1 text-[11px] text-slate-500">Storefront & POS checkouts trigger real-time deduction.</p>
						</div>
						<div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-[#404d85]">
							{telemetry?.metrics.commerceOrdersCount ?? "--"} Orders Logged
						</div>
					</div>

					{/* STEP 2: Inventory */}
					<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 relative group hover:border-[#404d85] transition">
						<div>
							<div className="flex items-center justify-between">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
									<Boxes className="h-4 w-4" />
								</span>
								<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Step 2</span>
							</div>
							<h4 className="mt-2 text-xs font-bold text-slate-900">Warehouse Stock</h4>
							<p className="mt-1 text-[11px] text-slate-500">Decrements units & writes double-entry stock movement.</p>
						</div>
						<div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-[#404d85]">
							{telemetry?.metrics.totalUnitsInStock ?? "--"} Units Tracked
						</div>
					</div>

					{/* STEP 3: Low Stock Monitor */}
					<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 relative group hover:border-[#404d85] transition">
						<div>
							<div className="flex items-center justify-between">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
									<AlertTriangle className="h-4 w-4" />
								</span>
								<span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Step 3</span>
							</div>
							<h4 className="mt-2 text-xs font-bold text-slate-900">Reorder Threshold</h4>
							<p className="mt-1 text-[11px] text-slate-500">Evaluates current stock against minimum reorder level.</p>
						</div>
						<div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-amber-600">
							{telemetry?.metrics.lowStockAlerts ?? 0} Low Stock Alert(s)
						</div>
					</div>

					{/* STEP 4: Automated PO */}
					<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 relative group hover:border-[#404d85] transition">
						<div>
							<div className="flex items-center justify-between">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
									<FileText className="h-4 w-4" />
								</span>
								<span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">Step 4</span>
							</div>
							<h4 className="mt-2 text-xs font-bold text-slate-900">Purchase Order (PO)</h4>
							<p className="mt-1 text-[11px] text-slate-500">Auto-drafts PO for assigned vendor with calculated MOQ.</p>
						</div>
						<div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-[#404d85]">
							{telemetry?.metrics.purchaseOrdersCount ?? "--"} Total POs ({telemetry?.metrics.draftPOsCount ?? 0} Draft)
						</div>
					</div>

					{/* STEP 5: Goods Receipt */}
					<div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-4 relative group hover:border-[#404d85] transition">
						<div>
							<div className="flex items-center justify-between">
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
									<Truck className="h-4 w-4" />
								</span>
								<span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Step 5</span>
							</div>
							<h4 className="mt-2 text-xs font-bold text-slate-900">Receipt & Restock</h4>
							<p className="mt-1 text-[11px] text-slate-500">Warehouse accepts shipment (GRN) and restocks inventory.</p>
						</div>
						<div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-emerald-600">
							Stock Auto-Replenished
						</div>
					</div>
				</div>
			</div>

			{/* 2-COLUMN DISPLAY: RECENT TRACEABILITY STREAM & ACTIVE DRAFT POS */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* LEFT: Real-time Traceability Stream */}
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
					<div className="flex items-center justify-between border-b border-slate-100 pb-3">
						<div>
							<h3 className="text-sm font-bold text-slate-900">Real-Time Traceability Stream</h3>
							<p className="text-[11px] text-slate-500">Audit trail linking Customer Orders ➔ Stock ➔ Purchase Orders</p>
						</div>
						<span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
							Live Sync
						</span>
					</div>

					<div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
						{telemetry?.auditEventFlow && telemetry.auditEventFlow.length > 0 ? (
							telemetry.auditEventFlow.map((evt) => (
								<div
									key={evt.id}
									className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
								>
									<span
										className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
											evt.status === "WARNING"
												? "bg-amber-100 text-amber-700"
												: evt.status === "INFO"
												? "bg-purple-100 text-purple-700"
												: "bg-emerald-100 text-emerald-700"
										}`}
									>
										{evt.status === "WARNING" ? (
											<AlertTriangle className="h-3.5 w-3.5" />
										) : evt.status === "INFO" ? (
											<FileText className="h-3.5 w-3.5" />
										) : (
											<Check className="h-3.5 w-3.5" />
										)}
									</span>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<h5 className="font-bold text-slate-900">{evt.title}</h5>
											<span className="text-[10px] text-slate-400">
												{new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
											</span>
										</div>
										<p className="mt-0.5 text-slate-600 text-[11px]">{evt.description}</p>
										<span className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 border border-slate-200">
											Ref: {evt.referenceId}
										</span>
									</div>
								</div>
							))
						) : (
							<p className="text-xs text-slate-400 py-4 text-center">No recent events recorded yet.</p>
						)}
					</div>
				</div>

				{/* RIGHT: Active Draft & Pending Purchase Orders */}
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
					<div className="flex items-center justify-between border-b border-slate-100 pb-3">
						<div>
							<h3 className="text-sm font-bold text-slate-900">Active Draft Purchase Orders</h3>
							<p className="text-[11px] text-slate-500">Ready for procurement approval and vendor dispatch</p>
						</div>
						<button
							onClick={onSwitchToPurchaseTab}
							className="text-xs font-semibold text-[#404d85] hover:underline"
						>
							Manage in PO Tab →
						</button>
					</div>

					<div className="space-y-3 max-h-[380px] overflow-y-auto">
						{telemetry?.activeDraftPOs && telemetry.activeDraftPOs.length > 0 ? (
							telemetry.activeDraftPOs.map((po) => (
								<div
									key={po.id}
									className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-[#6678c1] bg-white"
								>
									<div className="flex items-center justify-between">
										<div>
											<span className="text-xs font-bold text-slate-900">
												PO #{po.id.slice(-6).toUpperCase()}
											</span>
											<p className="text-[11px] text-slate-500">
												Vendor: <strong>{po.vendor?.companyName || po.vendor?.name || "Global Supplies"}</strong>
											</p>
										</div>
										<span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-200">
											{po.status}
										</span>
									</div>

									<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
										<span className="text-slate-500 text-[11px]">
											{po.items?.length || 1} line item(s) bundled
										</span>
										<span className="font-bold text-slate-900">
											${Number(po.totalAmount || 0).toFixed(2)}
										</span>
									</div>
								</div>
							))
						) : (
							<div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
								<CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
								<h4 className="text-xs font-bold text-slate-700">No Pending Draft POs</h4>
								<p className="text-[11px] text-slate-500 max-w-xs mx-auto">
									All products have sufficient stock levels. Use "1-Click Auto-Reorder PO" to generate POs whenever stock falls below threshold.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
