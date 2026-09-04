import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';

test.describe('API Suite — Compute Module', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('API-CMP-001: GET /stacks route returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/stacks`);
    expect([200, 304]).toContain(response.status());
  });

  test('API-CMP-002: GET /stacks?stack=llm returns HTTP 200 OK @api @functional', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/stacks?stack=llm`);
    expect([200, 304]).toContain(response.status());
  });
});
