import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@127.0.0.1:5432/cambliss?schema=public";

let prismaInstance: PrismaClient;
let poolInstance: Pool | null = null;

try {
	poolInstance = new Pool({
		connectionString,
		connectionTimeoutMillis: 5000,
	});
	const adapter = new PrismaPg(poolInstance);
	prismaInstance = new PrismaClient({ adapter });
} catch (err) {
	console.error("[prisma] Warning initializing PostgreSQL pool:", err);
	prismaInstance = new PrismaClient();
}

export const closePrisma = async () => {
	try {
		await prismaInstance.$disconnect();
		if (poolInstance) {
			await poolInstance.end();
		}
	} catch (e) {
		console.warn("[prisma] Error disconnecting:", e);
	}
};

export default prismaInstance;
