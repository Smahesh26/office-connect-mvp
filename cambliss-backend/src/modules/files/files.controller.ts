import { Request, Response } from "express";
import { deleteFile, getFiles, HttpError, uploadFile } from "./files.service";

const handleControllerError = (res: Response, error: unknown): void => {
	if (error instanceof HttpError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

const getOrganizationId = (req: Request): string => {
	const organizationId = req.user?.organizationId;
	if (!organizationId) {
		throw new HttpError(400, "Organization ID is required");
	}

	return organizationId;
};

export const uploadFileController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const userId = req.user?.id;
		if (!userId) {
			res.status(400).json({ message: "User ID is required" });
			return;
		}

		if (!req.file) {
			res.status(400).json({ message: "File is required" });
			return;
		}

		const projectId = req.body?.projectId as string | undefined;
		const result = await uploadFile(organizationId, userId, req.file, projectId);
		res.status(201).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getFilesController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const files = await getFiles(organizationId);
		res.status(200).json(files);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const deleteFileController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const fileId = req.params.id as string | undefined;
		if (!fileId) {
			res.status(400).json({ message: "File ID is required" });
			return;
		}

		const result = await deleteFile(fileId, organizationId);
		res.status(200).json(result);
	} catch (error) {
		handleControllerError(res, error);
	}
};
