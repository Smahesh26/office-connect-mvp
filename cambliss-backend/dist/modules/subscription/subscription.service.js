"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrganizationOrderInvoice = exports.getOrganizationOrderHistory = exports.verifyPayment = exports.createRazorpayOrder = exports.getOrganizationSubscription = exports.startTrialReminderJob = exports.dispatchTrialReminderNotifications = exports.getOrganizationTrialReminderSnapshot = exports.createSubscription = exports.TECH_STACK_CATEGORIES = exports.TECH_STACK_ADDONS = exports.HttpError = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const razorpay_1 = __importDefault(require("razorpay"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_2 = require("@prisma/client");
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
exports.TECH_STACK_ADDONS = [
    { code: "AI_AUTOMATION", label: "AI Automation", amount: 1499 },
    { code: "ADV_ANALYTICS", label: "Advanced Analytics", amount: 999 },
    { code: "WHATSAPP_API", label: "WhatsApp API", amount: 699 },
    { code: "DEDICATED_PM", label: "Dedicated PM", amount: 2499 },
    { code: "PRIORITY_SUPPORT", label: "Priority Support", amount: 799 },
];
exports.TECH_STACK_CATEGORIES = [
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
];
const addonAmountByCode = exports.TECH_STACK_ADDONS.reduce((acc, addon) => {
    acc[addon.code] = addon.amount;
    return acc;
}, {});
const techStackOptionIndex = exports.TECH_STACK_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = category.options.reduce((optionAcc, option) => {
        optionAcc[option.code] = { label: option.label, amount: option.amount };
        return optionAcc;
    }, {});
    return acc;
}, {});
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
const TRIAL_TOTAL_DAYS = 90;
const TRIAL_REMINDER_WINDOWS = [14, 7, 3, 1, 0];
const TRIAL_REMINDER_INTERVAL_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_REMINDER_STATE_PATH = path_1.default.resolve(process.cwd(), "data", "trial-reminder-state.json");
let trialReminderTimer = null;
const getIntervalDays = (interval) => {
    const normalized = interval.trim().toLowerCase();
    if (normalized.includes("year")) {
        return 365;
    }
    if (normalized.includes("month")) {
        return 30;
    }
    return 30;
};
const getTrialWindow = (daysLeft) => {
    for (const window of TRIAL_REMINDER_WINDOWS) {
        if (daysLeft <= window) {
            return window;
        }
    }
    return null;
};
const buildReminderMessage = (daysLeft) => {
    if (daysLeft <= 0) {
        return "Your 90-day trial has expired. Add billing details now to avoid service interruption.";
    }
    return `Reminder: your 90-day trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
};
const readTrialReminderState = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield fs_1.promises.readFile(TRIAL_REMINDER_STATE_PATH, "utf8");
        const parsed = JSON.parse(content);
        return parsed;
    }
    catch (_a) {
        return {};
    }
});
const writeTrialReminderState = (state) => __awaiter(void 0, void 0, void 0, function* () {
    const dirPath = path_1.default.dirname(TRIAL_REMINDER_STATE_PATH);
    yield fs_1.promises.mkdir(dirPath, { recursive: true });
    yield fs_1.promises.writeFile(TRIAL_REMINDER_STATE_PATH, JSON.stringify(state, null, 2));
});
const sendResendReminderEmail = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.TRIAL_REMINDER_FROM_EMAIL;
    if (!apiKey || !fromAddress || input.recipients.length === 0) {
        return false;
    }
    const response = yield fetch("https://api.resend.com/emails", {
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
});
const postReminderWebhook = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const webhookUrl = process.env.TRIAL_REMINDER_WEBHOOK_URL;
    if (!webhookUrl) {
        return false;
    }
    const response = yield fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return response.ok;
});
const sanitizeRecipients = (emails) => {
    const unique = new Set();
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
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new HttpError(500, `${name} is not defined`);
    }
    return value;
};
const getRequiredEnvAny = (...names) => {
    for (const name of names) {
        const value = process.env[name];
        if (value) {
            return value;
        }
    }
    throw new HttpError(500, `${names.join(" or ")} is not defined`);
};
const INVOICE_SNAPSHOT_DIR = path_1.default.resolve(process.cwd(), "data", "invoices");
const getStoredInvoiceFileName = (paymentId) => `cambliss-invoice-${paymentId}.pdf`;
const getStoredInvoicePath = (paymentId) => path_1.default.join(INVOICE_SNAPSHOT_DIR, getStoredInvoiceFileName(paymentId));
const ensureInvoiceSnapshotDir = () => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_1.promises.mkdir(INVOICE_SNAPSHOT_DIR, { recursive: true });
});
const getPaymentForInvoice = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payment.findUnique({
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
});
const storeInvoiceSnapshot = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield getPaymentForInvoice(paymentId);
    if (!payment) {
        throw new HttpError(404, "Payment not found");
    }
    const invoice = yield buildCamblissInvoicePDF(payment);
    yield ensureInvoiceSnapshotDir();
    yield fs_1.promises.writeFile(getStoredInvoicePath(paymentId), invoice.buffer);
    return invoice.fileName;
});
const buildCamblissInvoicePDF = (payment) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = payment.subscription;
    const plan = subscription.plan;
    const organization = subscription.organization;
    const contactUser = organization.users[0];
    const document = new pdfkit_1.default({ size: "A4", margin: 50 });
    const chunks = [];
    return new Promise((resolve, reject) => {
        var _a, _b;
        document.on("data", (chunk) => chunks.push(chunk));
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
        document.text(`Payment ID: ${(_a = payment.externalPaymentId) !== null && _a !== void 0 ? _a : "N/A"}`);
        document.text(`Issued At: ${new Date(payment.paidAt).toLocaleString()}`);
        document.moveDown();
        document.fontSize(13).text("Client Details");
        document.fontSize(11).text(`Organization: ${organization.name}`);
        document.text(`Client Name: ${[contactUser === null || contactUser === void 0 ? void 0 : contactUser.firstName, contactUser === null || contactUser === void 0 ? void 0 : contactUser.lastName].filter(Boolean).join(" ") || "N/A"}`);
        document.text(`Client Email: ${(contactUser === null || contactUser === void 0 ? void 0 : contactUser.email) || organization.supportEmail || "N/A"}`);
        document.moveDown();
        document.fontSize(13).text("Subscription Details");
        document.fontSize(11).text(`Plan: ${plan.name}`);
        document.text(`Plan Interval: ${plan.interval}`);
        document.text(`Status: ${subscription.status}`);
        document.moveDown();
        document.fontSize(13).text("Amount");
        document.fontSize(11).text(`Total Paid: ${payment.currency} ${payment.amount}`);
        document.text(`Provider: ${(_b = payment.provider) !== null && _b !== void 0 ? _b : "razorpay"}`);
        document.moveDown(2);
        document.fontSize(10).fillColor("#666").text("Generated by Cambliss Billing", { align: "left" });
        document.end();
    });
});
const createSubscription = (organizationId, planId) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield prisma_1.default.plan.findUnique({
        where: { id: planId },
        select: { id: true, isActive: true, interval: true },
    });
    if (!plan) {
        throw new HttpError(404, "Plan not found");
    }
    if (!plan.isActive) {
        throw new HttpError(403, "Plan is inactive");
    }
    const existingLiveSubscription = yield prisma_1.default.subscription.findFirst({
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
    if ((existingLiveSubscription === null || existingLiveSubscription === void 0 ? void 0 : existingLiveSubscription.planId) === planId) {
        throw new HttpError(409, "Organization is already on this plan");
    }
    if (existingLiveSubscription) {
        yield prisma_1.default.subscription.update({
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
    return prisma_1.default.subscription.create({
        data: {
            organizationId,
            planId,
            status: "TRIALING",
            currentPeriodStart: now,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
        },
    });
});
exports.createSubscription = createSubscription;
const getOrganizationTrialReminderSnapshot = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const organization = yield prisma_1.default.organization.findUnique({
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
    const trialStartsAt = (_a = activeSubscription === null || activeSubscription === void 0 ? void 0 : activeSubscription.currentPeriodStart) !== null && _a !== void 0 ? _a : organization.createdAt;
    const trialEndsAt = (_b = activeSubscription === null || activeSubscription === void 0 ? void 0 : activeSubscription.currentPeriodEnd) !== null && _b !== void 0 ? _b : addDays(trialStartsAt, TRIAL_TOTAL_DAYS);
    const timeLeftMs = trialEndsAt.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(timeLeftMs / DAY_MS));
    const status = (activeSubscription === null || activeSubscription === void 0 ? void 0 : activeSubscription.status) === "ACTIVE"
        ? "ACTIVE"
        : (activeSubscription === null || activeSubscription === void 0 ? void 0 : activeSubscription.status) === "TRIALING"
            ? timeLeftMs <= 0
                ? "EXPIRED"
                : "TRIALING"
            : activeSubscription
                ? "EXPIRED"
                : "NO_SUBSCRIPTION";
    const reminderMessage = status === "ACTIVE"
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
});
exports.getOrganizationTrialReminderSnapshot = getOrganizationTrialReminderSnapshot;
const dispatchTrialReminderNotifications = () => __awaiter(void 0, void 0, void 0, function* () {
    const subscriptions = yield prisma_1.default.subscription.findMany({
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
    const state = yield readTrialReminderState();
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
        const subject = daysLeft <= 0
            ? `${subscription.organization.name}: Trial expired`
            : `${subscription.organization.name}: Trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        const emailSent = yield sendResendReminderEmail({
            recipients,
            subject,
            body: `${reminderMessage}\n\nOrganization: ${subscription.organization.name}\nTrial end: ${subscription.currentPeriodEnd.toISOString()}`,
        });
        const webhookSent = yield postReminderWebhook({
            organizationId: subscription.organization.id,
            organizationName: subscription.organization.name,
            subscriptionId: subscription.id,
            daysLeft,
            reminderMessage,
            recipients,
            trialEndsAt: subscription.currentPeriodEnd.toISOString(),
        });
        if (!emailSent && !webhookSent) {
            console.log(`[trial-reminder] ${subscription.organization.name}: ${reminderMessage} (no email/webhook configured)`);
        }
        state[reminderKey] = now.toISOString();
        notificationsTriggered += 1;
    }
    if (notificationsTriggered > 0) {
        yield writeTrialReminderState(state);
    }
    return {
        checked: subscriptions.length,
        notificationsTriggered,
    };
});
exports.dispatchTrialReminderNotifications = dispatchTrialReminderNotifications;
const startTrialReminderJob = () => {
    if (trialReminderTimer) {
        return;
    }
    void (0, exports.dispatchTrialReminderNotifications)();
    trialReminderTimer = setInterval(() => {
        void (0, exports.dispatchTrialReminderNotifications)();
    }, TRIAL_REMINDER_INTERVAL_MS);
};
exports.startTrialReminderJob = startTrialReminderJob;
const getOrganizationSubscription = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield prisma_1.default.subscription.findFirst({
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
});
exports.getOrganizationSubscription = getOrganizationSubscription;
const createRazorpayOrder = (subscriptionId, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const subscription = yield prisma_1.default.subscription.findUnique({
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
    const selectedAddOns = Array.from(new Set((_a = options === null || options === void 0 ? void 0 : options.addOns) !== null && _a !== void 0 ? _a : []));
    const invalidAddOn = selectedAddOns.find((code) => !addonAmountByCode[code]);
    if (invalidAddOn) {
        throw new HttpError(400, `Invalid add-on selected: ${invalidAddOn}`);
    }
    const stackSelections = (_b = options === null || options === void 0 ? void 0 : options.stackSelections) !== null && _b !== void 0 ? _b : {};
    const hasStackSelections = Object.keys(stackSelections).length > 0;
    if (hasStackSelections) {
        for (const category of exports.TECH_STACK_CATEGORIES) {
            if (!stackSelections[category.id]) {
                throw new HttpError(400, `Missing tech stack selection for ${category.label}`);
            }
        }
        for (const [categoryId, optionCode] of Object.entries(stackSelections)) {
            if (!((_c = techStackOptionIndex[categoryId]) === null || _c === void 0 ? void 0 : _c[optionCode])) {
                throw new HttpError(400, `Invalid tech stack option for ${categoryId}`);
            }
        }
    }
    const addOnTotal = selectedAddOns.reduce((sum, code) => sum + addonAmountByCode[code], 0);
    const stackTotal = Object.entries(stackSelections).reduce((sum, [categoryId, optionCode]) => {
        var _a, _b, _c;
        return sum + ((_c = (_b = (_a = techStackOptionIndex[categoryId]) === null || _a === void 0 ? void 0 : _a[optionCode]) === null || _b === void 0 ? void 0 : _b.amount) !== null && _c !== void 0 ? _c : 0);
    }, 0);
    const finalAmount = priceNumber + addOnTotal + stackTotal;
    const amountInPaise = Math.round(finalAmount * 100);
    const razorpay = new razorpay_1.default({
        key_id: getRequiredEnvAny("RAZORPAY_KEY_ID", "RAZORPAY_KEY"),
        key_secret: getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"),
    });
    try {
        const order = yield razorpay.orders.create({
            amount: amountInPaise,
            currency: subscription.plan.currency,
            receipt: `subscription_${subscription.id}`,
            payment_capture: true,
            notes: {
                techStack: (_d = options === null || options === void 0 ? void 0 : options.techStack) !== null && _d !== void 0 ? _d : "GENERAL",
                addOns: selectedAddOns.join(","),
                stackSelections: JSON.stringify(stackSelections),
            },
        });
        return order;
    }
    catch (error) {
        throw new HttpError(500, "Failed to create Razorpay order");
    }
});
exports.createRazorpayOrder = createRazorpayOrder;
const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const razorpay = new razorpay_1.default({
        key_id: getRequiredEnvAny("RAZORPAY_KEY_ID", "RAZORPAY_KEY"),
        key_secret: getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"),
    });
    const order = yield razorpay.orders.fetch(razorpayOrderId);
    const receipt = (_a = order.receipt) !== null && _a !== void 0 ? _a : "";
    if (!receipt.startsWith("subscription_")) {
        throw new HttpError(400, "Invalid order receipt");
    }
    const subscriptionId = receipt.replace("subscription_", "");
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = (0, crypto_1.createHmac)("sha256", getRequiredEnvAny("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET"))
        .update(payload)
        .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(razorpaySignature);
    if (expectedBuffer.length !== actualBuffer.length || !(0, crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer)) {
        throw new HttpError(400, "Invalid payment signature");
    }
    const subscription = yield prisma_1.default.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true },
    });
    if (!subscription || !subscription.plan) {
        throw new HttpError(404, "Subscription not found");
    }
    const now = new Date();
    const currentPeriodEnd = addDays(now, getIntervalDays(subscription.plan.interval));
    // Fetch plan modules to auto-enable them
    const planModules = yield prisma_1.default.planModule.findMany({
        where: { planId: subscription.planId },
        include: { module: true },
    });
    // Prepare organization module records for all plan modules
    const organizationModuleData = planModules.map((pm) => ({
        organizationId: subscription.organizationId,
        moduleId: pm.moduleId,
        isEnabled: true,
    }));
    const payment = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd,
            },
        });
        const createdPayment = yield tx.payment.create({
            data: {
                subscriptionId,
                amount: new client_1.Prisma.Decimal(Number(order.amount) / 100),
                currency: subscription.plan.currency,
                paidAt: now,
                provider: "razorpay",
                externalPaymentId: razorpayPaymentId,
            },
        });
        for (const data of organizationModuleData) {
            yield tx.organizationModule.upsert({
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
    }));
    let invoiceFileName = null;
    try {
        invoiceFileName = yield storeInvoiceSnapshot(payment.id);
    }
    catch (_b) {
        invoiceFileName = null;
    }
    return {
        message: "Payment verified and subscription activated",
        paymentId: payment.id,
        invoiceStored: Boolean(invoiceFileName),
        invoiceFileName,
    };
});
exports.verifyPayment = verifyPayment;
const getOrganizationOrderHistory = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payment.findMany({
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
                                        name: client_2.RoleName.CLIENT,
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
});
exports.getOrganizationOrderHistory = getOrganizationOrderHistory;
const generateOrganizationOrderInvoice = (organizationId, paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield prisma_1.default.payment.findFirst({
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
        const storedBuffer = yield fs_1.promises.readFile(storedPath);
        return {
            fileName: getStoredInvoiceFileName(paymentId),
            buffer: storedBuffer,
        };
    }
    catch (_a) {
        const generatedInvoice = yield buildCamblissInvoicePDF(payment);
        yield ensureInvoiceSnapshotDir();
        yield fs_1.promises.writeFile(storedPath, generatedInvoice.buffer);
        return generatedInvoice;
    }
});
exports.generateOrganizationOrderInvoice = generateOrganizationOrderInvoice;
