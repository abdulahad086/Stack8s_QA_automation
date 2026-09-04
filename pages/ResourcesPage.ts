import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ResourcesPage extends BasePage {
  // Locators for Global Resources
  readonly pageHeading: Locator;
  readonly nodesCard: Locator;
  readonly deploymentsCard: Locator;
  readonly storageCard: Locator;
  readonly gpuCard: Locator;

  // Capacity overview
  readonly cpuCurrentUsage: Locator;
  readonly memoryCurrentUsage: Locator;
  readonly storageCurrentUsage: Locator;

  // Volumes table
  readonly volumesTable: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: /Resources/i }).first();
    this.nodesCard = page.locator('text=NODES').first();
    this.deploymentsCard = page.locator('text=DEPLOYMENTS').first();
    this.storageCard = page.locator('text=STORAGE').first();
    this.gpuCard = page.locator('text=GPU COUNT').first();

    this.cpuCurrentUsage = page.locator('text=CPU').locator('..').locator('text=CURRENT USAGE');
    this.memoryCurrentUsage = page.locator('text=MEMORY').locator('..').locator('text=CURRENT USAGE');
    this.storageCurrentUsage = page.locator('text=STORAGE').locator('..').locator('text=CURRENT USAGE');
    this.volumesTable = page.locator('table');
  }

  async gotoGlobalResources() {
    await this.page.goto('/overview/resources', { waitUntil: 'domcontentloaded' });
  }

  async gotoStackResources(stackId: string) {
    await this.page.goto(`/stacks/${stackId}/overview/resources`, { waitUntil: 'domcontentloaded' });
  }

  async assertGlobalPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview\/resources/);
    await expect(this.pageHeading).toBeVisible();
  }

  async assertMetricCardsVisible() {
    await expect(this.nodesCard).toBeVisible();
    await expect(this.deploymentsCard).toBeVisible();
    await expect(this.storageCard).toBeVisible();
    await expect(this.gpuCard).toBeVisible();
  }

  async navigateToSubRoute(stackId: string, subPath: string) {
    await this.page.goto(`/stacks/${stackId}${subPath}`, { waitUntil: 'domcontentloaded' });
  }
}
