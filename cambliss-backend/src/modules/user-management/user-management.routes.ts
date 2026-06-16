import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import {
	createOrganizationUserController,
	deactivateOrganizationUserController,
	getMyAccessController,
	listOrganizationUsersController,
	resetOrganizationUserManagementAndCrmDataController,
	updateOrganizationUserAccessController,
} from "./user-management.controller";

const userManagementRouter = Router();

userManagementRouter.use(authenticateJWT);

userManagementRouter.get("/users", listOrganizationUsersController);
userManagementRouter.post("/users", createOrganizationUserController);
userManagementRouter.put("/users/:userId/access", updateOrganizationUserAccessController);
userManagementRouter.delete("/users/:userId", deactivateOrganizationUserController);
userManagementRouter.post("/reset-data", resetOrganizationUserManagementAndCrmDataController);
userManagementRouter.get("/my-access", getMyAccessController);

export default userManagementRouter;
