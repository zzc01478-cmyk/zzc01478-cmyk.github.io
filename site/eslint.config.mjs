import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Pages link with plain <a> on purpose: full page loads keep the old site's scroll, focus
      // and hash-target behavior that tests/browser_contract.cjs checks.
      "@next/next/no-html-link-for-pages": "off",
      // Static export cannot optimize images; build_works.py already writes sized posters.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
