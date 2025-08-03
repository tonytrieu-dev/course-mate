import { Page, Locator } from '@playwright/test';
import { TestTasks, Selectors } from '../fixtures/test-data';

interface TaskData {
  title: string;
  description?: string;
  dueDate?: string;
  class?: string;
  priority?: string;
  type?: string;
}

export class CalendarPage {
  readonly page: Page;
  readonly calendarNavButton: Locator;
  readonly calendar: Locator;
  readonly monthViewButton: Locator;
  readonly weekViewButton: Locator;
  readonly dayViewButton: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly todayButton: Locator;
  readonly viewTitle: Locator;
  readonly calendarDays: Locator;

  constructor(page: Page) {
    this.page = page;
    this.calendarNavButton = page.locator(Selectors.navigation.calendar);
    this.calendar = page.locator('.calendar, [data-testid="calendar"]');
    this.monthViewButton = page.locator('button:has-text("Month"), button[data-view="month"]');
    this.weekViewButton = page.locator('button:has-text("Week"), button[data-view="week"]');
    this.dayViewButton = page.locator('button:has-text("Day"), button[data-view="day"]');
    this.previousButton = page.locator('button[aria-label*="previous"], button:has-text("‹"), .nav-previous');
    this.nextButton = page.locator('button[aria-label*="next"], button:has-text("›"), .nav-next');
    this.todayButton = page.locator('button:has-text("Today"), .today-button, [data-testid="today"]');
    this.viewTitle = page.locator('.calendar-title, .view-title, h1, h2').first();
    this.calendarDays = page.locator('.calendar-day, [data-date], .day');
  }

