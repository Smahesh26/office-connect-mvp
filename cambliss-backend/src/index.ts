import express from "express";
import path from "path";
import cors from "cors";
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

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	cors({
		origin:
			allowedOrigins.length > 0
				? (origin, callback) => {
					if (!origin || allowedOrigins.includes(origin)) {
						callback(null, true);
						return;
					}
					callback(new Error("CORS origin not allowed"));
				}
				: true,
		credentials: true,
	})
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/admin", adminRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/hrm", hrmRoutes);
app.use("/api/inventory", inventoryRoutes);
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

export default app;