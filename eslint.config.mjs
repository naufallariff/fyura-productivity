import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Tambahan dari Claude: Mematikan aturan react-hooks/refs khusus untuk folder projects
  {
    files: ["features/projects/**/*.tsx"],
    rules: {
      // dnd-kit returns plain values (transform, isDragging, attributes) and setter
      // callbacks that the static heuristic mistakes for refs. Refs are never read
      // during render here, so the rule is disabled for this folder only.
      "react-hooks/refs": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Imported agent guides and archived design examples are not application code.
    ".agents/**",
    "archieve/**",
    "dashborad-ideas/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
