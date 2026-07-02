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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectStatusUpdateController = exports.updateTaskDetailsController = exports.updateTaskStatusController = exports.createTaskController = exports.addProjectMemberController = exports.getProjectsController = exports.createProjectController = void 0;
const client_1 = require("@prisma/client");
const project_service_1 = require("./project.service");
const handleControllerError = (res, error) => {
    if (error instanceof project_service_1.HttpError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getOrganizationId = (req) => {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        throw new project_service_1.HttpError(400, "Organization ID is required");
    }
    return organizationId;
};
const getRequiredParam = (value, label) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (!normalized || !normalized.trim()) {
        throw new project_service_1.HttpError(400, `${label} is required`);
    }
    return normalized;
};
const createProjectController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const requesterOrganizationId = getOrganizationId(req);
        const requestedOrganizationId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.organizationId;
        const canTargetAnotherOrganization = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === client_1.RoleName.SUPER_ADMIN || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === client_1.RoleName.ADMIN;
        const organizationId = requestedOrganizationId && requestedOrganizationId !== requesterOrganizationId
            ? canTargetAnotherOrganization
                ? requestedOrganizationId
                : (() => {
                    throw new project_service_1.HttpError(403, "Not allowed to create projects for another organization");
                })()
            : requesterOrganizationId;
        const name = (_d = req.body) === null || _d === void 0 ? void 0 : _d.name;
        if (!name) {
            res.status(400).json({ message: "name is required" });
            return;
        }
        const description = (_e = req.body) === null || _e === void 0 ? void 0 : _e.description;
        const project = yield (0, project_service_1.createProject)(name, description, organizationId);
        res.status(201).json(project);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createProjectController = createProjectController;
const getProjectsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const requesterOrganizationId = getOrganizationId(req);
        const rawOrganizationId = (_a = req.query) === null || _a === void 0 ? void 0 : _a.organizationId;
        const firstOrganizationId = Array.isArray(rawOrganizationId) ? rawOrganizationId[0] : rawOrganizationId;
        const requestedOrganizationId = typeof firstOrganizationId === "string" ? firstOrganizationId : undefined;
        const canTargetAnotherOrganization = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === client_1.RoleName.SUPER_ADMIN || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) === client_1.RoleName.ADMIN;
        let organizationId = requesterOrganizationId;
        if (requestedOrganizationId) {
            if (requestedOrganizationId !== requesterOrganizationId && !canTargetAnotherOrganization) {
                throw new project_service_1.HttpError(403, "Not allowed to fetch projects for another organization");
            }
            organizationId = requestedOrganizationId;
        }
        else if (canTargetAnotherOrganization) {
            organizationId = undefined;
        }
        const rawUserId = (_d = req.query) === null || _d === void 0 ? void 0 : _d.userId;
        const firstUserId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
        const userId = typeof firstUserId === "string" ? firstUserId : undefined;
        const projects = yield (0, project_service_1.getProjects)(organizationId, userId);
        res.status(200).json(projects);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.getProjectsController = getProjectsController;
const addProjectMemberController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const organizationId = getOrganizationId(req);
        const projectId = getRequiredParam(req.params.id, "projectId");
        const userId = (_a = req.body) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(400).json({ message: "userId is required" });
            return;
        }
        const createdMember = yield (0, project_service_1.addProjectMember)(projectId, userId, organizationId, (_b = req.user) === null || _b === void 0 ? void 0 : _b.role);
        res.status(201).json(createdMember);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.addProjectMemberController = addProjectMemberController;
const createTaskController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const organizationId = getOrganizationId(req);
        const projectId = getRequiredParam(req.params.id, "projectId");
        const title = (_a = req.body) === null || _a === void 0 ? void 0 : _a.title;
        if (!title) {
            res.status(400).json({ message: "title is required" });
            return;
        }
        const description = (_b = req.body) === null || _b === void 0 ? void 0 : _b.description;
        const assignedTo = (_c = req.body) === null || _c === void 0 ? void 0 : _c.assignedTo;
        const dueDate = (_d = req.body) === null || _d === void 0 ? void 0 : _d.dueDate;
        const task = yield (0, project_service_1.createTask)(projectId, title, description, assignedTo, dueDate, organizationId, (_e = req.user) === null || _e === void 0 ? void 0 : _e.role);
        res.status(201).json(task);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createTaskController = createTaskController;
const updateTaskStatusController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getRequiredParam(req.params.id, "taskId");
        const status = (_a = req.body) === null || _a === void 0 ? void 0 : _a.status;
        if (!status) {
            res.status(400).json({ message: "status is required" });
            return;
        }
        const task = yield (0, project_service_1.updateTaskStatus)(taskId, status, organizationId, (_b = req.user) === null || _b === void 0 ? void 0 : _b.role);
        res.status(200).json(task);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateTaskStatusController = updateTaskStatusController;
const updateTaskDetailsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const organizationId = getOrganizationId(req);
        const taskId = getRequiredParam(req.params.id, "taskId");
        const updatedTask = yield (0, project_service_1.updateTaskDetails)(taskId, {
            title: (_a = req.body) === null || _a === void 0 ? void 0 : _a.title,
            description: (_b = req.body) === null || _b === void 0 ? void 0 : _b.description,
            status: (_c = req.body) === null || _c === void 0 ? void 0 : _c.status,
            dueDate: (_d = req.body) === null || _d === void 0 ? void 0 : _d.dueDate,
            assignedTo: (_e = req.body) === null || _e === void 0 ? void 0 : _e.assignedTo,
        }, organizationId, (_f = req.user) === null || _f === void 0 ? void 0 : _f.role);
        res.status(200).json(updatedTask);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.updateTaskDetailsController = updateTaskDetailsController;
const createProjectStatusUpdateController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const organizationId = getOrganizationId(req);
        const projectId = getRequiredParam(req.params.id, "projectId");
        const status = (_a = req.body) === null || _a === void 0 ? void 0 : _a.status;
        if (!status) {
            res.status(400).json({ message: "status is required" });
            return;
        }
        const note = (_b = req.body) === null || _b === void 0 ? void 0 : _b.note;
        const entry = yield (0, project_service_1.createProjectStatusUpdate)(projectId, status, note, organizationId, (_c = req.user) === null || _c === void 0 ? void 0 : _c.role);
        res.status(201).json(entry);
    }
    catch (error) {
        handleControllerError(res, error);
    }
});
exports.createProjectStatusUpdateController = createProjectStatusUpdateController;
