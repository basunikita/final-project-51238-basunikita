import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// The test process reads the Clerk keys and test users' emails from .env.local.
dotenv.config({ path: ".env.local", quiet: true });

const APP_PORT = 3100;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global.setup.ts",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: APP_URL, trace: "retain-on-failure" },
  webServer: {
    // next dev fails in the course sandbox, so the test runs a production build.
    command: `npm run build && npx next start -p ${APP_PORT} -H 127.0.0.1`,
    url: APP_URL,
    timeout: 180_000,
  },
});
