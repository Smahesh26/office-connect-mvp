import { Router, type Request, type Response } from "express";
import { upload } from "../../config/multer";
import { createRateLimitMiddleware } from "../../middleware/rate-limit.middleware";
import { authenticateJWT } from "../../middleware/auth.middleware";
import fs from "fs/promises";
import { compressPdfFile, convertCsvToXlsx, convertCurrency, convertDocxToPdf, convertPdfToDocx, convertPdfToTxt, convertPptxToTxt, convertTxtToDocx, convertTxtToPptx, convertXlsxToCsv, extractDocumentText, generateQrCode, getDailyUtilityCatalog, mergePdfFiles, removeImageBackgroundAdvanced, splitPdfFile, ToolsError, upscaleImageFile } from "./tools.service";

const toolsRouter = Router();

// Abuse/DoS protection: these endpoints are resource-intensive (OCR, PDF, image,
// document conversion) and reachable without auth, so cap request volume per IP.
toolsRouter.use(
	createRateLimitMiddleware({
		keyPrefix: "tools",
		max: Number(process.env.TOOLS_RATE_LIMIT_MAX) || 30,
		windowMs: Number(process.env.TOOLS_RATE_LIMIT_WINDOW_MS) || 60_000,
	})
);

// Require authentication for all tool endpoints (prevents anonymous resource abuse).
toolsRouter.use(authenticateJWT);

const cleanupUploadedFiles = async (files: Array<Express.Multer.File | undefined>) => {
	await Promise.allSettled(
		files
			.filter((file): file is Express.Multer.File => Boolean(file?.path))
			.map((file) => fs.unlink(file.path)),
	);
};

const handleToolsError = (res: Response, error: unknown) => {
	if (error instanceof ToolsError) {
		res.status(error.statusCode).json({ message: error.message });
		return;
	}

	if (error instanceof Error) {
		res.status(500).json({ message: error.message });
		return;
	}

	res.status(500).json({ message: "Internal server error" });
};

toolsRouter.get("/currency/convert", async (req: Request, res: Response) => {
	try {
		const result = await convertCurrency({
			amount: req.query.amount as string | undefined,
			from: req.query.from as string | undefined,
			to: req.query.to as string | undefined,
		});
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	}
});

toolsRouter.post("/qr/generate", async (req: Request, res: Response) => {
	try {
		const result = await generateQrCode({
			text: req.body?.text as string | undefined,
			size: req.body?.size as number | undefined,
		});
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	}
});

toolsRouter.post("/ocr/extract", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await extractDocumentText(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/pdf/merge", upload.array("files", 10), async (req: Request, res: Response) => {
	const files = (req.files as Express.Multer.File[] | undefined) ?? [];
	try {
		const result = await mergePdfFiles(files);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles(files);
	}
});

toolsRouter.post("/pdf/split", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const pages = String(req.body?.pages ?? "");
		const result = await splitPdfFile(req.file, pages);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/pdf/compress", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await compressPdfFile(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/image/upscale", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await upscaleImageFile(req.file, String(req.body?.scale ?? "2"));
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/image/remove-background", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await removeImageBackgroundAdvanced(
			req.file,
			String(req.body?.tolerance ?? "42"),
			String(req.body?.mode ?? "auto"),
		);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pdf-to-docx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPdfToDocx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/docx-to-pdf", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertDocxToPdf(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/xlsx-to-csv", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertXlsxToCsv(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/csv-to-xlsx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertCsvToXlsx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pdf-to-txt", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPdfToTxt(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/txt-to-docx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertTxtToDocx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pptx-to-txt", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPptxToTxt(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/txt-to-pptx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertTxtToPptx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	}
});

toolsRouter.post("/pdf/split", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const pages = String(req.body?.pages ?? "");
		const result = await splitPdfFile(req.file, pages);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/pdf/compress", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await compressPdfFile(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/image/upscale", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await upscaleImageFile(req.file, String(req.body?.scale ?? "2"));
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/image/remove-background", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await removeImageBackgroundAdvanced(
			req.file,
			String(req.body?.tolerance ?? "42"),
			String(req.body?.mode ?? "auto"),
		);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pdf-to-docx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPdfToDocx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/docx-to-pdf", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertDocxToPdf(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/xlsx-to-csv", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertXlsxToCsv(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/csv-to-xlsx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertCsvToXlsx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pdf-to-txt", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPdfToTxt(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/txt-to-docx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertTxtToDocx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/pptx-to-txt", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertPptxToTxt(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.post("/convert/txt-to-pptx", upload.single("file"), async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ message: "file is required" });
			return;
		}

		const result = await convertTxtToPptx(req.file);
		res.status(200).json(result);
	} catch (error) {
		handleToolsError(res, error);
	} finally {
		await cleanupUploadedFiles([req.file]);
	}
});

toolsRouter.get("/daily-catalog", (_req: Request, res: Response) => {
	res.status(200).json({
		items: getDailyUtilityCatalog(),
	});
});

export default toolsRouter;
