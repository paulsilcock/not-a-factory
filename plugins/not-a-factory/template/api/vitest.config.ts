import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["reflect-metadata", "@litmus-ts/test/vitest-setup"],
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
