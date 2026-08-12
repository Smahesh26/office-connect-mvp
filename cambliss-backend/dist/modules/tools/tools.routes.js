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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("../../config/multer");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const promises_1 = __importDefault(require("fs/promises"));
const tools_service_1 = require("./tools.service");
const toolsRouter = (0, express_1.Router)();
// Abuse/DoS protection: these endpoints are resource-intensive (OCR, PDF, image,
// document conversion) and reachable without auth, so cap request volume per IP.
toolsRouter.use((0, rate_limit_middleware_1.createRateLimitMiddleware)({
    keyPrefix: "tools",
    max: Number(process.env.TOOLS_RATE_LIMIT_MAX) || 30,
    windowMs: Number(process.env.TOOLS_RATE_LIMIT_WINDOW_MS) || 60000,
}));
// Require authentication for all tool endpoints (prevents anonymous resource abuse).
toolsRouter.use(auth_middleware_1.authenticateJWT);
const cleanupUploadedFiles = (files) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.allSettled(files
        .filter((file) => Boolean(file === null || file === void 0 ? void 0 : file.path))
        .map((file) => promises_1.default.unlink(file.path)));
});
const handleToolsError = (res, error) => {
    if (error instanceof tools_service_1.ToolsError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }
    res.status(500).json({ message: "Internal server error" });
};
toolsRouter.get("/currency/convert", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, tools_service_1.convertCurrency)({
            amount: req.query.amount,
            from: req.query.from,
            to: req.query.to,
        });
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
}));
toolsRouter.post("/qr/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const result = yield (0, tools_service_1.generateQrCode)({
            text: (_a = req.body) === null || _a === void 0 ? void 0 : _a.text,
            size: (_b = req.body) === null || _b === void 0 ? void 0 : _b.size,
        });
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
}));
toolsRouter.post("/ocr/extract", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.extractDocumentText)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/pdf/merge", multer_1.upload.array("files", 10), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const files = (_a = req.files) !== null && _a !== void 0 ? _a : [];
    try {
        const result = yield (0, tools_service_1.mergePdfFiles)(files);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles(files);
    }
}));
toolsRouter.post("/pdf/split", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const pages = String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.pages) !== null && _b !== void 0 ? _b : "");
        const result = yield (0, tools_service_1.splitPdfFile)(req.file, pages);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/pdf/compress", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.compressPdfFile)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/image/upscale", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.upscaleImageFile)(req.file, String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.scale) !== null && _b !== void 0 ? _b : "2"));
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/image/remove-background", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.removeImageBackgroundAdvanced)(req.file, String((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.tolerance) !== null && _b !== void 0 ? _b : "42"), String((_d = (_c = req.body) === null || _c === void 0 ? void 0 : _c.mode) !== null && _d !== void 0 ? _d : "auto"));
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/pdf-to-docx", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertPdfToDocx)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/docx-to-pdf", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertDocxToPdf)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/xlsx-to-csv", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertXlsxToCsv)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/csv-to-xlsx", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertCsvToXlsx)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/pdf-to-txt", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertPdfToTxt)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/txt-to-docx", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertTxtToDocx)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/pptx-to-txt", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertPptxToTxt)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.post("/convert/txt-to-pptx", multer_1.upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ message: "file is required" });
            return;
        }
        const result = yield (0, tools_service_1.convertTxtToPptx)(req.file);
        res.status(200).json(result);
    }
    catch (error) {
        handleToolsError(res, error);
    }
    finally {
        yield cleanupUploadedFiles([req.file]);
    }
}));
toolsRouter.get("/daily-catalog", (_req, res) => {
    res.status(200).json({
        items: (0, tools_service_1.getDailyUtilityCatalog)(),
    });
});
exports.default = toolsRouter;
