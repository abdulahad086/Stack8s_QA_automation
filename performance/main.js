import { authenticate } from './helpers/auth.js';
import { generateHtmlReport } from './helpers/html_report.js';

import { testAuthScenario } from './scenarios/01_auth.js';
import { testComputeScenario } from './scenarios/02_compute.js';
import { testStorageScenario } from './scenarios/03_storage.js';
import { testAppsScenario } from './scenarios/04_apps.js';
import { testStacksScenario } from './scenarios/05_stacks.js';
import { testMonitoringScenario } from './scenarios/06_monitoring.js';

/**
 * k6 Configuration Options & Load Profiles
 */
export const options = {
  stages: [
    { duration: '15s', target: 5 },   // Ramp-up to 5 VUs
    { duration: '30s', target: 10 },  // Sustained load at 10 VUs
    { duration: '15s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests must complete within 2000ms
    'http_req_failed': ['rate<0.10'],    // HTTP error rate must be below 10%
    'checks': ['rate>0.85'],             // 85%+ assertion checks must pass
  },
};

/**
 * Setup function: Executed once before load testing begins.
 * Authenticates with Stack8s API and returns cookies/headers to VUs.
 */
export function setup() {
  const authData = authenticate();
  return authData;
}

/**
 * Main Workload Execution for each Virtual User (VU)
 */
export default function (authData) {
  testAuthScenario();
  testComputeScenario(authData);
  testStorageScenario(authData);
  testAppsScenario(authData);
  testStacksScenario(authData);
  testMonitoringScenario(authData);
}

/**
 * k6 Summary Reporter Hook: Generates HTML and JSON reports on completion.
 */
export function handleSummary(data) {
  return {
    'performance/reports/performance_report.html': generateHtmlReport(data),
    'performance/reports/summary.json': JSON.stringify(data, null, 2),
  };
}
