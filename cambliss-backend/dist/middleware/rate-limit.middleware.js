"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRateLimitBuckets = exports.createRateLimitMiddleware = void 0;
const buckets = new Map();
const getNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const createRateLimitMiddleware = (config) => {
    var _a;
    const keyPrefix = (_a = config === null || config === void 0 ? void 0 : config.keyPrefix) !== null && _a !== void 0 ? _a : "global";
    const configuredMax = config === null || config === void 0 ? void 0 : config.max;
    const configuredWindowMs = config === null || config === void 0 ? void 0 : config.windowMs;
    return (req, res, next) => {
        const max = configuredMax !== null && configuredMax !== void 0 ? configuredMax : getNumber(process.env.AUTH_RATE_LIMIT_MAX, 10);
        const windowMs = configuredWindowMs !== null && configuredWindowMs !== void 0 ? configuredWindowMs : getNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000);
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
exports.createRateLimitMiddleware = createRateLimitMiddleware;
const clearRateLimitBuckets = () => {
    buckets.clear();
};
exports.clearRateLimitBuckets = clearRateLimitBuckets;
