"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTxtToPptx = exports.convertPptxToTxt = exports.convertTxtToDocx = exports.convertPdfToTxt = exports.convertCsvToXlsx = exports.convertXlsxToCsv = exports.convertDocxToPdf = exports.convertPdfToDocx = exports.removeImageBackgroundAdvanced = exports.removeImageBackground = exports.upscaleImageFile = exports.compressPdfFile = exports.splitPdfFile = exports.mergePdfFiles = exports.extractDocumentText = exports.getDailyUtilityCatalog = exports.generateQrCode = exports.convertCurrency = exports.ToolsError = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const tesseract_js_1 = require("tesseract.js");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const pdf_lib_1 = require("pdf-lib");
const sharp_1 = __importDefault(require("sharp"));
const mammoth_1 = __importDefault(require("mammoth"));
const docx_1 = require("docx");
const exceljs_1 = __importDefault(require("exceljs"));
const sync_1 = require("csv-parse/sync");
const pptxgenjs_1 = __importDefault(require("pptxgenjs"));
const jszip_1 = __importDefault(require("jszip"));
const { PDFParse } = pdf_parse_1.default;
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const LIBREOFFICE_BIN = ((_a = process.env.LIBREOFFICE_BIN) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = process.env.LIBREOFFICE_PATH) === null || _b === void 0 ? void 0 : _b.trim()) || "soffice";
class ToolsError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = "ToolsError";
        this.statusCode = statusCode;
    }
}
exports.ToolsError = ToolsError;
const parsePositiveNumber = (value, fallback) => {
    const parsed = Number(value !== null && value !== void 0 ? value : fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new ToolsError(400, "Amount must be a positive number");
    }
    return parsed;
};
const normalizeCurrency = (value, fallback) => {
    const normalized = (value !== null && value !== void 0 ? value : fallback).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
        throw new ToolsError(400, "Currency must be a 3-letter ISO code");
    }
    return normalized;
};
const convertCurrency = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const amount = parsePositiveNumber(params.amount, 1);
    const from = normalizeCurrency(params.from, "USD");
    const to = normalizeCurrency(params.to, "INR");
    if (from === to) {
        return {
            provider: "frankfurter",
            amount,
            from,
            to,
            convertedAmount: amount,
            rate: 1,
        };
    }
    const endpoint = `https://api.frankfurter.app/latest?amount=${encodeURIComponent(String(amount))}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const response = yield fetch(endpoint);
    if (!response.ok) {
        throw new ToolsError(502, "Currency provider is unavailable");
    }
    const data = (yield response.json());
    const convertedAmount = (_a = data.rates) === null || _a === void 0 ? void 0 : _a[to];
    if (typeof convertedAmount !== "number" || !Number.isFinite(convertedAmount)) {
        throw new ToolsError(502, "Currency conversion failed");
    }
    return {
        provider: "frankfurter",
        amount,
        from,
        to,
        convertedAmount,
        rate: convertedAmount / amount,
    };
});
exports.convertCurrency = convertCurrency;
const generateQrCode = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const text = ((_a = params.text) !== null && _a !== void 0 ? _a : "").trim();
    if (!text) {
        throw new ToolsError(400, "text is required");
    }
    if (text.length > 2048) {
        throw new ToolsError(400, "text exceeds 2048 characters");
    }
    const size = Math.min(Math.max(Number((_b = params.size) !== null && _b !== void 0 ? _b : 256) || 256, 128), 1024);
    const dataUrl = yield qrcode_1.default.toDataURL(text, {
        errorCorrectionLevel: "M",
        width: size,
        margin: 1,
    });
    return {
        text,
        size,
        dataUrl,
    };
});
exports.generateQrCode = generateQrCode;
const getDailyUtilityCatalog = () => {
    return [
        {
            id: "currency-converter",
            name: "Currency Converter",
            category: "Finance",
            dailyUseCase: "Quick cross-country invoice and quote conversion",
            status: "integrated",
            provider: "Frankfurter (open data)",
        },
        {
            id: "qr-generator",
            name: "QR Generator",
            category: "Operations",
            dailyUseCase: "Share links, payment handles, and file URLs",
            status: "integrated",
            provider: "qrcode (open-source)",
        },
        {
            id: "pdf-tools",
            name: "PDF Merge / Split / Compress",
            category: "Documents",
            dailyUseCase: "Combine invoices, split reports, reduce upload size",
            status: "integrated",
            provider: "pdf-lib (open-source)",
        },
        {
            id: "ocr",
            name: "OCR Image/PDF to Text",
            category: "Documents",
            dailyUseCase: "Extract text from receipts, IDs, and scanned docs",
            status: "integrated",
            provider: "Tesseract/OCRmyPDF (open-source)",
        },
        {
            id: "image-upscaler",
            name: "Image Upscaler",
            category: "Media",
            dailyUseCase: "Improve low-resolution logos, product photos, banners",
            status: "integrated",
            provider: "sharp (open-source)",
        },
        {
            id: "background-removal",
            name: "Background Removal",
            category: "Media",
            dailyUseCase: "Create clean product cutouts for ecommerce",
            status: "integrated",
            provider: "sharp heuristic (open-source)",
        },
        {
            id: "document-converters",
            name: "Document Converters",
            category: "Documents",
            dailyUseCase: "PDF to Word, Word to PDF, Excel to CSV, PPT to text and more",
            status: "integrated",
            provider: "mammoth / docx / xlsx / pptxgenjs / pdfkit",
        },
    ];
};
exports.getDailyUtilityCatalog = getDailyUtilityCatalog;
const getFileKind = (mimeType) => {
    if (mimeType === "application/pdf") {
        return "pdf";
    }
    if (mimeType.startsWith("image/")) {
        return "image";
    }
    return "unsupported";
};
const extractTextFromPdf = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const buffer = yield promises_1.default.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    yield parser.load();
    const result = yield parser.getText();
    return ((_a = result.text) !== null && _a !== void 0 ? _a : "").trim();
});
const extractTextFromImage = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const worker = yield (0, tesseract_js_1.createWorker)("eng");
    try {
        const result = yield worker.recognize(filePath);
        return ((_a = result.data.text) !== null && _a !== void 0 ? _a : "").trim();
    }
    finally {
        yield worker.terminate();
    }
});
const extractDocumentText = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    const resolvedPath = path_1.default.resolve(file.path);
    const kind = getFileKind(file.mimetype || "");
    if (kind === "unsupported") {
        throw new ToolsError(400, "Unsupported file type. Upload PDF or image files.");
    }
    const extractedText = kind === "pdf" ? yield extractTextFromPdf(resolvedPath) : yield extractTextFromImage(resolvedPath);
    return {
        fileName: file.originalname,
        mimeType: file.mimetype,
        kind,
        extractedText,
        characterCount: extractedText.length,
        preview: extractedText.slice(0, 800),
    };
});
exports.extractDocumentText = extractDocumentText;
const assertPdfFile = (file) => {
    if (!file) {
        throw new ToolsError(400, "PDF file is required");
    }
    if (file.mimetype !== "application/pdf") {
        throw new ToolsError(400, "Only PDF files are supported for this operation");
    }
    return file;
};
const toPdfDataUrl = (bytes) => {
    const base64 = Buffer.from(bytes).toString("base64");
    return `data:application/pdf;base64,${base64}`;
};
const parsePageSelection = (selection, totalPages) => {
    const normalized = selection.trim();
    if (!normalized) {
        throw new ToolsError(400, "pages query is required. Example: 1,3-5");
    }
    const selected = new Set();
    for (const token of normalized.split(",")) {
        const part = token.trim();
        if (!part) {
            continue;
        }
        if (part.includes("-")) {
            const [rawStart, rawEnd] = part.split("-").map((value) => value.trim());
            const start = Number(rawStart);
            const end = Number(rawEnd);
            if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > totalPages) {
                throw new ToolsError(400, `Invalid page range: ${part}`);
            }
            for (let page = start; page <= end; page += 1) {
                selected.add(page - 1);
            }
            continue;
        }
        const pageNumber = Number(part);
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
            throw new ToolsError(400, `Invalid page number: ${part}`);
        }
        selected.add(pageNumber - 1);
    }
    if (selected.size === 0) {
        throw new ToolsError(400, "No valid pages selected");
    }
    return Array.from(selected).sort((a, b) => a - b);
};
const mergePdfFiles = (files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Array.isArray(files) || files.length < 2) {
        throw new ToolsError(400, "At least two PDF files are required");
    }
    for (const file of files) {
        assertPdfFile(file);
    }
    const mergedDocument = yield pdf_lib_1.PDFDocument.create();
    for (const file of files) {
        const bytes = yield promises_1.default.readFile(path_1.default.resolve(file.path));
        const doc = yield pdf_lib_1.PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageIndices = doc.getPageIndices();
        const copiedPages = yield mergedDocument.copyPages(doc, pageIndices);
        for (const page of copiedPages) {
            mergedDocument.addPage(page);
        }
    }
    const mergedBytes = yield mergedDocument.save({ useObjectStreams: true });
    return {
        fileName: "merged.pdf",
        pageCount: mergedDocument.getPageCount(),
        dataUrl: toPdfDataUrl(mergedBytes),
    };
});
exports.mergePdfFiles = mergePdfFiles;
const splitPdfFile = (file, pagesSelection) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFile = assertPdfFile(file);
    const bytes = yield promises_1.default.readFile(path_1.default.resolve(sourceFile.path));
    const source = yield pdf_lib_1.PDFDocument.load(bytes, { ignoreEncryption: true });
    const selectedPageIndices = parsePageSelection(pagesSelection, source.getPageCount());
    const destination = yield pdf_lib_1.PDFDocument.create();
    const copiedPages = yield destination.copyPages(source, selectedPageIndices);
    for (const page of copiedPages) {
        destination.addPage(page);
    }
    const splitBytes = yield destination.save({ useObjectStreams: true });
    return {
        fileName: "split.pdf",
        selectedPages: selectedPageIndices.map((value) => value + 1),
        pageCount: destination.getPageCount(),
        dataUrl: toPdfDataUrl(splitBytes),
    };
});
exports.splitPdfFile = splitPdfFile;
const compressPdfFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFile = assertPdfFile(file);
    const bytes = yield promises_1.default.readFile(path_1.default.resolve(sourceFile.path));
    const source = yield pdf_lib_1.PDFDocument.load(bytes, { ignoreEncryption: true });
    const compressedBytes = yield source.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
    });
    return {
        fileName: "compressed.pdf",
        originalSizeBytes: bytes.byteLength,
        compressedSizeBytes: compressedBytes.byteLength,
        dataUrl: toPdfDataUrl(compressedBytes),
    };
});
exports.compressPdfFile = compressPdfFile;
const toImageDataUrl = (bytes, mimeType) => {
    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${mimeType};base64,${base64}`;
};
const toFileDataUrl = (bytes, mimeType) => {
    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${mimeType};base64,${base64}`;
};
const normalizeDownloadName = (name, extension) => {
    const stripped = name.replace(/\.[^.]+$/, "");
    return `${stripped}.${extension}`;
};
const convertWithLibreOffice = (inputFilePath, targetExtension) => __awaiter(void 0, void 0, void 0, function* () {
    const tempDir = yield promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), "cambliss-lo-"));
    const copiedInputPath = path_1.default.join(tempDir, path_1.default.basename(inputFilePath));
    yield promises_1.default.copyFile(inputFilePath, copiedInputPath);
    try {
        yield execFileAsync(LIBREOFFICE_BIN, [
            "--headless",
            "--nologo",
            "--nodefault",
            "--nolockcheck",
            "--norestore",
            "--convert-to",
            targetExtension,
            "--outdir",
            tempDir,
            copiedInputPath,
        ], { timeout: 60000 });
        const outputPath = path_1.default.join(tempDir, `${path_1.default.parse(copiedInputPath).name}.${targetExtension}`);
        return yield promises_1.default.readFile(outputPath);
    }
    finally {
        yield promises_1.default.rm(tempDir, { recursive: true, force: true });
    }
});
const safeSheetName = (name) => name.replace(/[\[\]\*\?:\/\\]/g, " ").slice(0, 31) || "Sheet1";
const buildTextDocument = (title, text) => __awaiter(void 0, void 0, void 0, function* () {
    const lines = text.split(/\r?\n/);
    const children = [
        new docx_1.Paragraph({
            heading: docx_1.HeadingLevel.HEADING_1,
            children: [new docx_1.TextRun(title)],
        }),
        ...lines.map((line) => new docx_1.Paragraph({ children: [new docx_1.TextRun(line || " ")] })),
    ];
    const document = new docx_1.Document({
        sections: [{ children }],
    });
    return docx_1.Packer.toBuffer(document);
});
const readDocxText = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield mammoth_1.default.extractRawText({ path: filePath });
    return ((_a = result.value) !== null && _a !== void 0 ? _a : "").trim();
});
const readCsvRows = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const raw = yield promises_1.default.readFile(filePath, "utf8");
    return (0, sync_1.parse)(raw, {
        skip_empty_lines: true,
        relax_column_count: true,
    });
});
const createPdfFromText = (title, text) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const pdfKitModule = yield Promise.resolve().then(() => __importStar(require("pdfkit")));
    const PdfKit = (_a = pdfKitModule.default) !== null && _a !== void 0 ? _a : pdfKitModule;
    const doc = new PdfKit({ margin: 40, size: "A4" });
    const chunks = [];
    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();
    for (const line of text.split(/\r?\n/)) {
        doc.fontSize(11).text(line || " ", { width: 515 });
    }
    doc.end();
    return yield new Promise((resolve, reject) => {
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
});
const REMBG_API_URL = ((_c = process.env.REMBG_API_URL) === null || _c === void 0 ? void 0 : _c.trim()) || "";
const REMBG_API_KEY = ((_d = process.env.REMBG_API_KEY) === null || _d === void 0 ? void 0 : _d.trim()) || "";
const upscaleImageFile = (file, scaleRaw) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!file) {
        throw new ToolsError(400, "image file is required");
    }
    if (!((_a = file.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith("image/"))) {
        throw new ToolsError(400, "Only image files are supported");
    }
    const scale = Number(scaleRaw !== null && scaleRaw !== void 0 ? scaleRaw : "2");
    if (!Number.isInteger(scale) || scale < 2 || scale > 4) {
        throw new ToolsError(400, "scale must be 2, 3, or 4");
    }
    const inputPath = path_1.default.resolve(file.path);
    const image = (0, sharp_1.default)(inputPath, { failOn: "none" });
    const metadata = yield image.metadata();
    const originalWidth = (_b = metadata.width) !== null && _b !== void 0 ? _b : 0;
    const originalHeight = (_c = metadata.height) !== null && _c !== void 0 ? _c : 0;
    if (!originalWidth || !originalHeight) {
        throw new ToolsError(400, "Unable to detect image dimensions");
    }
    const targetWidth = Math.min(originalWidth * scale, 4096);
    const targetHeight = Math.min(originalHeight * scale, 4096);
    const format = metadata.format === "png" ? "png" : "jpeg";
    const output = format === "png"
        ? yield image.resize(targetWidth, targetHeight, { kernel: sharp_1.default.kernel.lanczos3 }).png({ compressionLevel: 9 }).toBuffer()
        : yield image.resize(targetWidth, targetHeight, { kernel: sharp_1.default.kernel.lanczos3 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const extension = format === "png" ? "png" : "jpg";
    return {
        fileName: `upscaled-${Date.now()}.${extension}`,
        dataUrl: toImageDataUrl(output, mimeType),
        mimeType,
        scale,
        originalWidth,
        originalHeight,
        upscaledWidth: targetWidth,
        upscaledHeight: targetHeight,
        originalSizeBytes: file.size,
        upscaledSizeBytes: output.byteLength,
    };
});
exports.upscaleImageFile = upscaleImageFile;
const colorDistance = (a, b) => {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};
const averageCornerColor = (data, width, height) => {
    var _a, _b, _c;
    const points = [
        0,
        width - 1,
        (width * (height - 1)),
        (width * height) - 1,
    ];
    let r = 0;
    let g = 0;
    let b = 0;
    for (const point of points) {
        const offset = point * 4;
        r += (_a = data[offset]) !== null && _a !== void 0 ? _a : 0;
        g += (_b = data[offset + 1]) !== null && _b !== void 0 ? _b : 0;
        b += (_c = data[offset + 2]) !== null && _c !== void 0 ? _c : 0;
    }
    return {
        r: Math.round(r / points.length),
        g: Math.round(g / points.length),
        b: Math.round(b / points.length),
    };
};
const removeImageBackground = (file, toleranceRaw) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (!file) {
        throw new ToolsError(400, "image file is required");
    }
    if (!((_a = file.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith("image/"))) {
        throw new ToolsError(400, "Only image files are supported");
    }
    const tolerance = Number(toleranceRaw !== null && toleranceRaw !== void 0 ? toleranceRaw : "42");
    if (!Number.isFinite(tolerance) || tolerance < 10 || tolerance > 120) {
        throw new ToolsError(400, "tolerance must be between 10 and 120");
    }
    const inputPath = path_1.default.resolve(file.path);
    const normalized = (0, sharp_1.default)(inputPath, { failOn: "none" }).rotate();
    const metadata = yield normalized.metadata();
    const width = (_b = metadata.width) !== null && _b !== void 0 ? _b : 0;
    const height = (_c = metadata.height) !== null && _c !== void 0 ? _c : 0;
    if (!width || !height) {
        throw new ToolsError(400, "Unable to detect image dimensions");
    }
    const raw = yield normalized.ensureAlpha().raw().toBuffer();
    const output = Buffer.from(raw);
    const bgColor = averageCornerColor(output, width, height);
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;
    const enqueue = (index) => {
        if (visited[index]) {
            return;
        }
        visited[index] = 1;
        queue[tail] = index;
        tail += 1;
    };
    enqueue(0);
    enqueue(width - 1);
    enqueue((width * (height - 1)));
    enqueue((width * height) - 1);
    while (head < tail) {
        const index = queue[head];
        head += 1;
        const x = index % width;
        const y = Math.floor(index / width);
        const offset = index * 4;
        const pixel = {
            r: (_d = output[offset]) !== null && _d !== void 0 ? _d : 0,
            g: (_e = output[offset + 1]) !== null && _e !== void 0 ? _e : 0,
            b: (_f = output[offset + 2]) !== null && _f !== void 0 ? _f : 0,
        };
        if (colorDistance(pixel, bgColor) > tolerance) {
            continue;
        }
        output[offset + 3] = 0;
        if (x > 0) {
            enqueue(index - 1);
        }
        if (x < width - 1) {
            enqueue(index + 1);
        }
        if (y > 0) {
            enqueue(index - width);
        }
        if (y < height - 1) {
            enqueue(index + width);
        }
    }
    const png = yield (0, sharp_1.default)(output, {
        raw: {
            width,
            height,
            channels: 4,
        },
    }).png({ compressionLevel: 9 }).toBuffer();
    return {
        png,
        width,
        height,
    };
});
exports.removeImageBackground = removeImageBackground;
const removeImageBackgroundWithRemBg = (file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!REMBG_API_URL) {
        throw new ToolsError(400, "REMBG_API_URL is not configured");
    }
    const imageBytes = yield promises_1.default.readFile(path_1.default.resolve(file.path));
    const formData = new FormData();
    formData.append("file", new Blob([imageBytes], { type: file.mimetype || "application/octet-stream" }), file.originalname || "input-image");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const headers = {};
        if (REMBG_API_KEY) {
            headers.Authorization = `Bearer ${REMBG_API_KEY}`;
        }
        const response = yield fetch(REMBG_API_URL, {
            method: "POST",
            headers,
            body: formData,
            signal: controller.signal,
        });
        if (!response.ok) {
            const failureBody = yield response.text().catch(() => "");
            throw new ToolsError(502, `rembg request failed: ${response.status}${failureBody ? ` - ${failureBody.slice(0, 120)}` : ""}`);
        }
        const arrayBuffer = yield response.arrayBuffer();
        const png = Buffer.from(arrayBuffer);
        if (png.byteLength === 0) {
            throw new ToolsError(502, "rembg returned empty output");
        }
        const metadata = yield (0, sharp_1.default)(png).metadata();
        return {
            png,
            width: (_a = metadata.width) !== null && _a !== void 0 ? _a : 0,
            height: (_b = metadata.height) !== null && _b !== void 0 ? _b : 0,
        };
    }
    finally {
        clearTimeout(timeout);
    }
});
const removeImageBackgroundAdvanced = (file, toleranceRaw, modeRaw) => __awaiter(void 0, void 0, void 0, function* () {
    const requestedMode = (modeRaw !== null && modeRaw !== void 0 ? modeRaw : "auto").trim().toLowerCase();
    if (!["auto", "heuristic", "rembg"].includes(requestedMode)) {
        throw new ToolsError(400, "mode must be auto, heuristic, or rembg");
    }
    let usedMode = "heuristic";
    let fallbackUsed = false;
    let result;
    if (requestedMode === "heuristic") {
        result = yield (0, exports.removeImageBackground)(file, toleranceRaw);
    }
    else if (requestedMode === "rembg") {
        result = yield removeImageBackgroundWithRemBg(file);
        usedMode = "rembg";
    }
    else if (REMBG_API_URL) {
        try {
            result = yield removeImageBackgroundWithRemBg(file);
            usedMode = "rembg";
        }
        catch (_a) {
            result = yield (0, exports.removeImageBackground)(file, toleranceRaw);
            usedMode = "heuristic";
            fallbackUsed = true;
        }
    }
    else {
        result = yield (0, exports.removeImageBackground)(file, toleranceRaw);
    }
    const tolerance = Number(toleranceRaw !== null && toleranceRaw !== void 0 ? toleranceRaw : "42");
    return {
        fileName: `background-removed-${Date.now()}.png`,
        dataUrl: toImageDataUrl(result.png, "image/png"),
        mimeType: "image/png",
        tolerance,
        width: result.width,
        height: result.height,
        modeRequested: requestedMode,
        modeUsed: usedMode,
        fallbackUsed,
        originalSizeBytes: file.size,
        processedSizeBytes: result.png.byteLength,
    };
});
exports.removeImageBackgroundAdvanced = removeImageBackgroundAdvanced;
const convertPdfToDocx = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFile = assertPdfFile(file);
    let pdfText = "";
    let buffer;
    try {
        buffer = yield convertWithLibreOffice(path_1.default.resolve(sourceFile.path), "docx");
    }
    catch (_a) {
        pdfText = yield extractTextFromPdf(path_1.default.resolve(sourceFile.path));
        buffer = yield buildTextDocument(sourceFile.originalname || "PDF to Word", pdfText || "No text detected in the PDF.");
    }
    return {
        fileName: normalizeDownloadName(sourceFile.originalname || "converted", "docx"),
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        characterCount: pdfText.length,
    };
});
exports.convertPdfToDocx = convertPdfToDocx;
const convertDocxToPdf = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.originalname.toLowerCase().endsWith(".docx"))) {
        throw new ToolsError(400, "Only DOCX files are supported");
    }
    let text = "";
    let pdfBuffer;
    try {
        pdfBuffer = yield convertWithLibreOffice(path_1.default.resolve(file.path), "pdf");
    }
    catch (_a) {
        text = yield readDocxText(path_1.default.resolve(file.path));
        pdfBuffer = yield createPdfFromText(file.originalname || "Word to PDF", text || "No text detected in the DOCX.");
    }
    return {
        fileName: normalizeDownloadName(file.originalname || "converted", "pdf"),
        mimeType: "application/pdf",
        dataUrl: toFileDataUrl(pdfBuffer, "application/pdf"),
        characterCount: text.length,
    };
});
exports.convertDocxToPdf = convertDocxToPdf;
const convertXlsxToCsv = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.originalname.toLowerCase().endsWith(".xlsx"))) {
        throw new ToolsError(400, "Only XLSX files are supported");
    }
    let sheetName = path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)) || "Sheet1";
    let csv = "";
    try {
        const converted = yield convertWithLibreOffice(path_1.default.resolve(file.path), "csv");
        csv = converted.toString("utf8");
    }
    catch (_a) {
        const workbook = new exceljs_1.default.Workbook();
        yield workbook.xlsx.readFile(path_1.default.resolve(file.path));
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new ToolsError(400, "Workbook has no sheets");
        }
        sheetName = worksheet.name || sheetName;
        const csvBuffer = yield workbook.csv.writeBuffer();
        csv = Buffer.from(csvBuffer).toString("utf8");
    }
    return {
        fileName: normalizeDownloadName(file.originalname || sheetName, "csv"),
        mimeType: "text/csv",
        dataUrl: toFileDataUrl(Buffer.from(csv, "utf8"), "text/csv"),
        sheetName,
        rowCount: csv.split(/\r?\n/).filter(Boolean).length,
    };
});
exports.convertXlsxToCsv = convertXlsxToCsv;
const convertCsvToXlsx = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    if (!(file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv"))) {
        throw new ToolsError(400, "Only CSV files are supported");
    }
    let rows = [];
    let buffer;
    try {
        buffer = yield convertWithLibreOffice(path_1.default.resolve(file.path), "xlsx");
        rows = yield readCsvRows(path_1.default.resolve(file.path));
    }
    catch (_a) {
        rows = yield readCsvRows(path_1.default.resolve(file.path));
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet(safeSheetName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)) || "Sheet1"));
        worksheet.addRows(rows);
        buffer = Buffer.from(yield workbook.xlsx.writeBuffer());
    }
    return {
        fileName: normalizeDownloadName(file.originalname || "converted", "xlsx"),
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        rowCount: rows.length,
        columnCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
    };
});
exports.convertCsvToXlsx = convertCsvToXlsx;
const convertPdfToTxt = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const sourceFile = assertPdfFile(file);
    const text = yield extractTextFromPdf(path_1.default.resolve(sourceFile.path));
    return {
        fileName: normalizeDownloadName(sourceFile.originalname || "converted", "txt"),
        mimeType: "text/plain",
        dataUrl: toFileDataUrl(Buffer.from(text || "No text detected.", "utf8"), "text/plain"),
        characterCount: text.length,
    };
});
exports.convertPdfToTxt = convertPdfToTxt;
const convertTxtToDocx = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    const text = yield promises_1.default.readFile(path_1.default.resolve(file.path), "utf8");
    const buffer = yield buildTextDocument(file.originalname || "Text to Word", text || " ");
    return {
        fileName: normalizeDownloadName(file.originalname || "converted", "docx"),
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        characterCount: text.length,
    };
});
exports.convertTxtToDocx = convertTxtToDocx;
const convertPptxToTxt = (file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || file.originalname.toLowerCase().endsWith(".pptx"))) {
        throw new ToolsError(400, "Only PPTX files are supported");
    }
    let combined = "";
    let slideCount = 0;
    try {
        const converted = yield convertWithLibreOffice(path_1.default.resolve(file.path), "txt");
        combined = converted.toString("utf8").trim();
        slideCount = combined ? combined.split(/\n\n+/).filter(Boolean).length : 0;
    }
    catch (_b) {
        const zip = yield jszip_1.default.loadAsync(yield promises_1.default.readFile(path_1.default.resolve(file.path)));
        const entries = Object.keys(zip.files)
            .filter((entry) => entry.startsWith("ppt/slides/slide") && entry.endsWith(".xml"))
            .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
        const slideTexts = [];
        for (const entry of entries) {
            const xml = yield ((_a = zip.file(entry)) === null || _a === void 0 ? void 0 : _a.async("text"));
            if (!xml) {
                continue;
            }
            const textMatches = Array.from(xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)).map((match) => match[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
            if (textMatches.length > 0) {
                slideTexts.push(textMatches.join(" "));
            }
        }
        combined = slideTexts.length > 0 ? slideTexts.map((slide, index) => `Slide ${index + 1}: ${slide}`).join("\n\n") : "No readable slide text found.";
        slideCount = slideTexts.length;
    }
    return {
        fileName: normalizeDownloadName(file.originalname || "converted", "txt"),
        mimeType: "text/plain",
        dataUrl: toFileDataUrl(Buffer.from(combined, "utf8"), "text/plain"),
        slideCount,
        characterCount: combined.length,
    };
});
exports.convertPptxToTxt = convertPptxToTxt;
const convertTxtToPptx = (file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!file) {
        throw new ToolsError(400, "file is required");
    }
    const text = yield promises_1.default.readFile(path_1.default.resolve(file.path), "utf8");
    const presentation = new pptxgenjs_1.default();
    presentation.layout = "LAYOUT_WIDE";
    presentation.author = "Cambliss";
    const slide = presentation.addSlide();
    slide.addText(file.originalname || "Text to PowerPoint", { x: 0.6, y: 0.4, w: 12, h: 0.5, fontSize: 24, bold: true });
    slide.addText(text || " ", { x: 0.8, y: 1.2, w: 11.5, h: 5.5, fontSize: 16, breakLine: false, margin: 0.15, fit: "shrink" });
    const buffer = yield presentation.write({ outputType: "nodebuffer" });
    return {
        fileName: normalizeDownloadName(file.originalname || "converted", "pptx"),
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        characterCount: text.length,
        slideCount: 1,
    };
});
exports.convertTxtToPptx = convertTxtToPptx;
