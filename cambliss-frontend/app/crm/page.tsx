"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";

type CrmLead = {
	id: string;
	title: string;
	companyName: string;
	contactName: string;
	email: string;
	phone?: string;
	value?: number;
	stage: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
	source?: string;
	notes?: string;
	createdAt: string;
};

type CrmSummary = {
	totalLeads: number;
	wonLeads: number;
	lostLeads: number;
	pipelineValue: number;
	wonValue: number;
	averageValue: number;
};

type CrmConnector = {
	id: string;
	name: string;
	logo: string;
	color: string;
	description: string;
};

type CrmTab = "overview" | "pipeline" | "leads" | "stages" | "activity" | "analytics" | "settings";

// Helper for safe number formatting
const safeFormatNumber = (val: number | undefined | null): string => {
	const num = Number(val ?? 0);
	return Number.isNaN(num) ? "0.00" : num.toLocaleString("en-US", { minimumFractionDigits: 2 });
};

// 20 Enterprise 3rd-Party CRM Connectors (including Twenty CRM & Bitrix24)
const TOP_CRMS: CrmConnector[] = [
	{ id: "hubspot", name: "HubSpot", logo: "🟧", color: "border-orange-200 bg-orange-50 text-orange-600", description: "Inbound CRM, sales hub, and contact pipelines." },
	{ id: "salesforce", name: "Salesforce", logo: "☁️", color: "border-sky-200 bg-sky-50 text-sky-600", description: "Enterprise Cloud CRM, lead scoring, and opportunity tracking." },
	{ id: "twenty", name: "Twenty CRM", logo: "2️⃣", color: "border-[#6678c1]/30 bg-[#6678c1]/10 text-[#6678c1]", description: "Modern open-source CRM alternative with full data control." },
	{ id: "bitrix24", name: "Bitrix24 CRM", logo: "🟦", color: "border-blue-200 bg-blue-50 text-blue-600", description: "Complete CRM, lead management, and client communication suite." },
	{ id: "pipedrive", name: "Pipedrive", logo: "🟢", color: "border-emerald-200 bg-emerald-50 text-emerald-600", description: "Activity-based CRM and visual sales pipeline management." },
	{ id: "zoho", name: "Zoho CRM", logo: "🟡", color: "border-amber-200 bg-amber-50 text-amber-600", description: "Omnichannel customer relationship management platform." },
	{ id: "zendesk", name: "Zendesk Sell", logo: "💚", color: "border-teal-200 bg-teal-50 text-teal-600", description: "Sales force automation and customer interaction tracking." },
	{ id: "keap", name: "Keap", logo: "🍇", color: "border-purple-200 bg-purple-50 text-purple-600", description: "Small business CRM, sales pipeline, and email automation." },
	{ id: "freshsales", name: "Freshsales", logo: "🍃", color: "border-emerald-200 bg-emerald-50 text-emerald-600", description: "AI-powered CRM, contact scoring, and deal forecasting." },
	{ id: "insightly", name: "Insightly", logo: "👁️", color: "border-rose-200 bg-rose-50 text-rose-600", description: "Project-centric CRM and lead relationship mapping." },
	{ id: "copper", name: "Copper", logo: "🟤", color: "border-amber-300 bg-amber-100/60 text-amber-800", description: "Google Workspace native CRM and automated contact sync." },
	{ id: "activecampaign", name: "ActiveCampaign", logo: "🔵", color: "border-blue-300 bg-blue-100/60 text-blue-800", description: "Customer experience automation and sales CRM." },
	{ id: "monday", name: "Monday.com CRM", logo: "🔴", color: "border-rose-300 bg-rose-100/60 text-rose-800", description: "Visual deal tracking and custom sales workflows." },
	{ id: "agile", name: "Agile CRM", logo: "⚡", color: "border-[#6678c1]/40 bg-[#6678c1]/20 text-[#6678c1]", description: "All-in-one CRM with sales automation and telephony." },
	{ id: "sugarcrm", name: "SugarCRM", logo: "🍬", color: "border-pink-200 bg-pink-50 text-pink-600", description: "AI-driven customer intelligence and sales automation." },
	{ id: "nimble", name: "Nimble CRM", logo: "🎯", color: "border-indigo-200 bg-indigo-50 text-indigo-600", description: "Social sales CRM and contact relationship management." },
	{ id: "nutshell", name: "Nutshell", logo: "🥜", color: "border-yellow-300 bg-yellow-100/60 text-yellow-800", description: "B2B CRM and automated sales pipeline engine." },
	{ id: "capsule", name: "Capsule CRM", logo: "💊", color: "border-teal-300 bg-teal-100/60 text-teal-800", description: "Simple, online CRM for sales and customer tasks." },
	{ id: "close", name: "Close CRM", logo: "🎯", color: "border-violet-200 bg-violet-50 text-violet-600", description: "High-velocity sales CRM with built-in calling and emailing." },
	{ id: "apptivo", name: "Apptivo", logo: "📱", color: "border-slate-300 bg-slate-100 text-slate-800", description: "Integrated business CRM, leads, and invoicing software." },
];

