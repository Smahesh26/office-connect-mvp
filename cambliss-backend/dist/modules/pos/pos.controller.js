"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateZReportController = exports.closePOSSessionController = exports.createPOSOrderController = exports.startPOSSessionController = exports.createPOSTerminalController = void 0;
const pos_service_1 = require("./pos.service");
const handleError = (res, error) => {
    if (error instanceof pos_service_1.POSError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
const getOrganizationId = (req) => {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        throw new pos_service_1.POSError(401, "Unauthorized");
    }
    return organizationId;
};
const createPOSTerminalController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const terminal = yield (0, pos_service_1.createPOSTerminal)(organizationId, req.body);
        res.status(201).json(terminal);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createPOSTerminalController = createPOSTerminalController;
const startPOSSessionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const organizationId = getOrganizationId(req);
        const { terminalId, openingCash } = req.body;
        const openedBy = (_d = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (_c = req.user) === null || _c === void 0 ? void 0 : _c.email) !== null && _d !== void 0 ? _d : "SYSTEM";
        const session = yield (0, pos_service_1.startPOSSession)(organizationId, {
            terminalId,
            openedBy,
            openingCash,
        });
        res.status(201).json(session);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.startPOSSessionController = startPOSSessionController;
const createPOSOrderController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const order = yield (0, pos_service_1.createPOSOrder)(organizationId, req.body);
        res.status(201).json(order);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.createPOSOrderController = createPOSOrderController;
const closePOSSessionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const { sessionId, closingCash } = req.body;
        const result = yield (0, pos_service_1.closePOSSession)(organizationId, sessionId, closingCash);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.closePOSSessionController = closePOSSessionController;
const generateZReportController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const organizationId = getOrganizationId(req);
        const sessionIdParam = req.params.sessionId;
        const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
        if (!(sessionId === null || sessionId === void 0 ? void 0 : sessionId.trim())) {
            throw new pos_service_1.POSError(400, "sessionId is required");
        }
        const report = yield (0, pos_service_1.generateZReport)(organizationId, sessionId);
        res.status(200).json(report);
    }
    catch (error) {
        handleError(res, error);
    }
});
exports.generateZReportController = generateZReportController;
