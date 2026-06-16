import { Request, Response } from "express";
import {
	archiveDeal,
	archiveLead,
	createPipeline,
	createStage,
	createCampaign,
	createDeal,
	createLead,
	createServiceCase,
	CreateLeadInput,
	deleteCampaign,
	deleteDeal,
	deleteLead,
	deletePipeline,
	deleteServiceCase,
	deleteStage,
	getCrmSetupOptions,
	getNoCostCrmProfile,
	getDealById,
	getDealTimeline,
	getDeals,
	getLeadById,
	getLeads,
	listCampaigns,
	listIntegrationModules,
	listServiceCases,
	getSalesDashboard,
	getStageHistory,
	HttpError,
	markDealAsWon,
	resetCrmData,
	restoreDeal,
	restoreLead,
	setIntegrationConnection,
	updateCampaign,
	updateCampaignStatus,
	updateDealStage,
	updatePipeline,
	updateServiceCase,
	updateServiceCaseStatus,
	updateStage,
	updateLead,
} from "./crm.service";

const handleControllerError = (res: Response, error: unknown): void => {
	if (error instanceof HttpError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

const getRequiredParam = (value: string | string[] | undefined, label: string): string => {
	const normalized = Array.isArray(value) ? value[0] : value;

	if (!normalized || !normalized.trim()) {
		throw new HttpError(400, `${label} is required`);
	}

	return normalized;
};

// ============================================
// STEP 1: Dashboard Controller
// ============================================

export const getSalesDashboardController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dashboard = await getSalesDashboard(req.user.organizationId);
		res.status(200).json(dashboard);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getCrmSetupOptionsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const setupOptions = await getCrmSetupOptions(req.user.organizationId);
		res.status(200).json(setupOptions);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getNoCostCrmProfileController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const profile = await getNoCostCrmProfile(req.user.organizationId);
		res.status(200).json(profile);
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Lead Controllers
// ============================================

export const createLeadController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const lead = await createLead(req.user.organizationId, req.body as CreateLeadInput);
		res.status(201).json(lead);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getLeadsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leads = await getLeads(req.user.organizationId);
		res.status(200).json(leads);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getLeadByIdController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leadId = getRequiredParam(req.params.leadId, "leadId");
		const lead = await getLeadById(leadId, req.user.organizationId);
		res.status(200).json(lead);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateLeadController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leadId = getRequiredParam(req.params.leadId, "leadId");
		const lead = await updateLead(leadId, req.user.organizationId, req.body);
		res.status(200).json(lead);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const archiveLeadController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leadId = getRequiredParam(req.params.leadId, "leadId");
		const lead = await archiveLead(leadId, req.user.organizationId);
		res.status(200).json({ message: "Lead archived", lead });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const restoreLeadController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leadId = getRequiredParam(req.params.leadId, "leadId");
		const lead = await restoreLead(leadId, req.user.organizationId);
		res.status(200).json({ message: "Lead restored", lead });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteLeadController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const leadId = getRequiredParam(req.params.leadId, "leadId");
		await deleteLead(leadId, req.user.organizationId);
		res.status(200).json({ message: "Lead deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Deal Controllers
// ============================================

export const createDealController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const deal = await createDeal(req.user.organizationId, req.body);
		res.status(201).json(deal);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getDealsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const deals = await getDeals(req.user.organizationId);
		res.status(200).json(deals);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getDealByIdController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const deal = await getDealById(dealId, req.user.organizationId);
		res.status(200).json(deal);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const archiveDealController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const deal = await archiveDeal(dealId, req.user.organizationId);
		res.status(200).json({ message: "Deal archived", deal });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const restoreDealController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const deal = await restoreDeal(dealId, req.user.organizationId);
		res.status(200).json({ message: "Deal restored", deal });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteDealController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		await deleteDeal(dealId, req.user.organizationId);
		res.status(200).json({ message: "Deal deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// STEP 5: Deal Timeline Controller
// ============================================

export const getDealTimelineController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const timeline = await getDealTimeline(dealId, req.user.organizationId);
		res.status(200).json(timeline);
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// STEP 6: Deal Stage Update Controller
// ============================================

export const updateDealStageController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const { stageId } = req.body;

		if (!stageId) {
			throw new HttpError(400, "stageId is required in request body");
		}

		const deal = await updateDealStage(dealId, req.user.organizationId, stageId, req.user.id);
		res.status(200).json({ message: "Deal stage updated", deal });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const markDealAsWonController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const { items } = req.body as { items: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }> };

		const result = await markDealAsWon(dealId, req.user.organizationId, items);
		res.status(200).json({ message: "Deal marked as WON and sale processed", ...result });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// STEP 7: Deal Stage History Controller
// ============================================

export const getStageHistoryController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const dealId = getRequiredParam(req.params.dealId, "dealId");
		const history = await getStageHistory(dealId, req.user.organizationId);
		res.status(200).json(history);
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Service Cases
// ============================================

export const listServiceCasesController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const cases = await listServiceCases(req.user.organizationId);
		res.status(200).json(cases);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createServiceCaseController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const created = await createServiceCase(req.user.organizationId, req.user.id, req.body);
		res.status(201).json(created);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateServiceCaseStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const caseId = getRequiredParam(req.params.caseId, "caseId");
		const { status } = req.body as { status?: string };
		if (!status) {
			throw new HttpError(400, "status is required in request body");
		}

		const updated = await updateServiceCaseStatus(caseId, req.user.organizationId, status as "OPEN" | "IN_PROGRESS" | "RESOLVED");
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateServiceCaseController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const caseId = getRequiredParam(req.params.caseId, "caseId");
		const updated = await updateServiceCase(caseId, req.user.organizationId, req.body || {});
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteServiceCaseController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const caseId = getRequiredParam(req.params.caseId, "caseId");
		await deleteServiceCase(caseId, req.user.organizationId);
		res.status(200).json({ message: "Service case deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Marketing Campaigns
// ============================================

export const listCampaignsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const campaigns = await listCampaigns(req.user.organizationId);
		res.status(200).json(campaigns);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createCampaignController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId || !req.user?.id) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const campaign = await createCampaign(req.user.organizationId, req.user.id, req.body);
		res.status(201).json(campaign);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateCampaignStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
		const { status } = req.body as { status?: string };
		if (!status) {
			throw new HttpError(400, "status is required in request body");
		}

		const updated = await updateCampaignStatus(campaignId, req.user.organizationId, status as "DRAFT" | "RUNNING" | "PAUSED");
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateCampaignController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
		const updated = await updateCampaign(campaignId, req.user.organizationId, req.body || {});
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteCampaignController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
		await deleteCampaign(campaignId, req.user.organizationId);
		res.status(200).json({ message: "Campaign deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Pipeline & Stage Management
// ============================================

export const createPipelineController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const created = await createPipeline(req.user.organizationId, req.body || {});
		res.status(201).json(created);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updatePipelineController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
		const updated = await updatePipeline(pipelineId, req.user.organizationId, req.body || {});
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deletePipelineController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
		await deletePipeline(pipelineId, req.user.organizationId);
		res.status(200).json({ message: "Pipeline deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createStageController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
		const created = await createStage(pipelineId, req.user.organizationId, req.body || {});
		res.status(201).json(created);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateStageController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const stageId = getRequiredParam(req.params.stageId, "stageId");
		const updated = await updateStage(stageId, req.user.organizationId, req.body || {});
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteStageController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const stageId = getRequiredParam(req.params.stageId, "stageId");
		await deleteStage(stageId, req.user.organizationId);
		res.status(200).json({ message: "Stage deleted" });
	} catch (error) {
		handleControllerError(res, error);
	}
};

// ============================================
// Integrations
// ============================================

export const listIntegrationsController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const integrations = await listIntegrationModules(req.user.organizationId);
		res.status(200).json(integrations);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const setIntegrationConnectionController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const moduleId = getRequiredParam(req.params.moduleId, "moduleId");
		const { isConnected } = req.body as { isConnected?: boolean };
		if (typeof isConnected !== "boolean") {
			throw new HttpError(400, "isConnected boolean is required in request body");
		}

		const updated = await setIntegrationConnection(req.user.organizationId, moduleId, isConnected);
		res.status(200).json(updated);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const resetCrmDataController = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user?.organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const result = await resetCrmData(req.user.organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};
