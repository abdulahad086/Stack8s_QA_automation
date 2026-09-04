import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OverviewPage extends BasePage {
  // Locators
  readonly mainNav: Locator;
  readonly userProfileMenu: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.mainNav = page.locator('nav');
    this.userProfileMenu = page.locator('[data-testid="user-profile"], button:has-text("Profile"), avatar');
    this.pageHeader = page.locator('h1');
  }

  async goto() {
    await this.page.goto('/overview/resources', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*overview/);
  }
}
