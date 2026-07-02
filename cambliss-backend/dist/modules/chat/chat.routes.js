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
const express_1 = require("express");
const multer_1 = require("../../config/multer");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const subscription_middleware_1 = require("../../middleware/subscription.middleware");
const client_1 = require("@prisma/client");
const chat_service_1 = require("./chat.service");
const chat_files_service_1 = require("./chat-files.service");
const chatRouter = (0, express_1.Router)();
chatRouter.use(auth_middleware_1.authenticateJWT, subscription_middleware_1.requireActiveSubscription);
const toSingleString = (value) => {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }
    return undefined;
};
const handleError = (res, error) => {
    if (error instanceof chat_service_1.ChatError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof chat_files_service_1.ChatFileError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
chatRouter.get("/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user = req.user;
        const organizationId = user === null || user === void 0 ? void 0 : user.organizationId;
        if (!organizationId) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const rawLimit = (_a = req.query) === null || _a === void 0 ? void 0 : _a.limit;
        const limit = typeof rawLimit === "string" ? Number(rawLimit) : undefined;
        const rawOrganizationId = (_b = req.query) === null || _b === void 0 ? void 0 : _b.organizationId;
        const requestedOrganizationId = toSingleString(rawOrganizationId);
        const isAdmin = user.role === client_1.RoleName.ADMIN || user.role === client_1.RoleName.SUPER_ADMIN;
        const messages = isAdmin
            ? yield (0, chat_service_1.listChatMessagesForAdmin)(limit, requestedOrganizationId)
            : yield (0, chat_service_1.listChatMessages)(organizationId, limit);
        res.status(200).json(messages);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.post("/messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const message = (_a = req.body) === null || _a === void 0 ? void 0 : _a.message;
        if (!message) {
            res.status(400).json({ message: "message is required" });
            return;
        }
        const isAdmin = user.role === client_1.RoleName.ADMIN || user.role === client_1.RoleName.SUPER_ADMIN;
        const targetOrganizationId = isAdmin
            ? (((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.organizationId) === null || _c === void 0 ? void 0 : _c.trim()) || user.organizationId)
            : user.organizationId;
        const created = yield (0, chat_service_1.createChatMessage)({
            organizationId: targetOrganizationId,
            senderUserId: user.id,
            senderEmail: user.email,
            senderRole: user.role,
            senderName: null,
            message,
        });
        res.status(201).json(created);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.post("/files", multer_1.uploadChatTransfer.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "File is required" });
            return;
        }
        const requestedOrganizationId = toSingleString((_a = req.body) === null || _a === void 0 ? void 0 : _a.organizationId);
        const created = yield (0, chat_files_service_1.uploadChatTransferFile)({
            authUser: {
                id: user.id,
                organizationId: user.organizationId,
                role: user.role,
            },
            file: req.file,
            requestedOrganizationId,
        });
        res.status(201).json(created);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.get("/files", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const requestedOrganizationId = toSingleString((_a = req.query) === null || _a === void 0 ? void 0 : _a.organizationId);
        const files = yield (0, chat_files_service_1.listChatTransferFiles)({ id: user.id, organizationId: user.organizationId, role: user.role }, requestedOrganizationId);
        res.status(200).json(files);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.get("/files/policy", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json((0, chat_files_service_1.getChatFileTransferPolicy)());
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.get("/files/cleanup-stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const isAdmin = user.role === client_1.RoleName.ADMIN || user.role === client_1.RoleName.SUPER_ADMIN;
        if (!isAdmin) {
            res.status(403).json({ message: "Only admin can access cleanup stats" });
            return;
        }
        res.status(200).json((0, chat_files_service_1.getChatTransferCleanupStats)());
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.get("/files/threads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const threads = yield (0, chat_files_service_1.listChatTransferThreads)({
            id: user.id,
            organizationId: user.organizationId,
            role: user.role,
        });
        res.status(200).json(threads);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.get("/files/:id/download", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const fileId = toSingleString(req.params.id);
        if (!fileId) {
            res.status(400).json({ message: "File ID is required" });
            return;
        }
        const requestedOrganizationId = toSingleString((_a = req.query) === null || _a === void 0 ? void 0 : _a.organizationId);
        const file = yield (0, chat_files_service_1.resolveChatTransferForDownload)({ id: user.id, organizationId: user.organizationId, role: user.role }, fileId, requestedOrganizationId);
        res.download(file.absolutePath, file.fileName);
    }
    catch (error) {
        handleError(res, error);
    }
}));
chatRouter.delete("/files/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.organizationId)) {
            res.status(400).json({ message: "Organization ID is required" });
            return;
        }
        const fileId = toSingleString(req.params.id);
        if (!fileId) {
            res.status(400).json({ message: "File ID is required" });
            return;
        }
        const requestedOrganizationId = toSingleString((_a = req.query) === null || _a === void 0 ? void 0 : _a.organizationId);
        const result = yield (0, chat_files_service_1.deleteChatTransferFile)({ id: user.id, organizationId: user.organizationId, role: user.role }, fileId, requestedOrganizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
}));
exports.default = chatRouter;
