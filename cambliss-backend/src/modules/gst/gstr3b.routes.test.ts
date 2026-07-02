import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import prisma from "../../config/prisma";
import gstr3bRoutes from "./gstr3b.routes";
import { RoleName } from "@prisma/client";

const app = express();
let activeOrgId = "test-org-id";

app.use(express.json());
app.use((req, _res, next) => {
	(req as any).user = {
		id: "test-user-id",
		email: "tester@example.com",
		organizationId: activeOrgId,
		role: RoleName.ADMIN,
	};
	next();
});
app.use("/api/gst", gstr3bRoutes);

describe("GSTR-3B API Routes", () => {
	let testOrgId: string;
	let contactId = "";

	beforeAll(async () => {
		const org = await prisma.organization.create({ data: { name: "GSTR3B Routes Test Org" } });
		testOrgId = org.id;
		activeOrgId = org.id;

		const contact = await prisma.contact.create({
			data: {
				organizationId: testOrgId,
				type: "CUSTOMER",
				firstName: "Route",
				lastName: "Customer",
				email: "gstr3b-route@test.com",
			},
		});
		contactId = contact.id;
	});

	afterAll(async () => {
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.contact.deleteMany({ where: { organizationId: testOrgId } });
		await prisma.organization.delete({ where: { id: testOrgId } });
	});

	beforeEach(async () => {
		await prisma.invoice.deleteMany({ where: { organizationId: testOrgId } });
	});

	it("returns summary json by default", async () => {
		await prisma.invoice.create({
			data: {
				organizationId: testOrgId,
				customerId: contactId,
				invoiceNumber: "INV-GSTR3B-001",
				issuedAt: new Date(2026, 0, 15),
				status: "ISSUED",
				subtotal: 10000,
				cgstAmount: 900,
				sgstAmount: 900,
				igstAmount: 0,
				totalAmount: 11800,
				placeOfSupply: "27",
			},
		});

		const response = await request(app)
			.get("/api/gst/gstr3b/summary")
			.query({ month: 1, year: 2026 });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("outputGST");
		expect(response.body.outputGST.cgst).toBe(900);
		expect(response.body).toHaveProperty("period");
	});

	it("returns filing json when format=json-filing", async () => {
		const response = await request(app)
			.get("/api/gst/gstr3b/summary")
			.query({ month: 1, year: 2026, format: "json-filing" });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("ret_period");
		expect(response.body).toHaveProperty("sup_details");
	});

	it("returns text report when format=text", async () => {
		const response = await request(app)
			.get("/api/gst/gstr3b/summary")
			.query({ month: 1, year: 2026, format: "text" });

		expect(response.status).toBe(200);
		expect(response.text).toContain("GSTR-3B MONTHLY SUMMARY");
	});

	it("returns 400 when month or year is missing", async () => {
		const response = await request(app).get("/api/gst/gstr3b/summary").query({ month: 1 });
		expect(response.status).toBe(400);
	});

	it("returns payment challan payload", async () => {
		const response = await request(app)
			.get("/api/gst/gstr3b/payment-challan")
			.query({ month: 1, year: 2026 });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("paymentDetails");
		expect(Array.isArray(response.body.paymentDetails)).toBe(true);
		expect(response.body).toHaveProperty("totalPayable");
	});

	it("returns comparison payload", async () => {
		const response = await request(app)
			.get("/api/gst/gstr3b/comparison")
			.query({ year: 2026, months: 2 });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("comparison");
		expect(Array.isArray(response.body.comparison)).toBe(true);
	});
});
