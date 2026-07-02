import { createHmac, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import Razorpay from "razorpay";
import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma";
import { RoleName } from "@prisma/client";

export class HttpError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "HttpError";
	}
}

export const TECH_STACK_ADDONS = [
	{ code: "AI_AUTOMATION", label: "AI Automation", amount: 1499 },
	{ code: "ADV_ANALYTICS", label: "Advanced Analytics", amount: 999 },
	{ code: "WHATSAPP_API", label: "WhatsApp API", amount: 699 },
	{ code: "DEDICATED_PM", label: "Dedicated PM", amount: 2499 },
	{ code: "PRIORITY_SUPPORT", label: "Priority Support", amount: 799 },
] as const;

export const TECH_STACK_CATEGORIES = [
	{
		id: "frontend",
		label: "Frontend",
		description: "UI Framework",
		options: [
			{ code: "react", label: "React", amount: 2000 },
			{ code: "nextjs", label: "Next.js", amount: 2500 },
			{ code: "vue3", label: "Vue 3", amount: 1800 },
			{ code: "nuxt3", label: "Nuxt 3", amount: 2200 },
			{ code: "angular", label: "Angular", amount: 2200 },
			{ code: "svelte", label: "Svelte", amount: 1600 },
			{ code: "sveltekit", label: "SvelteKit", amount: 1900 },
			{ code: "remix", label: "Remix", amount: 2400 },
		],
	},
	{
		id: "backend",
		label: "Backend",
		description: "Server Framework",
		options: [
			{ code: "nodejs", label: "Node.js", amount: 2000 },
			{ code: "nestjs", label: "NestJS", amount: 2400 },
			{ code: "fastapi", label: "FastAPI", amount: 2000 },
			{ code: "django", label: "Django", amount: 2200 },
			{ code: "gofiber", label: "Go/Fiber", amount: 2800 },
			{ code: "rails", label: "Rails", amount: 2200 },
			{ code: "spring", label: "Spring", amount: 3000 },
			{ code: "laravel", label: "Laravel", amount: 1800 },
		],
	},
	{
		id: "database",
		label: "Database",
		description: "Data Storage",
		options: [
			{ code: "postgresql", label: "PostgreSQL", amount: 800 },
			{ code: "mysql", label: "MySQL", amount: 600 },
			{ code: "mongodb", label: "MongoDB", amount: 700 },
			{ code: "supabase", label: "Supabase", amount: 900 },
			{ code: "firebase", label: "Firebase", amount: 700 },
			{ code: "planetscale", label: "PlanetScale", amount: 850 },
			{ code: "redis", label: "Redis", amount: 400 },
		],
	},
	{
		id: "hosting",
		label: "Hosting",
		description: "Infrastructure",
		options: [
			{ code: "aws", label: "AWS", amount: 1200 },
			{ code: "gcp", label: "GCP", amount: 1100 },
			{ code: "azure", label: "Azure", amount: 1200 },
			{ code: "vercel", label: "Vercel", amount: 600 },
			{ code: "digitalocean", label: "DigitalOcean", amount: 800 },
			{ code: "render", label: "Render", amount: 650 },
			{ code: "railway", label: "Railway", amount: 550 },
		],
	},
] as const;

const addonAmountByCode = TECH_STACK_ADDONS.reduce<Record<string, number>>((acc, addon) => {
	acc[addon.code] = addon.amount;
	return acc;
}, {});

const techStackOptionIndex = TECH_STACK_CATEGORIES.reduce<
	Record<string, Record<string, { label: string; amount: number }>>
>((acc, category) => {
	acc[category.id] = category.options.reduce<Record<string, { label: string; amount: number }>>(
		(optionAcc, option) => {
			optionAcc[option.code] = { label: option.label, amount: option.amount };
			return optionAcc;
		},
		{},
	);
	return acc;
}, {});

const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

const TRIAL_TOTAL_DAYS = 90;
const TRIAL_REMINDER_WINDOWS = [14, 7, 3, 1, 0] as const;
const TRIAL_REMINDER_INTERVAL_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_REMINDER_STATE_PATH = path.resolve(process.cwd(), "data", "trial-reminder-state.json");

type TrialReminderWindow = (typeof TRIAL_REMINDER_WINDOWS)[number];

type TrialReminderState = Record<string, string>;

