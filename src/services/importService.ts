import type {
  Task,
  Class,
  TaskType,
  TaskInsert,
  ClassInsert,
  TaskTypeInsert
} from '../types/database';
import type { ExportData } from './exportService';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { generateUniqueId } from '../utils/idHelpers';
import { getCurrentUser } from './authService';
import { addTask } from './task/taskOperations';
import { addClass } from './class/classOperations';
import { addTaskType } from './taskType/taskTypeOperations';
import { getClasses } from './class/classOperations';
import { getTaskTypes } from './taskType/taskTypeOperations';
import { supabase } from './supabaseClient';

// Import data types
export interface ImportData {
  tasks: Task[];
  classes: Class[];
  taskTypes: TaskType[];
  grades?: any[];
  assignments?: any[];
  studySessions?: any[];
}

export interface ImportOptions {
  format: 'csv' | 'ics';
  preview?: boolean;
  skipDuplicates?: boolean;
  conflictResolution?: 'skip' | 'overwrite' | 'merge' | 'prompt';
  validateData?: boolean;
  classMapping?: Record<string, string>; // Map imported class names to existing class IDs
  taskTypeMapping?: Record<string, string>; // Map imported task types to existing type IDs
}

export interface ImportProgress {
  step: string;
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  conflicts: ImportConflict[];
}

export interface ImportSummary {
  totalProcessed: number;
  imported: {
    tasks: number;
    classes: number;
    taskTypes: number;
    grades: number;
    studySessions: number;
  };
  skipped: {
    tasks: number;
    classes: number;
    taskTypes: number;
    duplicates: number;
  };
  errors: number;
}

