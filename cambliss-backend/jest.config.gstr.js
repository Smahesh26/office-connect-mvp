/** @type {import('jest').Config} */
const config = {
	displayName: "gstr-service",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	testTimeout: 30000,
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/prisma/"],
};

module.exports = config;
