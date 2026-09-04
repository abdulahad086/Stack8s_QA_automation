import { Page, expect, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async assertTitleContains(text: string) {
    await expect(this.page).toHaveTitle(new RegExp(text, 'i'));
  }

  async assertUrlContains(pathSnippet: string) {
    await expect(this.page).toHaveURL(new RegExp(pathSnippet));
  }
}
