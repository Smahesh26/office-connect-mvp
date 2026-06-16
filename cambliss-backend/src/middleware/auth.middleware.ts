import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import type { RoleName } from "../generated/prisma/enums";

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
		const token = extractBearerToken(req.headers.authorization);
		if (!token) {
			res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
			return;
		}

		const jwtSecret = process.env.JWT_SECRET;
		if (!jwtSecret) {
			res.status(500).json({ message: "Internal server error" });
			return;
		}

		const decoded = jwt.verify(token, jwtSecret);
		if (!isAuthenticatedUser(decoded)) {
			res.status(401).json({ message: "Unauthorized: Invalid token payload" });
			return;
		}

		req.user = decoded;
		next();
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
