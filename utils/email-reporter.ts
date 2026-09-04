import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import nodemailer from 'nodemailer';

interface FailedTestDetail {
  title: string;
  file: string;
  line: number;
  errorMsg: string;
  duration: number;
  retries: number;
}

interface ModuleStats {
  name: string;
  total: number;
  passed: number;
  failed: number;
}

// Stack8s logo hosted on their own CDN — works in all email clients
const LOGO_URL = 'https://articles.stack8s.ai/content/images/size/w256h256/2026/07/Asset-7--1-.png';

class EmailReporter implements Reporter {
  private failedTests: FailedTestDetail[] = [];
  private totalTests = 0;
  private passedTests = 0;
  private skippedTests = 0;
  private startTime = 0;
  private moduleMap = new Map<string, ModuleStats>();

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
    this.failedTests = [];
    this.passedTests = 0;
    this.skippedTests = 0;
    this.moduleMap.clear();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const pathParts = test.location.file.split('/');
    const testsIdx = pathParts.indexOf('tests');
    let moduleName = 'Other';
    if (testsIdx !== -1 && pathParts.length > testsIdx + 1) {
      const folder = pathParts[testsIdx + 1];
      const moduleNames: Record<string, string> = {
        auth: 'Authentication',
        resources: 'Global Resources',
        compute: 'Compute',
        storage: 'Storage',
        stacks: 'Stacks',
        apps: 'Deploy Apps',
        custom_apps: 'Custom Workloads',
        templates: 'Templates',
        registry: 'Container Registry',
        cost_figures: 'Cost Figures',
        monitoring: 'Monitoring',
        settings: 'Settings',
        api: 'API & Security',
      };
      moduleName = moduleNames[folder] || folder;
    }

    if (!this.moduleMap.has(moduleName)) {
      this.moduleMap.set(moduleName, { name: moduleName, total: 0, passed: 0, failed: 0 });
    }
    const mod = this.moduleMap.get(moduleName)!;
    mod.total++;

    if (result.status === 'passed') {
      this.passedTests++;
      mod.passed++;
    } else if (result.status === 'skipped') {
      this.skippedTests++;
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      mod.failed++;
      const errorMsg = result.error?.message || 'Unknown test failure';
      const cleanError = errorMsg.replace(/\u001b\[\d+m/g, '').substring(0, 500);
      this.failedTests.push({
        title: test.title,
        file: test.location.file.split('/').slice(-2).join('/'),
        line: test.location.line,
        errorMsg: cleanError,
        duration: Math.round(result.duration / 1000),
        retries: result.retry,
      });
    }
  }

  async onEnd(result: FullResult) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailTo = process.env.EMAIL_TO || process.env.NOTIFICATION_EMAIL;
    const emailFrom = process.env.EMAIL_FROM || `"Stack8s QA Bot" <${smtpUser || 'qa@stack8s.com'}>`;

    if (!smtpHost || !smtpUser || !emailTo) {
      console.log('\n[Email Reporter] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TO in .env');
      return;
    }

    const sendAlways = process.env.EMAIL_ALWAYS === 'true';
    if (this.failedTests.length === 0 && !sendAlways) {
      console.log('[Email Reporter] All tests passed — skipping email (set EMAIL_ALWAYS=true for all reports).');
      return;
    }

    const durationSec = Math.round((Date.now() - this.startTime) / 1000);
    const durationMin = (durationSec / 60).toFixed(1);
    const failedCount = this.failedTests.length;
    const passRate = this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0;
    const isSuccess = failedCount === 0;
    const environment = process.env.BASE_URL || 'https://develop-v2.stack8s.com';
    const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';

    const subject = isSuccess
      ? `Stack8s QA — All ${this.totalTests} Tests Passed`
      : `Stack8s QA Alert — ${failedCount} Test(s) Failed`;

