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
exports.resetPassword = exports.forgotPassword = exports.updateOrganizationOnboarding = exports.getOrganizationOnboarding = exports.clearOrganizationProfile = exports.updateOrganizationProfile = exports.getMe = exports.login = exports.register = exports.generateSsoToken = exports.AuthError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const user_management_service_1 = require("../user-management/user-management.service");
const subscription_service_1 = require("../subscription/subscription.service");
class AuthError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AuthError";
    }
}
exports.AuthError = AuthError;
const toSafeUser = (params) => {
    var _a, _b;
    return {
        id: params.id,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        organizationId: params.organizationId,
        role: params.role,
        accesses: (_a = params.accesses) !== null && _a !== void 0 ? _a : [],
        phone: (_b = params.phone) !== null && _b !== void 0 ? _b : null,
    };
};
const PLATFORM_ORGANIZATION_ID = "platform";
const ensureOrganizationOnboardingTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "OrganizationOnboarding" (
			"organizationId" TEXT PRIMARY KEY REFERENCES "Organization"("id") ON DELETE CASCADE,
			"profileCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
			"paymentCardOnboarded" BOOLEAN NOT NULL DEFAULT FALSE,
			"preferredCurrency" TEXT NOT NULL DEFAULT 'INR',
			"stackSelections" JSONB NOT NULL DEFAULT '{}'::jsonb,
			"onboardingPayload" JSONB NOT NULL DEFAULT '{}'::jsonb,
			"cardType" TEXT DEFAULT 'CREDIT',
			"cardHolderName" TEXT,
			"cardNumberLast4" TEXT,
			"cardBrand" TEXT,
			"expiryMonth" TEXT,
			"expiryYear" TEXT,
			"cardToken" TEXT,
			"billingZip" TEXT,
			"autoPayConsent" BOOLEAN DEFAULT TRUE,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`);
    yield prisma_1.default.$executeRawUnsafe(`
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "cardType" TEXT DEFAULT 'CREDIT';
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "cardHolderName" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "cardNumberLast4" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "cardBrand" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "expiryMonth" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "expiryYear" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "cardToken" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "billingZip" TEXT;
		ALTER TABLE "OrganizationOnboarding" ADD COLUMN IF NOT EXISTS "autoPayConsent" BOOLEAN DEFAULT TRUE;
	`);
});
const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new AuthError(500, "JWT_SECRET is not configured");
    }
    return jwtSecret;
};
const signAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};
const generateSsoToken = (payload) => {
    return signAccessToken(payload);
};
exports.generateSsoToken = generateSsoToken;
const getOrCreateRole = (roleName) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.role.findUnique({
        where: {
            name: roleName,
        },
    });
    if (existing) {
        return existing;
    }
    return prisma_1.default.role.create({
        data: {
            name: roleName,
        },
    });
});
const ensureUserAccessProfileTable = () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "UserAccessProfile" (
			"userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
			"organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
			"phone" TEXT,
			"accesses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
			"createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`);
    yield prisma_1.default.$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "UserAccessProfile_org_idx"
		ON "UserAccessProfile"("organizationId");
	`);
});
const register = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const email = (_a = input.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const password = (_b = input.password) === null || _b === void 0 ? void 0 : _b.trim();
    const organizationName = (_c = input.organizationName) === null || _c === void 0 ? void 0 : _c.trim();
    const phone = ((_d = input.phone) === null || _d === void 0 ? void 0 : _d.trim()) || null;
    const otpRequestId = ((_e = input.otpRequestId) === null || _e === void 0 ? void 0 : _e.trim()) || null;
    const firebaseIdToken = ((_f = input.firebaseIdToken) === null || _f === void 0 ? void 0 : _f.trim()) || null;
    if (!email) {
        throw new AuthError(400, "email is required");
    }
    if (!password || password.length < 6) {
        throw new AuthError(400, "password must be at least 6 characters");
    }
    if (!organizationName) {
        throw new AuthError(400, "organizationName is required");
    }
    yield ensureUserAccessProfileTable();
    const existingUser = yield prisma_1.default.user.findUnique({
        where: { email },
        select: { id: true },
    });
    if (existingUser) {
        throw new AuthError(409, "User with this email already exists");
    }
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const organization = yield tx.organization.create({
            data: {
                name: organizationName,
            },
        });
        const adminRole = yield getOrCreateRole("ADMIN");
        const user = yield tx.user.create({
            data: {
                email,
                firstName: ((_a = input.firstName) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                lastName: ((_b = input.lastName) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                passwordHash,
                organizationId: organization.id,
            },
        });
        yield tx.organizationUser.create({
            data: {
                organizationId: organization.id,
                userId: user.id,
                roleId: adminRole.id,
            },
        });
        yield tx.$executeRawUnsafe(`
			INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "accesses", "createdBy", "createdAt", "updatedAt")
			VALUES ($1, $2, $3, ARRAY[]::TEXT[], $4, NOW(), NOW())
			`, user.id, organization.id, phone, user.id);
        return {
            user,
            organization,
            roleName: "ADMIN",
        };
    }));
    const token = signAccessToken({
        id: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
        role: result.roleName,
    });
    return {
        token,
        user: toSafeUser({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            organizationId: result.organization.id,
            role: result.roleName,
            phone,
        }),
    };
});
exports.register = register;
const login = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const email = (_a = input.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const password = (_b = input.password) === null || _b === void 0 ? void 0 : _b.trim();
    if (!email || !password) {
        throw new AuthError(400, "email and password are required");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: { email },
        include: {
            memberships: {
                include: {
                    role: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
    if (!user) {
        throw new AuthError(401, "Invalid email or password");
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AuthError(401, "Invalid email or password");
    }
    const primaryMembership = user.memberships[0];
    const role = user.isPlatformUser
        ? "SUPER_ADMIN"
        : ((_d = (_c = primaryMembership === null || primaryMembership === void 0 ? void 0 : primaryMembership.role) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "CLIENT");
    const organizationId = (_e = user.organizationId) !== null && _e !== void 0 ? _e : primaryMembership === null || primaryMembership === void 0 ? void 0 : primaryMembership.organizationId;
    if (!organizationId && role !== "SUPER_ADMIN") {
        throw new AuthError(403, "User is not linked to any organization");
    }
    const resolvedOrganizationId = organizationId !== null && organizationId !== void 0 ? organizationId : PLATFORM_ORGANIZATION_ID;
    const myAccess = role === "SUPER_ADMIN"
        ? { accesses: [], phone: null }
        : yield (0, user_management_service_1.getMyAccess)(resolvedOrganizationId, user.id);
    if (role !== "SUPER_ADMIN") {
        const trialSnapshot = yield (0, subscription_service_1.getOrganizationTrialReminderSnapshot)(resolvedOrganizationId);
        if (trialSnapshot.status === "EXPIRED") {
            throw new AuthError(403, "Trial period expired");
        }
    }
    const token = signAccessToken({
        id: user.id,
        email: user.email,
        organizationId: resolvedOrganizationId,
        role,
    });
    return {
        token,
        user: toSafeUser({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: resolvedOrganizationId,
            role,
            accesses: myAccess.accesses,
            phone: myAccess.phone,
        }),
    };
});
exports.login = login;
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            organization: true,
            memberships: {
                include: {
                    role: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
    if (!user) {
        throw new AuthError(404, "User not found");
    }
    const primaryMembership = user.memberships[0];
    const role = user.isPlatformUser
        ? "SUPER_ADMIN"
        : ((_b = (_a = primaryMembership === null || primaryMembership === void 0 ? void 0 : primaryMembership.role) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "CLIENT");
    const organizationId = (_c = user.organizationId) !== null && _c !== void 0 ? _c : primaryMembership === null || primaryMembership === void 0 ? void 0 : primaryMembership.organizationId;
    if (!organizationId && role !== "SUPER_ADMIN") {
        throw new AuthError(403, "User is not linked to any organization");
    }
    const resolvedOrganizationId = organizationId !== null && organizationId !== void 0 ? organizationId : PLATFORM_ORGANIZATION_ID;
    const myAccess = role === "SUPER_ADMIN"
        ? { accesses: [], phone: null }
        : yield (0, user_management_service_1.getMyAccess)(resolvedOrganizationId, user.id);
    return {
        user: toSafeUser({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: resolvedOrganizationId,
            role,
            accesses: myAccess.accesses,
            phone: myAccess.phone,
        }),
        organization: user.organization,
    };
});
exports.getMe = getMe;
const updateOrganizationProfile = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AuthError(404, "Organization not found");
    }
    const normalize = (value) => {
        if (value === undefined) {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    };
    const data = {
        legalName: normalize(input.legalName),
        panNumber: normalize(input.panNumber),
        businessType: normalize(input.businessType),
        supportEmail: normalize(input.supportEmail),
        supportPhone: normalize(input.supportPhone),
        addressLine1: normalize(input.addressLine1),
        addressLine2: normalize(input.addressLine2),
        city: normalize(input.city),
        state: normalize(input.state),
        pincode: normalize(input.pincode),
        country: normalize(input.country),
        settlementAccountHolderName: normalize(input.settlementAccountHolderName),
        settlementAccountNumber: normalize(input.settlementAccountNumber),
        settlementIFSC: normalize(input.settlementIFSC),
    };
    if (input.name !== undefined) {
        const trimmedName = input.name.trim();
        if (trimmedName.length > 0) {
            data.name = trimmedName;
        }
    }
    return prisma_1.default.organization.update({
        where: { id: organizationId },
        data,
    });
});
exports.updateOrganizationProfile = updateOrganizationProfile;
const clearOrganizationProfile = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AuthError(404, "Organization not found");
    }
    return prisma_1.default.organization.update({
        where: { id: organizationId },
        data: {
            legalName: null,
            panNumber: null,
            businessType: null,
            supportEmail: null,
            supportPhone: null,
            addressLine1: null,
            addressLine2: null,
            city: null,
            state: null,
            pincode: null,
            country: null,
            settlementAccountHolderName: null,
            settlementAccountNumber: null,
            settlementIFSC: null,
        },
    });
});
exports.clearOrganizationProfile = clearOrganizationProfile;
const defaultOnboardingState = (organizationId) => ({
    organizationId,
    profileCompleted: false,
    paymentCardOnboarded: false,
    preferredCurrency: "INR",
    stackSelections: {},
    onboardingPayload: {},
    updatedAt: new Date(0).toISOString(),
});
const getOrganizationOnboarding = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AuthError(404, "Organization not found");
    }
    yield ensureOrganizationOnboardingTable();
    const rows = yield prisma_1.default.$queryRawUnsafe(`SELECT "organizationId", "profileCompleted", "paymentCardOnboarded", "preferredCurrency", 
		        "stackSelections", "onboardingPayload", "cardType", "cardHolderName", "cardNumberLast4", 
		        "cardBrand", "expiryMonth", "expiryYear", "cardToken", "billingZip", "autoPayConsent", "updatedAt"
		 FROM "OrganizationOnboarding" WHERE "organizationId" = $1`, organizationId);
    if (!rows[0]) {
        return defaultOnboardingState(organizationId);
    }
    const hasCard = Boolean(rows[0].cardNumberLast4 || rows[0].cardHolderName || rows[0].paymentCardOnboarded);
    const cardDetails = hasCard ? {
        cardType: rows[0].cardType || "CREDIT",
        cardHolderName: rows[0].cardHolderName || "",
        cardNumberLast4: rows[0].cardNumberLast4 || "",
        cardBrand: rows[0].cardBrand || "VISA",
        expiryMonth: rows[0].expiryMonth || "",
        expiryYear: rows[0].expiryYear || "",
        cardToken: rows[0].cardToken || undefined,
        billingZip: rows[0].billingZip || "",
        autoPayConsent: (_a = rows[0].autoPayConsent) !== null && _a !== void 0 ? _a : true,
    } : undefined;
    return {
        organizationId: rows[0].organizationId,
        profileCompleted: rows[0].profileCompleted,
        paymentCardOnboarded: rows[0].paymentCardOnboarded,
        preferredCurrency: rows[0].preferredCurrency || "INR",
        stackSelections: typeof rows[0].stackSelections === "object" && rows[0].stackSelections
            ? rows[0].stackSelections
            : {},
        onboardingPayload: typeof rows[0].onboardingPayload === "object" && rows[0].onboardingPayload
            ? rows[0].onboardingPayload
            : {},
        cardDetails,
        updatedAt: rows[0].updatedAt.toISOString(),
    };
});
exports.getOrganizationOnboarding = getOrganizationOnboarding;
const updateOrganizationOnboarding = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AuthError(404, "Organization not found");
    }
    yield ensureOrganizationOnboardingTable();
    const previous = yield (0, exports.getOrganizationOnboarding)(organizationId);
    const nextProfileCompleted = (_a = input.profileCompleted) !== null && _a !== void 0 ? _a : previous.profileCompleted;
    const nextPreferredCurrency = ((_c = (_b = input.preferredCurrency) !== null && _b !== void 0 ? _b : previous.preferredCurrency) !== null && _c !== void 0 ? _c : "INR").toUpperCase();
    const nextStackSelections = (_d = input.stackSelections) !== null && _d !== void 0 ? _d : previous.stackSelections;
    const cardInput = input.cardDetails || ((_e = input.onboardingPayload) === null || _e === void 0 ? void 0 : _e.cardDetails) || ((_f = input.onboardingPayload) === null || _f === void 0 ? void 0 : _f.paymentCard);
    const rawNumber = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardNumber) ? String(cardInput.cardNumber).replace(/\D/g, "") : "";
    const nextCardNumberLast4 = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardNumberLast4) || (rawNumber.length >= 4 ? rawNumber.slice(-4) : ((_g = previous.cardDetails) === null || _g === void 0 ? void 0 : _g.cardNumberLast4) || null);
    const nextCardType = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardType) || ((_h = previous.cardDetails) === null || _h === void 0 ? void 0 : _h.cardType) || "CREDIT";
    const nextCardHolderName = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardHolderName) || ((_j = previous.cardDetails) === null || _j === void 0 ? void 0 : _j.cardHolderName) || null;
    const nextCardBrand = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardBrand) || ((_k = previous.cardDetails) === null || _k === void 0 ? void 0 : _k.cardBrand) || "VISA";
    const nextExpiryMonth = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.expiryMonth) || ((_l = previous.cardDetails) === null || _l === void 0 ? void 0 : _l.expiryMonth) || null;
    const nextExpiryYear = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.expiryYear) || ((_m = previous.cardDetails) === null || _m === void 0 ? void 0 : _m.expiryYear) || null;
    const nextCardToken = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.cardToken) || ((_o = previous.cardDetails) === null || _o === void 0 ? void 0 : _o.cardToken) || null;
    const nextBillingZip = (cardInput === null || cardInput === void 0 ? void 0 : cardInput.billingZip) || ((_p = previous.cardDetails) === null || _p === void 0 ? void 0 : _p.billingZip) || null;
    const nextAutoPayConsent = (_s = (_q = cardInput === null || cardInput === void 0 ? void 0 : cardInput.autoPayConsent) !== null && _q !== void 0 ? _q : (_r = previous.cardDetails) === null || _r === void 0 ? void 0 : _r.autoPayConsent) !== null && _s !== void 0 ? _s : true;
    const nextPaymentCardOnboarded = (_t = input.paymentCardOnboarded) !== null && _t !== void 0 ? _t : (Boolean(nextCardNumberLast4) || previous.paymentCardOnboarded);
    const cardSummary = nextCardNumberLast4 ? {
        cardType: nextCardType,
        cardHolderName: nextCardHolderName,
        cardNumberLast4: nextCardNumberLast4,
        cardBrand: nextCardBrand,
        expiryMonth: nextExpiryMonth,
        expiryYear: nextExpiryYear,
        billingZip: nextBillingZip,
        autoPayConsent: nextAutoPayConsent,
    } : undefined;
    const nextPayload = Object.assign(Object.assign(Object.assign({}, previous.onboardingPayload), ((_u = input.onboardingPayload) !== null && _u !== void 0 ? _u : {})), (cardSummary ? { paymentCard: cardSummary, cardDetails: cardSummary } : {}));
    yield prisma_1.default.$executeRawUnsafe(`INSERT INTO "OrganizationOnboarding"
			("organizationId", "profileCompleted", "paymentCardOnboarded", "preferredCurrency", "stackSelections", "onboardingPayload", "cardType", "cardHolderName", "cardNumberLast4", "cardBrand", "expiryMonth", "expiryYear", "cardToken", "billingZip", "autoPayConsent", "updatedAt")
		 VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
		 ON CONFLICT ("organizationId")
		 DO UPDATE SET
			"profileCompleted" = EXCLUDED."profileCompleted",
			"paymentCardOnboarded" = EXCLUDED."paymentCardOnboarded",
			"preferredCurrency" = EXCLUDED."preferredCurrency",
			"stackSelections" = EXCLUDED."stackSelections",
			"onboardingPayload" = EXCLUDED."onboardingPayload",
			"cardType" = EXCLUDED."cardType",
			"cardHolderName" = EXCLUDED."cardHolderName",
			"cardNumberLast4" = EXCLUDED."cardNumberLast4",
			"cardBrand" = EXCLUDED."cardBrand",
			"expiryMonth" = EXCLUDED."expiryMonth",
			"expiryYear" = EXCLUDED."expiryYear",
			"cardToken" = EXCLUDED."cardToken",
			"billingZip" = EXCLUDED."billingZip",
			"autoPayConsent" = EXCLUDED."autoPayConsent",
			"updatedAt" = NOW()`, organizationId, nextProfileCompleted, nextPaymentCardOnboarded, nextPreferredCurrency, JSON.stringify(nextStackSelections !== null && nextStackSelections !== void 0 ? nextStackSelections : {}), JSON.stringify(nextPayload !== null && nextPayload !== void 0 ? nextPayload : {}), nextCardType, nextCardHolderName, nextCardNumberLast4, nextCardBrand, nextExpiryMonth, nextExpiryYear, nextCardToken, nextBillingZip, nextAutoPayConsent);
    return (0, exports.getOrganizationOnboarding)(organizationId);
});
exports.updateOrganizationOnboarding = updateOrganizationOnboarding;
const forgotPassword = (emailInput) => __awaiter(void 0, void 0, void 0, function* () {
    const email = emailInput === null || emailInput === void 0 ? void 0 : emailInput.trim().toLowerCase();
    if (!email) {
        throw new AuthError(400, "Email address is required");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: { email },
        select: { id: true, email: true },
    });
    if (!user) {
        throw new AuthError(404, "No account found with this email address");
    }
    return {
        success: true,
        message: "Reset code verified. Please set your new password.",
    };
});
exports.forgotPassword = forgotPassword;
const resetPassword = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const email = (_a = input.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const newPassword = (_b = input.newPassword) === null || _b === void 0 ? void 0 : _b.trim();
    if (!email || !newPassword) {
        throw new AuthError(400, "Email and new password are required");
    }
    if (newPassword.length < 6) {
        throw new AuthError(400, "Password must be at least 6 characters long");
    }
    const user = yield prisma_1.default.user.findUnique({
        where: { email },
        select: { id: true, email: true },
    });
    if (!user) {
        throw new AuthError(404, "No account found with this email address");
    }
    const passwordHash = yield bcryptjs_1.default.hash(newPassword, 10);
    yield prisma_1.default.user.update({
        where: { id: user.id },
        data: { passwordHash },
    });
    return {
        success: true,
        message: "Password reset successfully. You can now log in.",
    };
});
exports.resetPassword = resetPassword;
