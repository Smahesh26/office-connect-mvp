import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import authRouter from "../auth/auth.routes";
import subscriptionRoutes from "../subscription/subscription.routes";
import crmRoutes from "../crm/crm.routes";
import hrmRoutes from "../hrm/hrm.routes";
import inventoryRoutes from "../inventory/inventory.routes";
import { clearRateLimitBuckets } from "../../middleware/rate-limit.middleware";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/hrm", hrmRoutes);
app.use("/api/inventory", inventoryRoutes);

const signToken = (payload: { id: string; email: string; organizationId: string; role: string }) => {
	const secret = process.env.JWT_SECRET || "auth-test-secret";
	return jwt.sign(payload, secret, { expiresIn: "10m" });
};

describe("Security checks", () => {
	beforeAll(() => {
		process.env.JWT_SECRET = process.env.JWT_SECRET ?? "auth-test-secret";
		process.env.AUTH_RATE_LIMIT_MAX = "2";
		process.env.AUTH_RATE_LIMIT_WINDOW_MS = "60000";
	});

	beforeEach(() => {
		clearRateLimitBuckets();
	});

	afterAll(() => {
		delete process.env.AUTH_RATE_LIMIT_MAX;
		delete process.env.AUTH_RATE_LIMIT_WINDOW_MS;
	});

	it("blocks unauthorized access to protected auth endpoint", async () => {
		const response = await request(app).get("/api/auth/me");
		expect(response.status).toBe(401);
	});

	it("rejects malformed bearer token", async () => {
		const response = await request(app)
			.get("/api/subscription/my-subscription")
			.set("Authorization", "Bearer malformed.token.value");
		expect(response.status).toBe(401);
	});

	it("enforces role-based authorization on subscription create", async () => {
		const employeeToken = signToken({
			id: "user-1",
			email: "employee@test.com",
			organizationId: "org-1",
			role: "EMPLOYEE",
		});

		const response = await request(app)
			.post("/api/subscription/subscribe")
			.set("Authorization", `Bearer ${employeeToken}`)
			.send({ planId: "plan-x" });

		expect(response.status).toBe(403);
	});

	it("applies rate limiting on repeated auth attempts", async () => {
		await request(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });
		await request(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });
		const third = await request(app).post("/api/auth/login").send({ email: "a@test.com", password: "x" });

		expect(third.status).toBe(429);
		expect(third.body.message).toContain("Too many requests");
	});

	it("handles SQL injection-like login input safely", async () => {
		const response = await request(app)
			.post("/api/auth/login")
			.send({ email: "' OR 1=1 --", password: "' OR '1'='1" });

		expect([400, 401]).toContain(response.status);
	});

	it("keeps CRM, HRM, Inventory behind JWT auth", async () => {
		const [crmRes, hrmRes, invRes] = await Promise.all([
			request(app).get("/api/crm/leads"),
			request(app).get("/api/hrm/employees"),
			request(app).get("/api/inventory/products"),
		]);

		expect(crmRes.status).toBe(401);
		expect(hrmRes.status).toBe(401);
		expect(invRes.status).toBe(401);
	});
});
