import QRCode from "qrcode";
import { createWorker } from "tesseract.js";
import pdfParse from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";

const { PDFParse } = pdfParse as unknown as { PDFParse: any };

const execFileAsync = promisify(execFile);
const LIBREOFFICE_BIN = process.env.LIBREOFFICE_BIN?.trim() || process.env.LIBREOFFICE_PATH?.trim() || "soffice";

export class ToolsError extends Error {
	statusCode: number;

	constructor(statusCode: number, message: string) {
		super(message);
		this.name = "ToolsError";
		this.statusCode = statusCode;
	}
}

const parsePositiveNumber = (value: string | undefined, fallback: number) => {
	const parsed = Number(value ?? fallback);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new ToolsError(400, "Amount must be a positive number");
	}
	return parsed;
};

const normalizeCurrency = (value: string | undefined, fallback: string) => {
	const normalized = (value ?? fallback).trim().toUpperCase();
	if (!/^[A-Z]{3}$/.test(normalized)) {
		throw new ToolsError(400, "Currency must be a 3-letter ISO code");
	}
	return normalized;
};

export const convertCurrency = async (params: {
	amount?: string;
	from?: string;
	to?: string;
}) => {
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
	const response = await fetch(endpoint);

	if (!response.ok) {
		throw new ToolsError(502, "Currency provider is unavailable");
	}

	const data = (await response.json()) as {
		amount?: number;
		base?: string;
		rates?: Record<string, number>;
	};

	const convertedAmount = data.rates?.[to];
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
};

export const generateQrCode = async (params: { text?: string; size?: number }) => {
	const text = (params.text ?? "").trim();
	if (!text) {
		throw new ToolsError(400, "text is required");
	}

	if (text.length > 2048) {
		throw new ToolsError(400, "text exceeds 2048 characters");
	}

	const size = Math.min(Math.max(Number(params.size ?? 256) || 256, 128), 1024);
	const dataUrl = await QRCode.toDataURL(text, {
		errorCorrectionLevel: "M",
		width: size,
		margin: 1,
	});

	return {
		text,
		size,
		dataUrl,
	};
};

export const getDailyUtilityCatalog = () => {
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

const getFileKind = (mimeType: string) => {
	if (mimeType === "application/pdf") {
		return "pdf";
	}

	if (mimeType.startsWith("image/")) {
		return "image";
	}

	return "unsupported";
};

const extractTextFromPdf = async (filePath: string) => {
	const buffer = await fs.readFile(filePath);
	const parser = new PDFParse({ data: buffer });
	await parser.load();
	const result = await parser.getText();
	return (result.text ?? "").trim();
};

const extractTextFromImage = async (filePath: string) => {
	const worker = await createWorker("eng");
	try {
		const result = await worker.recognize(filePath);
		return (result.data.text ?? "").trim();
	} finally {
		await worker.terminate();
	}
};

export const extractDocumentText = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	const resolvedPath = path.resolve(file.path);
	const kind = getFileKind(file.mimetype || "");
	if (kind === "unsupported") {
		throw new ToolsError(400, "Unsupported file type. Upload PDF or image files.");
	}

	const extractedText = kind === "pdf" ? await extractTextFromPdf(resolvedPath) : await extractTextFromImage(resolvedPath);

	return {
		fileName: file.originalname,
		mimeType: file.mimetype,
		kind,
		extractedText,
		characterCount: extractedText.length,
		preview: extractedText.slice(0, 800),
	};
};

const assertPdfFile = (file: Express.Multer.File | undefined) => {
	if (!file) {
		throw new ToolsError(400, "PDF file is required");
	}

	if (file.mimetype !== "application/pdf") {
		throw new ToolsError(400, "Only PDF files are supported for this operation");
	}

	return file;
};

const toPdfDataUrl = (bytes: Uint8Array) => {
	const base64 = Buffer.from(bytes).toString("base64");
	return `data:application/pdf;base64,${base64}`;
};

