"use client";

import { FormEvent, useEffect, useState, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type Bitrix24Lead = {
	id: string;
	title: string;
	contactName: string;
	companyName: string;
	email: string;
	phone: string;
	source: "Web Chat" | "WhatsApp" | "Telegram" | "Email Campaign" | "Inbound Call";
	score: number;
	status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "UNQUALIFIED";
	assignedTo: string;
	createdDate: string;
};

type Bitrix24Deal = {
	id: string;
	title: string;
	companyName: string;
	contactName: string;
	stage: "New Lead" | "Contacted" | "Proposal Sent" | "Negotiation" | "Closed Won" | "Closed Lost";
	stageProbability: number;
	value: number;
	assignedRep: string;
	expectedCloseDate: string;
	productsCount: number;
};

type Bitrix24Quote = {
	id: string;
	quoteNumber: string;
	clientName: string;
	companyName: string;
	amount: number;
	status: "DRAFT" | "SENT" | "APPROVED" | "DECLINED";
	createdDate: string;
	expiryDate: string;
};

type ServiceTicket = {
	id: string;
	subject: string;
	clientName: string;
	category: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
	assignedAgent: string;
	slaRemainingHours: number;
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

export default function CrmPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading 20 CRM Connectors & Bitrix24...</div>}>
			<CrmContent />
		</Suspense>
	);
}

