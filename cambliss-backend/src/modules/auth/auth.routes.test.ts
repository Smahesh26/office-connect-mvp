import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import express from "express";
import request from "supertest";
import prisma, { closePrisma } from "../../config/prisma";
import authRouter from "./auth.routes";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);

describe("Auth Routes", () => {
	const testRunId = `auth-test-${Date.now()}`;

	beforeAll(() => {
		process.env.JWT_SECRET = process.env.JWT_SECRET ?? "auth-test-secret";
	});

	afterAll(async () => {
		const users = await prisma.user.findMany({
			where: {
				email: {
					startsWith: `${testRunId}-`,
				},
			},
			select: {
				id: true,
				organizationId: true,
			},
		});

		const userIds = users.map((user) => user.id);
		const organizationIds = users
			.map((user) => user.organizationId)
			.filter((organizationId): organizationId is string => Boolean(organizationId));

		if (userIds.length > 0) {
			await prisma.organizationUser.deleteMany({
				where: {
					userId: {
						in: userIds,
					},
				},
			});

			await prisma.user.deleteMany({
				where: {
					id: {
						in: userIds,
					},
				},
			});
		}

		if (organizationIds.length > 0) {
			await prisma.organization.deleteMany({
				where: {
					id: {
						in: organizationIds,
					},
				},
			});
		}

		await closePrisma();
	});

	it("registers a new user and organization", async () => {
		const email = `${testRunId}-register@example.com`;

		const response = await request(app).post("/api/auth/register").send({
			email,
			password: "password123",
			firstName: "Auth",
			lastName: "Tester",
			organizationName: `${testRunId}-org`,
		});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("token");
		expect(response.body).toHaveProperty("user");
		expect(response.body.user.email).toBe(email);
		expect(response.body.user.role).toBe("ADMIN");
		expect(response.body.user.organizationId).toBeTruthy();

		const createdUser = await prisma.user.findUnique({
			where: { email },
			include: {
				memberships: true,
			},
		});

		expect(createdUser).not.toBeNull();
		expect(createdUser?.memberships.length).toBeGreaterThan(0);
	});

	it("rejects duplicate registration for same email", async () => {
		const email = `${testRunId}-duplicate@example.com`;

		await request(app).post("/api/auth/register").send({
			email,
			password: "password123",
			organizationName: `${testRunId}-dup-org-a`,
		});

		const secondResponse = await request(app).post("/api/auth/register").send({
			email,
			password: "password123",
			organizationName: `${testRunId}-dup-org-b`,
		});

		expect(secondResponse.status).toBe(409);
		expect(secondResponse.body.message).toContain("already exists");
	});

	it("rejects registration when organizationName is missing", async () => {
		const response = await request(app).post("/api/auth/register").send({
			email: `${testRunId}-missing-org@example.com`,
			password: "password123",
		});

		expect(response.status).toBe(400);
		expect(response.body.message).toContain("organizationName is required");
	});

	it("rejects registration when password is too short", async () => {
		const response = await request(app).post("/api/auth/register").send({
			email: `${testRunId}-short-pass@example.com`,
			password: "12345",
			organizationName: `${testRunId}-short-pass-org`,
		});

		expect(response.status).toBe(400);
		expect(response.body.message).toContain("at least 6 characters");
	});

	it("logs in an existing user", async () => {
		const email = `${testRunId}-login@example.com`;
		const password = "password123";

		await request(app).post("/api/auth/register").send({
			email,
			password,
			organizationName: `${testRunId}-login-org`,
		});

		const loginResponse = await request(app).post("/api/auth/login").send({
			email,
			password,
		});

		expect(loginResponse.status).toBe(200);
		expect(loginResponse.body).toHaveProperty("token");
		expect(loginResponse.body.user.email).toBe(email);
		expect(loginResponse.body.user.role).toBe("ADMIN");
	});

	it("rejects login with invalid password", async () => {
		const email = `${testRunId}-invalid-password@example.com`;

		await request(app).post("/api/auth/register").send({
			email,
			password: "password123",
			organizationName: `${testRunId}-invalid-org`,
		});

		const loginResponse = await request(app).post("/api/auth/login").send({
			email,
			password: "wrong-password",
		});

		expect(loginResponse.status).toBe(401);
		expect(loginResponse.body.message).toContain("Invalid email or password");
	});
});