const parsePageSelection = (selection: string, totalPages: number) => {
	const normalized = selection.trim();
	if (!normalized) {
		throw new ToolsError(400, "pages query is required. Example: 1,3-5");
	}

	const selected = new Set<number>();
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

export const mergePdfFiles = async (files: Express.Multer.File[]) => {
	if (!Array.isArray(files) || files.length < 2) {
		throw new ToolsError(400, "At least two PDF files are required");
	}

	for (const file of files) {
		assertPdfFile(file);
	}

	const mergedDocument = await PDFDocument.create();
	for (const file of files) {
		const bytes = await fs.readFile(path.resolve(file.path));
		const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
		const pageIndices = doc.getPageIndices();
		const copiedPages = await mergedDocument.copyPages(doc, pageIndices);
		for (const page of copiedPages) {
			mergedDocument.addPage(page);
		}
	}

	const mergedBytes = await mergedDocument.save({ useObjectStreams: true });
	return {
		fileName: "merged.pdf",
		pageCount: mergedDocument.getPageCount(),
		dataUrl: toPdfDataUrl(mergedBytes),
	};
};

export const splitPdfFile = async (file: Express.Multer.File, pagesSelection: string) => {
	const sourceFile = assertPdfFile(file);
	const bytes = await fs.readFile(path.resolve(sourceFile.path));
	const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
	const selectedPageIndices = parsePageSelection(pagesSelection, source.getPageCount());

	const destination = await PDFDocument.create();
	const copiedPages = await destination.copyPages(source, selectedPageIndices);
	for (const page of copiedPages) {
		destination.addPage(page);
	}

	const splitBytes = await destination.save({ useObjectStreams: true });
	return {
		fileName: "split.pdf",
		selectedPages: selectedPageIndices.map((value) => value + 1),
		pageCount: destination.getPageCount(),
		dataUrl: toPdfDataUrl(splitBytes),
	};
};

export const compressPdfFile = async (file: Express.Multer.File) => {
	const sourceFile = assertPdfFile(file);
	const bytes = await fs.readFile(path.resolve(sourceFile.path));
	const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
	const compressedBytes = await source.save({
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
};

const toImageDataUrl = (bytes: Uint8Array, mimeType: string) => {
	const base64 = Buffer.from(bytes).toString("base64");
	return `data:${mimeType};base64,${base64}`;
};

const toFileDataUrl = (bytes: Uint8Array, mimeType: string) => {
	const base64 = Buffer.from(bytes).toString("base64");
	return `data:${mimeType};base64,${base64}`;
};

const normalizeDownloadName = (name: string, extension: string) => {
	const stripped = name.replace(/\.[^.]+$/, "");
	return `${stripped}.${extension}`;
};

const convertWithLibreOffice = async (inputFilePath: string, targetExtension: string) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cambliss-lo-"));
	const copiedInputPath = path.join(tempDir, path.basename(inputFilePath));
	await fs.copyFile(inputFilePath, copiedInputPath);

	try {
		await execFileAsync(LIBREOFFICE_BIN, [
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

		const outputPath = path.join(tempDir, `${path.parse(copiedInputPath).name}.${targetExtension}`);
		return await fs.readFile(outputPath);
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
};

const safeSheetName = (name: string) => name.replace(/[\[\]\*\?:\/\\]/g, " ").slice(0, 31) || "Sheet1";

const buildTextDocument = async (title: string, text: string) => {
	const lines = text.split(/\r?\n/);
	const children = [
		new Paragraph({
			heading: HeadingLevel.HEADING_1,
			children: [new TextRun(title)],
		}),
		...lines.map((line) => new Paragraph({ children: [new TextRun(line || " ")] })),
	];

	const document = new Document({
		sections: [{ children }],
	});

	return Packer.toBuffer(document);
};

const readDocxText = async (filePath: string) => {
	const result = await mammoth.extractRawText({ path: filePath });
	return (result.value ?? "").trim();
};

const readCsvRows = async (filePath: string) => {
	const raw = await fs.readFile(filePath, "utf8");
	return parseCsv(raw, {
		skip_empty_lines: true,
		relax_column_count: true,
	}) as string[][];
};

const createPdfFromText = async (title: string, text: string) => {
	const pdfKitModule = await import("pdfkit");
	const PdfKit = (pdfKitModule as { default?: any }).default ?? pdfKitModule;
	const doc = new PdfKit({ margin: 40, size: "A4" });
	const chunks: Buffer[] = [];

	doc.fontSize(18).text(title, { align: "center" });
	doc.moveDown();
	for (const line of text.split(/\r?\n/)) {
		doc.fontSize(11).text(line || " ", { width: 515 });
	}

	doc.end();

	return await new Promise<Buffer>((resolve, reject) => {
		doc.on("data", (chunk: Buffer) => chunks.push(chunk));
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);
	});
};

const REMBG_API_URL = process.env.REMBG_API_URL?.trim() || "";
const REMBG_API_KEY = process.env.REMBG_API_KEY?.trim() || "";

export const upscaleImageFile = async (file: Express.Multer.File, scaleRaw?: string) => {
	if (!file) {
		throw new ToolsError(400, "image file is required");
	}

	if (!file.mimetype?.startsWith("image/")) {
		throw new ToolsError(400, "Only image files are supported");
	}

	const scale = Number(scaleRaw ?? "2");
	if (!Number.isInteger(scale) || scale < 2 || scale > 4) {
		throw new ToolsError(400, "scale must be 2, 3, or 4");
	}

	const inputPath = path.resolve(file.path);
	const image = sharp(inputPath, { failOn: "none" });
	const metadata = await image.metadata();

	const originalWidth = metadata.width ?? 0;
	const originalHeight = metadata.height ?? 0;
	if (!originalWidth || !originalHeight) {
		throw new ToolsError(400, "Unable to detect image dimensions");
	}

	const targetWidth = Math.min(originalWidth * scale, 4096);
	const targetHeight = Math.min(originalHeight * scale, 4096);

	const format = metadata.format === "png" ? "png" : "jpeg";
	const output = format === "png"
		? await image.resize(targetWidth, targetHeight, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toBuffer()
		: await image.resize(targetWidth, targetHeight, { kernel: sharp.kernel.lanczos3 }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();

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
};

type Pixel = { r: number; g: number; b: number };

const colorDistance = (a: Pixel, b: Pixel) => {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const averageCornerColor = (data: Uint8Array, width: number, height: number): Pixel => {
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
		r += data[offset] ?? 0;
		g += data[offset + 1] ?? 0;
		b += data[offset + 2] ?? 0;
	}

	return {
		r: Math.round(r / points.length),
		g: Math.round(g / points.length),
		b: Math.round(b / points.length),
	};
};

export const removeImageBackground = async (file: Express.Multer.File, toleranceRaw?: string) => {
	if (!file) {
		throw new ToolsError(400, "image file is required");
	}

	if (!file.mimetype?.startsWith("image/")) {
		throw new ToolsError(400, "Only image files are supported");
	}

	const tolerance = Number(toleranceRaw ?? "42");
	if (!Number.isFinite(tolerance) || tolerance < 10 || tolerance > 120) {
		throw new ToolsError(400, "tolerance must be between 10 and 120");
	}

	const inputPath = path.resolve(file.path);
	const normalized = sharp(inputPath, { failOn: "none" }).rotate();
	const metadata = await normalized.metadata();
	const width = metadata.width ?? 0;
	const height = metadata.height ?? 0;
	if (!width || !height) {
		throw new ToolsError(400, "Unable to detect image dimensions");
	}

	const raw = await normalized.ensureAlpha().raw().toBuffer();
	const output = Buffer.from(raw);
	const bgColor = averageCornerColor(output, width, height);

	const visited = new Uint8Array(width * height);
	const queue = new Int32Array(width * height);
	let head = 0;
	let tail = 0;

	const enqueue = (index: number) => {
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
		const pixel: Pixel = {
			r: output[offset] ?? 0,
			g: output[offset + 1] ?? 0,
			b: output[offset + 2] ?? 0,
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

	const png = await sharp(output, {
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
};

const removeImageBackgroundWithRemBg = async (file: Express.Multer.File) => {
	if (!REMBG_API_URL) {
		throw new ToolsError(400, "REMBG_API_URL is not configured");
	}

	const imageBytes = await fs.readFile(path.resolve(file.path));
	const formData = new FormData();
	formData.append("file", new Blob([imageBytes], { type: file.mimetype || "application/octet-stream" }), file.originalname || "input-image");

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30000);

	try {
		const headers: Record<string, string> = {};
		if (REMBG_API_KEY) {
			headers.Authorization = `Bearer ${REMBG_API_KEY}`;
		}

		const response = await fetch(REMBG_API_URL, {
			method: "POST",
			headers,
			body: formData,
			signal: controller.signal,
		});

		if (!response.ok) {
			const failureBody = await response.text().catch(() => "");
			throw new ToolsError(502, `rembg request failed: ${response.status}${failureBody ? ` - ${failureBody.slice(0, 120)}` : ""}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const png = Buffer.from(arrayBuffer);
		if (png.byteLength === 0) {
			throw new ToolsError(502, "rembg returned empty output");
		}

		const metadata = await sharp(png).metadata();
		return {
			png,
			width: metadata.width ?? 0,
			height: metadata.height ?? 0,
		};
	} finally {
		clearTimeout(timeout);
	}
};

export const removeImageBackgroundAdvanced = async (
	file: Express.Multer.File,
	toleranceRaw?: string,
	modeRaw?: string,
) => {
	const requestedMode = (modeRaw ?? "auto").trim().toLowerCase();
	if (!["auto", "heuristic", "rembg"].includes(requestedMode)) {
		throw new ToolsError(400, "mode must be auto, heuristic, or rembg");
	}

	let usedMode: "heuristic" | "rembg" = "heuristic";
	let fallbackUsed = false;
	let result: { png: Buffer; width: number; height: number };

	if (requestedMode === "heuristic") {
		result = await removeImageBackground(file, toleranceRaw);
	} else if (requestedMode === "rembg") {
		result = await removeImageBackgroundWithRemBg(file);
		usedMode = "rembg";
	} else if (REMBG_API_URL) {
		try {
			result = await removeImageBackgroundWithRemBg(file);
			usedMode = "rembg";
		} catch {
			result = await removeImageBackground(file, toleranceRaw);
			usedMode = "heuristic";
			fallbackUsed = true;
		}
	} else {
		result = await removeImageBackground(file, toleranceRaw);
	}

	const tolerance = Number(toleranceRaw ?? "42");
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
};

export const convertPdfToDocx = async (file: Express.Multer.File) => {
	const sourceFile = assertPdfFile(file);
	let pdfText = "";
	let buffer: Buffer;

	try {
		buffer = await convertWithLibreOffice(path.resolve(sourceFile.path), "docx");
	} catch {
		pdfText = await extractTextFromPdf(path.resolve(sourceFile.path));
		buffer = await buildTextDocument(sourceFile.originalname || "PDF to Word", pdfText || "No text detected in the PDF.");
	}

	return {
		fileName: normalizeDownloadName(sourceFile.originalname || "converted", "docx"),
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
		characterCount: pdfText.length,
	};
};

export const convertDocxToPdf = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.originalname.toLowerCase().endsWith(".docx"))) {
		throw new ToolsError(400, "Only DOCX files are supported");
	}

	let text = "";
	let pdfBuffer: Buffer;

	try {
		pdfBuffer = await convertWithLibreOffice(path.resolve(file.path), "pdf");
	} catch {
		text = await readDocxText(path.resolve(file.path));
		pdfBuffer = await createPdfFromText(file.originalname || "Word to PDF", text || "No text detected in the DOCX.");
	}

	return {
		fileName: normalizeDownloadName(file.originalname || "converted", "pdf"),
		mimeType: "application/pdf",
		dataUrl: toFileDataUrl(pdfBuffer, "application/pdf"),
		characterCount: text.length,
	};
};

export const convertXlsxToCsv = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.originalname.toLowerCase().endsWith(".xlsx"))) {
		throw new ToolsError(400, "Only XLSX files are supported");
	}

	let sheetName = path.basename(file.originalname, path.extname(file.originalname)) || "Sheet1";
	let csv = "";

	try {
		const converted = await convertWithLibreOffice(path.resolve(file.path), "csv");
		csv = converted.toString("utf8");
	} catch {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(path.resolve(file.path));
		const worksheet = workbook.worksheets[0];
		if (!worksheet) {
			throw new ToolsError(400, "Workbook has no sheets");
		}

		sheetName = worksheet.name || sheetName;
		const csvBuffer = await workbook.csv.writeBuffer();
		csv = Buffer.from(csvBuffer as ArrayBuffer).toString("utf8");
	}

	return {
		fileName: normalizeDownloadName(file.originalname || sheetName, "csv"),
		mimeType: "text/csv",
		dataUrl: toFileDataUrl(Buffer.from(csv, "utf8"), "text/csv"),
		sheetName,
		rowCount: csv.split(/\r?\n/).filter(Boolean).length,
	};
};

export const convertCsvToXlsx = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	if (!(file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv"))) {
		throw new ToolsError(400, "Only CSV files are supported");
	}

	let rows: string[][] = [];
	let buffer: Buffer;

	try {
		buffer = await convertWithLibreOffice(path.resolve(file.path), "xlsx");
		rows = await readCsvRows(path.resolve(file.path));
	} catch {
		rows = await readCsvRows(path.resolve(file.path));
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet(safeSheetName(path.basename(file.originalname, path.extname(file.originalname)) || "Sheet1"));
		worksheet.addRows(rows);
		buffer = Buffer.from(await workbook.xlsx.writeBuffer());
	}

	return {
		fileName: normalizeDownloadName(file.originalname || "converted", "xlsx"),
		mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		dataUrl: toFileDataUrl(buffer as Buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
		rowCount: rows.length,
		columnCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
	};
};

export const convertPdfToTxt = async (file: Express.Multer.File) => {
	const sourceFile = assertPdfFile(file);
	const text = await extractTextFromPdf(path.resolve(sourceFile.path));

	return {
		fileName: normalizeDownloadName(sourceFile.originalname || "converted", "txt"),
		mimeType: "text/plain",
		dataUrl: toFileDataUrl(Buffer.from(text || "No text detected.", "utf8"), "text/plain"),
		characterCount: text.length,
	};
};

export const convertTxtToDocx = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	const text = await fs.readFile(path.resolve(file.path), "utf8");
	const buffer = await buildTextDocument(file.originalname || "Text to Word", text || " ");
	return {
		fileName: normalizeDownloadName(file.originalname || "converted", "docx"),
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		dataUrl: toFileDataUrl(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
		characterCount: text.length,
	};
};

export const convertPptxToTxt = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	if (!(file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || file.originalname.toLowerCase().endsWith(".pptx"))) {
		throw new ToolsError(400, "Only PPTX files are supported");
	}

	let combined = "";
	let slideCount = 0;

	try {
		const converted = await convertWithLibreOffice(path.resolve(file.path), "txt");
		combined = converted.toString("utf8").trim();
		slideCount = combined ? combined.split(/\n\n+/).filter(Boolean).length : 0;
	} catch {
		const zip = await JSZip.loadAsync(await fs.readFile(path.resolve(file.path)));
		const entries = Object.keys(zip.files)
			.filter((entry) => entry.startsWith("ppt/slides/slide") && entry.endsWith(".xml"))
			.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
		const slideTexts: string[] = [];

		for (const entry of entries) {
			const xml = await zip.file(entry)?.async("text");
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
};

export const convertTxtToPptx = async (file: Express.Multer.File) => {
	if (!file) {
		throw new ToolsError(400, "file is required");
	}

	const text = await fs.readFile(path.resolve(file.path), "utf8");
	const presentation = new PptxGenJS();
	presentation.layout = "LAYOUT_WIDE";
	presentation.author = "Cambliss";
	const slide = presentation.addSlide();
	slide.addText(file.originalname || "Text to PowerPoint", { x: 0.6, y: 0.4, w: 12, h: 0.5, fontSize: 24, bold: true });
	slide.addText(text || " ", { x: 0.8, y: 1.2, w: 11.5, h: 5.5, fontSize: 16, breakLine: false, margin: 0.15, fit: "shrink" });
	const buffer = await presentation.write({ outputType: "nodebuffer" });

	return {
		fileName: normalizeDownloadName(file.originalname || "converted", "pptx"),
		mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		dataUrl: toFileDataUrl(buffer as Buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
		characterCount: text.length,
		slideCount: 1,
	};
};};
