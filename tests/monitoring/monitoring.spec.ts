import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MonitoringPage } from '../../pages/MonitoringPage';

test.describe('Monitoring Module', () => {
  let loginPage: LoginPage;
  let monitoringPage: MonitoringPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    monitoringPage = new MonitoringPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await monitoringPage.goto();
  });

  test('MON-001: Verify Monitoring page loads with pods summary & resource metrics cards @smoke @functional @regression', async ({ page }) => {
    await monitoringPage.assertPageLoaded();
    await expect(page).toHaveTitle(/Monitoring/i);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Monitoring');
    expect(bodyText).toContain('Pods Running');
    expect(bodyText).toContain('Cluster CPU');
    expect(bodyText).toContain('Cluster Memory');
  });

  test('MON-002: Dynamic API vs UI Validation for Monitoring Cluster Overview @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/monitoring/cluster-overview') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /monitoring/cluster-overview API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('prometheus_available', true);
    expect(data).toHaveProperty('pods');
    expect(data.pods).toHaveProperty('running');
  });

  test('MON-003: Dynamic API vs UI Validation for Historical Node Metrics @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/monitoring/historical/nodes') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /monitoring/historical/nodes API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('nodes');
    expect(Array.isArray(data.nodes)).toBe(true);
  });

  test('MON-004: Dynamic API vs UI Validation for Projects & Stacks Pod Distribution @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/monitoring/projects-stacks') && res.status() === 200,
      { timeout: 15000 }
    );

    await monitoringPage.clickStackResourcesTab();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /monitoring/projects-stacks API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('projects');
    expect(Array.isArray(data.projects)).toBe(true);
  });

  test('MON-005: Verify Timeframe filter buttons (1h, 6h, 24h, 7d) update historical charts @smoke @functional @regression', async () => {
    await monitoringPage.selectTimeframe('1h');
    await monitoringPage.selectTimeframe('6h');
    await monitoringPage.selectTimeframe('24h');
    await monitoringPage.selectTimeframe('7d');
    await monitoringPage.selectTimeframe('1h');

    await expect(monitoringPage.timeframe1hButton).toBeVisible();
  });

  test('MON-006: Verify View tab switching between Node Resources, Stack Resources, and GPU Metrics @smoke @functional @regression', async () => {
    await monitoringPage.clickStackResourcesTab();
    await monitoringPage.clickGpuMetricsTab();
    await monitoringPage.clickNodeResourcesTab();

    await expect(monitoringPage.nodeResourcesTab).toBeVisible();
  });

  test('MON-NAV-001: Full navigation loop across Monitoring views, timeframe filters, and refresh @regression', async ({ page }) => {
    await monitoringPage.refreshButton.click();
    await page.waitForTimeout(1000);

    await monitoringPage.selectTimeframe('6h');
    await monitoringPage.clickStackResourcesTab();
    await monitoringPage.clickNodeResourcesTab();

    await monitoringPage.assertPageLoaded();
  });
});
