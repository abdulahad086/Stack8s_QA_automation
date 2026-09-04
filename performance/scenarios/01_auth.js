import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';
const EMAIL = __ENV.STACK8S_USER || 'jon@stack8s.com';
const PASSWORD = __ENV.STACK8S_PASSWORD || 'Abc@1234';

export function testAuthScenario() {
  // 1. POST Login Endpoint
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST /api/auth/login' },
    }
  );

  check(loginRes, {
    'Auth Login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'Auth Login response time < 800ms': (r) => r.timings.duration < 800,
  });

  sleep(0.5);

  // 2. GET Sign-in Page Load Performance
  const meRes = http.get(`${BASE_URL}/auth/sign-in`, {
    tags: { name: 'GET /auth/sign-in' },
  });

  check(meRes, {
    'Sign-in page status valid': (r) => r.status === 200 || r.status === 304,
    'Sign-in page response time < 800ms': (r) => r.timings.duration < 800,
  });

  sleep(0.5);
}

export default testAuthScenario;
