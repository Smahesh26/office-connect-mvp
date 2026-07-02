"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plans_controller_1 = require("./plans.controller");
const plansRouter = (0, express_1.Router)();
plansRouter.get("/plans", plans_controller_1.getActivePlansController);
exports.default = plansRouter;
