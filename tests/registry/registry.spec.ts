import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ContainerRegistryPage } from '../../pages/ContainerRegistryPage';

test.describe('Container Registry Module', () => {
  let loginPage: LoginPage;
  let registryPage: ContainerRegistryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    registryPage = new ContainerRegistryPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await registryPage.goto();
  });

  test('REG-001: Verify Container Registry page loads with Images, Settings, Credentials tabs @smoke @functional @regression', async ({ page }) => {
    await registryPage.assertPageLoaded();
    await registryPage.assertTitleContains('Container Registry | Stack8s');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Container Registry');
    expect(bodyText).toContain('The registry running inside your cluster');
    expect(bodyText).toContain('Images');
    expect(bodyText).toContain('Settings');
    expect(bodyText).toContain('Credentials');
  });

  test('REG-002: Dynamic API vs UI Validation for Connected External Registry Credentials @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/registry-credentials') && res.status() === 200,
      { timeout: 15000 }
    );

    await registryPage.clickCredentialsTab();
    const response = await responsePromise;

    const credentials = await response.json();
    console.log('Intercepted /registry-credentials API Data:', JSON.stringify(credentials));

    expect(Array.isArray(credentials)).toBe(true);
    if (credentials.length > 0) {
      const firstCredName = credentials[0]?.name;
      expect(firstCredName).toBeTruthy();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toContain(firstCredName);
    }
  });

  test('REG-003: Dynamic API vs UI Validation for In-Cluster Registry Repositories @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/registry/repositories') && res.status() === 200,
      { timeout: 15000 }
    );

    await registryPage.goto();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /registry/repositories API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('repositories');
    expect(Array.isArray(data.repositories)).toBe(true);

    if (data.repositories.length > 0) {
      const firstRepoPath = data.repositories[0];
      const repoShortName = firstRepoPath.split('/').pop();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).toContain(repoShortName);
    }
  });

  test('REG-004: Verify Settings tab displays Docker access details and code snippets @smoke @functional @regression', async ({ page }) => {
    await registryPage.clickSettingsTab();
    await page.waitForTimeout(1000);

    await expect(registryPage.dockerAccessHeader).toBeVisible();
    await expect(registryPage.registryHostLabel).toBeVisible();
    await expect(registryPage.dockerLoginCodeSnippet).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('docker login');
    expect(bodyText).toContain('docker pull');
  });

  test('REG-005: Verify Credentials tab displays External Registries list and Manage action @smoke @functional @regression', async ({ page }) => {
    await registryPage.clickCredentialsTab();
    await page.waitForTimeout(1000);

    await expect(registryPage.externalRegistriesHeader).toBeVisible();
    await expect(registryPage.manageCredentialsButton).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Credentials for registries outside this cluster');
  });

  test('REG-006: Verify Repository selection in Images tab loads image tags panel @functional @regression', async ({ page }) => {
    await registryPage.clickImagesTab();
    await page.waitForTimeout(1000);

    await registryPage.selectFirstRepository();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Tags');
  });

  test('REG-NAV-001: Full tab switching navigation across Images, Settings, and Credentials @regression', async ({ page }) => {
    await registryPage.clickSettingsTab();
    await page.waitForTimeout(500);
    await expect(registryPage.dockerAccessHeader).toBeVisible();

    await registryPage.clickCredentialsTab();
    await page.waitForTimeout(500);
    await expect(registryPage.externalRegistriesHeader).toBeVisible();

    await registryPage.clickImagesTab();
    await page.waitForTimeout(500);
    await expect(registryPage.repositoriesHeader).toBeVisible();
  });
});
