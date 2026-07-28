import { defineConfig, devices } from '@playwright/test';

// Runs against the real Vite dev server (see docs/rules.md) - reuses an
// already-running dev server instead of starting a second one. Chromium
// only for now, same call Civic made: cross-browser/real-device testing
// (especially the camera and native share sheet) stays a manual QA task
// at this stage (see docs/qa-strategy.md), not an automated one.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
