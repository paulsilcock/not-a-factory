import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["@litmus-ts/test/vitest-setup"],
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    globalSetup: ["global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    passWithNoTests: true,
  },
});
