import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import type { RoleName } from "../../generated/prisma/enums";
import { getMyAccess } from "../user-management/user-management.service";

export class AuthError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.name = "AuthError";
	}
}

interface RegisterInput {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	organizationName: string;
}

interface LoginInput {
	email: string;
	password: string;
}

interface UpdateOrganizationProfileInput {
	name?: string;
	legalName?: string;
	panNumber?: string;
	businessType?: string;
	supportEmail?: string;
	supportPhone?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	state?: string;
	pincode?: string;
	country?: string;
	settlementAccountHolderName?: string;
	settlementAccountNumber?: string;
	settlementIFSC?: string;
}

const toSafeUser = (params: {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	organizationId: string;
	role: RoleName;
	accesses?: string[];
	phone?: string | null;
}) => {
	return {
		id: params.id,
		email: params.email,
		firstName: params.firstName,
		lastName: params.lastName,
		organizationId: params.organizationId,
		role: params.role,
		accesses: params.accesses ?? [],
		phone: params.phone ?? null,
	};
};

const PLATFORM_ORGANIZATION_ID = "platform";

const getJwtSecret = (): string => {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new AuthError(500, "JWT_SECRET is not configured");
	}

	return jwtSecret;
};

const signAccessToken = (payload: {
	id: string;
	email: string;
	organizationId: string;
	role: RoleName;
}): string => {
	return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};

const getOrCreateRole = async (roleName: RoleName) => {
	const existing = await prisma.role.findUnique({
		where: {
			name: roleName,
		},
	});

	if (existing) {
		return existing;
	}

	return prisma.role.create({
		data: {
			name: roleName,
		},
	});
};

export const register = async (input: RegisterInput) => {
	const email = input.email?.trim().toLowerCase();
	const password = input.password?.trim();
	const organizationName = input.organizationName?.trim();

	if (!email) {
		throw new AuthError(400, "email is required");
	}

	if (!password || password.length < 6) {
		throw new AuthError(400, "password must be at least 6 characters");
	}

	if (!organizationName) {
		throw new AuthError(400, "organizationName is required");
	}

	const existingUser = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (existingUser) {
		throw new AuthError(409, "User with this email already exists");
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const result = await prisma.$transaction(async (tx) => {
		const organization = await tx.organization.create({
			data: {
				name: organizationName,
			},
		});

		const adminRole = await getOrCreateRole("ADMIN");

		const user = await tx.user.create({
			data: {
				email,
				firstName: input.firstName?.trim() || null,
				lastName: input.lastName?.trim() || null,
				passwordHash,
				organizationId: organization.id,
			},
		});

		await tx.organizationUser.create({
			data: {
				organizationId: organization.id,
				userId: user.id,
				roleId: adminRole.id,
			},
		});

		return {
			user,
			organization,
			roleName: "ADMIN" as RoleName,
		};
	});

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
		}),
	};
};

export const login = async (input: LoginInput) => {
	const email = input.email?.trim().toLowerCase();
	const password = input.password?.trim();

	if (!email || !password) {
		throw new AuthError(400, "email and password are required");
	}

	const user = await prisma.user.findUnique({
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

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	if (!isPasswordValid) {
		throw new AuthError(401, "Invalid email or password");
	}

	const primaryMembership = user.memberships[0];
	const role = user.isPlatformUser
		? ("SUPER_ADMIN" as RoleName)
		: ((primaryMembership?.role?.name ?? "CLIENT") as RoleName);
	const organizationId = user.organizationId ?? primaryMembership?.organizationId;

	if (!organizationId && role !== "SUPER_ADMIN") {
		throw new AuthError(403, "User is not linked to any organization");
	}

	const resolvedOrganizationId = organizationId ?? PLATFORM_ORGANIZATION_ID;
	const myAccess = role === "SUPER_ADMIN"
		? { accesses: [], phone: null }
		: await getMyAccess(resolvedOrganizationId, user.id);

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
};

export const getMe = async (userId: string) => {
	const user = await prisma.user.findUnique({
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
		? ("SUPER_ADMIN" as RoleName)
		: ((primaryMembership?.role?.name ?? "CLIENT") as RoleName);
	const organizationId = user.organizationId ?? primaryMembership?.organizationId;

	if (!organizationId && role !== "SUPER_ADMIN") {
		throw new AuthError(403, "User is not linked to any organization");
	}

	const resolvedOrganizationId = organizationId ?? PLATFORM_ORGANIZATION_ID;
	const myAccess = role === "SUPER_ADMIN"
		? { accesses: [], phone: null }
		: await getMyAccess(resolvedOrganizationId, user.id);

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
};

export const updateOrganizationProfile = async (
	organizationId: string,
	input: UpdateOrganizationProfileInput,
) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new AuthError(404, "Organization not found");
	}

	const normalize = (value?: string) => {
		if (value === undefined) {
			return undefined;
		}

		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const data: Record<string, string | null | undefined> = {
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

	return prisma.organization.update({
		where: { id: organizationId },
		data,
	});
};

export const clearOrganizationProfile = async (organizationId: string) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
		select: { id: true },
	});

	if (!organization) {
		throw new AuthError(404, "Organization not found");
	}

	return prisma.organization.update({
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
};

