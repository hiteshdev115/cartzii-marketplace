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
    // Deployment artifacts (standalone builds, PM2 configs)
    "deploy/**",
    "fresh-deploy/**",
  ]),
    {
      // ecosystem.config.js is a pm2 config. pm2 reads it with require(), so it
      // must be CommonJS — `import` there is not an option. Only the CommonJS
      // rule is switched off; the file is still linted for everything else.
      files: ["ecosystem.config.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
]);

export default eslintConfig;
