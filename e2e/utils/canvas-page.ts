import { Page, Locator } from '@playwright/test';

export class CanvasPage {
  readonly page: Page;
  readonly settingsButton: Locator;
  readonly canvasSettingsLink: Locator;
  readonly icsUrlInput: Locator;
  readonly saveButton: Locator;
  readonly syncButton: Locator;
  readonly lastSyncStatus: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settingsButton = page.locator('button:has-text("Settings"), [data-testid="settings"], .settings-button');
    this.canvasSettingsLink = page.locator('text=Canvas, a[href*="canvas"], button:has-text("Canvas")');
    this.icsUrlInput = page.locator('input[placeholder*="ICS"], input[placeholder*="URL"], input[name*="ics"], input[name*="canvas"]');
    this.saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
    this.syncButton = page.locator('button:has-text("Sync"), button:has-text("Import"), button:has-text("Fetch")');
    this.lastSyncStatus = page.locator('text=Last sync, text=Never synced, text=Last updated, .sync-status');
    this.errorMessage = page.locator('.error, .text-red-600, [role="alert"]');
    this.successMessage = page.locator('.success, .text-green-600, text=Settings saved');
    this.loadingIndicator = page.locator('.loading, .spinner, .syncing, [aria-label*="loading"]');
  }

  async navigateToCanvasSettings() {
    // Try to open settings first
    await this.openSettings();
    
    // Then navigate to Canvas-specific settings
    const canvasLink = this.canvasSettingsLink.first();
    if (await canvasLink.isVisible()) {
      await canvasLink.click();
    } else {
      // If no specific Canvas link, we might already be on the right page
      // or need to look for Canvas section within general settings
      const canvasSection = this.page.locator('text=Canvas Integration, text=Canvas Settings, [data-testid="canvas-settings"]');
      if (await canvasSection.isVisible()) {
        await canvasSection.scrollIntoViewIfNeeded();
      }
    }
    
    // Wait for Canvas settings to be visible
    await this.icsUrlInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async openSettings() {
    // Try multiple ways to access settings
    const settingsSelectors = [
      'button:has-text("Settings")',
      '[data-testid="settings"]',
      '.settings-button',
      'a[href*="settings"]',
      'button[aria-label*="settings" i]',
      // Sometimes settings is in a menu
      'button:has-text("Menu")',
      '.menu-button'
    ];

    let settingsOpened = false;
    
    for (const selector of settingsSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        
        // Check if settings page/modal opened
        const settingsContent = this.page.locator('text=Settings, text=Configuration, .settings-content');
        if (await settingsContent.isVisible({ timeout: 3000 })) {
          settingsOpened = true;
          break;
        }
      }
    }

    // If we couldn't find settings via button, try navigating directly
    if (!settingsOpened) {
      // Try sidebar
      const sidebar = this.page.locator('.sidebar, nav').first();
      if (await sidebar.isVisible()) {
        const sidebarSettings = sidebar.locator('text=Settings, a[href*="settings"]').first();
        if (await sidebarSettings.isVisible()) {
          await sidebarSettings.click();
          settingsOpened = true;
        }
      }
    }

    // Final fallback - try keyboard shortcut
    if (!settingsOpened) {
      await this.page.keyboard.press('Control+,'); // Common settings shortcut
    }
  }

  async fillICSUrl(url: string) {
    await this.icsUrlInput.fill(url);
  }

  async saveCanvasSettings() {
    await this.saveButton.click();
    
    // Wait for either success or error message
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 })
    ]);
  }

  async triggerSync() {
    await this.syncButton.click();
    
    // Wait for sync to start (loading indicator) or complete
    await Promise.race([
      this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }),
      this.successMessage.waitFor({ state: 'visible', timeout: 15000 })
    ]);
  }

  async waitForSyncComplete() {
    // Wait for loading to disappear and status to update
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
    
    // Check for updated sync status
    await this.lastSyncStatus.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getLastSyncStatus(): Promise<string> {
    const statusText = await this.lastSyncStatus.textContent();
    return statusText?.trim() || 'Unknown';
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async hasSuccess(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      const errorText = await this.errorMessage.textContent();
      return errorText?.trim() || 'Unknown error';
    }
    return '';
  }

  async selectClassNameFormat(format: 'technical' | 'friendly') {
    // Look for radio buttons or select for class name format
    const formatOptions = this.page.locator(`input[value="${format}"], option[value="${format}"]`);
    
    if (await formatOptions.isVisible()) {
      await formatOptions.click();
    } else {
      // Try text-based selection
      const formatText = this.page.locator(`text=${format}`).first();
      if (await formatText.isVisible()) {
        await formatText.click();
      }
    }
  }

  async enableDuplicatePrevention() {
    const duplicateOption = this.page.locator('input[type="checkbox"]:near(text="duplicate"), input[name*="duplicate"]').first();
    
    if (await duplicateOption.isVisible()) {
      await duplicateOption.check();
    }
  }

  async setAuthToken(token: string) {
    const tokenInput = this.page.locator('input[placeholder*="token"], input[placeholder*="key"], input[type="password"]').first();
    
    if (await tokenInput.isVisible()) {
      await tokenInput.fill(token);
    }
  }

  async isCanvasConfigured(): Promise<boolean> {
    // Check if Canvas URL is filled and valid
    const urlValue = await this.icsUrlInput.inputValue();
    return urlValue.length > 0 && urlValue.includes('http');
  }

  async clearCanvasConfiguration() {
    await this.icsUrlInput.clear();
    await this.saveCanvasSettings();
  }
}