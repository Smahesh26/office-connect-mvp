import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";
import PDFDocument from "pdfkit";
import { RoleName } from "@prisma/client";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

export type CreatePlanInput = {
	name: string;
	description?: string;
	features?: string[];
	price: number | string;
	currency?: string;
	interval: string;
	userLimit: number;
	storageLimit: number;
};

export type UpdatePlanInput = Partial<CreatePlanInput>;

const normalizePrice = (price: number | string): Prisma.Decimal => {
	const parsed = typeof price === "number" ? price : Number(price);

	if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
		throw new HttpError(400, "Invalid plan price");
	}

	return new Prisma.Decimal(parsed);
};

const normalizeCurrency = (currency?: string): string => {
	const normalized = (currency ?? "USD").trim().toUpperCase();

	if (normalized.length !== 3) {
		throw new HttpError(400, "Currency must be a 3-letter ISO code");
	}

	return normalized;
};

const normalizeLimit = (value: number, label: string): number => {
	if (!Number.isInteger(value) || value <= 0) {
		throw new HttpError(400, `${label} must be a positive integer`);
	}

	return value;
};

const normalizeFeatures = (features?: string[]): string[] => {
	if (features === undefined) {
		return [];
	}

	if (!Array.isArray(features)) {
		throw new HttpError(400, "features must be an array of strings");
	}

	return features
		.map((feature) => feature.trim())
		.filter((feature) => feature.length > 0);
};

const ensurePlanIsActive = async (planId: string): Promise<void> => {
	const plan = await prisma.plan.findUnique({
		where: { id: planId },
		select: { id: true, isActive: true },
	});

	if (!plan) {
		throw new HttpError(404, "Plan not found");
	}

	if (!plan.isActive) {
		throw new HttpError(403, "Plan is inactive and cannot be modified");
	}
};

const ensureOrganizationExists = async (organizationId: string): Promise<void> => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new HttpError(404, "Organization not found");
	}
};

