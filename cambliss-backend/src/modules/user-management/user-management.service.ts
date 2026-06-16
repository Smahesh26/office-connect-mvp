import bcrypt from "bcryptjs";
import prisma from "../../config/prisma";
import { RoleName } from "../../generated/prisma/enums";

export class UserManagementError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "UserManagementError";
	}
}

export const ACCESS_KEYS = [
	"CRM",
	"HRM",
	"INVENTORY",
	"ECOMMERCE",
	"CHAT",
	"FILE_SHARING",
	"PROJECT_TRACKING",
	"USER_MANAGEMENT",
] as const;

export type AccessKey = (typeof ACCESS_KEYS)[number];

const ensureAccessProfileTable = async (): Promise<void> => {
	await prisma.$executeRawUnsafe(`
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

	await prisma.$executeRawUnsafe(`
		CREATE INDEX IF NOT EXISTS "UserAccessProfile_org_idx"
		ON "UserAccessProfile"("organizationId");
	`);
};

const normalizeAccesses = (accesses: unknown): AccessKey[] => {
	if (!Array.isArray(accesses)) {
		return [];
	}

	const filtered = accesses
		.map((item) => String(item).trim().toUpperCase())
		.filter((item): item is AccessKey => ACCESS_KEYS.includes(item as AccessKey));

	return [...new Set(filtered)];
};

const resolveRole = async (role: RoleName) => {
	const existing = await prisma.role.findUnique({ where: { name: role } });
	if (existing) {
		return existing;
	}
	return prisma.role.create({ data: { name: role } });
};

const ensureOrganizationMembership = async (organizationId: string, userId: string): Promise<void> => {
	const membership = await prisma.organizationUser.findUnique({
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
};

const ensureUserLimit = async (organizationId: string): Promise<void> => {
	const count = await prisma.organizationUser.count({
		where: { organizationId },
	});

	if (count >= 5) {
		throw new UserManagementError(403, "First plan supports maximum 5 users");
	}
};

const randomPassword = (): string => {
	const seed = Math.random().toString(36).slice(-6);
	return `Cambliss@${seed}`;
};

export const listOrganizationUsers = async (organizationId: string, requesterId: string) => {
	await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const rows = await prisma.$queryRawUnsafe<Array<{
		id: string;
		email: string;
		firstName: string | null;
		lastName: string | null;
		role: RoleName;
		phone: string | null;
		accesses: string[] | null;
		createdAt: Date;
	}>>(
		`
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
		`,
		organizationId,
		requesterId,
	);

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
};

export const createOrganizationUser = async (
	organizationId: string,
	requesterId: string,
	input: {
		email: string;
		phone?: string;
		role: RoleName;
		accesses?: string[];
	},
) => {
	await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();
	await ensureUserLimit(organizationId);

	const email = input.email?.trim().toLowerCase();
	if (!email) {
		throw new UserManagementError(400, "email is required");
	}

	const allowedRoles: RoleName[] = [RoleName.CLIENT, RoleName.EMPLOYEE, RoleName.PROJECT_MANAGER];
	if (!allowedRoles.includes(input.role)) {
		throw new UserManagementError(400, "role must be CLIENT, EMPLOYEE, or PROJECT_MANAGER");
	}

	const existing = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});
	if (existing) {
		throw new UserManagementError(409, "User with this email already exists");
	}

	const roleRecord = await resolveRole(input.role);
	const accesses = normalizeAccesses(input.accesses || []);
	const tempPassword = randomPassword();
	const passwordHash = await bcrypt.hash(tempPassword, 10);

	const created = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
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

		await tx.organizationUser.create({
			data: {
				organizationId,
				userId: user.id,
				roleId: roleRecord.id,
			},
		});

		await tx.$executeRawUnsafe(
			`
			INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "accesses", "createdBy", "createdAt", "updatedAt")
			VALUES ($1, $2, $3, $4::TEXT[], $5, NOW(), NOW())
			`,
			user.id,
			organizationId,
			input.phone?.trim() || null,
			accesses,
			requesterId,
		);

		return user;
	});

	return {
		user: {
			id: created.id,
			email: created.email,
			role: input.role,
			phone: input.phone?.trim() || null,
			accesses,
			createdAt: created.createdAt,
		},
		tempPassword,
	};
};

export const updateOrganizationUserAccess = async (
	organizationId: string,
	requesterId: string,
	userId: string,
	input: {
		phone?: string;
		role?: RoleName;
		accesses?: string[];
	},
) => {
	await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const membership = await prisma.organizationUser.findUnique({
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
	const phone = input.phone?.trim() || null;

	if (input.role) {
		const roleRecord = await resolveRole(input.role);
		await prisma.organizationUser.update({
			where: {
				organizationId_userId: {
					organizationId,
					userId,
				},
			},
			data: { roleId: roleRecord.id },
		});
	}

	await prisma.$executeRawUnsafe(
		`
		INSERT INTO "UserAccessProfile" ("userId", "organizationId", "phone", "accesses", "createdBy", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4::TEXT[], $5, NOW(), NOW())
		ON CONFLICT ("userId")
		DO UPDATE SET
			"phone" = EXCLUDED."phone",
			"accesses" = EXCLUDED."accesses",
			"updatedAt" = NOW()
		`,
		userId,
		organizationId,
		phone,
		accesses,
		requesterId,
	);

	return { message: "User access updated" };
};

export const getMyAccess = async (organizationId: string, userId: string) => {
	await ensureAccessProfileTable();
	const rows = await prisma.$queryRawUnsafe<Array<{ phone: string | null; accesses: string[] | null }>>(
		`SELECT "phone", "accesses" FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
		organizationId,
		userId,
	);

	const row = rows[0];
	return {
		phone: row?.phone ?? null,
		accesses: normalizeAccesses(row?.accesses || []),
	};
};

