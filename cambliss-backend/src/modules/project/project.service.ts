import prisma from "../../config/prisma";
import { RoleName } from "../../generated/prisma/enums";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

const ensureActiveSubscription = async (organizationId: string): Promise<void> => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true, isActive: true },
	});

	if (!organization?.isActive) {
		throw new HttpError(403, "Organization is inactive");
	}

	const subscription = await prisma.subscription.findFirst({
		where: {
			organizationId,
			status: "ACTIVE",
		},
		select: { id: true },
	});

	if (!subscription) {
		throw new HttpError(403, "No active subscription. Please subscribe to continue.");
	}
};

const isCrossOrgPrivileged = (role?: RoleName): boolean => role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN;

const assertOrganizationAccess = (
	actorOrganizationId: string,
	targetOrganizationId: string,
	role?: RoleName,
): void => {
	if (actorOrganizationId === targetOrganizationId) {
		return;
	}

	if (isCrossOrgPrivileged(role)) {
		return;
	}

	throw new HttpError(403, "Forbidden: Project belongs to another organization");
};

export const createProject = async (name: string, description: string | undefined, organizationId: string) => {
	const trimmedName = name.trim();
	if (!trimmedName) {
		throw new HttpError(400, "Project name is required");
	}

	await ensureActiveSubscription(organizationId);

	const existingProjectWithSameName = await prisma.project.findFirst({
		where: {
			organizationId,
			name: {
				equals: trimmedName,
				mode: "insensitive",
			},
		},
		select: {
			id: true,
		},
	});

	if (existingProjectWithSameName) {
		throw new HttpError(409, "Project with same name already exists for this organization");
	}

	return prisma.project.create({
		data: {
			name: trimmedName,
			description: description?.trim() || null,
			organizationId,
		},
	});
};

