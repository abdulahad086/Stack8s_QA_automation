import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class StacksPage extends BasePage {
  // Header & Selector
  readonly stackSelectorButton: Locator;
  readonly fullViewButton: Locator;
  readonly addComponentButton: Locator;

  // Sub-Tabs
  readonly overviewTab: Locator;
  readonly componentsTab: Locator;
  readonly connectionsTab: Locator;
  readonly settingsTab: Locator;

  // Overview Tab Content
  readonly capacityCard: Locator;
  readonly workloadsCard: Locator;
  readonly runningWorkloadsTable: Locator;
  readonly storageCard: Locator;

  // Components Tab Content
  readonly componentsList: Locator;
  readonly componentDetailsHeader: Locator;

  // Connections Tab Content
  readonly connectionsMatrix: Locator;

  // Settings Tab Content
  readonly sandboxQuotaHeader: Locator;
  readonly deleteStackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.stackSelectorButton = page.getByRole('button', { name: /stack8s12|test-stack|default/i }).first();
    this.fullViewButton = page.getByRole('button', { name: 'Full view' }).first();
    this.addComponentButton = page.getByRole('button', { name: 'Add component' }).first();

    // Tabs
    this.overviewTab = page.getByRole('tab', { name: 'Overview' }).or(page.locator('button:has-text("Overview")')).first();
    this.componentsTab = page.getByRole('tab', { name: 'Components' }).or(page.locator('button:has-text("Components")')).first();
    this.connectionsTab = page.getByRole('tab', { name: 'Connections' }).or(page.locator('button:has-text("Connections")')).first();
    this.settingsTab = page.getByRole('tab', { name: 'Settings' }).or(page.locator('button:has-text("Settings")')).first();

    // Content
    this.capacityCard = page.getByText(/Capacity/i).first();
    this.workloadsCard = page.getByText(/Workloads/i).first();
    this.runningWorkloadsTable = page.getByText(/Running workloads/i).first();
    this.storageCard = page.getByText(/Storage/i).first();

    this.componentsList = page.getByText(/dummy-app|shiptrack-db/i).first();
    this.componentDetailsHeader = page.getByText(/STATUS|KIND|SOURCE/i).first();

    this.connectionsMatrix = page.getByText(/via|svc.cluster.local/i).first();

    this.sandboxQuotaHeader = page.getByText(/sandbox-quota/i).first();
    this.deleteStackButton = page.getByRole('button', { name: /delete stack/i }).first();
  }

  async goto(stackId: string = 'stack8s12') {
    await this.page.goto(`/stacks?stack=${stackId}`, { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*stacks.*/);
    await expect(this.overviewTab).toBeVisible();
    await expect(this.componentsTab).toBeVisible();
    await expect(this.connectionsTab).toBeVisible();
    await expect(this.settingsTab).toBeVisible();
  }

  async openStackSelector() {
    await this.stackSelectorButton.click();
  }

  async clickOverviewTab() {
    await this.overviewTab.click();
  }

  async clickComponentsTab() {
    await this.componentsTab.click();
  }

  async clickConnectionsTab() {
    await this.connectionsTab.click();
  }

  async clickSettingsTab() {
    await this.settingsTab.click();
  }
}
