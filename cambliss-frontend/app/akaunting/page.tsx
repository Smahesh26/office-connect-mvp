"use client";

import { useState, useEffect, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import Link from "next/link";

type AkauntingInvoice = {
	id: string;
	number: string;
	customer: string;
	amount: number;
	status: "paid" | "pending" | "overdue" | "draft";
	date: string;
	dueDate: string;
	category: string;
};

type AkauntingBill = {
	id: string;
	number: string;
	vendor: string;
	amount: number;
	status: "paid" | "unpaid" | "scheduled";
	date: string;
	category: string;
};

type AkauntingCustomer = {
	id: string;
	name: string;
	email: string;
	phone: string;
	balance: number;
};

export default function AkauntingPage() {
	return (
		<WorkspaceShell>
			<Suspense fallback={<div className="flex h-96 items-center justify-center">Loading Akaunting...</div>}>
				<AkauntingContent />
			</Suspense>
		</WorkspaceShell>
	);
}

function AkauntingContent() {
	const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "bills" | "customers" | "cloud">("overview");

	// Akaunting Cloud / Self-Hosted Instance URL configuration
	const [akauntingUrl, setAkauntingUrl] = useState("https://app.akaunting.com");
	const [customServerUrl, setCustomServerUrl] = useState("");
	const [isEmbeddedActive, setIsEmbeddedActive] = useState(false);

	// Invoices State
	const [invoices, setInvoices] = useState<AkauntingInvoice[]>([
		{ id: "1", number: "INV-2026-001", customer: "Acme Corp", amount: 4500.0, status: "paid", date: "2026-08-01", dueDate: "2026-08-15", category: "Software Development" },
		{ id: "2", number: "INV-2026-002", customer: "Starlight Media", amount: 2800.5, status: "pending", date: "2026-08-10", dueDate: "2026-08-25", category: "Consulting" },
		{ id: "3", number: "INV-2026-003", customer: "Global Logistics Ltd", amount: 6200.0, status: "overdue", date: "2026-07-20", dueDate: "2026-08-05", category: "ERP Integration" },
		{ id: "4", number: "INV-2026-004", customer: "Nexus Innovations", amount: 1950.0, status: "paid", date: "2026-08-18", dueDate: "2026-09-01", category: "Cloud Hosting" },
	]);

	// Bills State
	const [bills, setBills] = useState<AkauntingBill[]>([
		{ id: "1", number: "BIL-8801", vendor: "Amazon Web Services", amount: 1450.0, status: "paid", date: "2026-08-02", category: "Infrastructure" },
		{ id: "2", number: "BIL-8802", vendor: "GitHub Inc", amount: 240.0, status: "paid", date: "2026-08-05", category: "Developer Tools" },
		{ id: "3", number: "BIL-8803", vendor: "Office Supplies Co", amount: 680.0, status: "unpaid", date: "2026-08-15", category: "Operations" },
	]);

	// Customers State
	const [customers, setCustomers] = useState<AkauntingCustomer[]>([
		{ id: "1", name: "Acme Corp", email: "billing@acme.com", phone: "+1 (555) 019-2834", balance: 0.0 },
		{ id: "2", name: "Starlight Media", email: "accounts@starlight.io", phone: "+1 (555) 014-9921", balance: 2800.5 },
		{ id: "3", name: "Global Logistics Ltd", email: "finance@globallogistics.com", phone: "+44 20 7946 0912", balance: 6200.0 },
	]);

	// Invoice Modal State
	const [showInvoiceModal, setShowInvoiceModal] = useState(false);
	const [newCustomer, setNewCustomer] = useState("");
	const [newAmount, setNewAmount] = useState("");
	const [newCategory, setNewCategory] = useState("Software Services");

	// Bill Modal State
	const [showBillModal, setShowBillModal] = useState(false);
	const [newVendor, setNewVendor] = useState("");
	const [newBillAmount, setNewBillAmount] = useState("");
	const [newBillCategory, setNewBillCategory] = useState("Infrastructure");

	const handleAddInvoice = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCustomer || !newAmount) return;

		const created: AkauntingInvoice = {
			id: String(Date.now()),
			number: `INV-2026-00${invoices.length + 1}`,
			customer: newCustomer,
			amount: parseFloat(newAmount),
			status: "pending",
			date: new Date().toISOString().split("T")[0],
			dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
			category: newCategory,
		};

		setInvoices([created, ...invoices]);
		setNewCustomer("");
		setNewAmount("");
		setShowInvoiceModal(false);
	};

	const handleAddBill = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newVendor || !newBillAmount) return;

		const created: AkauntingBill = {
			id: String(Date.now()),
			number: `BIL-${Math.floor(8000 + Math.random() * 1000)}`,
			vendor: newVendor,
			amount: parseFloat(newBillAmount),
			status: "unpaid",
			date: new Date().toISOString().split("T")[0],
			category: newBillCategory,
		};

		setBills([created, ...bills]);
		setNewVendor("");
		setNewBillAmount("");
		setShowBillModal(false);
	};

	const totalIncome = invoices.filter((i) => i.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
	const totalPendingIncome = invoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((acc, curr) => acc + curr.amount, 0);
	const totalExpenses = bills.reduce((acc, curr) => acc + curr.amount, 0);
	const netProfit = totalIncome - totalExpenses;

	return (
		<div className="mx-auto max-w-7xl space-y-6 py-4">
			{/* Akaunting Header Banner */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-xl ring-1 ring-white/10">
				<div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
				<div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md shadow-inner text-2xl font-black text-emerald-300">
							⚡
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-2xl font-bold tracking-tight text-white">Akaunting Cloud & ERP Integration</h1>
								<span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
									Open Source Accounting
								</span>
							</div>
							<p className="mt-1 text-xs text-emerald-100/80">
								Free online accounting software designed for small businesses, freelancers, and enterprise finance teams.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<a
							href="https://github.com/akaunting/akaunting"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition border border-white/20 shadow-xs"
						>
							<svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
								<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
							</svg>
							GitHub Repository
						</a>
						<button
							type="button"
							onClick={() => setIsEmbeddedActive(!isEmbeddedActive)}
							className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow-md flex items-center gap-1.5"
						>
							<span>{isEmbeddedActive ? "📊 Open Native Workspace" : "🌐 Launch Embedded Akaunting Cloud"}</span>
						</button>
					</div>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Collected Income</p>
						<span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 text-sm font-bold">💰</span>
					</div>
					<p className="mt-2 text-2xl font-black text-zinc-900">${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
					<p className="mt-1 text-xs text-emerald-600 font-semibold">+$${totalPendingIncome.toLocaleString()} pending receivables</p>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Expenses</p>
						<span className="rounded-lg bg-rose-50 p-2 text-rose-600 text-sm font-bold">💳</span>
					</div>
					<p className="mt-2 text-2xl font-black text-zinc-900">${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
					<p className="mt-1 text-xs text-zinc-500 font-semibold">{bills.length} vendor bills recorded</p>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Net Operating Profit</p>
						<span className="rounded-lg bg-indigo-50 p-2 text-indigo-600 text-sm font-bold">📈</span>
					</div>
					<p className={`mt-2 text-2xl font-black ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
						${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</p>
					<p className="mt-1 text-xs text-emerald-600 font-semibold">Positive Cash Margin</p>
				</div>

				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Receivables</p>
						<span className="rounded-lg bg-amber-50 p-2 text-amber-600 text-sm font-bold">🧾</span>
					</div>
					<p className="mt-2 text-2xl font-black text-zinc-900">{invoices.filter((i) => i.status !== "paid").length} Invoices</p>
					<p className="mt-1 text-xs text-amber-600 font-semibold">Action required on overdue items</p>
				</div>
			</div>

			{/* Embedded Akaunting Cloud iFrame Mode */}
			{isEmbeddedActive ? (
				<div className="mt-4 flex h-[calc(100vh-220px)] w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
					<div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 text-xs text-white">
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
							<span className="font-bold">Akaunting Instance:</span>
							<span className="font-mono text-emerald-300">{customServerUrl || akauntingUrl}</span>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="text"
								placeholder="Enter Self-Hosted Akaunting URL (http://...)"
								value={customServerUrl}
								onChange={(e) => setCustomServerUrl(e.target.value)}
								className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-white placeholder-zinc-500 outline-none w-72"
							/>
							<button
								type="button"
								onClick={() => setIsEmbeddedActive(false)}
								className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition"
							>
								Close Embedded View
							</button>
						</div>
					</div>
					<iframe src={customServerUrl || akauntingUrl} className="h-full w-full border-none" title="Akaunting Cloud" allow="fullscreen" />
				</div>
			) : (
				/* Native Workspace Tabs */
				<div className="space-y-6">
					{/* Tab Buttons */}
					<div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-3">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setActiveTab("overview")}
								className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
									activeTab === "overview" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
								}`}
							>
								📊 Financial Dashboard
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("invoices")}
								className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
									activeTab === "invoices" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
								}`}
							>
								🧾 Invoices ({invoices.length})
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("bills")}
								className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
									activeTab === "bills" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
								}`}
							>
								💳 Bills & Expenses ({bills.length})
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("customers")}
								className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
									activeTab === "customers" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
								}`}
							>
								👥 Customers & Vendors
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("cloud")}
								className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
									activeTab === "cloud" ? "bg-emerald-600 text-white shadow-md" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
								}`}
							>
								⚙️ Docker & Self-Hosting
							</button>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowInvoiceModal(true)}
								className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs flex items-center gap-1.5"
							>
								<span>+</span> Create Invoice
							</button>
							<button
								type="button"
								onClick={() => setShowBillModal(true)}
								className="rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs flex items-center gap-1.5"
							>
								<span>+</span> Add Vendor Bill
							</button>
						</div>
					</div>

					{/* Overview Tab */}
					{activeTab === "overview" && (
						<div className="grid gap-6 lg:grid-cols-12">
							<div className="lg:col-span-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
								<h2 className="text-base font-bold text-zinc-900">Recent Accounting Transactions</h2>
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase">
											<tr>
												<th className="py-2.5 px-3">Type</th>
												<th className="py-2.5 px-3">Reference</th>
												<th className="py-2.5 px-3">Party</th>
												<th className="py-2.5 px-3">Amount</th>
												<th className="py-2.5 px-3">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
											{invoices.map((inv) => (
												<tr key={inv.id} className="hover:bg-zinc-50/80">
													<td className="py-3 px-3"><span className="font-bold text-emerald-600">INVOICE</span></td>
													<td className="py-3 px-3 font-mono font-bold">{inv.number}</td>
													<td className="py-3 px-3">{inv.customer}</td>
													<td className="py-3 px-3 font-bold text-zinc-900">${inv.amount.toLocaleString()}</td>
													<td className="py-3 px-3">
														<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
															inv.status === "paid" ? "bg-emerald-100 text-emerald-800" :
															inv.status === "overdue" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
														}`}>
															{inv.status.toUpperCase()}
														</span>
													</td>
												</tr>
											))}
											{bills.map((bill) => (
												<tr key={bill.id} className="hover:bg-zinc-50/80">
													<td className="py-3 px-3"><span className="font-bold text-rose-600">BILL</span></td>
													<td className="py-3 px-3 font-mono font-bold">{bill.number}</td>
													<td className="py-3 px-3">{bill.vendor}</td>
													<td className="py-3 px-3 font-bold text-zinc-900">${bill.amount.toLocaleString()}</td>
													<td className="py-3 px-3">
														<span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
															bill.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
														}`}>
															{bill.status.toUpperCase()}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							<div className="lg:col-span-4 space-y-4">
								<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-3">
									<h3 className="text-sm font-bold text-zinc-900">Akaunting Features & Capabilities</h3>
									<ul className="space-y-2 text-xs text-zinc-600">
										<li className="flex items-center gap-2">
											<span className="text-emerald-500">✓</span> Invoicing & Recurring Billing
										</li>
										<li className="flex items-center gap-2">
											<span className="text-emerald-500">✓</span> Expense Management & Receipt Capture
										</li>
										<li className="flex items-center gap-2">
											<span className="text-emerald-500">✓</span> Multi-Currency & Tax Automation
										</li>
										<li className="flex items-center gap-2">
											<span className="text-emerald-500">✓</span> Bank Account Reconciliation
										</li>
										<li className="flex items-center gap-2">
											<span className="text-emerald-500">✓</span> Client Portal & Self-Hosting Support
										</li>
									</ul>
								</div>

								<div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
									<p className="text-xs font-bold text-emerald-900">Akaunting Open Source Ecosystem</p>
									<p className="mt-1 text-xs text-emerald-700">
										Akaunting provides 50+ modular apps (REST API, Payment Gateways, Inventory Sync, POS). Easily host on your own server or connect your Akaunting Cloud instance.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Invoices Tab */}
					{activeTab === "invoices" && (
						<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold text-zinc-900">Client Sales Invoices</h2>
								<button
									type="button"
									onClick={() => setShowInvoiceModal(true)}
									className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
								>
									+ Create New Invoice
								</button>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase">
										<tr>
											<th className="py-3 px-3">Invoice #</th>
											<th className="py-3 px-3">Customer</th>
											<th className="py-3 px-3">Category</th>
											<th className="py-3 px-3">Date</th>
											<th className="py-3 px-3">Due Date</th>
											<th className="py-3 px-3">Amount</th>
											<th className="py-3 px-3">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 font-medium">
										{invoices.map((inv) => (
											<tr key={inv.id} className="hover:bg-zinc-50">
												<td className="py-3.5 px-3 font-mono font-bold text-indigo-600">{inv.number}</td>
												<td className="py-3.5 px-3 font-bold text-zinc-900">{inv.customer}</td>
												<td className="py-3.5 px-3 text-zinc-500">{inv.category}</td>
												<td className="py-3.5 px-3 text-zinc-600">{inv.date}</td>
												<td className="py-3.5 px-3 text-zinc-600">{inv.dueDate}</td>
												<td className="py-3.5 px-3 font-black text-zinc-900">${inv.amount.toFixed(2)}</td>
												<td className="py-3.5 px-3">
													<span
														className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
															inv.status === "paid"
																? "bg-emerald-100 text-emerald-800"
																: inv.status === "overdue"
																? "bg-rose-100 text-rose-800"
																: "bg-amber-100 text-amber-800"
														}`}
													>
														{inv.status.toUpperCase()}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Bills Tab */}
					{activeTab === "bills" && (
						<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold text-zinc-900">Vendor Bills & Expenses</h2>
								<button
									type="button"
									onClick={() => setShowBillModal(true)}
									className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs"
								>
									+ Add Vendor Bill
								</button>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase">
										<tr>
											<th className="py-3 px-3">Bill #</th>
											<th className="py-3 px-3">Vendor</th>
											<th className="py-3 px-3">Category</th>
											<th className="py-3 px-3">Date</th>
											<th className="py-3 px-3">Amount</th>
											<th className="py-3 px-3">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-100 font-medium">
										{bills.map((bill) => (
											<tr key={bill.id} className="hover:bg-zinc-50">
												<td className="py-3.5 px-3 font-mono font-bold text-zinc-700">{bill.number}</td>
												<td className="py-3.5 px-3 font-bold text-zinc-900">{bill.vendor}</td>
												<td className="py-3.5 px-3 text-zinc-500">{bill.category}</td>
												<td className="py-3.5 px-3 text-zinc-600">{bill.date}</td>
												<td className="py-3.5 px-3 font-black text-zinc-900">${bill.amount.toFixed(2)}</td>
												<td className="py-3.5 px-3">
													<span
														className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
															bill.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
														}`}
													>
														{bill.status.toUpperCase()}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Customers Tab */}
					{activeTab === "customers" && (
						<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
							<h2 className="text-lg font-bold text-zinc-900">Customer Accounts Ledger</h2>
							<div className="grid gap-4 md:grid-cols-3">
								{customers.map((c) => (
									<div key={c.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
										<p className="text-sm font-bold text-zinc-900">{c.name}</p>
										<p className="text-xs text-zinc-500">📧 {c.email}</p>
										<p className="text-xs text-zinc-500">📞 {c.phone}</p>
										<div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
											<span className="font-semibold text-zinc-600">Outstanding Balance:</span>
											<span className={`font-black ${c.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
												${c.balance.toFixed(2)}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Docker & Cloud Settings Tab */}
					{activeTab === "cloud" && (
						<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xs space-y-4">
							<h2 className="text-lg font-bold text-zinc-900">Self-Hosting Akaunting Docker Setup</h2>
							<p className="text-xs text-zinc-600">
								Akaunting can be self-hosted on your Hostinger VPS or local server using official Docker containers.
							</p>

							<div className="rounded-xl bg-zinc-900 p-4 text-xs font-mono text-emerald-400 space-y-2 overflow-x-auto">
								<p className="text-zinc-500"># 1. Clone the Akaunting Docker repository</p>
								<p>git clone https://github.com/akaunting/docker.git akaunting-docker</p>
								<p>cd akaunting-docker</p>
								<p className="text-zinc-500"># 2. Start Akaunting container on port 8080</p>
								<p>docker-compose up -d</p>
							</div>

							<div className="pt-4 border-t border-zinc-200 space-y-3">
								<label className="block text-xs font-bold text-zinc-700">Connect Self-Hosted Instance URL:</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={customServerUrl}
										onChange={(e) => setCustomServerUrl(e.target.value)}
										placeholder="e.g. http://200.141.13.198:8080 or https://akaunting.yourdomain.com"
										className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-emerald-600 focus:outline-none"
									/>
									<button
										type="button"
										onClick={() => setIsEmbeddedActive(true)}
										className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
									>
										Test Connection
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Create Invoice Modal */}
			{showInvoiceModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-base font-bold text-zinc-900">Create Akaunting Invoice</h3>
							<button type="button" onClick={() => setShowInvoiceModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
						</div>

						<form onSubmit={handleAddInvoice} className="space-y-3 text-xs">
							<div>
								<label className="block font-bold text-zinc-700 mb-1">Customer Name:</label>
								<input
									type="text"
									required
									value={newCustomer}
									onChange={(e) => setNewCustomer(e.target.value)}
									placeholder="e.g. Apex Global Solutions"
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								/>
							</div>

							<div>
								<label className="block font-bold text-zinc-700 mb-1">Invoice Amount ($):</label>
								<input
									type="number"
									step="0.01"
									required
									value={newAmount}
									onChange={(e) => setNewAmount(e.target.value)}
									placeholder="e.g. 3500.00"
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								/>
							</div>

							<div>
								<label className="block font-bold text-zinc-700 mb-1">Category:</label>
								<select
									value={newCategory}
									onChange={(e) => setNewCategory(e.target.value)}
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								>
									<option value="Software Services">Software Services</option>
									<option value="Consulting">Consulting</option>
									<option value="ERP Implementation">ERP Implementation</option>
									<option value="Product Sales">Product Sales</option>
								</select>
							</div>

							<div className="pt-2 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setShowInvoiceModal(false)}
									className="rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
								>
									Save Invoice
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Add Bill Modal */}
			{showBillModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-base font-bold text-zinc-900">Add Vendor Bill</h3>
							<button type="button" onClick={() => setShowBillModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
						</div>

						<form onSubmit={handleAddBill} className="space-y-3 text-xs">
							<div>
								<label className="block font-bold text-zinc-700 mb-1">Vendor Name:</label>
								<input
									type="text"
									required
									value={newVendor}
									onChange={(e) => setNewVendor(e.target.value)}
									placeholder="e.g. DigitalOcean Inc"
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								/>
							</div>

							<div>
								<label className="block font-bold text-zinc-700 mb-1">Bill Amount ($):</label>
								<input
									type="number"
									step="0.01"
									required
									value={newBillAmount}
									onChange={(e) => setNewBillAmount(e.target.value)}
									placeholder="e.g. 520.00"
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								/>
							</div>

							<div>
								<label className="block font-bold text-zinc-700 mb-1">Category:</label>
								<select
									value={newBillCategory}
									onChange={(e) => setNewBillCategory(e.target.value)}
									className="w-full rounded-xl border border-zinc-300 p-2.5 font-semibold text-zinc-900 focus:border-emerald-600 outline-none"
								>
									<option value="Infrastructure">Infrastructure</option>
									<option value="Developer Tools">Developer Tools</option>
									<option value="Operations">Operations</option>
									<option value="Marketing">Marketing</option>
								</select>
							</div>

							<div className="pt-2 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setShowBillModal(false)}
									className="rounded-xl border border-zinc-200 px-4 py-2 font-bold text-zinc-600 hover:bg-zinc-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white hover:bg-zinc-800"
								>
									Save Bill
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
