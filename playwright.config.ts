import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// The test process reads the Clerk keys and test users' emails from .env.local.
dotenv.config({ path: ".env.local", quiet: true });

const APP_PORT = 3100;
// E2E_BASE_URL runs the tests against a deployed site instead of a local build,
// e.g. E2E_BASE_URL=https://final-project-51238-basunikita.vercel.app npm run e2e
const LIVE_URL = process.env.E2E_BASE_URL;
const APP_URL = LIVE_URL ?? `http://localhost:${APP_PORT}`;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global.setup.ts",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: APP_URL, trace: "retain-on-failure" },
  webServer: LIVE_URL
    ? undefined
    : {
        // next dev fails in the course sandbox, so the test runs a production build.
        command: `npm run build && npx next start -p ${APP_PORT} -H localhost`,
        url: APP_URL,
        timeout: 180_000,
      },
});