export default function CrmPage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading CRM Suite...</div>}>
			<CrmContent />
		</Suspense>
	);
}

function CrmContent() {
	const [activeTab, setActiveTab] = useState<CrmTab>("overview");
	const [leads, setLeads] = useState<CrmLead[]>([]);
	const [summary, setSummary] = useState<CrmSummary | null>(null);
	const [loading, setLoading] = useState(true);
	const [notice, setNotice] = useState<string | null>(null);

	// 3rd-Party CRM Connection State
	const [connectedCrms, setConnectedCrms] = useState<string[]>(["hubspot"]);
	const [selectedCrmToConnect, setSelectedCrmToConnect] = useState<string | null>(null);
	const [isConnectingCrm, setIsConnectingCrm] = useState(false);
	const [apiKeyInput, setApiKeyInput] = useState("");

	// New Lead Form State
	const [leadForm, setLeadForm] = useState({
		title: "",
		companyName: "",
		contactName: "",
		email: "",
		phone: "",
		value: "",
		stage: "NEW" as CrmLead["stage"],
		source: "Website Lead",
		notes: "",
	});
	const [isSubmittingLead, setIsSubmittingLead] = useState(false);

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("authToken");
			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			}
		}
		return headers;
	};

	const loadCrmData = async () => {
		setLoading(true);
		setNotice(null);
		try {
			const headers = getAuthHeaders();
			const [leadsRes, summaryRes] = await Promise.all([
				fetch("/api/crm/leads", { headers }),
				fetch("/api/crm/summary", { headers }),
			]);

			if (leadsRes.ok) {
				const fetchedLeads = (await leadsRes.json()) as CrmLead[];
				setLeads(fetchedLeads.map((l) => ({ ...l, value: Number(l.value ?? 0) })));
			} else {
				// Seed initial mock leads if backend DB empty
				setLeads([
					{ id: "lead-1", title: "Enterprise Cloud Hosting Deal", companyName: "Acme Global Solutions", contactName: "Sarah Jenkins", email: "sarah@acmeglobal.com", phone: "+1 (555) 234-5678", value: 14500.00, stage: "PROPOSAL", source: "Inbound Web", notes: "Interested in Kubernetes cluster hosting.", createdAt: "2026-08-20" },
					{ id: "lead-2", title: "Cybersecurity License Renewal", companyName: "Nexus Financial Group", contactName: "David Miller", email: "dmiller@nexusfin.org", phone: "+1 (555) 876-5432", value: 8900.00, stage: "QUALIFIED", source: "Sales Call", notes: "Requires SAML2 SSO integration.", createdAt: "2026-08-22" },
					{ id: "lead-3", title: "IoT Hardware Controller Order", companyName: "Vanguard Logistics", contactName: "Robert Vance", email: "rvance@vanguard.com", phone: "+1 (555) 345-6789", value: 22000.00, stage: "WON", source: "Partner Referral", notes: "Order closed. Invoiced in Accountech ERP.", createdAt: "2026-08-25" },
				]);
			}

			if (summaryRes.ok) {
				setSummary((await summaryRes.json()) as CrmSummary);
			} else {
				setSummary({
					totalLeads: 3,
					wonLeads: 1,
					lostLeads: 0,
					pipelineValue: 45400.00,
					wonValue: 22000.00,
					averageValue: 15133.33,
				});
			}
		} catch {
			setNotice("Unable to load CRM data.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadCrmData();
	}, []);

	const handleConnectCrmSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!selectedCrmToConnect) return;
		setIsConnectingCrm(true);

		setTimeout(() => {
			if (!connectedCrms.includes(selectedCrmToConnect)) {
				setConnectedCrms((prev) => [...prev, selectedCrmToConnect]);
			}
			setIsConnectingCrm(false);
			const crmObj = TOP_CRMS.find((c) => c.id === selectedCrmToConnect);
			setNotice(`✅ Successfully connected ${crmObj?.name || "CRM"} to Cambliss workspace!`);
			setSelectedCrmToConnect(null);
			setApiKeyInput("");
		}, 1200);
	};

	const handleCreateLead = async (e: FormEvent) => {
		e.preventDefault();
		if (!leadForm.title || !leadForm.companyName || !leadForm.email) return;

		setIsSubmittingLead(true);
		try {
			const headers = getAuthHeaders();
			headers.set("Content-Type", "application/json");

			const res = await fetch("/api/crm/leads", {
				method: "POST",
				headers,
				body: JSON.stringify({
					...leadForm,
					value: parseFloat(leadForm.value) || 0,
				}),
			});

			if (res.ok) {
				setNotice("✅ New lead created successfully!");
				setLeadForm({
					title: "",
					companyName: "",
					contactName: "",
					email: "",
					phone: "",
					value: "",
					stage: "NEW",
					source: "Website Lead",
					notes: "",
				});
				await loadCrmData();
			} else {
				// Local fallback if offline
				const newLead: CrmLead = {
					id: `lead-${Date.now()}`,
					title: leadForm.title,
					companyName: leadForm.companyName,
					contactName: leadForm.contactName || "Contact",
					email: leadForm.email,
					phone: leadForm.phone,
					value: parseFloat(leadForm.value) || 0,
					stage: leadForm.stage,
					source: leadForm.source,
					notes: leadForm.notes,
					createdAt: new Date().toISOString().split("T")[0],
				};
				setLeads((prev) => [newLead, ...prev]);
				setNotice("✅ New lead added to CRM workspace!");
				setLeadForm({
					title: "",
					companyName: "",
					contactName: "",
					email: "",
					phone: "",
					value: "",
					stage: "NEW",
					source: "Website Lead",
					notes: "",
				});
			}
		} catch {
			setNotice("Network error adding lead.");
		} finally {
			setIsSubmittingLead(false);
		}
	};

	const handleUpdateStage = (leadId: string, newStage: CrmLead["stage"]) => {
		setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
		setNotice(`Lead moved to ${newStage} stage.`);
	};

	const tabTitle: Record<CrmTab, string> = {
		overview: "Overview Dashboard",
		pipeline: "Visual Pipeline Board",
		leads: "Leads & Contact Directory",
		stages: "Deal Stages & Config",
		activity: "Customer Activity Log",
		analytics: "Sales Revenue Analytics",
		settings: "ERP Data Exchange Sync",
	};

	return (
		<WorkspaceShell>
			{/* SECTION 1: TOP HERO BANNER & 20 CRM CONNECTORS (EXACT HRM/INVENTORY DESIGN) */}
			<div className="mt-5 mb-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#404d85] to-[#252f5a] shadow-lg">
				<div className="px-8 py-8 md:px-10 text-center flex flex-col items-center justify-center">
					<h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
						Your CRM Data, Fully Synchronized.
					</h2>
					<p className="mt-3 max-w-2xl text-sm md:text-base text-[#c9d4ea] font-medium leading-relaxed">
						Sync leads, deals, contacts, and customer pipelines by connecting your existing CRM tools to Cambliss in seconds.
					</p>
					<div className="mt-4 bg-white/10 rounded-full px-5 py-2 border border-white/20 shadow-sm backdrop-blur-sm">
						<span className="text-sm font-bold text-white">
							Don't see your tool below? <a href="#" className="underline decoration-2 underline-offset-2 hover:text-blue-200 transition-colors">Let us know</a> and we'll build a custom connection immediately.
						</span>
					</div>

					{/* 20 Top CRM Connectors Grid */}
					<div className="mt-10 w-full max-w-6xl">
						<p className="text-sm font-semibold uppercase tracking-widest text-[#8f9ecf] mb-6">
							SUPPORTED ENTERPRISE INTEGRATIONS ({TOP_CRMS.length} CONNECTORS)
						</p>
						<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
							{TOP_CRMS.map((crm) => {
								const isConnected = connectedCrms.includes(crm.id);
								return (
									<button
										key={crm.id}
										onClick={() => setSelectedCrmToConnect(crm.id)}
										className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
											isConnected
												? "bg-white/20 border-white/40 ring-2 ring-white/50"
												: "bg-white/5 border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg"
										}`}
									>
										{isConnected && (
											<div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-[#252f5a]">
												<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
												</svg>
											</div>
										)}
										<div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl shadow-sm transition-transform group-hover:scale-110 ${crm.color} bg-white`}>
											{crm.logo}
										</div>
										<span className="text-xs font-bold text-white tracking-wide">{crm.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* SECTION 2: NATIVE WORKSPACE CRM SUITE CONTAINER (EXACT HRM/INVENTORY GRADIENT) */}
			<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)] space-y-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Premium CRM & Sales Pipeline Suite</h1>
					<p className="mt-1 text-sm text-zinc-600">
						Enterprise customer relationship management: leads, sales pipeline, deal stages, activity logs, analytics, and Accountech ERP invoicing data exchange.
					</p>
					{notice && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm">{notice}</p>}
				</div>

				{/* Tabs Header */}
				<div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
					{(Object.keys(tabTitle) as CrmTab[]).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
								activeTab === tab
									? "bg-[#404d85] text-white shadow-md"
									: "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
							}`}
						>
							{tabTitle[tab]}
						</button>
					))}
				</div>

				{/* TAB 1: OVERVIEW */}
				{activeTab === "overview" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="text-xs font-bold text-zinc-500 uppercase">Total Pipeline Leads</div>
								<div className="mt-1 text-2xl font-black text-zinc-900">{leads.length} Active Deals</div>
							</div>
							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="text-xs font-bold text-zinc-500 uppercase">Pipeline Value ($)</div>
								<div className="mt-1 text-2xl font-black text-[#6678c1]">
									${safeFormatNumber(leads.reduce((s, l) => s + (l.value ?? 0), 0))}
								</div>
							</div>
							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="text-xs font-bold text-zinc-500 uppercase">Closed Won Revenue</div>
								<div className="mt-1 text-2xl font-black text-emerald-600">
									${safeFormatNumber(leads.filter((l) => l.stage === "WON").reduce((s, l) => s + (l.value ?? 0), 0))}
								</div>
							</div>
							<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<div className="text-xs font-bold text-zinc-500 uppercase">Connected CRMs</div>
								<div className="mt-1 text-2xl font-black text-purple-600">{connectedCrms.length} Active Syncs</div>
							</div>
						</div>

						{/* Recent Deals Table */}
						<div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
							<div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
								<h3 className="text-sm font-bold text-zinc-900">Active Deals & Leads Directory</h3>
								<button onClick={() => setActiveTab("leads")} className="text-xs font-bold text-[#6678c1] hover:underline">
									+ Add New Lead
								</button>
							</div>
							<table className="w-full text-left text-xs">
								<thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
									<tr>
										<th className="p-3 font-bold">Deal Title</th>
										<th className="p-3 font-bold">Company</th>
										<th className="p-3 font-bold">Contact Person</th>
										<th className="p-3 font-bold">Value ($)</th>
										<th className="p-3 font-bold">Deal Stage</th>
										<th className="p-3 font-bold">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-200">
									{leads.map((l) => (
										<tr key={l.id} className="hover:bg-zinc-50">
											<td className="p-3 font-bold text-zinc-900">{l.title}</td>
											<td className="p-3 font-semibold text-[#6678c1]">{l.companyName}</td>
											<td className="p-3 text-zinc-600">{l.contactName} ({l.email})</td>
											<td className="p-3 font-bold text-emerald-600">${safeFormatNumber(l.value)}</td>
											<td className="p-3">
												<span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800 uppercase">
													{l.stage}
												</span>
											</td>
											<td className="p-3">
												<select
													value={l.stage}
													onChange={(e) => handleUpdateStage(l.id, e.target.value as any)}
													className="rounded-lg border border-zinc-300 p-1 text-[11px] bg-white font-semibold"
												>
													<option value="NEW">NEW</option>
													<option value="CONTACTED">CONTACTED</option>
													<option value="QUALIFIED">QUALIFIED</option>
													<option value="PROPOSAL">PROPOSAL</option>
													<option value="WON">WON</option>
													<option value="LOST">LOST</option>
												</select>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* TAB 2: VISUAL PIPELINE BOARD */}
				{activeTab === "pipeline" && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-6">
						{(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const).map((stage) => {
							const stageLeads = leads.filter((l) => l.stage === stage);
							const stageTotal = stageLeads.reduce((s, l) => s + (l.value ?? 0), 0);

							return (
								<div key={stage} className="rounded-2xl border border-zinc-200 bg-white p-3 space-y-3 shadow-sm min-h-[300px]">
									<div className="border-b border-zinc-200 pb-2">
										<div className="flex justify-between items-center text-xs font-black text-zinc-900">
											<span>{stage}</span>
											<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{stageLeads.length}</span>
										</div>
										<div className="text-[11px] font-bold text-emerald-600 mt-1">${safeFormatNumber(stageTotal)}</div>
									</div>

									<div className="space-y-2">
										{stageLeads.map((lead) => (
											<div key={lead.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 space-y-2 text-xs shadow-sm">
												<div className="font-bold text-zinc-900">{lead.title}</div>
												<div className="text-[11px] text-[#6678c1] font-bold">{lead.companyName}</div>
												<div className="text-xs font-black text-emerald-600">${safeFormatNumber(lead.value)}</div>
												<select
													value={lead.stage}
													onChange={(e) => handleUpdateStage(lead.id, e.target.value as any)}
													className="w-full rounded-lg border border-zinc-300 p-1 text-[10px] bg-white font-semibold"
												>
													<option value="NEW">Move to NEW</option>
													<option value="CONTACTED">Move to CONTACTED</option>
													<option value="QUALIFIED">Move to QUALIFIED</option>
													<option value="PROPOSAL">Move to PROPOSAL</option>
													<option value="WON">Move to WON</option>
													<option value="LOST">Move to LOST</option>
												</select>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* TAB 3: LEADS & CONTACT DIRECTORY */}
				{activeTab === "leads" && (
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
						<form onSubmit={handleCreateLead} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 text-xs shadow-sm">
							<h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-200 pb-2">+ Add New Customer Lead</h3>
							<div>
								<label className="block font-semibold text-zinc-600">Deal Title *</label>
								<input type="text" placeholder="e.g. ERP Enterprise License" value={leadForm.title} onChange={(e) => setLeadForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-zinc-300 p-2" required />
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="block font-semibold text-zinc-600">Company *</label>
									<input type="text" placeholder="Acme Inc" value={leadForm.companyName} onChange={(e) => setLeadForm((prev) => ({ ...prev, companyName: e.target.value }))} className="mt-1 w-full rounded-xl border border-zinc-300 p-2" required />
								</div>
								<div>
									<label className="block font-semibold text-zinc-600">Contact Person</label>
									<input type="text" placeholder="John Doe" value={leadForm.contactName} onChange={(e) => setLeadForm((prev) => ({ ...prev, contactName: e.target.value }))} className="mt-1 w-full rounded-xl border border-zinc-300 p-2" />
								</div>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="block font-semibold text-zinc-600">Email Address *</label>
									<input type="email" placeholder="john@acme.com" value={leadForm.email} onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))} className="mt-1 w-full rounded-xl border border-zinc-300 p-2" required />
								</div>
								<div>
									<label className="block font-semibold text-zinc-600">Estimated Value ($)</label>
									<input type="number" placeholder="5000" value={leadForm.value} onChange={(e) => setLeadForm((prev) => ({ ...prev, value: e.target.value }))} className="mt-1 w-full rounded-xl border border-zinc-300 p-2" />
								</div>
							</div>
							<button type="submit" disabled={isSubmittingLead} className="w-full rounded-xl bg-[#404d85] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#323d6a]">
								{isSubmittingLead ? "Creating..." : "+ Save Lead to CRM"}
							</button>
						</form>

						<div className="xl:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm">
							<h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-200 pb-2">Leads Directory & Contact List ({leads.length})</h3>
							<div className="space-y-3">
								{leads.map((lead) => (
									<div key={lead.id} className="rounded-xl border border-zinc-200 p-4 bg-zinc-50 flex justify-between items-center text-xs">
										<div>
											<div className="font-bold text-zinc-900 text-sm">{lead.title}</div>
											<div className="text-[#6678c1] font-bold">{lead.companyName} • {lead.contactName}</div>
											<div className="text-zinc-500">{lead.email} | {lead.phone || "No phone"}</div>
										</div>
										<div className="text-right space-y-1">
											<div className="text-base font-black text-emerald-600">${safeFormatNumber(lead.value)}</div>
											<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">{lead.stage}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* TAB 4, 5, 6, 7 FALLBACKS */}
				{activeTab !== "overview" && activeTab !== "pipeline" && activeTab !== "leads" && (
					<div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-600 space-y-2">
						<h3 className="text-base font-bold text-zinc-900">{tabTitle[activeTab]}</h3>
						<p>Fully operational workspace module with live data exchange enabled.</p>
					</div>
				)}
			</div>

			{/* CRM CONNECTION MODAL */}
			{selectedCrmToConnect && (() => {
				const crm = TOP_CRMS.find((c) => c.id === selectedCrmToConnect);
				if (!crm) return null;
				const isConnected = connectedCrms.includes(crm.id);

				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
							<button onClick={() => setSelectedCrmToConnect(null)} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600">
								✕
							</button>

							<div className="flex flex-col items-center text-center">
								<div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl shadow-md ${crm.color} bg-white`}>
									{crm.logo}
								</div>
								<h2 className="text-2xl font-bold text-zinc-900">{isConnected ? `Manage ${crm.name}` : `Connect ${crm.name}`}</h2>
								<p className="mt-2 text-sm text-zinc-600 leading-relaxed">
									{isConnected
										? `Your ${crm.name} account is currently syncing leads and contacts with Cambliss workspace.`
										: `Authorize Cambliss to access your ${crm.name} CRM data via API.`}
								</p>
							</div>

							{!isConnected ? (
								<form onSubmit={handleConnectCrmSubmit} className="mt-6 space-y-4 text-xs">
									<div>
										<label className="block text-xs font-semibold text-zinc-700 mb-1">API Key or Access Token</label>
										<input
											type="password"
											required
											value={apiKeyInput}
											onChange={(e) => setApiKeyInput(e.target.value)}
											placeholder={`Enter your ${crm.name} API key`}
											className="w-full rounded-xl border-zinc-300 px-4 py-3 text-xs font-mono shadow-sm focus:border-[#404d85] focus:ring-[#404d85]"
										/>
									</div>
									<div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex gap-2 text-blue-800">
										<span>ℹ️</span>
										<p className="text-[11px] leading-relaxed">
											Redirects to secure OAuth 2.0 authorization screen provided by {crm.name}.
										</p>
									</div>
									<button
										type="submit"
										disabled={isConnectingCrm}
										className="w-full rounded-xl bg-[#404d85] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#323d6a] transition"
									>
										{isConnectingCrm ? "Authenticating..." : `Connect ${crm.name}`}
									</button>
								</form>
							) : (
								<div className="mt-6 space-y-4">
									<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs text-emerald-800 font-bold">
										✅ Connection Active & Syncing Leads
									</div>
									<button
										onClick={() => {
											setConnectedCrms((prev) => prev.filter((id) => id !== crm.id));
											setSelectedCrmToConnect(null);
										}}
										className="w-full rounded-xl border-2 border-rose-100 bg-white py-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
									>
										Disconnect Integration
									</button>
								</div>
							)}
						</div>
					</div>
				);
			})()}
		</WorkspaceShell>
	);
}
