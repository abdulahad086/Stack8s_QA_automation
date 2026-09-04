import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class CostFiguresPage extends BasePage {
  // Main Page Header Locators
  readonly mainHeader: Locator;
  readonly balanceCard: Locator;
  readonly combinedBurnCard: Locator;
  readonly runwayCard: Locator;
  readonly mtdSpendCard: Locator;
  readonly projectedMonthEndCard: Locator;

  // Timeframe Controls
  readonly timeframe7dButton: Locator;
  readonly timeframe30dButton: Locator;
  readonly timeframe90dButton: Locator;
  readonly timeframeCustomButton: Locator;

  // Sections
  readonly spendTrendsHeader: Locator;
  readonly topNodesHeader: Locator;
  readonly gpuOnlyCheckbox: Locator;
  readonly topNodesTable: Locator;

  constructor(page: Page) {
    super(page);

    this.mainHeader = page.getByText(/Environmental Cost Figures/i).first();
    this.balanceCard = page.locator('div:has-text("BALANCE")').first();
    this.combinedBurnCard = page.locator('div:has-text("COMBINED BURN")').first();
    this.runwayCard = page.locator('div:has-text("RUNWAY")').first();
    this.mtdSpendCard = page.locator('div:has-text("MTD SPEND")').first();
    this.projectedMonthEndCard = page.locator('div:has-text("PROJECTED MONTH-END")').first();

    // Timeframe filter buttons (strict locator)
    this.timeframe7dButton = page.locator('button').filter({ hasText: /^7d$/i }).first();
    this.timeframe30dButton = page.locator('button').filter({ hasText: /^30d$/i }).first();
    this.timeframe90dButton = page.locator('button').filter({ hasText: /^90d$/i }).first();
    this.timeframeCustomButton = page.locator('button').filter({ hasText: /^Custom$/i }).first();

    // Sections
    this.spendTrendsHeader = page.getByText(/Spend Trends/i).first();
    this.topNodesHeader = page.getByText(/Top Cost-Driving Nodes/i).first();
    this.gpuOnlyCheckbox = page.locator('input[type="checkbox"]').first();
    this.topNodesTable = page.locator('table, div:has-text("#1")').first();
  }

  async goto() {
    await this.page.goto('/overview/cost-figures', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview\/cost-figures.*/);
    await expect(this.mainHeader).toBeVisible();
    await expect(this.balanceCard).toBeVisible();
  }

  async selectTimeframe(days: '7d' | '30d' | '90d' | 'Custom') {
    switch (days) {
      case '7d':
        await this.timeframe7dButton.click();
        break;
      case '30d':
        await this.timeframe30dButton.click();
        break;
      case '90d':
        await this.timeframe90dButton.click();
        break;
      case 'Custom':
        await this.timeframeCustomButton.click();
        break;
    }
    await this.page.waitForTimeout(500);
  }
}
