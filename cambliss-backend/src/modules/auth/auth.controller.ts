import { Request, Response } from "express";
import {
	AuthError,
	clearOrganizationProfile,
	getMe,
	getOrganizationOnboarding,
	login,
	register,
	updateOrganizationOnboarding,
	updateOrganizationProfile,
} from "./auth.service";
import { MobileOtpError, sendRegisterOtp, verifyRegisterOtp } from "./mobile-otp.service";
import { verifyFirebasePhoneToken } from "./firebase-auth.service";

const handleAuthError = (res: Response, error: unknown): void => {
	if (error instanceof AuthError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof MobileOtpError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
	try {
		const result = await register(req.body);
		res.status(201).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const sendRegisterOtpController = async (req: Request, res: Response): Promise<void> => {
	try {
		const phone = (req.body?.phone as string | undefined) || "";
		const result = await sendRegisterOtp(phone);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const verifyRegisterOtpController = async (req: Request, res: Response): Promise<void> => {
	try {
		const phone = (req.body?.phone as string | undefined) || "";
		const requestId = (req.body?.requestId as string | undefined) || "";
		const otp = (req.body?.otp as string | undefined) || "";

		const result = verifyRegisterOtp({ phone, requestId, otp });
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const verifyFirebasePhoneController = async (req: Request, res: Response): Promise<void> => {
	try {
		const idToken = (req.body?.idToken as string | undefined) || "";
		const result = await verifyFirebasePhoneToken(idToken);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
	try {
		const result = await login(req.body);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const meController = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const result = await getMe(userId);
		res.status(200).json(result);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const updateMyOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organization = await updateOrganizationProfile(organizationId, req.body || {});
		res.status(200).json(organization);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const clearMyOrganizationController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const organization = await clearOrganizationProfile(organizationId);
		res.status(200).json(organization);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const getMyOrganizationOnboardingController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const onboarding = await getOrganizationOnboarding(organizationId);
		res.status(200).json(onboarding);
	} catch (error) {
		handleAuthError(res, error);
	}
};

export const updateMyOrganizationOnboardingController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ message: "Unauthorized" });
			return;
		}

		const onboarding = await updateOrganizationOnboarding(organizationId, req.body || {});
		res.status(200).json(onboarding);
	} catch (error) {
		handleAuthError(res, error);
	}
};

