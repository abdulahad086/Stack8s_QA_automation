import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { SettingsPage } from '../../pages/SettingsPage';

test.describe('Settings Module', () => {
  let loginPage: LoginPage;
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    settingsPage = new SettingsPage(page);

    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await settingsPage.goto();
  });

  test('SET-001: Verify Settings Administration page loads with Team Members & action controls @smoke @functional @regression', async ({ page }) => {
    await settingsPage.assertPageLoaded();
    await expect(page).toHaveTitle(/Settings/i);

    await expect(page.getByText(/Administration/i).first()).toBeVisible();
    await expect(page.getByText(/Team Members/i).first()).toBeVisible();
    await expect(page.getByText('jon@stack8s.com').first()).toBeVisible({ timeout: 15000 });

    // Destroy Environment button must be visible for safety check, but NEVER clicked
    await expect(settingsPage.destroyEnvironmentButton).toBeVisible();
  });

  test('SET-002: Dynamic API vs UI Validation for Users & Organization Members @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/users?') && res.status() === 200,
      { timeout: 15000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /users? API Data:', JSON.stringify(data));

    expect(data).toHaveProperty('users');
    expect(Array.isArray(data.users)).toBe(true);

    if (data.users.length > 0) {
      const firstUserEmail = data.users[0]?.email;
      expect(firstUserEmail).toBeTruthy();
      await expect(page.getByText(firstUserEmail).first()).toBeVisible();
    }
  });

  test('SET-003: Verify "Add Member" modal flow, email validation, and Cancel dismiss @smoke @functional @regression', async ({ page }) => {
    await settingsPage.openAddMemberModal();

    await expect(settingsPage.modalEmailInput).toBeVisible();
    await expect(settingsPage.modalCancelButton).toBeVisible();

    await settingsPage.modalEmailInput.fill('qa.automation.test@stack8s.com');
    await settingsPage.modalEmailInput.press('Enter');
    await page.waitForTimeout(500);

    await expect(settingsPage.modalInviteButton).toBeEnabled();

    await settingsPage.dismissInviteModal();
    await page.waitForTimeout(500);
  });

  test('SET-004: Verify Team Members table search filtering & clear search @functional @regression', async ({ page }) => {
    await settingsPage.searchMember('jon@stack8s.com');
    await page.waitForTimeout(500);

    await expect(page.getByText('jon@stack8s.com').first()).toBeVisible();

    await settingsPage.clearMemberSearch();
  });

  test('SET-005: Verify Administration sub-tabs (Members, Billing, Audit) switching @functional @regression', async ({ page }) => {
    await settingsPage.billingTab.click();
    await page.waitForTimeout(500);

    await settingsPage.auditTab.click();
    await page.waitForTimeout(500);

    await settingsPage.membersTab.click();
    await page.waitForTimeout(500);

    await expect(settingsPage.teamMembersHeader).toBeVisible();
  });

  test('SET-006: Verify Personal Settings scope (Profile, Appearance, Credentials) navigation @smoke @functional @regression', async ({ page }) => {
    await settingsPage.switchToPersonalSettings();

    await expect(page).toHaveURL(/.*scope=personal.*/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Personal settings');
    expect(bodyText).toContain('Profile');

    if (await settingsPage.credentialsSubTab.isVisible().catch(() => false)) {
      await settingsPage.credentialsSubTab.click();
      await page.waitForTimeout(500);
    }

    if (await settingsPage.administrationButton.isVisible().catch(() => false)) {
      await settingsPage.switchToAdministration();
      await settingsPage.assertPageLoaded();
    }
  });

  test('SET-NAV-001: Full navigation loop across Administration, Member Invite modal, Personal Settings, and Reset @regression', async () => {
    await settingsPage.openAddMemberModal();
    await settingsPage.dismissInviteModal();

    await settingsPage.switchToPersonalSettings();
    await settingsPage.switchToAdministration();

    await settingsPage.assertPageLoaded();
  });
});
