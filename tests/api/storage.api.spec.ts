import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';

test.describe('API Suite — Storage Module', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('API-STR-001: GET storage sub-route returns HTTP 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/stacks?stack=llm`);
    expect([200, 304]).toContain(response.status());
  });
});
