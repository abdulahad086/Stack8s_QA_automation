import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MonitoringPage extends BasePage {
  // Summary Cards
  readonly podsRunningCard: Locator;
  readonly clusterCpuCard: Locator;
  readonly clusterMemoryCard: Locator;
  readonly restartsCard: Locator;

  // View Navigation Tabs
  readonly nodeResourcesTab: Locator;
  readonly stackResourcesTab: Locator;
  readonly gpuMetricsTab: Locator;

  // Timeframe Filter Controls
  readonly timeframe1hButton: Locator;
  readonly timeframe6hButton: Locator;
  readonly timeframe24hButton: Locator;
  readonly timeframe7dButton: Locator;

  // Actions & Controls
  readonly refreshButton: Locator;
  readonly cpuUtilizationSection: Locator;
  readonly memoryUsageSection: Locator;
  readonly networkIoSection: Locator;
  readonly diskIoSection: Locator;

  constructor(page: Page) {
    super(page);

    // Cards (Using getByText for precise target matching)
    this.podsRunningCard = page.getByText(/Pods Running/i).first();
    this.clusterCpuCard = page.getByText(/Cluster CPU/i).first();
    this.clusterMemoryCard = page.getByText(/Cluster Memory/i).first();
    this.restartsCard = page.getByText(/Restarts/i).first();

    // View Navigation Tabs (matching button, tab, link or text container)
    this.nodeResourcesTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /Node Resources/i }).first();
    this.stackResourcesTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /Stack Resources/i }).first();
    this.gpuMetricsTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /GPU Metrics/i }).first();

    // Timeframe Filter Buttons
    this.timeframe1hButton = page.locator('button').filter({ hasText: /^1h$/i }).first();
    this.timeframe6hButton = page.locator('button').filter({ hasText: /^6h$/i }).first();
    this.timeframe24hButton = page.locator('button').filter({ hasText: /^24h$/i }).first();
    this.timeframe7dButton = page.locator('button').filter({ hasText: /^7d$/i }).first();

    // Controls & Chart Sections
    this.refreshButton = page.getByRole('button', { name: 'Refresh' }).first();
    this.cpuUtilizationSection = page.getByText(/CPU Utilization/i).first();
    this.memoryUsageSection = page.getByText(/Memory Usage/i).first();
    this.networkIoSection = page.getByText(/Network I\/O/i).first();
    this.diskIoSection = page.getByText(/Disk I\/O/i).first();
  }

  async goto() {
    await this.page.goto('/overview/monitoring', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview\/monitoring.*/);
    await expect(this.podsRunningCard).toBeVisible();
    await expect(this.nodeResourcesTab).toBeVisible();
  }

  async clickNodeResourcesTab() {
    await this.nodeResourcesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickStackResourcesTab() {
    await this.stackResourcesTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickGpuMetricsTab() {
    await this.gpuMetricsTab.click();
    await this.page.waitForTimeout(500);
  }

  async selectTimeframe(range: '1h' | '6h' | '24h' | '7d') {
    switch (range) {
      case '1h':
        await this.timeframe1hButton.click();
        break;
      case '6h':
        await this.timeframe6hButton.click();
        break;
      case '24h':
        await this.timeframe24hButton.click();
        break;
      case '7d':
        await this.timeframe7dButton.click();
        break;
    }
    await this.page.waitForTimeout(500);
  }
}
