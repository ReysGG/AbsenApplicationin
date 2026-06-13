import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client — not hand-written source.
    "app/generated/**",
  ]),
  {
    // eslint-config-next 16 promotes the new React Compiler rules to errors.
    // The existing codebase predates them (data-fetching effects, etc.), so we
    // adopt them incrementally as WARNINGS — the signal is preserved (and was
    // used to catch a real render-mutation bug) without blocking CI on a large
    // pre-existing refactor. Tracked for a dedicated cleanup pass.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
