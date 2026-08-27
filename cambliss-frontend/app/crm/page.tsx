"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type CrmDashboard = {
	totalLeads: number;
	totalActiveDeals: number;
	totalOpenDeals: number;
	totalWonDeals: number;
	openDealsValue: number;
	wonDealsValue: number;
	expectedRevenue: number;
	conversionRate: number;
	winRate: number;
};

type Lead = {
	id: string;
	contactId?: string;
	firstName?: string;
	lastName?: string;
	companyName?: string;
	email?: string;
	phone?: string;
	status?: string;
	source?: string;
	score?: number;
};

type Deal = {
	id: string;
	contactId: string;
	pipelineId: string;
	stageId: string;
	status: string;
	probability: number;
	value: number;
	contact?: {
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		email?: string | null;
	} | null;
};

type ServiceCase = {
	id: string;
	subject: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
};

type Campaign = {
	id: string;
	name: string;
	segment: string;
	status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
};

type CrmCardItem = {
	id: string;
	name: string;
	logo: string;
	category: string;
	badge: string;
	color: string;
	description: string;
	isConnected: boolean;
};

type SuiteTab =
	| "overview"
	| "customer360"
	| "sales"
	| "service"
	| "marketing"
	| "revenue"
	| "analytics"
	| "automation"
	| "governance";

export default function CrmPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Workspace CRM...</div>}>
			<CrmContent />
		</Suspense>
	);
}

