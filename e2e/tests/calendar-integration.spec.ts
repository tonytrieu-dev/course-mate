import { test, expect } from '@playwright/test';
import { CalendarPage } from '../utils/calendar-page';
import { TestTasks, TestConfig, Selectors } from '../fixtures/test-data';

test.describe('Calendar Integration', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    
    // Navigate to app
    await page.goto('/?app=true');
    await page.waitForSelector('[data-testid="app-loaded"], nav, .calendar-container', { 
      timeout: TestConfig.performance.maxLoadTime 
    });
  });

  test('should display calendar with different view modes', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Test month view (default)
    await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible();
    
    // Switch to week view
    await calendarPage.switchToWeekView();
    await expect(page.locator('.week-view, [data-testid="week-view"]')).toBeVisible();
    
    // Switch to day view
    await calendarPage.switchToDayView();
    await expect(page.locator('.day-view, [data-testid="day-view"]')).toBeVisible();
    
    // Switch back to month view
    await calendarPage.switchToMonthView();
    await expect(page.locator('.month-view, [data-testid="month-view"]')).toBeVisible();
  });

  test('should navigate between months/weeks/days', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Get current month/date display
    const initialTitle = await calendarPage.getCurrentViewTitle();
    
    // Navigate forward
    await calendarPage.navigateNext();
    const nextTitle = await calendarPage.getCurrentViewTitle();
    expect(nextTitle).not.toBe(initialTitle);
    
    // Navigate backward
    await calendarPage.navigatePrevious();
    const backTitle = await calendarPage.getCurrentViewTitle();
    expect(backTitle).toBe(initialTitle);
  });

  test('should display tasks on calendar', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create a test task first
    await calendarPage.createTestTask({
      ...TestTasks.basicTask,
      dueDate: '2025-08-15' // Ensure we can see it
    });
    
    // Navigate to the date where task should appear
    await calendarPage.navigateToDate(new Date('2025-08-15'));
    
    // Task should be visible on calendar
    await expect(page.locator(`text=${TestTasks.basicTask.title}`)).toBeVisible();
  });

  test('should allow task creation from calendar', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Click on a calendar day to create task
    await calendarPage.clickOnCalendarDate(15); // Click on 15th day
    
    // Task modal should open
    await expect(page.locator(Selectors.modal)).toBeVisible();
    
    // Fill and save task
    await page.locator(Selectors.taskForm.title).fill('Calendar Created Task');
    await page.locator(Selectors.taskForm.save).click();
    
    // Task should appear on calendar
    await expect(page.locator('text=Calendar Created Task')).toBeVisible();
  });

  test('should handle task editing from calendar', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create a task first
    await calendarPage.createTestTask(TestTasks.basicTask);
    
    // Click on the task in calendar
    await page.locator(`text=${TestTasks.basicTask.title}`).click();
    
    // Edit modal should open
    await expect(page.locator(Selectors.modal)).toBeVisible();
    
    // Edit the task
    await page.locator(Selectors.taskForm.title).fill('Edited Calendar Task');
    await page.locator(Selectors.taskForm.save).click();
    
    // Updated task should appear
    await expect(page.locator('text=Edited Calendar Task')).toBeVisible();
    await expect(page.locator(`text=${TestTasks.basicTask.title}`)).not.toBeVisible();
  });

  test('should show task completion status on calendar', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create a task
    await calendarPage.createTestTask(TestTasks.basicTask);
    
    // Mark task as complete
    const taskElement = page.locator(`text=${TestTasks.basicTask.title}`);
    const checkbox = taskElement.locator('..').locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      // Alternative completion method
      await taskElement.click({ button: 'right' });
      await page.locator('text=Complete, text=Mark as done').click();
    }
    
    // Task should show as completed (strikethrough, different color, etc.)
    await expect(taskElement).toHaveClass(/completed|done|strike/);
  });

  test('should filter calendar by task type/class', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create tasks of different types
    await calendarPage.createTestTask({
      ...TestTasks.basicTask,
      title: 'Homework Task',
      type: 'Homework'
    });
    
    await calendarPage.createTestTask({
      ...TestTasks.projectTask,
      title: 'Project Task',
      type: 'Project'
    });
    
    // Look for filter options
    const filterButton = page.locator('button:has-text("Filter"), select[name="filter"]').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Filter by homework
      await page.locator('option:has-text("Homework"), button:has-text("Homework")').click();
      
      // Should show only homework tasks
      await expect(page.locator('text=Homework Task')).toBeVisible();
      await expect(page.locator('text=Project Task')).not.toBeVisible();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight'); // Navigate days
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown'); // Navigate weeks
    await page.keyboard.press('ArrowUp');
    
    // Test view switching shortcuts
    await page.keyboard.press('m'); // Month view
    await page.keyboard.press('w'); // Week view
    await page.keyboard.press('d'); // Day view
    
    // Calendar should remain functional
    await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(TestConfig.viewports.mobile);
    
    await calendarPage.navigateToCalendar();
    
    // Calendar should adapt to mobile layout
    await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible();
    
    // Navigation buttons should be touch-friendly
    const navButtons = page.locator('button[aria-label*="previous"], button[aria-label*="next"]');
    const firstButton = navButtons.first();
    if (await firstButton.isVisible()) {
      const boundingBox = await firstButton.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(TestConfig.accessibility.minTouchTarget);
    }
    
    // Should be able to create tasks on mobile
    await calendarPage.clickOnCalendarDate(15);
    await expect(page.locator(Selectors.modal)).toBeVisible();
  });

  test('should handle today navigation', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Navigate away from today
    await calendarPage.navigateNext();
    await calendarPage.navigateNext();
    
    // Click today button
    const todayButton = page.locator('button:has-text("Today"), .today-button, [data-testid="today"]');
    if (await todayButton.isVisible()) {
      await todayButton.click();
      
      // Should navigate back to current date
      const currentTitle = await calendarPage.getCurrentViewTitle();
      const today = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const expectedMonth = monthNames[today.getMonth()];
      
      expect(currentTitle).toContain(expectedMonth);
    }
  });

  test('should display task priorities with visual indicators', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create high priority task
    await calendarPage.createTestTask({
      ...TestTasks.urgentTask,
      priority: 'high'
    });
    
    // Create normal priority task
    await calendarPage.createTestTask({
      ...TestTasks.basicTask,
      priority: 'normal'
    });
    
    // High priority task should have visual indicator
    const highPriorityTask = page.locator(`text=${TestTasks.urgentTask.title}`);
    await expect(highPriorityTask).toBeVisible();
    
    // Should have some visual indicator (color, icon, etc.)
    // This depends on implementation - checking for common patterns
    const taskContainer = highPriorityTask.locator('..');
    await expect(taskContainer).toHaveClass(/high|urgent|priority|red/);
  });

  test('should handle drag and drop for task rescheduling', async ({ page }) => {
    await calendarPage.navigateToCalendar();
    
    // Create a task
    await calendarPage.createTestTask({
      ...TestTasks.basicTask,
      dueDate: '2025-08-15'
    });
    
    // Navigate to show the task
    await calendarPage.navigateToDate(new Date('2025-08-15'));
    
    const taskElement = page.locator(`text=${TestTasks.basicTask.title}`);
    const targetDate = page.locator('[data-date="2025-08-20"], .calendar-day').nth(5); // 5 days later
    
    if (await taskElement.isVisible() && await targetDate.isVisible()) {
      // Attempt drag and drop
      await taskElement.dragTo(targetDate);
      
      // Task should move to new date
      await calendarPage.navigateToDate(new Date('2025-08-20'));
      await expect(page.locator(`text=${TestTasks.basicTask.title}`)).toBeVisible();
    }
  });
});