"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCrmDataController = exports.setIntegrationConnectionController = exports.listIntegrationsController = exports.deleteStageController = exports.updateStageController = exports.createStageController = exports.deletePipelineController = exports.updatePipelineController = exports.createPipelineController = exports.deleteCampaignController = exports.updateCampaignController = exports.updateCampaignStatusController = exports.createCampaignController = exports.listCampaignsController = exports.deleteServiceCaseController = exports.updateServiceCaseController = exports.updateServiceCaseStatusController = exports.createServiceCaseController = exports.listServiceCasesController = exports.getStageHistoryController = exports.markDealAsWonController = exports.updateDealStageController = exports.getDealTimelineController = exports.deleteDealController = exports.restoreDealController = exports.archiveDealController = exports.getDealByIdController = exports.getDealsController = exports.createDealController = exports.deleteLeadController = exports.restoreLeadController = exports.archiveLeadController = exports.updateLeadController = exports.getLeadByIdController = exports.getLeadsController = exports.createLeadController = exports.getNoCostCrmProfileController = exports.getCrmSetupOptionsController = exports.getSalesDashboardController = void 0;
const crm_service_1 = require("./crm.service");
const handleControllerError = (res, error) => {
    if (error instanceof crm_service_1.HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getRequiredParam = (value, label) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (!normalized || !normalized.trim()) {
        throw new crm_service_1.HttpError(400, `${label} is required`);
    }
    return normalized;
};
// ============================================
// STEP 1: Dashboard Controller
// ============================================
const getSalesDashboardController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dashboard = yield (0, crm_service_1.getSalesDashboard)(req.user.organizationId);
        res.status(200).json(dashboard);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getSalesDashboardController = getSalesDashboardController;
const getCrmSetupOptionsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const setupOptions = yield (0, crm_service_1.getCrmSetupOptions)(req.user.organizationId);
        res.status(200).json(setupOptions);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getCrmSetupOptionsController = getCrmSetupOptionsController;
const getNoCostCrmProfileController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const profile = yield (0, crm_service_1.getNoCostCrmProfile)(req.user.organizationId);
        res.status(200).json(profile);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getNoCostCrmProfileController = getNoCostCrmProfileController;
// ============================================
// Lead Controllers
// ============================================
const createLeadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const lead = yield (0, crm_service_1.createLead)(req.user.organizationId, req.body);
        res.status(201).json(lead);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createLeadController = createLeadController;
const getLeadsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leads = yield (0, crm_service_1.getLeads)(req.user.organizationId);
        res.status(200).json(leads);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getLeadsController = getLeadsController;
const getLeadByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leadId = getRequiredParam(req.params.leadId, "leadId");
        const lead = yield (0, crm_service_1.getLeadById)(leadId, req.user.organizationId);
        res.status(200).json(lead);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getLeadByIdController = getLeadByIdController;
const updateLeadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leadId = getRequiredParam(req.params.leadId, "leadId");
        const lead = yield (0, crm_service_1.updateLead)(leadId, req.user.organizationId, req.body);
        res.status(200).json(lead);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateLeadController = updateLeadController;
const archiveLeadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leadId = getRequiredParam(req.params.leadId, "leadId");
        const lead = yield (0, crm_service_1.archiveLead)(leadId, req.user.organizationId);
        res.status(200).json({ message: "Lead archived", lead });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.archiveLeadController = archiveLeadController;
const restoreLeadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leadId = getRequiredParam(req.params.leadId, "leadId");
        const lead = yield (0, crm_service_1.restoreLead)(leadId, req.user.organizationId);
        res.status(200).json({ message: "Lead restored", lead });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.restoreLeadController = restoreLeadController;
const deleteLeadController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const leadId = getRequiredParam(req.params.leadId, "leadId");
        yield (0, crm_service_1.deleteLead)(leadId, req.user.organizationId);
        res.status(200).json({ message: "Lead deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteLeadController = deleteLeadController;
// ============================================
// Deal Controllers
// ============================================
const createDealController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const deal = yield (0, crm_service_1.createDeal)(req.user.organizationId, req.body);
        res.status(201).json(deal);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createDealController = createDealController;
const getDealsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const deals = yield (0, crm_service_1.getDeals)(req.user.organizationId);
        res.status(200).json(deals);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getDealsController = getDealsController;
const getDealByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const deal = yield (0, crm_service_1.getDealById)(dealId, req.user.organizationId);
        res.status(200).json(deal);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getDealByIdController = getDealByIdController;
const archiveDealController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const deal = yield (0, crm_service_1.archiveDeal)(dealId, req.user.organizationId);
        res.status(200).json({ message: "Deal archived", deal });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.archiveDealController = archiveDealController;
const restoreDealController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const deal = yield (0, crm_service_1.restoreDeal)(dealId, req.user.organizationId);
        res.status(200).json({ message: "Deal restored", deal });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.restoreDealController = restoreDealController;
const deleteDealController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        yield (0, crm_service_1.deleteDeal)(dealId, req.user.organizationId);
        res.status(200).json({ message: "Deal deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteDealController = deleteDealController;
// ============================================
// STEP 5: Deal Timeline Controller
// ============================================
const getDealTimelineController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const timeline = yield (0, crm_service_1.getDealTimeline)(dealId, req.user.organizationId);
        res.status(200).json(timeline);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getDealTimelineController = getDealTimelineController;
// ============================================
// STEP 6: Deal Stage Update Controller
// ============================================
const updateDealStageController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const { stageId } = req.body;
        if (!stageId) {
            throw new crm_service_1.HttpError(400, "stageId is required in request body");
        }
        const deal = yield (0, crm_service_1.updateDealStage)(dealId, req.user.organizationId, stageId, req.user.id);
        res.status(200).json({ message: "Deal stage updated", deal });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateDealStageController = updateDealStageController;
const markDealAsWonController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const { items } = req.body;
        const result = yield (0, crm_service_1.markDealAsWon)(dealId, req.user.organizationId, items);
        res.status(200).json(Object.assign({ message: "Deal marked as WON and sale processed" }, result));
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.markDealAsWonController = markDealAsWonController;
// ============================================
// STEP 7: Deal Stage History Controller
// ============================================
const getStageHistoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const dealId = getRequiredParam(req.params.dealId, "dealId");
        const history = yield (0, crm_service_1.getStageHistory)(dealId, req.user.organizationId);
        res.status(200).json(history);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getStageHistoryController = getStageHistoryController;
// ============================================
// Service Cases
// ============================================
const listServiceCasesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const cases = yield (0, crm_service_1.listServiceCases)(req.user.organizationId);
        res.status(200).json(cases);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.listServiceCasesController = listServiceCasesController;
const createServiceCaseController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const created = yield (0, crm_service_1.createServiceCase)(req.user.organizationId, req.user.id, req.body);
        res.status(201).json(created);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createServiceCaseController = createServiceCaseController;
const updateServiceCaseStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const caseId = getRequiredParam(req.params.caseId, "caseId");
        const { status } = req.body;
        if (!status) {
            throw new crm_service_1.HttpError(400, "status is required in request body");
        }
        const updated = yield (0, crm_service_1.updateServiceCaseStatus)(caseId, req.user.organizationId, status);
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateServiceCaseStatusController = updateServiceCaseStatusController;
const updateServiceCaseController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const caseId = getRequiredParam(req.params.caseId, "caseId");
        const updated = yield (0, crm_service_1.updateServiceCase)(caseId, req.user.organizationId, req.body || {});
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateServiceCaseController = updateServiceCaseController;
const deleteServiceCaseController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const caseId = getRequiredParam(req.params.caseId, "caseId");
        yield (0, crm_service_1.deleteServiceCase)(caseId, req.user.organizationId);
        res.status(200).json({ message: "Service case deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteServiceCaseController = deleteServiceCaseController;
// ============================================
// Marketing Campaigns
// ============================================
const listCampaignsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const campaigns = yield (0, crm_service_1.listCampaigns)(req.user.organizationId);
        res.status(200).json(campaigns);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.listCampaignsController = listCampaignsController;
const createCampaignController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const campaign = yield (0, crm_service_1.createCampaign)(req.user.organizationId, req.user.id, req.body);
        res.status(201).json(campaign);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createCampaignController = createCampaignController;
const updateCampaignStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
        const { status } = req.body;
        if (!status) {
            throw new crm_service_1.HttpError(400, "status is required in request body");
        }
        const updated = yield (0, crm_service_1.updateCampaignStatus)(campaignId, req.user.organizationId, status);
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateCampaignStatusController = updateCampaignStatusController;
const updateCampaignController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
        const updated = yield (0, crm_service_1.updateCampaign)(campaignId, req.user.organizationId, req.body || {});
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateCampaignController = updateCampaignController;
const deleteCampaignController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const campaignId = getRequiredParam(req.params.campaignId, "campaignId");
        yield (0, crm_service_1.deleteCampaign)(campaignId, req.user.organizationId);
        res.status(200).json({ message: "Campaign deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteCampaignController = deleteCampaignController;
// ============================================
// Pipeline & Stage Management
// ============================================
const createPipelineController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const created = yield (0, crm_service_1.createPipeline)(req.user.organizationId, req.body || {});
        res.status(201).json(created);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createPipelineController = createPipelineController;
const updatePipelineController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
        const updated = yield (0, crm_service_1.updatePipeline)(pipelineId, req.user.organizationId, req.body || {});
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updatePipelineController = updatePipelineController;
const deletePipelineController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
        yield (0, crm_service_1.deletePipeline)(pipelineId, req.user.organizationId);
        res.status(200).json({ message: "Pipeline deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deletePipelineController = deletePipelineController;
const createStageController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const pipelineId = getRequiredParam(req.params.pipelineId, "pipelineId");
        const created = yield (0, crm_service_1.createStage)(pipelineId, req.user.organizationId, req.body || {});
        res.status(201).json(created);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createStageController = createStageController;
const updateStageController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const stageId = getRequiredParam(req.params.stageId, "stageId");
        const updated = yield (0, crm_service_1.updateStage)(stageId, req.user.organizationId, req.body || {});
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateStageController = updateStageController;
const deleteStageController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const stageId = getRequiredParam(req.params.stageId, "stageId");
        yield (0, crm_service_1.deleteStage)(stageId, req.user.organizationId);
        res.status(200).json({ message: "Stage deleted" });
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteStageController = deleteStageController;
// ============================================
// Integrations
// ============================================
const listIntegrationsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const integrations = yield (0, crm_service_1.listIntegrationModules)(req.user.organizationId);
        res.status(200).json(integrations);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.listIntegrationsController = listIntegrationsController;
const setIntegrationConnectionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const moduleId = getRequiredParam(req.params.moduleId, "moduleId");
        const { isConnected } = req.body;
        if (typeof isConnected !== "boolean") {
            throw new crm_service_1.HttpError(400, "isConnected boolean is required in request body");
        }
        const updated = yield (0, crm_service_1.setIntegrationConnection)(req.user.organizationId, moduleId, isConnected);
        res.status(200).json(updated);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.setIntegrationConnectionController = setIntegrationConnectionController;
const resetCrmDataController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const result = yield (0, crm_service_1.resetCrmData)(req.user.organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.resetCrmDataController = resetCrmDataController;