export const getAllOrganizations = async () => {
	return prisma.organization.findMany({
		include: {
			subscriptions: {
				include: {
					plan: true,
				},
			},
			_count: {
				select: {
					users: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};

export const getOrganizationById = async (organizationId: string) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		include: {
			users: {
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					createdAt: true,
				},
			},
			subscriptions: {
				include: {
					plan: true,
					payments: true,
				},
			},
		},
	});

	if (!organization) {
		throw new HttpError(404, "Organization not found");
	}

	return organization;
};

export const suspendOrganization = async (organizationId: string) => {
	await ensureOrganizationExists(organizationId);

	const affectedRows = await prisma.$executeRaw`
		UPDATE "Subscription"
		SET "status" = CAST('SUSPENDED' AS "SubscriptionStatus"),
				"updatedAt" = NOW()
		WHERE "organizationId" = ${organizationId}
	`;

	return {
		organizationId,
		suspendedSubscriptions: Number(affectedRows),
	};
};

export const activateOrganization = async (organizationId: string) => {
	await ensureOrganizationExists(organizationId);

	const updated = await prisma.subscription.updateMany({
		where: {
			organizationId,
		},
		data: {
			status: "ACTIVE",
		},
	});

	return {
		organizationId,
		activatedSubscriptions: updated.count,
	};
};

export const getAllSubscriptions = async () => {
	return prisma.subscription.findMany({
		include: {
			organization: true,
			plan: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};

export const createPlan = async (input: CreatePlanInput) => {
	const name = input.name?.trim();
	const interval = input.interval?.trim().toLowerCase();

	if (!name) {
		throw new HttpError(400, "Plan name is required");
	}

	if (!interval) {
		throw new HttpError(400, "Plan interval is required");
	}

	try {
		return await prisma.plan.create({
			data: {
				name,
				description: input.description?.trim() || null,
				features: normalizeFeatures(input.features),
				price: normalizePrice(input.price),
				currency: normalizeCurrency(input.currency),
				interval,
				userLimit: normalizeLimit(input.userLimit, "User limit"),
				storageLimit: normalizeLimit(input.storageLimit, "Storage limit"),
			},
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			throw new HttpError(409, "Plan with this name already exists");
		}

		throw error;
	}
};

export const updatePlan = async (planId: string, input: UpdatePlanInput) => {
	if (!Object.keys(input).length) {
		throw new HttpError(400, "At least one field is required for update");
	}

	await ensurePlanIsActive(planId);

	const data: Prisma.PlanUpdateInput = {};

	if (input.name !== undefined) {
		const trimmed = input.name.trim();
		if (!trimmed) {
			throw new HttpError(400, "Plan name cannot be empty");
		}
		data.name = trimmed;
	}

	if (input.description !== undefined) {
		data.description = input.description.trim() || null;
	}

	if (input.features !== undefined) {
		data.features = normalizeFeatures(input.features);
	}

	if (input.price !== undefined) {
		data.price = normalizePrice(input.price);
	}

	if (input.currency !== undefined) {
		data.currency = normalizeCurrency(input.currency);
	}

	if (input.interval !== undefined) {
		const interval = input.interval.trim().toLowerCase();
		if (!interval) {
			throw new HttpError(400, "Plan interval cannot be empty");
		}
		data.interval = interval;
	}

	if (input.userLimit !== undefined) {
		data.userLimit = normalizeLimit(input.userLimit, "User limit");
	}

	if (input.storageLimit !== undefined) {
		data.storageLimit = normalizeLimit(input.storageLimit, "Storage limit");
	}

	try {
		return await prisma.plan.update({
			where: { id: planId },
			data,
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
			throw new HttpError(404, "Plan not found");
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			throw new HttpError(409, "Plan with this name already exists");
		}

		throw error;
	}
};

export const deletePlan = async (planId: string) => {
	await ensurePlanIsActive(planId);

	const subscriptionsUsingPlan = await prisma.subscription.count({
		where: { planId },
	});

	if (subscriptionsUsingPlan > 0) {
		throw new HttpError(409, "Cannot delete plan with active subscriptions");
	}

	try {
		return await prisma.plan.delete({
			where: { id: planId },
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
			throw new HttpError(404, "Plan not found");
		}

		throw error;
	}
};

export const getAllPlans = async () => {
	return prisma.plan.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});
};

export const assignModulesToPlan = async (planId: string, moduleIds: string[]) => {
	// Validate plan exists
	const plan = await prisma.plan.findUnique({
		where: { id: planId },
	});

	if (!plan) {
		throw new HttpError(404, "Plan not found");
	}

	// Validate all modules exist
	if (!moduleIds || moduleIds.length === 0) {
		throw new HttpError(400, "At least one module ID is required");
	}

	const modules = await prisma.module.findMany({
		where: {
			id: { in: moduleIds },
		},
	});

	if (modules.length !== moduleIds.length) {
		throw new HttpError(404, "One or more modules not found");
	}

	// Delete existing PlanModule records for this plan
	await prisma.planModule.deleteMany({
		where: { planId },
	});

	// Insert new PlanModule records
	const planModules = await prisma.planModule.createMany({
		data: moduleIds.map((moduleId) => ({
			planId,
			moduleId,
		})),
	});

	// Return updated plan with modules included
	return prisma.plan.findUnique({
		where: { id: planId },
		include: {
			planModules: {
				include: {
					module: true,
				},
			},
		},
	});
};

type AdminPaymentWithRelations = Prisma.PaymentGetPayload<{
	include: {
		subscription: {
			include: {
				plan: true;
				organization: {
					include: {
						users: {
							select: {
								firstName: true;
								lastName: true;
								email: true;
							};
							take: 1;
						};
					};
				};
			};
		};
	};
}>;

const buildCamblissInvoicePDF = async (payment: NonNullable<AdminPaymentWithRelations>) => {
	const subscription = payment.subscription;
	const plan = subscription.plan;
	const organization = subscription.organization;
	const contactUser = organization.users[0];

	const document = new PDFDocument({ size: "A4", margin: 50 });
	const chunks: Buffer[] = [];

	return new Promise<{ fileName: string; buffer: Buffer }>((resolve, reject) => {
		document.on("data", (chunk: Buffer) => chunks.push(chunk));
		document.on("end", () => {
			resolve({
				fileName: `cambliss-invoice-${payment.id}.pdf`,
				buffer: Buffer.concat(chunks),
			});
		});
		document.on("error", reject);

		document.fontSize(22).text("Cambliss Invoice", { align: "left" });
		document.moveDown(0.8);

		document.fontSize(11).text(`Invoice ID: ${payment.id}`);
		document.text(`Payment ID: ${payment.externalPaymentId ?? "N/A"}`);
		document.text(`Issued At: ${new Date(payment.paidAt).toLocaleString()}`);
		document.moveDown();

		document.fontSize(13).text("Client Details");
		document.fontSize(11).text(`Organization: ${organization.name}`);
		document.text(`Client Name: ${[contactUser?.firstName, contactUser?.lastName].filter(Boolean).join(" ") || "N/A"}`);
		document.text(`Client Email: ${contactUser?.email || organization.supportEmail || "N/A"}`);
		document.moveDown();

		document.fontSize(13).text("Subscription Details");
		document.fontSize(11).text(`Plan: ${plan.name}`);
		document.text(`Plan Interval: ${plan.interval}`);
		document.text(`Status: ${subscription.status}`);
		document.moveDown();

		document.fontSize(13).text("Amount");
		document.fontSize(11).text(`Total Paid: ${payment.currency} ${payment.amount}`);
		document.text(`Provider: ${payment.provider ?? "razorpay"}`);

		document.moveDown(2);
		document.fontSize(10).fillColor("#666").text("Generated by Cambliss Billing", { align: "left" });
		document.end();
	});
};

export const getAllOrderHistory = async () => {
	return prisma.payment.findMany({
		include: {
			subscription: {
				include: {
					plan: true,
					organization: {
						include: {
							memberships: {
								where: {
									role: {
										name: RoleName.CLIENT,
									},
								},
								select: {
									user: {
										select: {
											id: true,
											firstName: true,
											lastName: true,
											email: true,
										},
									},
								},
							},
							users: {
								select: {
									id: true,
									firstName: true,
									lastName: true,
									email: true,
								},
								take: 1,
							},
						},
					},
				},
			},
		},
		orderBy: {
			paidAt: "desc",
		},
	});
};

export const generateAdminOrderInvoice = async (paymentId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			id: paymentId,
		},
		include: {
			subscription: {
				include: {
					plan: true,
					organization: {
						include: {
							users: {
								select: {
									id: true,
									firstName: true,
									lastName: true,
									email: true,
								},
								take: 1,
							},
						},
					},
				},
			},
		},
	});

	if (!payment) {
		throw new HttpError(404, "Payment not found");
	}

	return buildCamblissInvoicePDF(payment);
};
