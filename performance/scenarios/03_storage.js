import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';

export function testStorageScenario(authData) {
  const params = {
    headers: authData ? authData.headers : { 'Content-Type': 'application/json' },
    tags: { name: 'GET Storage Data' },
  };

  // 1. GET Storage sub-route
  const storageRes = http.get(`${BASE_URL}/stacks?stack=llm`, params);
  check(storageRes, {
    'Storage route status valid': (r) => [200, 304].includes(r.status),
    'Storage response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(0.5);
}

export default testStorageScenario;