function CrmContent() {
	const [suiteTab, setSuiteTab] = useState<SuiteTab>("overview");
	const [show3rdPartyGrid, setShow3rdPartyGrid] = useState(true);

	// 20 Small Business CRM Integration Cards List
	const [crmCards, setCrmCards] = useState<CrmCardItem[]>([
		{ id: "bitrix24", name: "Bitrix24 CRM", logo: "⚡", category: "Open Source / Headless", badge: "FEATURED FOR SMEs", color: "bg-[#00aae6]/10 text-[#00aae6] border-[#00aae6]/30", description: "Complete open-source CRM suite with omnichannel chat, telephony, and RPA workflows.", isConnected: true },
		{ id: "hubspot", name: "HubSpot CRM", logo: "⚙️", category: "Inbound Sales", badge: "POPULAR SME", color: "bg-[#ff7a59]/10 text-[#ff7a59] border-[#ff7a59]/30", description: "Free contact management, lead pipeline tracking, and email marketing for small teams.", isConnected: true },
		{ id: "zoho", name: "Zoho CRM", logo: "📦", category: "SMB Cloud Suite", badge: "SME FAVOURITE", color: "bg-[#f0483e]/10 text-[#f0483e] border-[#f0483e]/30", description: "Flexible sales pipelines, AI assistant, and automated quote generation.", isConnected: false },
		{ id: "pipedrive", name: "Pipedrive", logo: "📈", category: "Pipeline Management", badge: "SALES FIRST", color: "bg-[#00b050]/10 text-[#00b050] border-[#00b050]/30", description: "Activity-based sales CRM designed to keep deals moving smoothly.", isConnected: false },
		{ id: "salesforce", name: "Salesforce Cloud", logo: "☁️", category: "Enterprise & SMB", badge: "ENTERPRISE", color: "bg-[#00a1e0]/10 text-[#00a1e0] border-[#00a1e0]/30", description: "Global lead routing, account management, and custom reporting dashboard.", isConnected: false },
		{ id: "dynamics", name: "Microsoft Dynamics 365", logo: "💼", category: "Microsoft Ecosystem", badge: "MICROSOFT SYNC", color: "bg-[#002050]/10 text-[#002050] border-[#002050]/30", description: "Seamless integration with Outlook, Teams, and Office 365 workspace.", isConnected: false },
		{ id: "monday", name: "Monday.com CRM", logo: "🗓️", category: "Visual Workflow", badge: "EASY SETUP", color: "bg-[#ff3d57]/10 text-[#ff3d57] border-[#ff3d57]/30", description: "Visual board pipeline management for team collaboration and project tracking.", isConnected: false },
		{ id: "zendesk", name: "Zendesk Sell", logo: "🎧", category: "Support & Sales", badge: "SERVICE SYNC", color: "bg-[#03363d]/10 text-[#03363d] border-[#03363d]/20", description: "Connect sales conversations directly with customer support tickets.", isConnected: false },
		{ id: "freshsales", name: "Freshsales CRM", logo: "🍃", category: "AI Powered Sales", badge: "AI CONTACTS", color: "bg-[#002b49]/10 text-[#002b49] border-[#002b49]/30", description: "AI-based lead scoring, built-in phone, and email activity tracking.", isConnected: false },
		{ id: "activecampaign", name: "ActiveCampaign", logo: "✉️", category: "Email & Automation", badge: "CAMPAIGNS", color: "bg-[#356ae6]/10 text-[#356ae6] border-[#356ae6]/30", description: "Automated customer email journeys and CRM sales triggers.", isConnected: false },
		{ id: "keap", name: "Keap (Infusionsoft)", logo: "🌱", category: "Small Business Suite", badge: "SME AUTOMATION", color: "bg-[#00b274]/10 text-[#00b274] border-[#00b274]/30", description: "All-in-one CRM, email marketing, and invoicing for entrepreneurs.", isConnected: false },
		{ id: "sugarcrm", name: "SugarCRM", logo: "🚀", category: "Flexible Cloud", badge: "FLEXIBLE", color: "bg-purple-100 text-purple-800 border-purple-200", description: "Predictive customer insights and sales automation tools.", isConnected: false },
		{ id: "insightly", name: "Insightly CRM", logo: "📊", category: "Project & CRM", badge: "PROJECT SYNC", color: "bg-blue-100 text-blue-800 border-blue-200", description: "Build strong customer relationships and manage post-sale deliverables.", isConnected: false },
		{ id: "capsule", name: "Capsule CRM", logo: "🛍️", category: "Simple SME CRM", badge: "SIMPLE & CLEAN", color: "bg-emerald-100 text-emerald-800 border-emerald-200", description: "Clean, simple contact management designed for growing small businesses.", isConnected: false },
		{ id: "agile", name: "Agile CRM", logo: "🎯", category: "All-in-One Sales", badge: "ALL-IN-ONE", color: "bg-indigo-100 text-indigo-800 border-indigo-200", description: "Sales, marketing, and service automation for small business teams.", isConnected: false },
		{ id: "copper", name: "Copper CRM", logo: "📱", category: "Google Workspace", badge: "G-SUITE INTEGRATED", color: "bg-rose-100 text-rose-800 border-rose-200", description: "Built specifically for Google Workspace (Gmail, Calendar, Drive).", isConnected: false },
		{ id: "suitecrm", name: "SuiteCRM", logo: "⚡", category: "Open Source", badge: "100% FREE OPEN SOURCE", color: "bg-amber-100 text-amber-800 border-amber-200", description: "Enterprise-grade open-source CRM alternative to Salesforce.", isConnected: false },
		{ id: "vtiger", name: "Vtiger CRM", logo: "👥", category: "Open Source / Cloud", badge: "OPEN SOURCE", color: "bg-teal-100 text-teal-800 border-teal-200", description: "All-in-one CRM for sales, help desk, and inventory management.", isConnected: false },
		{ id: "espocrm", name: "EspoCRM", logo: "🛠️", category: "Open Source Self-Hosted", badge: "SELF HOSTED", color: "bg-cyan-100 text-cyan-800 border-cyan-200", description: "Lightweight, fast open-source web application for customer management.", isConnected: false },
		{ id: "odoo", name: "Odoo CRM", logo: "🌐", category: "Open Source ERP/CRM", badge: "ERP INTEGRATED", color: "bg-[#714B67]/10 text-[#714B67] border-[#714B67]/30", description: "Open-source sales lead tracking seamlessly linked to Odoo ERP modules.", isConnected: false },
	]);

	// Modal State for Connecting CRM
	const [activeCrmModal, setActiveCrmModal] = useState<CrmCardItem | null>(null);
	const [modalApiKey, setModalApiKey] = useState("");
	const [modalWebhookUrl, setModalWebhookUrl] = useState("");
	const [connectionMsg, setConnectionMsg] = useState<string | null>(null);

	// Built-in CRM Datasets
	const [dashboard, setDashboard] = useState<CrmDashboard>({
		totalLeads: 14,
		totalActiveDeals: 6,
		totalOpenDeals: 4,
		totalWonDeals: 2,
		openDealsValue: 28300.00,
		wonDealsValue: 14900.00,
		expectedRevenue: 32000.00,
		conversionRate: 42.5,
		winRate: 33.3,
	});

	const [leads, setLeads] = useState<Lead[]>([
		{ id: "lead-1", firstName: "Marcus", lastName: "Vance", companyName: "Apex Logistics GmbH", email: "mvance@apexlogistics.de", phone: "+49 89 1234567", status: "QUALIFIED", source: "WhatsApp", score: 85 },
		{ id: "lead-2", firstName: "Elena", lastName: "Rostova", companyName: "FinTech Global AG", email: "elena@fintechglobal.com", phone: "+41 44 9876543", status: "NEW", source: "Web Chat", score: 92 },
		{ id: "lead-3", firstName: "Kenji", lastName: "Sato", companyName: "Sato Manufacturing Corp", email: "sato@satomanufacturing.jp", phone: "+81 3 5555 0192", status: "CONTACTED", source: "Inbound Call", score: 78 },
	]);

	const [deals, setDeals] = useState<Deal[]>([
		{ id: "deal-1", contactId: "c-1", pipelineId: "p-1", stageId: "stg-3", status: "OPEN", probability: 75, value: 14900.00, contact: { firstName: "Marcus", lastName: "Vance", companyName: "Apex Logistics GmbH", email: "mvance@apexlogistics.de" } },
		{ id: "deal-2", contactId: "c-2", pipelineId: "p-1", stageId: "stg-4", status: "OPEN", probability: 90, value: 8900.00, contact: { firstName: "Elena", lastName: "Rostova", companyName: "FinTech Global AG", email: "elena@fintechglobal.com" } },
	]);

	const [serviceCases, setServiceCases] = useState<ServiceCase[]>([
		{ id: "sc-1", subject: "SAML SSO Authentication Issue", priority: "HIGH", status: "IN_PROGRESS" },
		{ id: "sc-2", subject: "Kubernetes Cluster Capacity Expansion", priority: "MEDIUM", status: "OPEN" },
	]);

	const [campaigns, setCampaigns] = useState<Campaign[]>([
		{ id: "cmp-1", name: "Q3 Enterprise Security Blast", segment: "Email Broadcast", status: "COMPLETED" },
		{ id: "cmp-2", name: "WhatsApp B2B Wholesale Deal", segment: "WhatsApp Broadcast", status: "RUNNING" },
	]);

	// Lead Form Modal State
	const [showLeadModal, setShowLeadModal] = useState(false);
	const [lFirst, setLFirst] = useState("");
	const [lLast, setLLast] = useState("");
	const [lEmail, setLEmail] = useState("");
	const [lPhone, setLPhone] = useState("");
	const [lCompany, setLCompany] = useState("");

	const handleSaveCrmConnection = (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeCrmModal) return;

		setCrmCards((prev) =>
			prev.map((card) => (card.id === activeCrmModal.id ? { ...card, isConnected: true } : card))
		);

		setConnectionMsg(`✅ Connected ${activeCrmModal.name}! Webhook & Lead Sync Enabled.`);
		setTimeout(() => {
			setActiveCrmModal(null);
			setConnectionMsg(null);
		}, 1200);
	};

	const toggleCrmConnection = (id: string) => {
		setCrmCards((prev) =>
			prev.map((card) => (card.id === id ? { ...card, isConnected: !card.isConnected } : card))
		);
	};

	const handleAddLead = (e: React.FormEvent) => {
		e.preventDefault();
		if (!lFirst || !lEmail) return;

		const newL: Lead = {
			id: `lead-${Date.now()}`,
			firstName: lFirst,
			lastName: lLast,
			email: lEmail,
			phone: lPhone,
			companyName: lCompany || "Independent",
			status: "NEW",
			source: "Manual Entry",
			score: 80,
		};

		setLeads((prev) => [newL, ...prev]);
		setShowLeadModal(false);
		setLFirst("");
		setLLast("");
		setLEmail("");
	};

	return (
		<WorkspaceShell>
			<div className="mt-5 mx-auto max-w-7xl space-y-8">
				{/* Top Hero Banner */}
				<div className="rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-8 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-6">
						<div className="max-w-3xl space-y-3">
							<div className="flex items-center gap-3 flex-wrap">
								<span className="rounded-full bg-[#6678c1] px-3 py-1 text-xs font-bold text-white shadow-sm">
									⚡ 3rd Party CRM Integrations & Bitrix24
								</span>
								<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
									Built for Small Businesses & Enterprises
								</span>
							</div>
							<h1 className="text-2xl font-black tracking-tight text-[#1f2430]">
								CRM Suite & 20 Third-Party CRM Connectors
							</h1>
							<p className="text-xs text-[#5b6472] leading-relaxed">
								Connect third-party CRMs (Bitrix24, HubSpot, Zoho, Salesforce, Monday, Pipedrive) or manage your leads, sales deals, customer support cases, quotes, and campaigns natively in your workspace.
							</p>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={() => setShowLeadModal(true)}
								className="rounded-2xl bg-[#6678c1] px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
							>
								+ New Lead Entry
							</button>
						</div>
					</div>
				</div>

				{/* SECTION 1: 3RD PARTY CRM CONNECTORS GRID (FIRST) */}
				<div className="space-y-4 rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9e2ef] pb-4">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-lg font-black text-[#1f2430]">
									🔌 Third-Party CRM Connectors & Bitrix24 ({crmCards.length} Tools)
								</h2>
								<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800 uppercase">
									1-CLICK CONNECT FOR SMALL BUSINESS
								</span>
							</div>
							<p className="text-xs text-[#5b6472] mt-0.5">
								Connect external CRMs to sync contacts, leads, deals, and automated webhooks directly into your workspace.
							</p>
						</div>

						<button
							onClick={() => setShow3rdPartyGrid(!show3rdPartyGrid)}
							className="text-xs font-bold text-[#6678c1] hover:underline"
						>
							{show3rdPartyGrid ? "Hide Connector Cards ▲" : "Show 20 CRM Connector Cards ▼"}
						</button>
					</div>

					{show3rdPartyGrid && (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
							{crmCards.map((crm) => (
								<div
									key={crm.id}
									className="group rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] hover:bg-white hover:shadow-md transition duration-200"
								>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-3xl">{crm.logo}</span>
											<span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold border uppercase ${crm.color}`}>
												{crm.badge}
											</span>
										</div>

										<div>
											<h3 className="text-sm font-bold text-[#1f2430] group-hover:text-[#6678c1] transition">
												{crm.name}
											</h3>
											<div className="text-[11px] font-semibold text-[#6678c1]">{crm.category}</div>
										</div>

										<p className="text-xs text-[#5b6472] leading-relaxed">
											{crm.description}
										</p>
									</div>

									<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between text-xs">
										<span className={`font-bold ${crm.isConnected ? "text-emerald-600" : "text-[#5b6472]"}`}>
											{crm.isConnected ? "✅ Connected" : "Not Connected"}
										</span>

										<button
											onClick={() => {
												if (crm.isConnected) {
													toggleCrmConnection(crm.id);
												} else {
													setActiveCrmModal(crm);
													setModalApiKey("");
													setModalWebhookUrl("");
												}
											}}
											className={`rounded-xl px-3 py-1.5 font-bold transition ${
												crm.isConnected
													? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
													: "bg-[#6678c1] text-white hover:bg-[#404d85] shadow-sm"
											}`}
										>
											{crm.isConnected ? "Disconnect" : "Connect →"}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* SECTION 2: OUR BUILT-IN WORKSPACE CRM SUITE (NEXT) */}
				<div className="space-y-6 rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
					<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-4">
						<div>
							<h2 className="text-lg font-black text-[#1f2430]">📊 Our Native Workspace CRM Suite</h2>
							<p className="text-xs text-[#5b6472]">Full customer lifecycle management: Leads, Deals Pipeline, Service Cases, Marketing & Revenue Ops</p>
						</div>
					</div>

					{/* 9 Suite Navigation Tabs */}
					<div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#d9e2ef] bg-[#f8faff] p-2 shadow-inner">
						{[
							{ id: "overview", label: "📊 Overview" },
							{ id: "customer360", label: "👥 Customer 360" },
							{ id: "sales", label: `💼 Sales Execution (${deals.length} Deals)` },
							{ id: "service", label: `🎧 Service & Support (${serviceCases.length})` },
							{ id: "marketing", label: `📢 Marketing CRM (${campaigns.length})` },
							{ id: "revenue", label: "💰 Revenue Ops & Billing" },
							{ id: "analytics", label: "📈 Analytics & Win/Loss" },
							{ id: "automation", label: "⚡ Workflow Automation" },
							{ id: "governance", label: "⚙️ Admin & Governance" },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setSuiteTab(tab.id as SuiteTab)}
								className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
									suiteTab === tab.id
										? "bg-[#6678c1] text-white shadow-sm"
										: "text-[#5b6472] hover:bg-white hover:text-[#1f2430]"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* TAB: OVERVIEW */}
					{suiteTab === "overview" && (
						<div className="space-y-6">
							<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
								<div className="rounded-2xl border border-[#d9e2ef] p-6 bg-[#f8faff] space-y-2">
									<div className="text-xs font-bold text-[#5b6472]">Open Pipeline Value</div>
									<div className="text-2xl font-black text-[#1f2430]">${dashboard.openDealsValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
									<div className="text-[11px] text-emerald-600 font-bold">{dashboard.totalOpenDeals} Active Open Deals</div>
								</div>

								<div className="rounded-2xl border border-[#d9e2ef] p-6 bg-[#f8faff] space-y-2">
									<div className="text-xs font-bold text-[#5b6472]">Closed Won Revenue</div>
									<div className="text-2xl font-black text-emerald-600">${dashboard.wonDealsValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
									<div className="text-[11px] text-[#5b6472] font-semibold">{dashboard.totalWonDeals} Deals Closed Won</div>
								</div>

								<div className="rounded-2xl border border-[#d9e2ef] p-6 bg-[#f8faff] space-y-2">
									<div className="text-xs font-bold text-[#5b6472]">Lead Win Conversion Rate</div>
									<div className="text-2xl font-black text-[#6678c1]">{dashboard.conversionRate}%</div>
									<div className="text-[11px] text-[#5b6472] font-semibold">Lead to Customer Ratio</div>
								</div>
							</div>

							{/* Recent Leads */}
							<div className="overflow-hidden rounded-2xl border border-[#d9e2ef]">
								<div className="p-4 bg-[#f8faff] border-b border-[#d9e2ef] flex justify-between items-center">
									<h3 className="text-sm font-bold text-[#1f2430]">Recorded Leads & Prospects ({leads.length})</h3>
									<button onClick={() => setShowLeadModal(true)} className="text-xs font-bold text-[#6678c1] hover:underline">+ Add Lead</button>
								</div>
								<table className="w-full text-left text-xs">
									<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
										<tr>
											<th className="p-3 font-semibold">Name</th>
											<th className="p-3 font-semibold">Company</th>
											<th className="p-3 font-semibold">Email / Phone</th>
											<th className="p-3 font-semibold">Source</th>
											<th className="p-3 font-semibold">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#d9e2ef]">
										{leads.map((l) => (
											<tr key={l.id} className="hover:bg-[#f8faff]">
												<td className="p-3 font-bold text-[#1f2430]">{l.firstName} {l.lastName}</td>
												<td className="p-3 text-[#5b6472]">{l.companyName}</td>
												<td className="p-3 text-[#5b6472]">{l.email} | {l.phone}</td>
												<td className="p-3 font-semibold text-[#6678c1]">{l.source}</td>
												<td className="p-3">
													<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
														{l.status}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* TAB: CUSTOMER 360 */}
					{suiteTab === "customer360" && (
						<div className="space-y-4">
							<h3 className="text-sm font-bold text-[#1f2430]">👥 Customer 360 Directory</h3>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{leads.map((l) => (
									<div key={l.id} className="rounded-2xl border border-[#d9e2ef] p-4 bg-[#f8faff] space-y-1">
										<div className="font-bold text-[#1f2430]">{l.firstName} {l.lastName}</div>
										<div className="text-xs text-[#5b6472]">{l.companyName} ({l.email})</div>
										<div className="text-xs font-bold text-[#6678c1]">Lead Source: {l.source} • Score: {l.score}/100</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* TAB: SALES EXECUTION */}
					{suiteTab === "sales" && (
						<div className="space-y-4">
							<h3 className="text-sm font-bold text-[#1f2430]">💼 Active Deals Pipeline</h3>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{deals.map((d) => (
									<div key={d.id} className="rounded-2xl border border-[#d9e2ef] p-4 bg-[#f8faff] space-y-2">
										<div className="font-bold text-[#1f2430]">{d.contact?.companyName || "Corporate Deal"}</div>
										<div className="text-xs text-[#5b6472]">Contact: {d.contact?.email}</div>
										<div className="flex justify-between items-center text-xs">
											<span className="font-black text-emerald-600">${d.value.toLocaleString()}</span>
											<span className="font-bold text-[#6678c1]">{d.probability}% Probability</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* TAB: SERVICE & SUPPORT */}
					{suiteTab === "service" && (
						<div className="space-y-4">
							<h3 className="text-sm font-bold text-[#1f2430]">🎧 Customer Service Support Cases</h3>
							<div className="space-y-2">
								{serviceCases.map((c) => (
									<div key={c.id} className="flex justify-between items-center rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff] text-xs">
										<span className="font-bold text-[#1f2430]">{c.subject}</span>
										<span className="font-bold text-amber-600">Priority: {c.priority} • Status: {c.status}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* TAB: MARKETING CRM */}
					{suiteTab === "marketing" && (
						<div className="space-y-4">
							<h3 className="text-sm font-bold text-[#1f2430]">📢 Marketing Broadcast Campaigns</h3>
							<div className="space-y-2">
								{campaigns.map((cmp) => (
									<div key={cmp.id} className="flex justify-between items-center rounded-xl border border-[#d9e2ef] p-3 bg-[#f8faff] text-xs">
										<span className="font-bold text-[#1f2430]">{cmp.name}</span>
										<span className="font-bold text-[#6678c1]">{cmp.segment} • {cmp.status}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* TAB: REVENUE OPS */}
					{suiteTab === "revenue" && (
						<div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
							💰 Accountech ERP Ledger Sync Enabled — CRM quotes and won deals synchronize automatically with /akaunting.
						</div>
					)}

					{/* TAB: ANALYTICS & AI */}
					{suiteTab === "analytics" && (
						<div className="p-4 rounded-xl bg-[#f8faff] border border-[#d9e2ef] text-xs space-y-2">
							<div className="font-bold text-[#1f2430]">📈 Pipeline Velocity & AI Win/Loss Analytics</div>
							<div className="text-[#5b6472]">Average deal cycle time: 18 days • Projected Q3 Revenue: ${dashboard.expectedRevenue.toLocaleString()}</div>
						</div>
					)}

					{/* TAB: WORKFLOW AUTOMATION */}
					{suiteTab === "automation" && (
						<div className="p-4 rounded-xl bg-[#f8faff] border border-[#d9e2ef] text-xs space-y-2">
							<div className="font-bold text-[#1f2430]">⚡ Automated Robotic Workflows (RPA)</div>
							<div className="text-emerald-600 font-semibold">Active Rules: Auto-email follow-up on proposal stage • Slack notification on deal closure.</div>
						</div>
					)}

					{/* TAB: ADMIN & GOVERNANCE */}
					{suiteTab === "governance" && (
						<div className="p-4 rounded-xl bg-[#f8faff] border border-[#d9e2ef] text-xs space-y-2">
							<div className="font-bold text-[#1f2430]">⚙️ RBAC Permissions & Sales Team Governance</div>
							<div className="text-[#5b6472]">Role-based access control, audit log retention, and data backup settings.</div>
						</div>
					)}
				</div>
			</div>

			{/* CONNECT CRM MODAL */}
			{activeCrmModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-[#d9e2ef] pb-3">
							<div className="flex items-center gap-3">
								<span className="text-3xl">{activeCrmModal.logo}</span>
								<div>
									<h3 className="text-base font-extrabold text-[#1f2430]">Connect {activeCrmModal.name}</h3>
									<div className="text-xs text-[#6678c1] font-semibold">{activeCrmModal.category}</div>
								</div>
							</div>
							<button onClick={() => setActiveCrmModal(null)} className="text-sm font-bold text-[#5b6472]">✕</button>
						</div>

						<p className="text-xs text-[#5b6472] leading-relaxed">
							{activeCrmModal.description} Configure your small business API key or webhook to enable 1-click synchronization.
						</p>

						<form onSubmit={handleSaveCrmConnection} className="space-y-3 text-xs">
							<div>
								<label className="block font-semibold text-[#5b6472]">{activeCrmModal.name} API Key / Secret Token *</label>
								<input
									type="password"
									placeholder="e.g. crm_live_secret_key_88921"
									value={modalApiKey}
									onChange={(e) => setModalApiKey(e.target.value)}
									className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs"
									required
								/>
							</div>

							<div>
								<label className="block font-semibold text-[#5b6472]">Webhook Event URL (Optional)</label>
								<input
									type="text"
									placeholder="https://your-crm-instance.com/webhook"
									value={modalWebhookUrl}
									onChange={(e) => setModalWebhookUrl(e.target.value)}
									className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs"
								/>
							</div>

							{connectionMsg && (
								<div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-xs">
									{connectionMsg}
								</div>
							)}

							<div className="pt-2 flex justify-end gap-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setActiveCrmModal(null)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">
									Cancel
								</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">
									Save & Connect {activeCrmModal.name}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* CREATE LEAD MODAL */}
			{showLeadModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-2xl space-y-4">
						<h3 className="text-base font-bold text-[#1f2430]">Add New Prospect Lead</h3>
						<form onSubmit={handleAddLead} className="space-y-3 text-xs">
							<div>
								<label className="block font-semibold text-[#5b6472]">First Name *</label>
								<input type="text" placeholder="Marcus" value={lFirst} onChange={(e) => setLFirst(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Last Name</label>
								<input type="text" placeholder="Vance" value={lLast} onChange={(e) => setLLast(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Email Address *</label>
								<input type="email" placeholder="mvance@apex.de" value={lEmail} onChange={(e) => setLEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" required />
							</div>
							<div>
								<label className="block font-semibold text-[#5b6472]">Company Name</label>
								<input type="text" placeholder="Apex Logistics GmbH" value={lCompany} onChange={(e) => setLCompany(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2 text-xs" />
							</div>
							<div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2ef]">
								<button type="button" onClick={() => setShowLeadModal(false)} className="rounded-xl border border-[#d9e2ef] px-4 py-2">Cancel</button>
								<button type="submit" className="rounded-xl bg-[#6678c1] px-5 py-2 font-bold text-white shadow-md">Save Lead</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</WorkspaceShell>
	);
}
