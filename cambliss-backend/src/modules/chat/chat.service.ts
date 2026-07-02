import prisma from "../../config/prisma";
import { randomUUID } from "crypto";
import type { RoleName } from "@prisma/client";

export class ChatError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "ChatError";
	}
}

export type ChatMessage = {
	id: string;
	organizationId: string;
	senderUserId: string;
	senderEmail: string;
	senderName: string | null;
	senderRole: string;
	message: string;
	createdAt: string;
};

let chatTableInitialized = false;

const normalizeMessage = (value: string): string => {
	const normalized = value.trim();
	if (!normalized) {
		throw new ChatError(400, "Message is required");
	}

	if (normalized.length > 2000) {
		throw new ChatError(400, "Message exceeds 2000 characters");
	}

	return normalized;
};

export const ensureChatStorage = async (): Promise<void> => {
	if (chatTableInitialized) {
		return;
	}

	await prisma.$executeRawUnsafe(`
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

	await prisma.$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "ChatMessage_organizationId_createdAt_idx"
		ON "ChatMessage" ("organizationId", "createdAt");
	`);

	chatTableInitialized = true;
};

export const listChatMessages = async (organizationId: string, limit = 100): Promise<ChatMessage[]> => {
	await ensureChatStorage();
	const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

	const rows = await prisma.$queryRawUnsafe<Array<{
		id: string;
		organizationId: string;
		senderUserId: string;
		senderEmail: string;
		senderName: string | null;
		senderRole: string;
		message: string;
		createdAt: Date;
	}>>(
		`
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
		`,
		organizationId,
	);

	return rows
		.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
		}))
		.reverse();
};

export const listChatMessagesForAdmin = async (limit = 200, organizationId?: string): Promise<ChatMessage[]> => {
	await ensureChatStorage();
	const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 400);

	const scopedQuery = organizationId
		? prisma.$queryRawUnsafe<Array<{
			id: string;
			organizationId: string;
			senderUserId: string;
			senderEmail: string;
			senderName: string | null;
			senderRole: string;
			message: string;
			createdAt: Date;
		}>>(
			`
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
			`,
			organizationId,
		)
		: prisma.$queryRawUnsafe<Array<{
			id: string;
			organizationId: string;
			senderUserId: string;
			senderEmail: string;
			senderName: string | null;
			senderRole: string;
			message: string;
			createdAt: Date;
		}>>(
			`
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
			`,
		);

	const rows = await scopedQuery;

	return rows
		.map((row) => ({
			...row,
			createdAt: row.createdAt.toISOString(),
		}))
		.reverse();
};

export const createChatMessage = async (params: {
	organizationId: string;
	senderUserId: string;
	senderEmail: string;
	senderName?: string | null;
	senderRole: RoleName | string;
	message: string;
}): Promise<ChatMessage> => {
	await ensureChatStorage();

	const normalizedMessage = normalizeMessage(params.message);
	const id = randomUUID();

	const rows = await prisma.$queryRawUnsafe<Array<{
		id: string;
		organizationId: string;
		senderUserId: string;
		senderEmail: string;
		senderName: string | null;
		senderRole: string;
		message: string;
		createdAt: Date;
	}>>(
		`
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
		`,
		id,
		params.organizationId,
		params.senderUserId,
		params.senderEmail,
		params.senderName ?? null,
		String(params.senderRole),
		normalizedMessage,
	);

	const created = rows[0];
	return {
		...created,
		createdAt: created.createdAt.toISOString(),
	};
};
