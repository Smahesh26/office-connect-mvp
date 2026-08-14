"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import WorkspaceShell from "../../components/WorkspaceShell";
import * as XLSX from "xlsx";

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
	isArchived?: boolean;
};

type Deal = {
	id: string;
	contactId: string;
	pipelineId: string;
	stageId: string;
	status: string;
	probability: number;
	value: number;
	isArchived?: boolean;
	contact?: {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		email?: string | null;
		phone?: string | null;
	} | null;
};

type StageHistory = {
	id?: string;
	changedAt?: string;
	fromStage?: { name?: string } | null;
	toStage?: { name?: string } | null;
	user?: { firstName?: string | null; lastName?: string | null; email?: string };
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

type ServiceCase = {
	id: string;
	subject: string;
	priority: "LOW" | "MEDIUM" | "HIGH";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
};

type Campaign = {
	id: string;
	name: string;
	segment: string;
	status: "DRAFT" | "RUNNING" | "PAUSED";
};

type Integration = {
	moduleId: string;
	moduleName: string;
	description: string | null;
	isConnected: boolean;
	updatedAt: string | null;
};

type SetupContactOption = {
	id: string;
	label: string;
	email: string | null;
	phone: string | null;
};

type SetupStageOption = {
	id: string;
	name: string;
	order: number;
};

type SetupPipelineOption = {
	id: string;
	name: string;
	stages: SetupStageOption[];
};

type SetupOptions = {
	contacts: SetupContactOption[];
	pipelines: SetupPipelineOption[];
};

type NoCostCrmProfile = {
	mode: "NO_COST";
	requiresThirdPartyApis: false;
	coreCapabilities: {
		customerData: boolean;
		leadManagement: boolean;
		salesPipeline: boolean;
		communicationTracking: boolean;
		automationReady: boolean;
		reportsAndInsights: boolean;
		supportWorkflow: boolean;
	};
	stats: {
		contacts: number;
		leads: number;
		deals: number;
		pipelines: number;
		stages: number;
		activities: number;
	};
	optionalPaidIntegrations: Array<{
		name: string;
		required: false;
		useCase: string;
	}>;
};

const emptyLeadForm = {
	firstName: "",
	lastName: "",
	email: "",
	phone: "",
	companyName: "",
	source: "",
	status: "NEW",
};

const emptyDealForm = {
	contactId: "",
	pipelineId: "",
	stageId: "",
	value: "",
	probability: "",
	status: "OPEN",
};

const tabTitle: Record<SuiteTab, string> = {
	overview: "Executive Overview",
	customer360: "Customer 360",
	sales: "Sales Execution",
	service: "Service & Support",
	marketing: "Marketing CRM",
	revenue: "Revenue CRM",
	analytics: "Analytics & AI",
	automation: "Workflow Automation",
	governance: "Enterprise Controls",
};

const getApiErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	const raw = await response.text();
	if (!raw) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(raw) as { message?: string };
		return parsed.message || fallback;
	} catch {
		return raw;
	}
};

const parseCSV = (text: string) => {
	const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
	const lines = cleanText.split('\n').filter(l => l.trim() !== '');
	if (lines.length === 0) return { headers: [], rows: [] };
	const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').trim());
	const rows = lines.slice(1).map(line => {
		const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').trim());
		return headers.reduce((acc, header, index) => {
			if (header) {
				acc[header] = values[index] || '';
			}
			return acc;
		}, {} as Record<string, string>);
	});
	return { headers, rows };
};

const IMPORT_MODULE_FIELDS = {
	leads: [
		{ key: "firstName", label: "First Name", required: true, aliases: ["firstname", "first", "fname", "frstname", "given name", "givenname", "forename", "name", "fullname", "full name", "lead name", "contact name", "customer name"] },
		{ key: "lastName", label: "Last Name", required: false, aliases: ["lastname", "last", "lname", "surname", "family name", "familyname"] },
		{ key: "email", label: "Email Address", required: true, aliases: ["email", "emailaddress", "e-mail", "email id", "emailid", "mail", "contact email"] },
		{ key: "phone", label: "Phone Number", required: false, aliases: ["phone", "phonenumber", "mobile", "mobilenumber", "mobile number", "contact", "contactnumber", "cell", "cellphone", "tel", "telephone", "phone no", "mobile no"] },
		{ key: "companyName", label: "Company", required: false, aliases: ["company", "companyname", "organisation", "organization", "firm", "business", "employer", "company name"] },
		{ key: "source", label: "Source", required: false, aliases: ["source", "leadsource", "lead source", "channel", "medium", "origin"] },
		{ key: "status", label: "Status (NEW, CONTACTED, QUALIFIED)", required: false, aliases: ["status", "leadstatus", "lead status", "state"] },
	],
	serviceCases: [
		{ key: "subject", label: "Case Subject", required: true, aliases: ["subject", "title", "issue", "problem", "case", "description", "summary"] },
		{ key: "priority", label: "Priority (LOW, MEDIUM, HIGH)", required: false, aliases: ["priority", "urgency", "severity", "level"] },
	],
	campaigns: [
		{ key: "name", label: "Campaign Name", required: true, aliases: ["name", "campaignname", "campaign", "title"] },
		{ key: "segment", label: "Target Segment", required: false, aliases: ["segment", "audience", "target", "targetsegment", "group"] },
	]
};

const TOP_CRMS = [
	{ id: "salesforce", name: "Salesforce", color: "bg-[#00a1e0]/10 text-[#00a1e0] border-[#00a1e0]/20", logo: "☁️" },
	{ id: "hubspot", name: "HubSpot", color: "bg-[#ff7a59]/10 text-[#ff7a59] border-[#ff7a59]/20", logo: "⚙️" },
	{ id: "zoho", name: "Zoho CRM", color: "bg-[#f0483e]/10 text-[#f0483e] border-[#f0483e]/20", logo: "📦" },
	{ id: "dynamics", name: "Dynamics 365", color: "bg-[#002050]/10 text-[#002050] border-[#002050]/20", logo: "💼" },
	{ id: "pipedrive", name: "Pipedrive", color: "bg-[#00b050]/10 text-[#00b050] border-[#00b050]/20", logo: "📈" },
	{ id: "monday", name: "Monday.com", color: "bg-[#ff3d57]/10 text-[#ff3d57] border-[#ff3d57]/20", logo: "🗓️" },
	{ id: "zendesk", name: "Zendesk Sell", color: "bg-[#03363d]/10 text-[#03363d] border-[#03363d]/20", logo: "🎧" },
	{ id: "freshsales", name: "Freshsales", color: "bg-[#002b49]/10 text-[#002b49] border-[#002b49]/20", logo: "🍃" },
	{ id: "activecampaign", name: "ActiveCampaign", color: "bg-[#356ae6]/10 text-[#356ae6] border-[#356ae6]/20", logo: "✉️" },
	{ id: "keap", name: "Keap", color: "bg-[#00b274]/10 text-[#00b274] border-[#00b274]/20", logo: "🌱" },
];