    const htmlBody = this.buildEmail({ isSuccess, failedCount, passRate, durationMin, durationSec, dateStr, environment });

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost, port: smtpPort, secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({ from: emailFrom, to: emailTo, subject, html: htmlBody });
      console.log(`\n[Email Reporter] Stack8s QA Report sent to: ${emailTo}\n`);
    } catch (err: any) {
      console.error('[Email Reporter] Send failed:', err.message || err);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HTML Builder — Stack8s Branded, Mobile-safe, No Emojis
  // ═══════════════════════════════════════════════════════════════════
  private buildEmail(d: {
    isSuccess: boolean; failedCount: number; passRate: number;
    durationMin: string; durationSec: number; dateStr: string; environment: string;
  }): string {

    // Stack8s Brand Colors
    const C = {
      body:    '#030712',
      card:    '#0f172a',
      inner:   '#1e293b',
      border:  '#1e293b',
      border2: '#334155',
      white:   '#ffffff',
      muted:   '#94a3b8',
      dim:     '#64748b',
      blue:    '#2563eb',
      cyan:    '#38bdf8',
      green:   '#22c55e',
      red:     '#ef4444',
      yellow:  '#eab308',
    };

    const statusColor = d.isSuccess ? C.green : C.red;
    const statusText = d.isSuccess
      ? 'All Tests Passed — Build is Stable'
      : `${d.failedCount} Defect(s) Detected — Action Required`;

    // ── Module rows ──
    const moduleRows = Array.from(this.moduleMap.entries())
      .map(([, m]) => {
        const badge = m.failed > 0
          ? `<span style="display:inline-block;background-color:${C.red};color:#fff;padding:3px 14px;border-radius:20px;font-size:11px;font-weight:600;line-height:16px;">FAIL</span>`
          : `<span style="display:inline-block;background-color:${C.green};color:#fff;padding:3px 14px;border-radius:20px;font-size:11px;font-weight:600;line-height:16px;">PASS</span>`;
        return `<tr>
          <td style="padding:11px 16px;border-bottom:1px solid ${C.border};color:${C.white};font-size:13px;font-weight:500;background-color:${C.inner};">${m.name}</td>
          <td style="padding:11px 12px;border-bottom:1px solid ${C.border};color:${C.white};text-align:center;font-size:13px;background-color:${C.inner};">${m.total}</td>
          <td style="padding:11px 12px;border-bottom:1px solid ${C.border};color:${C.green};text-align:center;font-size:13px;font-weight:600;background-color:${C.inner};">${m.passed}</td>
          <td style="padding:11px 12px;border-bottom:1px solid ${C.border};color:${m.failed > 0 ? C.red : C.dim};text-align:center;font-size:13px;font-weight:600;background-color:${C.inner};">${m.failed}</td>
          <td style="padding:11px 12px;border-bottom:1px solid ${C.border};text-align:center;background-color:${C.inner};">${badge}</td>
        </tr>`;
      }).join('');

    // ── Failed test cards ──
    const failedCards = this.failedTests
      .map((f) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;" role="presentation">
        <tr><td style="background-color:${C.inner};border-left:4px solid ${C.red};border-radius:8px;padding:16px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="font-size:14px;font-weight:700;color:${C.white};padding-bottom:6px;">${f.title}</td></tr>
            <tr><td style="font-size:12px;color:${C.muted};padding-bottom:10px;">
              File: ${f.file}:${f.line} &nbsp;&nbsp;|&nbsp;&nbsp; Duration: ${f.duration}s &nbsp;&nbsp;|&nbsp;&nbsp; Retry #${f.retries}
            </td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
                <td style="background-color:${C.body};border:1px solid ${C.border};border-radius:6px;padding:12px 14px;">
                  <div style="font-size:10px;color:${C.dim};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600;">Error Output</div>
                  <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#fca5a5;white-space:pre-wrap;word-break:break-all;line-height:1.5;">${f.errorMsg}</div>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        </table>`)
      .join('');

    // ── Metric card helper ──
    const card = (val: string | number, label: string, color: string) => `
      <td width="25%" style="padding:4px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td align="center" style="background-color:${C.inner};border:1px solid ${C.border};border-radius:10px;padding:18px 4px;">
            <div style="font-size:30px;font-weight:800;color:${color};line-height:1;">${val}</div>
            <div style="font-size:10px;color:${C.dim};text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:600;">${label}</div>
          </td>
        </tr></table>
      </td>`;

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    body, .body-bg { background-color: ${C.body} !important; }
    .card-bg { background-color: ${C.card} !important; }
    .inner-bg { background-color: ${C.inner} !important; }
    .darkest-bg { background-color: ${C.body} !important; }
    u + .body .gmail-blend { background-color: ${C.body} !important; }
    @media (prefers-color-scheme: dark) {
      body, .body-bg { background-color: ${C.body} !important; }
      .card-bg { background-color: ${C.card} !important; }
      .inner-bg { background-color: ${C.inner} !important; }
    }
    @media only screen and (max-width: 680px) {
      .main-table { width: 100% !important; }
      .metric-card td { padding: 14px 2px !important; }
      .metric-val { font-size: 22px !important; }
    }
  </style>
</head>
<body class="body-bg" style="margin:0;padding:0;background-color:${C.body};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;">

<!-- Gmail background fix -->
<div class="gmail-blend" style="background-color:${C.body};width:100%;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="body-bg" style="background-color:${C.body};padding:24px 0;">
<tr><td align="center" class="body-bg" style="background-color:${C.body};">

<!-- Main Card -->
<table width="660" cellpadding="0" cellspacing="0" role="presentation" class="main-table card-bg" style="background-color:${C.card};border-radius:16px;border:1px solid ${C.border2};max-width:660px;width:100%;">

  <!-- ═══ LOGO HEADER ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:24px 32px;border-bottom:1px solid ${C.border};">
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td valign="middle" style="padding-right:14px;">
          <img src="${LOGO_URL}" width="38" height="38" alt="Stack8s" style="display:block;border:0;outline:none;width:38px;height:38px;" />
        </td>
        <td valign="middle">
          <span style="font-size:24px;font-weight:700;color:${C.white};letter-spacing:-0.5px;">stack8s</span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- ═══ STATUS BANNER ═══ -->
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="background-color:${statusColor};padding:14px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="font-size:15px;font-weight:700;color:#ffffff;">${statusText}</td>
              <td align="right" style="font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;">${d.passRate}% Pass Rate</td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ META INFO ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:20px 32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="font-size:13px;color:${C.muted};line-height:1.9;">
          <strong style="color:${C.white};">Environment</strong>&nbsp;&nbsp;
          <a href="${d.environment}" style="color:${C.cyan};text-decoration:none;">${d.environment}</a><br>
          <strong style="color:${C.white};">Executed</strong>&nbsp;&nbsp;${d.dateStr}<br>
          <strong style="color:${C.white};">Duration</strong>&nbsp;&nbsp;${d.durationMin} minutes (${d.durationSec}s) &nbsp;|&nbsp;
          <strong style="color:${C.white};">Runner</strong>&nbsp;&nbsp;Playwright + k6
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ═══ METRIC CARDS ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:4px 28px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="metric-card">
        <tr>
          ${card(this.totalTests, 'Total', C.cyan)}
          ${card(this.passedTests, 'Passed', C.green)}
          ${card(d.failedCount, 'Failed', d.failedCount > 0 ? C.red : C.green)}
          ${card(this.skippedTests, 'Skipped', C.yellow)}
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ HEALTH BAR ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:8px 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="font-size:12px;font-weight:600;color:${C.white};padding-bottom:6px;">Overall Health</td>
          <td align="right" style="font-size:12px;font-weight:700;color:${statusColor};padding-bottom:6px;">${d.passRate}%</td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td class="inner-bg" style="background-color:${C.inner};border-radius:6px;height:10px;padding:0;">
            <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:${d.passRate}%;height:10px;"><v:fill type="gradient" color="${C.blue}" color2="${statusColor}"/><![endif]-->
            <div style="width:${d.passRate}%;height:10px;background:linear-gradient(90deg,${C.blue},${statusColor});border-radius:6px;"></div>
            <!--[if mso]></v:rect><![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ MODULE BREAKDOWN ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:0 32px 20px;">
      <div style="font-size:15px;font-weight:700;color:${C.white};margin-bottom:12px;">Module Breakdown</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${C.border};border-radius:10px;border-collapse:separate;overflow:hidden;">
        <tr>
          <th class="darkest-bg" style="background-color:${C.body};padding:10px 16px;text-align:left;font-size:11px;color:${C.dim};text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid ${C.border};font-weight:600;">Module</th>
          <th class="darkest-bg" style="background-color:${C.body};padding:10px 12px;text-align:center;font-size:11px;color:${C.dim};text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid ${C.border};font-weight:600;">Tests</th>
          <th class="darkest-bg" style="background-color:${C.body};padding:10px 12px;text-align:center;font-size:11px;color:${C.dim};text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid ${C.border};font-weight:600;">Passed</th>
          <th class="darkest-bg" style="background-color:${C.body};padding:10px 12px;text-align:center;font-size:11px;color:${C.dim};text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid ${C.border};font-weight:600;">Failed</th>
          <th class="darkest-bg" style="background-color:${C.body};padding:10px 12px;text-align:center;font-size:11px;color:${C.dim};text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid ${C.border};font-weight:600;">Status</th>
        </tr>
        ${moduleRows}
      </table>
    </td>
  </tr>

  ${d.failedCount > 0 ? `
  <!-- ═══ DEFECT DETAILS ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:0 32px 24px;">
      <div style="font-size:15px;font-weight:700;color:${C.red};margin-bottom:14px;">Defect Details (${d.failedCount})</div>
      ${failedCards}
    </td>
  </tr>
  ` : `
  <!-- ═══ ALL CLEAR ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td align="center" class="inner-bg" style="background-color:${C.inner};border:1px solid ${C.border};border-radius:12px;padding:28px;">
          <div style="font-size:16px;font-weight:700;color:${C.green};">Zero Defects — All Systems Healthy</div>
          <div style="font-size:13px;color:${C.muted};margin-top:6px;">The build is stable and ready for deployment.</div>
        </td>
      </tr></table>
    </td>
  </tr>
  `}

  <!-- ═══ FOOTER ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:20px 32px;border-top:1px solid ${C.border};">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td valign="middle">
          <table cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td valign="middle" style="padding-right:8px;">
              <img src="${LOGO_URL}" width="20" height="20" alt="S" style="display:block;border:0;width:20px;height:20px;" />
            </td>
            <td valign="middle">
              <span style="font-size:14px;font-weight:700;color:${C.white};">stack8s</span>
            </td>
          </tr></table>
        </td>
        <td align="right" style="font-size:11px;color:${C.dim};">
          Enterprise Kubernetes Platform<br>QA Automation Report
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- ═══ LEGAL ═══ -->
  <tr>
    <td class="card-bg" style="background-color:${C.card};padding:0 32px 16px;">
      <div style="font-size:10px;color:${C.dim};text-align:center;">
        Automated report from Stack8s QA Pipeline. Do not reply to this email.
      </div>
    </td>
  </tr>

</table>

</td></tr>
</table>
</div>

</body>
</html>`;
  }
}

export default EmailReporter;
