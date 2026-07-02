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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.getFiles = exports.uploadFile = exports.HttpError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
const getActiveSubscriptionPlan = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield prisma_1.default.subscription.findFirst({
        where: {
            organizationId,
            status: "ACTIVE",
        },
        include: {
            plan: true,
        },
    });
    if (!subscription || !subscription.plan) {
        throw new HttpError(403, "No active subscription. Please subscribe to continue.");
    }
    return subscription.plan;
});
const bytesFromGigabytes = (gb) => gb * 1024 * 1024 * 1024;
const ensureProjectInOrganization = (projectId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield prisma_1.default.project.findFirst({
        where: { id: projectId, organizationId },
        select: { id: true },
    });
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
});
const uploadFile = (organizationId, userId, file, projectId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const plan = yield getActiveSubscriptionPlan(organizationId);
    const usedStorage = yield prisma_1.default.file.aggregate({
        where: { organizationId },
        _sum: { fileSize: true },
    });
    const usedBytes = (_a = usedStorage._sum.fileSize) !== null && _a !== void 0 ? _a : 0;
    const limitBytes = bytesFromGigabytes(plan.storageLimit);
    if (usedBytes + file.size > limitBytes) {
        throw new HttpError(403, "Storage limit exceeded");
    }
    if (projectId) {
        yield ensureProjectInOrganization(projectId, organizationId);
    }
    return prisma_1.default.file.create({
        data: {
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            organizationId,
            projectId: projectId !== null && projectId !== void 0 ? projectId : null,
            uploadedBy: userId,
        },
    });
});
exports.uploadFile = uploadFile;
const getFiles = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.file.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
    });
});
exports.getFiles = getFiles;
const deleteFile = (fileId, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield prisma_1.default.file.findFirst({
        where: { id: fileId, organizationId },
        select: { id: true },
    });
    if (!file) {
        throw new HttpError(404, "File not found");
    }
    return prisma_1.default.file.delete({
        where: { id: fileId },
    });
});
exports.deleteFile = deleteFile;
