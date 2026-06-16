import { Router } from "express";
import { RoleName } from "../../generated/prisma/enums";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware";
import {
	createSubscriptionController,
	createOrderController,
	downloadOrderInvoiceController,
	getTechStackAddonsController,
	getOrderHistoryController,
	getMySubscriptionController,
	verifyPaymentController,
} from "./subscription.controller";

const subscriptionRouter = Router();

subscriptionRouter.use(authenticateJWT);

subscriptionRouter.post("/subscribe", authorizeRoles(RoleName.ADMIN, RoleName.CLIENT), createSubscriptionController);
subscriptionRouter.get("/tech-stack-addons", getTechStackAddonsController);
subscriptionRouter.get("/my-subscription", getMySubscriptionController);
subscriptionRouter.get("/order-history", getOrderHistoryController);
subscriptionRouter.get("/order-history/:paymentId/invoice", downloadOrderInvoiceController);
subscriptionRouter.post("/create-order", createOrderController);
subscriptionRouter.post("/verify-payment", verifyPaymentController);

export default subscriptionRouter;
