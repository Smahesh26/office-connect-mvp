import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import type { RoleName } from "@prisma/client";

export interface AuthenticatedUser {
	id: string;
	email: string;
	organizationId: string;
	role: RoleName;
}

const extractBearerToken = (authorizationHeader?: string): string | null => {
	if (!authorizationHeader) {
		return null;
	}

	const [scheme, token] = authorizationHeader.trim().split(" ");
	if (scheme !== "Bearer" || !token) {
		return null;
	}

	return token;
};

// A usable token is a non-empty string that is not a stringified null/undefined,
// which stale frontend `Bearer ${null}` headers can produce.
const isUsableToken = (value: unknown): value is string =>
	typeof value === "string" && value.length > 0 && value !== "null" && value !== "undefined";

// Collects candidate JWTs from both transports (Authorization header and the
// httpOnly cookie) so either can authenticate the request.
const resolveTokenCandidates = (req: Request): string[] => {
	const candidates = [
		extractBearerToken(req.headers.authorization),
		(req as Request & { cookies?: Record<string, string> }).cookies?.authToken,
	];
	return candidates.filter(isUsableToken);
};

const isAuthenticatedUser = (decoded: JwtPayload | string): decoded is AuthenticatedUser => {
	if (typeof decoded !== "object" || decoded === null) {
		return false;
	}

	return (
		typeof decoded.id === "string" &&
		typeof decoded.email === "string" &&
		typeof decoded.organizationId === "string" &&
		typeof decoded.role === "string"
	);
};

export { isAuthenticatedUser };

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
	try {
		if (req.user && isAuthenticatedUser(req.user as unknown as JwtPayload)) {
			next();
			return;
		}

		const candidates = resolveTokenCandidates(req);
		if (candidates.length === 0) {
			res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
			return;
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			res.status(500).json({ message: "Internal server error" });
			return;
		}

		let lastError: unknown = null;
		for (const token of candidates) {
			try {
				const decoded = jwt.verify(token, jwtSecret);
				if (!isAuthenticatedUser(decoded)) {
					lastError = new JsonWebTokenError("Invalid token payload");
					continue;
				}
				req.user = decoded;
				next();
				return;
			} catch (error) {
				lastError = error;
			}
		}

		throw lastError ?? new JsonWebTokenError("Invalid token");
	} catch (error) {
		if (error instanceof TokenExpiredError) {
			res.status(401).json({ message: "Unauthorized: Token expired" });
			return;
		}

		if (error instanceof JsonWebTokenError) {
			res.status(401).json({ message: "Unauthorized: Invalid token" });
			return;
		}

		res.status(500).json({ message: "Internal server error" });
	}
};

export const authorizeRoles =
	(...roles: RoleName[]) =>
	(req: Request, res: Response, next: NextFunction): void => {
		try {
			if (!req.user?.role) {
				res.status(401).json({ message: "Unauthorized: User not authenticated" });
				return;
			}

			if (!roles.includes(req.user.role)) {
				res.status(403).json({ message: "Forbidden: Insufficient permissions" });
				return;
			}

			next();
		} catch {
			res.status(500).json({ message: "Internal server error" });
		}
	};
