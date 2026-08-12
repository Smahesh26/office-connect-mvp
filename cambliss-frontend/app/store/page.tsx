"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WorkspaceShell from "../../components/WorkspaceShell";

type AuthUser = {
	role?: string;
	accesses?: string[];
};

type DailyUtilityItem = {
	id: string;
	name: string;
	category: string;
	dailyUseCase: string;
	status: "integrated" | "planned";
	provider: string;
};

type PdfOperationResponse = {
	fileName: string;
	dataUrl: string;
	originalSizeBytes?: number;
	compressedSizeBytes?: number;
};

type ImageUpscaleResponse = {
	fileName: string;
	dataUrl: string;
	scale: number;
	originalWidth: number;
	originalHeight: number;
	upscaledWidth: number;
	upscaledHeight: number;
	originalSizeBytes: number;
	upscaledSizeBytes: number;
};

type BackgroundRemovalResponse = {
	fileName: string;
	dataUrl: string;
	tolerance: number;
	width: number;
	height: number;
	modeRequested?: string;
	modeUsed?: "heuristic" | "rembg";
	fallbackUsed?: boolean;
};

type DocumentConversionKind = "pdf-to-docx" | "docx-to-pdf" | "xlsx-to-csv" | "csv-to-xlsx" | "pdf-to-txt" | "txt-to-docx" | "pptx-to-txt" | "txt-to-pptx";

type DocumentConversionResponse = {
	fileName: string;
	dataUrl: string;
	mimeType: string;
	characterCount?: number;
	rowCount?: number;
	columnCount?: number;
	sheetName?: string;
};

const isAdminRole = (role?: string) => role === "ADMIN" || role === "SUPER_ADMIN";

export default function StorePage() {
	return (
		<Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
			<StoreContent />
		</Suspense>
	);
}

function StoreContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const view = searchParams.get("view");
	
	const [authUser, setAuthUser] = useState<AuthUser | null>(null);
	const [ocrFile, setOcrFile] = useState<File | null>(null);
	const [ocrLoading, setOcrLoading] = useState(false);
	const [ocrError, setOcrError] = useState<string | null>(null);
	const [ocrResult, setOcrResult] = useState<string>("");
	const [dailyUtilities, setDailyUtilities] = useState<DailyUtilityItem[]>([]);
	const [pdfMergeFiles, setPdfMergeFiles] = useState<File[]>([]);
	const [pdfSplitFile, setPdfSplitFile] = useState<File | null>(null);
	const [pdfSplitPages, setPdfSplitPages] = useState("1");
	const [pdfCompressFile, setPdfCompressFile] = useState<File | null>(null);
	const [pdfBusyOperation, setPdfBusyOperation] = useState<"merge" | "split" | "compress" | null>(null);
	const [pdfError, setPdfError] = useState<string | null>(null);
	const [pdfInfo, setPdfInfo] = useState<string>("");
	const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
	const [upscaleScale, setUpscaleScale] = useState("2");
	const [upscaleBusy, setUpscaleBusy] = useState(false);
	const [upscaleError, setUpscaleError] = useState<string | null>(null);
	const [upscaleInfo, setUpscaleInfo] = useState<string>("");
	const [upscaledPreview, setUpscaledPreview] = useState<string | null>(null);
	const [bgRemovalFile, setBgRemovalFile] = useState<File | null>(null);
	const [bgTolerance, setBgTolerance] = useState("42");
	const [bgMode, setBgMode] = useState<"auto" | "heuristic" | "rembg">("auto");
	const [bgBusy, setBgBusy] = useState(false);
	const [bgError, setBgError] = useState<string | null>(null);
	const [bgInfo, setBgInfo] = useState<string>("");
	const [bgPreview, setBgPreview] = useState<string | null>(null);
	const [docConversion, setDocConversion] = useState<DocumentConversionKind>("pdf-to-docx");
	const [docFile, setDocFile] = useState<File | null>(null);
	const [docBusy, setDocBusy] = useState(false);
	const [docError, setDocError] = useState<string | null>(null);
	const [docInfo, setDocInfo] = useState<string>("");
	const [docDownloadUrl, setDocDownloadUrl] = useState<string | null>(null);
	const [docDownloadName, setDocDownloadName] = useState<string>("");

	useEffect(() => {
		const rawAuthUser = localStorage.getItem("authUser");
		if (!rawAuthUser) {
			setAuthUser(null);
			return;
		}

		try {
			setAuthUser(JSON.parse(rawAuthUser) as AuthUser);
		} catch {
			setAuthUser(null);
		}
	}, []);

	const authHeaders = (): Record<string, string> => {
		const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
		return token ? { Authorization: `Bearer ${token}` } : {};
	};

	useEffect(() => {
		const loadDailyUtilities = async () => {
			try {
				const response = await fetch("/api/tools/daily-catalog", { headers: authHeaders() });
				if (!response.ok) {
					return;
				}

				const payload = (await response.json()) as { items?: DailyUtilityItem[] };
				setDailyUtilities(payload.items ?? []);
			} catch {
				setDailyUtilities([]);
			}
		};

		void loadDailyUtilities();
	}, []);

	const runOcr = async () => {
		if (!ocrFile) {
			setOcrError("Please choose a PDF or image file.");
			return;
		}

		setOcrLoading(true);
		setOcrError(null);
		setOcrResult("");

		try {
			const formData = new FormData();
			formData.append("file", ocrFile);

			const response = await fetch("/api/tools/ocr/extract", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const failure = (await response.json()) as { message?: string };
				throw new Error(failure.message ?? "OCR failed");
			}

			const payload = (await response.json()) as { extractedText?: string; preview?: string };
			const text = (payload.extractedText ?? payload.preview ?? "").trim();
			setOcrResult(text || "No text detected in the uploaded file.");
		} catch (error) {
			setOcrError(error instanceof Error ? error.message : "OCR failed");
		} finally {
			setOcrLoading(false);
		}
	};

	const triggerPdfDownload = (fileName: string, dataUrl: string) => {
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = fileName;
		link.click();
	};

	const runPdfMerge = async () => {
		if (pdfMergeFiles.length < 2) {
			setPdfError("Choose at least 2 PDF files to merge.");
			return;
		}

		setPdfBusyOperation("merge");
		setPdfError(null);
		setPdfInfo("");

		try {
			const formData = new FormData();
			for (const file of pdfMergeFiles) {
				formData.append("files", file);
			}

			const response = await fetch("/api/tools/pdf/merge", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const failure = (await response.json()) as { message?: string };
				throw new Error(failure.message ?? "PDF merge failed");
			}

			const payload = (await response.json()) as PdfOperationResponse & { pageCount?: number };
			triggerPdfDownload(payload.fileName || "merged.pdf", payload.dataUrl);
			setPdfInfo(`Merged successfully${typeof payload.pageCount === "number" ? ` (${payload.pageCount} pages)` : ""}.`);
			setPdfMergeFiles([]);
		} catch (error) {
			setPdfError(error instanceof Error ? error.message : "PDF merge failed");
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runPdfSplit = async () => {
		if (!pdfSplitFile) {
			setPdfError("Choose a PDF file to split.");
			return;
		}

		setPdfBusyOperation("split");
		setPdfError(null);
		setPdfInfo("");

		try {
			const formData = new FormData();
			formData.append("file", pdfSplitFile);
			formData.append("pages", pdfSplitPages);

			const response = await fetch("/api/tools/pdf/split", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const failure = (await response.json()) as { message?: string };
				throw new Error(failure.message ?? "PDF split failed");
			}

			const payload = (await response.json()) as PdfOperationResponse;
			triggerPdfDownload(payload.fileName || "split.pdf", payload.dataUrl);
			setPdfInfo("Split PDF generated successfully.");
			setPdfSplitFile(null);
		} catch (error) {
			setPdfError(error instanceof Error ? error.message : "PDF split failed");
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runPdfCompress = async () => {
		if (!pdfCompressFile) {
			setPdfError("Choose a PDF file to compress.");
			return;
		}

		setPdfBusyOperation("compress");
		setPdfError(null);
		setPdfInfo("");

		try {
			const formData = new FormData();
			formData.append("file", pdfCompressFile);

			const response = await fetch("/api/tools/pdf/compress", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const failure = (await response.json()) as { message?: string };
				throw new Error(failure.message ?? "PDF compress failed");
			}

			const payload = (await response.json()) as PdfOperationResponse;
			triggerPdfDownload(payload.fileName || "compressed.pdf", payload.dataUrl);
			if (typeof payload.originalSizeBytes === "number" && typeof payload.compressedSizeBytes === "number") {
				setPdfInfo(`Compression complete: ${(payload.originalSizeBytes / 1024).toFixed(1)} KB -> ${(payload.compressedSizeBytes / 1024).toFixed(1)} KB.`);
			} else {
				setPdfInfo("Compression complete.");
			}
		} catch (error) {
			setPdfError(error instanceof Error ? error.message : "PDF compress failed");
		} finally {
			setPdfBusyOperation(null);
		}
	};

	const runImageUpscale = async () => {
		if (!upscaleFile) {
			setUpscaleError("Choose an image to upscale.");
			return;
		}

		setUpscaleBusy(true);
		setUpscaleError(null);
		setUpscaleInfo("");

		try {
			const formData = new FormData();
			formData.append("file", upscaleFile);
			formData.append("scale", upscaleScale);

			const response = await fetch("/api/tools/image/upscale", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const failure = (await response.json()) as { message?: string };
				throw new Error(failure.message ?? "Image upscaling failed");
			}

			const payload = (await response.json()) as ImageUpscaleResponse;
			setUpscaledPreview(payload.dataUrl);
			setUpscaleInfo(`${payload.originalWidth}x${payload.originalHeight} -> ${payload.upscaledWidth}x${payload.upscaledHeight}`);
		} catch (error) {
			setUpscaledPreview(null);
			setUpscaleError(error instanceof Error ? error.message : "Image upscaling failed");
		} finally {
			setUpscaleBusy(false);
		}
	};

	const runBackgroundRemoval = async () => {
		if (!bgRemovalFile) {
			setBgError("Choose an image for background removal.");
			return;
		}

		setBgBusy(true);
		setBgError(null);
		setBgInfo("");

		try {
			const formData = new FormData();
			formData.append("file", bgRemovalFile);
			formData.append("tolerance", bgTolerance);
			formData.append("mode", bgMode);

			const response = await fetch("/api/tools/image/remove-background", {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => "");
				let failureMsg = "Background removal failed";
				try {
					const failure = JSON.parse(errorText);
					failureMsg = failure.message ?? failureMsg;
				} catch {
					failureMsg = `${response.status} ${errorText.substring(0, 100)}`;
				}
				throw new Error(failureMsg);
			}

			const payload = (await response.json()) as BackgroundRemovalResponse;
			setBgPreview(payload.dataUrl);
			const usedMode = payload.modeUsed ?? "heuristic";
			setBgInfo(`Processed ${payload.width}x${payload.height} image (tolerance ${payload.tolerance}, mode ${usedMode}${payload.fallbackUsed ? ", fallback used" : ""}).`);
		} catch (error) {
			setBgPreview(null);
			setBgError(error instanceof Error ? error.message : "Background removal failed");
		} finally {
			setBgBusy(false);
		}
	};

	const runDocumentConversion = async () => {
		if (!docFile) {
			setDocError("Choose a document to convert.");
			return;
		}

		setDocBusy(true);
		setDocError(null);
		setDocInfo("");
		setDocDownloadUrl(null);
		setDocDownloadName("");

		try {
			const formData = new FormData();
			formData.append("file", docFile);

			const endpointMap: Record<DocumentConversionKind, string> = {
				"pdf-to-docx": "/api/tools/convert/pdf-to-docx",
				"docx-to-pdf": "/api/tools/convert/docx-to-pdf",
				"xlsx-to-csv": "/api/tools/convert/xlsx-to-csv",
				"csv-to-xlsx": "/api/tools/convert/csv-to-xlsx",
				"pdf-to-txt": "/api/tools/convert/pdf-to-txt",
				"txt-to-docx": "/api/tools/convert/txt-to-docx",
				"pptx-to-txt": "/api/tools/convert/pptx-to-txt",
				"txt-to-pptx": "/api/tools/convert/txt-to-pptx",
			};

			const response = await fetch(endpointMap[docConversion], {
				method: "POST",
				headers: authHeaders(),
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => "");
				let failureMsg = "Document conversion failed";
				try {
					const failure = JSON.parse(errorText);
					failureMsg = failure.message ?? failureMsg;
				} catch {
					failureMsg = `${response.status} ${errorText.substring(0, 100)}`;
				}
				throw new Error(failureMsg);
			}

			const payload = (await response.json()) as DocumentConversionResponse;
			setDocDownloadUrl(payload.dataUrl);
			setDocDownloadName(payload.fileName);
			const stats = [
				payload.characterCount !== undefined ? `${payload.characterCount} chars` : null,
				payload.rowCount !== undefined ? `${payload.rowCount} rows` : null,
				payload.columnCount !== undefined ? `${payload.columnCount} columns` : null,
				payload.sheetName ? `sheet ${payload.sheetName}` : null,
			].filter(Boolean).join(" • ");
			setDocInfo(stats || "Conversion complete.");
		} catch (error) {
			setDocError(error instanceof Error ? error.message : "Document conversion failed");
		} finally {
			setDocBusy(false);
		}
	};



	return (
		<WorkspaceShell>
			<div className="mt-5 mx-auto max-w-6xl space-y-6">
				{/* Top Side-by-Side Nav */}
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() => router.push("/store?view=free")}
						className={`rounded-2xl border p-6 text-center transition-all ${
							view === "free" ? "bg-[#404d85] border-[#404d85] text-white shadow-xl shadow-[#404d85]/20" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm"
						}`}
					>
						<h2 className="text-xl font-bold">Free Tools</h2>
						<p className={`mt-2 text-sm ${view === "free" ? "text-white/80" : "text-zinc-500"}`}>Explore open-source utilities</p>
					</button>
					<button
						onClick={() => router.push("/store?view=paid")}
						className={`rounded-2xl border p-6 text-center transition-all ${
							view === "paid" ? "bg-[#404d85] border-[#404d85] text-white shadow-xl shadow-[#404d85]/20" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm"
						}`}
					>
						<h2 className="text-xl font-bold">Paid Tools</h2>
						<p className={`mt-2 text-sm ${view === "paid" ? "text-white/80" : "text-zinc-500"}`}>Unlock premium capabilities</p>
					</button>
				</div>

				{/* Main Content Area */}
				{view === "paid" && (
					<div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
						<h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Paid Tools</h2>
						<p className="mt-2 text-zinc-600">5000+ tools under cambliss paid subscription. Coming soon!</p>
					</div>
				)}
				
				{view === "free" && (
					<div className="space-y-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-[0_28px_56px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/80">
						<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-6">Free Tools</h1>
						<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
						<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)] xl:col-span-2">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">Document Converter</p>
							<span className="text-xs text-zinc-500">PDF, Word, Excel, CSV</span>
						</div>
						<p className="mt-2 text-xs text-zinc-600">Convert common office formats using open-source server-side tools.</p>
						<div className="mt-3 grid gap-2 md:grid-cols-[1.2fr_1fr_auto]">
							<select value={docConversion} onChange={(event) => setDocConversion(event.target.value as DocumentConversionKind)} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700">
								<option value="pdf-to-docx">PDF to Word (.docx)</option>
								<option value="docx-to-pdf">Word to PDF</option>
								<option value="xlsx-to-csv">Excel to CSV</option>
								<option value="csv-to-xlsx">CSV to Excel</option>
								<option value="pdf-to-txt">PDF to Text</option>
								<option value="txt-to-docx">Text to Word</option>
								<option value="pptx-to-txt">PowerPoint to Text</option>
								<option value="txt-to-pptx">Text to PowerPoint</option>
							</select>
							<label className="max-w-xs cursor-pointer truncate rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
								{docFile ? docFile.name : "Choose File"}
								<input
									type="file"
									accept=".pdf,.docx,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
									onChange={(event) => setDocFile(event.target.files?.[0] ?? null)}
									className="hidden"
								/>
							</label>
							<button type="button" onClick={() => void runDocumentConversion()} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
								{docBusy ? "Converting..." : "Convert"}
							</button>
						</div>
						{docError ? <p className="mt-2 text-xs font-medium text-rose-700">{docError}</p> : null}
						{docInfo ? <p className="mt-2 text-xs font-medium text-emerald-700">{docInfo}</p> : null}
						{docDownloadUrl ? (
							<div className="mt-3 flex items-center gap-3">
								<a href={docDownloadUrl} download={docDownloadName || "converted-file"} className="text-xs font-semibold text-zinc-700 hover:underline">Download converted file</a>
								<span className="text-[11px] text-zinc-500">{docDownloadName}</span>
							</div>
						) : null}
						<p className="mt-3 text-[11px] text-zinc-500">When LibreOffice/soffice is available, conversions use layout-preserving output; otherwise the backend falls back to text-based conversions for PDF/PPTX flows.</p>
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">Image Upscaler</p>
							<span className="text-xs text-zinc-500">2x to 4x</span>
						</div>
						<p className="mt-2 text-xs text-zinc-600">Improve low-resolution images for product listings and design assets.</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<label className="max-w-[200px] cursor-pointer truncate rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
								{upscaleFile ? upscaleFile.name : "Choose Image"}
								<input
									type="file"
									accept="image/*"
									onChange={(event) => setUpscaleFile(event.target.files?.[0] ?? null)}
									className="hidden"
								/>
							</label>
							<select
								value={upscaleScale}
								onChange={(event) => setUpscaleScale(event.target.value)}
								className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700"
							>
								<option value="2">2x</option>
								<option value="3">3x</option>
								<option value="4">4x</option>
							</select>
							<button type="button" onClick={() => void runImageUpscale()} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
								{upscaleBusy ? "Upscaling..." : "Upscale"}
							</button>
						</div>
						{upscaleError ? <p className="mt-2 text-xs font-medium text-rose-700">{upscaleError}</p> : null}
						{upscaleInfo ? <p className="mt-2 text-xs font-medium text-emerald-700">{upscaleInfo}</p> : null}
						{upscaledPreview ? (
							<div className="mt-3 flex items-center gap-3">
								<img src={upscaledPreview} alt="Upscaled output" className="h-24 w-24 rounded-lg border border-zinc-200 bg-zinc-50 object-cover" />
								<a href={upscaledPreview} download="upscaled-image.png" className="text-xs font-semibold text-zinc-700 hover:underline">Download upscaled image</a>
							</div>
						) : null}
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">Background Remover</p>
							<span className="text-xs text-zinc-500">Transparent PNG</span>
						</div>
						<p className="mt-2 text-xs text-zinc-600">Best for product photos with plain backgrounds. Adjust tolerance for stronger removal.</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<label className="max-w-[200px] cursor-pointer truncate rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
								{bgRemovalFile ? bgRemovalFile.name : "Choose Image"}
								<input
									type="file"
									accept="image/*"
									onChange={(event) => setBgRemovalFile(event.target.files?.[0] ?? null)}
									className="hidden"
								/>
							</label>
							<select
								value={bgMode}
								onChange={(event) => setBgMode(event.target.value as "auto" | "heuristic" | "rembg")}
								className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700"
							>
								<option value="auto">Auto</option>
								<option value="heuristic">Heuristic</option>
								<option value="rembg">rembg</option>
							</select>
							<input
								value={bgTolerance}
								onChange={(event) => setBgTolerance(event.target.value)}
								placeholder="Tolerance 42"
								className="w-28 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700"
							/>
							<button type="button" onClick={() => void runBackgroundRemoval()} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
								{bgBusy ? "Removing..." : "Remove BG"}
							</button>
						</div>
						{bgError ? <p className="mt-2 text-xs font-medium text-rose-700">{bgError}</p> : null}
						{bgInfo ? <p className="mt-2 text-xs font-medium text-emerald-700">{bgInfo}</p> : null}
						{bgPreview ? (
							<div className="mt-3 flex items-center gap-3">
								<div className="rounded-lg border border-zinc-200 bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%,#f4f4f5),linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%,#f4f4f5)] bg-[length:14px_14px] bg-[position:0_0,7px_7px] p-1">
									<img src={bgPreview} alt="Background removed output" className="h-24 w-24 rounded object-cover" />
								</div>
								<a href={bgPreview} download="background-removed.png" className="text-xs font-semibold text-zinc-700 hover:underline">Download transparent PNG</a>
							</div>
						) : null}
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)] xl:col-span-2">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">PDF Workbench</p>
							<span className="text-xs text-zinc-500">Merge, split, compress</span>
						</div>
						<p className="mt-2 text-xs text-zinc-600">Run common PDF operations with open-source tooling from inside the workspace.</p>

						<div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-xs font-semibold text-zinc-900">Merge PDFs</p>
								<label className="mt-2 block w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50">
									Select PDFs to Merge
									<input
										type="file"
										accept="application/pdf"
										multiple
										onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
										onChange={(event) => {
											if (event.target.files && event.target.files.length > 0) {
												setPdfMergeFiles((prev) => [...prev, ...Array.from(event.target.files!)]);
											}
										}}
										className="hidden"
									/>
								</label>
								{pdfMergeFiles.length > 0 && (
									<div className="mt-2 flex max-h-24 flex-col gap-1 overflow-y-auto">
										{pdfMergeFiles.map((f, i) => (
											<div key={i} className="flex items-center justify-between rounded bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700">
												<span className="max-w-[120px] truncate">{f.name}</span>
												<button type="button" onClick={() => setPdfMergeFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">X</button>
											</div>
										))}
									</div>
								)}
								<button type="button" onClick={() => void runPdfMerge()} disabled={pdfBusyOperation !== null} className="mt-2 w-full rounded-lg bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
									{pdfBusyOperation === "merge" ? "Merging..." : "Merge and Download"}
								</button>
							</div>

							<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-xs font-semibold text-zinc-900">Split PDF</p>
								<label className="mt-2 block w-full cursor-pointer truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50">
									{pdfSplitFile ? pdfSplitFile.name : "Choose PDF"}
									<input
										type="file"
										accept="application/pdf"
										onChange={(event) => setPdfSplitFile(event.target.files?.[0] ?? null)}
										className="hidden"
									/>
								</label>
								<input
									value={pdfSplitPages}
									onChange={(event) => setPdfSplitPages(event.target.value)}
									placeholder="Pages: 1,3-5"
									className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[11px] text-zinc-600"
								/>
								<button type="button" onClick={() => void runPdfSplit()} disabled={pdfBusyOperation !== null} className="mt-2 w-full rounded-lg bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
									{pdfBusyOperation === "split" ? "Splitting..." : "Split and Download"}
								</button>
							</div>

							<div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
								<p className="text-xs font-semibold text-zinc-900">Compress PDF</p>
								<label className="mt-2 block w-full cursor-pointer truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50">
									{pdfCompressFile ? pdfCompressFile.name : "Choose PDF"}
									<input
										type="file"
										accept="application/pdf"
										onChange={(event) => setPdfCompressFile(event.target.files?.[0] ?? null)}
										className="hidden"
									/>
								</label>
								<button type="button" onClick={() => void runPdfCompress()} disabled={pdfBusyOperation !== null} className="mt-2 w-full rounded-lg bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
									{pdfBusyOperation === "compress" ? "Compressing..." : "Compress and Download"}
								</button>
							</div>
						</div>

						{pdfError ? <p className="mt-3 text-xs font-medium text-rose-700">{pdfError}</p> : null}
						{pdfInfo ? <p className="mt-2 text-xs font-medium text-emerald-700">{pdfInfo}</p> : null}
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">OCR Extractor</p>
							<span className="text-xs text-zinc-500">PDF/Image to Text</span>
						</div>
						<p className="mt-2 text-xs text-zinc-600">Upload receipts, scanned docs, or IDs and extract text using open-source OCR.</p>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<label className="max-w-[200px] cursor-pointer truncate rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
								{ocrFile ? ocrFile.name : "Choose File"}
								<input
									type="file"
									accept="application/pdf,image/*"
									onChange={(event) => setOcrFile(event.target.files?.[0] ?? null)}
									className="hidden"
								/>
							</label>
							<button type="button" onClick={() => void runOcr()} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
								{ocrLoading ? "Extracting..." : "Extract Text"}
							</button>
						</div>
						{ocrError ? <p className="mt-2 text-xs font-medium text-rose-700">{ocrError}</p> : null}
						{ocrResult ? (
							<textarea
								readOnly
								value={ocrResult}
								className="mt-3 h-56 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-700"
							/>
						) : (
							<p className="mt-3 text-xs text-zinc-500">Extracted text will appear here.</p>
						)}
					</div>

					<div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-semibold text-zinc-900">Daily Open-Source Utilities</p>
							<span className="text-xs text-zinc-500">Catalog</span>
						</div>
						<ul className="mt-3 space-y-2">
							{dailyUtilities.length > 0 ? dailyUtilities.map((item) => (
								<li key={item.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
									<p className="text-xs font-semibold text-zinc-900">{item.name} <span className="text-[11px] font-medium text-zinc-500">({item.category})</span></p>
									<p className="mt-1 text-xs text-zinc-600">{item.dailyUseCase}</p>
									<p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">{item.status} • {item.provider}</p>
								</li>
							)) : <li className="text-xs text-zinc-500">Catalog unavailable right now.</li>}
						</ul>
					</div>
				</div>
					</div>
				)}
			</div>
		</WorkspaceShell>
	);
}
