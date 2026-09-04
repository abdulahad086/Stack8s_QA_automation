import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';

test.describe('API Suite — Monitoring & Container Registry Module', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('API-REG-001: GET /registry returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/registry`);
    expect([200, 304]).toContain(response.status());
  });

  test('API-MON-001: GET /overview/monitoring returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/overview/monitoring`);
    expect([200, 304]).toContain(response.status());
  });
});
