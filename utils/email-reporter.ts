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

const LOGO_URL = 'https://stack8s-public-assets.s3.amazonaws.com/stack8s-with-name.png';

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
    const emailFrom = process.env.EMAIL_FROM || `"Stack8s QA" <${smtpUser || 'qa@stack8s.com'}>`;

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
  // HTML Builder — matches Stack8s transactional email format exactly
  // ═══════════════════════════════════════════════════════════════════
  private buildEmail(d: {
    isSuccess: boolean; failedCount: number; passRate: number;
    durationMin: string; durationSec: number; dateStr: string; environment: string;
  }): string {

    const blue    = '#2563eb';
    const navy    = '#0f172a';
    const heading = '#0f172a';
    const body    = '#475569';
    const muted   = '#94a3b8';
    const light   = '#cbd5e1';
    const green   = '#16a34a';
    const red     = '#dc2626';
    const bgPage  = '#eef1f6';
    const bgCard  = '#ffffff';
    const bgTable = '#f8fafc';
    const border  = '#e2e8f0';

    const statusColor = d.isSuccess ? green : red;
    const statusLabel = d.isSuccess ? 'ALL TESTS PASSED' : 'DEFECTS DETECTED';
    const statusHeading = d.isSuccess
      ? 'Build is Stable'
      : `${d.failedCount} Test(s) Failed`;

    // ── Module rows ──
    const moduleRows = Array.from(this.moduleMap.entries())
      .map(([, m], i) => {
        const rowBg = i % 2 === 0 ? bgCard : bgTable;
        const badge = m.failed > 0
          ? `<span style="display:inline-block;background-color:${red};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">FAIL</span>`
          : `<span style="display:inline-block;background-color:${green};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">PASS</span>`;
        return `<tr style="background-color:${rowBg};">
          <td style="padding:10px 14px;border-bottom:1px solid ${border};color:${heading};font-size:13px;font-weight:500;">${m.name}</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${border};color:${heading};text-align:center;font-size:13px;">${m.total}</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${border};color:${green};text-align:center;font-size:13px;font-weight:600;">${m.passed}</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${border};color:${m.failed > 0 ? red : muted};text-align:center;font-size:13px;font-weight:600;">${m.failed}</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${border};text-align:center;">${badge}</td>
        </tr>`;
      }).join('');

    // ── Failed test cards ──
    const failedCards = this.failedTests
      .map((f) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
        <tr><td style="background-color:${bgTable};border-left:4px solid ${red};border-radius:6px;padding:14px 16px;">
          <div style="font-size:14px;font-weight:700;color:${heading};margin-bottom:4px;">${f.title}</div>
          <div style="font-size:12px;color:${muted};margin-bottom:10px;">
            ${f.file}:${f.line} &nbsp;&middot;&nbsp; ${f.duration}s &nbsp;&middot;&nbsp; Retry #${f.retries}
          </div>
          <div style="background-color:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:10px 12px;">
            <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${red};white-space:pre-wrap;word-break:break-all;line-height:1.5;">${f.errorMsg}</div>
          </div>
        </td></tr>
        </table>`)
      .join('');

    // ── Metric cell helper ──
    const metric = (val: string | number, label: string, color: string) => `
      <td width="25%" align="center" style="padding:6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" style="background-color:${bgTable};border:1px solid ${border};border-radius:8px;padding:16px 4px;">
            <div style="font-size:28px;font-weight:800;color:${color};line-height:1;">${val}</div>
            <div style="font-size:10px;color:${muted};text-transform:uppercase;letter-spacing:1.5px;margin-top:5px;font-weight:600;">${label}</div>
          </td>
        </tr></table>
      </td>`;

    return `<!-- Stack8s QA Automation Report — table layout, inline styles, email-safe -->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Stack8s QA Report</title>
</head>

<body style="margin:0;padding:0;background-color:${bgPage};">
    <!-- hidden preheader -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Stack8s QA Report: ${d.passRate}% pass rate — ${d.isSuccess ? 'all tests passed' : d.failedCount + ' test(s) failed'}.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:${bgPage};margin:0;padding:0;">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                    style="width:100%;max-width:600px;border-radius:16px;box-shadow:0 6px 28px rgba(15,23,42,0.10);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

                    <!-- HERO BANNER -->
                    <tr>
                        <td align="center" bgcolor="${navy}"
                            style="background-color:${navy};background-image:linear-gradient(135deg,${navy} 0%,#1e3a8a 55%,${blue} 100%);border-radius:16px 16px 0 0;padding:56px 40px;">
                            <img src="${LOGO_URL}" alt="stack8s" height="40" style="display:block;height:40px;width:auto;border:0;">
                        </td>
                    </tr>
                    <!-- accent strip -->
                    <tr><td style="height:4px;line-height:4px;font-size:0;background-color:${statusColor};">&nbsp;</td></tr>

                    <!-- BODY CARD -->
                    <tr>
                        <td style="background-color:${bgCard};border-radius:0 0 16px 16px;padding:44px 44px 40px 44px;">

                            <!-- Status Label + Heading -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${statusColor};">
                                        ${statusLabel}
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-size:26px;line-height:1.3;font-weight:700;color:${heading};padding-bottom:14px;">
                                        ${statusHeading}
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-size:15px;line-height:1.65;color:${body};">
                                        ${d.passRate}% of tests passed across ${this.moduleMap.size} modules
                                        on <strong>${d.environment}</strong>.
                                    </td>
                                </tr>
                            </table>

                            <!-- Run Info -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="margin:24px 0 0 0;background-color:${bgTable};border:1px solid ${border};border-radius:8px;">
                                <tr>
                                    <td style="padding:14px 18px;font-size:13px;line-height:1.8;color:${body};">
                                        <strong style="color:${heading};">Environment</strong>&nbsp;&nbsp;
                                        <a href="${d.environment}" style="color:${blue};text-decoration:none;">${d.environment}</a><br>
                                        <strong style="color:${heading};">Executed</strong>&nbsp;&nbsp;${d.dateStr}<br>
                                        <strong style="color:${heading};">Duration</strong>&nbsp;&nbsp;${d.durationMin} min (${d.durationSec}s)
                                    </td>
                                </tr>
                            </table>

                            <!-- Metric Cards -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;">
                                <tr>
                                    ${metric(this.totalTests, 'Total', blue)}
                                    ${metric(this.passedTests, 'Passed', green)}
                                    ${metric(d.failedCount, 'Failed', d.failedCount > 0 ? red : green)}
                                    ${metric(this.skippedTests, 'Skipped', '#d97706')}
                                </tr>
                            </table>

                            <!-- Pass Rate Bar -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;">
                                <tr>
                                    <td style="font-size:12px;font-weight:600;color:${heading};padding-bottom:6px;">Overall Health</td>
                                    <td align="right" style="font-size:12px;font-weight:700;color:${statusColor};padding-bottom:6px;">${d.passRate}%</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding:0;">
                                        <div style="width:100%;height:8px;background-color:${border};border-radius:4px;">
                                            <div style="width:${d.passRate}%;height:8px;background-color:${statusColor};border-radius:4px;"></div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Module Breakdown -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
                                <tr>
                                    <td style="font-size:16px;font-weight:700;color:${heading};padding-bottom:12px;">Module Breakdown</td>
                                </tr>
                                <tr>
                                    <td>
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                            style="border:1px solid ${border};border-radius:8px;border-collapse:separate;">
                                            <tr style="background-color:${navy};">
                                                <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;border-radius:8px 0 0 0;">Module</th>
                                                <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Tests</th>
                                                <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Passed</th>
                                                <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;">Failed</th>
                                                <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px;font-weight:600;border-radius:0 8px 0 0;">Status</th>
                                            </tr>
                                            ${moduleRows}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${d.failedCount > 0 ? `
                            <!-- Defect Details -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
                                <tr>
                                    <td style="font-size:16px;font-weight:700;color:${red};padding-bottom:12px;">
                                        Defect Details
                                    </td>
                                </tr>
                                <tr><td>${failedCards}</td></tr>
                            </table>
                            ` : `
                            <!-- All Clear -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
                                <tr>
                                    <td align="center" style="background-color:${bgTable};border:1px solid ${border};border-radius:10px;padding:28px;">
                                        <div style="font-size:16px;font-weight:700;color:${green};">Zero Defects — All Systems Healthy</div>
                                        <div style="font-size:13px;color:${body};margin-top:6px;">The build is stable and ready for deployment.</div>
                                    </td>
                                </tr>
                            </table>
                            `}

                            <!-- Sign-off -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="font-size:15px;color:${heading};font-weight:600;padding-top:28px;">
                                        The stack8s QA Team
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

                <!-- footer (outside the card) -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                    style="width:100%;max-width:600px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <tr>
                        <td align="center" style="padding:24px 8px;">
                            <p style="margin:0;font-size:12px;line-height:1.5;color:${muted};">
                                Automated report from the Stack8s QA Pipeline. Do not reply to this email.
                            </p>
                            <p style="margin:6px 0 0 0;font-size:12px;color:${light};">&copy; stack8s</p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;
  }
}

export default EmailReporter;