export const getProjects = async (organizationId: string | undefined, userId?: string) => {
	const normalizedUserId = userId?.trim();

	if (normalizedUserId) {
		const userInScope = await prisma.user.findFirst({
			where: {
				id: normalizedUserId,
				...(organizationId ? { organizationId } : {}),
			},
			select: {
				id: true,
			},
		});

		if (!userInScope) {
			throw new HttpError(404, "User not found in organization");
		}
	}

	return prisma.project.findMany({
		where: {
			...(organizationId ? { organizationId } : {}),
			...(normalizedUserId
				? {
					OR: [
						{
							members: {
								some: {
									userId: normalizedUserId,
								},
							},
						},
						{
							tasks: {
								some: {
									assignedTo: normalizedUserId,
								},
							},
						},
					],
				}
				: {}),
		},
		include: {
			organization: {
				select: {
					id: true,
					name: true,
					memberships: {
						where: {
							role: { name: RoleName.CLIENT },
						},
						select: {
							user: {
								select: {
									id: true,
									email: true,
									firstName: true,
									lastName: true,
								},
							},
						},
					},
				},
			},
			tasks: {
				orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
				include: {
					assignee: {
						select: {
							id: true,
							email: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			},
			members: {
				include: {
					user: {
						select: {
							id: true,
							email: true,
							firstName: true,
							lastName: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

export const addProjectMember = async (projectId: string, userId: string, organizationId: string, role?: RoleName) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, organizationId: true },
	});

	if (!project) {
		throw new HttpError(404, "Project not found");
	}

	assertOrganizationAccess(organizationId, project.organizationId, role);

	const user = await prisma.user.findFirst({
		where: { id: userId, organizationId: project.organizationId },
		select: { id: true },
	});

	if (!user) {
		throw new HttpError(404, "User not found in organization");
	}

	return prisma.projectMember.create({
		data: {
			projectId,
			userId,
		},
	});
};

export const createTask = async (
	projectId: string,
	title: string,
	description: string | undefined,
	assignedTo: string | undefined,
	dueDate: string | undefined,
	organizationId: string,
	role?: RoleName,
) => {
	const trimmedTitle = title.trim();
	if (!trimmedTitle) {
		throw new HttpError(400, "Task title is required");
	}

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, organizationId: true },
	});

	if (!project) {
		throw new HttpError(404, "Project not found");
	}

	assertOrganizationAccess(organizationId, project.organizationId, role);

	if (assignedTo) {
		const user = await prisma.user.findFirst({
			where: { id: assignedTo, organizationId: project.organizationId },
			select: { id: true },
		});

		if (!user) {
			throw new HttpError(404, "Assignee not found in organization");
		}
	}

	let normalizedDueDate: Date | null = null;
	if (dueDate && dueDate.trim()) {
		const parsedDueDate = new Date(dueDate);
		if (Number.isNaN(parsedDueDate.getTime())) {
			throw new HttpError(400, "Invalid dueDate");
		}
		normalizedDueDate = parsedDueDate;
	}

	return prisma.task.create({
		data: {
			projectId,
			title: trimmedTitle,
			description: description?.trim() || null,
			assignedTo: assignedTo ?? null,
			dueDate: normalizedDueDate,
		},
		include: {
			assignee: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};

export const updateTaskStatus = async (taskId: string, status: string, organizationId: string, role?: RoleName) => {
	const trimmedStatus = status.trim();
	if (!trimmedStatus) {
		throw new HttpError(400, "Status is required");
	}

	const task = await prisma.task.findFirst({
		where: {
			id: taskId,
		},
		select: {
			id: true,
			project: {
				select: {
					organizationId: true,
				},
			},
		},
	});

	if (!task) {
		throw new HttpError(404, "Task not found");
	}

	assertOrganizationAccess(organizationId, task.project.organizationId, role);

	return prisma.task.update({
		where: { id: taskId },
		data: { status: trimmedStatus },
		include: {
			assignee: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};

export const createProjectStatusUpdate = async (
	projectId: string,
	status: string,
	note: string | undefined,
	organizationId: string,
	role?: RoleName,
) => {
	const normalizedStatus = status.trim();
	if (!normalizedStatus) {
		throw new HttpError(400, "status is required");
	}

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, organizationId: true },
	});

	if (!project) {
		throw new HttpError(404, "Project not found");
	}

	assertOrganizationAccess(organizationId, project.organizationId, role);

	return prisma.task.create({
		data: {
			projectId,
			title: `Status: ${normalizedStatus}`,
			description: note?.trim() || null,
			status: normalizedStatus,
		},
		include: {
			assignee: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};

export const updateTaskDetails = async (
	taskId: string,
	payload: {
		title?: string;
		description?: string;
		status?: string;
		dueDate?: string | null;
		assignedTo?: string | null;
	},
	organizationId: string,
	role?: RoleName,
) => {
	const task = await prisma.task.findFirst({
		where: {
			id: taskId,
		},
		select: {
			id: true,
			project: {
				select: {
					organizationId: true,
				},
			},
		},
	});

	if (!task) {
		throw new HttpError(404, "Task not found");
	}

	assertOrganizationAccess(organizationId, task.project.organizationId, role);

	const data: {
		title?: string;
		description?: string | null;
		status?: string;
		dueDate?: Date | null;
		assignedTo?: string | null;
	} = {};

	if (payload.title !== undefined) {
		const normalizedTitle = payload.title.trim();
		if (!normalizedTitle) {
			throw new HttpError(400, "title cannot be empty");
		}
		data.title = normalizedTitle;
	}

	if (payload.description !== undefined) {
		data.description = payload.description.trim() ? payload.description.trim() : null;
	}

	if (payload.status !== undefined) {
		const normalizedStatus = payload.status.trim();
		if (!normalizedStatus) {
			throw new HttpError(400, "status cannot be empty");
		}
		data.status = normalizedStatus;
	}

	if (payload.dueDate !== undefined) {
		if (payload.dueDate === null || payload.dueDate === "") {
			data.dueDate = null;
		} else {
			const parsedDueDate = new Date(payload.dueDate);
			if (Number.isNaN(parsedDueDate.getTime())) {
				throw new HttpError(400, "Invalid dueDate");
			}
			data.dueDate = parsedDueDate;
		}
	}

	if (payload.assignedTo !== undefined) {
		if (payload.assignedTo === null || payload.assignedTo === "") {
			data.assignedTo = null;
		} else {
			const assignee = await prisma.user.findFirst({
				where: { id: payload.assignedTo, organizationId: task.project.organizationId },
				select: { id: true },
			});

			if (!assignee) {
				throw new HttpError(404, "Assignee not found in organization");
			}

			data.assignedTo = payload.assignedTo;
		}
	}

	return prisma.task.update({
		where: { id: taskId },
		data,
		include: {
			assignee: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});
};
