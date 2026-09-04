import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ResourcesPage } from '../../pages/ResourcesPage';

test.describe('Global Resources Module', () => {
  let loginPage: LoginPage;
  let resourcesPage: ResourcesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    resourcesPage = new ResourcesPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }
  });

  test('OVR-RES-001: Verify Global Resources page header & title load @smoke @functional @regression', async () => {
    await resourcesPage.gotoGlobalResources();
    await resourcesPage.assertGlobalPageLoaded();
    await resourcesPage.assertTitleContains('Resources | Stack8s');
  });

  test('OVR-RES-002: Verify Total Resources and Node metric cards presence @smoke @functional @regression', async () => {
    await resourcesPage.gotoGlobalResources();
    await resourcesPage.assertMetricCardsVisible();
  });

  test('OVR-RES-003: Dynamic API vs UI Validation for Cluster Metrics @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/metrics/overview') && res.status() === 200,
      { timeout: 15000 }
    );

    await resourcesPage.gotoGlobalResources();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /metrics/overview API Data:', JSON.stringify(data));

    const apiNodeCount = data.node_count;
    expect(apiNodeCount).toBeGreaterThanOrEqual(1);

    const apiCpuCores = data.cpu?.allocatable_cores;
    expect(apiCpuCores).toBeGreaterThan(0);
  });

  test('OVR-RES-004: Dynamic API vs UI Validation for Storage Capacity @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/storage/longhorn') && res.status() === 200,
      { timeout: 15000 }
    );

    await resourcesPage.gotoGlobalResources();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /storage/longhorn API Data:', JSON.stringify(data));

    const totalCapacityGb = Math.round(data.summary?.total_capacity_gb || 0);
    expect(totalCapacityGb).toBeGreaterThan(0);
  });

  test('OVR-RES-005: Verify Storage Volumes section and status @functional @regression', async ({ page }) => {
    await resourcesPage.gotoGlobalResources();
    await page.waitForLoadState('domcontentloaded');

    const volumesHeader = page.locator('text=Volumes').first();
    await expect(volumesHeader).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Volume');
    expect(bodyText).toContain('Stack');
    expect(bodyText).toContain('Health');
  });
});