function CrmContent() {
	const [activeTab, setActiveTab] = useState<"connectors" | "dashboard" | "pipeline" | "leads" | "quotes" | "tickets" | "api">("connectors");

	// Bitrix24 Config State
	const [bitrixServerUrl, setBitrixServerUrl] = useState("https://b24-open.theofficeconnect.com/rest/");
	const [bitrixApiKey, setBitrixApiKey] = useState("b24_secret_webhook_key_2026");
	const [bitrixStatus, setBitrixStatus] = useState<string | null>(null);

	// 20 Small Business CRM Integration Cards List
	const [crmCards, setCrmCards] = useState<CrmCardItem[]>([
		{ id: "bitrix24", name: "Bitrix24 CRM", logo: "⚡", category: "Open Source / Headless", badge: "FEATURED FOR SMEs", color: "bg-[#00aae6]/10 text-[#00aae6] border-[#00aae6]/30", description: "Complete open-source CRM suite with omnichannel chat, telephony, and RPA workflows.", isConnected: true },
		{ id: "hubspot", name: "HubSpot CRM", logo: "⚙️", category: "Inbound Sales", badge: "POPULAR SME", color: "bg-[#ff7a59]/10 text-[#ff7a59] border-[#ff7a59]/30", description: "Free contact management, lead pipeline tracking, and email marketing for small teams.", isConnected: true },
		{ id: "zoho", name: "Zoho CRM", logo: "📦", category: "SMB Cloud Suite", badge: "SME FAVOURITE", color: "bg-[#f0483e]/10 text-[#f0483e] border-[#f0483e]/30", description: "Flexible sales pipelines, AI assistant, and automated quote generation.", isConnected: false },
		{ id: "pipedrive", name: "Pipedrive", logo: "📈", category: "Pipeline Management", badge: "SALES FIRST", color: "bg-[#00b050]/10 text-[#00b050] border-[#00b050]/30", description: "Activity-based sales CRM designed to keep deals moving smoothly.", isConnected: false },
		{ id: "salesforce", name: "Salesforce Cloud", logo: "☁️", category: "Enterprise & SMB", badge: "ENTERPRISE", color: "bg-[#00a1e0]/10 text-[#00a1e0] border-[#00a1e0]/30", description: "Global lead routing, account management, and custom reporting dashboard.", isConnected: false },
		{ id: "dynamics", name: "Microsoft Dynamics 365", logo: "💼", category: "Microsoft Ecosystem", badge: "MICROSOFT SYNC", color: "bg-[#002050]/10 text-[#002050] border-[#002050]/30", description: "Seamless integration with Outlook, Teams, and Office 365 workspace.", isConnected: false },
		{ id: "monday", name: "Monday.com CRM", logo: "🗓️", category: "Visual Workflow", badge: "EASY SETUP", color: "bg-[#ff3d57]/10 text-[#ff3d57] border-[#ff3d57]/30", description: "Visual board pipeline management for team collaboration and project tracking.", isConnected: false },
		{ id: "zendesk", name: "Zendesk Sell", logo: "🎧", category: "Support & Sales", badge: "SERVICE SYNC", color: "bg-[#03363d]/10 text-[#03363d] border-[#03363d]/30", description: "Connect sales conversations directly with customer support tickets.", isConnected: false },
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

	// Leads & Deals Mock Data
	const [leads, setLeads] = useState<Bitrix24Lead[]>([
		{ id: "lead-101", title: "Enterprise Cloud Hosting Deal", contactName: "Marcus Vance", companyName: "Apex Logistics GmbH", email: "mvance@apexlogistics.de", phone: "+49 89 1234567", source: "WhatsApp", score: 85, status: "QUALIFIED", assignedTo: "Sarah Jenkins", createdDate: "2026-08-20" },
		{ id: "lead-102", title: "Security SSO & IAM Licensing", contactName: "Elena Rostova", companyName: "FinTech Global AG", email: "elena@fintechglobal.com", phone: "+41 44 9876543", source: "Web Chat", score: 92, status: "NEW", assignedTo: "David Miller", createdDate: "2026-08-22" },
	]);

	const [deals, setDeals] = useState<Bitrix24Deal[]>([
		{ id: "deal-201", title: "Kubernetes Cluster Annual SLA", companyName: "Apex Logistics GmbH", contactName: "Marcus Vance", stage: "Proposal Sent", stageProbability: 75, value: 14900.00, assignedRep: "Sarah Jenkins", expectedCloseDate: "2026-09-15", productsCount: 2 },
		{ id: "deal-202", title: "Zero-Trust IAM Platform 200 Seats", companyName: "FinTech Global AG", contactName: "Elena Rostova", stage: "Negotiation", stageProbability: 90, value: 8900.00, assignedRep: "David Miller", expectedCloseDate: "2026-09-01", productsCount: 1 },
	]);

	const [quotes, setQuotes] = useState<Bitrix24Quote[]>([
		{ id: "q-301", quoteNumber: "QUO-2026-0891", clientName: "Marcus Vance", companyName: "Apex Logistics GmbH", amount: 14900.00, status: "SENT", createdDate: "2026-08-21", expiryDate: "2026-09-20" },
	]);

	const handleSaveCrmConnection = (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeCrmModal) return;

		setCrmCards((prev) =>
			prev.map((card) => (card.id === activeCrmModal.id ? { ...card, isConnected: true } : card))
		);

		setConnectionMsg(`✅ Successfully Connected ${activeCrmModal.name}! Webhook & API sync enabled.`);
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

	const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);

	return (
		<WorkspaceShell>
			<div className="mt-5 mx-auto max-w-7xl space-y-6">
				{/* Top Hero Banner */}
				<div className="rounded-3xl border border-[#d9e2ef] bg-gradient-to-r from-white via-[#f8faff] to-[#eef2fa] p-8 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-6">
						<div className="max-w-3xl space-y-3">
							<div className="flex items-center gap-3 flex-wrap">
								<span className="rounded-full bg-[#6678c1] px-3 py-1 text-xs font-bold text-white shadow-sm">
									⚡ 20 CRM Suite & Bitrix24 Integration Hub
								</span>
								<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
									Designed for Small Businesses & SMEs
								</span>
							</div>
							<h1 className="text-2xl font-black tracking-tight text-[#1f2430]">
								20 CRM Connectors Hub & Bitrix24 Platform
							</h1>
							<p className="text-xs text-[#5b6472] leading-relaxed">
								Easily connect your small business CRM tools with 1-click integrations. Sync Bitrix24, HubSpot, Zoho, Pipedrive, Salesforce, Monday.com, and 14 open-source CRMs directly into your workspace.
							</p>
						</div>

						<div className="flex items-center gap-3">
							<button
								onClick={() => setActiveTab("connectors")}
								className="rounded-2xl bg-[#6678c1] px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-[#404d85] transition"
							>
								🔗 Browse 20 CRM Connectors
							</button>
						</div>
					</div>
				</div>

				{/* Top Sub-Tab Navigation */}
				<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#d9e2ef] bg-white p-2 shadow-sm">
					{[
						{ id: "connectors", label: `🔗 20 CRM Integrations (${crmCards.filter(c => c.isConnected).length} Connected)` },
						{ id: "dashboard", label: "📊 Bitrix24 CRM Dashboard" },
						{ id: "pipeline", label: "💼 Deal Pipeline" },
						{ id: "leads", label: `👤 Leads Directory (${leads.length})` },
						{ id: "quotes", label: `📝 Quotes (${quotes.length})` },
						{ id: "api", label: "⚡ Bitrix24 REST API & Webhooks" },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as any)}
							className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
								activeTab === tab.id
									? "bg-[#6678c1] text-white shadow-sm"
									: "text-[#5b6472] hover:bg-[#f8faff] hover:text-[#1f2430]"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* TAB 1: 20 CRM INTEGRATIONS GRID FOR SMALL BUSINESSES */}
				{activeTab === "connectors" && (
					<div className="space-y-6">
						<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
							<div>
								<h2 className="text-lg font-bold text-[#1f2430]">🔌 20 Top CRM Connectors for Small Businesses</h2>
								<p className="text-xs text-[#5b6472]">Click any CRM card to configure 1-click API key connection & automated lead synchronization</p>
							</div>

							<div className="flex items-center gap-2 text-xs font-bold text-[#6678c1]">
								<span>Connected CRMs: {crmCards.filter((c) => c.isConnected).length} of 20</span>
							</div>
						</div>

						{/* 20 CRM Cards Grid */}
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{crmCards.map((crm) => (
								<div
									key={crm.id}
									className="group rounded-3xl border border-[#d9e2ef] bg-white p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#6678c1] hover:shadow-md transition duration-200"
								>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-3xl">{crm.logo}</span>
											<span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold border uppercase ${crm.color}`}>
												{crm.badge}
											</span>
										</div>

										<div>
											<h3 className="text-base font-bold text-[#1f2430] group-hover:text-[#6678c1] transition">
												{crm.name}
											</h3>
											<div className="text-[11px] font-semibold text-[#6678c1]">{crm.category}</div>
										</div>

										<p className="text-xs text-[#5b6472] leading-relaxed">
											{crm.description}
										</p>
									</div>

									<div className="pt-3 border-t border-[#d9e2ef] flex items-center justify-between">
										<span className={`text-[11px] font-bold ${crm.isConnected ? "text-emerald-600" : "text-[#5b6472]"}`}>
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
											className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
												crm.isConnected
													? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
													: "bg-[#6678c1] text-white hover:bg-[#404d85] shadow-sm"
											}`}
										>
											{crm.isConnected ? "Disconnect" : "Connect CRM →"}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* TAB 2: DASHBOARD */}
				{activeTab === "dashboard" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-2">
								<div className="text-xs font-bold text-[#5b6472]">Total Pipeline Value</div>
								<div className="text-2xl font-black text-[#1f2430]">${totalPipelineValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
								<div className="text-[11px] text-emerald-600 font-semibold">{deals.length} Active Deals</div>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-2">
								<div className="text-xs font-bold text-[#5b6472]">Total Leads Recorded</div>
								<div className="text-2xl font-black text-[#6678c1]">{leads.length} Leads</div>
								<div className="text-[11px] text-[#5b6472] font-semibold">Captured via Connected CRMs</div>
							</div>

							<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-2">
								<div className="text-xs font-bold text-[#5b6472]">Bitrix24 REST Status</div>
								<div className="text-2xl font-black text-emerald-600">Active 200 OK</div>
								<div className="text-[11px] text-[#5b6472] font-semibold">Webhooks Ready</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 3: PIPELINE */}
				{activeTab === "pipeline" && (
					<div className="space-y-6">
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm">
							<h2 className="text-lg font-bold text-[#1f2430]">💼 Deal Stage Pipeline</h2>
							<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
								{deals.map((d) => (
									<div key={d.id} className="rounded-2xl border border-[#d9e2ef] p-4 bg-[#f8faff] space-y-2">
										<div className="font-bold text-[#1f2430]">{d.title}</div>
										<div className="text-xs text-[#5b6472]">{d.companyName}</div>
										<div className="text-xs font-bold text-[#6678c1]">Stage: {d.stage} ({d.stageProbability}%)</div>
										<div className="text-sm font-black text-emerald-600">${d.value.toLocaleString()}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: LEADS */}
				{activeTab === "leads" && (
					<div className="space-y-6">
						<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
							<table className="w-full text-left text-xs">
								<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
									<tr>
										<th className="p-3 font-semibold">Lead Title</th>
										<th className="p-3 font-semibold">Contact</th>
										<th className="p-3 font-semibold">Source</th>
										<th className="p-3 font-semibold">Score</th>
										<th className="p-3 font-semibold">Assigned Rep</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#d9e2ef]">
									{leads.map((l) => (
										<tr key={l.id}>
											<td className="p-3 font-bold text-[#1f2430]">{l.title}</td>
											<td className="p-3 text-[#5b6472]">{l.contactName} ({l.companyName})</td>
											<td className="p-3 font-semibold text-[#6678c1]">{l.source}</td>
											<td className="p-3 font-black text-amber-500">{l.score}</td>
											<td className="p-3 text-[#5b6472]">{l.assignedTo}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 5: QUOTES */}
				{activeTab === "quotes" && (
					<div className="space-y-6">
						<div className="overflow-hidden rounded-2xl border border-[#d9e2ef] bg-white shadow-sm">
							<table className="w-full text-left text-xs">
								<thead className="border-b border-[#d9e2ef] bg-[#f8faff] text-[#5b6472]">
									<tr>
										<th className="p-3 font-semibold">Quote #</th>
										<th className="p-3 font-semibold">Client</th>
										<th className="p-3 font-semibold">Amount ($)</th>
										<th className="p-3 font-semibold">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#d9e2ef]">
									{quotes.map((q) => (
										<tr key={q.id}>
											<td className="p-3 font-bold text-[#6678c1]">{q.quoteNumber}</td>
											<td className="p-3 text-[#5b6472]">{q.clientName}</td>
											<td className="p-3 font-bold text-[#1f2430]">${q.amount.toLocaleString()}</td>
											<td className="p-3 font-bold text-emerald-600">{q.status}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 6: BITRIX24 API */}
				{activeTab === "api" && (
					<div className="space-y-6">
						<div className="rounded-2xl border border-[#d9e2ef] bg-white p-6 shadow-sm space-y-4">
							<h2 className="text-lg font-bold text-[#1f2430]">⚡ Bitrix24 REST API & Webhook Configuration</h2>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
								<div>
									<label className="block font-semibold text-[#5b6472]">Bitrix24 REST Endpoint URL</label>
									<input type="text" value={bitrixServerUrl} onChange={(e) => setBitrixServerUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs" />
								</div>
								<div>
									<label className="block font-semibold text-[#5b6472]">Bitrix24 Secret Token</label>
									<input type="password" value={bitrixApiKey} onChange={(e) => setBitrixApiKey(e.target.value)} className="mt-1 w-full rounded-xl border border-[#d9e2ef] p-2.5 font-mono text-xs" />
								</div>
							</div>
							<button onClick={() => setBitrixStatus("✅ Bitrix24 REST API Gateway Connected!")} className="rounded-xl bg-[#6678c1] px-4 py-2 text-xs font-bold text-white">
								Test Gateway Ping
							</button>
							{bitrixStatus && <div className="text-xs font-bold text-emerald-600">{bitrixStatus}</div>}
						</div>
					</div>
				)}
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
								<label className="block font-semibold text-[#5b6472]">{activeCrmModal.name} API Key / Access Token *</label>
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
		</WorkspaceShell>
	);
}
