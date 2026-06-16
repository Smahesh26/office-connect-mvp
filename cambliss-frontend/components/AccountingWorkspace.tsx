"use client";

import { useEffect, useMemo, useState } from "react";
import FinanceDashboard from "@/components/FinanceDashboard";

type TabId = "dashboard" | "coa" | "periods" | "reports" | "invoicing";
type InvoicePdfTemplate = "classic" | "minimal" | "detailed";

const INVOICE_TEMPLATE_STORAGE_PREFIX = "accounting.invoicePdfTemplate";

interface LedgerAccount {
	id: string;
	name: string;
	code: string | null;
	type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
	isSystem?: boolean;
}

interface AccountingPeriod {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	isLocked: boolean;
}

interface TrialBalanceRow {
	ledgerId: string;
	ledgerName: string;
	ledgerCode: string | null;
	ledgerType: string;
	totalDebit: number;
	totalCredit: number;
	balance: number;
}

interface TrialBalanceResponse {
	ledgers: TrialBalanceRow[];
	grandTotalDebit: number;
	grandTotalCredit: number;
}

interface ProfitLossResponse {
	totalIncome: number;
	totalExpense: number;
	netProfit: number;
}

interface BalanceSheetResponse {
	totalAssets: number;
	totalLiabilities: number;
	totalEquity: number;
	isBalanced: boolean;
}

interface InvoiceListRow {
	id: string;
	invoiceNumber: string;
	status: string;
	issuedAt: string;
	totalAmount: number;
	allocatedAmount: number;
	outstandingAmount: number;
	daysSinceIssue: number;
	isOverdue: boolean;
	customer?: {
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		email?: string | null;
	} | null;
}

interface FollowUpRow {
	invoiceId: string;
	invoiceNumber: string;
	outstandingAmount: number;
	daysSinceIssue: number;
	recommendedAction: string;
	customer?: {
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		email?: string | null;
	} | null;
}

const tabs: Array<{ id: TabId; label: string }> = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "coa", label: "Chart of Accounts" },
	{ id: "periods", label: "Accounting Periods" },
	{ id: "reports", label: "Reports" },
	{ id: "invoicing", label: "Invoicing" },
];

