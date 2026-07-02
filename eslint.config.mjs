import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // eslint-config-next 16 newly enables this react-hooks (React Compiler) rule
      // as an error. It flags many legitimate patterns we rely on — media-query
      // sync, prop→state sync on dialog open, IntersectionObserver/parallax resets —
      // and would also require editing vendored shadcn files under src/components/ui/
      // (forbidden by CLAUDE.md). Disabled project-wide as an intentional choice.
      "react-hooks/set-state-in-effect": "off",
      // Card/cover images come from many external hosts (self-hosted Supabase plus
      // some hotlinked official sites), so next/image remotePatterns is impractical
      // and would also fight the Snowglobe scale layout. We intentionally use <img>.
      "@next/next/no-img-element": "off",
      // Underscore-prefixed args/vars are intentionally kept (unused route/handler
      // params, deliberately-ignored destructured props). Honor the convention.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
