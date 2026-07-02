"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const gst_controller_1 = require("./gst.controller");
const gstr_routes_1 = __importDefault(require("./gstr.routes"));
const gstr3b_routes_1 = __importDefault(require("./gstr3b.routes"));
const eway_routes_1 = __importDefault(require("./eway.routes"));
const gstRouter = (0, express_1.Router)();
// All routes require authentication
gstRouter.use(auth_middleware_1.authenticateJWT);
// GST Configuration
gstRouter.post("/config/:organizationId", gst_controller_1.createGSTConfigController);
gstRouter.get("/config/:organizationId", gst_controller_1.getGSTConfigController);
gstRouter.put("/config/:organizationId", gst_controller_1.updateGSTConfigController);
gstRouter.delete("/config/:organizationId", gst_controller_1.deleteGSTConfigController);
// GST Reporting
gstRouter.post("/report/:organizationId", gst_controller_1.generateGSTReportController);
// GSTR-1 Export
gstRouter.post("/gstr1/:organizationId", gst_controller_1.generateGSTR1Controller);
// NIC-ready e-invoice JSON export
gstRouter.get("/einvoice/:invoiceId/export", gst_controller_1.exportEInvoiceJSONController);
// GST Calculation Utility
gstRouter.post("/calculate", gst_controller_1.calculateGSTController);
// GSTR-1 detailed routes (report generation, CSV export, etc.)
gstRouter.use("/", gstr_routes_1.default);
// GSTR-3B routes (monthly summary, payment challan, etc.)
gstRouter.use("/", gstr3b_routes_1.default);
// E-Way Bill routes (validation, generation, download, etc.)
gstRouter.use("/", eway_routes_1.default);
exports.default = gstRouter;
