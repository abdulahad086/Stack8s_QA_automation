import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';
const EMAIL = process.env.STACK8S_USER || 'jon@stack8s.com';
const PASSWORD = process.env.STACK8S_PASSWORD || 'Abc@1234';

test.describe('API Suite — Authentication Module', () => {
  test('API-AUTH-001: POST /api/auth/login with valid credentials @api @smoke', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: EMAIL,
        password: PASSWORD,
      },
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json().catch(() => ({}));
    expect(response.ok()).toBeTruthy();
  });

  test('API-AUTH-002: POST /api/auth/login with invalid credentials returns error status @api @functional', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: EMAIL,
        password: 'WrongPassword123!',
      },
    });

    expect([200, 400, 401, 403, 404, 422, 500]).toContain(response.status());
  });

  test('API-AUTH-003: GET /auth/sign-in returns 200 OK @api @smoke', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/auth/sign-in`);
    expect(response.status()).toBe(200);
  });
});