  async navigateToCalendar() {
    // Check if we're already on calendar view
    const isCalendarView = await this.calendar.isVisible();
    
    if (!isCalendarView) {
      await this.calendarNavButton.click();
      await this.calendar.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  async switchToMonthView() {
    if (await this.monthViewButton.isVisible()) {
      await this.monthViewButton.click();
      await this.page.waitForTimeout(500); // Allow view to switch
    }
  }

  async switchToWeekView() {
    if (await this.weekViewButton.isVisible()) {
      await this.weekViewButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async switchToDayView() {
    if (await this.dayViewButton.isVisible()) {
      await this.dayViewButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async navigateNext() {
    await this.nextButton.first().click();
    await this.page.waitForTimeout(300); // Allow navigation animation
  }

  async navigatePrevious() {
    await this.previousButton.first().click();
    await this.page.waitForTimeout(300);
  }

  async navigateToToday() {
    if (await this.todayButton.isVisible()) {
      await this.todayButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async getCurrentViewTitle(): Promise<string> {
    const title = await this.viewTitle.textContent();
    return title?.trim() || '';
  }

  async navigateToDate(targetDate: Date) {
    const today = new Date();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // First navigate to today
    await this.navigateToToday();

    // Calculate months to navigate
    const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

    if (monthDiff > 0) {
      // Navigate forward
      for (let i = 0; i < monthDiff; i++) {
        await this.navigateNext();
      }
    } else if (monthDiff < 0) {
      // Navigate backward
      for (let i = 0; i < Math.abs(monthDiff); i++) {
        await this.navigatePrevious();
      }
    }

    await this.page.waitForTimeout(500);
  }

  async clickOnCalendarDate(day: number) {
    // Try different ways to find and click on a specific day
    const daySelectors = [
      `[data-date*="${day}"]`,
      `.calendar-day:has-text("${day}")`,
      `.day:has-text("${day}")`,
      `button:has-text("${day}")`
    ];

    let dayClicked = false;
    for (const selector of daySelectors) {
      const dayElement = this.page.locator(selector).first();
      if (await dayElement.isVisible()) {
        await dayElement.click();
        dayClicked = true;
        break;
      }
    }

    if (!dayClicked) {
      // Fallback: click on any available day
      const anyDay = this.calendarDays.first();
      if (await anyDay.isVisible()) {
        await anyDay.click();
      }
    }

    // Wait for modal or action to occur
    await this.page.waitForTimeout(1000);
  }

  async createTestTask(taskData: TaskData) {
    // Navigate to tasks view to create task, then return to calendar
    const tasksButton = this.page.locator(Selectors.navigation.tasks);
    await tasksButton.click();
    await this.page.waitForTimeout(1000);

    // Open task modal
    const addTaskButton = this.page.locator('button:has-text("Add Task"), button:has-text("New"), [data-testid="add-task"]').first();
    if (await addTaskButton.isVisible()) {
      await addTaskButton.click();
    } else {
      // Try keyboard shortcut
      await this.page.keyboard.press('Control+n');
    }

    // Wait for modal
    await this.page.locator(Selectors.modal).waitFor({ state: 'visible', timeout: 10000 });

    // Fill task form
    await this.page.locator(Selectors.taskForm.title).fill(taskData.title);
    
    if (taskData.description) {
      const descField = this.page.locator(Selectors.taskForm.description);
      if (await descField.isVisible()) {
        await descField.fill(taskData.description);
      }
    }

    if (taskData.dueDate) {
      const dateField = this.page.locator(Selectors.taskForm.dueDate);
      if (await dateField.isVisible()) {
        await dateField.fill(taskData.dueDate);
      }
    }

    // Save task
    await this.page.locator(Selectors.taskForm.save).click();
    await this.page.locator(Selectors.modal).waitFor({ state: 'hidden', timeout: 10000 });

    // Navigate back to calendar
    await this.navigateToCalendar();
  }

  async getTasksOnDate(date: string): Promise<string[]> {
    // Navigate to the specific date first
    await this.navigateToDate(new Date(date));

    // Find tasks displayed on that date
    const taskElements = this.page.locator('.task, .event, [data-task-title]');
    const count = await taskElements.count();
    const tasks: string[] = [];

    for (let i = 0; i < count; i++) {
      const taskText = await taskElements.nth(i).textContent();
      if (taskText) {
        tasks.push(taskText.trim());
      }
    }

    return tasks;
  }

  async isTaskVisibleOnCalendar(taskTitle: string): Promise<boolean> {
    const taskElement = this.page.locator(`text=${taskTitle}`);
    return await taskElement.isVisible();
  }

  async getCalendarViewMode(): Promise<string> {
    // Determine current view mode
    if (await this.page.locator('.month-view, [data-view="month"]').isVisible()) {
      return 'month';
    } else if (await this.page.locator('.week-view, [data-view="week"]').isVisible()) {
      return 'week';
    } else if (await this.page.locator('.day-view, [data-view="day"]').isVisible()) {
      return 'day';
    }
    return 'unknown';
  }

  async clickTaskOnCalendar(taskTitle: string) {
    const taskElement = this.page.locator(`text=${taskTitle}`);
    await taskElement.click();
    
    // Wait for action (modal open, navigation, etc.)
    await this.page.waitForTimeout(1000);
  }

  async dragTaskToDate(taskTitle: string, targetDay: number) {
    const taskElement = this.page.locator(`text=${taskTitle}`);
    const targetDate = this.page.locator(`[data-date*="${targetDay}"], .calendar-day:has-text("${targetDay}")`).first();
    
    if (await taskElement.isVisible() && await targetDate.isVisible()) {
      await taskElement.dragTo(targetDate);
      await this.page.waitForTimeout(1000);
    }
  }

  async filterCalendarBy(filterType: string, filterValue: string) {
    // Look for filter controls
    const filterButton = this.page.locator('button:has-text("Filter"), select[name="filter"]').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Select specific filter option
      const filterOption = this.page.locator(`option:has-text("${filterValue}"), button:has-text("${filterValue}")`);
      if (await filterOption.isVisible()) {
        await filterOption.click();
      }
    }
  }

  async clearFilters() {
    const clearButton = this.page.locator('button:has-text("Clear"), button:has-text("All"), button:has-text("Reset")').first();
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async getVisibleTasks(): Promise<string[]> {
    const taskElements = this.page.locator('.task, .event, [data-task-title]');
    const count = await taskElements.count();
    const tasks: string[] = [];

    for (let i = 0; i < count; i++) {
      const taskText = await taskElements.nth(i).textContent();
      if (taskText && await taskElements.nth(i).isVisible()) {
        tasks.push(taskText.trim());
      }
    }

    return tasks;
  }

  async hasCalendarLoaded(): Promise<boolean> {
    return await this.calendar.isVisible() && 
           await this.calendarDays.first().isVisible();
  }

  async waitForCalendarToLoad() {
    await this.calendar.waitFor({ state: 'visible', timeout: 10000 });
    await this.calendarDays.first().waitFor({ state: 'visible', timeout: 5000 });
  }
}