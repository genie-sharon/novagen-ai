import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
    include: ["tests/**/*.test.{ts,tsx}", "tests/**/*.spec.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
      "**/tests/e2e/**",
      "**/tests/integration/**",
      "**/tests/live/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/coverage/**",
        "**/tests/**",
        "**/playwright-report/**",
        "**/test-results/**",
        "**/*.config.*",
        "**/next-env.d.ts",
        "**/middleware.ts",
        "**/app/layout.tsx",
        "**/app/globals.css",
        "**/app/page.tsx",
        "**/app/(app)/**",
        "**/app/(auth)/**",
        "**/tailwind.config.ts",
        "**/postcss.config.mjs",
        "**/scripts/**",
        "django_backend/**",
        "**/.venv/**",
        "**/site-packages/**",
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 72,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.js"),
    },
  },
});
