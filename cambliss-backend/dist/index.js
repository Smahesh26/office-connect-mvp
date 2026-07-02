"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
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
const app = (0, express_1.default)();
const allowedOrigins = ((_a = process.env.CORS_ORIGINS) !== null && _a !== void 0 ? _a : "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length > 0
        ? (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error("CORS origin not allowed"));
        }
        : true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use("/api/admin", admin_routes_1.default);
app.use("/api/accounting", accounting_routes_1.default);
app.use("/api/crm", crm_routes_1.default);
app.use("/api/hrm", hrm_routes_1.default);
app.use("/api/inventory", inventory_routes_1.default);
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
exports.default = app;
