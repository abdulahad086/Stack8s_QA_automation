import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class StoragePage extends BasePage {
  // Tabs
  readonly volumesTab: Locator;
  readonly backupsTab: Locator;
  readonly settingsTab: Locator;

  // Content locators - Volumes
  readonly storageOverviewHeader: Locator;
  readonly volumesTable: Locator;
  readonly nodeStorageCard: Locator;

  // Content locators - Backups
  readonly backupTargetCard: Locator;
  readonly s3EndpointInput: Locator;
  readonly bucketTargetInput: Locator;
  readonly accessKeyInput: Locator;
  readonly secretKeyInput: Locator;
  readonly configureButton: Locator;
  readonly addScheduleButton: Locator;
  readonly recurringSchedulesTable: Locator;

  // Modal locators - Add Schedule
  readonly addScheduleModal: Locator;
  readonly jobNameInput: Locator;
  readonly taskButton: Locator;
  readonly cronInput: Locator;
  readonly retainCountInput: Locator;
  readonly modalCancelButton: Locator;
  readonly modalCreateButton: Locator;

  // Content locators - Settings
  readonly storageDefaultsHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.volumesTab = page.getByRole('tab', { name: 'Volumes' }).first();
    this.backupsTab = page.getByRole('tab', { name: 'Backups' }).first();
    this.settingsTab = page.getByRole('tab', { name: 'Settings' }).first();

    // Volumes
    this.storageOverviewHeader = page.getByText(/Storage Overview/i).first();
    this.volumesTable = page.locator('table').first();
    this.nodeStorageCard = page.getByText(/Node Storage Status/i).first();

    // Backups
    this.backupTargetCard = page.getByText(/Backup Target/i).first();
    this.s3EndpointInput = page.getByPlaceholder(/s3 endpoint/i).or(page.locator('input')).first();
    this.bucketTargetInput = page.getByPlaceholder(/bucket/i).first();
    this.accessKeyInput = page.getByPlaceholder(/access key/i).first();
    this.secretKeyInput = page.getByPlaceholder(/secret key/i).first();
    this.configureButton = page.getByRole('button', { name: 'Configure' }).first();
    this.addScheduleButton = page.getByRole('button', { name: 'Add Schedule' }).first();
    this.recurringSchedulesTable = page.getByText(/Recurring Schedules/i).first();

    // Modal
    this.addScheduleModal = page.locator('[role="dialog"], div:has-text("Add Recurring Schedule")').last();
    this.jobNameInput = page.getByPlaceholder(/daily-snapshot/i).first();
    this.taskButton = page.getByRole('button', { name: /snapshot|backup/i }).first();
    this.cronInput = page.getByPlaceholder(/0 2 \* \* \*/i).first();
    this.retainCountInput = page.getByPlaceholder(/7/i).first();
    this.modalCancelButton = page.getByRole('button', { name: 'Cancel' }).first();
    this.modalCreateButton = page.getByRole('button', { name: 'Create Schedule' }).first();

    // Settings
    this.storageDefaultsHeader = page.getByText(/Storage Defaults/i).first();
  }

  async goto() {
    await this.page.goto('/overview/storage', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview\/storage/);
    await expect(this.volumesTab).toBeVisible();
    await expect(this.backupsTab).toBeVisible();
    await expect(this.settingsTab).toBeVisible();
  }

  async clickVolumesTab() {
    await this.volumesTab.click();
  }

  async clickBackupsTab() {
    await this.backupsTab.click();
  }

  async clickSettingsTab() {
    await this.settingsTab.click();
  }

  async clickAddSchedule() {
    await this.addScheduleButton.click();
  }

  async assertAddScheduleModalVisible() {
    await expect(this.addScheduleModal).toBeVisible();
    await expect(this.jobNameInput).toBeVisible();
    await expect(this.cronInput).toBeVisible();
    await expect(this.retainCountInput).toBeVisible();
  }

  async dismissAddScheduleModal() {
    if (await this.modalCancelButton.isVisible().catch(() => false)) {
      await this.modalCancelButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }
}
