import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';

export function testAppsScenario(authData) {
  const params = {
    headers: authData ? authData.headers : { 'Content-Type': 'application/json' },
    tags: { name: 'GET Apps & Custom Workloads' },
  };

  // 1. GET Applications page
  const appsRes = http.get(`${BASE_URL}/apps`, params);
  check(appsRes, {
    'Apps page status valid': (r) => [200, 304].includes(r.status),
    'Apps page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // 2. GET Custom Workloads page
  const customRes = http.get(`${BASE_URL}/custom-apps`, params);
  check(customRes, {
    'Custom Workloads page status valid': (r) => [200, 304].includes(r.status),
    'Custom Workloads response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}

export default testAppsScenario;
