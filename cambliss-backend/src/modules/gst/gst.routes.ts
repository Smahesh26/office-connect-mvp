import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth.middleware";
import {
	createGSTConfigController,
	getGSTConfigController,
	updateGSTConfigController,
	deleteGSTConfigController,
	generateGSTReportController,
	generateGSTR1Controller,
	calculateGSTController,
	exportEInvoiceJSONController,
} from "./gst.controller";
import gstrRoutes from "./gstr.routes";
import gstr3bRoutes from "./gstr3b.routes";
import ewayRoutes from "./eway.routes";

const gstRouter = Router();

// All routes require authentication
gstRouter.use(authenticateJWT);

// GST Configuration
gstRouter.post("/config/:organizationId", createGSTConfigController);
gstRouter.get("/config/:organizationId", getGSTConfigController);
gstRouter.put("/config/:organizationId", updateGSTConfigController);
gstRouter.delete("/config/:organizationId", deleteGSTConfigController);

// GST Reporting
gstRouter.post("/report/:organizationId", generateGSTReportController);

// GSTR-1 Export
gstRouter.post("/gstr1/:organizationId", generateGSTR1Controller);

// NIC-ready e-invoice JSON export
gstRouter.get("/einvoice/:invoiceId/export", exportEInvoiceJSONController);

// GST Calculation Utility
gstRouter.post("/calculate", calculateGSTController);

// GSTR-1 detailed routes (report generation, CSV export, etc.)
gstRouter.use("/", gstrRoutes);

// GSTR-3B routes (monthly summary, payment challan, etc.)
gstRouter.use("/", gstr3bRoutes);

// E-Way Bill routes (validation, generation, download, etc.)
gstRouter.use("/", ewayRoutes);

export default gstRouter;
