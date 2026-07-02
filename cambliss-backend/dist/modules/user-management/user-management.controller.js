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
exports.resetOrganizationUserManagementAndCrmDataController = exports.deactivateOrganizationUserController = exports.getMyAccessController = exports.updateOrganizationUserAccessController = exports.createOrganizationUserController = exports.listOrganizationUsersController = void 0;
const user_management_service_1 = require("./user-management.service");
const handleError = (res, error) => {
    if (error instanceof user_management_service_1.UserManagementError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const listOrganizationUsersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const users = yield (0, user_management_service_1.listOrganizationUsers)(req.user.organizationId, req.user.id);
        res.status(200).json(users);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.listOrganizationUsersController = listOrganizationUsersController;
const createOrganizationUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const created = yield (0, user_management_service_1.createOrganizationUser)(req.user.organizationId, req.user.id, req.body);
        res.status(201).json(created);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createOrganizationUserController = createOrganizationUserController;
const updateOrganizationUserAccessController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
        const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
        if (!organizationId || !requesterId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        if (!userId) {
            res.status(400).json({ message: "userId is required" });
            return;
        }
        const result = yield (0, user_management_service_1.updateOrganizationUserAccess)(organizationId, requesterId, userId, req.body || {});
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.updateOrganizationUserAccessController = updateOrganizationUserAccessController;
const getMyAccessController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const access = yield (0, user_management_service_1.getMyAccess)(req.user.organizationId, req.user.id);
        res.status(200).json(access);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.getMyAccessController = getMyAccessController;
const deactivateOrganizationUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
        const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
        if (!organizationId || !requesterId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        if (!userId) {
            res.status(400).json({ message: "userId is required" });
            return;
        }
        const result = yield (0, user_management_service_1.deactivateOrganizationUser)(organizationId, requesterId, userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.deactivateOrganizationUserController = deactivateOrganizationUserController;
const resetOrganizationUserManagementAndCrmDataController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId) || !((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const organizationId = Array.isArray(req.user.organizationId) ? req.user.organizationId[0] : req.user.organizationId;
        const requesterId = Array.isArray(req.user.id) ? req.user.id[0] : req.user.id;
        if (!organizationId || !requesterId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const result = yield (0, user_management_service_1.resetOrganizationUserManagementAndCrmData)(organizationId, requesterId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.resetOrganizationUserManagementAndCrmDataController = resetOrganizationUserManagementAndCrmDataController;