export type TrialReminderSnapshot = {
	organizationId: string;
	trialStartsAt: string;
	trialEndsAt: string;
	status: "TRIALING" | "EXPIRED" | "ACTIVE" | "NO_SUBSCRIPTION";
	daysLeft: number;
	timeLeftMs: number;
	reminderMessage: string;
	notificationThresholds: number[];
	maxUsersDuringTrial: number;
};

let trialReminderTimer: NodeJS.Timeout | null = null;

const getIntervalDays = (interval: string): number => {
	const normalized = interval.trim().toLowerCase();

	if (normalized.includes("year")) {
		return 365;
	}

	if (normalized.includes("month")) {
		return 30;
	}

	return 30;
};

const getTrialWindow = (daysLeft: number): TrialReminderWindow | null => {
	for (const window of TRIAL_REMINDER_WINDOWS) {
		if (daysLeft <= window) {
			return window;
		}
	}

	return null;
};

const buildReminderMessage = (daysLeft: number) => {
	if (daysLeft <= 0) {
		return "Your 90-day trial has expired. Add billing details now to avoid service interruption.";
	}

	return `Reminder: your 90-day trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
};

const readTrialReminderState = async (): Promise<TrialReminderState> => {
	try {
		const content = await fs.readFile(TRIAL_REMINDER_STATE_PATH, "utf8");
		const parsed = JSON.parse(content) as TrialReminderState;
		return parsed;
	} catch {
		return {};
	}
};

const writeTrialReminderState = async (state: TrialReminderState): Promise<void> => {
	const dirPath = path.dirname(TRIAL_REMINDER_STATE_PATH);
	await fs.mkdir(dirPath, { recursive: true });
	await fs.writeFile(TRIAL_REMINDER_STATE_PATH, JSON.stringify(state, null, 2));
};

const sendResendReminderEmail = async (input: {
	recipients: string[];
	subject: string;
	body: string;
}): Promise<boolean> => {
	const apiKey = process.env.RESEND_API_KEY;
	const fromAddress = process.env.TRIAL_REMINDER_FROM_EMAIL;

	if (!apiKey || !fromAddress || input.recipients.length === 0) {
		return false;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: fromAddress,
			to: input.recipients,
			subject: input.subject,
			text: input.body,
		}),
	});

	return response.ok;
};

const postReminderWebhook = async (payload: {
	organizationId: string;
	organizationName: string;
	subscriptionId: string;
	daysLeft: number;
	reminderMessage: string;
	recipients: string[];
	trialEndsAt: string;
}): Promise<boolean> => {
	const webhookUrl = process.env.TRIAL_REMINDER_WEBHOOK_URL;
	if (!webhookUrl) {
		return false;
	}

	const response = await fetch(webhookUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	return response.ok;
};

const sanitizeRecipients = (emails: Array<string | null | undefined>) => {
	const unique = new Set<string>();
	for (const email of emails) {
		if (!email) {
			continue;
		}
		const normalized = email.trim().toLowerCase();
		if (!normalized) {
			continue;
		}
		unique.add(normalized);
	}

	return Array.from(unique);
};

const getRequiredEnv = (name: string): string => {
	const value = process.env[name];
	if (!value) {
		throw new HttpError(500, `${name} is not defined`);
	}

	return value;
};

const getRequiredEnvAny = (...names: string[]): string => {
	for (const name of names) {
		const value = process.env[name];
		if (value) {
			return value;
		}
	}

	throw new HttpError(500, `${names.join(" or ")} is not defined`);
};

type PaymentWithRelations = Prisma.PaymentGetPayload<{
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

const INVOICE_SNAPSHOT_DIR = path.resolve(process.cwd(), "data", "invoices");

const getStoredInvoiceFileName = (paymentId: string) => `cambliss-invoice-${paymentId}.pdf`;

const getStoredInvoicePath = (paymentId: string) =>
	path.join(INVOICE_SNAPSHOT_DIR, getStoredInvoiceFileName(paymentId));

const ensureInvoiceSnapshotDir = async () => {
	await fs.mkdir(INVOICE_SNAPSHOT_DIR, { recursive: true });
};

const getPaymentForInvoice = async (paymentId: string) => {
	return prisma.payment.findUnique({
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
};

const storeInvoiceSnapshot = async (paymentId: string) => {
	const payment = await getPaymentForInvoice(paymentId);
	if (!payment) {
		throw new HttpError(404, "Payment not found");
	}

	const invoice = await buildCamblissInvoicePDF(payment);
	await ensureInvoiceSnapshotDir();
	await fs.writeFile(getStoredInvoicePath(paymentId), invoice.buffer);

	return invoice.fileName;
};

const buildCamblissInvoicePDF = async (payment: NonNullable<PaymentWithRelations>) => {
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

export const createSubscription = async (organizationId: string, planId: string) => {
	const plan = await prisma.plan.findUnique({
		where: { id: planId },
		select: { id: true, isActive: true, interval: true },
	});

	if (!plan) {
		throw new HttpError(404, "Plan not found");
	}

	if (!plan.isActive) {
		throw new HttpError(403, "Plan is inactive");
	}

	const existingLiveSubscription = await prisma.subscription.findFirst({
		where: {
			organizationId,
			status: {
				in: ["ACTIVE", "TRIALING", "PAST_DUE"],
			},
		},
		include: {
			plan: {
				select: {
					name: true,
					interval: true,
				},
			},
		},
	});

	if (existingLiveSubscription?.planId === planId) {
		throw new HttpError(409, "Organization is already on this plan");
	}

	if (existingLiveSubscription) {
		await prisma.subscription.update({
			where: {
				id: existingLiveSubscription.id,
			},
			data: {
				status: "CANCELED",
				cancelAtPeriodEnd: true,
				currentPeriodEnd: new Date(),
			},
		});
	}

	const now = new Date();
	const currentPeriodEnd = addDays(now, TRIAL_TOTAL_DAYS);

	return prisma.subscription.create({
		data: {
			organizationId,
			planId,
			status: "TRIALING",
			currentPeriodStart: now,
			currentPeriodEnd,
			cancelAtPeriodEnd: false,
		},
	});
};

export const getOrganizationTrialReminderSnapshot = async (organizationId: string): Promise<TrialReminderSnapshot> => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: {
			id: true,
			createdAt: true,
			subscriptions: {
				orderBy: { createdAt: "desc" },
				take: 1,
				select: {
					status: true,
					currentPeriodStart: true,
					currentPeriodEnd: true,
				},
			},
		},
	});

	if (!organization) {
		throw new HttpError(404, "Organization not found");
	}

	const activeSubscription = organization.subscriptions[0];
	const trialStartsAt = activeSubscription?.currentPeriodStart ?? organization.createdAt;
	const trialEndsAt = activeSubscription?.currentPeriodEnd ?? addDays(trialStartsAt, TRIAL_TOTAL_DAYS);
	const timeLeftMs = trialEndsAt.getTime() - Date.now();
	const daysLeft = Math.max(0, Math.ceil(timeLeftMs / DAY_MS));

	const status: TrialReminderSnapshot["status"] =
		activeSubscription?.status === "ACTIVE"
			? "ACTIVE"
			: activeSubscription?.status === "TRIALING"
				? timeLeftMs <= 0
					? "EXPIRED"
					: "TRIALING"
				: activeSubscription
					? "EXPIRED"
					: "NO_SUBSCRIPTION";

	const reminderMessage =
		status === "ACTIVE"
			? "Your subscription is active. Trial reminders are paused."
			: status === "EXPIRED"
				? buildReminderMessage(0)
				: buildReminderMessage(daysLeft);

	return {
		organizationId,
		trialStartsAt: trialStartsAt.toISOString(),
		trialEndsAt: trialEndsAt.toISOString(),
		status,
		daysLeft,
		timeLeftMs: Math.max(0, timeLeftMs),
		reminderMessage,
		notificationThresholds: [...TRIAL_REMINDER_WINDOWS],
		maxUsersDuringTrial: 4,
	};
};

export const dispatchTrialReminderNotifications = async () => {
	const subscriptions = await prisma.subscription.findMany({
		where: {
			status: "TRIALING",
		},
		select: {
			id: true,
			currentPeriodEnd: true,
			organization: {
				select: {
					id: true,
					name: true,
					supportEmail: true,
					users: {
						select: {
							email: true,
						},
						take: 10,
					},
				},
			},
		},
	});

	const now = new Date();
	const state = await readTrialReminderState();
	let notificationsTriggered = 0;

	for (const subscription of subscriptions) {
		const timeLeftMs = subscription.currentPeriodEnd.getTime() - now.getTime();
		const daysLeft = Math.max(0, Math.ceil(timeLeftMs / DAY_MS));
		const reminderWindow = getTrialWindow(daysLeft);
		if (reminderWindow === null) {
			continue;
		}

		const reminderKey = `${subscription.id}:${reminderWindow}`;
		if (state[reminderKey]) {
			continue;
		}

		const recipients = sanitizeRecipients([
			subscription.organization.supportEmail,
			...subscription.organization.users.map((user) => user.email),
		]);

		const reminderMessage = buildReminderMessage(daysLeft);
		const subject =
			daysLeft <= 0
				? `${subscription.organization.name}: Trial expired`
				: `${subscription.organization.name}: Trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

		const emailSent = await sendResendReminderEmail({
			recipients,
			subject,
			body: `${reminderMessage}\n\nOrganization: ${subscription.organization.name}\nTrial end: ${subscription.currentPeriodEnd.toISOString()}`,
		});

		const webhookSent = await postReminderWebhook({
			organizationId: subscription.organization.id,
			organizationName: subscription.organization.name,
			subscriptionId: subscription.id,
			daysLeft,
			reminderMessage,
			recipients,
			trialEndsAt: subscription.currentPeriodEnd.toISOString(),
		});

		if (!emailSent && !webhookSent) {
			console.log(
				`[trial-reminder] ${subscription.organization.name}: ${reminderMessage} (no email/webhook configured)`
			);
		}

		state[reminderKey] = now.toISOString();
		notificationsTriggered += 1;
	}

	if (notificationsTriggered > 0) {
		await writeTrialReminderState(state);
	}

	return {
		checked: subscriptions.length,
		notificationsTriggered,
	};
};

