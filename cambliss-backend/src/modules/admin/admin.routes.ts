import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";
import {
	assignModulesToPlanController,
	createPlanController,
	deletePlanController,
	downloadAdminOrderInvoiceController,
	getAllOrderHistoryController,
	getAllOrganizationsController,
	getGlobalAnalyticsController,
	getAllPlansController,
	suspendOrganizationController,
	activateOrganizationController,
	updatePlanController,
} from "./admin.controller";

const adminRouter = Router();

adminRouter.use(authenticateJWT, authorizeRoles(RoleName.SUPER_ADMIN));

adminRouter.get("/plans", getAllPlansController);
adminRouter.post("/plans", createPlanController);
adminRouter.put("/plans/:id", updatePlanController);
adminRouter.delete("/plans/:id", deletePlanController);
adminRouter.post("/plans/:planId/modules", assignModulesToPlanController);
adminRouter.get("/order-history", getAllOrderHistoryController);
adminRouter.get("/order-history/:paymentId/invoice", downloadAdminOrderInvoiceController);

// Organization Management
adminRouter.get("/organizations", getAllOrganizationsController);
adminRouter.post("/organizations/:organizationId/suspend", suspendOrganizationController);
adminRouter.post("/organizations/:organizationId/activate", activateOrganizationController);

// Platform Analytics
adminRouter.get("/analytics", getGlobalAnalyticsController);

export default adminRouter;
