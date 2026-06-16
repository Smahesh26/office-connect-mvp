"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
	| "governance"
	| "integrations";

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
	integrations: "Integrations",
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
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [setupOptions, setSetupOptions] = useState<SetupOptions>({ contacts: [], pipelines: [] });
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
		setIsSavingDeal(true);
		setNotice(null);
		try {
			const authHeaders = getAuthHeaders();
			authHeaders.set("Content-Type", "application/json");
			const payload = {
				contactId: dealForm.contactId,
				pipelineId: dealForm.pipelineId,
				stageId: dealForm.stageId,
				value: Number(dealForm.value || 0),
				probability: Number(dealForm.probability || 0),
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

	return (
		<WorkspaceShell>
			<div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_24px_56px_-30px_rgba(0,0,0,0.85)]">
				<h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Enterprise CRM Suite</h1>
				<p className="mt-1 text-sm text-zinc-600">Built for customer-centric operations: customer 360, sales, service, marketing, revenue, analytics, automation, governance and integrations.</p>
				{noCostProfile && (
					<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
						<p className="text-xs font-semibold text-emerald-800">No-Cost CRM Mode Active</p>
						<p className="mt-1 text-xs text-emerald-700">Core CRM runs using your internal backend + database. No paid third-party API is required.</p>
						<div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-emerald-800 md:grid-cols-3">
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Contacts: {noCostProfile.stats.contacts}</div>
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Leads: {noCostProfile.stats.leads}</div>
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Deals: {noCostProfile.stats.deals}</div>
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Pipelines: {noCostProfile.stats.pipelines}</div>
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Stages: {noCostProfile.stats.stages}</div>
							<div className="rounded-md border border-emerald-200 bg-white px-2 py-1">Activities: {noCostProfile.stats.activities}</div>
						</div>
					</div>
				)}
				<div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
					<p className="text-xs font-semibold text-zinc-900">What this CRM does</p>
					<p className="mt-1 text-xs text-zinc-600">This CRM acts like a central brain for customer operations — store customer information, move leads to deals, track communication and service actions, and monitor business performance from one place.</p>
				</div>
				<div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
					<p className="text-xs font-semibold text-zinc-900">How to use CRM (Client)</p>
					<ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-zinc-600">
						<li>Go to Sales Execution and create a lead.</li>
						<li>In Lead List, click Use in Deal for that lead.</li>
						<li>Select contact, pipeline and stage from dropdowns, then create deal.</li>
						<li>Use Deals &amp; Pipeline Control to update stage and check history.</li>
						<li>Use Service, Marketing and Integrations tabs for post-sales operations.</li>
					</ol>
				</div>
				<div className="mt-3">
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
								{leads.slice(0, 8).map((lead) => (
									<div key={lead.id} className="rounded-lg border border-zinc-200 p-2">
										<p className="text-xs font-semibold text-zinc-800">{lead.firstName || lead.email || lead.id}</p>
										<p className="text-[11px] text-zinc-500">{lead.email || "No email"} · {lead.phone || "No phone"}</p>
									</div>
								))}
								{leads.length === 0 && <p className="text-xs text-zinc-500">No contacts yet.</p>}
							</div>
						</div>
					</div>
				) : activeTab === "sales" ? (
					<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm xl:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">Client Quick Start</p>
							<p className="mt-1 text-xs text-zinc-600">Step 1 create a lead. Step 2 select contact, pipeline, and stage from dropdowns. Step 3 create deal and track stage progress.</p>
						</div>

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
							<p className="text-[11px] text-zinc-500">No manual IDs required. Select from your CRM setup.</p>
							<select
								value={dealForm.contactId}
								onChange={(event) => setDealForm((prev) => ({ ...prev, contactId: event.target.value }))}
								className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
							>
								<option value="">Select Contact</option>
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
								<option value="">Select Pipeline</option>
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
								<option value="">Select Stage</option>
								{selectedPipelineStages.map((stage) => (
									<option key={stage.id} value={stage.id}>{stage.name}</option>
								))}
							</select>
							<input value={dealForm.value} onChange={(event) => setDealForm((prev) => ({ ...prev, value: event.target.value }))} placeholder="Deal value" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<input value={dealForm.probability} onChange={(event) => setDealForm((prev) => ({ ...prev, probability: event.target.value }))} placeholder="Probability" className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm" />
							<button type="submit" disabled={isSavingDeal} className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">{isSavingDeal ? "Saving..." : "Create Deal"}</button>
							{setupOptions.contacts.length === 0 && <p className="text-[11px] text-amber-700">No contacts found. Create lead/contact data first.</p>}
							{setupOptions.pipelines.length === 0 && <p className="text-[11px] text-amber-700">No pipelines found. Ask admin to configure CRM pipeline stages.</p>}
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
										return (
									<div key={deal.id} className="rounded-lg border border-zinc-200 p-3">
										<p className="text-xs font-semibold text-zinc-800">Deal {deal.id.slice(0, 8)}...</p>
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
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">What is Service &amp; Support?</p>
							<p className="mt-1 text-xs text-zinc-600">Use this section to track customer issues after sales (complaints, requests, delivery problems). Create a case, update its status (OPEN → IN_PROGRESS → RESOLVED), and keep your team aligned on customer support.</p>
						</div>
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
						<div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:col-span-2">
							<p className="text-sm font-semibold text-zinc-900">What is Marketing CRM?</p>
							<p className="mt-1 text-xs text-zinc-600">Marketing CRM helps you plan and track customer outreach campaigns. Create a campaign, define target segment, and update status (DRAFT, RUNNING, PAUSED) so your team knows what is active and what is pending.</p>
						</div>
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
				) : (
					<div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
						<p className="text-sm font-semibold text-zinc-900">Integration Center</p>
						<div className="mt-2 space-y-2">
							{integrations.map((item) => (
								<div key={item.moduleId} className="flex items-center justify-between rounded-lg border border-zinc-200 p-2">
									<div>
										<p className="text-xs text-zinc-700">{item.moduleName}</p>
										{item.description && <p className="text-[10px] text-zinc-500">{item.description}</p>}
									</div>
									<div className="flex items-center gap-2">
										<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.isConnected ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-zinc-300 bg-zinc-100 text-zinc-600"}`}>
											{item.isConnected ? "Connected" : "Disconnected"}
										</span>
										<button
											type="button"
											onClick={() => void handleToggleIntegration(item.moduleId, !item.isConnected)}
											disabled={pendingIntegration[item.moduleId]}
											className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-semibold text-zinc-700 disabled:opacity-50"
										>
											{item.isConnected ? "Disconnect" : "Connect"}
										</button>
									</div>
								</div>
							))}
							{integrations.length === 0 && <p className="text-xs text-zinc-500">No integrations available.</p>}
						</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
