import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContainerRegistryPage extends BasePage {
  // Main Navigation Tabs
  readonly imagesTab: Locator;
  readonly settingsTab: Locator;
  readonly credentialsTab: Locator;

  // Images Tab Locators
  readonly repositoriesHeader: Locator;
  readonly tagsHeader: Locator;
  readonly pickRepoMessage: Locator;

  // Settings Tab Locators
  readonly dockerAccessHeader: Locator;
  readonly registryHostLabel: Locator;
  readonly dockerLoginCodeSnippet: Locator;
  readonly pushExampleCodeSnippet: Locator;

  // Credentials Tab Locators
  readonly externalRegistriesHeader: Locator;
  readonly manageCredentialsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation Tabs (strict scoping to button / tab elements)
    this.imagesTab = page.locator('button, [role="tab"]').filter({ hasText: /^Images$/i }).first();
    this.settingsTab = page.locator('button, [role="tab"]').filter({ hasText: /^Settings$/i }).first();
    this.credentialsTab = page.locator('button, [role="tab"]').filter({ hasText: /^Credentials$/i }).first();

    // Images Tab
    this.repositoriesHeader = page.getByText(/^Repositories$/i).first();
    this.tagsHeader = page.getByText(/Tags/i).first();
    this.pickRepoMessage = page.getByText(/Pick a repository|Choose a repository/i).first();

    // Settings Tab
    this.dockerAccessHeader = page.getByText(/Docker access/i).first();
    this.registryHostLabel = page.getByText(/Registry host/i).first();
    this.dockerLoginCodeSnippet = page.getByText(/docker login/i).first();
    this.pushExampleCodeSnippet = page.getByText(/docker tag/i).first();

    // Credentials Tab
    this.externalRegistriesHeader = page.getByText(/External registries/i).first();
    this.manageCredentialsButton = page.getByRole('button', { name: 'Manage' }).or(page.getByRole('link', { name: 'Manage' })).first();
  }

  async goto() {
    await this.page.goto('/registry', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*registry.*/);
    await expect(this.imagesTab).toBeVisible();
    await expect(this.settingsTab).toBeVisible();
    await expect(this.credentialsTab).toBeVisible();
  }

  async clickImagesTab() {
    await this.imagesTab.click();
  }

  async clickSettingsTab() {
    await this.settingsTab.click();
  }

  async clickCredentialsTab() {
    await this.credentialsTab.click();
  }

  async selectFirstRepository() {
    const repoButton = this.page.locator('button').filter({ hasText: /shiptrack|azure|practice/i }).first();
    if (await repoButton.isVisible().catch(() => false)) {
      await repoButton.click();
      await this.page.waitForTimeout(1000);
    }
  }
}