export const deactivateOrganizationUser = async (organizationId: string, requesterId: string, userId: string) => {
	await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	if (requesterId === userId) {
		throw new UserManagementError(400, "You cannot deactivate your own account");
	}

	const membership = await prisma.organizationUser.findUnique({
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

	await prisma.$transaction(async (tx) => {
		await tx.organizationUser.delete({
			where: {
				organizationId_userId: {
					organizationId,
					userId,
				},
			},
		});

		await tx.$executeRawUnsafe(
			`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = $2`,
			organizationId,
			userId,
		);

		const remainingMemberships = await tx.organizationUser.count({ where: { userId } });
		if (remainingMemberships === 0) {
			await tx.user.update({
				where: { id: userId },
				data: { organizationId: null },
			});
		}
	});

	return { message: "User deactivated" };
};

export const resetOrganizationUserManagementAndCrmData = async (organizationId: string, requesterId: string) => {
	await ensureOrganizationMembership(organizationId, requesterId);
	await ensureAccessProfileTable();

	const allOrgMembers = await prisma.organizationUser.findMany({
		where: { organizationId },
		select: { userId: true },
	});

	const allOrgUserIds = [...new Set(allOrgMembers.map((item) => item.userId))];
	const managedUserIds = allOrgUserIds.filter((userId) => userId !== requesterId);

	await prisma.$transaction(async (tx) => {
		if (allOrgUserIds.length > 0) {
			await tx.activity.deleteMany({
				where: {
					OR: [
						{ lead: { organizationId } },
						{ deal: { organizationId } },
						{ createdBy: { in: allOrgUserIds } },
					],
				},
			});
		} else {
			await tx.activity.deleteMany({
				where: {
					OR: [{ lead: { organizationId } }, { deal: { organizationId } }],
				},
			});
		}

		await tx.dealStageHistory.deleteMany({ where: { deal: { organizationId } } });
		await tx.deal.deleteMany({ where: { organizationId } });
		await tx.lead.deleteMany({ where: { organizationId } });
		await tx.stage.deleteMany({ where: { pipeline: { organizationId } } });
		await tx.pipeline.deleteMany({ where: { organizationId } });

		if (managedUserIds.length > 0) {
			await tx.$executeRawUnsafe(
				`DELETE FROM "UserAccessProfile" WHERE "organizationId" = $1 AND "userId" = ANY($2::TEXT[])`,
				organizationId,
				managedUserIds,
			);

			await tx.organizationUser.deleteMany({
				where: {
					organizationId,
					userId: { in: managedUserIds },
				},
			});

			for (const userId of managedUserIds) {
				const remainingMemberships = await tx.organizationUser.count({ where: { userId } });
				if (remainingMemberships === 0) {
					await tx.user.update({
						where: { id: userId },
						data: { organizationId: null },
					});
				}
			}
		}
	});

	return {
		message: "User management and CRM data reset successfully",
		deletedUsers: managedUserIds.length,
	};
};
