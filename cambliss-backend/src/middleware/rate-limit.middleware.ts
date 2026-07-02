import { NextFunction, Request, Response } from "express";

type Bucket = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, Bucket>();

const getNumber = (value: string | undefined, fallback: number) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const createRateLimitMiddleware = (config?: { keyPrefix?: string; max?: number; windowMs?: number }) => {
	const keyPrefix = config?.keyPrefix ?? "global";
	const configuredMax = config?.max;
	const configuredWindowMs = config?.windowMs;

	return (req: Request, res: Response, next: NextFunction): void => {
		const max = configuredMax ?? getNumber(process.env.AUTH_RATE_LIMIT_MAX, 10);
		const windowMs = configuredWindowMs ?? getNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000);
		const ip = req.ip || req.socket.remoteAddress || "unknown";
		const key = `${keyPrefix}:${ip}:${req.path}`;
		const now = Date.now();
		const existing = buckets.get(key);

		if (!existing || existing.resetAt <= now) {
			buckets.set(key, { count: 1, resetAt: now + windowMs });
			next();
			return;
		}

		existing.count += 1;
		if (existing.count > max) {
			const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
			res.setHeader("Retry-After", retryAfter.toString());
			res.status(429).json({ message: "Too many requests. Please try again later." });
			return;
		}

		next();
	};
};

export const clearRateLimitBuckets = () => {
	buckets.clear();
};
