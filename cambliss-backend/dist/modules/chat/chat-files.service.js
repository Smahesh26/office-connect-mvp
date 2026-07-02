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
exports.getChatTransferCleanupStats = exports.getChatFileTransferPolicy = exports.startChatTransferCleanupJob = exports.cleanupExpiredChatTransferFiles = exports.listChatTransferThreads = exports.deleteChatTransferFile = exports.resolveChatTransferForDownload = exports.listChatTransferFiles = exports.uploadChatTransferFile = exports.ChatFileError = exports.FILE_TRANSFER_POLICY = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
const CHAT_TRANSFER_MARKER = "chat-transfers";
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS_SECONDS = 15 * 24 * 60 * 60;
exports.FILE_TRANSFER_POLICY = {
    unlimitedTransfersDuringTrial: true,
    retentionDays: 15,
    autoDeleteAfterSeconds: FIFTEEN_DAYS_SECONDS,
    nonRecoverableAfterDeletion: true,
};
const cleanupStats = {
    lastRunAt: null,
    lastDeletedCount: 0,
    totalDeletedCount: 0,
};
class ChatFileError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "ChatFileError";
        this.statusCode = statusCode;
    }
}
exports.ChatFileError = ChatFileError;
const isAdmin = (role) => role === client_1.RoleName.ADMIN || role === client_1.RoleName.SUPER_ADMIN;
const normalizePath = (filePath) => filePath.replace(/\\/g, "/");
const ensureOrganizationExists = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new ChatFileError(404, "Organization not found");
    }
});
const resolveTargetOrganizationId = (authUser, requestedOrganizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const trimmedRequested = requestedOrganizationId === null || requestedOrganizationId === void 0 ? void 0 : requestedOrganizationId.trim();
    if (!isAdmin(authUser.role)) {
        return authUser.organizationId;
    }
    const targetOrganizationId = trimmedRequested || authUser.organizationId;
    yield ensureOrganizationExists(targetOrganizationId);
    return targetOrganizationId;
});
const mapTransferFile = (record) => {
    const expiresAt = new Date(record.createdAt.getTime() + FIFTEEN_DAYS_MS);
    return {
        id: record.id,
        fileName: record.fileName,
        fileSize: record.fileSize,
        organizationId: record.organizationId,
        uploadedBy: record.uploadedBy,
        createdAt: record.createdAt,
        expiresAt,
        filePath: record.filePath,
    };
};
const getRetentionThreshold = () => new Date(Date.now() - FIFTEEN_DAYS_MS);
const isChatTransferFilePath = (filePath) => normalizePath(filePath).includes(`/${CHAT_TRANSFER_MARKER}/`);
const uploadChatTransferFile = (_a) => __awaiter(void 0, [_a], void 0, function* ({ authUser, file, requestedOrganizationId }) {
    const targetOrganizationId = yield resolveTargetOrganizationId(authUser, requestedOrganizationId);
    const created = yield prisma_1.default.file.create({
        data: {
            fileName: file.originalname,
            filePath: normalizePath(file.path),
            fileSize: file.size,
            organizationId: targetOrganizationId,
            projectId: null,
            uploadedBy: authUser.id,
        },
        select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            organizationId: true,
            uploadedBy: true,
            createdAt: true,
        },
    });
    return mapTransferFile(created);
});
exports.uploadChatTransferFile = uploadChatTransferFile;
const listChatTransferFiles = (authUser, requestedOrganizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const targetOrganizationId = yield resolveTargetOrganizationId(authUser, requestedOrganizationId);
    const threshold = getRetentionThreshold();
    const files = yield prisma_1.default.file.findMany({
        where: {
            organizationId: targetOrganizationId,
            createdAt: {
                gte: threshold,
            },
            filePath: {
                contains: CHAT_TRANSFER_MARKER,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            organizationId: true,
            uploadedBy: true,
            createdAt: true,
        },
    });
    return files.map(mapTransferFile);
});
exports.listChatTransferFiles = listChatTransferFiles;
const resolveChatTransferForDownload = (authUser, fileId, requestedOrganizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const targetOrganizationId = yield resolveTargetOrganizationId(authUser, requestedOrganizationId);
    const threshold = getRetentionThreshold();
    const file = yield prisma_1.default.file.findFirst({
        where: {
            id: fileId,
            organizationId: targetOrganizationId,
            createdAt: {
                gte: threshold,
            },
            filePath: { contains: CHAT_TRANSFER_MARKER },
        },
        select: {
            id: true,
            fileName: true,
            filePath: true,
            organizationId: true,
        },
    });
    if (!file) {
        const expired = yield prisma_1.default.file.findFirst({
            where: {
                id: fileId,
                organizationId: targetOrganizationId,
                filePath: { contains: CHAT_TRANSFER_MARKER },
            },
            select: {
                id: true,
                filePath: true,
            },
        });
        if (expired) {
            const absolutePath = path_1.default.isAbsolute(expired.filePath)
                ? expired.filePath
                : path_1.default.resolve(process.cwd(), expired.filePath);
            if (isChatTransferFilePath(expired.filePath)) {
                yield promises_1.default.unlink(absolutePath).catch(() => undefined);
            }
            yield prisma_1.default.file.delete({ where: { id: expired.id } }).catch(() => undefined);
            throw new ChatFileError(410, "File expired and was permanently deleted");
        }
        throw new ChatFileError(404, "File not found");
    }
    const absolutePath = path_1.default.isAbsolute(file.filePath)
        ? file.filePath
        : path_1.default.resolve(process.cwd(), file.filePath);
    return Object.assign(Object.assign({}, file), { absolutePath });
});
exports.resolveChatTransferForDownload = resolveChatTransferForDownload;
const deleteChatTransferFile = (authUser, fileId, requestedOrganizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const targetOrganizationId = yield resolveTargetOrganizationId(authUser, requestedOrganizationId);
    const file = yield prisma_1.default.file.findFirst({
        where: {
            id: fileId,
            organizationId: targetOrganizationId,
            filePath: { contains: CHAT_TRANSFER_MARKER },
        },
        select: {
            id: true,
            filePath: true,
        },
    });
    if (!file) {
        throw new ChatFileError(404, "File not found");
    }
    const absolutePath = path_1.default.isAbsolute(file.filePath)
        ? file.filePath
        : path_1.default.resolve(process.cwd(), file.filePath);
    if (isChatTransferFilePath(file.filePath)) {
        yield promises_1.default.unlink(absolutePath).catch(() => undefined);
    }
    yield prisma_1.default.file.delete({ where: { id: file.id } });
    return { id: file.id, deleted: true };
});
exports.deleteChatTransferFile = deleteChatTransferFile;
const listChatTransferThreads = (authUser) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!isAdmin(authUser.role)) {
        throw new ChatFileError(403, "Only admin can access transfer folders");
    }
    const threshold = getRetentionThreshold();
    const files = yield prisma_1.default.file.findMany({
        where: {
            createdAt: {
                gte: threshold,
            },
            filePath: {
                contains: CHAT_TRANSFER_MARKER,
            },
        },
        select: {
            organizationId: true,
            createdAt: true,
            fileName: true,
            organization: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    const byOrg = new Map();
    for (const file of files) {
        const current = byOrg.get(file.organizationId);
        if (!current) {
            byOrg.set(file.organizationId, {
                organizationId: file.organizationId,
                organizationName: ((_a = file.organization) === null || _a === void 0 ? void 0 : _a.name) || "Organization",
                fileCount: 1,
                latestFileName: file.fileName,
                latestUploadedAt: file.createdAt,
            });
            continue;
        }
        current.fileCount += 1;
    }
    return Array.from(byOrg.values()).sort((a, b) => b.latestUploadedAt.getTime() - a.latestUploadedAt.getTime());
});
exports.listChatTransferThreads = listChatTransferThreads;
const cleanupExpiredChatTransferFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    const threshold = new Date(Date.now() - FIFTEEN_DAYS_MS);
    const expiredFiles = yield prisma_1.default.file.findMany({
        where: {
            createdAt: { lt: threshold },
            filePath: {
                contains: CHAT_TRANSFER_MARKER,
            },
        },
        select: {
            id: true,
            filePath: true,
        },
    });
    for (const file of expiredFiles) {
        try {
            const absolutePath = path_1.default.isAbsolute(file.filePath)
                ? file.filePath
                : path_1.default.resolve(process.cwd(), file.filePath);
            if (isChatTransferFilePath(file.filePath)) {
                yield promises_1.default.unlink(absolutePath).catch(() => undefined);
            }
            yield prisma_1.default.file.delete({ where: { id: file.id } });
        }
        catch (_a) {
            continue;
        }
    }
    cleanupStats.lastRunAt = new Date();
    cleanupStats.lastDeletedCount = expiredFiles.length;
    cleanupStats.totalDeletedCount += expiredFiles.length;
    return expiredFiles.length;
});
exports.cleanupExpiredChatTransferFiles = cleanupExpiredChatTransferFiles;
const startChatTransferCleanupJob = () => {
    void (0, exports.cleanupExpiredChatTransferFiles)();
    setInterval(() => {
        void (0, exports.cleanupExpiredChatTransferFiles)();
    }, 60 * 60 * 1000);
};
exports.startChatTransferCleanupJob = startChatTransferCleanupJob;
const getChatFileTransferPolicy = () => exports.FILE_TRANSFER_POLICY;
exports.getChatFileTransferPolicy = getChatFileTransferPolicy;
const getChatTransferCleanupStats = () => (Object.assign({}, cleanupStats));
exports.getChatTransferCleanupStats = getChatTransferCleanupStats;
