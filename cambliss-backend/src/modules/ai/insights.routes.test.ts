import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { closePrisma } from "../../config/prisma";
import insightsRouter from "./insights.routes";

const app = express();
app.use(express.json());
app.use("/api/ai/insights", insightsRouter);

describe("AI Insights Routes", () => {
	let testOrgId: string;
	let authToken: string;

	beforeAll(async () => {
		process.env.JWT_SECRET = "ai-insights-test-secret";

		const org = await prisma.organization.create({
			data: {
				name: "AI Insights Route Org",
			},
		});
		testOrgId = org.id;

		authToken = jwt.sign(
			{
				id: "test-user-id",
				email: "ai-route@test.com",
				organizationId: testOrgId,
				role: "ADMIN",
			},
			process.env.JWT_SECRET,
		);
	});

	afterAll(async () => {
		await prisma.invoiceItem.deleteMany({
			where: {
				invoice: {
					organizationId: testOrgId,
				},
			},
		});
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.transaction.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.stockMovement.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.attendance.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.employee.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.product.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.warehouse.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.contact.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.deleteMany({ where: { id: testOrgId } });
		await closePrisma();
	});

	it("should return 401 when token is missing", async () => {
		const response = await request(app).get("/api/ai/insights/executive");

		expect(response.status).toBe(401);
	});

	it("should return executive insights for authenticated user", async () => {
		const response = await request(app)
			.get("/api/ai/insights/executive")
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("revenueInsights");
		expect(response.body).toHaveProperty("expenseInsights");
		expect(response.body).toHaveProperty("inventoryInsights");
		expect(response.body).toHaveProperty("cashFlowInsights");
		expect(response.body).toHaveProperty("hrInsights");
		expect(response.body).toHaveProperty("generatedAt");
	});

	it("should return CEO report in JSON format", async () => {
		const response = await request(app)
			.get("/api/ai/insights/ceo-report")
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("summary");
		expect(response.body).toHaveProperty("highlights");
		expect(response.body).toHaveProperty("risks");
		expect(response.body).toHaveProperty("recommendations");
		expect(response.body).toHaveProperty("predictiveSignals");
	});

	it("should return CEO report in text format", async () => {
		const response = await request(app)
			.get("/api/ai/insights/ceo-report")
			.query({ format: "text" })
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("text/plain");
		expect(response.text).toContain("CAMBLISS CEO EXECUTIVE REPORT");
		expect(response.text).toContain("SUMMARY");
	});

	it("should reject unsupported CEO report format", async () => {
		const response = await request(app)
			.get("/api/ai/insights/ceo-report")
			.query({ format: "xml" })
			.set("Authorization", `Bearer ${authToken}`);

		expect(response.status).toBe(400);
		expect(response.body.error).toContain("Invalid format");
	});
});
