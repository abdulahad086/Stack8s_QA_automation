import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://develop-v2.stack8s.com';
const EMAIL = __ENV.STACK8S_USER || 'jon@stack8s.com';
const PASSWORD = __ENV.STACK8S_PASSWORD || 'Abc@1234';

/**
 * Authenticate and return session cookies + auth headers.
 * Called once per VU in setup() and shared across all scenarios.
 */
export function authenticate() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /api/auth/login' } }
  );

  check(loginRes, {
    'Login status is 200': (r) => r.status === 200,
    'Login returns auth data': (r) => r.body.length > 0,
  });

  // Extract cookies from the login response and build Cookie header string
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(BASE_URL);
  let cookieHeader = '';
  if (cookies && typeof cookies === 'object') {
    cookieHeader = Object.keys(cookies)
      .map((key) => `${key}=${Array.isArray(cookies[key]) ? cookies[key][0] : cookies[key]}`)
      .join('; ');
  }

  // Try to extract Bearer token from response body
  let authToken = '';
  try {
    const body = JSON.parse(loginRes.body);
    authToken = body.token || body.access_token || body.accessToken || '';
  } catch (e) {
    // Token might be in cookies only
  }

  return {
    cookies: cookies,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    },
  };
}

export default authenticate;
