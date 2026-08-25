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
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePrisma = void 0;
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("@prisma/client");
const connectionString = process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/cambliss?schema=public";
let prismaInstance;
let poolInstance = null;
try {
    poolInstance = new pg_1.Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
    });
    const adapter = new adapter_pg_1.PrismaPg(poolInstance);
    prismaInstance = new client_1.PrismaClient({ adapter });
}
catch (err) {
    console.error("[prisma] Warning initializing PostgreSQL pool:", err);
    prismaInstance = new client_1.PrismaClient();
}
const closePrisma = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prismaInstance.$disconnect();
        if (poolInstance) {
            yield poolInstance.end();
        }
    }
    catch (e) {
        console.warn("[prisma] Error disconnecting:", e);
    }
});
exports.closePrisma = closePrisma;
exports.default = prismaInstance;