const formatINR = (value: number) =>
	`Rs ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getAuthHeaders = () => {
	const token = localStorage.getItem("authToken");
	return {
		"Content-Type": "application/json",
		Authorization: token ? `Bearer ${token}` : "",
	};
};

const getTemplateStorageKey = () => {
	try {
		const authUserRaw = localStorage.getItem("authUser");
		if (!authUserRaw) {
			return `${INVOICE_TEMPLATE_STORAGE_PREFIX}.default`;
		}

		const authUser = JSON.parse(authUserRaw) as { organizationId?: string; id?: string };
		const scopeId = authUser.organizationId ?? authUser.id ?? "default";
		return `${INVOICE_TEMPLATE_STORAGE_PREFIX}.${scopeId}`;
	} catch {
		return `${INVOICE_TEMPLATE_STORAGE_PREFIX}.default`;
	}
};

export default function AccountingWorkspace() {
	const [activeTab, setActiveTab] = useState<TabId>("dashboard");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
	const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
	const [trialBalance, setTrialBalance] = useState<TrialBalanceResponse | null>(null);
	const [profitLoss, setProfitLoss] = useState<ProfitLossResponse | null>(null);
	const [balanceSheet, setBalanceSheet] = useState<BalanceSheetResponse | null>(null);
	const [invoices, setInvoices] = useState<InvoiceListRow[]>([]);
	const [followUps, setFollowUps] = useState<FollowUpRow[]>([]);
	const [pdfTemplate, setPdfTemplate] = useState<InvoicePdfTemplate>("classic");
	const [draftOrderId, setDraftOrderId] = useState("");
	const [isTemplateHydrated, setIsTemplateHydrated] = useState(false);

	useEffect(() => {
		const loadTemplate = async () => {
			const saved = localStorage.getItem(getTemplateStorageKey());
			if (saved === "classic" || saved === "minimal" || saved === "detailed") {
				setPdfTemplate(saved);
			}

			try {
				const response = await fetch("/api/accounting/preferences", {
					method: "GET",
					headers: getAuthHeaders(),
				});

				if (response.ok) {
					const data = (await response.json()) as { defaultInvoicePdfTemplate?: string };
					const remote = data.defaultInvoicePdfTemplate;
					if (remote === "classic" || remote === "minimal" || remote === "detailed") {
						setPdfTemplate(remote);
						localStorage.setItem(getTemplateStorageKey(), remote);
					}
				}
			} finally {
				setIsTemplateHydrated(true);
			}
		};

		void loadTemplate();
	}, []);

	useEffect(() => {
		if (!isTemplateHydrated) {
			return;
		}

		localStorage.setItem(getTemplateStorageKey(), pdfTemplate);

		void fetch("/api/accounting/preferences", {
			method: "PATCH",
			headers: getAuthHeaders(),
			body: JSON.stringify({ defaultInvoicePdfTemplate: pdfTemplate }),
		}).catch(() => {
			// Ignore network issues and keep local preference.
		});
	}, [pdfTemplate, isTemplateHydrated]);

	const lockedCount = useMemo(() => periods.filter((period) => period.isLocked).length, [periods]);

	const loadChartOfAccounts = async () => {
		const response = await fetch("/api/accounting/chart-of-accounts", {
			method: "GET",
			headers: getAuthHeaders(),
		});
		if (!response.ok) {
			throw new Error("Failed to load chart of accounts");
		}
		const data = (await response.json()) as LedgerAccount[];
		setAccounts(data);
	};

	const loadPeriods = async () => {
		const response = await fetch("/api/accounting/periods", {
			method: "GET",
			headers: getAuthHeaders(),
		});
		if (!response.ok) {
			throw new Error("Failed to load accounting periods");
		}
		const data = (await response.json()) as AccountingPeriod[];
		setPeriods(data);
	};

	const loadReports = async () => {
		const [trialBalanceRes, profitLossRes, balanceSheetRes] = await Promise.all([
			fetch("/api/accounting/trial-balance", { method: "GET", headers: getAuthHeaders() }),
			fetch("/api/accounting/profit-loss", { method: "GET", headers: getAuthHeaders() }),
			fetch("/api/accounting/balance-sheet", { method: "GET", headers: getAuthHeaders() }),
		]);

		if (!trialBalanceRes.ok || !profitLossRes.ok || !balanceSheetRes.ok) {
			throw new Error("Failed to load accounting reports");
		}

		setTrialBalance((await trialBalanceRes.json()) as TrialBalanceResponse);
		setProfitLoss((await profitLossRes.json()) as ProfitLossResponse);
		setBalanceSheet((await balanceSheetRes.json()) as BalanceSheetResponse);
	};

	const loadInvoicingData = async () => {
		const [invoicesRes, followUpsRes] = await Promise.all([
			fetch("/api/invoices/list", { method: "GET", headers: getAuthHeaders() }),
			fetch("/api/invoices/follow-ups?afterDays=30", { method: "GET", headers: getAuthHeaders() }),
		]);

		if (!invoicesRes.ok || !followUpsRes.ok) {
			throw new Error("Failed to load invoicing data");
		}

		setInvoices((await invoicesRes.json()) as InvoiceListRow[]);
		setFollowUps((await followUpsRes.json()) as FollowUpRow[]);
	};

	const loadTabData = async (tab: TabId) => {
		setError(null);
		if (tab === "dashboard") {
			return;
		}

		setLoading(true);
		try {
			if (tab === "coa") {
				await loadChartOfAccounts();
			}
			if (tab === "periods") {
				await loadPeriods();
			}
			if (tab === "reports") {
				await loadReports();
			}
			if (tab === "invoicing") {
				await loadInvoicingData();
			}
		} catch (err: any) {
			setError(err?.message ?? "Failed to load accounting data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadTabData(activeTab);
	}, [activeTab]);

	const togglePeriodLock = async (period: AccountingPeriod) => {
		setError(null);
		setLoading(true);
		try {
			const response = await fetch(`/api/accounting/periods/${period.id}/lock`, {
				method: "PATCH",
				headers: getAuthHeaders(),
				body: JSON.stringify({ isLocked: !period.isLocked }),
			});

			if (!response.ok) {
				throw new Error("Failed to update period lock status");
			}

			await loadPeriods();
		} catch (err: any) {
			setError(err?.message ?? "Failed to update period");
		} finally {
			setLoading(false);
		}
	};

	const createCreditNote = async (invoiceId: string, outstandingAmount: number) => {
		setError(null);
		setLoading(true);
		try {
			const response = await fetch("/api/invoices/credit-note", {
				method: "POST",
				headers: getAuthHeaders(),
				body: JSON.stringify({
					invoiceId,
					amount: outstandingAmount,
					reason: "Customer credit note from Accounting workspace",
				}),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to create credit note");
			}

			await loadInvoicingData();
		} catch (err: any) {
			setError(err?.message ?? "Failed to create credit note");
		} finally {
			setLoading(false);
		}
	};

	const downloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
		setError(null);
		setLoading(true);
		try {
			const response = await fetch(`/api/invoices/${invoiceId}/pdf?template=${pdfTemplate}`, {
				method: "GET",
				headers: {
					Authorization: getAuthHeaders().Authorization,
				},
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to generate invoice PDF");
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `${invoiceNumber}-${pdfTemplate}.pdf`;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);
		} catch (err: any) {
			setError(err?.message ?? "Failed to download invoice PDF");
		} finally {
			setLoading(false);
		}
	};

	const createDraftFromOrder = async () => {
		if (!draftOrderId.trim()) {
			setError("Enter an Order ID to generate draft invoice");
			return;
		}

		setError(null);
		setLoading(true);
		try {
			const response = await fetch("/api/invoices/draft-from-order", {
				method: "POST",
				headers: getAuthHeaders(),
				body: JSON.stringify({ orderId: draftOrderId.trim() }),
			});

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { message?: string } | null;
				throw new Error(payload?.message ?? "Failed to generate draft invoice");
			}

			setDraftOrderId("");
			await loadInvoicingData();
		} catch (err: any) {
			setError(err?.message ?? "Failed to generate draft invoice");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
				<div className="flex flex-wrap gap-2">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
								activeTab === tab.id
									? "bg-black text-white"
									: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
				{error && <p className="mt-3 text-sm text-red-600">{error}</p>}
			</div>

			{activeTab === "dashboard" && <FinanceDashboard />}

			{activeTab === "coa" && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold text-zinc-900">Chart of Accounts</h2>
						<button
							onClick={() => void loadTabData("coa")}
							disabled={loading}
							className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
						>
							{loading ? "Refreshing..." : "Refresh"}
						</button>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="border-b border-zinc-200 text-left text-zinc-600">
									<th className="py-2 pr-3">Code</th>
									<th className="py-2 pr-3">Name</th>
									<th className="py-2 pr-3">Type</th>
									<th className="py-2">Scope</th>
								</tr>
							</thead>
							<tbody>
								{accounts.map((account) => (
									<tr key={account.id} className="border-b border-zinc-100 text-zinc-800">
										<td className="py-2 pr-3">{account.code ?? "-"}</td>
										<td className="py-2 pr-3">{account.name}</td>
										<td className="py-2 pr-3">{account.type}</td>
										<td className="py-2">{account.isSystem ? "System" : "Custom"}</td>
									</tr>
								))}
							</tbody>
						</table>
						{!loading && accounts.length === 0 && (
							<p className="py-4 text-sm text-zinc-500">No ledger accounts found yet.</p>
						)}
					</div>
				</div>
			)}

			{activeTab === "periods" && (
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-zinc-900">Accounting Periods</h2>
							<p className="text-sm text-zinc-600">Locked: {lockedCount} of {periods.length}</p>
						</div>
						<button
							onClick={() => void loadTabData("periods")}
							disabled={loading}
							className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
						>
							{loading ? "Refreshing..." : "Refresh"}
						</button>
					</div>
					<div className="space-y-3">
						{periods.map((period) => (
							<div
								key={period.id}
								className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-zinc-900">{period.name}</p>
									<p className="text-sm text-zinc-600">
										{new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
									</p>
								</div>
								<button
									onClick={() => void togglePeriodLock(period)}
									disabled={loading}
									className={`rounded-lg px-3 py-2 text-sm font-medium ${
										period.isLocked
											? "bg-amber-100 text-amber-900"
											: "bg-emerald-100 text-emerald-900"
									}`}
								>
									{period.isLocked ? "Unlock Period" : "Lock Period"}
								</button>
							</div>
						))}
						{!loading && periods.length === 0 && (
							<p className="py-4 text-sm text-zinc-500">No accounting periods created yet.</p>
						)}
					</div>
				</div>
			)}

			{activeTab === "reports" && (
				<div className="space-y-4">
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-zinc-900">Financial Reports</h2>
							<button
								onClick={() => void loadTabData("reports")}
								disabled={loading}
								className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
							>
								{loading ? "Refreshing..." : "Refresh"}
							</button>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Total Income</p>
								<p className="text-xl font-semibold text-zinc-900">{formatINR(profitLoss?.totalIncome ?? 0)}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Total Expense</p>
								<p className="text-xl font-semibold text-zinc-900">{formatINR(profitLoss?.totalExpense ?? 0)}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Net Profit</p>
								<p className="text-xl font-semibold text-zinc-900">{formatINR(profitLoss?.netProfit ?? 0)}</p>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<h3 className="mb-3 text-base font-semibold text-zinc-900">Balance Sheet Check</h3>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Assets</p>
								<p className="text-lg font-semibold text-zinc-900">{formatINR(balanceSheet?.totalAssets ?? 0)}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Liabilities</p>
								<p className="text-lg font-semibold text-zinc-900">{formatINR(balanceSheet?.totalLiabilities ?? 0)}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Equity</p>
								<p className="text-lg font-semibold text-zinc-900">{formatINR(balanceSheet?.totalEquity ?? 0)}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Status</p>
								<p className={`text-lg font-semibold ${balanceSheet?.isBalanced ? "text-emerald-700" : "text-red-700"}`}>
									{balanceSheet?.isBalanced ? "Balanced" : "Mismatch"}
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<h3 className="mb-3 text-base font-semibold text-zinc-900">Trial Balance Snapshot</h3>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="border-b border-zinc-200 text-left text-zinc-600">
										<th className="py-2 pr-3">Ledger</th>
										<th className="py-2 pr-3">Type</th>
										<th className="py-2 pr-3">Debit</th>
										<th className="py-2">Credit</th>
									</tr>
								</thead>
								<tbody>
									{(trialBalance?.ledgers ?? []).slice(0, 20).map((row) => (
										<tr key={row.ledgerId} className="border-b border-zinc-100 text-zinc-800">
											<td className="py-2 pr-3">{row.ledgerName}</td>
											<td className="py-2 pr-3">{row.ledgerType}</td>
											<td className="py-2 pr-3">{formatINR(row.totalDebit)}</td>
											<td className="py-2">{formatINR(row.totalCredit)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{trialBalance && (
							<p className="mt-3 text-sm text-zinc-600">
								Grand Totals: Debit {formatINR(trialBalance.grandTotalDebit)} | Credit {formatINR(trialBalance.grandTotalCredit)}
							</p>
						)}
					</div>
				</div>
			)}

			{activeTab === "invoicing" && (
				<div className="space-y-4">
					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-zinc-900">Invoice Control Center</h2>
								<p className="text-sm text-zinc-600">Instant visibility on receivables, overdue invoices, and credit notes.</p>
							</div>
							<button
								onClick={() => void loadTabData("invoicing")}
								disabled={loading}
								className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
							>
								{loading ? "Refreshing..." : "Refresh"}
							</button>
						</div>

						<div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
							<p className="mb-2 text-sm font-medium text-zinc-800">Create Instant Draft From Order</p>
							<div className="flex flex-col gap-2 sm:flex-row">
								<input
									value={draftOrderId}
									onChange={(event) => setDraftOrderId(event.target.value)}
									placeholder="Enter ecommerce order ID"
									className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
								/>
								<button
									onClick={() => void createDraftFromOrder()}
									disabled={loading}
									className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:bg-zinc-400"
								>
									Create Draft
								</button>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Total Invoices</p>
								<p className="text-2xl font-semibold text-zinc-900">{invoices.length}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Overdue Invoices</p>
								<p className="text-2xl font-semibold text-amber-700">{invoices.filter((invoice) => invoice.isOverdue).length}</p>
							</div>
							<div className="rounded-xl border border-zinc-200 p-4">
								<p className="text-sm text-zinc-600">Total Outstanding</p>
								<p className="text-2xl font-semibold text-zinc-900">
									{formatINR(invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0))}
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<h3 className="mb-3 text-base font-semibold text-zinc-900">Follow-Up Queue</h3>
						{followUps.length === 0 ? (
							<p className="text-sm text-zinc-600">No follow-ups due right now.</p>
						) : (
							<div className="space-y-3">
								{followUps.map((followUp) => (
									<div key={followUp.invoiceId} className="rounded-xl border border-zinc-200 p-4">
										<p className="font-medium text-zinc-900">{followUp.invoiceNumber}</p>
										<p className="text-sm text-zinc-600">
											Outstanding {formatINR(followUp.outstandingAmount)} | {followUp.daysSinceIssue} days old
										</p>
										<p className="mt-1 text-sm text-amber-700">{followUp.recommendedAction}</p>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
						<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<h3 className="text-base font-semibold text-zinc-900">Invoice List</h3>
							<div className="flex items-center gap-2">
								<span className="text-xs text-zinc-600">PDF template</span>
								<select
									value={pdfTemplate}
									onChange={(event) => setPdfTemplate(event.target.value as InvoicePdfTemplate)}
									className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs"
								>
									<option value="classic">Classic</option>
									<option value="minimal">Minimal</option>
									<option value="detailed">Detailed</option>
								</select>
							</div>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="border-b border-zinc-200 text-left text-zinc-600">
										<th className="py-2 pr-3">Invoice</th>
										<th className="py-2 pr-3">Status</th>
										<th className="py-2 pr-3">Outstanding</th>
										<th className="py-2 pr-3">Age</th>
										<th className="py-2">Actions</th>
									</tr>
								</thead>
								<tbody>
									{invoices.map((invoice) => (
										<tr key={invoice.id} className="border-b border-zinc-100 text-zinc-800">
											<td className="py-2 pr-3">{invoice.invoiceNumber}</td>
											<td className="py-2 pr-3">{invoice.status}</td>
											<td className="py-2 pr-3">{formatINR(invoice.outstandingAmount)}</td>
											<td className="py-2 pr-3">{invoice.daysSinceIssue} days</td>
											<td className="py-2">
												<div className="flex flex-wrap gap-2">
													<button
														onClick={() => void createCreditNote(invoice.id, invoice.outstandingAmount)}
														disabled={loading || invoice.outstandingAmount <= 0 || invoice.status === "CANCELLED"}
														className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 disabled:bg-zinc-100 disabled:text-zinc-400"
													>
														Create Credit Note
													</button>
													<button
														onClick={() => void downloadInvoicePdf(invoice.id, invoice.invoiceNumber)}
														disabled={loading}
														className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900 disabled:bg-zinc-100 disabled:text-zinc-400"
													>
														Download PDF
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{!loading && invoices.length === 0 && (
							<p className="py-4 text-sm text-zinc-500">No invoices found.</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
