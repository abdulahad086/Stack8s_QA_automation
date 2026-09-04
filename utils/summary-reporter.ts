import { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface FailedTestDetail {
  id: string;
  title: string;
  error: string;
  attachments: string[];
}

export default class CustomSummaryReporter implements Reporter {
  private startTime: number = 0;
  private totalTests: number = 0;
  private passedTests: number = 0;
  private failedTests: number = 0;
  private skippedTests: number = 0;
  private failures: FailedTestDetail[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    this.totalTests = suite.allTests().length;
    console.log(`\n======================================================`);
    console.log(`🚀 Starting Stack8s E2E Execution (${this.totalTests} tests)`);
    console.log(`======================================================\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'passed') {
      this.passedTests++;
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      this.failedTests++;
      const testIdMatch = test.title.match(/([A-Z]+-\d+)/);
      const testId = testIdMatch ? testIdMatch[1] : 'N/A';
      
      const attachments = result.attachments.map(att => `${att.name}: ${att.path || 'N/A'}`);
      
      this.failures.push({
        id: testId,
        title: test.title,
        error: result.error?.message?.split('\n')[0] || 'Unknown error',
        attachments
      });
    } else if (result.status === 'skipped') {
      this.skippedTests++;
    }
  }

  onEnd(result: FullResult) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passRate = this.totalTests > 0 
      ? Math.round((this.passedTests / this.totalTests) * 100) 
      : 0;

    const envName = process.env.BASE_URL || 'Development (https://develop-v2.stack8s.com)';
    const dateStr = new Date().toISOString();

    let reportLines = [
      `Stack8s Automation Report`,
      `--------------------------------------------------`,
      `Environment: ${envName}`,
      `Execution Time: ${dateStr} (${duration}s)`,
      `Total: ${this.totalTests}`,
      `Passed: ${this.passedTests}`,
      `Failed: ${this.failedTests}`,
      `Skipped: ${this.skippedTests}`,
      `Pass Rate: ${passRate}%`,
      `--------------------------------------------------`
    ];

    if (this.failures.length > 0) {
      reportLines.push(`\nFailed Tests:`);
      this.failures.forEach(f => {
        reportLines.push(`  * [${f.id}] ${f.title}`);
        reportLines.push(`    Error: ${f.error}`);
        if (f.attachments.length > 0) {
          reportLines.push(`    Evidence:`);
          f.attachments.forEach(att => reportLines.push(`      - ${att}`));
        }
      });
    } else {
      reportLines.push(`\nAll tests passed successfully! 🎉`);
    }

    const summaryText = reportLines.join('\n');
    console.log('\n' + summaryText + '\n');

    try {
      const outputDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputDir, 'summary.txt'), summaryText, 'utf-8');
    } catch (e) {
      console.error('Failed to write summary report file:', e);
    }
  }
}
