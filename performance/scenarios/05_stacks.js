import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';

export function testStacksScenario(authData) {
  const params = {
    headers: authData ? authData.headers : { 'Content-Type': 'application/json' },
    tags: { name: 'GET Stacks & Templates' },
  };

  // 1. GET Stacks page
  const stacksRes = http.get(`${BASE_URL}/stacks`, params);
  check(stacksRes, {
    'Stacks page status valid': (r) => [200, 304].includes(r.status),
    'Stacks page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // 2. GET Templates page
  const templatesRes = http.get(`${BASE_URL}/templates`, params);
  check(templatesRes, {
    'Templates page status valid': (r) => [200, 304].includes(r.status),
    'Templates page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}

export default testStacksScenario;
