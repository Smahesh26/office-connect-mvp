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
exports.resetOrganizationUserManagementAndCrmData = exports.deactivateOrganizationUser = exports.getMyAccess = exports.updateOrganizationUserAccess = exports.createOrganizationUser = exports.listOrganizationUsers = exports.ACCESS_KEYS = exports.UserManagementError = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const client_1 = require("@prisma/client");
class UserManagementError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "UserManagementError";
    }
}
exports.UserManagementError = UserManagementError;
exports.ACCESS_KEYS = [
    "CRM",
    "HRM",
    "INVENTORY",
    "FILE_SHARING",
    "USER_MANAGEMENT",
];
const ensureAccessProfileTable = () => __awaiter(void 0, void 0, void 0, function* () {
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
const normalizeAccesses = (accesses) => {
    if (!Array.isArray(accesses)) {
        return [];
    }
    const filtered = accesses
        .map((item) => String(item).trim().toUpperCase())
        .filter((item) => exports.ACCESS_KEYS.includes(item));
    return [...new Set(filtered)];
};
const resolveRole = (role) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.role.findUnique({ where: { name: role } });
    if (existing) {
        return existing;
    }
    return prisma_1.default.role.create({ data: { name: role } });
});
const ensureOrganizationMembership = (organizationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const membership = yield prisma_1.default.organizationUser.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: { id: true },
    });
    if (!membership) {
        throw new UserManagementError(403, "You are not a member of this organization");
    }
});
const ensureUserLimit = (organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield prisma_1.default.organizationUser.count({
        where: { organizationId },
    });
    if (count >= 4) {
        throw new UserManagementError(403, "First plan supports maximum 4 users");
    }
});
const randomPassword = () => {
    const seed = Math.random().toString(36).slice(-6);
    return `Cambliss@${seed}`;
};
const listOrganizationUsers = (organizationId, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganizationMembership(organizationId, requesterId);
    yield ensureAccessProfileTable();
    const rows = yield prisma_1.default.$queryRawUnsafe(`
		SELECT
			u."id" AS "id",
			u."email" AS "email",
			u."firstName" AS "firstName",
			u."lastName" AS "lastName",
			r."name" AS "role",
			ap."phone" AS "phone",
			ap."accesses" AS "accesses",
			ou."createdAt" AS "createdAt"
		FROM "OrganizationUser" ou
		JOIN "User" u ON u."id" = ou."userId"
		JOIN "Role" r ON r."id" = ou."roleId"
		LEFT JOIN "UserAccessProfile" ap ON ap."userId" = u."id"
		WHERE ou."organizationId" = $1
		  AND u."id" <> $2
		ORDER BY ou."createdAt" ASC
		`, organizationId, requesterId);
    return rows.map((row) => ({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        phone: row.phone,
        accesses: normalizeAccesses(row.accesses || []),
        createdAt: row.createdAt,
    }));
});
exports.listOrganizationUsers = listOrganizationUsers;
const createOrganizationUser = (organizationId, requesterId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ensureOrganizationMembership(organizationId, requesterId);
    yield ensureAccessProfileTable();
    yield ensureUserLimit(organizationId);
    const email = (_a = input.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (!email) {
        throw new UserManagementError(400, "email is required");
    }
    const allowedRoles = [client_1.RoleName.CLIENT, client_1.RoleName.EMPLOYEE, client_1.RoleName.PROJECT_MANAGER];
    if (!allowedRoles.includes(input.role)) {
        throw new UserManagementError(400, "role must be CLIENT, EMPLOYEE, or PROJECT_MANAGER");
    }
    const existing = yield prisma_1.default.user.findUnique({
        where: { email },
        select: { id: true },
    });
    if (existing) {
        throw new UserManagementError(409, "User with this email already exists");
    }
    const roleRecord = yield resolveRole(input.role);
    const accesses = normalizeAccesses(input.accesses || []);
    const tempPassword = randomPassword();
    const passwordHash = yield bcryptjs_1.default.hash(tempPassword, 10);
    const created = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const user = yield tx.user.create({
            data: {
                email,
                passwordHash,
                organizationId,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });
        yield tx.organizationUser.create({
            data: {
                organizationId,
                userId: user.id,
                roleId: roleRecord.id,
            },
        });
        yield tx.$executeRawUnsafe(`
			INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "accesses", "createdBy", "createdAt", "updatedAt")
			VALUES ($1, $2, $3, $4::TEXT[], $5, NOW(), NOW())
			`, user.id, organizationId, ((_a = input.phone) === null || _a === void 0 ? void 0 : _a.trim()) || null, accesses, requesterId);
        return user;
    }));
    return {
        user: {
            id: created.id,
            email: created.email,
            role: input.role,
            phone: ((_b = input.phone) === null || _b === void 0 ? void 0 : _b.trim()) || null,
            accesses,
            createdAt: created.createdAt,
        },
        tempPassword,
    };
});
exports.createOrganizationUser = createOrganizationUser;
const updateOrganizationUserAccess = (organizationId, requesterId, userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureOrganizationMembership(organizationId, requesterId);
    yield ensureAccessProfileTable();
    const membership = yield prisma_1.default.organizationUser.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: { id: true },
    });
    if (!membership) {
        throw new UserManagementError(404, "User not found in organization");
    }
    const accesses = normalizeAccesses(input.accesses || []);
    const phone = ((_a = input.phone) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    if (input.role) {
        const roleRecord = yield resolveRole(input.role);
        yield prisma_1.default.organizationUser.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
            data: { roleId: roleRecord.id },
        });
    }
    yield prisma_1.default.$executeRawUnsafe(`
		INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "accesses", "createdBy", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4::TEXT[], $5, NOW(), NOW())
		ON CONFLICT ("userId")
		DO UPDATE SET
			"phone" = EXCLUDED."phone",
			"accesses" = EXCLUDED."accesses",
			"updatedAt" = NOW()
		`, userId, organizationId, phone, accesses, requesterId);
    return { message: "User access updated" };
});
exports.updateOrganizationUserAccess = updateOrganizationUserAccess;
const getMyAccess = (organizationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    yield ensureAccessProfileTable();
    const rows = yield prisma_1.default.$queryRawUnsafe(`SELECT "phone", "accesses" FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`, organizationId, userId);
    const row = rows[0];
    return {
        phone: (_a = row === null || row === void 0 ? void 0 : row.phone) !== null && _a !== void 0 ? _a : null,
        accesses: normalizeAccesses((row === null || row === void 0 ? void 0 : row.accesses) || []),
    };
});
exports.getMyAccess = getMyAccess;
const deactivateOrganizationUser = (organizationId, requesterId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganizationMembership(organizationId, requesterId);
    yield ensureAccessProfileTable();
    if (requesterId === userId) {
        throw new UserManagementError(400, "You cannot deactivate your own account");
    }
    const membership = yield prisma_1.default.organizationUser.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: { id: true },
    });
    if (!membership) {
        throw new UserManagementError(404, "User not found in organization");
    }
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.organizationUser.delete({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });
        yield tx.$executeRawUnsafe(`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = $2`, organizationId, userId);
        const remainingMemberships = yield tx.organizationUser.count({ where: { userId } });
        if (remainingMemberships === 0) {
            yield tx.user.update({
                where: { id: userId },
                data: { organizationId: null },
            });
        }
    }));
    return { message: "User deactivated" };
});
exports.deactivateOrganizationUser = deactivateOrganizationUser;
const resetOrganizationUserManagementAndCrmData = (organizationId, requesterId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureOrganizationMembership(organizationId, requesterId);
    yield ensureAccessProfileTable();
    const allOrgMembers = yield prisma_1.default.organizationUser.findMany({
        where: { organizationId },
        select: { userId: true },
    });
    const allOrgUserIds = [...new Set(allOrgMembers.map((item) => item.userId))];
    const managedUserIds = allOrgUserIds.filter((userId) => userId !== requesterId);
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        if (allOrgUserIds.length > 0) {
            yield tx.activity.deleteMany({
                where: {
                    OR: [
                        { lead: { organizationId } },
                        { deal: { organizationId } },
                        { createdBy: { in: allOrgUserIds } },
                    ],
                },
            });
        }
        else {
            yield tx.activity.deleteMany({
                where: {
                    OR: [{ lead: { organizationId } }, { deal: { organizationId } }],
                },
            });
        }
        yield tx.dealStageHistory.deleteMany({ where: { deal: { organizationId } } });
        yield tx.deal.deleteMany({ where: { organizationId } });
        yield tx.lead.deleteMany({ where: { organizationId } });
        yield tx.stage.deleteMany({ where: { pipeline: { organizationId } } });
        yield tx.pipeline.deleteMany({ where: { organizationId } });
        if (managedUserIds.length > 0) {
            yield tx.$executeRawUnsafe(`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = ANY($2::TEXT[])`, organizationId, managedUserIds);
            yield tx.organizationUser.deleteMany({
                where: {
                    organizationId,
                    userId: { in: managedUserIds },
                },
            });
            for (const userId of managedUserIds) {
                const remainingMemberships = yield tx.organizationUser.count({ where: { userId } });
                if (remainingMemberships === 0) {
                    yield tx.user.update({
                        where: { id: userId },
                        data: { organizationId: null },
                    });
                }
            }
        }
    }));
    return {
        message: "User management and CRM data reset successfully",
        deletedUsers: managedUserIds.length,
    };
});
exports.resetOrganizationUserManagementAndCrmData = resetOrganizationUserManagementAndCrmData;
