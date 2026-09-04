import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';

test.describe('API Suite — Applications & Custom Workloads Module', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('API-APP-001: GET /apps returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/apps`);
    expect([200, 304]).toContain(response.status());
  });

  test('API-APP-002: GET /custom-apps returns HTTP 200 OK @api @functional', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/custom-apps`);
    expect([200, 304]).toContain(response.status());
  });
});
