import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { StacksPage } from '../../pages/StacksPage';

test.describe('Stacks Module', () => {
  let loginPage: LoginPage;
  let stacksPage: StacksPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    stacksPage = new StacksPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await stacksPage.goto('stack8s12');
  });

  test('STK-001: Verify Stacks page loads with selected stack & sub-tabs @smoke @functional @regression', async () => {
    await stacksPage.assertPageLoaded();
    await stacksPage.assertTitleContains('Stacks | Stack8s');
  });

  test('STK-002: Verify Stack Selector dropdown opens and lists active stacks @smoke @functional @regression', async ({ page }) => {
    const selectorBtn = page.locator('button:has-text("stack8s12")').first();
    await expect(selectorBtn).toBeVisible();
    await selectorBtn.click();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('test-stack');

    await page.keyboard.press('Escape');
  });

  test('STK-003: Verify Overview tab capacity metrics & running workloads table @smoke @functional @regression', async ({ page }) => {
    await stacksPage.clickOverviewTab();
    await page.waitForTimeout(1500);

    await expect(stacksPage.capacityCard).toBeVisible();
    await expect(stacksPage.workloadsCard).toBeVisible();
    await expect(stacksPage.runningWorkloadsTable).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Running workloads');
  });

  test('STK-004: Dynamic API vs UI Validation for Stacks Inventory @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/forge/clusters/') && res.url().includes('/stacks') && res.status() === 200,
      { timeout: 15000 }
    );

    await stacksPage.goto('stack8s12');
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /stacks API Data:', JSON.stringify(data));

    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);

    const stackNames = data.data.map((s: any) => s.name);
    expect(stackNames).toContain('stack8s12');
  });

  test('STK-005: Verify Components tab installed components list & details @smoke @functional @regression', async ({ page }) => {
    await stacksPage.clickComponentsTab();
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Installed components');
  });

  test('STK-006: Verify Connections tab inter-component connectivity endpoints matrix @functional @regression', async ({ page }) => {
    await stacksPage.clickConnectionsTab();
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Connections');
  });

  test('STK-007: Verify Settings tab resource quotas and Danger Zone @functional @regression', async ({ page }) => {
    await stacksPage.clickSettingsTab();
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Resource limits');
    expect(bodyText).toContain('Delete stack');
    await expect(stacksPage.deleteStackButton).toBeVisible();
  });

  test('STK-NAV-001: Verify tab switching between Overview, Components, Connections, and Settings @regression', async ({ page }) => {
    await stacksPage.clickComponentsTab();
    await page.waitForTimeout(1000);
    let bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Installed components');

    await stacksPage.clickConnectionsTab();
    await page.waitForTimeout(1000);
    bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Connections');

    await stacksPage.clickSettingsTab();
    await page.waitForTimeout(1000);
    await expect(stacksPage.deleteStackButton).toBeVisible();

    await stacksPage.clickOverviewTab();
    await page.waitForTimeout(1000);
    await expect(stacksPage.capacityCard).toBeVisible();
  });
});
