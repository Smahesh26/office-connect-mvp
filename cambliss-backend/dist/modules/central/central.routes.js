"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const central_controller_1 = require("./central.controller");
const router = (0, express_1.Router)();
// Spaces endpoints
router.get("/spaces", auth_middleware_1.authenticateJWT, central_controller_1.getSpacesController);
router.post("/spaces", auth_middleware_1.authenticateJWT, central_controller_1.createSpaceController);
router.get("/spaces/:slug", auth_middleware_1.authenticateJWT, central_controller_1.getSpaceDetailsController);
router.post("/spaces/:spaceId/posts", auth_middleware_1.authenticateJWT, central_controller_1.createSpacePostController);
// Knowledge & SOP endpoints
router.get("/knowledge", auth_middleware_1.authenticateJWT, central_controller_1.getKnowledgeArticlesController);
router.post("/knowledge", auth_middleware_1.authenticateJWT, central_controller_1.createKnowledgeArticleController);
router.get("/knowledge/:slug", auth_middleware_1.authenticateJWT, central_controller_1.getKnowledgeArticleDetailsController);
exports.default = router;
