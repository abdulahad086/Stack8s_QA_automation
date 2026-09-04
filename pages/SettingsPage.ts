import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  // Page Header & Navigation Scopes
  readonly mainHeader: Locator;
  readonly personalSettingsButton: Locator;
  readonly administrationButton: Locator;

  // Administration Sub-Tabs
  readonly membersTab: Locator;
  readonly billingTab: Locator;
  readonly auditTab: Locator;

  // Action Buttons
  readonly addMemberButton: Locator;
  readonly addAdminButton: Locator;
  readonly destroyEnvironmentButton: Locator;

  // Team Members Table & Filters
  readonly memberSearchInput: Locator;
  readonly teamMembersHeader: Locator;
  readonly membersTable: Locator;

  // Invite Member Modal Elements
  readonly inviteModal: Locator;
  readonly modalEmailInput: Locator;
  readonly modalInviteButton: Locator;
  readonly modalCancelButton: Locator;

  // Personal Settings Locators
  readonly profileSubTab: Locator;
  readonly appearanceSubTab: Locator;
  readonly credentialsSubTab: Locator;
  readonly profileFullNameInput: Locator;
  readonly profileEmailInput: Locator;
  readonly saveProfileButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header & Scope Switchers
    this.mainHeader = page.getByText(/Administration|Settings/i).first();
    this.personalSettingsButton = page.locator('button, a').filter({ hasText: /^Personal settings$/i }).first();
    this.administrationButton = page.locator('button, a').filter({ hasText: /^Administration$/i }).first();

    // Administration Sub-Tabs
    this.membersTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^Members$/i }).first();
    this.billingTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^Billing$/i }).first();
    this.auditTab = page.locator('button, [role="tab"], div, a').filter({ hasText: /^Audit$/i }).first();

    // Action Buttons
    this.addMemberButton = page.locator('button').filter({ hasText: /^Add Member$/i }).first();
    this.addAdminButton = page.locator('button').filter({ hasText: /^Add Admin$/i }).first();
    this.destroyEnvironmentButton = page.locator('button').filter({ hasText: /Destroy Environment/i }).first();

    // Team Members Table
    this.memberSearchInput = page.locator('input[placeholder*="Search members"i]').first();
    this.teamMembersHeader = page.getByText(/Team Members/i).first();
    this.membersTable = page.locator('table').first();

    // Invite Modal
    this.inviteModal = page.locator('div[role="dialog"], div.modal, div:has-text("Invite")').first();
    this.modalEmailInput = page.locator('input[placeholder*="email"i], input[type="email"]').first();
    this.modalInviteButton = page.locator('button').filter({ hasText: /Invite/i }).first();
    this.modalCancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();

    // Personal Settings Locators
    this.profileSubTab = page.locator('button, a').filter({ hasText: /^Profile$/i }).first();
    this.appearanceSubTab = page.locator('button, a').filter({ hasText: /^Appearance$/i }).first();
    this.credentialsSubTab = page.locator('button, a').filter({ hasText: /^Credentials$/i }).first();
    this.profileFullNameInput = page.locator('input[name="fullName"], input[name="name"]').first();
    this.profileEmailInput = page.locator('input[name="email"]').first();
    this.saveProfileButton = page.locator('button').filter({ hasText: /Save profile/i }).first();
  }

  async goto() {
    await this.page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await this.waitForMembersToLoad();
  }

  async waitForMembersToLoad() {
    await this.page.waitForSelector('text=jon@stack8s.com', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*settings.*/);
    await expect(this.teamMembersHeader).toBeVisible();
    await expect(this.addMemberButton).toBeVisible();
  }

  async openAddMemberModal() {
    await this.addMemberButton.click();
    await this.page.waitForTimeout(500);
  }

  async dismissInviteModal() {
    if (await this.modalCancelButton.isVisible()) {
      await this.modalCancelButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async searchMember(query: string) {
    await this.memberSearchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearMemberSearch() {
    await this.memberSearchInput.fill('');
    await this.page.waitForTimeout(500);
  }

  async switchToPersonalSettings() {
    await this.personalSettingsButton.click();
    await this.page.waitForTimeout(1000);
  }

  async switchToAdministration() {
    await this.administrationButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForMembersToLoad();
  }
}
