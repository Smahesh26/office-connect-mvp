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
exports.updateMyOrganizationOnboardingController = exports.getMyOrganizationOnboardingController = exports.clearMyOrganizationController = exports.updateMyOrganizationController = exports.meController = exports.loginController = exports.verifyFirebasePhoneController = exports.verifyRegisterOtpController = exports.sendRegisterOtpController = exports.registerController = void 0;
const auth_service_1 = require("./auth.service");
const mobile_otp_service_1 = require("./mobile-otp.service");
const firebase_auth_service_1 = require("./firebase-auth.service");
const handleAuthError = (res, error) => {
    if (error instanceof auth_service_1.AuthError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof mobile_otp_service_1.MobileOtpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const registerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.register)(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.registerController = registerController;
const sendRegisterOtpController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const phone = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.phone) || "";
        const result = yield (0, mobile_otp_service_1.sendRegisterOtp)(phone);
        res.status(200).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.sendRegisterOtpController = sendRegisterOtpController;
const verifyRegisterOtpController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const phone = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.phone) || "";
        const requestId = ((_b = req.body) === null || _b === void 0 ? void 0 : _b.requestId) || "";
        const otp = ((_c = req.body) === null || _c === void 0 ? void 0 : _c.otp) || "";
        const result = (0, mobile_otp_service_1.verifyRegisterOtp)({ phone, requestId, otp });
        res.status(200).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.verifyRegisterOtpController = verifyRegisterOtpController;
const verifyFirebasePhoneController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const idToken = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.idToken) || "";
        const result = yield (0, firebase_auth_service_1.verifyFirebasePhoneToken)(idToken);
        res.status(200).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.verifyFirebasePhoneController = verifyFirebasePhoneController;
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.login)(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.loginController = loginController;
const meController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const result = yield (0, auth_service_1.getMe)(userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.meController = meController;
const updateMyOrganizationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const organization = yield (0, auth_service_1.updateOrganizationProfile)(organizationId, req.body || {});
        res.status(200).json(organization);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.updateMyOrganizationController = updateMyOrganizationController;
const clearMyOrganizationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const organization = yield (0, auth_service_1.clearOrganizationProfile)(organizationId);
        res.status(200).json(organization);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.clearMyOrganizationController = clearMyOrganizationController;
const getMyOrganizationOnboardingController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const onboarding = yield (0, auth_service_1.getOrganizationOnboarding)(organizationId);
        res.status(200).json(onboarding);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.getMyOrganizationOnboardingController = getMyOrganizationOnboardingController;
const updateMyOrganizationOnboardingController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
        if (!organizationId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const onboarding = yield (0, auth_service_1.updateOrganizationOnboarding)(organizationId, req.body || {});
        res.status(200).json(onboarding);
    }
    catch (error) {
        handleAuthError(res, error);
    }
});
exports.updateMyOrganizationOnboardingController = updateMyOrganizationOnboardingController;
