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
exports.createChatMessage = exports.listChatMessagesForAdmin = exports.listChatMessages = exports.ensureChatStorage = exports.ChatError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const crypto_1 = require("crypto");
class ChatError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ChatError";
    }
}
exports.ChatError = ChatError;
let chatTableInitialized = false;
const normalizeMessage = (value) => {
    const normalized = value.trim();
    if (!normalized) {
        throw new ChatError(400, "Message is required");
    }
    if (normalized.length > 2000) {
        throw new ChatError(400, "Message exceeds 2000 characters");
    }
    return normalized;
};
const ensureChatStorage = () => __awaiter(void 0, void 0, void 0, function* () {
    if (chatTableInitialized) {
        return;
    }
    yield prisma_1.default.$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "ChatMessage" (
			"id" TEXT PRIMARY KEY,
			"organizationId" TEXT NOT NULL,
			"senderUserId" TEXT NOT NULL,
			"senderEmail" TEXT NOT NULL,
			"senderName" TEXT,
			"senderRole" TEXT NOT NULL,
			"message" TEXT NOT NULL,
			"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);
    yield prisma_1.default.$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "ChatMessage_organizationId_createdAt_idx"
		ON "ChatMessage" ("organizationId", "createdAt");
	`);
    chatTableInitialized = true;
});
exports.ensureChatStorage = ensureChatStorage;
const listChatMessages = (organizationId_1, ...args_1) => __awaiter(void 0, [organizationId_1, ...args_1], void 0, function* (organizationId, limit = 100) {
    yield (0, exports.ensureChatStorage)();
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const rows = yield prisma_1.default.$queryRawUnsafe(`
		SELECT
			"id",
			"organizationId",
			"senderUserId",
			"senderEmail",
			"senderName",
			"senderRole",
			"message",
			"createdAt"
		FROM "ChatMessage"
		WHERE "organizationId" = $1
		ORDER BY "createdAt" DESC
		LIMIT ${safeLimit}
		`, organizationId);
    return rows
        .map((row) => (Object.assign(Object.assign({}, row), { createdAt: row.createdAt.toISOString() })))
        .reverse();
});
exports.listChatMessages = listChatMessages;
const listChatMessagesForAdmin = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 200, organizationId) {
    yield (0, exports.ensureChatStorage)();
    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 400);
    const scopedQuery = organizationId
        ? prisma_1.default.$queryRawUnsafe(`
			SELECT
				"id",
				"organizationId",
				"senderUserId",
				"senderEmail",
				"senderName",
				"senderRole",
				"message",
				"createdAt"
			FROM "ChatMessage"
			WHERE "organizationId" = $1
			ORDER BY "createdAt" DESC
			LIMIT ${safeLimit}
			`, organizationId)
        : prisma_1.default.$queryRawUnsafe(`
			SELECT
				"id",
				"organizationId",
				"senderUserId",
				"senderEmail",
				"senderName",
				"senderRole",
				"message",
				"createdAt"
			FROM "ChatMessage"
			ORDER BY "createdAt" DESC
			LIMIT ${safeLimit}
			`);
    const rows = yield scopedQuery;
    return rows
        .map((row) => (Object.assign(Object.assign({}, row), { createdAt: row.createdAt.toISOString() })))
        .reverse();
});
exports.listChatMessagesForAdmin = listChatMessagesForAdmin;
const createChatMessage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield (0, exports.ensureChatStorage)();
    const normalizedMessage = normalizeMessage(params.message);
    const id = (0, crypto_1.randomUUID)();
    const rows = yield prisma_1.default.$queryRawUnsafe(`
		INSERT INTO "ChatMessage" (
			"id",
			"organizationId",
			"senderUserId",
			"senderEmail",
			"senderName",
			"senderRole",
			"message"
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING
			"id",
			"organizationId",
			"senderUserId",
			"senderEmail",
			"senderName",
			"senderRole",
			"message",
			"createdAt"
		`, id, params.organizationId, params.senderUserId, params.senderEmail, (_a = params.senderName) !== null && _a !== void 0 ? _a : null, String(params.senderRole), normalizedMessage);
    const created = rows[0];
    return Object.assign(Object.assign({}, created), { createdAt: created.createdAt.toISOString() });
});
exports.createChatMessage = createChatMessage;
