import { afterAll } from "@jest/globals";

afterAll(async () => {
	try {
		const { closePrisma } = await import("./src/config/prisma");
		await closePrisma();
	} catch {
		// Some suites close prisma explicitly; ignore teardown race.
	}
});
