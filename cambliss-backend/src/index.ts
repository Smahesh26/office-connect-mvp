import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import adminRoutes from "./modules/admin/admin.routes";
import accountingRoutes from "./modules/accounting/accounting.routes";
import crmRoutes from "./modules/crm/crm.routes";
import hrmRoutes from "./modules/hrm/hrm.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import filesRoutes from "./modules/files/files.routes";
import plansRoutes from "./modules/plans/plans.routes";
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import projectRoutes from "./modules/project/project.routes";
import posRoutes from "./modules/pos/pos.routes";
import invoicingRoutes from "./modules/invoicing/invoicing.routes";
import gstRoutes from "./modules/gst/gst.routes";
import aiInsightsRoutes from "./modules/ai/insights.routes";
import authRoutes from "./modules/auth/auth.routes";
import chatRoutes from "./modules/chat/chat.routes";
import userManagementRoutes from "./modules/user-management/user-management.routes";
import toolsRoutes from "./modules/tools/tools.routes";
import videoConnectRoutes from "./modules/video-connect/video-connect.routes";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

// Safe defaults including production domains when CORS_ORIGINS is not configured.
const effectiveOrigins = allowedOrigins.length > 0
	? allowedOrigins
	: [
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://127.0.0.1:3002",
			"http://200.141.13.198",
			"https://200.141.13.198",
			"http://theofficeconnect.com",
			"https://theofficeconnect.com",
			"http://www.theofficeconnect.com",
			"https://www.theofficeconnect.com",
	  ];

app.use(helmet());

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || effectiveOrigins.includes(origin) || origin.endsWith("theofficeconnect.com")) {
				callback(null, true);
				return;
			}
			callback(null, true);
		},
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Public Video Connect signaling routes (No auth token required for guest access)
app.use("/api/video-connect", videoConnectRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/hrm", hrmRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api", filesRoutes);
app.use("/api", plansRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api", projectRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/invoices", invoicingRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/ai/insights", aiInsightsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user-management", userManagementRoutes);

// Centralized error handler: prevents leaking stack traces / internals to clients
// (OWASP A05 Security Misconfiguration / A09 Logging & Monitoring). Details are
// logged server-side only; the response body stays generic.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	const isBadJson =
		typeof err === "object" &&
		err !== null &&
		(err as { type?: string }).type === "entity.parse.failed";

	const status = isBadJson ? 400 : ((err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode ?? 500);

	// Log full detail server-side for diagnostics.
	console.error("[unhandled-error]", err);

	if (res.headersSent) {
		return;
	}

	res.status(status).json({
		message: isBadJson ? "Malformed request body" : status < 500 ? "Request could not be processed" : "Internal server error",
	});
});

export default app;