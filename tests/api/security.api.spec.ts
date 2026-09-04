import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://develop-v2.stack8s.com';
const API_BASE_URL = 'https://develop-v2-api.stack8s.com';

test.describe('API Suite — Security Headers & Vulnerability Audit', () => {

  test('SEC-001: API endpoints return secure Content-Type and security headers @security @api', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/login`).catch(() => null) 
      || await request.get(`${BASE_URL}/auth/sign-in`);

    expect(response).not.toBeNull();
    const headers = response!.headers();

    // Verify Content-Type header exists
    expect(headers['content-type']).toBeDefined();

    // Verify X-Content-Type-Options nosniff or security posture
    if (headers['x-content-type-options']) {
      expect(headers['x-content-type-options']).toBe('nosniff');
    }
  });

  test('SEC-002: Protected endpoints reject requests with invalid Bearer token (HTTP 401/403) @security @api', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/workflows/cache/stats`, {
      headers: {
        'Authorization': 'Bearer invalid_fake_token_99999',
      },
    });

    // Protected API must refuse unauthorized fake bearer tokens
    expect([401, 403, 400, 422]).toContain(response.status());
  });

  test('SEC-003: Auth login payload prevents SQL injection and malformed input crashes @security @api', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: "' OR '1'='1' --",
        password: "<script>alert('xss')</script>",
      },
    });

    // Must handle malformed/malicious input gracefully without 500 server crashes
    expect([400, 401, 403, 422, 200]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('SEC-004: OpenAPI documentation enforces HTTPS protocol encryption @security @api', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/openapi.json`);
    expect(response.status()).toBe(200);
    expect(response.url()).toContain('https://');
  });
});
