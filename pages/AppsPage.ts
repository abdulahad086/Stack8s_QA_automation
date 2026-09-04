import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AppsPage extends BasePage {
  // Main Apps Page Locators
  readonly repositorySettingsLink: Locator;
  readonly newGitAppButton: Locator;
  readonly applicationInventoryHeader: Locator;
  readonly appsTable: Locator;
  readonly refreshButton: Locator;

  // Repository Settings Page Locators
  readonly connectRepositoryButton: Locator;
  readonly gitRepositoriesSection: Locator;

  // Connect Repository Modal Locators
  readonly connectRepoModal: Locator;
  readonly repoOwnerInput: Locator;
  readonly defaultBranchInput: Locator;
  readonly personalTokenInput: Locator;
  readonly modalCancelButton: Locator;
  readonly modalConnectButton: Locator;

  // New Git App Wizard Page Locators
  readonly repositorySelect: Locator;
  readonly branchInput: Locator;
  readonly buildMethodSelect: Locator;
  readonly dockerfilePathInput: Locator;
  readonly wizardCancelButton: Locator;
  readonly createAndDeployButton: Locator;

  constructor(page: Page) {
    super(page);
    this.repositorySettingsLink = page.getByRole('link', { name: /Repository settings/i }).first();
    this.newGitAppButton = page.getByRole('button', { name: /New git app/i }).first();
    this.applicationInventoryHeader = page.getByText(/Application inventory/i).first();
    this.appsTable = page.locator('table').first();
    this.refreshButton = page.getByRole('button', { name: 'Refresh' }).first();

    // Repository Settings
    this.connectRepositoryButton = page.getByRole('button', { name: 'Connect Repository' }).first();
    this.gitRepositoriesSection = page.getByText(/Git Repositories/i).first();

    // Connect Repo Modal
    this.connectRepoModal = page.locator('[role="dialog"]').first();
    this.repoOwnerInput = page.getByPlaceholder(/acme\/api/i).first();
    this.defaultBranchInput = page.getByPlaceholder(/main/i).first();
    this.personalTokenInput = page.getByPlaceholder(/ghp_…/i).first();
    this.modalCancelButton = page.getByRole('button', { name: 'Cancel' }).first();
    this.modalConnectButton = page.getByRole('button', { name: 'Connect' }).first();

    // New Git App Wizard
    this.repositorySelect = page.locator('select').first();
    this.branchInput = page.getByPlaceholder(/main/i).first();
    this.buildMethodSelect = page.locator('select').nth(1);
    this.dockerfilePathInput = page.getByPlaceholder(/Dockerfile/i).first();
    this.wizardCancelButton = page.getByRole('button', { name: 'Cancel' }).first();
    this.createAndDeployButton = page.getByRole('button', { name: /Create and deploy/i }).first();
  }

  async goto() {
    await this.page.goto('/apps', { waitUntil: 'domcontentloaded' });
  }

  async gotoRepositorySettings() {
    await this.page.goto('/settings?scope=personal&tab=credentials', { waitUntil: 'domcontentloaded' });
  }

  async gotoNewGitApp() {
    await this.page.goto('/apps/new', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*apps.*/);
    await expect(this.repositorySettingsLink).toBeVisible();
    await expect(this.newGitAppButton).toBeVisible();
  }

  async clickConnectRepository() {
    await this.connectRepositoryButton.click();
  }

  async assertConnectRepoModalVisible() {
    await expect(this.connectRepoModal).toBeVisible();
    await expect(this.repoOwnerInput).toBeVisible();
    await expect(this.defaultBranchInput).toBeVisible();
  }

  async dismissConnectRepoModal() {
    const modalCancel = this.connectRepoModal.getByRole('button', { name: 'Cancel' }).first();
    if (await modalCancel.isVisible().catch(() => false)) {
      await modalCancel.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }
}
