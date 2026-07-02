"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const crm_controller_1 = require("./crm.controller");
const crmRouter = (0, express_1.Router)();
// ============================================
// Protected by JWT authentication only
// ============================================
crmRouter.use(auth_middleware_1.authenticateJWT);
// ============================================
// Dashboard
// ============================================
crmRouter.get("/dashboard", crm_controller_1.getSalesDashboardController);
crmRouter.get("/setup/options", crm_controller_1.getCrmSetupOptionsController);
crmRouter.get("/no-cost-profile", crm_controller_1.getNoCostCrmProfileController);
crmRouter.post("/reset-data", crm_controller_1.resetCrmDataController);
// ============================================
// Lead Routes
// ============================================
crmRouter.post("/leads", crm_controller_1.createLeadController);
crmRouter.get("/leads", crm_controller_1.getLeadsController);
crmRouter.get("/leads/:leadId", crm_controller_1.getLeadByIdController);
crmRouter.put("/leads/:leadId", crm_controller_1.updateLeadController);
crmRouter.post("/leads/:leadId/archive", crm_controller_1.archiveLeadController);
crmRouter.post("/leads/:leadId/restore", crm_controller_1.restoreLeadController);
crmRouter.delete("/leads/:leadId", crm_controller_1.deleteLeadController);
// ============================================
// Deal Routes
// ============================================
crmRouter.post("/deals", crm_controller_1.createDealController);
crmRouter.get("/deals", crm_controller_1.getDealsController);
crmRouter.get("/deals/:dealId", crm_controller_1.getDealByIdController);
crmRouter.post("/deals/:dealId/archive", crm_controller_1.archiveDealController);
crmRouter.post("/deals/:dealId/restore", crm_controller_1.restoreDealController);
crmRouter.delete("/deals/:dealId", crm_controller_1.deleteDealController);
crmRouter.get("/deals/:dealId/timeline", crm_controller_1.getDealTimelineController);
crmRouter.put("/deals/:dealId/stage", crm_controller_1.updateDealStageController);
crmRouter.post("/deals/:dealId/won", crm_controller_1.markDealAsWonController);
crmRouter.get("/deals/:dealId/history", crm_controller_1.getStageHistoryController);
crmRouter.post("/pipelines", crm_controller_1.createPipelineController);
crmRouter.put("/pipelines/:pipelineId", crm_controller_1.updatePipelineController);
crmRouter.delete("/pipelines/:pipelineId", crm_controller_1.deletePipelineController);
crmRouter.post("/pipelines/:pipelineId/stages", crm_controller_1.createStageController);
crmRouter.put("/stages/:stageId", crm_controller_1.updateStageController);
crmRouter.delete("/stages/:stageId", crm_controller_1.deleteStageController);
// ============================================
// Service CRM
// ============================================
crmRouter.get("/service/cases", crm_controller_1.listServiceCasesController);
crmRouter.post("/service/cases", crm_controller_1.createServiceCaseController);
crmRouter.put("/service/cases/:caseId/status", crm_controller_1.updateServiceCaseStatusController);
crmRouter.put("/service/cases/:caseId", crm_controller_1.updateServiceCaseController);
crmRouter.delete("/service/cases/:caseId", crm_controller_1.deleteServiceCaseController);
// ============================================
// Marketing CRM
// ============================================
crmRouter.get("/marketing/campaigns", crm_controller_1.listCampaignsController);
crmRouter.post("/marketing/campaigns", crm_controller_1.createCampaignController);
crmRouter.put("/marketing/campaigns/:campaignId/status", crm_controller_1.updateCampaignStatusController);
crmRouter.put("/marketing/campaigns/:campaignId", crm_controller_1.updateCampaignController);
crmRouter.delete("/marketing/campaigns/:campaignId", crm_controller_1.deleteCampaignController);
// ============================================
// Integrations
// ============================================
crmRouter.get("/integrations", crm_controller_1.listIntegrationsController);
crmRouter.put("/integrations/:moduleId", crm_controller_1.setIntegrationConnectionController);
exports.default = crmRouter;
