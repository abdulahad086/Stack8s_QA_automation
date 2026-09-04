import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly welcomeHeading: Locator;
  readonly emailErrorLabel: Locator;
  readonly passwordErrorLabel: Locator;
  readonly alertErrorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.welcomeHeading = page.getByRole('heading', { name: 'Welcome back' });
    this.emailErrorLabel = page.getByText('Email is required').first();
    this.passwordErrorLabel = page.getByText('Password is required').first();
    this.alertErrorMessage = page.getByText('Wrong email or password.').first();
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
    this.signUpLink = page.getByRole('link', { name: 'Sign up' });
  }

  async goto() {
    await this.page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' });
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async login(email: string, pass: string) {
    await this.enterEmail(email);
    await this.enterPassword(pass);
    await this.clickSignIn();
  }

  async assertPageLoaded() {
    await expect(this.welcomeHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async assertEmptyFormValidation() {
    await expect(this.emailErrorLabel).toBeVisible();
    await expect(this.passwordErrorLabel).toBeVisible();
  }

  async assertInvalidCredentialsError() {
    await expect(this.alertErrorMessage).toBeVisible({ timeout: 15000 });
  }

  async assertPasswordMasked() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }
}
