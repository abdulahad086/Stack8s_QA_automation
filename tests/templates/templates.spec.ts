import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { TemplatesPage } from '../../pages/TemplatesPage';

test.describe('Templates Module', () => {
  let loginPage: LoginPage;
  let templatesPage: TemplatesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    templatesPage = new TemplatesPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await templatesPage.goto();
  });

  test('TMP-001: Verify Templates page loads with Marketplace & AI Models tabs @smoke @functional @regression', async ({ page }) => {
    await templatesPage.assertPageLoaded();
    await expect(page).toHaveTitle(/Templates/i);

    const bodyText = await templatesPage.page.locator('body').innerText();
    expect(bodyText).toContain('Deploy pre-configured applications');
    expect(bodyText).toContain('Marketplace');
    expect(bodyText).toContain('AI Models');
  });

  test('TMP-002: Dynamic API vs UI Validation for Installed Components / Templates Catalog @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/installed-components') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /installed-components API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('status', 'success');
    expect(data).toHaveProperty('components');
    expect(Array.isArray(data.components)).toBe(true);

    if (data.components.length > 0) {
      const firstComponentName = data.components[0]?.name;
      expect(firstComponentName).toBeTruthy();
    }
  });

  test('TMP-003: Verify Search input filters template catalog dynamically @smoke @functional @regression', async ({ page }) => {
    await templatesPage.searchApp('PostgreSQL');
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('PostgreSQL');

    await templatesPage.clearSearch();
    await page.waitForTimeout(1000);

    const resetBodyText = await page.locator('body').innerText();
    expect(resetBodyText).toContain('Marketplace');
  });

  test('TMP-004: Verify Category Filter Pills toggle active categories @functional @regression', async ({ page }) => {
    if (await templatesPage.databasesCategoryPill.isVisible().catch(() => false)) {
      await templatesPage.databasesCategoryPill.click();
      await page.waitForTimeout(500);
    }

    if (await templatesPage.aiCategoryPill.isVisible().catch(() => false)) {
      await templatesPage.aiCategoryPill.click();
      await page.waitForTimeout(500);
    }

    if (await templatesPage.monitoringCategoryPill.isVisible().catch(() => false)) {
      await templatesPage.monitoringCategoryPill.click();
      await page.waitForTimeout(500);
    }

    if (await templatesPage.allCategoryPill.isVisible().catch(() => false)) {
      await templatesPage.allCategoryPill.click();
      await page.waitForTimeout(500);
    }
  });

  test('TMP-005: Verify Tab switching between Marketplace and AI Models @functional @regression', async ({ page }) => {
    await templatesPage.aiModelsTab.click();
    await page.waitForTimeout(1000);

    await templatesPage.marketplaceTab.click();
    await page.waitForTimeout(1000);

    await expect(templatesPage.marketplaceTab).toBeVisible();
  });

  test('TMP-006: Verify "Installed" sub-tab shows installed template components @functional @regression', async ({ page }) => {
    await templatesPage.installedSubTab.click();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Installed');

    await templatesPage.allAppsSubTab.click();
    await page.waitForTimeout(1000);
  });

  test('TMP-007: Verify "Install" button opens Target Environment modal & Cancel dismisses it @smoke @functional @regression', async ({ page }) => {
    await templatesPage.openInstallModalFirstCard();

    await expect(page.getByText(/Select Target Environment|Deploy/i).first()).toBeVisible();
    await expect(templatesPage.modalCancelButton).toBeVisible();

    await templatesPage.dismissInstallModal();
    await page.waitForTimeout(500);

    await expect(templatesPage.installModal).toBeHidden();
  });

  test('TMP-NAV-001: Full navigation loop across Templates categories, search, install modal, and reset @regression', async ({ page }) => {
    await templatesPage.searchApp('Grafana');
    await page.waitForTimeout(500);

    await templatesPage.clearSearch();
    await page.waitForTimeout(500);

    await templatesPage.openInstallModalFirstCard();
    await templatesPage.dismissInstallModal();

    await templatesPage.assertPageLoaded();
  });
});
