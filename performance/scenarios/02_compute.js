import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';

export function testComputeScenario(authData) {
  const params = {
    headers: authData ? authData.headers : { 'Content-Type': 'application/json' },
    tags: { name: 'GET Compute Data' },
  };

  // 1. GET Stacks / Compute Page
  const computeRes = http.get(`${BASE_URL}/stacks`, params);
  check(computeRes, {
    'Compute page status valid': (r) => [200, 304].includes(r.status),
    'Compute page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}

export default testComputeScenario;
