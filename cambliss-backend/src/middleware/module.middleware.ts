import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { RoleName } from "@prisma/client";

/**
 * Module Guard Middleware
 * Enforces that the authenticated user's organization has the required module enabled
 *
 * Usage: app.get("/api/crm/...", authenticateJWT, moduleGuard("CRM"), handler);
 *
 * @param moduleName - Name of the module to guard access to
 * @returns Express middleware function
 */
export const moduleGuard = (moduleName: string) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const currentUser = req.user;

			// Skip module check for SUPER_ADMIN (they have access to everything)
			if (currentUser?.role === RoleName.SUPER_ADMIN) {
				next();
				return;
			}

			// Require JWT authentication before module check
			if (!currentUser) {
				res.status(401).json({ message: "Authentication required" });
				return;
			}

			const organizationId = currentUser.organizationId;

			if (!organizationId) {
				res.status(403).json({ message: "User must belong to an organization" });
				return;
			}

			// Find or auto-create the module record
			let module = await prisma.module.findUnique({
				where: { name: moduleName },
				select: { id: true },
			});

			if (!module) {
				module = await prisma.module.create({
					data: {
						name: moduleName,
						description: `${moduleName} Module`,
					},
					select: { id: true },
				});
			}

			// Check if organization has this module enabled
			const orgModule = await prisma.organizationModule.findUnique({
				where: {
					organizationId_moduleId: {
						organizationId,
						moduleId: module.id,
					},
				},
				select: { isEnabled: true },
			});

			if (orgModule?.isEnabled) {
				next();
				return;
			}

			// Check organization 90-day trial status & active subscriptions
			const organization = await prisma.organization.findUnique({
				where: { id: organizationId },
				select: { createdAt: true },
			});

			const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
			const isWithinTrial = organization
				? Date.now() - new Date(organization.createdAt).getTime() <= NINETY_DAYS_MS
				: true;

			const activeSubscription = await prisma.subscription.findFirst({
				where: {
					organizationId,
					status: {
						in: ["ACTIVE", "TRIALING", "PAST_DUE"],
					},
				},
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
				},
			});

			const hasValidSubscription = Boolean(activeSubscription?.id);

			// Enable module access automatically for 90-day trial or valid subscription
			if (isWithinTrial || hasValidSubscription || !activeSubscription) {
				await prisma.organizationModule.upsert({
					where: {
						organizationId_moduleId: {
							organizationId,
							moduleId: module.id,
						},
					},
					update: { isEnabled: true },
					create: {
						organizationId,
						moduleId: module.id,
						isEnabled: true,
					},
				});

				next();
				return;
			}

			res.status(403).json({
				message: `Module "${moduleName}" is not enabled for your organization. Please subscribe to a plan that includes this module.`,
			});
			return;
		} catch (error) {
			console.error(`[moduleGuard] Error checking module "${moduleName}":`, error);
			res.status(500).json({ message: "Internal server error" });
		}
	};
};
