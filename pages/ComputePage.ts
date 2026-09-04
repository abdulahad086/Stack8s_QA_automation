import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ComputePage extends BasePage {
  // Locators
  readonly kubeconfigButton: Locator;
  readonly addPoolButton: Locator;

  // Tabs
  readonly overviewTab: Locator;
  readonly poolsTab: Locator;
  readonly gpusTab: Locator;
  readonly networkTab: Locator;

  // Content locators
  readonly gpuEmptyBanner: Locator;
  readonly networkHealthMatrix: Locator;

  constructor(page: Page) {
    super(page);
    this.kubeconfigButton = page.getByRole('button', { name: /kubeconfig/i }).or(page.locator('button:has-text("Kubeconfig")')).first();
    this.addPoolButton = page.getByRole('button', { name: /add pool/i }).or(page.locator('button:has-text("Add Pool")')).first();

    this.overviewTab = page.getByRole('tab', { name: /overview/i }).or(page.locator('text=Overview')).first();
    this.poolsTab = page.getByRole('tab', { name: /pools/i }).or(page.locator('text=Pools')).first();
    this.gpusTab = page.getByRole('tab', { name: /gpus/i }).or(page.locator('text=GPUs')).first();
    this.networkTab = page.getByRole('tab', { name: /network/i }).or(page.locator('text=Network')).first();

    this.gpuEmptyBanner = page.getByText(/no gpus are attached/i).first();
    this.networkHealthMatrix = page.getByText(/cluster network/i).first();
  }

  async goto() {
    await this.page.goto('/overview/compute', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview\/compute/);
    await expect(this.kubeconfigButton).toBeVisible();
    await expect(this.overviewTab).toBeVisible();
  }

  async clickPoolsTab() {
    await this.poolsTab.click();
  }

  async clickGpusTab() {
    await this.gpusTab.click();
  }

  async clickNetworkTab() {
    await this.networkTab.click();
  }

  async clickOverviewTab() {
    await this.overviewTab.click();
  }
}
