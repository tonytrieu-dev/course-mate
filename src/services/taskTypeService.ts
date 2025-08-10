import type { TaskType, TaskTypeInsert, TaskTypeUpdate } from '../types/database';
import { 
  getTaskTypes as getTaskTypesFromData, 
  addTaskType as addTaskTypeToData, 
  updateTaskType as updateTaskTypeInData, 
  deleteTaskType as deleteTaskTypeFromData 
} from "./taskType/taskTypeOperations";
import { logger } from "../utils/logger";

// Type for task type change listeners
type TaskTypeChangeListener = (taskTypes: TaskType[]) => void;

// Task type service interface
interface TaskTypeServiceInterface {
  listeners: Set<TaskTypeChangeListener>;
  taskTypes: TaskType[];
  isInitialized: boolean;
  
  subscribe(listener: TaskTypeChangeListener): () => void;
  notifyListeners(): void;
  initialize(userId?: string, useSupabase?: boolean): Promise<TaskType[]>;
  getCurrentTaskTypes(): TaskType[];
  getTaskTypes(): TaskType[];
  getTaskType(taskTypeId: string): TaskType | undefined;
  addTaskType(taskType: TaskTypeInsert, useSupabase?: boolean): Promise<TaskType | null>;
  updateTaskType(taskTypeId: string, updatedTaskType: TaskTypeUpdate, useSupabase?: boolean): Promise<TaskType | null>;
  deleteTaskType(taskTypeId: string, useSupabase?: boolean): Promise<boolean>;
  refreshTaskTypes(userId?: string, useSupabase?: boolean): Promise<TaskType[]>;
  reset(): void;
}

// Task type management service that provides centralized task type operations
// This service ensures task type data consistency across all components
class TaskTypeService implements TaskTypeServiceInterface {
  public listeners: Set<TaskTypeChangeListener>;
  public taskTypes: TaskType[];
  public isInitialized: boolean;

  constructor() {
    this.listeners = new Set();
    this.taskTypes = [];
    this.isInitialized = false;
  }

  // Subscribe to task type changes
  subscribe(listener: TaskTypeChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners about task type changes
  notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.taskTypes));
  }

  // Initialize task type service with current data
  async initialize(userId?: string, useSupabase = false): Promise<TaskType[]> {
    if (this.isInitialized) return this.taskTypes;
    
    try {
      this.taskTypes = await getTaskTypesFromData(userId, useSupabase);
      this.isInitialized = true;
      this.notifyListeners();
      return this.taskTypes;
    } catch (error) {
      logger.error('Error initializing task type service:', error);
      this.taskTypes = [];
      return this.taskTypes;
    }
  }

  // Get current task types (for components that need direct access)
  getCurrentTaskTypes(): TaskType[] {
    return [...this.taskTypes];
  }

  // Get all task types
  getTaskTypes(): TaskType[] {
    return this.taskTypes;
  }

  // Get a specific task type by ID
  getTaskType(taskTypeId: string): TaskType | undefined {
    return this.taskTypes.find(taskType => taskType.id === taskTypeId);
  }

  // Add a new task type
  async addTaskType(taskType: TaskTypeInsert, useSupabase = false): Promise<TaskType | null> {
    try {
      const newTaskType = await addTaskTypeToData(taskType, useSupabase);
      if (newTaskType) {
        this.taskTypes = [...this.taskTypes, newTaskType];
        this.notifyListeners();
      }
      return newTaskType;
    } catch (error) {
      logger.error('Error adding task type:', error);
      return null;
    }
  }

  // Update an existing task type
  async updateTaskType(taskTypeId: string, updatedTaskType: TaskTypeUpdate, useSupabase = false): Promise<TaskType | null> {
    try {
      const updated = await updateTaskTypeInData(taskTypeId, updatedTaskType, useSupabase);
      if (updated) {
        this.taskTypes = this.taskTypes.map(taskType => 
          taskType.id === taskTypeId ? updated : taskType
        );
        this.notifyListeners();
      }
      return updated;
    } catch (error) {
      logger.error('Error updating task type:', error);
      return null;
    }
  }

  // Delete a task type
  async deleteTaskType(taskTypeId: string, useSupabase = false): Promise<boolean> {
    try {
      const success = await deleteTaskTypeFromData(taskTypeId, useSupabase);
      if (success) {
        this.taskTypes = this.taskTypes.filter(taskType => taskType.id !== taskTypeId);
        this.notifyListeners();
      }
      return success;
    } catch (error) {
      logger.error('Error deleting task type:', error);
      return false;
    }
  }

  // Refresh task types from data source
  async refreshTaskTypes(userId?: string, useSupabase = false): Promise<TaskType[]> {
    try {
      this.taskTypes = await getTaskTypesFromData(userId, useSupabase);
      this.notifyListeners();
      return this.taskTypes;
    } catch (error) {
      logger.error('Error refreshing task types:', error);
      this.taskTypes = [];
      return this.taskTypes;
    }
  }

  // Reset service (clear data and listeners)
  reset(): void {
    this.taskTypes = [];
    this.isInitialized = false;
    this.notifyListeners();
  }
}

// Export singleton instance
const taskTypeService = new TaskTypeService();
export default taskTypeService;