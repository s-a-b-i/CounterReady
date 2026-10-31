import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  use: { baseURL: "http://localhost:3102", screenshot: "off" },
  webServer: {
    command: "npm run build && npx next start -p 3102",
    url: "http://localhost:3102/api/health",
    timeout: 240_000,
    reuseExistingServer: true,
    env: { YOUCAM_MOCK: "1", MAX_PREVIEWS_PER_SESSION: "8" },
  },
});
