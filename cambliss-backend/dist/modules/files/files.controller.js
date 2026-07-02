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
exports.deleteFileController = exports.getFilesController = exports.uploadFileController = void 0;
const files_service_1 = require("./files.service");
const handleControllerError = (res, error) => {
    if (error instanceof files_service_1.HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getOrganizationId = (req) => {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        throw new files_service_1.HttpError(400, "Organization ID is required");
    }
    return organizationId;
};
const uploadFileController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const organizationId = getOrganizationId(req);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "File is required" });
            return;
        }
        const projectId = (_b = req.body) === null || _b === void 0 ? void 0 : _b.projectId;
        const result = yield (0, files_service_1.uploadFile)(organizationId, userId, req.file, projectId);
        res.status(201).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.uploadFileController = uploadFileController;
const getFilesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const files = yield (0, files_service_1.getFiles)(organizationId);
        res.status(200).json(files);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getFilesController = getFilesController;
const deleteFileController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const fileId = req.params.id;
        if (!fileId) {
            res.status(400).json({ message: "File ID is required" });
            return;
        }
        const result = yield (0, files_service_1.deleteFile)(fileId, organizationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.deleteFileController = deleteFileController;
