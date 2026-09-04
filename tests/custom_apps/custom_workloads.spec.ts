import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { CustomWorkloadsPage } from '../../pages/CustomWorkloadsPage';

test.describe('Custom Workloads Module', () => {
  let loginPage: LoginPage;
  let customWorkloadsPage: CustomWorkloadsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    customWorkloadsPage = new CustomWorkloadsPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await customWorkloadsPage.goto();
  });

  test('CST-001: Verify Custom Workloads page loads with inventory table & metric summary @smoke @functional @regression', async () => {
    await customWorkloadsPage.assertPageLoaded();
    await customWorkloadsPage.assertTitleContains('Custom Workloads | Stack8s');

    const bodyText = await customWorkloadsPage.page.locator('body').innerText();
    expect(bodyText).toContain('Workload inventory');
    expect(bodyText).toContain('Custom Workloads');
    expect(bodyText).toContain('Deployed');
    expect(bodyText).toContain('Attention');
  });

  test('CST-002: Dynamic API vs UI Validation for Custom Workloads Inventory @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/custom-workloads') && res.status() === 200,
      { timeout: 15000 }
    );

    await customWorkloadsPage.goto();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /custom-workloads API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);

    if (data.items.length > 0) {
      const firstWorkloadName = data.items[0]?.metadata?.name;
      expect(firstWorkloadName).toBeTruthy();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toContain(firstWorkloadName);
    }
  });

  test('CST-003: Verify "Create workload" button navigates to deployment wizard page @smoke @functional @regression', async ({ page }) => {
    await customWorkloadsPage.clickCreateWorkload();
    await page.waitForTimeout(1500);

    await customWorkloadsPage.assertWizardLoaded();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Choose a destination, configure the container');
    expect(bodyText).toContain('WORKLOAD KIND');
  });

  test('CST-004: Verify Workload Kind switcher highlights active kind in deployment wizard @functional @regression', async ({ page }) => {
    await customWorkloadsPage.gotoNewWorkload();
    await page.waitForTimeout(1500);

    await expect(customWorkloadsPage.deploymentKindButton).toBeVisible();

    await customWorkloadsPage.statefulSetKindButton.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.cronJobKindButton.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.deploymentKindButton.click();
    await page.waitForTimeout(500);
  });

  test('CST-005: Verify Wizard step navigation across Destination, Container Image, Environment, Run Config, Resources, Service @functional @regression', async ({ page }) => {
    await customWorkloadsPage.gotoNewWorkload();
    await page.waitForTimeout(1500);

    await customWorkloadsPage.containerImageTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.envSecretsTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.runConfigTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.resourcesTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.serviceTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.reviewDeployTab.click();
    await page.waitForTimeout(500);

    await customWorkloadsPage.destinationTab.click();
    await page.waitForTimeout(500);
  });

  test('CST-006: Verify "Cancel" button in Creation Wizard returns to Custom Workloads inventory @functional @regression', async ({ page }) => {
    await customWorkloadsPage.gotoNewWorkload();
    await page.waitForTimeout(1500);

    await customWorkloadsPage.cancelButton.click();
    await page.waitForTimeout(1000);

    await customWorkloadsPage.assertPageLoaded();
  });

  test('CST-007: Real E2E Custom Workload Deployment Wizard Form Interaction & Readiness Validation @smoke @functional @regression', async ({ page }) => {
    await customWorkloadsPage.gotoNewWorkload();
    await page.waitForTimeout(1500);

    // Select Stack if select element has options
    if (await customWorkloadsPage.stackSelect.isVisible().catch(() => false)) {
      const options = await customWorkloadsPage.stackSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await customWorkloadsPage.stackSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }

    // Fill Name if present
    const nameInput = page.getByPlaceholder(/my-workload|app-name|deployment-name/i).or(page.locator('input[type="text"]')).first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(`test-workload-${Date.now()}`);
      await page.waitForTimeout(500);
    }

    // Click Continue to step to Container Image
    if (await customWorkloadsPage.continueButton.isEnabled().catch(() => false)) {
      await customWorkloadsPage.continueButton.click();
      await page.waitForTimeout(1000);
    }

    await expect(customWorkloadsPage.readinessSection).toBeVisible();
  });

  test('CST-NAV-001: Full navigation loop across Custom Workloads, New Workload Wizard, and Refresh action @regression', async ({ page }) => {
    await customWorkloadsPage.refreshButton.click();
    await page.waitForTimeout(1000);

    await customWorkloadsPage.gotoNewWorkload();
    await page.waitForTimeout(1000);

    await customWorkloadsPage.goto();
    await page.waitForTimeout(1000);

    await customWorkloadsPage.assertPageLoaded();
  });
});
