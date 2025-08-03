import { test, expect } from '@playwright/test';
import { TaskPage } from '../utils/task-page';
import { AuthPage } from '../utils/auth-page';

test.describe('Task Management Workflow', () => {
  let taskPage: TaskPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    authPage = new AuthPage(page);
    
    // Start from the app (skip auth for testing - in real scenario would log in)
    await page.goto('/?app=true');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"], nav, .calendar-container', { 
      timeout: 15000 
    });
  });

  test('should display main navigation and allow view switching', async ({ page }) => {
    // Check main navigation is visible
    await expect(page.locator('nav').first()).toBeVisible();
    
    // Test navigation to different views
    const dashboardBtn = page.locator('button:has-text("Dashboard"), button:has-text("D")');
    const tasksBtn = page.locator('button:has-text("Tasks"), button:has-text("T")');
    const calendarBtn = page.locator('button:has-text("Calendar"), button:has-text("C")');
    
    // Navigate to tasks view
    if (await tasksBtn.isVisible()) {
      await tasksBtn.click();
      await expect(page.locator('.task-view, [data-testid="task-view"]')).toBeVisible({ timeout: 10000 });
    }
    
    // Navigate to calendar view
    if (await calendarBtn.isVisible()) {
      await calendarBtn.click();
      await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should open task modal and create a new task', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // Open task creation modal
    await taskPage.openTaskModal();
    
    // Fill task details
    const taskData = {
      title: 'Test Assignment E2E',
      description: 'This is a test task created via E2E testing',
      dueDate: '2025-12-31',
      class: 'Computer Science'
    };
    
    await taskPage.fillTaskForm(taskData);
    await taskPage.saveTask();
    
    // Verify task was created
    await expect(page.locator(`text=${taskData.title}`)).toBeVisible({ timeout: 10000 });
  });

  test('should edit an existing task', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // First create a task to edit
    await taskPage.openTaskModal();
    await taskPage.fillTaskForm({
      title: 'Task to Edit',
      description: 'Original description'
    });
    await taskPage.saveTask();
    
    // Find and edit the task
    await taskPage.editTask('Task to Edit');
    
    // Update task details
    await taskPage.fillTaskForm({
      title: 'Edited Task Title',
      description: 'Updated description'
    });
    await taskPage.saveTask();
    
    // Verify changes were saved
    await expect(page.locator('text=Edited Task Title')).toBeVisible();
    await expect(page.locator('text=Task to Edit')).not.toBeVisible();
  });

  test('should mark task as completed', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // Create a task to complete
    await taskPage.openTaskModal();
    await taskPage.fillTaskForm({
      title: 'Task to Complete',
      description: 'This task will be marked as done'
    });
    await taskPage.saveTask();
    
    // Mark task as completed
    await taskPage.toggleTaskCompletion('Task to Complete');
    
    // Verify task shows as completed
    await expect(page.locator('[data-task-title="Task to Complete"]')).toHaveClass(/completed|done/);
  });

  test('should delete a task', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // Create a task to delete
    await taskPage.openTaskModal();
    await taskPage.fillTaskForm({
      title: 'Task to Delete',
      description: 'This task will be deleted'
    });
    await taskPage.saveTask();
    
    // Delete the task
    await taskPage.deleteTask('Task to Delete');
    
    // Verify task was deleted
    await expect(page.locator('text=Task to Delete')).not.toBeVisible();
  });

  test('should validate required fields in task form', async ({ page }) => {
    await taskPage.navigateToTasks();
    await taskPage.openTaskModal();
    
    // Try to save without required fields
    await taskPage.saveTask();
    
    // Should show validation errors
    await expect(page.locator('text=Title is required, text=Please enter a title')).toBeVisible({ timeout: 5000 });
  });

  test('should filter tasks by completion status', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // Create completed and incomplete tasks
    await taskPage.createTask({ title: 'Completed Task', description: 'Done' });
    await taskPage.createTask({ title: 'Incomplete Task', description: 'Not done' });
    
    // Mark one as completed
    await taskPage.toggleTaskCompletion('Completed Task');
    
    // Test filtering
    const filterButton = page.locator('button:has-text("Filter"), select, [data-testid="task-filter"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Filter for completed tasks only
      await page.locator('option:has-text("Completed"), button:has-text("Completed")').click();
      
      // Should show only completed task
      await expect(page.locator('text=Completed Task')).toBeVisible();
      await expect(page.locator('text=Incomplete Task')).not.toBeVisible();
    }
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await taskPage.navigateToTasks();
    
    // Mobile navigation should work
    const menuButton = page.locator('button[aria-label="Open sidebar"], .mobile-menu-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav, .sidebar')).toBeVisible();
    }
    
    // Task creation should work on mobile
    await taskPage.openTaskModal();
    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
    
    // Form should be usable on mobile
    await taskPage.fillTaskForm({
      title: 'Mobile Task',
      description: 'Created on mobile'
    });
    await taskPage.saveTask();
    
    await expect(page.locator('text=Mobile Task')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await taskPage.navigateToTasks();
    
    // Test keyboard shortcuts for task creation
    await page.keyboard.press('Control+n'); // Common shortcut for new item
    
    // If modal opens, test keyboard navigation within it
    const modalVisible = await page.locator('.modal, [role="dialog"]').isVisible();
    if (modalVisible) {
      // Tab through form fields
      await page.keyboard.press('Tab');
      await expect(page.locator('input[type="text"]').first()).toBeFocused();
      
      // Test escape to close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('.modal, [role="dialog"]')).not.toBeVisible();
    }
  });
});