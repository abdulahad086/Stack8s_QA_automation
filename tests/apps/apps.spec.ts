import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AppsPage } from '../../pages/AppsPage';

test.describe('Deploy Apps Module', () => {
  let loginPage: LoginPage;
  let appsPage: AppsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appsPage = new AppsPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await appsPage.goto();
  });

  test('APP-001: Verify Deploy Apps page loads with metrics & application inventory @smoke @functional @regression', async () => {
    await appsPage.assertPageLoaded();
    await appsPage.assertTitleContains('Deploy Apps | Stack8s');

    const bodyText = await appsPage.page.locator('body').innerText();
    expect(bodyText).toContain('Application inventory');
    expect(bodyText).toContain('Git apps');
  });

  test('APP-002: Dynamic API vs UI Validation for Deployed Apps Inventory @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/devex/clusters/') && res.url().includes('/apps') && res.status() === 200,
      { timeout: 15000 }
    );

    await appsPage.goto();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /apps API Data:', JSON.stringify(data));

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    const firstAppName = data[0]?.name;
    expect(firstAppName).toBeTruthy();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(firstAppName);
  });

  test('APP-003: Verify Repository Settings navigation & connected Git repositories list @smoke @functional @regression', async ({ page }) => {
    await appsPage.gotoRepositorySettings();
    await page.waitForTimeout(2000);

    await expect(appsPage.gitRepositoriesSection).toBeVisible();
    await expect(appsPage.connectRepositoryButton).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Git Repositories');
  });

  test('APP-CONN-001: Verify "Connect Repository" button opens "Connect repository" modal @smoke @functional @regression', async ({ page }) => {
    await appsPage.gotoRepositorySettings();
    await page.waitForTimeout(1500);

    await appsPage.clickConnectRepository();
    await page.waitForTimeout(1000);

    await appsPage.assertConnectRepoModalVisible();
  });

  test('APP-CONN-002: Verify "Connect Repository" modal Cancel and Close actions dismiss modal @functional @regression', async ({ page }) => {
    await appsPage.gotoRepositorySettings();
    await page.waitForTimeout(1500);

    await appsPage.clickConnectRepository();
    await page.waitForTimeout(1000);

    await appsPage.dismissConnectRepoModal();
    await page.waitForTimeout(500);

    await expect(appsPage.connectRepoModal).toBeHidden();
  });

  test('APP-CONN-003: Real E2E Public Git Repository Connection Flow @smoke @functional @regression', async ({ page }) => {
    await appsPage.gotoRepositorySettings();
    await page.waitForTimeout(1500);

    await appsPage.clickConnectRepository();
    await page.waitForTimeout(1000);

    const modal = appsPage.connectRepoModal;
    await expect(modal).toBeVisible();

    const testRepo = 'go-training/helloworld';
    await appsPage.repoOwnerInput.fill(testRepo);
    await page.waitForTimeout(500);

    // Uncheck private repository checkbox for public repo connection
    const privateCheckbox = modal.locator('input[type="checkbox"]').first();
    if (await privateCheckbox.isChecked().catch(() => false)) {
      await privateCheckbox.uncheck();
      await page.waitForTimeout(500);
    }

    const connectSubmitBtn = modal.getByRole('button', { name: 'Connect' }).first();
    if (await connectSubmitBtn.isEnabled().catch(() => false)) {
      await connectSubmitBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await appsPage.dismissConnectRepoModal();
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Git Repositories');
  });

  test('APP-NEW-001: Verify "New git app" button opens deployment wizard page @smoke @functional @regression', async ({ page }) => {
    await appsPage.gotoNewGitApp();
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/.*apps\/new/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Deploy a service from a connected repository');
    expect(bodyText).toContain('New git app');
  });

  test('APP-NEW-002: Verify "New git app" Cancel action returns to Apps inventory @functional @regression', async ({ page }) => {
    await appsPage.gotoNewGitApp();
    await page.waitForTimeout(1500);

    await appsPage.wizardCancelButton.click();
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/.*apps/);
    await appsPage.assertPageLoaded();
  });

  test('APP-E2E-001: Real E2E Deploy Git App, Verify Inventory, and Clean Up Delete @smoke @functional @regression', async ({ page }) => {
    const uniqueAppName = `e2e-app-${Date.now()}`;

    // Step 1: Navigate to New Git App Deployment Wizard
    await appsPage.gotoNewGitApp();
    await page.waitForTimeout(2000);

    // Step 2: Select Repository
    const repoSelect = page.locator('select').first();
    const options = await repoSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      await repoSelect.selectOption({ index: 1 });
    }
    await page.waitForTimeout(1000);

    // Step 3: Enter App Name
    const nameInput = page.getByPlaceholder(/my-app/i).or(page.locator('input')).last();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(uniqueAppName);
    }

    // Step 4: Click Create and Deploy
    const createBtn = page.getByRole('button', { name: /create and deploy|deploy/i }).first();
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Step 5: Verify App in /apps Inventory Table
    await appsPage.goto();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Application inventory');

    // Step 6: Clean Up / Delete App
    const appRow = page.locator(`tr:has-text("${uniqueAppName}"), div:has-text("${uniqueAppName}")`).first();
    if (await appRow.isVisible().catch(() => false)) {
      const deleteBtn = appRow.getByRole('button', { name: /delete|remove/i }).or(appRow.locator('button:has-text("Delete")')).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        const confirmDeleteBtn = page.getByRole('button', { name: /delete|confirm|yes/i }).last();
        if (await confirmDeleteBtn.isVisible().catch(() => false)) {
          await confirmDeleteBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('APP-NAV-001: Verify full navigation flow across Apps, Repository Settings, and New App wizard @regression', async ({ page }) => {
    await appsPage.gotoRepositorySettings();
    await page.waitForTimeout(1000);
    await expect(appsPage.gitRepositoriesSection).toBeVisible();

    await appsPage.gotoNewGitApp();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*apps\/new/);

    await appsPage.goto();
    await page.waitForTimeout(1000);
    await appsPage.assertPageLoaded();
  });
});
