import { Request, Response } from "express";
import {
	GSTError,
	createGSTConfig,
	getGSTConfig,
	updateGSTConfig,
	deleteGSTConfig,
	generateGSTReport,
	generateGSTR1Data,
	calculateGST,
} from "./gst.service";
import { generateEInvoiceJSON } from "./einvoice.service";

export const createGSTConfigController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const gstConfig = await createGSTConfig(organizationId, req.body);
		res.status(201).json(gstConfig);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Create GST config error:", error);
			res.status(500).json({ error: "Failed to create GST configuration" });
		}
	}
};

export const getGSTConfigController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const gstConfig = await getGSTConfig(organizationId);
		res.json(gstConfig);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Get GST config error:", error);
			res.status(500).json({ error: "Failed to fetch GST configuration" });
		}
	}
};

export const updateGSTConfigController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const gstConfig = await updateGSTConfig(organizationId, req.body);
		res.json(gstConfig);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Update GST config error:", error);
			res.status(500).json({ error: "Failed to update GST configuration" });
		}
	}
};

export const deleteGSTConfigController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const result = await deleteGSTConfig(organizationId);
		res.status(200).json(result);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Delete GST config error:", error);
			res.status(500).json({ error: "Failed to delete GST configuration" });
		}
	}
};

export const generateGSTReportController = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const { month, year } = req.body;

		if (!Number.isInteger(month) || !Number.isInteger(year)) {
			res.status(400).json({ error: "Month and year are required as integers" });
			return;
		}

		const report = await generateGSTReport(organizationId, { month, year });
		res.json(report);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Generate GST report error:", error);
			res.status(500).json({ error: "Failed to generate GST report" });
		}
	}
};

export const generateGSTR1Controller = async (req: Request, res: Response): Promise<void> => {
	try {
		const organizationId =
			typeof req.params.organizationId === "string"
				? req.params.organizationId
				: req.params.organizationId?.[0];

		if (!organizationId) {
			res.status(400).json({ error: "organizationId is required" });
			return;
		}

		const { month, year } = req.body;

		if (!Number.isInteger(month) || !Number.isInteger(year)) {
			res.status(400).json({ error: "Month and year are required as integers" });
			return;
		}

		const gstr1Data = await generateGSTR1Data(organizationId, { month, year });
		res.json(gstr1Data);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Generate GSTR-1 error:", error);
			res.status(500).json({ error: "Failed to generate GSTR-1 data" });
		}
	}
};

export const calculateGSTController = async (req: Request, res: Response): Promise<void> => {
	try {
		const { sellerStateCode, buyerStateCode, taxableValue, gstRate } = req.body;

		if (!sellerStateCode || typeof taxableValue !== "number" || typeof gstRate !== "number") {
			res.status(400).json({
				error: "sellerStateCode, taxableValue, and gstRate are required",
			});
			return;
		}

		const breakdown = calculateGST(sellerStateCode, buyerStateCode, taxableValue, gstRate);
		res.json(breakdown);
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Calculate GST error:", error);
			res.status(500).json({ error: "Failed to calculate GST" });
		}
	}
};

export const exportEInvoiceJSONController = async (req: Request, res: Response): Promise<void> => {
	try {
		const invoiceId =
			typeof req.params.invoiceId === "string" ? req.params.invoiceId : req.params.invoiceId?.[0];

		if (!invoiceId) {
			res.status(400).json({ error: "invoiceId is required" });
			return;
		}

		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			res.status(401).json({ error: "Unauthorized: organization context missing" });
			return;
		}

		const payload = await generateEInvoiceJSON(invoiceId, organizationId);
		const fileName = `einvoice-${payload.DocDtls.No}.json`;

		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
		res.status(200).send(JSON.stringify(payload, null, 2));
	} catch (error) {
		if (error instanceof GSTError) {
			res.status(error.statusCode).json({ error: error.message });
		} else {
			console.error("Export e-invoice JSON error:", error);
			res.status(500).json({ error: "Failed to export e-invoice JSON" });
		}
	}
};
