import { Request, Response } from "express";
import { RoleName } from "../../generated/prisma/enums";
import {
	addProjectMember,
	createProjectStatusUpdate,
	createProject,
	createTask,
	getProjects,
	HttpError,
	updateTaskDetails,
	updateTaskStatus,
} from "./project.service";

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

const getRequiredParam = (value: string | string[] | undefined, label: string): string => {
	const normalized = Array.isArray(value) ? value[0] : value;
	if (!normalized || !normalized.trim()) {
		throw new HttpError(400, `${label} is required`);
	}

	return normalized;
};

export const createProjectController = async (req: Request, res: Response): Promise<void> => {
	try {
		const requesterOrganizationId = getOrganizationId(req);
		const requestedOrganizationId = req.body?.organizationId as string | undefined;
		const canTargetAnotherOrganization = req.user?.role === RoleName.SUPER_ADMIN || req.user?.role === RoleName.ADMIN;

		const organizationId =
			requestedOrganizationId && requestedOrganizationId !== requesterOrganizationId
				? canTargetAnotherOrganization
					? requestedOrganizationId
					: (() => {
						throw new HttpError(403, "Not allowed to create projects for another organization");
					})()
				: requesterOrganizationId;

		const name = req.body?.name as string | undefined;
		if (!name) {
			res.status(400).json({ message: "name is required" });
			return;
		}

		const description = req.body?.description as string | undefined;
		const project = await createProject(name, description, organizationId);
		res.status(201).json(project);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const getProjectsController = async (req: Request, res: Response): Promise<void> => {
	try {
		const requesterOrganizationId = getOrganizationId(req);
		const rawOrganizationId = req.query?.organizationId;
		const firstOrganizationId = Array.isArray(rawOrganizationId) ? rawOrganizationId[0] : rawOrganizationId;
		const requestedOrganizationId = typeof firstOrganizationId === "string" ? firstOrganizationId : undefined;
		const canTargetAnotherOrganization = req.user?.role === RoleName.SUPER_ADMIN || req.user?.role === RoleName.ADMIN;

		let organizationId: string | undefined = requesterOrganizationId;
		if (requestedOrganizationId) {
			if (requestedOrganizationId !== requesterOrganizationId && !canTargetAnotherOrganization) {
				throw new HttpError(403, "Not allowed to fetch projects for another organization");
			}
			organizationId = requestedOrganizationId;
		} else if (canTargetAnotherOrganization) {
			organizationId = undefined;
		}

		const rawUserId = req.query?.userId;
		const firstUserId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
		const userId = typeof firstUserId === "string" ? firstUserId : undefined;
		const projects = await getProjects(organizationId, userId);
		res.status(200).json(projects);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const addProjectMemberController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const projectId = getRequiredParam(req.params.id, "projectId");
		const userId = req.body?.userId as string | undefined;
		if (!userId) {
			res.status(400).json({ message: "userId is required" });
			return;
		}

		const createdMember = await addProjectMember(projectId, userId, organizationId, req.user?.role);
		res.status(201).json(createdMember);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createTaskController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const projectId = getRequiredParam(req.params.id, "projectId");
		const title = req.body?.title as string | undefined;
		if (!title) {
			res.status(400).json({ message: "title is required" });
			return;
		}

		const description = req.body?.description as string | undefined;
		const assignedTo = req.body?.assignedTo as string | undefined;
		const dueDate = req.body?.dueDate as string | undefined;
		const task = await createTask(projectId, title, description, assignedTo, dueDate, organizationId, req.user?.role);
		res.status(201).json(task);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateTaskStatusController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const taskId = getRequiredParam(req.params.id, "taskId");
		const status = req.body?.status as string | undefined;
		if (!status) {
			res.status(400).json({ message: "status is required" });
			return;
		}

		const task = await updateTaskStatus(taskId, status, organizationId, req.user?.role);
		res.status(200).json(task);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const updateTaskDetailsController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const taskId = getRequiredParam(req.params.id, "taskId");

		const updatedTask = await updateTaskDetails(
			taskId,
			{
				title: req.body?.title as string | undefined,
				description: req.body?.description as string | undefined,
				status: req.body?.status as string | undefined,
				dueDate: req.body?.dueDate as string | null | undefined,
				assignedTo: req.body?.assignedTo as string | null | undefined,
			},
			organizationId,
			req.user?.role,
		);

		res.status(200).json(updatedTask);
	} catch (error) {
		handleControllerError(res, error);
	}
};

export const createProjectStatusUpdateController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = getOrganizationId(req);
		const projectId = getRequiredParam(req.params.id, "projectId");
		const status = req.body?.status as string | undefined;
		if (!status) {
			res.status(400).json({ message: "status is required" });
			return;
		}

		const note = req.body?.note as string | undefined;
		const entry = await createProjectStatusUpdate(projectId, status, note, organizationId, req.user?.role);
		res.status(201).json(entry);
	} catch (error) {
		handleControllerError(res, error);
	}
};
