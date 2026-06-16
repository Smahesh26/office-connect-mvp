import { Router, Request, Response } from "express";
import {
	generateEWayBillJSON,
	validateEWayBillEligibility,
	getEWayBillHistory,
	cancelEWayBill,
	TransportDetails,
} from "./eway.service";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /gst/eway-bill/validate
 * Validate if invoice is eligible for E-Way Bill generation
 */
router.post("/eway-bill/validate", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const { invoiceId } = req.body;
		const organizationId = (req as any).user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!invoiceId) {
			return res.status(400).json({ error: "invoiceId is required" });
		}

		const validation = await validateEWayBillEligibility(invoiceId, organizationId);

		return res.status(200).json(validation);
	} catch (error) {
		console.error("Error validating E-Way Bill eligibility:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /gst/eway-bill/generate
 * Generate E-Way Bill JSON for an invoice
 */
router.post("/eway-bill/generate", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const { invoiceId, transportDetails } = req.body;
		const organizationId = (req as any).user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!invoiceId) {
			return res.status(400).json({ error: "invoiceId is required" });
		}

		const transportData: TransportDetails = {
			transporterName: transportDetails?.transporterName,
			transporterGSTIN: transportDetails?.transporterGSTIN,
			vehicleNumber: transportDetails?.vehicleNumber,
			transportMode: transportDetails?.transportMode || "ROAD",
			distance: transportDetails?.distance,
		};

		const result = await generateEWayBillJSON(invoiceId, organizationId, transportData);

		if (!result.success) {
			return res.status(400).json({
				error: "E-Way Bill generation failed",
				errors: result.errors,
			});
		}

		return res.status(200).json({
			success: true,
			data: result.data,
		});
	} catch (error) {
		console.error("Error generating E-Way Bill:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /gst/eway-bill/download/:invoiceId
 * Download E-Way Bill JSON as file
 */
router.get("/eway-bill/download/:invoiceId", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const invoiceId = req.params.invoiceId as string;
		const organizationId = req.user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		// Get transport details from query params (if updating)
		const transportDetails: TransportDetails = {
			transporterName: req.query.transporterName as string,
			transporterGSTIN: req.query.transporterGSTIN as string,
			vehicleNumber: req.query.vehicleNumber as string,
			transportMode: req.query.transportMode as any,
			distance: req.query.distance ? parseInt(req.query.distance as string) : undefined,
		};

		const result = await generateEWayBillJSON(invoiceId, organizationId, transportDetails);

		if (!result.success) {
			return res.status(400).json({
				error: "E-Way Bill generation failed",
				errors: result.errors,
			});
		}

		// Set response headers for download
		const filename = `EWAY_${result.data!.docNo}_${Date.now()}.json`;
		res.setHeader("Content-Type", "application/json");
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

		return res.status(200).json(result.data);
	} catch (error) {
		console.error("Error downloading E-Way Bill:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /gst/eway-bill/history/:invoiceId
 * Get E-Way Bill generation history for an invoice
 */
router.get("/eway-bill/history/:invoiceId", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const invoiceId = req.params.invoiceId as string;
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const history = await getEWayBillHistory(invoiceId, organizationId);

		return res.status(200).json({
			success: true,
			data: history,
		});
	} catch (error) {
		console.error("Error fetching E-Way Bill history:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /gst/eway-bill/cancel/:ewayBillId
 * Cancel an E-Way Bill
 */
router.post("/eway-bill/cancel/:ewayBillId", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const ewayBillId = req.params.ewayBillId as string;
		const organizationId = req.user?.organizationId;
		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const cancelledBill = await cancelEWayBill(ewayBillId, organizationId);

		return res.status(200).json({
			success: true,
			data: cancelledBill,
		});
	} catch (error: any) {
		console.error("Error cancelling E-Way Bill:", error);
		return res.status(400).json({ error: error.message || "Failed to cancel E-Way Bill" });
	}
});

export default router;
