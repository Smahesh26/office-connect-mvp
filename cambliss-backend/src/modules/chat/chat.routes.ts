import { Router, Request, Response } from "express";
import { uploadChatTransfer } from "../../config/multer";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import { RoleName } from "../../generated/prisma/enums";
import { ChatError, createChatMessage, listChatMessages, listChatMessagesForAdmin } from "./chat.service";
import {
	ChatFileError,
	deleteChatTransferFile,
	listChatTransferFiles,
	listChatTransferThreads,
	resolveChatTransferForDownload,
	uploadChatTransferFile,
} from "./chat-files.service";

const chatRouter = Router();

chatRouter.use(authenticateJWT, requireActiveSubscription);

const toSingleString = (value: unknown): string | undefined => {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value) && typeof value[0] === "string") {
		return value[0];
	}

	return undefined;
};

const handleError = (res: Response, error: unknown) => {
	if (error instanceof ChatError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof ChatFileError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

chatRouter.get("/messages", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		const organizationId = user?.organizationId;
		if (!organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const rawLimit = req.query?.limit;
		const limit = typeof rawLimit === "string" ? Number(rawLimit) : undefined;
		const rawOrganizationId = req.query?.organizationId;
		const requestedOrganizationId = toSingleString(rawOrganizationId);

		const isAdmin = user.role === RoleName.ADMIN || user.role === RoleName.SUPER_ADMIN;
		const messages = isAdmin
			? await listChatMessagesForAdmin(limit, requestedOrganizationId)
			: await listChatMessages(organizationId, limit);
		res.status(200).json(messages);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.post("/messages", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const message = req.body?.message as string | undefined;
		if (!message) {
			res.status(400).json({ message: "message is required" });
			return;
		}

		const isAdmin = user.role === RoleName.ADMIN || user.role === RoleName.SUPER_ADMIN;
		const targetOrganizationId = isAdmin
			? ((req.body?.organizationId as string | undefined)?.trim() || user.organizationId)
			: user.organizationId;

		const created = await createChatMessage({
			organizationId: targetOrganizationId,
			senderUserId: user.id,
			senderEmail: user.email,
			senderRole: user.role,
			senderName: null,
			message,
		});

		res.status(201).json(created);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.post("/files", uploadChatTransfer.single("file"), async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		if (!req.file) {
			res.status(400).json({ message: "File is required" });
			return;
		}

		const requestedOrganizationId = toSingleString(req.body?.organizationId);
		const created = await uploadChatTransferFile({
			authUser: {
				id: user.id,
				organizationId: user.organizationId,
				role: user.role,
			},
			file: req.file,
			requestedOrganizationId,
		});

		res.status(201).json(created);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.get("/files", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const requestedOrganizationId = toSingleString(req.query?.organizationId);
		const files = await listChatTransferFiles(
			{ id: user.id, organizationId: user.organizationId, role: user.role },
			requestedOrganizationId,
		);

		res.status(200).json(files);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.get("/files/threads", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const threads = await listChatTransferThreads({
			id: user.id,
			organizationId: user.organizationId,
			role: user.role,
		});

		res.status(200).json(threads);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.get("/files/:id/download", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const fileId = toSingleString(req.params.id);
		if (!fileId) {
			res.status(400).json({ message: "File ID is required" });
			return;
		}

		const requestedOrganizationId = toSingleString(req.query?.organizationId);
		const file = await resolveChatTransferForDownload(
			{ id: user.id, organizationId: user.organizationId, role: user.role },
			fileId,
			requestedOrganizationId,
		);

		res.download(file.absolutePath, file.fileName);
	} catch (error) {
		handleError(res, error);
	}
});

chatRouter.delete("/files/:id", async (req: Request, res: Response) => {
	try {
		const user = req.user;
		if (!user?.organizationId) {
			res.status(400).json({ message: "Organization ID is required" });
			return;
		}

		const fileId = toSingleString(req.params.id);
		if (!fileId) {
			res.status(400).json({ message: "File ID is required" });
			return;
		}

		const requestedOrganizationId = toSingleString(req.query?.organizationId);
		const result = await deleteChatTransferFile(
			{ id: user.id, organizationId: user.organizationId, role: user.role },
			fileId,
			requestedOrganizationId,
		);

		res.status(200).json(result);
	} catch (error) {
		handleError(res, error);
	}
});

export default chatRouter;