export default function CrmPage() {
	const [activeTab, setActiveTab] = useState<SuiteTab>("overview");
	const [notice, setNotice] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [dashboard, setDashboard] = useState<CrmDashboard | null>(null);
	const [leads, setLeads] = useState<Lead[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [selectedDealHistory, setSelectedDealHistory] = useState<StageHistory[]>([]);
	const [historyDealId, setHistoryDealId] = useState<string | null>(null);

	const [leadForm, setLeadForm] = useState(emptyLeadForm);
	const [dealForm, setDealForm] = useState(emptyDealForm);
	const [stageUpdate, setStageUpdate] = useState<Record<string, string>>({});

	const [serviceCases, setServiceCases] = useState<ServiceCase[]>([]);
	const [caseSubject, setCaseSubject] = useState("");
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [campaignName, setCampaignName] = useState("");
	const [campaignSegment, setCampaignSegment] = useState("");
	const [setupOptions, setSetupOptions] = useState<SetupOptions>({ contacts: [], pipelines: [] });
	const [integrations, setIntegrations] = useState<Integration[]>([]);

	// Import Wizard State
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
	const [importModule, setImportModule] = useState<"leads" | "serviceCases" | "campaigns">("leads");
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importHeaders, setImportHeaders] = useState<string[]>([]);
	const [importData, setImportData] = useState<Record<string, string>[]>([]);
	const [columnMapping, setColumnMapping] = useState<Record<string, { csvColumn: string, defaultValue: string }>>({});
	const [isImporting, setIsImporting] = useState(false);
	
	// External CRM Integration State
	const [selectedCrmToConnect, setSelectedCrmToConnect] = useState<string | null>(null);
	const [connectedCrms, setConnectedCrms] = useState<string[]>([]);
	const [isConnectingCrm, setIsConnectingCrm] = useState(false);
	const [noCostProfile, setNoCostProfile] = useState<NoCostCrmProfile | null>(null);

	const [isSavingLead, setIsSavingLead] = useState(false);
	const [isSavingDeal, setIsSavingDeal] = useState(false);
	const [isSavingServiceCase, setIsSavingServiceCase] = useState(false);
	const [isSavingCampaign, setIsSavingCampaign] = useState(false);
	const [pendingServiceStatus, setPendingServiceStatus] = useState<Record<string, boolean>>({});
	const [pendingCampaignStatus, setPendingCampaignStatus] = useState<Record<string, boolean>>({});
	const [pendingIntegration, setPendingIntegration] = useState<Record<string, boolean>>({});
	const [isResettingCrm, setIsResettingCrm] = useState(false);
	const [didAuthRedirect, setDidAuthRedirect] = useState(false);

	const redirectToLogin = () => {
		if (didAuthRedirect) {
			return;
		}
		setDidAuthRedirect(true);
		setNotice("Session expired. Redirecting to login...");
		if (typeof window !== "undefined") {
			localStorage.removeItem("authToken");
			localStorage.removeItem("authUser");
			window.setTimeout(() => {
				window.location.href = "/login";
			}, 600);
		}
	};

	const getAuthHeaders = (): Headers => {
		const headers = new Headers();
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}
		return headers;
	};

	const loadAll = async () => {
		setIsLoading(true);
		setNotice(null);
		try {
			if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
				redirectToLogin();
				return;
			}

			const authHeaders = getAuthHeaders();
			const [dashboardRes, leadsRes, dealsRes, serviceCasesRes, campaignsRes, integrationsRes, setupRes, noCostProfileRes] = await Promise.all([
				fetch("/api/crm/dashboard", { headers: authHeaders }),
				fetch("/api/crm/leads", { headers: authHeaders }),
				fetch("/api/crm/deals", { headers: authHeaders }),
				fetch("/api/crm/service/cases", { headers: authHeaders }),
				fetch("/api/crm/marketing/campaigns", { headers: authHeaders }),
				fetch("/api/crm/integrations", { headers: authHeaders }),
				fetch("/api/crm/setup/options", { headers: authHeaders }),
				fetch("/api/crm/no-cost-profile", { headers: authHeaders }),
			]);

			if (dashboardRes.status === 401 || leadsRes.status === 401 || dealsRes.status === 401) {
				redirectToLogin();
				return;
			}

			if (!dashboardRes.ok || !leadsRes.ok || !dealsRes.ok) {
				const failed = [dashboardRes, leadsRes, dealsRes].find((res) => !res.ok);
				const message = failed ? await getApiErrorMessage(failed, "Unable to load CRM.") : "Unable to load CRM.";
				setNotice(message);
				setDashboard(null);
				setLeads([]);
				setDeals([]);
				setServiceCases([]);
				setCampaigns([]);
				setIntegrations([]);
				setSetupOptions({ contacts: [], pipelines: [] });
				return;
			}

			setDashboard((await dashboardRes.json()) as CrmDashboard);
			setLeads((await leadsRes.json()) as Lead[]);
			setDeals((await dealsRes.json()) as Deal[]);

			if (serviceCasesRes.ok) {
				setServiceCases((await serviceCasesRes.json()) as ServiceCase[]);
			} else {
				setServiceCases([]);
			}

			if (campaignsRes.ok) {
				setCampaigns((await campaignsRes.json()) as Campaign[]);
			} else {
				setCampaigns([]);
			}

			if (integrationsRes.ok) {
				setIntegrations((await integrationsRes.json()) as Integration[]);
			} else {
				setIntegrations([]);
			}

			if (setupRes.ok) {
				setSetupOptions((await setupRes.json()) as SetupOptions);
			} else {
				setSetupOptions({ contacts: [], pipelines: [] });
			}

			if (noCostProfileRes.ok) {
				setNoCostProfile((await noCostProfileRes.json()) as NoCostCrmProfile);
			} else {
				setNoCostProfile(null);
			}
		} catch {
			setNotice("Unable to load CRM.");
			setDashboard(null);
			setLeads([]);
			setDeals([]);
			setServiceCases([]);
			setCampaigns([]);
			setIntegrations([]);
			setSetupOptions({ contacts: [], pipelines: [] });
			setNoCostProfile(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void loadAll();
	}, []);

	const handleCreateLead = async (event: FormEvent) => {
		event.preventDefault();
		const hasPrimaryLeadInput =
			Boolean(leadForm.firstName.trim()) ||
			Boolean(leadForm.email.trim()) ||
			Boolean(leadForm.phone.trim()) ||
			Boolean(leadForm.companyName.trim());

		if (!hasPrimaryLeadInput) {
			setNotice("Enter at least one field: first name, email, phone, or company.");
			return;
		}

		setIsSavingLead(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const payload = {
				...leadForm,
				firstName: leadForm.firstName.trim(),
				lastName: leadForm.lastName.trim(),
				email: leadForm.email.trim(),
				phone: leadForm.phone.trim(),
				companyName: leadForm.companyName.trim(),
				source: leadForm.source.trim(),
			};
			const response = await fetch("/api/crm/leads", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(payload),
			});

			if (response.status === 401) {
				redirectToLogin();
				return;
			}

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to create lead."));
				return;
			}

			setLeadForm(emptyLeadForm);
			await loadAll();
			setNotice("Lead created.");
		} catch {
			setNotice("Unable to create lead.");
		} finally {
			setIsSavingLead(false);
		}
	};

	const handleArchiveLead = async (leadId: string, archived?: boolean) => {
		const authHeaders = getAuthHeaders();
		const endpoint = archived ? `/api/crm/leads/${leadId}/restore` : `/api/crm/leads/${leadId}/archive`;
		const response = await fetch(endpoint, { method: "POST", headers: authHeaders });
		if (!response.ok) {
			setNotice("Lead action failed.");
			return;
		}
		await loadAll();
	};

	const handleDeleteLead = async (leadId: string) => {
		if (!window.confirm("Delete this lead permanently?")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Lead delete failed.");
			return;
		}
		await loadAll();
		setNotice("Lead deleted.");
	};

	const handleEditLead = async (lead: Lead) => {
		const firstName = window.prompt("Lead first name", lead.firstName || "");
		if (firstName === null) {
			return;
		}
		const email = window.prompt("Lead email", lead.email || "");
		if (email === null) {
			return;
		}
		const phone = window.prompt("Lead phone", lead.phone || "");
		if (phone === null) {
			return;
		}
		const status = window.prompt("Lead status", lead.status || "NEW");
		if (status === null) {
			return;
		}
		const source = window.prompt("Lead source", lead.source || "");
		if (source === null) {
			return;
		}

		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/leads/${lead.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ firstName, email, phone, status, source }),
		});
		if (!response.ok) {
			setNotice("Lead update failed.");
			return;
		}
		await loadAll();
		setNotice("Lead updated.");
	};

	const handleCreateDeal = async (event: FormEvent) => {
		event.preventDefault();

		if (!dealForm.contactId) {
			setNotice("Select a contact saved in your CRM setup to create a deal.");
			return;
		}

		setIsSavingDeal(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const payload = {
				contactId: dealForm.contactId,
				pipelineId: dealForm.pipelineId || undefined,
				stageId: dealForm.stageId || undefined,
				value: Number(dealForm.value || 0),
				probability: Number(dealForm.probability || 0),
				status: dealForm.status || "OPEN",
			};
			const response = await fetch("/api/crm/deals", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(payload),
			});

			if (response.status === 401) {
				redirectToLogin();
				return;
			}

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to create deal."));
				return;
			}

			setDealForm(emptyDealForm);
			await loadAll();
			setNotice("Deal created.");
		} catch {
			setNotice("Unable to create deal.");
		} finally {
			setIsSavingDeal(false);
		}
	};

	const handleArchiveDeal = async (dealId: string, archived?: boolean) => {
		const authHeaders = getAuthHeaders();
		const endpoint = archived ? `/api/crm/deals/${dealId}/restore` : `/api/crm/deals/${dealId}/archive`;
		const response = await fetch(endpoint, { method: "POST", headers: authHeaders });
		if (!response.ok) {
			setNotice("Deal action failed.");
			return;
		}
		await loadAll();
	};

	const handleDeleteDeal = async (dealId: string) => {
		if (!window.confirm("Delete this deal permanently?")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/deals/${dealId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Deal delete failed.");
			return;
		}
		await loadAll();
		setNotice("Deal deleted.");
	};

	const handleUpdateDealStage = async (dealId: string) => {
		const stageId = stageUpdate[dealId]?.trim();
		if (!stageId) {
			setNotice("Select a stage first.");
			return;
		}
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/deals/${dealId}/stage`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ stageId }),
		});

		if (!response.ok) {
			setNotice("Stage update failed. Verify stage belongs to deal pipeline.");
			return;
		}
		setStageUpdate((prev) => ({ ...prev, [dealId]: "" }));
		await loadAll();
		setNotice("Deal stage updated.");
	};

	const handleLoadHistory = async (dealId: string) => {
		const authHeaders = getAuthHeaders();
		setHistoryDealId(dealId);
		setSelectedDealHistory([]);
		const response = await fetch(`/api/crm/deals/${dealId}/history`, { headers: authHeaders });
		if (!response.ok) {
			setNotice("Unable to load stage history.");
			return;
		}
		const history = (await response.json()) as StageHistory[];
		setSelectedDealHistory(history);
	};

	const handleAddServiceCase = async (event: FormEvent) => {
		event.preventDefault();
		if (!caseSubject.trim()) {
			return;
		}
		setIsSavingServiceCase(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch("/api/crm/service/cases", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({ subject: caseSubject.trim(), priority: "MEDIUM" }),
			});
			if (!response.ok) {
				setNotice("Unable to create service case.");
				return;
			}
			setCaseSubject("");
			await loadAll();
		} finally {
			setIsSavingServiceCase(false);
		}
	};

	const handleUpdateServiceCaseStatus = async (
		caseId: string,
		status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
	) => {
		setPendingServiceStatus((prev) => ({ ...prev, [caseId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/service/cases/${caseId}/status`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ status }),
		});
		setPendingServiceStatus((prev) => ({ ...prev, [caseId]: false }));
		if (!response.ok) {
			setNotice("Unable to update service case status.");
			return;
		}
		await loadAll();
	};

	const handleEditServiceCase = async (serviceCase: ServiceCase) => {
		const subject = window.prompt("Service case subject", serviceCase.subject);
		if (subject === null) {
			return;
		}
		const priority = window.prompt("Priority (LOW, MEDIUM, HIGH)", serviceCase.priority);
		if (priority === null) {
			return;
		}

		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/service/cases/${serviceCase.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ subject, priority }),
		});
		if (!response.ok) {
			setNotice("Service case update failed.");
			return;
		}
		await loadAll();
		setNotice("Service case updated.");
	};

	const handleDeleteServiceCase = async (caseId: string) => {
		if (!window.confirm("Delete this service case permanently?")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/service/cases/${caseId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Service case delete failed.");
			return;
		}
		await loadAll();
		setNotice("Service case deleted.");
	};

	const handleAddCampaign = async (event: FormEvent) => {
		event.preventDefault();
		if (!campaignName.trim() || !campaignSegment.trim()) {
			return;
		}
		setIsSavingCampaign(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const response = await fetch("/api/crm/marketing/campaigns", {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({ name: campaignName.trim(), segment: campaignSegment.trim(), status: "DRAFT" }),
			});
			if (!response.ok) {
				setNotice("Unable to create campaign.");
				return;
			}
			setCampaignName("");
			setCampaignSegment("");
			await loadAll();
		} finally {
			setIsSavingCampaign(false);
		}
	};

	const handleUpdateCampaignStatus = async (
		campaignId: string,
		status: "DRAFT" | "RUNNING" | "PAUSED",
	) => {
		setPendingCampaignStatus((prev) => ({ ...prev, [campaignId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/marketing/campaigns/${campaignId}/status`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ status }),
		});
		setPendingCampaignStatus((prev) => ({ ...prev, [campaignId]: false }));
		if (!response.ok) {
			setNotice("Unable to update campaign status.");
			return;
		}
		await loadAll();
	};

	const handleEditCampaign = async (campaign: Campaign) => {
		const name = window.prompt("Campaign name", campaign.name);
		if (name === null) {
			return;
		}
		const segment = window.prompt("Campaign segment", campaign.segment);
		if (segment === null) {
			return;
		}
		const status = window.prompt("Campaign status (DRAFT, RUNNING, PAUSED)", campaign.status);
		if (status === null) {
			return;
		}

		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/marketing/campaigns/${campaign.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ name, segment, status }),
		});
		if (!response.ok) {
			setNotice("Campaign update failed.");
			return;
		}
		await loadAll();
		setNotice("Campaign updated.");
	};

	const handleDeleteCampaign = async (campaignId: string) => {
		if (!window.confirm("Delete this campaign permanently?")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/marketing/campaigns/${campaignId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice("Campaign delete failed.");
			return;
		}
		await loadAll();
		setNotice("Campaign deleted.");
	};

	const handleCreatePipeline = async () => {
		const name = window.prompt("Pipeline name");
		if (!name) {
			return;
		}
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch("/api/crm/pipelines", {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Pipeline create failed.");
			return;
		}
		await loadAll();
		setNotice("Pipeline created.");
	};

	const handleRenamePipeline = async (pipeline: SetupPipelineOption) => {
		const name = window.prompt("Pipeline name", pipeline.name);
		if (name === null) {
			return;
		}
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/pipelines/${pipeline.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ name }),
		});
		if (!response.ok) {
			setNotice("Pipeline update failed.");
			return;
		}
		await loadAll();
		setNotice("Pipeline updated.");
	};

	const handleDeletePipeline = async (pipelineId: string) => {
		if (!window.confirm("Delete this pipeline? It must have no deals.")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/pipelines/${pipelineId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Pipeline delete failed."));
			return;
		}
		await loadAll();
		setNotice("Pipeline deleted.");
	};

	const handleAddStage = async (pipelineId: string) => {
		const name = window.prompt("Stage name");
		if (!name) {
			return;
		}
		const orderRaw = window.prompt("Stage order (number)", "1");
		if (orderRaw === null) {
			return;
		}
		const order = Number(orderRaw);
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/pipelines/${pipelineId}/stages`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({ name, order }),
		});
		if (!response.ok) {
			setNotice("Stage create failed.");
			return;
		}
		await loadAll();
		setNotice("Stage created.");
	};

	const handleEditStage = async (stage: SetupStageOption) => {
		const name = window.prompt("Stage name", stage.name);
		if (name === null) {
			return;
		}
		const orderRaw = window.prompt("Stage order", String(stage.order));
		if (orderRaw === null) {
			return;
		}
		const order = Number(orderRaw);
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/stages/${stage.id}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ name, order }),
		});
		if (!response.ok) {
			setNotice("Stage update failed.");
			return;
		}
		await loadAll();
		setNotice("Stage updated.");
	};

	const handleDeleteStage = async (stageId: string) => {
		if (!window.confirm("Delete this stage? It must have no deals.")) {
			return;
		}
		const authHeaders = getAuthHeaders();
		const response = await fetch(`/api/crm/stages/${stageId}`, { method: "DELETE", headers: authHeaders });
		if (!response.ok) {
			setNotice(await getApiErrorMessage(response, "Stage delete failed."));
			return;
		}
		await loadAll();
		setNotice("Stage deleted.");
	};

	const handleToggleIntegration = async (moduleId: string, nextState: boolean) => {
		setPendingIntegration((prev) => ({ ...prev, [moduleId]: true }));
		const authHeaders = getAuthHeaders();
		authHeaders.set("Content-Type", "application/json");
		const response = await fetch(`/api/crm/integrations/${moduleId}`, {
			method: "PUT",
			headers: authHeaders,
			body: JSON.stringify({ isConnected: nextState }),
		});
		setPendingIntegration((prev) => ({ ...prev, [moduleId]: false }));
		if (!response.ok) {
			setNotice("Unable to update integration connection.");
			return;
		}
		await loadAll();
	};

	const handleResetCrmData = async () => {
		const confirmText = window.prompt("This will permanently delete all CRM leads, deals, pipeline stages, and CRM activities. Type RESET to continue.");
		if (confirmText !== "RESET") {
			setNotice("Reset cancelled.");
			return;
		}

		setIsResettingCrm(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			const response = await fetch("/api/crm/reset-data", {
				method: "POST",
				headers: authHeaders,
			});

			if (!response.ok) {
				setNotice(await getApiErrorMessage(response, "Unable to reset CRM data."));
				return;
			}

			if (typeof window !== "undefined") {
				window.location.reload();
			}
		} catch {
			setNotice("Unable to reset CRM data.");
		} finally {
			setIsResettingCrm(false);
		}
	};

	const regionCount = useMemo(() => {
		const regions = new Set<string>();
		for (const lead of leads) {
			if (lead.source) {
				regions.add(lead.source);
			}
		}
		return regions.size;
	}, [leads]);

	const renewalCandidates = useMemo(() => deals.filter((deal) => deal.status === "OPEN" || deal.status === "WON").slice(0, 8), [deals]);

	const selectedPipelineStages = useMemo(
		() => setupOptions.pipelines.find((pipeline) => pipeline.id === dealForm.pipelineId)?.stages ?? [],
		[setupOptions.pipelines, dealForm.pipelineId],
	);

	const getStagesForPipeline = (pipelineId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.stages ?? [];
	};

	const getPipelineName = (pipelineId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.name || pipelineId;
	};

	const getStageName = (pipelineId: string, stageId: string) => {
		return setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.stages.find((stage) => stage.id === stageId)?.name || stageId;
	};

	const handleUseLeadInDeal = (lead: Lead) => {
		if (!lead.contactId) {
			setNotice("This lead has no linked contact yet. Create/select contact first.");
			return;
		}
		setActiveTab("sales");
		setDealForm((prev) => ({ ...prev, contactId: lead.contactId ?? prev.contactId }));
		setNotice("Lead contact selected in Create Deal form.");
	};

	const automationItems = [
		"Lead auto-scoring and assignment rules",
		"Deal stage SLA alerts and reminders",
		"Service escalation workflows",
		"Renewal reminder workflows",
	];

	const governanceItems = [
		{
			title: "Role-based access controls",
			description: "Only authorized roles can view or update sensitive customer and deal information.",
		},
		{
			title: "Audit trail for stage transitions",
			description: "Every deal stage change is recorded with who changed it and when.",
		},
		{
			title: "Data retention policy checks",
			description: "Data is reviewed against retention rules so old records are handled safely.",
		},
		{
			title: "Consent and privacy compliance controls",
			description: "Customer communication and data usage follow consent and privacy requirements.",
		},
	];

	const tabButtonClass = (tab: SuiteTab) =>
		`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`;

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImportFile(file);

		const processParsedData = (headers: string[], rows: Record<string, string>[]) => {
			setImportHeaders(headers);
			setImportData(rows);
			
			// Normalize a header string to bare lowercase alphanumeric for fuzzy matching
			const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
			const normalizedHeaders = headers.map(h => ({ original: h, normalized: normalize(h) }));

			const newMapping: Record<string, { csvColumn: string, defaultValue: string }> = {};
			IMPORT_MODULE_FIELDS[importModule].forEach(field => {
				const fieldKeyNorm = normalize(field.key);
				const fieldLabelNorm = normalize(field.label);
				const aliasNorms = (field.aliases || []).map(normalize);

				const allCandidates = [fieldKeyNorm, fieldLabelNorm, ...aliasNorms];

				// 1. Exact candidate match
				let matched = normalizedHeaders.find(h => allCandidates.includes(h.normalized));

				// 2. Contains candidate match
				if (!matched) {
					matched = normalizedHeaders.find(h =>
						allCandidates.some(c => c && (h.normalized.includes(c) || c.includes(h.normalized)))
					);
				}

				newMapping[field.key] = {
					csvColumn: matched?.original || "",
					defaultValue: field.key === "status" ? "OPEN" : (field.key === "probability" ? "50" : "")
				};
			});
			setColumnMapping(newMapping);
			setImportStep(3);
		};

		if (file.name.toLowerCase().endsWith('.csv')) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const text = event.target?.result as string;
				const { headers, rows } = parseCSV(text);
				processParsedData(headers, rows);
			};
			reader.readAsText(file);
		} else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const data = new Uint8Array(event.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];
				
				if (jsonRows.length === 0) {
					processParsedData([], []);
					return;
				}
				
				const headers = Object.keys(jsonRows[0]);
				const rows = jsonRows.map(row => {
					const newRow: Record<string, string> = {};
					headers.forEach(h => {
						newRow[h] = String(row[h] || "");
					});
					return newRow;
				});
				
				processParsedData(headers, rows);
			};
			reader.readAsArrayBuffer(file);
		}
	};



	const downloadSample = () => {
		const fields = IMPORT_MODULE_FIELDS[importModule];
		const headerRow = fields.map(f => `"${f.label}"`).join(",");
		const blob = new Blob([headerRow + "\n"], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `cambliss_${importModule}_sample.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const executeImport = async () => {
		setIsImporting(true);
		
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");

			const getValue = (key: string, row: Record<string, string>) => {
				const mapping = columnMapping[key];
				if (!mapping) return "";
				const val = mapping.csvColumn ? row[mapping.csvColumn] : mapping.defaultValue;
				return (val || "").trim();
			};

			if (importModule === "leads") {
				const promises = importData.map(async (row) => {
					const fName = getValue("firstName", row);
					const lName = getValue("lastName", row);
					const emailVal = getValue("email", row);
					const phoneVal = getValue("phone", row);
					const compVal = getValue("companyName", row);
					const sourceVal = getValue("source", row) || "Imported CSV/XLSX";
					const statusVal = getValue("status", row) || "NEW";

					if (!fName && !lName && !emailVal && !phoneVal && !compVal) {
						return null;
					}

					const payload = {
						firstName: fName,
						lastName: lName,
						email: emailVal,
						phone: phoneVal,
						companyName: compVal,
						source: sourceVal,
						status: statusVal,
					};
					const response = await fetch("/api/crm/leads", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload)
					});
					if (!response.ok) {
						const err = await response.json().catch(() => ({}));
						throw new Error(`Failed to import lead: ${err.message || response.statusText}`);
					}
					return response;
				});
				await Promise.all(promises);
			} else if (importModule === "serviceCases") {
				const promises = importData.map(async (row) => {
					const payload = {
						subject: columnMapping.subject.csvColumn ? row[columnMapping.subject.csvColumn] : columnMapping.subject.defaultValue || "Imported Case",
						priority: (columnMapping.priority?.csvColumn ? row[columnMapping.priority.csvColumn] : columnMapping.priority?.defaultValue) || "MEDIUM",
					};
					const response = await fetch("/api/crm/service/cases", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload)
					});
					if (!response.ok) {
						const err = await response.json().catch(() => ({}));
						throw new Error(`Failed to import case: ${err.message || response.statusText}`);
					}
					return response;
				});
				await Promise.all(promises);
			} else if (importModule === "campaigns") {
				const promises = importData.map(async (row) => {
					const payload = {
						name: columnMapping.name.csvColumn ? row[columnMapping.name.csvColumn] : columnMapping.name.defaultValue || "Imported Campaign",
						segment: columnMapping.segment?.csvColumn ? row[columnMapping.segment.csvColumn] : columnMapping.segment?.defaultValue || "All",
					};
					return fetch("/api/crm/marketing/campaigns", {
						method: "POST",
						headers: authHeaders,
						body: JSON.stringify(payload)
					});
				});
				await Promise.all(promises);
			}
			
			await loadAll();
			setImportStep(4);
		} catch (error) {
			console.error("Failed to import data:", error);
			setNotice("An error occurred during import.");
		} finally {
			setIsImporting(false);
		}
	};

	const closeImportModal = () => {
		setIsImportModalOpen(false);
		setTimeout(() => {
			setImportStep(1);
			setImportFile(null);
			setImportData([]);
			setImportHeaders([]);
			setColumnMapping({});
		}, 300);
	};

	const handleConnectExternalCrm = (e: React.FormEvent) => {
		e.preventDefault();
		setIsConnectingCrm(true);
		setTimeout(() => {
			if (selectedCrmToConnect && !connectedCrms.includes(selectedCrmToConnect)) {
				setConnectedCrms(prev => [...prev, selectedCrmToConnect]);
			}
			setIsConnectingCrm(false);
			setSelectedCrmToConnect(null);
		}, 1500);
	};

	return (
		<WorkspaceShell>
			{isImportModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
						<button onClick={closeImportModal} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600">
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
						</button>
						<h2 className="text-2xl font-bold text-zinc-900 mb-6">Data Import Wizard</h2>
						
						{importStep === 1 && (
							<div className="space-y-4">
								<p className="text-zinc-600">Select the module you want to import data into:</p>
								<div className="grid grid-cols-2 gap-4">
									{(["leads", "serviceCases", "campaigns"] as const).map(mod => (
										<button 
											key={mod} 
											type="button"
											onClick={() => setImportModule(mod)}
											className={`p-4 rounded-xl border-2 text-left ${importModule === mod ? "border-[#404d85] bg-[#404d85]/5" : "border-zinc-200 hover:border-[#404d85]/50"}`}
										>
											<h3 className="font-semibold text-zinc-900 capitalize">{mod.replace(/([A-Z])/g, ' $1').trim()}</h3>
										</button>
									))}
								</div>
								<div className="flex justify-end pt-4">
									<button onClick={() => setImportStep(2)} className="bg-[#404d85] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#323d6a]">Next Step</button>
								</div>
							</div>
						)}
						
						{importStep === 2 && (
							<div className="space-y-6">
								<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
									<div>
										<h4 className="font-semibold text-blue-900">Need the correct format?</h4>
										<p className="text-sm text-blue-700">Download our sample CSV file for {importModule}.</p>
									</div>
									<button onClick={downloadSample} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm">Download Sample</button>
								</div>
								
								<div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:bg-zinc-50 transition relative">
									<input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
									<svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<p className="mt-4 text-sm text-zinc-600 font-medium">Click or drag CSV or Excel file to this area to upload</p>
								</div>
								<div className="flex justify-between pt-4">
									<button onClick={() => setImportStep(1)} className="text-zinc-600 font-semibold px-4 py-2 hover:bg-zinc-100 rounded-lg">Back</button>
								</div>
							</div>
						)}
						
						{importStep === 3 && (
							<div className="space-y-6">
								<p className="text-zinc-600">Map your CSV columns to the CRM fields. If a column is missing, you can provide a default fallback value.</p>
								<div className="border border-zinc-200 rounded-xl overflow-hidden">
									<table className="w-full text-left text-sm">
										<thead className="bg-zinc-50">
											<tr>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">CRM Field</th>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">Your CSV Column</th>
												<th className="px-4 py-3 font-semibold text-zinc-900 border-b border-zinc-200">Fallback Default Value</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-zinc-200">
											{IMPORT_MODULE_FIELDS[importModule].map(field => (
												<tr key={field.key}>
													<td className="px-4 py-3">
														<span className="font-medium text-zinc-900">{field.label}</span>
														{field.required && <span className="text-rose-500 ml-1">*</span>}
													</td>
													<td className="px-4 py-3">
														<select 
															value={columnMapping[field.key]?.csvColumn || ""} 
															onChange={(e) => setColumnMapping(prev => ({...prev, [field.key]: { ...prev[field.key], csvColumn: e.target.value }}))}
															className="w-full rounded-md border-zinc-300 shadow-sm text-sm focus:border-[#404d85] focus:ring-[#404d85]"
														>
															<option value="">-- Ignore / Missing --</option>
															{importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
														</select>
													</td>
													<td className="px-4 py-3">
														<input 
															type="text" 
															placeholder={field.required ? "Required fallback" : "e.g. Unknown"} 
															value={columnMapping[field.key]?.defaultValue || ""}
															onChange={(e) => setColumnMapping(prev => ({...prev, [field.key]: { ...prev[field.key], defaultValue: e.target.value }}))}
															disabled={!!columnMapping[field.key]?.csvColumn}
															className="w-full rounded-md border-zinc-300 shadow-sm text-sm focus:border-[#404d85] focus:ring-[#404d85] disabled:bg-zinc-100 disabled:text-zinc-400"
														/>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="flex justify-between pt-4">
									<button onClick={() => setImportStep(2)} className="text-zinc-600 font-semibold px-4 py-2 hover:bg-zinc-100 rounded-lg">Back</button>
									<button onClick={executeImport} disabled={isImporting} className="bg-[#404d85] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#323d6a] shadow-lg disabled:opacity-50">
										{isImporting ? "Importing..." : `Import ${importData.length} Records`}
									</button>
								</div>
							</div>
						)}
						
						{importStep === 4 && (
							<div className="py-8 text-center space-y-4">
								<div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
									<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
								</div>
								<h3 className="text-2xl font-bold text-zinc-900">Import Successful!</h3>
								<p className="text-zinc-600">Successfully imported {importData.length} records into {importModule}.</p>
								<div className="pt-6">
									<button onClick={closeImportModal} className="bg-zinc-900 text-white px-8 py-2 rounded-lg font-semibold hover:bg-zinc-800 shadow-lg">Done</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
			<div className="mt-5 mb-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#404d85] to-[#252f5a] shadow-lg">
				<div className="px-8 py-8 md:px-10 text-center flex flex-col items-center justify-center">
					<h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
						Your Data, Exactly Where You Need It.
					</h2>
					<p className="mt-3 max-w-2xl text-sm md:text-base text-[#c9d4ea] font-medium leading-relaxed">
						Sync leads, track deals, and align your entire team by connecting your existing tools to Cambliss in seconds.
					</p>
					<div className="mt-4 bg-white/10 rounded-full px-5 py-2 border border-white/20 shadow-sm backdrop-blur-sm">
						<span className="text-sm font-bold text-white">
							Don't see your tool below? <a href="#" className="underline decoration-2 underline-offset-2 hover:text-blue-200 transition-colors">Let us know</a> and we'll build a custom connection immediately.
						</span>
					</div>
					
					{/* Top 10 CRM Grid */}
					<div className="mt-10 w-full max-w-5xl">
						<p className="text-sm font-semibold uppercase tracking-widest text-[#8f9ecf] mb-6">Supported Enterprise Integrations</p>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
							{TOP_CRMS.map(crm => {
								const isConnected = connectedCrms.includes(crm.id);
								return (
									<button
										key={crm.id}
										onClick={() => setSelectedCrmToConnect(crm.id)}
										className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${isConnected ? "bg-white/20 border-white/40 ring-2 ring-white/50" : "bg-white/5 border-white/10 hover:bg-white/10 hover:-translate-y-1 hover:shadow-lg"}`}
									>
										{isConnected && (
											<div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-[#252f5a]">
												<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
											</div>
										)}
										<div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl border text-2xl shadow-sm ${crm.color} bg-white`}>
											{crm.logo}
										</div>
										<span className="text-sm font-semibold text-white group-hover:text-white">{crm.name}</span>
										<span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isConnected ? "text-emerald-300" : "text-[#8f9ecf]"}`}>
											{isConnected ? "Connected" : "Connect"}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* CRM Connection Modal */}
			{selectedCrmToConnect && (() => {
				const crm = TOP_CRMS.find(c => c.id === selectedCrmToConnect);
				if (!crm) return null;
				const isConnected = connectedCrms.includes(crm.id);
				
				return (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
						<div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
							<button onClick={() => setSelectedCrmToConnect(null)} className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition-colors">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
							</button>
							
							<div className="flex flex-col items-center text-center">
								<div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl shadow-md ${crm.color} bg-white`}>
									{crm.logo}
								</div>
								<h2 className="text-2xl font-bold text-zinc-900">{isConnected ? `Manage ${crm.name}` : `Connect ${crm.name}`}</h2>
								<p className="mt-2 text-sm text-zinc-600">
									{isConnected 
										? `Your ${crm.name} account is currently syncing with Cambliss.` 
										: `Authorize Cambliss to access your ${crm.name} data via API.`}
								</p>
							</div>

							{!isConnected ? (
								<form onSubmit={handleConnectExternalCrm} className="mt-8 space-y-4">
									<div>
										<label className="block text-xs font-semibold text-zinc-700 mb-1">API Key or Access Token</label>
										<input 
											type="password" 
											required
											placeholder={`Enter your ${crm.name} API key`} 
											className="w-full rounded-xl border-zinc-300 px-4 py-3 text-sm shadow-sm focus:border-[#404d85] focus:ring-[#404d85]"
										/>
									</div>
									<div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex gap-3">
										<svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										<p className="text-xs text-blue-800 leading-relaxed">
											In a production environment, this would redirect you to a secure OAuth 2.0 authorization screen provided by {crm.name}.
										</p>
									</div>
									<button 
										type="submit" 
										disabled={isConnectingCrm}
										className="w-full mt-4 rounded-xl bg-[#404d85] px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 hover:bg-[#323d6a] transition-all disabled:opacity-70 disabled:hover:translate-y-0"
									>
										{isConnectingCrm ? "Authenticating..." : `Connect ${crm.name}`}
									</button>
								</form>
							) : (
								<div className="mt-8 space-y-4">
									<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-center gap-2 text-emerald-800 font-semibold">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										Connection Active & Syncing
									</div>
									<button 
										onClick={() => {
											setConnectedCrms(prev => prev.filter(id => id !== crm.id));
											setSelectedCrmToConnect(null);
										}}
										className="w-full rounded-xl border-2 border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
									>
										Disconnect Integration
									</button>
								</div>
							)}
						</div>
					</div>
				);
			})()}

			<div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Enterprise CRM Suite</h1>
				<div className="mt-3 flex gap-3">
					<button
						type="button"
						onClick={() => setIsImportModalOpen(true)}
						className="flex items-center gap-1.5 rounded-lg border border-[#404d85] bg-[#404d85] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#323d6a]"
					>
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
						Import Data (CSV)
					</button>
					<button
						type="button"
						onClick={() => void handleResetCrmData()}
						disabled={isResettingCrm || isLoading}
						className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
					>
						{isResettingCrm ? "Deleting..." : "Delete All CRM Data"}
					</button>
				</div>
				{notice && <p className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{notice}</p>}

				<div className="mt-4 flex flex-wrap gap-2">
					{(Object.keys(tabTitle) as SuiteTab[]).map((tab) => (
						<button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabButtonClass(tab)}>
							{tabTitle[tab]}
						</button>
					))}
				</div>

				{isLoading ? (
					<p className="mt-4 text-sm text-zinc-500">Loading CRM...</p>
				) : activeTab === "overview" ? (
					<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
						{[
							["Total Leads", dashboard?.totalLeads ?? 0],
							["Active Deals", dashboard?.totalActiveDeals ?? 0],
							["Expected Revenue", dashboard?.expectedRevenue ?? 0],
							["Win Rate", `${dashboard?.winRate ?? 0}%`],
							["Conversion Rate", `${dashboard?.conversionRate ?? 0}%`],
							["Regions/Segments", regionCount],
							["Open Deals Value", dashboard?.openDealsValue ?? 0],
							["Won Deals Value", dashboard?.wonDealsValue ?? 0],
						].map(([label, value]) => (
							<div key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
								<p className="text-xs text-zinc-500">{label}</p>
								<p className="mt-1 text-lg font-semibold text-zinc-900">{String(value)}</p>
							</div>
						))}
					</div>
				) : activeTab === "customer360" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Account Summary</p>
							<p className="mt-2 text-xs text-zinc-600">Unified customer profile with lead + deal intelligence.</p>
							<ul className="mt-3 space-y-1 text-xs text-zinc-600">
								<li>Leads in system: {leads.length}</li>
								<li>Deals in system: {deals.length}</li>
								<li>Avg lead score: {leads.length ? Math.round(leads.reduce((sum, lead) => sum + (lead.score ?? 0), 0) / leads.length) : 0}</li>
								<li>Open opportunities: {deals.filter((deal) => deal.status === "OPEN").length}</li>
							</ul>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Top Contacts Snapshot</p>
							<div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
								{leads.slice(0, 8).map((lead) => {
									const leadFullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
									const leadDisplayName = leadFullName || lead.companyName || lead.email || `Lead ${lead.id.slice(0, 8)}`;
									return (
										<div key={lead.id} className="rounded-lg border border-zinc-200 p-2">
											<p className="text-xs font-semibold text-zinc-800">{leadDisplayName}</p>
											<p className="text-[11px] text-zinc-500">{lead.email || "No email"} · {lead.phone || "No phone"}{lead.companyName ? ` · ${lead.companyName}` : ""}</p>
										</div>
									);
								})}
								{leads.length === 0 && <p className="text-xs text-zinc-500">No contacts yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "sales" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
						<form onSubmit={(event) => void handleCreateLead(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Lead</p>
							<input value={leadForm.firstName} onChange={(event) => setLeadForm((prev) => ({ ...prev, firstName: event.target.value }))} placeholder="First name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={leadForm.lastName} onChange={(event) => setLeadForm((prev) => ({ ...prev, lastName: event.target.value }))} placeholder="Last name" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={leadForm.email} onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={leadForm.phone} onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={leadForm.companyName} onChange={(event) => setLeadForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="Company" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={leadForm.source} onChange={(event) => setLeadForm((prev) => ({ ...prev, source: event.target.value }))} placeholder="Source" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<button type="submit" disabled={isSavingLead} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingLead ? "Saving..." : "Create Lead"}</button>
						</form>

						<form onSubmit={(event) => void handleCreateDeal(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2">
							<p className="text-sm font-semibold text-zinc-900">Create Deal</p>
							<p className="text-[11px] text-zinc-500">Create deals for existing leads/contacts saved in your CRM.</p>
							<select
								value={dealForm.contactId}
								onChange={(event) => setDealForm((prev) => ({ ...prev, contactId: event.target.value }))}
								className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
								required
							>
								<option value="">Select Contact (Required)</option>
								{setupOptions.contacts.map((contact) => (
									<option key={contact.id} value={contact.id}>{contact.label}</option>
								))}
							</select>
							<select
								value={dealForm.pipelineId}
								onChange={(event) => {
									const pipelineId = event.target.value;
									const firstStageId = setupOptions.pipelines.find((pipeline) => pipeline.id === pipelineId)?.stages[0]?.id ?? "";
									setDealForm((prev) => ({ ...prev, pipelineId, stageId: firstStageId }));
								}}
								className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
							>
								<option value="">Select Pipeline (Optional)</option>
								{setupOptions.pipelines.map((pipeline) => (
									<option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
								))}
							</select>
							<select
								value={dealForm.stageId}
								onChange={(event) => setDealForm((prev) => ({ ...prev, stageId: event.target.value }))}
								className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
								disabled={!dealForm.pipelineId}
							>
								<option value="">Select Stage (Optional)</option>
								{selectedPipelineStages.map((stage) => (
									<option key={stage.id} value={stage.id}>{stage.name}</option>
								))}
							</select>
							<input value={dealForm.value} onChange={(event) => setDealForm((prev) => ({ ...prev, value: event.target.value }))} placeholder="Deal value" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={dealForm.probability} onChange={(event) => setDealForm((prev) => ({ ...prev, probability: event.target.value }))} placeholder="Probability" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<select
								value={dealForm.status}
								onChange={(event) => setDealForm((prev) => ({ ...prev, status: event.target.value }))}
								className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
							>
								<option value="OPEN">Status: OPEN</option>
								<option value="WON">Status: WON</option>
								<option value="LOST">Status: LOST</option>
							</select>
							<button type="submit" disabled={isSavingDeal} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingDeal ? "Saving..." : "Create Deal"}</button>
						</form>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:col-span-2">
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold text-zinc-900">Pipeline & Stage Management</p>
								<button type="button" onClick={() => void handleCreatePipeline()} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Add Pipeline</button>
							</div>
							<div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto">
								{setupOptions.pipelines.map((pipeline) => (
									<div key={pipeline.id} className="rounded-lg border border-zinc-200 p-2">
										<div className="flex flex-wrap items-center gap-1">
											<p className="text-xs font-semibold text-zinc-800">{pipeline.name}</p>
											<button type="button" onClick={() => void handleRenamePipeline(pipeline)} className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">Edit</button>
											<button type="button" onClick={() => void handleDeletePipeline(pipeline.id)} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Delete</button>
											<button type="button" onClick={() => void handleAddStage(pipeline.id)} className="rounded-md border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">Add Stage</button>
										</div>
										<div className="mt-1 flex flex-wrap gap-1">
											{pipeline.stages.map((stage) => (
												<div key={stage.id} className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1">
													<span className="text-[10px] text-zinc-700">{stage.name} ({stage.order})</span>
													<button type="button" onClick={() => void handleEditStage(stage)} className="rounded border border-zinc-300 px-1 text-[9px] font-semibold text-zinc-700">Edit</button>
													<button type="button" onClick={() => void handleDeleteStage(stage.id)} className="rounded border border-rose-300 bg-rose-50 px-1 text-[9px] font-semibold text-rose-700">Delete</button>
												</div>
											))}
										</div>
									</div>
								))}
								{setupOptions.pipelines.length === 0 && <p className="text-xs text-zinc-500">No pipelines yet.</p>}
							</div>
						</div>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">Deals & Pipeline Control</p>
							<div className="mt-2 max-h-[380px] space-y-2 overflow-y-auto">
								{deals.map((deal) => (
									(() => {
										const dealStages = getStagesForPipeline(deal.pipelineId);
										const nextStageValue = stageUpdate[deal.id] || "";
										const contactObj = deal.contact;
										const contactFullName = [contactObj?.firstName, contactObj?.lastName].filter(Boolean).join(" ").trim();
										const dealContactDisplay = contactFullName
											? `${contactFullName}${contactObj?.email ? ` (${contactObj.email})` : ""}`
											: (contactObj?.companyName || contactObj?.email || setupOptions.contacts.find((c) => c.id === deal.contactId)?.label || `Deal ${deal.id.slice(0, 8)}`);
										return (
									<div key={deal.id} className="rounded-lg border border-zinc-200 p-3">
										<p className="text-xs font-semibold text-zinc-800">{dealContactDisplay}</p>
										<p className="text-[11px] text-zinc-500">Value: {deal.value} · Probability: {deal.probability}% · Status: {deal.status}</p>
										<p className="text-[11px] text-zinc-500">Pipeline: {getPipelineName(deal.pipelineId)} · Stage: {getStageName(deal.pipelineId, deal.stageId)}</p>
										<div className="mt-2 flex flex-wrap items-center gap-1">
											<select
												value={nextStageValue}
												onChange={(event) => setStageUpdate((prev) => ({ ...prev, [deal.id]: event.target.value }))}
												className="rounded-md border border-zinc-300 px-2 py-1 text-[11px]"
											>
												<option value="">Select Stage</option>
												{dealStages.map((stage) => (
													<option key={stage.id} value={stage.id}>{stage.name}</option>
												))}
											</select>
											<button type="button" onClick={() => void handleUpdateDealStage(deal.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Update Stage</button>
											<button type="button" onClick={() => void handleArchiveDeal(deal.id, deal.isArchived)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">{deal.isArchived ? "Restore" : "Archive"}</button>
											<button type="button" onClick={() => void handleDeleteDeal(deal.id)} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
											<button type="button" onClick={() => void handleLoadHistory(deal.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">History</button>
										</div>
										{dealStages.length === 0 && <p className="mt-1 text-[11px] text-amber-700">No stages found for this pipeline.</p>}
										{historyDealId === deal.id && selectedDealHistory.length > 0 && (
											<div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
												{selectedDealHistory.slice(0, 5).map((item, index) => (
													<p key={`${deal.id}-h-${index}`} className="text-[11px] text-zinc-600">
														{item.fromStage?.name || "Start"} → {item.toStage?.name || "Unknown"} · {item.changedAt ? new Date(item.changedAt).toLocaleString() : ""}
													</p>
												))}
											</div>
										)}
									</div>
										);
									})()
								))}
								{deals.length === 0 && <p className="text-xs text-zinc-500">No deals yet.</p>}
							</div>
						</div>

						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">Lead List</p>
							<div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto">
								{leads.map((lead) => (
									<div key={lead.id} className="rounded-lg border border-zinc-200 p-3">
										<p className="text-xs font-semibold text-zinc-800">{lead.firstName || lead.email || lead.id}</p>
										<p className="text-[11px] text-zinc-500">{lead.email || "No email"} · {lead.phone || "No phone"}</p>
										<p className="text-[11px] text-zinc-500">Status: {lead.status || "NEW"} · Score: {lead.score ?? 0}</p>
										<div className="mt-2 flex flex-wrap gap-1">
											<button type="button" onClick={() => handleUseLeadInDeal(lead)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Use in Deal</button>
											<button type="button" onClick={() => void handleEditLead(lead)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">Edit</button>
											<button type="button" onClick={() => void handleArchiveLead(lead.id, lead.isArchived)} className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">{lead.isArchived ? "Restore" : "Archive"}</button>
											<button type="button" onClick={() => void handleDeleteLead(lead.id)} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
										</div>
									</div>
								))}
								{leads.length === 0 && <p className="text-xs text-zinc-500">No leads yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "service" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<form onSubmit={(event) => void handleAddServiceCase(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Create Service Case</p>
							<input value={caseSubject} onChange={(event) => setCaseSubject(event.target.value)} placeholder="Case subject" className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<button type="submit" disabled={isSavingServiceCase} className="mt-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingServiceCase ? "Saving..." : "Add Case"}</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Case Queue</p>
							<div className="mt-2 space-y-2">
								{serviceCases.map((serviceCase) => (
									<div key={serviceCase.id} className="rounded-lg border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">{serviceCase.subject}</p>
										<p className="text-[11px] text-zinc-500">{serviceCase.id} · {serviceCase.priority} · {serviceCase.status}</p>
										<div className="mt-1 flex gap-1">
											<button
												type="button"
												onClick={() => void handleEditServiceCase(serviceCase)}
												className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-zinc-700"
											>
												Edit
											</button>
											{(["OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
												<button
													key={status}
													type="button"
													onClick={() => void handleUpdateServiceCaseStatus(serviceCase.id, status)}
													disabled={pendingServiceStatus[serviceCase.id] || serviceCase.status === status}
													className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-zinc-700 disabled:opacity-50"
												>
													{status}
												</button>
											))}
											<button
												type="button"
												onClick={() => void handleDeleteServiceCase(serviceCase.id)}
												className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700"
											>
												Delete
											</button>
										</div>
									</div>
								))}
								{serviceCases.length === 0 && <p className="text-xs text-zinc-500">No service cases yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "marketing" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<form onSubmit={(event) => void handleAddCampaign(event)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Create Campaign</p>
							<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} placeholder="Campaign name" className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={campaignSegment} onChange={(event) => setCampaignSegment(event.target.value)} placeholder="Segment" className="mt-2 w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<button type="submit" disabled={isSavingCampaign} className="mt-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingCampaign ? "Saving..." : "Add Campaign"}</button>
						</form>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Campaigns</p>
							<div className="mt-2 space-y-2">
								{campaigns.map((campaign) => (
									<div key={campaign.id} className="rounded-lg border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">{campaign.name}</p>
										<p className="text-[11px] text-zinc-500">{campaign.segment} · {campaign.status}</p>
										<div className="mt-1 flex gap-1">
											<button
												type="button"
												onClick={() => void handleEditCampaign(campaign)}
												className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-zinc-700"
											>
												Edit
											</button>
											{(["DRAFT", "RUNNING", "PAUSED"] as const).map((status) => (
												<button
													key={status}
													type="button"
													onClick={() => void handleUpdateCampaignStatus(campaign.id, status)}
													disabled={pendingCampaignStatus[campaign.id] || campaign.status === status}
													className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-zinc-700 disabled:opacity-50"
												>
													{status}
												</button>
											))}
											<button
												type="button"
												onClick={() => void handleDeleteCampaign(campaign.id)}
												className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700"
											>
												Delete
											</button>
										</div>
									</div>
								))}
								{campaigns.length === 0 && <p className="text-xs text-zinc-500">No campaigns yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "revenue" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Renewal / Expansion Candidates</p>
							<div className="mt-2 space-y-2">
								{renewalCandidates.map((deal) => (
									<div key={deal.id} className="rounded-lg border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">Deal {deal.id.slice(0, 8)}...</p>
										<p className="text-[11px] text-zinc-500">Status: {deal.status} · Value: {deal.value}</p>
									</div>
								))}
								{renewalCandidates.length === 0 && <p className="text-xs text-zinc-500">No candidates yet.</p>}
							</div>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">Revenue Ops Snapshot</p>
							<ul className="mt-2 space-y-1 text-xs text-zinc-600">
								<li>Open revenue value: {dashboard?.openDealsValue ?? 0}</li>
								<li>Closed won value: {dashboard?.wonDealsValue ?? 0}</li>
								<li>Expected revenue: {dashboard?.expectedRevenue ?? 0}</li>
								<li>Win rate: {dashboard?.winRate ?? 0}%</li>
							</ul>
						</div>
					</div>
				) : activeTab === "analytics" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">KPI Radar</p>
							<p className="mt-2 text-xs text-zinc-600">Conversion and win-rate signals for leadership reviews.</p>
							<div className="mt-3 grid grid-cols-2 gap-2 text-xs">
								<div className="rounded-lg border border-zinc-200 p-2">Conversion: {dashboard?.conversionRate ?? 0}%</div>
								<div className="rounded-lg border border-zinc-200 p-2">Win Rate: {dashboard?.winRate ?? 0}%</div>
								<div className="rounded-lg border border-zinc-200 p-2">Lead Volume: {dashboard?.totalLeads ?? 0}</div>
								<div className="rounded-lg border border-zinc-200 p-2">Expected: {dashboard?.expectedRevenue ?? 0}</div>
							</div>
						</div>
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
							<p className="text-sm font-semibold text-zinc-900">AI Suggestions</p>
							<ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600">
								<li>Prioritize high-score leads first for higher conversion.</li>
								<li>Monitor deals with low probability but high value.</li>
								<li>Auto-notify owner when stage stagnates &gt; 7 days.</li>
							</ul>
						</div>
					</div>
				) : activeTab === "automation" ? (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<p className="text-sm font-semibold text-zinc-900">Automation Playbooks</p>
						<div className="mt-2 space-y-2">
							{automationItems.map((item) => (
								<div key={item} className="flex items-center justify-between rounded-lg border border-zinc-200 p-2">
									<p className="text-xs text-zinc-700">{item}</p>
									<span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">Enabled</span>
								</div>
							))}
						</div>
					</div>
				) : activeTab === "governance" ? (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<p className="text-sm font-semibold text-zinc-900">Compliance & Control Checklist</p>
						<p className="mt-1 text-xs text-zinc-600">These controls protect customer data, maintain trust, and keep CRM operations compliant.</p>
						<div className="mt-2 space-y-2">
							{governanceItems.map((item) => (
								<div key={item.title} className="flex items-start justify-between rounded-lg border border-zinc-200 p-2">
									<div>
										<p className="text-xs font-semibold text-zinc-700">{item.title}</p>
										<p className="mt-0.5 text-[11px] text-zinc-500">{item.description}</p>
									</div>
									<span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">Tracked</span>
								</div>
							))}
						</div>
					</div>
				) : null}
			</div>
		</WorkspaceShell>
	);
}
