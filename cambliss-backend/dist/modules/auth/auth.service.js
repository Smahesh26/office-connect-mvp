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
exports.updateOrganizationOnboarding = exports.getOrganizationOnboarding = exports.clearOrganizationProfile = exports.updateOrganizationProfile = exports.getMe = exports.login = exports.register = exports.AuthError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const user_management_service_1 = require("../user-management/user-management.service");
const mobile_otp_service_1 = require("./mobile-otp.service");
const firebase_auth_service_1 = require("./firebase-auth.service");
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
			"createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
			"updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
		);
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
    if ((0, firebase_auth_service_1.isFirebaseOtpEnabled)()) {
        if (!phone) {
            throw new AuthError(400, "phone is required for Firebase verification");
        }
        if (!firebaseIdToken) {
            throw new AuthError(400, "firebaseIdToken is required");
        }
        const firebaseVerification = yield (0, firebase_auth_service_1.verifyFirebasePhoneToken)(firebaseIdToken);
        if (firebaseVerification.phoneNumber !== phone) {
            throw new AuthError(400, "Firebase phone number does not match the registration phone");
        }
    }
    else if ((0, mobile_otp_service_1.isMobileOtpEnabled)()) {
        if (!phone) {
            throw new AuthError(400, "phone is required for OTP verification");
        }
        if (!otpRequestId) {
            throw new AuthError(400, "otpRequestId is required");
        }
        (0, mobile_otp_service_1.consumeVerifiedRegisterOtp)({ phone, requestId: otpRequestId });
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
    const organization = yield prisma_1.default.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
    });
    if (!organization) {
        throw new AuthError(404, "Organization not found");
    }
    yield ensureOrganizationOnboardingTable();
    const rows = yield prisma_1.default.$queryRawUnsafe(`SELECT "organizationId", "profileCompleted", "paymentCardOnboarded", "preferredCurrency", "stackSelections", "onboardingPayload", "updatedAt"
		 FROM "OrganizationOnboarding" WHERE "organizationId" = $1`, organizationId);
    if (!rows[0]) {
        return defaultOnboardingState(organizationId);
    }
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
        updatedAt: rows[0].updatedAt.toISOString(),
    };
});
exports.getOrganizationOnboarding = getOrganizationOnboarding;
const updateOrganizationOnboarding = (organizationId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
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
    const nextPaymentCardOnboarded = (_b = input.paymentCardOnboarded) !== null && _b !== void 0 ? _b : previous.paymentCardOnboarded;
    const nextPreferredCurrency = ((_d = (_c = input.preferredCurrency) !== null && _c !== void 0 ? _c : previous.preferredCurrency) !== null && _d !== void 0 ? _d : "INR").toUpperCase();
    const nextStackSelections = (_e = input.stackSelections) !== null && _e !== void 0 ? _e : previous.stackSelections;
    const nextPayload = Object.assign(Object.assign({}, previous.onboardingPayload), ((_f = input.onboardingPayload) !== null && _f !== void 0 ? _f : {}));
    yield prisma_1.default.$executeRawUnsafe(`INSERT INTO "OrganizationOnboarding"
			("organizationId", "profileCompleted", "paymentCardOnboarded", "preferredCurrency", "stackSelections", "onboardingPayload", "updatedAt")
		 VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW())
		 ON CONFLICT ("organizationId")
		 DO UPDATE SET
			"profileCompleted" = EXCLUDED."profileCompleted",
			"paymentCardOnboarded" = EXCLUDED."paymentCardOnboarded",
			"preferredCurrency" = EXCLUDED."preferredCurrency",
			"stackSelections" = EXCLUDED."stackSelections",
			"onboardingPayload" = EXCLUDED."onboardingPayload",
			"updatedAt" = NOW()`, organizationId, nextProfileCompleted, nextPaymentCardOnboarded, nextPreferredCurrency, JSON.stringify(nextStackSelections !== null && nextStackSelections !== void 0 ? nextStackSelections : {}), JSON.stringify(nextPayload !== null && nextPayload !== void 0 ? nextPayload : {}));
    return (0, exports.getOrganizationOnboarding)(organizationId);
});
exports.updateOrganizationOnboarding = updateOrganizationOnboarding;
