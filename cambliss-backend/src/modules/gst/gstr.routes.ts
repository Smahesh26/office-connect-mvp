import { Router, Request, Response } from "express";
import { generateGSTR1Report, generateGSTR1CSV, generateGSTR1JSON } from "./gstr.service";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = Router();

/**
 * GET /gst/gstr1/report
 * Generate GSTR-1 report for a specific month
 * Query params: month (1-12), year (e.g., 2025)
 */
router.get("/gstr1/report", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const { month, year, format = "json" } = req.query;
		const organizationId = (req as any).user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!month || !year) {
			return res.status(400).json({
				error: "Missing required query parameters: month, year",
			});
		}

		const monthInt = parseInt(month as string, 10);
		const yearInt = parseInt(year as string, 10);

		if (isNaN(monthInt) || isNaN(yearInt)) {
			return res.status(400).json({
				error: "month and year must be valid integers",
			});
		}

		const report = await generateGSTR1Report(organizationId, monthInt, yearInt);

		if (format === "csv") {
			const csv = generateGSTR1CSV(report);
			res.setHeader("Content-Type", "text/csv; charset=utf-8");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.csv"`,
			);
			return res.send(csv);
		}

		if (format === "json-submission") {
			const jsonData = generateGSTR1JSON(report);
			res.setHeader("Content-Type", "application/json");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.json"`,
			);
			return res.json(jsonData);
		}

		// Default: return full report object
		res.json(report);
	} catch (error: any) {
		console.error("Error generating GSTR-1 report:", error);
		res.status(500).json({
			error: "Failed to generate GSTR-1 report",
			message: error.message,
		});
	}
});

/**
 * GET /gst/gstr1/export-csv
 * Direct CSV export endpoint
 */
router.get("/gstr1/export-csv", authenticateJWT, async (req: Request, res: Response) => {
	try {
		const { month, year } = req.query;
		const organizationId = (req as any).user?.organizationId;

		if (!organizationId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!month || !year) {
			return res.status(400).json({
				error: "Missing required query parameters: month, year",
			});
		}

		const monthInt = parseInt(month as string, 10);
		const yearInt = parseInt(year as string, 10);

		const report = await generateGSTR1Report(organizationId, monthInt, yearInt);
		const csv = generateGSTR1CSV(report);

		res.setHeader("Content-Type", "text/csv; charset=utf-8");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="GSTR1_${monthInt.toString().padStart(2, "0")}_${yearInt}.csv"`,
		);
		res.send(csv);
	} catch (error: any) {
		console.error("Error exporting GSTR-1 CSV:", error);
		res.status(500).json({
			error: "Failed to export GSTR-1 report",
			message: error.message,
		});
	}
});

export default router;
