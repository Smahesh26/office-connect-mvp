import { Router } from "express";
import { upload } from "../../config/multer";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { requireActiveSubscription as subscriptionGuard } from "../../middleware/subscription.middleware";
import {
	deleteFileController,
	getFilesController,
	uploadFileController,
} from "./files.controller";

const filesRouter = Router();

filesRouter.post(
	"/files/upload",
	authenticateJWT,
	subscriptionGuard,
	upload.single("file"),
	uploadFileController,
);
filesRouter.get("/files", authenticateJWT, subscriptionGuard, getFilesController);
filesRouter.delete("/files/:id", authenticateJWT, subscriptionGuard, deleteFileController);

export default filesRouter;
