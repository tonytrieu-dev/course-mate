import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly getStartedButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.getStartedButton = page.locator('text=Get Started Free').first();
    this.errorMessage = page.locator('[role="alert"], .error, .text-red-600');
  }

  async goto() {
    await this.page.goto('/');
  }

  async navigateToAuth() {
    await this.goto();
    // Check if we're already on auth form, if not click get started
    const emailVisible = await this.emailInput.isVisible();
    if (!emailVisible) {
      await this.getStartedButton.click();
      // Wait for navigation or form to appear
      await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10000 });
  }

  async waitForSuccessfulLogin() {
    // Wait for redirect to main app (calendar or dashboard)
    await this.page.waitForSelector('nav, [role="navigation"]', { timeout: 15000 });
  }
}