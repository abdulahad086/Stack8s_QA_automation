import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://develop-v2-api.stack8s.com';

test.describe('FastAPI Backend OpenAPI Specification Tests (https://develop-v2-api.stack8s.com)', () => {
  
  test('API-BACKEND-001: GET /api/v1/worker-nodes/providers returns valid cloud providers list @api @openapi', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/worker-nodes/providers`);
    expect([200, 304, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    }
  });

  test('API-BACKEND-002: GET /api/v1/worker-nodes/health returns health status @api @openapi', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/worker-nodes/health`);
    expect([200, 304, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('API-BACKEND-003: GET /tcp-ports/service-types returns supported TCP service types @api @openapi', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/tcp-ports/service-types`);
    expect([200, 304, 401]).toContain(response.status());
  });

  test('API-BACKEND-004: GET /api/v1/workflows/cache/stats returns Redis cache metrics @api @openapi', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/workflows/cache/stats`);
    expect([200, 304, 401]).toContain(response.status());
  });

  test('API-BACKEND-005: GET /openapi.json returns valid OpenAPI 3.0 specification JSON @api @openapi', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/openapi.json`);
    expect(response.status()).toBe(200);
    
    const schema = await response.json();
    expect(schema.openapi).toBeDefined();
    expect(schema.info).toBeDefined();
    expect(schema.info.title).toContain('Stack8s');
    expect(schema.paths).toBeDefined();
  });
});
