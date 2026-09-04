import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CustomWorkloadsPage extends BasePage {
  // Main Inventory Page Locators
  readonly createWorkloadButton: Locator;
  readonly refreshButton: Locator;
  readonly workloadInventoryHeader: Locator;
  readonly workloadsTable: Locator;
  readonly metricsCards: Locator;

  // Creation Wizard Locators (/custom-apps/new)
  readonly deploymentKindButton: Locator;
  readonly statefulSetKindButton: Locator;
  readonly cronJobKindButton: Locator;

  // Wizard Navigation Tabs (Strictly scoped to <button> elements to prevent matching sidebar <a> links)
  readonly destinationTab: Locator;
  readonly containerImageTab: Locator;
  readonly envSecretsTab: Locator;
  readonly runConfigTab: Locator;
  readonly resourcesTab: Locator;
  readonly serviceTab: Locator;
  readonly reviewDeployTab: Locator;

  // Wizard Controls
  readonly stackSelect: Locator;
  readonly continueButton: Locator;
  readonly previousButton: Locator;
  readonly cancelButton: Locator;
  readonly reviewApplicationButton: Locator;
  readonly readinessSection: Locator;

  constructor(page: Page) {
    super(page);

    // Main Inventory Page
    this.createWorkloadButton = page.getByRole('link', { name: /Create workload/i }).or(page.getByRole('button', { name: /Create workload/i })).first();
    this.refreshButton = page.getByRole('button', { name: 'Refresh' }).first();
    this.workloadInventoryHeader = page.getByText(/Workload inventory/i).first();
    this.workloadsTable = page.locator('table').first();
    this.metricsCards = page.locator('div:has-text("Custom Workloads")').first();

    // Wizard Kinds
    this.deploymentKindButton = page.locator('button').filter({ hasText: /^Deployment$/i }).first();
    this.statefulSetKindButton = page.locator('button').filter({ hasText: /^StatefulSet$/i }).first();
    this.cronJobKindButton = page.locator('button').filter({ hasText: /^CronJob$/i }).first();

    // Wizard Navigation Tabs
    this.destinationTab = page.locator('button').filter({ hasText: /^Destination$/i }).first();
    this.containerImageTab = page.locator('button').filter({ hasText: /^Container Image$/i }).first();
    this.envSecretsTab = page.locator('button').filter({ hasText: /Environment/i }).first();
    this.runConfigTab = page.locator('button').filter({ hasText: /Run Configuration/i }).first();
    this.resourcesTab = page.locator('button').filter({ hasText: /^Resources$/i }).first();
    this.serviceTab = page.locator('button').filter({ hasText: /^Service$/i }).first();
    this.reviewDeployTab = page.locator('button').filter({ hasText: /Review/i }).first();

    // Wizard Controls
    this.stackSelect = page.locator('select').first();
    this.continueButton = page.locator('button').filter({ hasText: /^Continue$/i }).first();
    this.previousButton = page.locator('button').filter({ hasText: /^Previous$/i }).first();
    this.cancelButton = page.locator('button').filter({ hasText: /^Cancel$/i }).first();
    this.reviewApplicationButton = page.locator('button').filter({ hasText: /Review application|Deploy/i }).first();
    this.readinessSection = page.getByText(/Application readiness/i).first();
  }

  async goto() {
    await this.page.goto('/custom-apps', { waitUntil: 'domcontentloaded' });
  }

  async gotoNewWorkload() {
    await this.page.goto('/custom-apps/new', { waitUntil: 'domcontentloaded' });
  }

  async assertPageLoaded() {
    await expect(this.page).toHaveURL(/.*custom-apps.*/);
    await expect(this.workloadInventoryHeader).toBeVisible();
    await expect(this.createWorkloadButton).toBeVisible();
  }

  async clickCreateWorkload() {
    await this.createWorkloadButton.click();
  }

  async assertWizardLoaded() {
    await expect(this.page).toHaveURL(/.*custom-apps\/new.*/);
    await expect(this.deploymentKindButton).toBeVisible();
    await expect(this.destinationTab).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }
}
