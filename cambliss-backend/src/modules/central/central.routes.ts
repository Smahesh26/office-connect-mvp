import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import {
	getSpacesController,
	createSpaceController,
	getSpaceDetailsController,
	createSpacePostController,
	getKnowledgeArticlesController,
	createKnowledgeArticleController,
	getKnowledgeArticleDetailsController,
} from "./central.controller";

const router = Router();

// Spaces endpoints
router.get("/spaces", authenticateJWT, getSpacesController);
router.post("/spaces", authenticateJWT, createSpaceController);
router.get("/spaces/:slug", authenticateJWT, getSpaceDetailsController);
router.post("/spaces/:spaceId/posts", authenticateJWT, createSpacePostController);

// Knowledge & SOP endpoints
router.get("/knowledge", authenticateJWT, getKnowledgeArticlesController);
router.post("/knowledge", authenticateJWT, createKnowledgeArticleController);
router.get("/knowledge/:slug", authenticateJWT, getKnowledgeArticleDetailsController);

export default router;
