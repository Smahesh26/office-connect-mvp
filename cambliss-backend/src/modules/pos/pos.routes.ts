import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { moduleGuard } from "../../middleware/module.middleware";
import { requireActiveSubscription } from "../../middleware/subscription.middleware";
import {
	closePOSSessionController,
	createPOSOrderController,
	createPOSTerminalController,
	generateZReportController,
	startPOSSessionController,
} from "./pos.controller";

const posRouter = Router();

posRouter.use(authenticateJWT, requireActiveSubscription, moduleGuard("INVENTORY"));

posRouter.post("/terminals", createPOSTerminalController);
posRouter.post("/sessions/start", startPOSSessionController);
posRouter.post("/orders", createPOSOrderController);
posRouter.post("/sessions/close", closePOSSessionController);
posRouter.get("/reports/z/:sessionId", generateZReportController);

export default posRouter;
