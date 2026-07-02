/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: "node",
	setupFiles: ["<rootDir>/jest.setup.ts"],
	setupFilesAfterEnv: ["<rootDir>/jest.after-env.ts"],
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.json",
			},
		],
	},
	moduleFileExtensions: ["ts", "js", "json"],
	testTimeout: 60000,
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/index.ts"],
	coveragePathIgnorePatterns: ["/node_modules/", "/prisma/"],
};
