import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TemplatesPage extends BasePage {
  // Main Page Locators
  readonly marketplaceTab: Locator;
  readonly aiModelsTab: Locator;
  readonly allAppsSubTab: Locator;
  readonly installedSubTab: Locator;

  // Category Filter Locators
  readonly allCategoryPill: Locator;
  readonly databasesCategoryPill: Locator;
  readonly aiCategoryPill: Locator;
  readonly vectorDbCategoryPill: Locator;
  readonly cacheCategoryPill: Locator;
  readonly monitoringCategoryPill: Locator;
  readonly infrastructureCategoryPill: Locator;

  // Search & Controls Locators
  readonly searchInput: Locator;
  readonly sortButton: Locator;
  readonly filtersButton: Locator;
  readonly paginationInfo: Locator;

  // Install Modal Locators
  readonly installModal: Locator;
  readonly modalContinueButton: Locator;
  readonly modalCancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Main Tabs (Matching button, tab, link or text container)
    this.marketplaceTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^Marketplace$/i }).first();
    this.aiModelsTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^AI Models$/i }).first();
    this.allAppsSubTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^All Apps$/i }).first();
    this.installedSubTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^Installed/i }).first();

    // Category Filter Pills
    this.allCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^All$/i }).first();
    this.databasesCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^Databases$/i }).first();
    this.aiCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^AI & Machine Learning$/i }).first();
    this.vectorDbCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^Vector Databases$/i }).first();
    this.cacheCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^Cache & In-Memory$/i }).first();
    this.monitoringCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^Monitoring$/i }).first();
    this.infrastructureCategoryPill = page.locator('button, [role="tab"], div').filter({ hasText: /^Infrastructure$/i }).first();

    // Search & Controls
    this.searchInput = page.getByPlaceholder(/Search apps/i).first();
    this.sortButton = page.getByRole('button', { name: /Sort:/i }).first();
    this.filtersButton = page.getByRole('button', { name: 'Filters' }).first();
    this.paginationInfo = page.getByText(/Showing \d+–\d+ of \d+ apps/i).first();

    // Modal
    this.installModal = page.locator('[role="dialog"]').first();
    this.modalContinueButton = page.getByRole('button', { name: /Continue to Configuration|Continue/i }).first();
    this.modalCancelButton = page.getByRole('button', { name: 'Cancel' }).first();
  }

  async goto() {
    await this.page.goto('/templates', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*templates.*/);
    await expect(this.marketplaceTab).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async searchApp(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  async openInstallModalFirstCard() {
    const installBtn = this.page.getByRole('button', { name: 'Install' }).first();
    await installBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async dismissInstallModal() {
    if (await this.modalCancelButton.isVisible().catch(() => false)) {
      await this.modalCancelButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.page.waitForTimeout(500);
  }
}
