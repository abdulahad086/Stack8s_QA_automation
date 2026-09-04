import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';

test.describe('API Suite — Stacks & Templates Module', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('API-STK-001: GET /stacks endpoint returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/stacks`);
    expect([200, 304]).toContain(response.status());
  });

  test('API-TPL-001: GET /templates catalog endpoint returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/templates`);
    expect([200, 304]).toContain(response.status());
  });
});
