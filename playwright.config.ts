import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['./utils/summary-reporter.ts'],
    ['./utils/email-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://develop-v2.stack8s.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