export interface ImportError {
  type: 'validation' | 'database' | 'conflict' | 'format';
  item: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ImportConflict {
  type: 'task' | 'class' | 'taskType';
  existing: any;
  imported: any;
  field: string;
  suggestedResolution: 'skip' | 'overwrite' | 'merge';
}

export interface ImportPreview {
  valid: boolean;
  data: ImportData;
  validation: ValidationResult;
  conflicts: ImportConflict[];
  summary: {
    tasks: number;
    classes: number;
    taskTypes: number;
    estimatedImportTime: number; // seconds
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

/**
 * Main import service class
 */
export class ImportService {
  private static instance: ImportService;
  
  static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  /**
   * Secure server-side file validation
   */
  private async validateFileSecurely(
    file: File,
    format: 'csv' | 'ics'
  ): Promise<{ content: string; warnings: string[] }> {
    try {
      // Convert file to base64
      const fileContent = await this.readFileAsBase64(file);
      
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required for secure import');
      }

      // Send to secure validation endpoint
      const { data, error } = await supabase.functions.invoke('secure-import', {
        body: {
          file: fileContent,
          filename: file.name,
          contentType: file.type,
          format: format
        }
      });

      if (error) {
        throw new Error(error.message || 'Server-side validation failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Security validation failed');
      }

      return {
        content: data.content,
        warnings: data.warnings || []
      };
    } catch (error) {
      logger.error('Secure file validation failed', error);
      throw new Error(`Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import tasks from CSV file
   */
  async importTasksCSV(
    file: File,
    options: ImportOptions = { format: 'csv' },
    onProgress?: ImportProgressCallback
  ): Promise<ImportResult> {
    try {
      onProgress?.({ step: 'Security Check', progress: 10, message: 'Validating file security...' });

      // Secure server-side validation
      const { content: fileContent, warnings } = await this.validateFileSecurely(file, 'csv');
      
      if (warnings.length > 0) {
        logger.warn('CSV import warnings', warnings);
      }

      onProgress?.({ step: 'Parsing CSV', progress: 20, message: 'Parsing CSV file...' });

      const csvData = this.parseCSV(fileContent);

      if (csvData.length === 0) {
        throw new Error('CSV file appears to be empty or invalid');
      }

      onProgress?.({ step: 'Converting', progress: 30, message: 'Converting CSV data to tasks...' });

      // Convert CSV rows to tasks
      const tasks = await this.convertCSVToTasks(csvData, options);

      onProgress?.({ step: 'Validating', progress: 50, message: 'Validating task data...' });

      // Validate converted tasks
      const validation = this.validateTasks(tasks);
      if (!validation.isValid && !options.preview) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      if (options.preview) {
        return {
          success: true,
          summary: this.createImportSummary({ tasks, classes: [], taskTypes: [] }, tasks.length, 0, 0, 0, 0),
          errors: validation.errors,
          conflicts: []
        };
      }

      onProgress?.({ step: 'Importing', progress: 70, message: 'Importing tasks...' });

      // Import the tasks
      let imported = 0;
      let skipped = 0;
      const errors: ImportError[] = [];

      for (let i = 0; i < tasks.length; i++) {
        try {
          await addTask(tasks[i]);
          imported++;
        } catch (error) {
          skipped++;
          errors.push({
            type: 'database',
            item: `Task ${i + 1}: ${tasks[i].title}`,
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium'
          });
        }

        onProgress?.({
          step: 'Importing Tasks',
          progress: 70 + Math.floor((i / tasks.length) * 25),
          message: `Imported ${imported} of ${tasks.length} tasks...`,
          processed: i + 1,
          total: tasks.length
        });
      }

      onProgress?.({ step: 'Complete', progress: 100, message: `Import complete! ${imported} tasks imported.` });

      return {
        success: true,
        summary: this.createImportSummary({ tasks, classes: [], taskTypes: [] }, imported, 0, 0, skipped, 0),
        errors,
        conflicts: []
      };
    } catch (error) {
      logger.error('CSV tasks import failed', error);
      throw errorHandler.handle(error as Error, 'importTasksCSV');
    }
  }

  /**
   * Import calendar from ICS file
   */
  async importCalendarICS(
    file: File,
    options: ImportOptions = { format: 'ics' },
    onProgress?: ImportProgressCallback
  ): Promise<ImportResult> {
    try {
      onProgress?.({ step: 'Security Check', progress: 10, message: 'Validating file security...' });

      // Secure server-side validation
      const { content: fileContent, warnings } = await this.validateFileSecurely(file, 'ics');
      
      if (warnings.length > 0) {
        logger.warn('ICS import warnings', warnings);
      }

      onProgress?.({ step: 'Parsing ICS', progress: 20, message: 'Parsing ICS calendar file...' });

      const events = this.parseICS(fileContent);

      onProgress?.({ step: 'Converting', progress: 40, message: 'Converting calendar events to tasks...' });

      // Convert ICS events to tasks
      const tasks = await this.convertICSToTasks(events, options);

      onProgress?.({ step: 'Validating', progress: 60, message: 'Validating imported tasks...' });

      const validation = this.validateTasks(tasks);
      if (!validation.isValid && !options.preview) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      if (options.preview) {
        return {
          success: true,
          summary: this.createImportSummary({ tasks, classes: [], taskTypes: [] }, tasks.length, 0, 0, 0, 0),
          errors: validation.errors,
          conflicts: []
        };
      }

      onProgress?.({ step: 'Importing', progress: 80, message: 'Importing calendar tasks...' });

      // Import the tasks
      let imported = 0;
      let skipped = 0;
      const errors: ImportError[] = [];

      for (const task of tasks) {
        try {
          await addTask(task);
          imported++;
        } catch (error) {
          skipped++;
          errors.push({
            type: 'database',
            item: `Task: ${task.title}`,
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium'
          });
        }
      }

      onProgress?.({ step: 'Complete', progress: 100, message: `Calendar import complete! ${imported} events imported.` });

      return {
        success: true,
        summary: this.createImportSummary({ tasks, classes: [], taskTypes: [] }, imported, 0, 0, skipped, 0),
        errors,
        conflicts: []
      };
    } catch (error) {
      logger.error('ICS calendar import failed', error);
      throw errorHandler.handle(error as Error, 'importCalendarICS');
    }
  }

  /**
   * Preview import without actually importing data
   */
  async previewImport(
    file: File,
    options: ImportOptions
  ): Promise<ImportPreview> {
    const previewOptions = { ...options, preview: true };
    
    try {
      let result: ImportResult;
      
      switch (options.format) {
        case 'csv':
          result = await this.importTasksCSV(file, previewOptions);
          break;
        case 'ics':
          result = await this.importCalendarICS(file, previewOptions);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      const fileContent = await this.readFileContent(file);
      let data: ImportData;

      data = {
        tasks: [], // Will be populated by the specific parsers
        classes: [],
        taskTypes: []
      };

      return {
        valid: result.success && result.errors.length === 0,
        data,
        validation: {
          isValid: result.success,
          errors: result.errors.filter(e => e.severity === 'high'),
          warnings: result.errors.filter(e => e.severity !== 'high')
        },
        conflicts: result.conflicts,
        summary: {
          tasks: result.summary.imported.tasks + result.summary.skipped.tasks,
          classes: result.summary.imported.classes + result.summary.skipped.classes,
          taskTypes: result.summary.imported.taskTypes + result.summary.skipped.taskTypes,
          estimatedImportTime: Math.ceil((result.summary.totalProcessed * 0.1)) // 100ms per item estimate
        }
      };
    } catch (error) {
      logger.error('Import preview failed', error);
      throw errorHandler.handle(error as Error, 'previewImport');
    }
  }

  /**
   * Private helper methods
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1]; // Remove data:xxx;base64, prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file as base64'));
      reader.readAsDataURL(file);
    });
  }


  private validateTask(task: any, itemName: string): ImportError[] {
    const errors: ImportError[] = [];

    if (!task.title || typeof task.title !== 'string') {
      errors.push({
        type: 'validation',
        item: itemName,
        field: 'title',
        message: 'Task title is required and must be a string',
        severity: 'high'
      });
    }

    if (!task.dueDate && !task.due_date) {
      errors.push({
        type: 'validation',
        item: itemName,
        field: 'dueDate',
        message: 'Task due date is required',
        severity: 'high'
      });
    } else {
      const dueDate = new Date(task.dueDate || task.due_date);
      if (isNaN(dueDate.getTime())) {
        errors.push({
          type: 'validation',
          item: itemName,
          field: 'dueDate',
          message: 'Invalid due date format',
          severity: 'high'
        });
      }
    }

    return errors;
  }

  private validateTasks(tasks: TaskInsert[]): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const taskErrors = this.validateTask(tasks[i], `Task ${i + 1}`);
      errors.push(...taskErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }



  private parseCSV(content: string): string[][] {
    const lines = content.split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - could be enhanced for more complex cases
        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        result.push(cells);
      }
    }
    
    return result;
  }

  private async convertCSVToTasks(csvData: string[][], options: ImportOptions): Promise<TaskInsert[]> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const headers = csvData[0];
    const rows = csvData.slice(1);
    
    // Map CSV columns to task fields
    const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('name'));
    const dueDateIndex = headers.findIndex(h => h.toLowerCase().includes('due'));
    const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
    const classIndex = headers.findIndex(h => h.toLowerCase().includes('class') || h.toLowerCase().includes('course'));
    
    if (titleIndex === -1 || dueDateIndex === -1) {
      throw new Error('CSV must contain at least Title and Due Date columns');
    }

    const tasks: TaskInsert[] = [];
    
    for (const row of rows) {
      if (row.length > titleIndex && row[titleIndex]) {
        const task: TaskInsert = {
          title: row[titleIndex],
          dueDate: row[dueDateIndex],
          completed: false,
          priority: 'medium',
          type: 'default', // TODO: Map to actual task type
          user_id: user.id
        };
        
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  private parseICS(content: string): any[] {
    const events: any[] = [];
    const lines = content.split('\n');
    let currentEvent: any = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent && trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':');
        
        // Handle common ICS properties
        switch (key) {
          case 'SUMMARY':
            currentEvent.title = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n');
            break;
          case 'DTSTART':
          case 'DTSTART;VALUE=DATE':
            currentEvent.startDate = value;
            break;
          case 'DTEND':
          case 'DTEND;VALUE=DATE':
            currentEvent.endDate = value;
            break;
          case 'LOCATION':
            currentEvent.location = value;
            break;
        }
      }
    }
    
    return events;
  }

  private async convertICSToTasks(events: any[], options: ImportOptions): Promise<TaskInsert[]> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const tasks: TaskInsert[] = [];
    
    for (const event of events) {
      if (event.title) {
        const dueDate = event.startDate || event.endDate;
        
        const task: TaskInsert = {
          title: event.title,
          dueDate: this.parseICSDate(dueDate),
          completed: false,
          priority: 'medium',
          type: 'default', // TODO: Map to actual task type
          user_id: user.id
        };
        
        tasks.push(task);
      }
    }
    
    return tasks;
  }

  private parseICSDate(icsDate: string): string {
    if (!icsDate) return new Date().toISOString();
    
    // Handle different ICS date formats
    let date: Date;
    
    if (icsDate.includes('T')) {
      // DateTime format: 20231201T140000Z
      const cleanDate = icsDate.replace(/[TZ]/g, '');
      const year = parseInt(cleanDate.substr(0, 4));
      const month = parseInt(cleanDate.substr(4, 2)) - 1;
      const day = parseInt(cleanDate.substr(6, 2));
      const hour = parseInt(cleanDate.substr(8, 2)) || 0;
      const minute = parseInt(cleanDate.substr(10, 2)) || 0;
      
      date = new Date(year, month, day, hour, minute);
    } else {
      // Date only format: 20231201
      const year = parseInt(icsDate.substr(0, 4));
      const month = parseInt(icsDate.substr(4, 2)) - 1;
      const day = parseInt(icsDate.substr(6, 2));
      
      date = new Date(year, month, day);
    }
    
    return date.toISOString();
  }

  private createImportSummary(
    data: any,
    importedTasks: number,
    importedClasses: number,
    importedTaskTypes: number,
    skippedItems: number,
    errorCount: number
  ): ImportSummary {
    const totalTasks = data.tasks?.length || 0;
    const totalClasses = data.classes?.length || 0;
    const totalTaskTypes = data.taskTypes?.length || 0;
    
    return {
      totalProcessed: totalTasks + totalClasses + totalTaskTypes,
      imported: {
        tasks: importedTasks,
        classes: importedClasses,
        taskTypes: importedTaskTypes,
        grades: 0, // TODO: Implement when grades are available
        studySessions: 0 // TODO: Implement when study sessions are available
      },
      skipped: {
        tasks: totalTasks - importedTasks,
        classes: totalClasses - importedClasses,
        taskTypes: totalTaskTypes - importedTaskTypes,
        duplicates: skippedItems
      },
      errors: errorCount
    };
  }
}

// Export singleton instance
export const importService = ImportService.getInstance();