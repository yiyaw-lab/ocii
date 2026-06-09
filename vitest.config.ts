import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // Local git worktrees live under .claude/worktrees and ship their own
    // divergent copies of the test suite. Don't scan them.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
});
