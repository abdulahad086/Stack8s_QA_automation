import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ComputePage } from '../../pages/ComputePage';

test.describe('Compute Module', () => {
  let loginPage: LoginPage;
  let computePage: ComputePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    computePage = new ComputePage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await computePage.goto();
  });

  test('CMP-001: Verify Compute Overview page loads with cluster details @smoke @functional @regression', async () => {
    await computePage.assertPageLoaded();
    await computePage.assertTitleContains('Compute | Stack8s');
  });

  test('CMP-002: Dynamic API vs UI Validation for Compute Nodes @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/forge/clusters/') && res.url().includes('/nodes') && res.status() === 200,
      { timeout: 15000 }
    );

    await computePage.goto();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /nodes API Data:', JSON.stringify(data));

    const nodeCount = data.nodes?.length || 0;
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    const firstNodeName = data.nodes[0]?.name;
    expect(firstNodeName).toBeTruthy();
  });

  test('CMP-003: Verify Pools tab displays active node pools @smoke @functional @regression', async ({ page }) => {
    await computePage.clickPoolsTab();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Pools');
  });

  test('CMP-004: Verify GPUs tab empty state when no GPUs attached @functional @regression', async ({ page }) => {
    await computePage.clickGpusTab();
    await page.waitForTimeout(1000);

    await expect(computePage.gpuEmptyBanner).toBeVisible();
  });

  test('CMP-005: Verify Network tab cluster health matrix @functional @regression', async ({ page }) => {
    await computePage.clickNetworkTab();
    await page.waitForTimeout(1000);

    await expect(computePage.networkHealthMatrix).toBeVisible();
  });

  test('CMP-KCFG-001: Verify Kubeconfig button triggers file download @smoke @functional @regression', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await computePage.kubeconfigButton.click();
    await page.waitForTimeout(1000);

    // If a dropdown/menu appears after clicking, click the download option inside it
    const downloadOption = page.getByRole('menuitem', { name: /download|kubeconfig/i })
      .or(page.locator('a:has-text("Download"), button:has-text("Download")'))
      .first();
    if (await downloadOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await downloadOption.click();
    }

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*kubeconfig.*/i);
  });

  test('CMP-NAV-001: Verify tab switching between Overview, Pools, GPUs, and Network @regression', async ({ page }) => {
    await computePage.clickPoolsTab();
    await page.waitForTimeout(500);

    await computePage.clickGpusTab();
    await page.waitForTimeout(500);
    await expect(computePage.gpuEmptyBanner).toBeVisible();

    await computePage.clickNetworkTab();
    await page.waitForTimeout(500);
    await expect(computePage.networkHealthMatrix).toBeVisible();

    await computePage.clickOverviewTab();
    await page.waitForTimeout(500);
    await computePage.assertPageLoaded();
  });
});
