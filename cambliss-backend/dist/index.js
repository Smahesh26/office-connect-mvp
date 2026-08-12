"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const accounting_routes_1 = __importDefault(require("./modules/accounting/accounting.routes"));
const crm_routes_1 = __importDefault(require("./modules/crm/crm.routes"));
const hrm_routes_1 = __importDefault(require("./modules/hrm/hrm.routes"));
const inventory_routes_1 = __importDefault(require("./modules/inventory/inventory.routes"));
const files_routes_1 = __importDefault(require("./modules/files/files.routes"));
const plans_routes_1 = __importDefault(require("./modules/plans/plans.routes"));
const subscription_routes_1 = __importDefault(require("./modules/subscription/subscription.routes"));
const project_routes_1 = __importDefault(require("./modules/project/project.routes"));
const pos_routes_1 = __importDefault(require("./modules/pos/pos.routes"));
const invoicing_routes_1 = __importDefault(require("./modules/invoicing/invoicing.routes"));
const gst_routes_1 = __importDefault(require("./modules/gst/gst.routes"));
const insights_routes_1 = __importDefault(require("./modules/ai/insights.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const user_management_routes_1 = __importDefault(require("./modules/user-management/user-management.routes"));
const tools_routes_1 = __importDefault(require("./modules/tools/tools.routes"));
const app = (0, express_1.default)();
const allowedOrigins = ((_a = process.env.CORS_ORIGINS) !== null && _a !== void 0 ? _a : "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
// Safe defaults for local development when CORS_ORIGINS is not configured.
// Avoids reflecting arbitrary origins with credentials enabled (CWE-942).
const effectiveOrigins = allowedOrigins.length > 0
    ? allowedOrigins
    : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || effectiveOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/api/admin", admin_routes_1.default);
app.use("/api/accounting", accounting_routes_1.default);
app.use("/api/crm", crm_routes_1.default);
app.use("/api/hrm", hrm_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
app.use("/api/tools", tools_routes_1.default);
app.use("/api", files_routes_1.default);
app.use("/api", plans_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/subscription", subscription_routes_1.default);
app.use("/api", project_routes_1.default);
app.use("/api/pos", pos_routes_1.default);
app.use("/api/invoices", invoicing_routes_1.default);
app.use("/api/gst", gst_routes_1.default);
app.use("/api/ai/insights", insights_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
app.use("/api/user-management", user_management_routes_1.default);
// Centralized error handler: prevents leaking stack traces / internals to clients
// (OWASP A05 Security Misconfiguration / A09 Logging & Monitoring). Details are
// logged server-side only; the response body stays generic.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    var _a, _b;
    const isBadJson = typeof err === "object" &&
        err !== null &&
        err.type === "entity.parse.failed";
    const status = isBadJson ? 400 : ((_b = (_a = err === null || err === void 0 ? void 0 : err.status) !== null && _a !== void 0 ? _a : err === null || err === void 0 ? void 0 : err.statusCode) !== null && _b !== void 0 ? _b : 500);
    // Log full detail server-side for diagnostics.
    console.error("[unhandled-error]", err);
    if (res.headersSent) {
        return;
    }
    res.status(status).json({
        message: isBadJson ? "Malformed request body" : status < 500 ? "Request could not be processed" : "Internal server error",
    });
});
exports.default = app;
