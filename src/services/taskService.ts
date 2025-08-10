import type { Task, TaskInsert, TaskUpdate } from '../types/database';
import type { User } from '@supabase/supabase-js';
import { 
  getTasks as getTasksFromData, 
  addTask as addTaskToData, 
  updateTask as updateTaskInData, 
  deleteTask as deleteTaskFromData 
} from "./task/taskOperations";
import { logger } from "../utils/logger";

// Type for task change listeners
type TaskChangeListener = (tasks: Task[]) => void;

// Task service interface
interface TaskServiceInterface {
  listeners: Set<TaskChangeListener>;
  tasks: Task[];
  isInitialized: boolean;
  
  subscribe(listener: TaskChangeListener): () => void;
  notifyListeners(): void;
  initialize(userId?: string, useSupabase?: boolean): Promise<Task[]>;
  getCurrentTasks(): Task[];
  getTasks(): Task[];
  getTask(taskId: string): Task | undefined;
  addTask(task: TaskInsert, useSupabase?: boolean, providedUser?: User | null): Promise<Task | null>;
  updateTask(taskId: string, updatedTask: TaskUpdate, useSupabase?: boolean): Promise<Task | null>;
  deleteTask(taskId: string, useSupabase?: boolean): Promise<boolean>;
  refreshTasks(userId?: string, useSupabase?: boolean): Promise<Task[]>;
  reset(): void;
}

// Task management service that provides centralized task operations
// This service ensures task data consistency across all components
class TaskService implements TaskServiceInterface {
  public listeners: Set<TaskChangeListener>;
  public tasks: Task[];
  public isInitialized: boolean;

  constructor() {
    this.listeners = new Set();
    this.tasks = [];
    this.isInitialized = false;
  }

  // Subscribe to task changes
  subscribe(listener: TaskChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners about task changes
  notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.tasks));
  }

  // Initialize task service with current data
  async initialize(userId?: string, useSupabase = false): Promise<Task[]> {
    if (this.isInitialized) return this.tasks;
    
    try {
      this.tasks = await getTasksFromData(userId, useSupabase);
      this.isInitialized = true;
      this.notifyListeners();
      return this.tasks;
    } catch (error) {
      logger.error('Error initializing task service:', error);
      this.tasks = [];
      return this.tasks;
    }
  }

  // Get current tasks (for components that need direct access)
  getCurrentTasks(): Task[] {
    return [...this.tasks];
  }

  // Get all tasks
  getTasks(): Task[] {
    return this.tasks;
  }

  // Get a specific task by ID
  getTask(taskId: string): Task | undefined {
    return this.tasks.find(task => task.id === taskId);
  }

  // Add a new task
  async addTask(task: TaskInsert, useSupabase = false, providedUser: User | null = null): Promise<Task | null> {
    try {
      const newTask = await addTaskToData(task, useSupabase, providedUser);
      if (newTask) {
        this.tasks = [...this.tasks, newTask];
        this.notifyListeners();
      }
      return newTask;
    } catch (error) {
      logger.error('Error adding task:', error);
      return null;
    }
  }

  // Update an existing task
  async updateTask(taskId: string, updatedTask: TaskUpdate, useSupabase = false): Promise<Task | null> {
    try {
      const updated = await updateTaskInData(taskId, updatedTask, useSupabase);
      if (updated) {
        this.tasks = this.tasks.map(task => 
          task.id === taskId ? updated : task
        );
        this.notifyListeners();
      }
      return updated;
    } catch (error) {
      logger.error('Error updating task:', error);
      return null;
    }
  }

  // Delete a task
  async deleteTask(taskId: string, useSupabase = false): Promise<boolean> {
    try {
      const success = await deleteTaskFromData(taskId, useSupabase);
      if (success) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      logger.error('Error deleting task:', error);
      return false;
    }
  }

  // Refresh tasks from data source
  async refreshTasks(userId?: string, useSupabase = false): Promise<Task[]> {
    try {
      this.tasks = await getTasksFromData(userId, useSupabase);
      this.notifyListeners();
      return this.tasks;
    } catch (error) {
      logger.error('Error refreshing tasks:', error);
      this.tasks = [];
      return this.tasks;
    }
  }

  // Reset service (clear data and listeners)
  reset(): void {
    this.tasks = [];
    this.isInitialized = false;
    this.notifyListeners();
  }
}

// Export singleton instance
const taskService = new TaskService();
export default taskService;