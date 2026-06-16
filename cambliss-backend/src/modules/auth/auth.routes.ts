import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { clearMyOrganizationController, loginController, meController, registerController, updateMyOrganizationController } from "./auth.controller";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.get("/me", authenticateJWT, meController);
authRouter.put("/me/organization", authenticateJWT, updateMyOrganizationController);
authRouter.delete("/me/organization", authenticateJWT, clearMyOrganizationController);

export default authRouter;

