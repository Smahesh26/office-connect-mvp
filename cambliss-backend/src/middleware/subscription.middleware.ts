import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { RoleName } from "@prisma/client";

const forbiddenResponse = (res: Response): void => {
	res.status(403).json({ message: "No active subscription. Please subscribe to continue." });
};

export const requireActiveSubscription = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.user?.role === RoleName.SUPER_ADMIN || req.user?.role === RoleName.ADMIN) {
			next();
			return;
		}

		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			forbiddenResponse(res);
			return;
		}

		const organization = await prisma.organization.findUnique({
			where: { id: organizationId },
			select: { id: true, isActive: true },
		});

		if (!organization?.isActive) {
			forbiddenResponse(res);
			return;
		}

		const activeSubscription = await prisma.subscription.findFirst({
			where: {
				organizationId,
				status: {
					in: ["ACTIVE", "TRIALING", "PAST_DUE"],
				},
			},
			select: { id: true },
		});

		if (!activeSubscription) {
			forbiddenResponse(res);
			return;
		}

		next();
	} catch {
		res.status(500).json({ message: "Internal server error" });
	}
};
