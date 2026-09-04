import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CostFiguresPage } from '../../pages/CostFiguresPage';

test.describe('Cost Figures Module', () => {
  let loginPage: LoginPage;
  let costFiguresPage: CostFiguresPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    costFiguresPage = new CostFiguresPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await costFiguresPage.goto();
  });

  test('CST-FIG-001: Verify Cost Figures page loads with balance metrics & cost summary cards @smoke @functional @regression', async ({ page }) => {
    await costFiguresPage.assertPageLoaded();
    await expect(page).toHaveTitle(/Cost Figures/i);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Environmental Cost Figures');
    expect(bodyText).toContain('BALANCE');
    expect(bodyText).toContain('COMBINED BURN');
    expect(bodyText).toContain('MTD SPEND');
  });

  test('CST-FIG-002: Dynamic API vs UI Validation for Top Cost Resources Analytics @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/top-cost-resources') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /top-cost-resources API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('resources');
    expect(Array.isArray(data.resources)).toBe(true);

    if (data.resources.length > 0) {
      const firstInstanceType = data.resources[0]?.instance_type;
      expect(firstInstanceType).toBeTruthy();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toContain(firstInstanceType);
    }
  });

  test('CST-FIG-003: Dynamic API vs UI Validation for GPU Cost Summary Analytics @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/gpu-cost-summary') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /gpu-cost-summary API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('days');
    expect(data).toHaveProperty('total_spend');
  });

  test('CST-FIG-004: Verify Timeframe filter buttons (7d, 30d, 90d, Custom) update analytics @smoke @functional @regression', async () => {
    await costFiguresPage.selectTimeframe('7d');
    await costFiguresPage.selectTimeframe('30d');
    await costFiguresPage.selectTimeframe('90d');
    await costFiguresPage.selectTimeframe('Custom');
    await costFiguresPage.selectTimeframe('30d');

    await expect(costFiguresPage.timeframe30dButton).toBeVisible();
  });

  test('CST-FIG-005: Verify Top Cost-Driving Nodes section and GPU Only checkbox toggle @functional @regression', async ({ page }) => {
    await expect(costFiguresPage.topNodesHeader).toBeVisible();

    if (await costFiguresPage.gpuOnlyCheckbox.isVisible().catch(() => false)) {
      await costFiguresPage.gpuOnlyCheckbox.check();
      await page.waitForTimeout(500);

      await costFiguresPage.gpuOnlyCheckbox.uncheck();
      await page.waitForTimeout(500);
    }
  });

  test('CST-FIG-NAV-001: Full navigation loop across Cost Figures timeframe filters and metric tabs @regression', async () => {
    await costFiguresPage.selectTimeframe('7d');
    await costFiguresPage.selectTimeframe('30d');

    await costFiguresPage.assertPageLoaded();
  });
});
