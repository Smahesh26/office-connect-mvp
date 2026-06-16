import { Router } from "express";
import { RoleName } from "../../generated/prisma/enums";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";
import {
	assignModulesToPlanController,
	createPlanController,
	deletePlanController,
	downloadAdminOrderInvoiceController,
	getAllOrderHistoryController,
	getAllPlansController,
	updatePlanController,
} from "./admin.controller";

const adminRouter = Router();

adminRouter.use(authenticateJWT, authorizeRoles(RoleName.SUPER_ADMIN, RoleName.ADMIN));

adminRouter.get("/plans", getAllPlansController);
adminRouter.post("/plans", createPlanController);
adminRouter.put("/plans/:id", updatePlanController);
adminRouter.delete("/plans/:id", deletePlanController);
adminRouter.post("/plans/:planId/modules", assignModulesToPlanController);
adminRouter.get("/order-history", getAllOrderHistoryController);
adminRouter.get("/order-history/:paymentId/invoice", downloadAdminOrderInvoiceController);

export default adminRouter;