export const startTrialReminderJob = () => {
	if (trialReminderTimer) {
		return;
	}

	const runDispatch = async () => {
		try {
			await dispatchTrialReminderNotifications();
		} catch (error) {
			console.error("[trial-reminder] dispatch failed:", error);
		}
	};

	void runDispatch();
	trialReminderTimer = setInterval(() => {
		void runDispatch();
	}, TRIAL_REMINDER_INTERVAL_MS);
};

export const getOrganizationSubscription = async (organizationId: string) => {
	const subscription = await prisma.subscription.findFirst({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		include: {
			plan: true,
		},
	});

	if (!subscription) {
		throw new HttpError(404, "Subscription not found");
	}

	return subscription;
};

export const createRazorpayOrder = async (
	subscriptionId: string,
	options?: {
		addOns?: string[];
		techStack?: string;
		stackSelections?: Record<string, string>;
	},
) => {
	const subscription = await prisma.subscription.findUnique({
		where: { id: subscriptionId },
		include: {
			plan: true,
		},
	});

	if (!subscription) {
		throw new HttpError(404, "Subscription not found");
	}

	if (!subscription.plan) {
		throw new HttpError(400, "Subscription plan not found");
	}

	const priceNumber = Number(subscription.plan.price);
	if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
		throw new HttpError(400, "Invalid plan price");
	}

	const selectedAddOns = Array.from(new Set(options?.addOns ?? []));
	const invalidAddOn = selectedAddOns.find((code) => !addonAmountByCode[code]);
	if (invalidAddOn) {
		throw new HttpError(400, `Invalid add-on selected: ${invalidAddOn}`);
	}

	const stackSelections = options?.stackSelections ?? {};
	const hasStackSelections = Object.keys(stackSelections).length > 0;
	if (hasStackSelections) {
		for (const category of TECH_STACK_CATEGORIES) {
			if (!stackSelections[category.id]) {
				throw new HttpError(400, `Missing tech stack selection for ${category.label}`);
			}
		}

		for (const [categoryId, optionCode] of Object.entries(stackSelections)) {
			if (!techStackOptionIndex[categoryId]?.[optionCode]) {
				throw new HttpError(400, `Invalid tech stack option for ${categoryId}`);
			}
		}
	}

	const addOnTotal = selectedAddOns.reduce((sum, code) => sum + addonAmountByCode[code], 0);
	const stackTotal = Object.entries(stackSelections).reduce((sum, [categoryId, optionCode]) => {
		return sum + (techStackOptionIndex[categoryId]?.[optionCode]?.amount ?? 0);
	}, 0);
	const finalAmount = priceNumber + addOnTotal + stackTotal;

	const amountInPaise = Math.round(finalAmount * 100);

	const razorpay = new Razorpay({
		key_id: getRequiredEnvAny("RAZORPAY_KEY_ID", "RAZORPAY_KEY"),
		key_secret: getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"),
	});

	try {
		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: subscription.plan.currency,
			receipt: `subscription_${subscription.id}`,
			payment_capture: true,
			notes: {
				techStack: options?.techStack ?? "GENERAL",
				addOns: selectedAddOns.join(","),
				stackSelections: JSON.stringify(stackSelections),
			},
		});

		return order;
	} catch (error) {
		throw new HttpError(500, "Failed to create Razorpay order");
	}
};

