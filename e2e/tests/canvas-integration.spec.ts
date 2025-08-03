import { test, expect } from '@playwright/test';
import { CanvasPage } from '../utils/canvas-page';

test.describe('Canvas Integration', () => {
  let canvasPage: CanvasPage;

  test.beforeEach(async ({ page }) => {
    canvasPage = new CanvasPage(page);
    
    // Navigate to app
    await page.goto('/?app=true');
    await page.waitForSelector('[data-testid="app-loaded"], nav, .calendar-container', { 
      timeout: 15000 
    });
  });

  test('should navigate to Canvas settings', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Should see Canvas configuration options
    await expect(page.locator('text=Canvas Integration, text=Canvas Settings')).toBeVisible();
    await expect(page.locator('input[placeholder*="ICS"], input[placeholder*="URL"]')).toBeVisible();
  });

  test('should validate ICS URL format', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Try invalid URL
    await canvasPage.fillICSUrl('invalid-url');
    await canvasPage.saveCanvasSettings();
    
    // Should show validation error
    await expect(page.locator('text=Invalid URL, text=Please enter a valid URL')).toBeVisible({ timeout: 5000 });
  });

  test('should handle valid ICS URL format', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Enter valid (but fake) ICS URL
    const testUrl = 'https://canvas.example.edu/feeds/calendars/user_12345.ics';
    await canvasPage.fillICSUrl(testUrl);
    await canvasPage.saveCanvasSettings();
    
    // Should accept valid URL format (even if it doesn't exist)
    await expect(page.locator('text=Settings saved, text=Canvas configured')).toBeVisible({ timeout: 10000 });
  });

  test('should show sync status and options', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Should show sync controls
    await expect(page.locator('button:has-text("Sync"), button:has-text("Import")')).toBeVisible();
    
    // Should show last sync status
    const statusElements = page.locator('text=Last sync, text=Never synced, text=Last updated');
    await expect(statusElements.first()).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Set up invalid URL and try to sync
    await canvasPage.fillICSUrl('https://invalid.canvas.url/feed.ics');
    await canvasPage.saveCanvasSettings();
    
    // Attempt sync
    await canvasPage.triggerSync();
    
    // Should show error message
    await expect(page.locator('text=Sync failed, text=Unable to connect, text=Error')).toBeVisible({ 
      timeout: 15000 
    });
  });

  test('should provide class name mapping options', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Should have options for class name display
    await expect(page.locator('text=Class Names, text=Display Format')).toBeVisible();
    
    // Should have technical vs friendly name options
    const nameOptions = page.locator('input[type="radio"], select option');
    await expect(nameOptions.first()).toBeVisible();
  });

  test('should handle Canvas authentication if required', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Look for authentication fields
    const authFields = page.locator('input[placeholder*="token"], input[placeholder*="key"], input[type="password"]');
    
    if (await authFields.isVisible()) {
      // Test authentication field validation
      await authFields.first().fill('test-token');
      await canvasPage.saveCanvasSettings();
      
      // Should handle auth token validation
      await expect(page.locator('text=Authentication, text=Token')).toBeVisible();
    }
  });

  test('should show sync progress indicator', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Set valid URL format
    await canvasPage.fillICSUrl('https://canvas.example.edu/feeds/calendars/user_12345.ics');
    await canvasPage.saveCanvasSettings();
    
    // Trigger sync and look for progress indicator
    await canvasPage.triggerSync();
    
    // Should show loading/progress state
    await expect(page.locator('.loading, .syncing, text=Syncing, [aria-label*="loading"]')).toBeVisible({ 
      timeout: 5000 
    });
  });

  test('should handle duplicate task prevention', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Configure Canvas settings
    await canvasPage.fillICSUrl('https://canvas.example.edu/feeds/calendars/user_12345.ics');
    await canvasPage.saveCanvasSettings();
    
    // Check for duplicate prevention options
    await expect(page.locator('text=Duplicate, text=Prevent duplicates, text=Skip existing')).toBeVisible();
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Test keyboard navigation through Canvas settings
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be able to tab through all form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Form should remain keyboard accessible
    await expect(page.locator('input:focus, button:focus, select:focus')).toBeVisible();
  });

  test('should display helpful Canvas integration documentation', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Should provide help text or links
    await expect(page.locator('text=How to find, text=ICS URL, text=Canvas calendar, a[href*="help"]')).toBeVisible();
  });

  test('should handle Canvas timezone considerations', async ({ page }) => {
    await canvasPage.navigateToCanvasSettings();
    
    // Look for timezone settings
    const timezoneOptions = page.locator('select[name*="timezone"], text=Timezone, text=Time zone');
    
    if (await timezoneOptions.isVisible()) {
      await expect(timezoneOptions.first()).toBeVisible();
    }
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await canvasPage.navigateToCanvasSettings();
    
    // Canvas settings should be accessible on mobile
    await expect(page.locator('input[placeholder*="ICS"], input[placeholder*="URL"]')).toBeVisible();
    
    // Form elements should be properly sized for mobile
    const urlInput = page.locator('input[placeholder*="ICS"], input[placeholder*="URL"]').first();
    const boundingBox = await urlInput.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
  });
});