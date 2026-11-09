import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // server-only melempar error di luar Next.js. Di test, cukup kosong.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "lib/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});
