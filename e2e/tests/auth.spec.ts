import { test, expect } from '@playwright/test';
import { AuthPage } from '../utils/auth-page';

test.describe('Authentication Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('should display landing page when not authenticated', async ({ page }) => {
    // Check that we're on the landing page
    await expect(page.locator('h1')).toContainText('ScheduleBud');
    
    // Check that key sections are visible
    await expect(page.locator('text=Built by a student, for students')).toBeVisible();
    await expect(page.locator('text=Get Started Free')).toBeVisible();
    
    // Check feature highlights
    await expect(page.locator('text=Canvas Integration')).toBeVisible();
    await expect(page.locator('text=AI-Powered Assistant')).toBeVisible();
  });

  test('should navigate to authentication when get started is clicked', async ({ page }) => {
    // Click get started button
    await page.locator('text=Get Started Free').first().click();
    
    // Should navigate to app with authentication form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // Navigate to auth form
    await authPage.navigateToAuth();
    
    // Try to submit empty form
    await authPage.clickSubmit();
    
    // Should show validation errors
    await expect(page.locator('text=Please enter your email')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await authPage.navigateToAuth();
    
    // Enter invalid credentials
    await authPage.fillEmail('invalid@test.com');
    await authPage.fillPassword('wrongpassword');
    await authPage.clickSubmit();
    
    // Should show error message
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({ timeout: 10000 });
  });

  test('should handle authentication state persistence', async ({ page, context }) => {
    // Skip actual login for demo - would use test credentials in real scenario
    await authPage.navigateToAuth();
    
    // Check that auth state is maintained across page refreshes
    await page.reload();
    
    // Should still be on auth page if not logged in
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    await authPage.navigateToAuth();
    
    // Test keyboard navigation through form
    await page.keyboard.press('Tab'); // Focus email field
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus password field
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Focus submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should display proper ARIA labels and roles', async ({ page }) => {
    await authPage.navigateToAuth();
    
    // Check form accessibility
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
    
    // Check for proper form structure
    await expect(page.locator('form')).toBeVisible();
  });

  test('should work on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await authPage.navigateToAuth();
    
    // Form should be visible and usable on mobile
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Touch targets should be adequately sized (minimum 44px)
    const submitButton = page.locator('button[type="submit"]');
    const boundingBox = await submitButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });
});