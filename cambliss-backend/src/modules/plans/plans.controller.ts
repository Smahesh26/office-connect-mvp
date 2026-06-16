import { Request, Response } from "express";
import { getActivePlans } from "./plans.service";

export const getActivePlansController = async (_req: Request, res: Response): Promise<void> => {
	try {
		const plans = await getActivePlans();
		res.status(200).json(plans);
	} catch {
		res.status(500).json({ message: "Failed to fetch plans" });
	}
};
