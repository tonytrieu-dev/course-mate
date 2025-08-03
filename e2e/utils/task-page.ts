import { Page, Locator } from '@playwright/test';

interface TaskData {
  title: string;
  description?: string;
  dueDate?: string;
  class?: string;
  priority?: string;
  type?: string;
}

export class TaskPage {
  readonly page: Page;
  readonly tasksNavButton: Locator;
  readonly addTaskButton: Locator;
  readonly taskModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly dueDateInput: Locator;
  readonly classSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tasksNavButton = page.locator('button:has-text("Tasks"), button:has-text("T")');
    this.addTaskButton = page.locator('button:has-text("Add Task"), button:has-text("New"), [data-testid="add-task"]').first();
    this.taskModal = page.locator('.modal, [role="dialog"]');
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
    this.descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
    this.dueDateInput = page.locator('input[type="date"], input[name="dueDate"]');
    this.classSelect = page.locator('select[name="class"], select[name="classId"]');
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.deleteButton = page.locator('button:has-text("Delete")');
  }

  async navigateToTasks() {
    // Check if we're already on tasks view
    const isTasksView = await this.page.locator('.task-view, [data-testid="task-view"]').isVisible();
    
    if (!isTasksView) {
      await this.tasksNavButton.click();
      await this.page.waitForSelector('.task-view, [data-testid="task-view"], .task-list', { 
        timeout: 10000 
      });
    }
  }

  async openTaskModal() {
    // Try multiple selectors for the add task button
    const addButtons = [
      'button:has-text("Add Task")',
      'button:has-text("New Task")',
      'button:has-text("+")',
      '[data-testid="add-task"]',
      '.add-task-button'
    ];

    let buttonFound = false;
    for (const selector of addButtons) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible()) {
        await button.click();
        buttonFound = true;
        break;
      }
    }

    if (!buttonFound) {
      // Try clicking anywhere that might open a task modal
      await this.page.locator('body').click();
      await this.page.keyboard.press('Control+n');
    }

    // Wait for modal to appear
    await this.taskModal.waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillTaskForm(taskData: TaskData) {
    // Fill title (required field)
    if (taskData.title) {
      await this.titleInput.fill(taskData.title);
    }

    // Fill description if provided
    if (taskData.description && await this.descriptionInput.isVisible()) {
      await this.descriptionInput.fill(taskData.description);
    }

    // Fill due date if provided
    if (taskData.dueDate && await this.dueDateInput.isVisible()) {
      await this.dueDateInput.fill(taskData.dueDate);
    }

    // Select class if provided
    if (taskData.class && await this.classSelect.isVisible()) {
      await this.classSelect.selectOption(taskData.class);
    }
  }

  async saveTask() {
    await this.saveButton.click();
    
    // Wait for modal to close
    await this.taskModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async cancelTask() {
    await this.cancelButton.click();
    await this.taskModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async createTask(taskData: TaskData) {
    await this.openTaskModal();
    await this.fillTaskForm(taskData);
    await this.saveTask();
  }

  async findTask(title: string): Promise<Locator> {
    // Try different selectors to find tasks
    const taskSelectors = [
      `[data-task-title="${title}"]`,
      `text=${title}`,
      `.task-item:has-text("${title}")`,
      `.task:has-text("${title}")`,
      `[aria-label*="${title}"]`
    ];

    for (const selector of taskSelectors) {
      const task = this.page.locator(selector).first();
      if (await task.isVisible()) {
        return task;
      }
    }

    // Fallback: return any element containing the text
    return this.page.locator(`text=${title}`).first();
  }

  async editTask(title: string) {
    const task = await this.findTask(title);
    
    // Try different ways to open edit mode
    await task.dblclick(); // Double-click to edit
    
    // If modal doesn't open, try right-click or find edit button
    if (!await this.taskModal.isVisible({ timeout: 2000 })) {
      await task.click({ button: 'right' }); // Right-click context menu
      await this.page.locator('text=Edit').click();
    }
    
    // If still no modal, try finding edit button
    if (!await this.taskModal.isVisible({ timeout: 2000 })) {
      const editButton = task.locator('button:has-text("Edit"), .edit-button').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      }
    }

    await this.taskModal.waitFor({ state: 'visible', timeout: 10000 });
  }

  async deleteTask(title: string) {
    const task = await this.findTask(title);
    
    // First try to open edit mode to access delete
    await this.editTask(title);
    
    // Look for delete button in modal
    if (await this.deleteButton.isVisible()) {
      await this.deleteButton.click();
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    }
    
    // Wait for task to disappear
    await task.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async toggleTaskCompletion(title: string) {
    const task = await this.findTask(title);
    
    // Look for checkbox or completion toggle
    const checkbox = task.locator('input[type="checkbox"], .checkbox, .complete-toggle').first();
    
    if (await checkbox.isVisible()) {
      await checkbox.click();
    } else {
      // If no checkbox visible, try clicking the task itself
      await task.click();
    }
  }

  async getTaskList(): Promise<string[]> {
    const taskElements = this.page.locator('.task-item, .task, [data-testid="task"]');
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

  async filterTasks(filter: string) {
    const filterButton = this.page.locator('button:has-text("Filter"), select[name="filter"], [data-testid="filter"]').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await this.page.locator(`option:has-text("${filter}"), button:has-text("${filter}")`).click();
    }
  }

  async searchTasks(searchTerm: string) {
    const searchInput = this.page.locator('input[placeholder*="search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchTerm);
      await this.page.keyboard.press('Enter');
    }
  }
}