import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';

export function testMonitoringScenario(authData) {
  const params = {
    headers: authData ? authData.headers : { 'Content-Type': 'application/json' },
    tags: { name: 'GET Monitoring & Registry' },
  };

  // 1. GET Registry page
  const registryRes = http.get(`${BASE_URL}/registry`, params);
  check(registryRes, {
    'Registry page status valid': (r) => [200, 304].includes(r.status),
    'Registry page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);

  // 2. GET Monitoring / Overview page
  const monitoringRes = http.get(`${BASE_URL}/overview/monitoring`, params);
  check(monitoringRes, {
    'Monitoring page status valid': (r) => [200, 304].includes(r.status),
    'Monitoring page response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}

export default testMonitoringScenario;
