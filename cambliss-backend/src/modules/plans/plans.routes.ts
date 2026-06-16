import { Router } from "express";
import { getActivePlansController } from "./plans.controller";

const plansRouter = Router();

plansRouter.get("/plans", getActivePlansController);

export default plansRouter;
