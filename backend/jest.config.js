/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "src/core/**/*.ts",
    "src/functions/**/*.ts",
    "!src/core/database/table.ts",
    "!src/core/database/adapters/*.ts",
    "!src/core/database/entities/*.ts",
    "!src/functions/**/__tests__/*.ts",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
};
