import { Router } from "express";
import { RoleName } from "../../generated/prisma/enums";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	addProjectMemberController,
	createProjectStatusUpdateController,
	createProjectController,
	createTaskController,
	getProjectsController,
	updateTaskDetailsController,
	updateTaskStatusController,
} from "./project.controller";

const projectRouter = Router();

projectRouter.use(authenticateJWT, requireActiveSubscription);

projectRouter.get(
	"/projects",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER, RoleName.EMPLOYEE, RoleName.CLIENT),
	getProjectsController,
);

projectRouter.post(
	"/projects",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	createProjectController,
);

projectRouter.post(
	"/projects/:id/members",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	addProjectMemberController,
);

projectRouter.post(
	"/projects/:id/tasks",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	createTaskController,
);

projectRouter.post(
	"/projects/:id/status-updates",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	createProjectStatusUpdateController,
);

projectRouter.put(
	"/tasks/:id",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER),
	updateTaskDetailsController,
);

projectRouter.put(
	"/tasks/:id/status",
	authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.PROJECT_MANAGER, RoleName.EMPLOYEE),
	updateTaskStatusController,
);

export default projectRouter;
