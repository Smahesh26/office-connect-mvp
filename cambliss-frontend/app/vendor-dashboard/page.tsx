"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, Suspense, FormEvent } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";

type VendorOrder = {
	id: string;
	customerName: string;
	customerEmail: string;
	itemsCount: number;
	totalAmount: number;
	vendorNetPayout: number;
	status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
	date: string;
	trackingNumber?: string;
};

type VendorProduct = {
	id: string;
	sku: string;
	title: string;
	category: string;
	price: number;
	wholesalePrice: number;
	stockQty: number;
	status: "Active" | "Out of Stock" | "Draft";
	salesCount: number;
	image: string;
};

export default function VendorDashboardPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f8fafc] font-sans text-[#1f2430]">Loading Vendor Seller Portal...</div>}>
			<WorkspaceShell>
				<VendorDashboardContent />
			</WorkspaceShell>
		</Suspense>
	);
}

function VendorDashboardContent() {
	const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PRODUCTS" | "ORDERS" | "PAYOUTS" | "SETTINGS">("OVERVIEW");
	const [isRegisteredVendor, setIsRegisteredVendor] = useState(true);
	const [showAddProductModal, setShowAddProductModal] = useState(false);
	const [showRegisterVendorModal, setShowRegisterVendorModal] = useState(false);

	// Vendor Profile State
	const [vendorProfile, setVendorProfile] = useState({
		storeName: "Glow Beauty Organics 🌸",
		ownerEmail: "care@glowbeautyorganics.com",
		phone: "+1 (555) 382-9102",
		category: "Beauty & Personal Care",
		commissionRate: 8.5, // 8.5% platform fee
		payoutStatus: "Connected (Stripe Auto Payout)",
		totalEarnings: 44148.75,
		grossSales: 48250.00,
		totalOrders: 342,
		location: "Paris, France 🇫🇷",
		joinedDate: "2026-08-15"
	});

	// Vendor Product Catalog
	const [products, setProducts] = useState<VendorProduct[]>([
		{
			id: "vp-1",
			sku: "SKU-BEAUTY-ROSE-01",
			title: "Damask Rose Botanical Hydrating Serum",
			category: "Beauty & Personal Care",
			price: 68.00,
			wholesalePrice: 48.00,
			stockQty: 240,
			status: "Active",
			salesCount: 188,
			image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
		},
		{
			id: "vp-2",
			sku: "SKU-BEAUTY-LIP-02",
			title: "Organic Damask Rose Lip Elixir",
			category: "Beauty & Personal Care",
			price: 32.00,
			wholesalePrice: 22.00,
			stockQty: 85,
			status: "Active",
			salesCount: 94,
			image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80"
		}
	]);

	// Vendor Incoming Orders
	const [orders, setOrders] = useState<VendorOrder[]>([
		{
			id: "ORD-94021",
			customerName: "Sarah Jenkins",
			customerEmail: "sarah.j@example.com",
			itemsCount: 2,
			totalAmount: 136.00,
			vendorNetPayout: 124.44, // After 8.5% fee
			status: "Processing",
			date: "2026-08-31 09:20 AM",
			trackingNumber: "TRK-98240-US"
		},
		{
			id: "ORD-94018",
			customerName: "Robert Chen",
			customerEmail: "r.chen@company.org",
			itemsCount: 5,
			totalAmount: 340.00,
			vendorNetPayout: 311.10,
			status: "Shipped",
			date: "2026-08-30 04:15 PM",
			trackingNumber: "TRK-98112-US"
		},
		{
			id: "ORD-94005",
			customerName: "Emily Watson",
			customerEmail: "emily.w@gmail.com",
			itemsCount: 1,
			totalAmount: 68.00,
			vendorNetPayout: 62.22,
			status: "Delivered",
			date: "2026-08-29 11:40 AM",
			trackingNumber: "TRK-97994-US"
		}
	]);

	// New Product Form State
	const [newProd, setNewProd] = useState({
		title: "",
		sku: "",
		category: "Beauty & Personal Care",
		price: "",
		wholesalePrice: "",
		stockQty: "",
		image: "",
		description: ""
	});

	const handleAddProduct = (e: FormEvent) => {
		e.preventDefault();
		if (!newProd.title || !newProd.price) return;
		const created: VendorProduct = {
			id: `vp-${Date.now()}`,
			sku: newProd.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
			title: newProd.title,
			category: newProd.category,
			price: parseFloat(newProd.price),
			wholesalePrice: parseFloat(newProd.wholesalePrice || newProd.price),
			stockQty: parseInt(newProd.stockQty || "10"),
			status: "Active",
			salesCount: 0,
			image: newProd.image || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
		};
		setProducts([created, ...products]);
		setShowAddProductModal(false);
		setNewProd({ title: "", sku: "", category: "Beauty & Personal Care", price: "", wholesalePrice: "", stockQty: "", image: "", description: "" });
		alert("🎉 Product successfully published to live Marketplace Storefront!");
	};

	const updateOrderStatus = (orderId: string, newStatus: VendorOrder["status"]) => {
		setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
	};

	return (
		<div className="space-y-6">

			{/* VENDOR DASHBOARD HEADER BANNER */}
			<div className="rounded-3xl bg-gradient-to-r from-[#1f2430] via-[#252f5a] to-[#404d85] text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
				<div className="flex items-center gap-5">
					<div className="h-16 w-16 rounded-2xl bg-white border-2 border-white/30 shadow-lg flex items-center justify-center text-3xl shrink-0">
						🌸
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-black">{vendorProfile.storeName}</h1>
							<span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-0.5 text-xs font-bold text-emerald-200">
								✓ Verified Seller Store
							</span>
						</div>
						<p className="text-xs text-blue-100 mt-1 font-medium">
							Platform Commission Cut: <span className="font-bold text-amber-300">{vendorProfile.commissionRate}%</span> • Payout Status: <span className="font-bold text-emerald-300">{vendorProfile.payoutStatus}</span>
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<button
						onClick={() => setShowAddProductModal(true)}
						className="rounded-2xl bg-white px-5 py-3 text-xs font-bold text-[#404d85] shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5"
					>
						+ Add New Product Listing
					</button>
					<Link
						href="/storefront?vendor=v-glow-beauty"
						className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
					>
						View Live Storefront ↗
					</Link>
				</div>
			</div>

			{/* KPI STAT CARDS (4 CARDS) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
					<div className="text-xs font-bold text-zinc-500">Gross Sales Revenue</div>
					<div className="text-2xl font-black text-[#1f2430]">${vendorProfile.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
					<div className="text-[11px] text-emerald-600 font-bold">↑ 18.4% from last month</div>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
					<div className="text-xs font-bold text-zinc-500">Net Seller Payout (After Commission)</div>
					<div className="text-2xl font-black text-emerald-600">${vendorProfile.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
					<div className="text-[11px] text-blue-600 font-bold">🟢 Auto-Deposit to Stripe</div>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
					<div className="text-xs font-bold text-zinc-500">Total Customer Orders</div>
					<div className="text-2xl font-black text-[#404d85]">{vendorProfile.totalOrders}</div>
					<div className="text-[11px] text-zinc-400 font-medium">Fulfillment Rate: 99.2%</div>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-1">
					<div className="text-xs font-bold text-zinc-500">Active Listed Products</div>
					<div className="text-2xl font-black text-[#1f2430]">{products.length}</div>
					<div className="text-[11px] text-emerald-600 font-bold">In-Stock & Verified</div>
				</div>
			</div>

			{/* SELLER NAVIGATION TAB SYSTEM */}
			<div className="border-b border-zinc-200 bg-white rounded-2xl p-2 shadow-sm flex flex-wrap gap-2 text-xs font-bold text-[#404d85]">
				{[
					{ id: "OVERVIEW", label: "📊 Overview & Performance" },
					{ id: "PRODUCTS", label: `📦 Products & Inventory (${products.length})` },
					{ id: "ORDERS", label: `🚚 Orders & Fulfillment (${orders.length})` },
					{ id: "PAYOUTS", label: "💳 Earnings & Payout History" },
					{ id: "SETTINGS", label: "⚙️ Store Profile Settings" }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						className={`px-4 py-2.5 rounded-xl transition ${
							activeTab === tab.id
								? "bg-[#404d85] text-white shadow-md"
								: "hover:bg-zinc-100 text-zinc-700"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* TAB 1: OVERVIEW & PERFORMANCE */}
			{activeTab === "OVERVIEW" && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					{/* Recent Incoming Orders Stream */}
					<div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
						<div className="flex justify-between items-center border-b border-zinc-100 pb-3">
							<h3 className="font-extrabold text-sm text-[#404d85]">Recent Incoming Orders</h3>
							<button onClick={() => setActiveTab("ORDERS")} className="text-xs font-bold text-[#6678c1] hover:underline">
								View All Orders →
							</button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase text-[10px]">
										<th className="pb-2">Order ID</th>
										<th className="pb-2">Customer</th>
										<th className="pb-2">Amount</th>
										<th className="pb-2">Net Payout</th>
										<th className="pb-2">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100">
									{orders.map((o) => (
										<tr key={o.id} className="hover:bg-zinc-50 font-medium">
											<td className="py-3 font-bold text-[#404d85]">{o.id}</td>
											<td className="py-3">{o.customerName}</td>
											<td className="py-3 font-bold text-zinc-900">${o.totalAmount.toFixed(2)}</td>
											<td className="py-3 font-bold text-emerald-600">${o.vendorNetPayout.toFixed(2)}</td>
											<td className="py-3">
												<span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
													o.status === "Processing" ? "bg-amber-100 text-amber-800" :
													o.status === "Shipped" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
												}`}>
													{o.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Top Selling Products Column */}
					<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
						<h3 className="font-extrabold text-sm text-[#404d85] border-b border-zinc-100 pb-3">Top Selling Products</h3>
						<div className="space-y-4">
							{products.map((p) => (
								<div key={p.id} className="flex items-center gap-3">
									<img src={p.image} alt={p.title} className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shadow-sm shrink-0" />
									<div className="flex-1 min-w-0">
										<h4 className="font-bold text-xs text-[#1f2430] truncate">{p.title}</h4>
										<div className="text-[11px] text-zinc-500 font-medium">${p.price.toFixed(2)} • {p.salesCount} sold</div>
									</div>
								</div>
							))}
						</div>
					</div>

				</div>
			)}

			{/* TAB 2: PRODUCTS & INVENTORY */}
			{activeTab === "PRODUCTS" && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
						<div>
							<h3 className="font-extrabold text-base text-[#404d85]">Live Product Catalog ({products.length})</h3>
							<p className="text-xs text-zinc-500">Manage pricing, inventory stock, and B2B wholesale tiers</p>
						</div>
						<button
							onClick={() => setShowAddProductModal(true)}
							className="rounded-xl bg-[#404d85] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]"
						>
							+ Add Product Listing
						</button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead>
								<tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase text-[10px]">
									<th className="pb-3">Product</th>
									<th className="pb-3">SKU</th>
									<th className="pb-3">Retail Price</th>
									<th className="pb-3">B2B Wholesale</th>
									<th className="pb-3">Stock Quantity</th>
									<th className="pb-3">Status</th>
									<th className="pb-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100">
								{products.map((p) => (
									<tr key={p.id} className="hover:bg-zinc-50 font-medium">
										<td className="py-3 flex items-center gap-3">
											<img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0" />
											<div>
												<div className="font-bold text-[#1f2430]">{p.title}</div>
												<div className="text-[10px] text-zinc-400">{p.category}</div>
											</div>
										</td>
										<td className="py-3 font-mono text-zinc-600">{p.sku}</td>
										<td className="py-3 font-bold text-zinc-900">${p.price.toFixed(2)}</td>
										<td className="py-3 font-bold text-blue-600">${p.wholesalePrice.toFixed(2)}</td>
										<td className="py-3">
											<span className={`font-bold ${p.stockQty < 10 ? "text-rose-600" : "text-emerald-600"}`}>
												{p.stockQty} units
											</span>
										</td>
										<td className="py-3">
											<span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
												{p.status}
											</span>
										</td>
										<td className="py-3 text-right">
											<button className="text-xs font-bold text-[#404d85] hover:underline mr-3">Edit</button>
											<button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="text-xs font-bold text-rose-600 hover:underline">
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* TAB 3: ORDERS & FULFILLMENT */}
			{activeTab === "ORDERS" && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
					<div className="border-b border-zinc-100 pb-4">
						<h3 className="font-extrabold text-base text-[#404d85]">Customer Orders & Fulfillment ({orders.length})</h3>
						<p className="text-xs text-zinc-500">Update order status and assign carrier tracking numbers</p>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs">
							<thead>
								<tr className="border-b border-zinc-200 text-zinc-400 font-bold uppercase text-[10px]">
									<th className="pb-3">Order ID</th>
									<th className="pb-3">Customer Email</th>
									<th className="pb-3">Total Amount</th>
									<th className="pb-3">Seller Net</th>
									<th className="pb-3">Tracking Number</th>
									<th className="pb-3">Fulfillment Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-100">
								{orders.map((o) => (
									<tr key={o.id} className="hover:bg-zinc-50 font-medium">
										<td className="py-3 font-bold text-[#404d85]">{o.id}</td>
										<td className="py-3">{o.customerEmail}</td>
										<td className="py-3 font-bold text-zinc-900">${o.totalAmount.toFixed(2)}</td>
										<td className="py-3 font-bold text-emerald-600">${o.vendorNetPayout.toFixed(2)}</td>
										<td className="py-3 font-mono text-zinc-600">{o.trackingNumber || "N/A"}</td>
										<td className="py-3">
											<select
												value={o.status}
												onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
												className="rounded-xl border border-zinc-300 p-1.5 text-xs font-bold text-[#404d85] focus:outline-none"
											>
												<option value="Processing">Processing</option>
												<option value="Shipped">Shipped</option>
												<option value="Delivered">Delivered</option>
												<option value="Cancelled">Cancelled</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* TAB 4: EARNINGS & PAYOUT HISTORY */}
			{activeTab === "PAYOUTS" && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
					<div className="flex justify-between items-center border-b border-zinc-100 pb-4">
						<div>
							<h3 className="font-extrabold text-base text-[#404d85]">Payout Earnings & Commission Split</h3>
							<p className="text-xs text-zinc-500">Platform fee: 8.5% per sale • Automated Stripe Connect payouts</p>
						</div>
						<button onClick={() => alert("🎉 Request submitted! Funds will arrive in your bank account in 24 hours.")} className="rounded-xl bg-emerald-600 text-white font-bold px-4 py-2 text-xs shadow-md hover:bg-emerald-700">
							💳 Request Instant Withdrawal
						</button>
					</div>

					<div className="bg-[#f8fafc] p-4 rounded-2xl border border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
						<div>
							<div className="text-zinc-500">Gross Sales</div>
							<div className="text-xl font-black text-zinc-900">${vendorProfile.grossSales.toFixed(2)}</div>
						</div>
						<div>
							<div className="text-zinc-500">Platform Fee (8.5%)</div>
							<div className="text-xl font-black text-rose-600">-${(vendorProfile.grossSales * 0.085).toFixed(2)}</div>
						</div>
						<div>
							<div className="text-zinc-500">Net Seller Payout</div>
							<div className="text-xl font-black text-emerald-600">${vendorProfile.totalEarnings.toFixed(2)}</div>
						</div>
					</div>
				</div>
			)}

			{/* ADD PRODUCT MODAL */}
			{showAddProductModal && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
					<div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative border border-zinc-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
						<button onClick={() => setShowAddProductModal(false)} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 font-bold text-xl">✕</button>
						<h2 className="text-xl font-extrabold text-[#404d85]">+ Add Product to Marketplace Store</h2>
						<form onSubmit={handleAddProduct} className="space-y-3 text-xs font-medium">
							<div>
								<label className="block font-bold text-zinc-700">Product Title *</label>
								<input
									type="text"
									required
									placeholder="e.g. Organic Rose Botanical Serum"
									value={newProd.title}
									onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
									className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">SKU Code</label>
									<input
										type="text"
										placeholder="SKU-ROSE-01"
										value={newProd.sku}
										onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
									/>
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Category *</label>
									<select
										value={newProd.category}
										onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-[#404d85]"
									>
										<option value="Beauty & Personal Care">Beauty & Personal Care</option>
										<option value="Electronics & Gadgets">Electronics & Gadgets</option>
										<option value="Enterprise Software & Cloud">Enterprise Software & Cloud</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="block font-bold text-zinc-700">Retail Price ($) *</label>
									<input
										type="number"
										step="0.01"
										required
										placeholder="68.00"
										value={newProd.price}
										onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-emerald-600"
									/>
								</div>
								<div>
									<label className="block font-bold text-zinc-700">B2B Wholesale ($)</label>
									<input
										type="number"
										step="0.01"
										placeholder="48.00"
										value={newProd.wholesalePrice}
										onChange={(e) => setNewProd({ ...newProd, wholesalePrice: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-bold text-blue-600"
									/>
								</div>
								<div>
									<label className="block font-bold text-zinc-700">Stock Qty</label>
									<input
										type="number"
										placeholder="240"
										value={newProd.stockQty}
										onChange={(e) => setNewProd({ ...newProd, stockQty: e.target.value })}
										className="w-full rounded-xl border border-zinc-300 p-3 text-xs"
									/>
								</div>
							</div>

							<div>
								<label className="block font-bold text-zinc-700">Product Image URL</label>
								<input
									type="url"
									placeholder="https://images.unsplash.com/..."
									value={newProd.image}
									onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
									className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-mono"
								/>
							</div>

							<button
								type="submit"
								className="w-full rounded-xl bg-[#404d85] py-3.5 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a] transition"
							>
								Publish Product to Live Marketplace
							</button>
						</form>
					</div>
				</div>
			)}

		</div>
	);
}
