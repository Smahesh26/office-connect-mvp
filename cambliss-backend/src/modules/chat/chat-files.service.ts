import fs from "fs/promises";
import path from "path";
import prisma from "../../config/prisma";
import { RoleName } from "@prisma/client";

const CHAT_TRANSFER_MARKER = "chat-transfers";
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS_SECONDS = 15 * 24 * 60 * 60;

export const FILE_TRANSFER_POLICY = {
	unlimitedTransfersDuringTrial: true,
	retentionDays: 15,
	autoDeleteAfterSeconds: FIFTEEN_DAYS_SECONDS,
	nonRecoverableAfterDeletion: true,
} as const;

type ChatTransferCleanupStats = {
	lastRunAt: Date | null;
	lastDeletedCount: number;
	totalDeletedCount: number;
};

const cleanupStats: ChatTransferCleanupStats = {
	lastRunAt: null,
	lastDeletedCount: 0,
	totalDeletedCount: 0,
};

export class ChatFileError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.name = "ChatFileError";
		this.statusCode = statusCode;
	}
}

type AuthContext = {
	id: string;
	organizationId: string;
	role: RoleName;
};

type UploadChatFileInput = {
	authUser: AuthContext;
	file: Express.Multer.File;
	requestedOrganizationId?: string;
};

const isAdmin = (role: RoleName) => role === RoleName.ADMIN || role === RoleName.SUPER_ADMIN;

const normalizePath = (filePath: string) => filePath.replace(/\\/g, "/");

const ensureOrganizationExists = async (organizationId: string) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new ChatFileError(404, "Organization not found");
	}
};

const resolveTargetOrganizationId = async (authUser: AuthContext, requestedOrganizationId?: string) => {
	const trimmedRequested = requestedOrganizationId?.trim();

	if (!isAdmin(authUser.role)) {
		return authUser.organizationId;
	}

	const targetOrganizationId = trimmedRequested || authUser.organizationId;
	await ensureOrganizationExists(targetOrganizationId);
	return targetOrganizationId;
};

const mapTransferFile = (record: {
	id: string;
	fileName: string;
	filePath: string;
	fileSize: number;
	organizationId: string;
	uploadedBy: string;
	createdAt: Date;
}) => {
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

const isChatTransferFilePath = (filePath: string) => normalizePath(filePath).includes(`/${CHAT_TRANSFER_MARKER}/`);

export const uploadChatTransferFile = async ({ authUser, file, requestedOrganizationId }: UploadChatFileInput) => {
	const targetOrganizationId = await resolveTargetOrganizationId(authUser, requestedOrganizationId);

	const created = await prisma.file.create({
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
};

export const listChatTransferFiles = async (authUser: AuthContext, requestedOrganizationId?: string) => {
	const targetOrganizationId = await resolveTargetOrganizationId(authUser, requestedOrganizationId);
	const threshold = getRetentionThreshold();

	const files = await prisma.file.findMany({
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
};

export const resolveChatTransferForDownload = async (
	authUser: AuthContext,
	fileId: string,
	requestedOrganizationId?: string,
) => {
	const targetOrganizationId = await resolveTargetOrganizationId(authUser, requestedOrganizationId);
	const threshold = getRetentionThreshold();

	const file = await prisma.file.findFirst({
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
		const expired = await prisma.file.findFirst({
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
			const absolutePath = path.isAbsolute(expired.filePath)
				? expired.filePath
				: path.resolve(process.cwd(), expired.filePath);

			if (isChatTransferFilePath(expired.filePath)) {
				await fs.unlink(absolutePath).catch(() => undefined);
			}

			await prisma.file.delete({ where: { id: expired.id } }).catch(() => undefined);
			throw new ChatFileError(410, "File expired and was permanently deleted");
		}

		throw new ChatFileError(404, "File not found");
	}

	const absolutePath = path.isAbsolute(file.filePath)
		? file.filePath
		: path.resolve(process.cwd(), file.filePath);

	return {
		...file,
		absolutePath,
	};
};

export const deleteChatTransferFile = async (
	authUser: AuthContext,
	fileId: string,
	requestedOrganizationId?: string,
) => {
	const targetOrganizationId = await resolveTargetOrganizationId(authUser, requestedOrganizationId);

	const file = await prisma.file.findFirst({
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

	const absolutePath = path.isAbsolute(file.filePath)
		? file.filePath
		: path.resolve(process.cwd(), file.filePath);

	if (isChatTransferFilePath(file.filePath)) {
		await fs.unlink(absolutePath).catch(() => undefined);
	}

	await prisma.file.delete({ where: { id: file.id } });

	return { id: file.id, deleted: true };
};

export const listChatTransferThreads = async (authUser: AuthContext) => {
	if (!isAdmin(authUser.role)) {
		throw new ChatFileError(403, "Only admin can access transfer folders");
	}

	const threshold = getRetentionThreshold();

	const files = await prisma.file.findMany({
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

	const byOrg = new Map<string, { organizationId: string; organizationName: string; fileCount: number; latestFileName: string; latestUploadedAt: Date }>();

	for (const file of files) {
		const current = byOrg.get(file.organizationId);
		if (!current) {
			byOrg.set(file.organizationId, {
				organizationId: file.organizationId,
				organizationName: file.organization?.name || "Organization",
				fileCount: 1,
				latestFileName: file.fileName,
				latestUploadedAt: file.createdAt,
			});
			continue;
		}

		current.fileCount += 1;
	}

	return Array.from(byOrg.values()).sort((a, b) => b.latestUploadedAt.getTime() - a.latestUploadedAt.getTime());
};

export const cleanupExpiredChatTransferFiles = async () => {
	const threshold = new Date(Date.now() - FIFTEEN_DAYS_MS);

	const expiredFiles = await prisma.file.findMany({
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
			const absolutePath = path.isAbsolute(file.filePath)
				? file.filePath
				: path.resolve(process.cwd(), file.filePath);

			if (isChatTransferFilePath(file.filePath)) {
				await fs.unlink(absolutePath).catch(() => undefined);
			}

			await prisma.file.delete({ where: { id: file.id } });
		} catch {
			continue;
		}
	}

	cleanupStats.lastRunAt = new Date();
	cleanupStats.lastDeletedCount = expiredFiles.length;
	cleanupStats.totalDeletedCount += expiredFiles.length;

	return expiredFiles.length;
};

export const startChatTransferCleanupJob = () => {
	const runCleanup = async () => {
		try {
			await cleanupExpiredChatTransferFiles();
		} catch (error) {
			console.error("[chat-cleanup] cleanup failed:", error);
		}
	};

	void runCleanup();

	setInterval(() => {
		void runCleanup();
	}, 60 * 60 * 1000);
};

export const getChatFileTransferPolicy = () => FILE_TRANSFER_POLICY;

export const getChatTransferCleanupStats = () => ({
	...cleanupStats,
});
