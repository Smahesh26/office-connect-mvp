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
exports.downloadAdminOrderInvoiceController = exports.getAllOrderHistoryController = exports.assignModulesToPlanController = exports.getAllPlansController = exports.deletePlanController = exports.updatePlanController = exports.createPlanController = exports.getAllSubscriptionsController = exports.activateOrganizationController = exports.suspendOrganizationController = exports.getOrganizationByIdController = exports.getAllOrganizationsController = void 0;
const admin_service_1 = require("./admin.service");
const handleControllerError = (res, error) => {
    if (error instanceof admin_service_1.HttpError) {
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
        throw new admin_service_1.HttpError(400, `${label} is required`);
    }
    return normalized;
};
const getAllOrganizationsController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizations = yield (0, admin_service_1.getAllOrganizations)();
        res.status(200).json(organizations);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getAllOrganizationsController = getAllOrganizationsController;
const getOrganizationByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
        const organization = yield (0, admin_service_1.getOrganizationById)(organizationId);
        res.status(200).json(organization);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getOrganizationByIdController = getOrganizationByIdController;
const suspendOrganizationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
        const result = yield (0, admin_service_1.suspendOrganization)(organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.suspendOrganizationController = suspendOrganizationController;
const activateOrganizationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getRequiredParam(req.params.organizationId, "organizationId");
        const result = yield (0, admin_service_1.activateOrganization)(organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.activateOrganizationController = activateOrganizationController;
const getAllSubscriptionsController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptions = yield (0, admin_service_1.getAllSubscriptions)();
        res.status(200).json(subscriptions);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getAllSubscriptionsController = getAllSubscriptionsController;
const createPlanController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plan = yield (0, admin_service_1.createPlan)(req.body);
        res.status(201).json(plan);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createPlanController = createPlanController;
const updatePlanController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planId = getRequiredParam(req.params.id, "id");
        const plan = yield (0, admin_service_1.updatePlan)(planId, req.body);
        res.status(200).json(plan);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updatePlanController = updatePlanController;
const deletePlanController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planId = getRequiredParam(req.params.id, "id");
        const plan = yield (0, admin_service_1.deletePlan)(planId);
        res.status(200).json(plan);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deletePlanController = deletePlanController;
const getAllPlansController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plans = yield (0, admin_service_1.getAllPlans)();
        res.status(200).json(plans);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getAllPlansController = getAllPlansController;
const assignModulesToPlanController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planId = getRequiredParam(req.params.planId, "planId");
        const { moduleIds } = req.body;
        if (!Array.isArray(moduleIds)) {
            throw new admin_service_1.HttpError(400, "moduleIds must be an array of string IDs");
        }
        const plan = yield (0, admin_service_1.assignModulesToPlan)(planId, moduleIds);
        res.status(200).json(plan);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.assignModulesToPlanController = assignModulesToPlanController;
const getAllOrderHistoryController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield (0, admin_service_1.getAllOrderHistory)();
        res.status(200).json(payments);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getAllOrderHistoryController = getAllOrderHistoryController;
const downloadAdminOrderInvoiceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentId = getRequiredParam(req.params.paymentId, "paymentId");
        const invoice = yield (0, admin_service_1.generateAdminOrderInvoice)(paymentId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=\"${invoice.fileName}\"`);
        res.status(200).send(invoice.buffer);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.downloadAdminOrderInvoiceController = downloadAdminOrderInvoiceController;
