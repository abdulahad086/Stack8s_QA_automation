import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ResourcesPage } from '../../pages/ResourcesPage';

test.describe('Stack-Specific Resources & Navigation Module', () => {
  let loginPage: LoginPage;
  let resourcesPage: ResourcesPage;
  const defaultStackId = 'stack8s12';

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

  test('STACK-RES-001: Verify stack-specific Resources page loading @smoke @functional @regression', async ({ page }) => {
    await resourcesPage.gotoStackResources(defaultStackId);
    await expect(page).toHaveURL(new RegExp(`/stacks/${defaultStackId}`));
    await resourcesPage.assertTitleContains('Resources | Stack8s');
  });

  test('STACK-RES-002: Verify Overview & Component sub-routes navigation @functional @regression', async ({ page }) => {
    const subRoutes = [
      { name: 'Cost Figures', path: `/stacks/${defaultStackId}/overview/cost-figures` },
      { name: 'Advanced', path: `/stacks/${defaultStackId}/component/advanced` },
      { name: 'Database', path: `/stacks/${defaultStackId}/component/database` },
      { name: 'Data Analytics', path: `/stacks/${defaultStackId}/component/data-analytics` },
      { name: 'Storage', path: `/stacks/${defaultStackId}/component/storage` },
      { name: 'Endpoints', path: `/stacks/${defaultStackId}/component/endpoints` },
      { name: 'Custom Apps', path: `/stacks/${defaultStackId}/component/custom-apps` },
      { name: 'AI Apps', path: `/stacks/${defaultStackId}/component/llm-marketplace` },
    ];

    for (const route of subRoutes) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(route.path));
    }
  });

  test('STACK-RES-003: Verify stack context retention across sub-route navigation @regression', async ({ page }) => {
    await page.goto(`/stacks/${defaultStackId}/overview/resources`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(defaultStackId);

    await page.goto(`/stacks/${defaultStackId}/overview/cost-figures`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(defaultStackId);

    await page.goto(`/stacks/${defaultStackId}/component/database`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain(defaultStackId);
  });
});
