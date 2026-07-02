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
exports.downloadOrderInvoiceController = exports.getOrderHistoryController = exports.verifyPaymentController = exports.createOrderController = exports.getTrialReminderSnapshotController = exports.getMySubscriptionController = exports.getTechStackAddonsController = exports.createSubscriptionController = void 0;
const subscription_service_1 = require("./subscription.service");
const handleControllerError = (res, error) => {
    if (error instanceof subscription_service_1.HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const createSubscriptionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const planId = (_b = req.body) === null || _b === void 0 ? void 0 : _b.planId;
        if (!planId) {
            res.status(400).json({ message: "planId is required" });
            return;
        }
        const subscription = yield (0, subscription_service_1.createSubscription)(organizationId, planId);
        res.status(201).json(subscription);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createSubscriptionController = createSubscriptionController;
const getTechStackAddonsController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ addOns: subscription_service_1.TECH_STACK_ADDONS, categories: subscription_service_1.TECH_STACK_CATEGORIES });
});
exports.getTechStackAddonsController = getTechStackAddonsController;
const getMySubscriptionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const subscription = yield (0, subscription_service_1.getOrganizationSubscription)(organizationId);
        res.status(200).json(subscription);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getMySubscriptionController = getMySubscriptionController;
const getTrialReminderSnapshotController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const snapshot = yield (0, subscription_service_1.getOrganizationTrialReminderSnapshot)(organizationId);
        res.status(200).json(snapshot);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getTrialReminderSnapshotController = getTrialReminderSnapshotController;
const createOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const subscriptionId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.subscriptionId;
        if (!subscriptionId) {
            res.status(400).json({ message: "subscriptionId is required" });
            return;
        }
        const addOns = Array.isArray((_b = req.body) === null || _b === void 0 ? void 0 : _b.addOns)
            ? req.body.addOns.filter((item) => typeof item === "string")
            : [];
        const techStack = typeof ((_c = req.body) === null || _c === void 0 ? void 0 : _c.techStack) === "string" ? req.body.techStack : undefined;
        const rawStackSelections = (_d = req.body) === null || _d === void 0 ? void 0 : _d.stackSelections;
        const stackSelections = rawStackSelections && typeof rawStackSelections === "object" && !Array.isArray(rawStackSelections)
            ? Object.fromEntries(Object.entries(rawStackSelections).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string"))
            : undefined;
        const order = yield (0, subscription_service_1.createRazorpayOrder)(subscriptionId, { addOns, techStack, stackSelections });
        res.status(201).json(order);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createOrderController = createOrderController;
const verifyPaymentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const orderId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.razorpay_order_id;
        const paymentId = (_b = req.body) === null || _b === void 0 ? void 0 : _b.razorpay_payment_id;
        const signature = (_c = req.body) === null || _c === void 0 ? void 0 : _c.razorpay_signature;
        if (!orderId || !paymentId || !signature) {
            res.status(400).json({ message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
            return;
        }
        const result = yield (0, subscription_service_1.verifyPayment)(orderId, paymentId, signature);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.verifyPaymentController = verifyPaymentController;
const getOrderHistoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const payments = yield (0, subscription_service_1.getOrganizationOrderHistory)(organizationId);
        res.status(200).json(payments);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getOrderHistoryController = getOrderHistoryController;
const downloadOrderInvoiceController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const rawPaymentId = (_b = req.params) === null || _b === void 0 ? void 0 : _b.paymentId;
        const paymentId = Array.isArray(rawPaymentId) ? rawPaymentId[0] : rawPaymentId;
        if (!paymentId) {
            res.status(400).json({ message: "paymentId is required" });
            return;
        }
        const invoice = yield (0, subscription_service_1.generateOrganizationOrderInvoice)(organizationId, paymentId);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=\"${invoice.fileName}\"`);
        res.status(200).send(invoice.buffer);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.downloadOrderInvoiceController = downloadOrderInvoiceController;
