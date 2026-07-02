"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePlans = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const getActivePlans = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prisma_1.default.plan.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                description: true,
                features: true,
                price: true,
                currency: true,
                interval: true,
                userLimit: true,
                storageLimit: true,
            },
            orderBy: {
                price: "asc",
            },
        });
    }
    catch (error) {
        throw new Error("Failed to fetch active plans");
    }
});
exports.getActivePlans = getActivePlans;
