import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import {
	archiveDealController,
	archiveLeadController,
	createPipelineController,
	createStageController,
	createCampaignController,
	createDealController,
	createLeadController,
	createServiceCaseController,
	deleteCampaignController,
	deleteDealController,
	deleteLeadController,
	deletePipelineController,
	deleteServiceCaseController,
	deleteStageController,
	getNoCostCrmProfileController,
	getDealByIdController,
	getDealTimelineController,
	getDealsController,
	getCrmSetupOptionsController,
	listCampaignsController,
	listIntegrationsController,
	listServiceCasesController,
	getLeadByIdController,
	getLeadsController,
	getSalesDashboardController,
	getStageHistoryController,
	markDealAsWonController,
	resetCrmDataController,
	restoreDealController,
	restoreLeadController,
	setIntegrationConnectionController,
	updateCampaignController,
	updateCampaignStatusController,
	updateDealStageController,
	updatePipelineController,
	updateServiceCaseController,
	updateServiceCaseStatusController,
	updateStageController,
	updateLeadController,
} from "./crm.controller";

const crmRouter = Router();

// ============================================
// Protected by JWT authentication only
// ============================================

crmRouter.use(authenticateJWT);

// ============================================
// Dashboard
// ============================================

crmRouter.get("/dashboard", getSalesDashboardController);
crmRouter.get("/setup/options", getCrmSetupOptionsController);
crmRouter.get("/no-cost-profile", getNoCostCrmProfileController);
crmRouter.post("/reset-data", resetCrmDataController);

// ============================================
// Lead Routes
// ============================================

crmRouter.post("/leads", createLeadController);
crmRouter.get("/leads", getLeadsController);
crmRouter.get("/leads/:leadId", getLeadByIdController);
crmRouter.put("/leads/:leadId", updateLeadController);
crmRouter.post("/leads/:leadId/archive", archiveLeadController);
crmRouter.post("/leads/:leadId/restore", restoreLeadController);
crmRouter.delete("/leads/:leadId", deleteLeadController);

// ============================================
// Deal Routes
// ============================================

crmRouter.post("/deals", createDealController);
crmRouter.get("/deals", getDealsController);
crmRouter.get("/deals/:dealId", getDealByIdController);
crmRouter.post("/deals/:dealId/archive", archiveDealController);
crmRouter.post("/deals/:dealId/restore", restoreDealController);
crmRouter.delete("/deals/:dealId", deleteDealController);
crmRouter.get("/deals/:dealId/timeline", getDealTimelineController);
crmRouter.put("/deals/:dealId/stage", updateDealStageController);
crmRouter.post("/deals/:dealId/won", markDealAsWonController);
crmRouter.get("/deals/:dealId/history", getStageHistoryController);

crmRouter.post("/pipelines", createPipelineController);
crmRouter.put("/pipelines/:pipelineId", updatePipelineController);
crmRouter.delete("/pipelines/:pipelineId", deletePipelineController);
crmRouter.post("/pipelines/:pipelineId/stages", createStageController);
crmRouter.put("/stages/:stageId", updateStageController);
crmRouter.delete("/stages/:stageId", deleteStageController);

// ============================================
// Service CRM
// ============================================

crmRouter.get("/service/cases", listServiceCasesController);
crmRouter.post("/service/cases", createServiceCaseController);
crmRouter.put("/service/cases/:caseId/status", updateServiceCaseStatusController);
crmRouter.put("/service/cases/:caseId", updateServiceCaseController);
crmRouter.delete("/service/cases/:caseId", deleteServiceCaseController);

// ============================================
// Marketing CRM
// ============================================

crmRouter.get("/marketing/campaigns", listCampaignsController);
crmRouter.post("/marketing/campaigns", createCampaignController);
crmRouter.put("/marketing/campaigns/:campaignId/status", updateCampaignStatusController);
crmRouter.put("/marketing/campaigns/:campaignId", updateCampaignController);
crmRouter.delete("/marketing/campaigns/:campaignId", deleteCampaignController);

// ============================================
// Integrations
// ============================================

crmRouter.get("/integrations", listIntegrationsController);
crmRouter.put("/integrations/:moduleId", setIntegrationConnectionController);

export default crmRouter;
