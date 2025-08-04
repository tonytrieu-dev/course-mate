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
  format: 'json' | 'csv' | 'ics';
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
   * Import data from JSON file (complete data restore)
   */
  async importJSON(
    file: File,
    options: ImportOptions = { format: 'json' },
    onProgress?: ImportProgressCallback
  ): Promise<ImportResult> {
    try {
      onProgress?.({ step: 'Reading File', progress: 5, message: 'Reading import file...' });

      const fileContent = await this.readFileContent(file);
      let exportData: ExportData;

      try {
        exportData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid JSON format in import file');
      }

      onProgress?.({ step: 'Validating', progress: 15, message: 'Validating import data...' });

      // Validate the export data structure
      const validation = await this.validateExportData(exportData, options);
      if (!validation.isValid && !options.preview) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      onProgress?.({ step: 'Analyzing', progress: 25, message: 'Analyzing data for conflicts...' });

      // Check for conflicts with existing data
      const conflicts = await this.detectConflicts(exportData, options);

      if (options.preview) {
        return {
          success: true,
          summary: this.createImportSummary(exportData, 0, 0, 0, 0, 0),
          errors: validation.errors,
          conflicts
        };
      }

      onProgress?.({ step: 'Importing', progress: 40, message: 'Starting data import...' });

      // Perform the actual import
      const result = await this.performImport(exportData, options, onProgress);

      onProgress?.({ step: 'Complete', progress: 100, message: 'Import completed successfully!' });

      logger.info('JSON import completed', { 
        imported: result.summary.imported,
        skipped: result.summary.skipped,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      logger.error('JSON import failed', error);
      throw errorHandler.handle(error as Error, 'importJSON');
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
      onProgress?.({ step: 'Reading CSV', progress: 10, message: 'Parsing CSV file...' });

      const fileContent = await this.readFileContent(file);
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
      onProgress?.({ step: 'Reading ICS', progress: 10, message: 'Parsing ICS calendar file...' });

      const fileContent = await this.readFileContent(file);
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
        case 'json':
          result = await this.importJSON(file, previewOptions);
          break;
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

      if (options.format === 'json') {
        const exportData: ExportData = JSON.parse(fileContent);
        data = {
          tasks: exportData.tasks || [],
          classes: exportData.classes || [],
          taskTypes: exportData.taskTypes || []
        };
      } else {
        data = {
          tasks: [], // Will be populated by the specific parsers
          classes: [],
          taskTypes: []
        };
      }

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

  private async validateExportData(data: ExportData, options: ImportOptions): Promise<ValidationResult> {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];

    // Check version compatibility
    if (!data.version || data.version !== '1.0') {
      warnings.push({
        type: 'format',
        item: 'Export version',
        message: `Unknown export version: ${data.version}. Import may not work correctly.`,
        severity: 'medium'
      });
    }

    // Validate required fields
    if (!data.tasks || !Array.isArray(data.tasks)) {
      errors.push({
        type: 'format',
        item: 'Tasks data',
        message: 'Missing or invalid tasks data in export file',
        severity: 'high'
      });
    }

    if (!data.classes || !Array.isArray(data.classes)) {
      warnings.push({
        type: 'format',
        item: 'Classes data',
        message: 'Missing classes data in export file',
        severity: 'low'
      });
    }

    // Validate individual tasks
    if (data.tasks) {
      for (let i = 0; i < data.tasks.length; i++) {
        const task = data.tasks[i];
        const taskErrors = this.validateTask(task, `Task ${i + 1}`);
        errors.push(...taskErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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

  private async detectConflicts(data: ExportData, options: ImportOptions): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = [];
    const user = await getCurrentUser();
    
    if (!user) return conflicts;

    // Get existing data
    const existingClasses = await getClasses(user.id, true);
    const existingTaskTypes = await getTaskTypes(user.id, true);

    // Check for class name conflicts
    if (data.classes) {
      for (const importedClass of data.classes) {
        const existing = existingClasses.find(c => 
          c.name.toLowerCase() === importedClass.name.toLowerCase()
        );
        
        if (existing) {
          conflicts.push({
            type: 'class',
            existing,
            imported: importedClass,
            field: 'name',
            suggestedResolution: 'merge'
          });
        }
      }
    }

    // Check for task type conflicts
    if (data.taskTypes) {
      for (const importedType of data.taskTypes) {
        const existing = existingTaskTypes.find(t => 
          t.name.toLowerCase() === importedType.name.toLowerCase()
        );
        
        if (existing) {
          conflicts.push({
            type: 'taskType',
            existing,
            imported: importedType,
            field: 'name',
            suggestedResolution: 'merge'
          });
        }
      }
    }

    return conflicts;
  }

  private async performImport(
    data: ExportData,
    options: ImportOptions,
    onProgress?: ImportProgressCallback
  ): Promise<ImportResult> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    let totalSteps = 0;
    let currentStep = 0;
    const errors: ImportError[] = [];
    
    // Count total steps
    if (data.classes) totalSteps += data.classes.length;
    if (data.taskTypes) totalSteps += data.taskTypes.length;
    if (data.tasks) totalSteps += data.tasks.length;

    let importedClasses = 0;
    let importedTaskTypes = 0;
    let importedTasks = 0;
    let skippedItems = 0;

    // Import classes first
    if (data.classes) {
      onProgress?.({ step: 'Importing Classes', progress: 40, message: 'Importing classes...' });
      
      for (const classData of data.classes) {
        try {
          const classInsert: ClassInsert = {
            ...classData,
            user_id: user.id,
            id: undefined // Let database generate new ID
          };
          
          await addClass(classInsert);
          importedClasses++;
        } catch (error) {
          skippedItems++;
          errors.push({
            type: 'database',
            item: `Class: ${classData.name}`,
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium'
          });
        }
        
        currentStep++;
        onProgress?.({
          step: 'Importing Classes',
          progress: 40 + Math.floor((currentStep / totalSteps) * 30),
          message: `Imported ${importedClasses} classes...`,
          processed: currentStep,
          total: totalSteps
        });
      }
    }

    // Import task types
    if (data.taskTypes) {
      onProgress?.({ step: 'Importing Task Types', progress: 60, message: 'Importing task types...' });
      
      for (const typeData of data.taskTypes) {
        try {
          const typeInsert: TaskTypeInsert = {
            ...typeData,
            user_id: user.id,
            id: undefined // Let database generate new ID
          };
          
          await addTaskType(typeInsert);
          importedTaskTypes++;
        } catch (error) {
          skippedItems++;
          errors.push({
            type: 'database',
            item: `Task Type: ${typeData.name}`,
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium'
          });
        }
        
        currentStep++;
        onProgress?.({
          step: 'Importing Task Types',
          progress: 60 + Math.floor((currentStep / totalSteps) * 20),
          message: `Imported ${importedTaskTypes} task types...`,
          processed: currentStep,
          total: totalSteps
        });
      }
    }

    // Import tasks last (they depend on classes and task types)
    if (data.tasks) {
      onProgress?.({ step: 'Importing Tasks', progress: 80, message: 'Importing tasks...' });
      
      for (const taskData of data.tasks) {
        try {
          const taskInsert: TaskInsert = {
            ...taskData,
            user_id: user.id,
            id: undefined // Let database generate new ID
          };
          
          await addTask(taskInsert);
          importedTasks++;
        } catch (error) {
          skippedItems++;
          errors.push({
            type: 'database',
            item: `Task: ${taskData.title}`,
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'medium'
          });
        }
        
        currentStep++;
        onProgress?.({
          step: 'Importing Tasks',
          progress: 80 + Math.floor((currentStep / totalSteps) * 15),
          message: `Imported ${importedTasks} tasks...`,
          processed: currentStep,
          total: totalSteps
        });
      }
    }

    return {
      success: true,
      summary: this.createImportSummary(
        data,
        importedTasks,
        importedClasses,
        importedTaskTypes,
        skippedItems,
        errors.length
      ),
      errors,
      conflicts: []
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