export const verifyPayment = async (
	razorpayOrderId: string,
	razorpayPaymentId: string,
	razorpaySignature: string,
) => {
	const razorpay = new Razorpay({
		key_id: getRequiredEnvAny("RAZORPAY_KEY_ID", "RAZORPAY_KEY"),
		key_secret: getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"),
	});

	const order = await razorpay.orders.fetch(razorpayOrderId);
	const receipt = order.receipt ?? "";

	if (!receipt.startsWith("subscription_")) {
		throw new HttpError(400, "Invalid order receipt");
	}

	const subscriptionId = receipt.replace("subscription_", "");

	const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
	const expectedSignature = createHmac("sha256", getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"))
		.update(payload)
		.digest("hex");

	const expectedBuffer = Buffer.from(expectedSignature);
	const actualBuffer = Buffer.from(razorpaySignature);

	if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
		throw new HttpError(400, "Invalid payment signature");
	}

	const subscription = await prisma.subscription.findUnique({
		where: { id: subscriptionId },
		include: { plan: true },
	});

	if (!subscription || !subscription.plan) {
		throw new HttpError(404, "Subscription not found");
	}

	const now = new Date();
	const currentPeriodEnd = addDays(now, getIntervalDays(subscription.plan.interval));

	// Fetch plan modules to auto-enable them
	const planModules = await prisma.planModule.findMany({
		where: { planId: subscription.planId },
		include: { module: true },
	});

	// Prepare organization module records for all plan modules
	const organizationModuleData = planModules.map((pm) => ({
		organizationId: subscription.organizationId,
		moduleId: pm.moduleId,
		isEnabled: true,
	}));

	const payment = await prisma.$transaction(async (tx) => {
		await tx.subscription.update({
			where: { id: subscriptionId },
			data: {
				status: "ACTIVE",
				currentPeriodStart: now,
				currentPeriodEnd,
			},
		});

		const createdPayment = await tx.payment.create({
			data: {
				subscriptionId,
				amount: new Prisma.Decimal(Number(order.amount) / 100),
				currency: subscription.plan.currency,
				paidAt: now,
				provider: "razorpay",
				externalPaymentId: razorpayPaymentId,
			},
		});

		for (const data of organizationModuleData) {
			await tx.organizationModule.upsert({
				where: {
					organizationId_moduleId: {
						organizationId: data.organizationId,
						moduleId: data.moduleId,
					},
				},
				update: { isEnabled: true },
				create: data,
			});
		}

		return createdPayment;
	});

	let invoiceFileName: string | null = null;
	try {
		invoiceFileName = await storeInvoiceSnapshot(payment.id);
	} catch {
		invoiceFileName = null;
	}

	return {
		message: "Payment verified and subscription activated",
		paymentId: payment.id,
		invoiceStored: Boolean(invoiceFileName),
		invoiceFileName,
	};
};

export const getOrganizationOrderHistory = async (organizationId: string) => {
	return prisma.payment.findMany({
		where: {
			subscription: {
				organizationId,
			},
		},
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

export const generateOrganizationOrderInvoice = async (organizationId: string, paymentId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			id: paymentId,
			subscription: {
				organizationId,
			},
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

	const storedPath = getStoredInvoicePath(paymentId);

	try {
		const storedBuffer = await fs.readFile(storedPath);
		return {
			fileName: getStoredInvoiceFileName(paymentId),
			buffer: storedBuffer,
		};
	} catch {
		const generatedInvoice = await buildCamblissInvoicePDF(payment);
		await ensureInvoiceSnapshotDir();
		await fs.writeFile(storedPath, generatedInvoice.buffer);
		return generatedInvoice;
	}
};
