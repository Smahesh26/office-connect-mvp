import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import { createRateLimitMiddleware } from "../../middleware/rate-limit.middleware";
import {
	clearMyOrganizationController,
	getMyOrganizationOnboardingController,
	loginController,
	logoutController,
	meController,
	getSsoTokenController,
	registerController,
	sendRegisterOtpController,
	verifyFirebasePhoneController,
	updateMyOrganizationController,
	updateMyOrganizationOnboardingController,
	verifyRegisterOtpController,
} from "./auth.controller";

const authRouter = Router();
const authRateLimit = createRateLimitMiddleware({ keyPrefix: "auth" });

authRouter.post("/register", authRateLimit, registerController);
authRouter.post("/register/otp/send", authRateLimit, sendRegisterOtpController);
authRouter.post("/register/otp/verify", authRateLimit, verifyRegisterOtpController);
authRouter.post("/register/firebase/verify", authRateLimit, verifyFirebasePhoneController);
authRouter.post("/login", authRateLimit, loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", authenticateJWT, meController);
authRouter.get("/sso-token", authenticateJWT, getSsoTokenController);
authRouter.put("/me/organization", authenticateJWT, updateMyOrganizationController);
authRouter.delete("/me/organization", authenticateJWT, clearMyOrganizationController);
authRouter.get("/me/onboarding", authenticateJWT, getMyOrganizationOnboardingController);
authRouter.put("/me/onboarding", authenticateJWT, updateMyOrganizationOnboardingController);

export default authRouter;

