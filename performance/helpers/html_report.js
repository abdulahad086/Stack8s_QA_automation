/**
 * Pure JavaScript Offline HTML Reporter for k6
 * Generates a modern, responsive HTML report without requiring external CDN dependencies.
 */

export function generateHtmlReport(data) {
  const metrics = data.metrics;
  
  function getMetric(name, stat, defaultValue = 0) {
    if (metrics[name] && metrics[name].values && metrics[name].values[stat] !== undefined) {
      return Number(metrics[name].values[stat]).toFixed(2);
    }
    return defaultValue;
  }

  const httpReqDurationAvg = getMetric('http_req_duration', 'avg');
  const httpReqDurationP90 = getMetric('http_req_duration', 'p(90)');
  const httpReqDurationP95 = getMetric('http_req_duration', 'p(95)');
  const httpReqDurationMax = getMetric('http_req_duration', 'max');
  const httpReqDurationMin = getMetric('http_req_duration', 'min');
  
  const httpReqsTotal = getMetric('http_reqs', 'count', 0);
  const httpReqsRps = getMetric('http_reqs', 'rate', 0);
  
  const httpFailedRate = getMetric('http_req_failed', 'value', 0);
  const httpFailedPct = (httpFailedRate * 100).toFixed(2);
  
  const vusMax = getMetric('vus_max', 'value', getMetric('vus', 'max', 1));
  const checksRate = getMetric('checks', 'value', 1);
  const checksPct = (checksRate * 100).toFixed(2);
  
  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Determine overall status
  const isFailed = Number(httpFailedPct) > 5 || Number(checksPct) < 90;
  const statusBadge = isFailed
    ? '<span class="badge badge-fail">FAILED (SLA Breached)</span>'
    : '<span class="badge badge-pass">PASSED</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stack8s Performance Test Report</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent-blue: #38bdf8;
      --accent-green: #22c55e;
      --accent-red: #ef4444;
      --accent-yellow: #eab308;
      --accent-purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    h1 { font-size: 24px; font-weight: 700; color: var(--text); }
    .meta { font-size: 14px; color: var(--text-muted); }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
    }
    .badge-pass { background: rgba(34, 197, 94, 0.2); color: var(--accent-green); border: 1px solid var(--accent-green); }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: 1px solid var(--accent-red); }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .card-title { font-size: 13px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 700; color: var(--text); }
    .card-unit { font-size: 14px; font-weight: 400; color: var(--text-muted); }

    .section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: var(--accent-blue); }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: rgba(15, 23, 42, 0.5);
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .fill-green { background: var(--accent-green); }
    .fill-red { background: var(--accent-red); }

    footer {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🚀 Stack8s Performance Test Report</h1>
        <div class="meta">Environment: https://develop-v2.stack8s.com | Generated: ${dateStr}</div>
      </div>
      <div>${statusBadge}</div>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total Requests</div>
        <div class="card-value">${httpReqsTotal} <span class="card-unit">reqs</span></div>
        <div class="meta">${httpReqsRps} req/s</div>
      </div>
      <div class="card">
        <div class="card-title">Avg Response Time</div>
        <div class="card-value">${httpReqDurationAvg} <span class="card-unit">ms</span></div>
        <div class="meta">Min: ${httpReqDurationMin}ms | Max: ${httpReqDurationMax}ms</div>
      </div>
      <div class="card">
        <div class="card-title">p(90) Response Time</div>
        <div class="card-value">${httpReqDurationP90} <span class="card-unit">ms</span></div>
        <div class="meta">90% requests faster than this</div>
      </div>
      <div class="card">
        <div class="card-title">p(95) Response Time</div>
        <div class="card-value">${httpReqDurationP95} <span class="card-unit">ms</span></div>
        <div class="meta">SLA Target: &lt; 500ms</div>
      </div>
      <div class="card">
        <div class="card-title">Peak Virtual Users</div>
        <div class="card-value">${vusMax} <span class="card-unit">VUs</span></div>
        <div class="meta">Concurrent Users</div>
      </div>
      <div class="card">
        <div class="card-title">Error Rate</div>
        <div class="card-value" style="color: ${Number(httpFailedPct) > 5 ? 'var(--accent-red)' : 'var(--accent-green)'}">
          ${httpFailedPct}%
        </div>
        <div class="meta">SLA Target: &lt; 1%</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📊 Key Metrics & Response Times</div>
      <table>
        <thead>
          <tr>
            <th>Metric Name</th>
            <th>Avg</th>
            <th>Min</th>
            <th>Med (p50)</th>
            <th>p(90)</th>
            <th>p(95)</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>HTTP Request Duration (http_req_duration)</strong></td>
            <td>${httpReqDurationAvg} ms</td>
            <td>${httpReqDurationMin} ms</td>
            <td>${getMetric('http_req_duration', 'med')} ms</td>
            <td>${httpReqDurationP90} ms</td>
            <td>${httpReqDurationP95} ms</td>
            <td>${httpReqDurationMax} ms</td>
          </tr>
          <tr>
            <td>HTTP Waiting / TTFB (http_req_waiting)</td>
            <td>${getMetric('http_req_waiting', 'avg')} ms</td>
            <td>${getMetric('http_req_waiting', 'min')} ms</td>
            <td>${getMetric('http_req_waiting', 'med')} ms</td>
            <td>${getMetric('http_req_waiting', 'p(90)')} ms</td>
            <td>${getMetric('http_req_waiting', 'p(95)')} ms</td>
            <td>${getMetric('http_req_waiting', 'max')} ms</td>
          </tr>
          <tr>
            <td>HTTP Connecting (http_req_connecting)</td>
            <td>${getMetric('http_req_connecting', 'avg')} ms</td>
            <td>${getMetric('http_req_connecting', 'min')} ms</td>
            <td>${getMetric('http_req_connecting', 'med')} ms</td>
            <td>${getMetric('http_req_connecting', 'p(90)')} ms</td>
            <td>${getMetric('http_req_connecting', 'p(95)')} ms</td>
            <td>${getMetric('http_req_connecting', 'max')} ms</td>
          </tr>
          <tr>
            <td>TLS Handshaking (http_req_tls_handshaking)</td>
            <td>${getMetric('http_req_tls_handshaking', 'avg')} ms</td>
            <td>${getMetric('http_req_tls_handshaking', 'min')} ms</td>
            <td>${getMetric('http_req_tls_handshaking', 'med')} ms</td>
            <td>${getMetric('http_req_tls_handshaking', 'p(90)')} ms</td>
            <td>${getMetric('http_req_tls_handshaking', 'p(95)')} ms</td>
            <td>${getMetric('http_req_tls_handshaking', 'max')} ms</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">🎯 Assertion Checks & SLAs</div>
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;">
          <span>Checks Pass Rate</span>
          <span>${checksPct}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${Number(checksPct) >= 95 ? 'fill-green' : 'fill-red'}" style="width: ${checksPct}%;"></div>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;">
          <span>HTTP Request Success Rate</span>
          <span>${(100 - Number(httpFailedPct)).toFixed(2)}%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${Number(httpFailedPct) <= 5 ? 'fill-green' : 'fill-red'}" style="width: ${(100 - Number(httpFailedPct)).toFixed(2)}%;"></div>
        </div>
      </div>
    </div>

    <footer>
      Stack8s QA Automation & Performance Testing Suite | Generated by k6 Load Tester
    </footer>
  </div>
</body>
</html>`;
}

export default generateHtmlReport;
