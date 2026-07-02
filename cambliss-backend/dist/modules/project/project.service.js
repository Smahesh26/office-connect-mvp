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
exports.updateTaskDetails = exports.createProjectStatusUpdate = exports.updateTaskStatus = exports.createTask = exports.addProjectMember = exports.getProjects = exports.createProject = exports.HttpError = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
const ensureActiveSubscription = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, isActive: true },
    });
    if (!(organization === null || organization === void 0 ? void 0 : organization.isActive)) {
        throw new HttpError(403, "Organization is inactive");
    }
    const subscription = yield prisma_1.default.subscription.findFirst({
        where: {
            organizationId,
            status: "ACTIVE",
        },
        select: { id: true },
    });
    if (!subscription) {
        throw new HttpError(403, "No active subscription. Please subscribe to continue.");
    }
});
const isCrossOrgPrivileged = (role) => role === client_1.RoleName.SUPER_ADMIN || role === client_1.RoleName.ADMIN;
const assertOrganizationAccess = (actorOrganizationId, targetOrganizationId, role) => {
    if (actorOrganizationId === targetOrganizationId) {
        return;
    }
    if (isCrossOrgPrivileged(role)) {
        return;
    }
    throw new HttpError(403, "Forbidden: Project belongs to another organization");
};
const createProject = (name, description, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new HttpError(400, "Project name is required");
    }
    yield ensureActiveSubscription(organizationId);
    const existingProjectWithSameName = yield prisma_1.default.project.findFirst({
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
    return prisma_1.default.project.create({
        data: {
            name: trimmedName,
            description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
            organizationId,
        },
    });
});
exports.createProject = createProject;
const getProjects = (organizationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedUserId = userId === null || userId === void 0 ? void 0 : userId.trim();
    if (normalizedUserId) {
        const userInScope = yield prisma_1.default.user.findFirst({
            where: Object.assign({ id: normalizedUserId }, (organizationId ? { organizationId } : {})),
            select: {
                id: true,
            },
        });
        if (!userInScope) {
            throw new HttpError(404, "User not found in organization");
        }
    }
    return prisma_1.default.project.findMany({
        where: Object.assign(Object.assign({}, (organizationId ? { organizationId } : {})), (normalizedUserId
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
            : {})),
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    memberships: {
                        where: {
                            role: { name: client_1.RoleName.CLIENT },
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
});
exports.getProjects = getProjects;
const addProjectMember = (projectId, userId, organizationId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield prisma_1.default.project.findUnique({
        where: { id: projectId },
        select: { id: true, organizationId: true },
    });
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    assertOrganizationAccess(organizationId, project.organizationId, role);
    const user = yield prisma_1.default.user.findFirst({
        where: { id: userId, organizationId: project.organizationId },
        select: { id: true },
    });
    if (!user) {
        throw new HttpError(404, "User not found in organization");
    }
    return prisma_1.default.projectMember.create({
        data: {
            projectId,
            userId,
        },
    });
});
exports.addProjectMember = addProjectMember;
const createTask = (projectId, title, description, assignedTo, dueDate, organizationId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
        throw new HttpError(400, "Task title is required");
    }
    const project = yield prisma_1.default.project.findUnique({
        where: { id: projectId },
        select: { id: true, organizationId: true },
    });
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    assertOrganizationAccess(organizationId, project.organizationId, role);
    if (assignedTo) {
        const user = yield prisma_1.default.user.findFirst({
            where: { id: assignedTo, organizationId: project.organizationId },
            select: { id: true },
        });
        if (!user) {
            throw new HttpError(404, "Assignee not found in organization");
        }
    }
    let normalizedDueDate = null;
    if (dueDate && dueDate.trim()) {
        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime())) {
            throw new HttpError(400, "Invalid dueDate");
        }
        normalizedDueDate = parsedDueDate;
    }
    return prisma_1.default.task.create({
        data: {
            projectId,
            title: trimmedTitle,
            description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
            assignedTo: assignedTo !== null && assignedTo !== void 0 ? assignedTo : null,
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
});
exports.createTask = createTask;
const updateTaskStatus = (taskId, status, organizationId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const trimmedStatus = status.trim();
    if (!trimmedStatus) {
        throw new HttpError(400, "Status is required");
    }
    const task = yield prisma_1.default.task.findFirst({
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
    return prisma_1.default.task.update({
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
});
exports.updateTaskStatus = updateTaskStatus;
const createProjectStatusUpdate = (projectId, status, note, organizationId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedStatus = status.trim();
    if (!normalizedStatus) {
        throw new HttpError(400, "status is required");
    }
    const project = yield prisma_1.default.project.findUnique({
        where: { id: projectId },
        select: { id: true, organizationId: true },
    });
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    assertOrganizationAccess(organizationId, project.organizationId, role);
    return prisma_1.default.task.create({
        data: {
            projectId,
            title: `Status: ${normalizedStatus}`,
            description: (note === null || note === void 0 ? void 0 : note.trim()) || null,
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
});
exports.createProjectStatusUpdate = createProjectStatusUpdate;
const updateTaskDetails = (taskId, payload, organizationId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield prisma_1.default.task.findFirst({
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
    const data = {};
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
        }
        else {
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
        }
        else {
            const assignee = yield prisma_1.default.user.findFirst({
                where: { id: payload.assignedTo, organizationId: task.project.organizationId },
                select: { id: true },
            });
            if (!assignee) {
                throw new HttpError(404, "Assignee not found in organization");
            }
            data.assignedTo = payload.assignedTo;
        }
    }
    return prisma_1.default.task.update({
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
});
exports.updateTaskDetails = updateTaskDetails;
