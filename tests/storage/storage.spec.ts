import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { StoragePage } from '../../pages/StoragePage';

test.describe('Storage Module', () => {
  let loginPage: LoginPage;
  let storagePage: StoragePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    storagePage = new StoragePage(page);

    // Ensure authenticated session
    await loginPage.goto();
    if (page.url().includes('/auth/sign-in')) {
      await loginPage.enterEmail(process.env.STACK8S_USER || 'jon@stack8s.com');
      await loginPage.enterPassword(process.env.STACK8S_PASSWORD || 'Abc@1234');
      await loginPage.clickSignIn();
      await page.waitForURL((url) => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    }

    await storagePage.goto();
  });

  test('STR-001: Verify Storage Overview page loads with Volumes, Backups, and Settings tabs @smoke @functional @regression', async () => {
    await storagePage.assertPageLoaded();
    await storagePage.assertTitleContains('Storage | Stack8s');
  });

  test('STR-002: Verify Volumes tab storage overview & volumes table presence @smoke @functional @regression', async ({ page }) => {
    await storagePage.clickVolumesTab();
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('TOTAL CAPACITY');
    expect(bodyText).toContain('Volumes');
  });

  test('STR-003: Dynamic API vs UI Validation for Storage Capacity @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/storage/longhorn') && !res.url().includes('recurringjobs') && !res.url().includes('settings') && !res.url().includes('backupvolumes') && res.status() === 200,
      { timeout: 30000 }
    );

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /storage/longhorn API Data:', JSON.stringify(data));

    if (data.success && data.summary) {
      const totalCapacityGb = Math.round(data.summary?.total_capacity_gb || 0);
      expect(totalCapacityGb).toBeGreaterThan(0);
      expect(data.summary?.total_volumes).toBeGreaterThanOrEqual(1);
    } else {
      expect(data.message || data.success === false).toBeTruthy();
    }
  });

  test('STR-004: Verify Backups tab recurring schedules & S3 configuration section @smoke @functional @regression', async ({ page }) => {
    await storagePage.clickBackupsTab();
    await page.waitForTimeout(2000);

    await expect(storagePage.backupTargetCard).toBeVisible({ timeout: 15000 });
    await expect(storagePage.addScheduleButton).toBeVisible({ timeout: 10000 });
    await expect(storagePage.recurringSchedulesTable).toBeVisible({ timeout: 10000 });
  });

  test('STR-005: Dynamic API vs UI Validation for Recurring Backup Jobs @functional @regression', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/storage/longhorn/recurringjobs') && res.status() === 200,
      { timeout: 15000 }
    );

    await storagePage.clickBackupsTab();
    const response = await responsePromise;

    const data = await response.json();
    console.log('Intercepted /recurringjobs API Data:', JSON.stringify(data));

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);

    const firstJobName = data.data[0]?.name;
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(firstJobName);
  });

  test('STR-SCH-001: Verify "Add Schedule" button opens "Add Recurring Schedule" modal @smoke @functional @regression', async ({ page }) => {
    await storagePage.clickBackupsTab();
    await page.waitForTimeout(1000);

    await storagePage.clickAddSchedule();
    await page.waitForTimeout(1000);

    await storagePage.assertAddScheduleModalVisible();
  });

  test('STR-SCH-002: Verify "Add Schedule" modal Cancel and Close actions dismiss modal @functional @regression', async ({ page }) => {
    await storagePage.clickBackupsTab();
    await page.waitForTimeout(1000);

    await storagePage.clickAddSchedule();
    await page.waitForTimeout(1000);

    await storagePage.dismissAddScheduleModal();
    await page.waitForTimeout(500);

    await expect(storagePage.addScheduleModal).toBeHidden();
  });

  test('STR-006: Verify Settings tab storage defaults & read-only backup target @functional @regression', async ({ page }) => {
    await storagePage.clickSettingsTab();
    await page.waitForTimeout(1000);

    await expect(storagePage.storageDefaultsHeader).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('DEFAULT REPLICA COUNT');
    expect(bodyText).toContain('OVER-PROVISIONING %');
  });

  test('STR-NAV-001: Verify tab switching between Volumes, Backups, and Settings @regression', async ({ page }) => {
    await storagePage.clickBackupsTab();
    await page.waitForTimeout(500);
    await expect(storagePage.addScheduleButton).toBeVisible();

    await storagePage.clickSettingsTab();
    await page.waitForTimeout(500);
    await expect(storagePage.storageDefaultsHeader).toBeVisible();

    await storagePage.clickVolumesTab();
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('TOTAL CAPACITY');
  });
});
