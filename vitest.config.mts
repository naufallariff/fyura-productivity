import path from "node:path";
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "lib/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});