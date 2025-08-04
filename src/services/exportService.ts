import type {
  Task,
  Class,
  TaskType,
  Grade,
  Assignment,
  StudySession,
  NotificationSettings
} from '../types/database';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { getTasks } from './task/taskOperations';
import { getClasses } from './class/classOperations';
import { getTaskTypes } from './taskType/taskTypeOperations';
import { getCurrentUser } from './authService';

// Export data structure types
export interface ExportData {
  version: string;
  exportDate: string;
  userId: string;
  tasks: Task[];
  classes: Class[];
  taskTypes: TaskType[];
  grades?: Grade[];
  assignments?: Assignment[];
  studySessions?: StudySession[];
  settings?: NotificationSettings;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'ics' | 'pdf';
  includeCompleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  classIds?: string[];
  dataTypes?: ('tasks' | 'classes' | 'grades' | 'sessions')[];
}

export interface ExportProgress {
  step: string;
  progress: number; // 0-100
  message: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

// CSV export specific types
export interface CSVExportOptions extends ExportOptions {
  delimiter?: string;
  includeHeaders?: boolean;
}

// ICS export specific types
export interface ICSExportOptions extends ExportOptions {
  calendarName?: string;
  timezone?: string;
}

/**
 * Main export service class
 */
export class ExportService {
  private static instance: ExportService;
  
  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export data in JSON format (complete backup)
   */
  async exportJSON(
    options: ExportOptions = { format: 'json' },
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    try {
      onProgress?.({ step: 'Authenticating', progress: 10, message: 'Verifying user authentication...' });
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      onProgress?.({ step: 'Fetching Tasks', progress: 25, message: 'Loading tasks...' });
      const tasks = await this.getFilteredTasks(user.id, options);

      onProgress?.({ step: 'Fetching Classes', progress: 40, message: 'Loading classes...' });
      const classes = await getClasses(user.id, true);

      onProgress?.({ step: 'Fetching Task Types', progress: 55, message: 'Loading task types...' });
      const taskTypes = await getTaskTypes(user.id, true);

      onProgress?.({ step: 'Preparing Export', progress: 80, message: 'Preparing export data...' });

      const exportData: ExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        userId: user.id,
        tasks: tasks,
        classes: classes,
        taskTypes: taskTypes
      };

      // Add optional data if requested
      if (options.dataTypes?.includes('grades')) {
        // TODO: Add grades when grade service is available
        exportData.grades = [];
        exportData.assignments = [];
      }

      if (options.dataTypes?.includes('sessions')) {
        // TODO: Add study sessions when available
        exportData.studySessions = [];
      }

      onProgress?.({ step: 'Creating File', progress: 95, message: 'Creating download file...' });

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      onProgress?.({ step: 'Complete', progress: 100, message: 'Export complete!' });
      
      logger.info('JSON export completed', { 
        userId: user.id, 
        tasksCount: tasks.length,
        classesCount: classes.length 
      });

      return blob;
    } catch (error) {
      logger.error('JSON export failed', error);
      throw errorHandler.handle(error as Error, 'exportJSON');
    }
  }

  /**
   * Export grades in CSV format
   */
  async exportGradesCSV(
    options: CSVExportOptions = { format: 'csv' },
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    try {
      onProgress?.({ step: 'Authenticating', progress: 20, message: 'Verifying user authentication...' });
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      onProgress?.({ step: 'Fetching Data', progress: 50, message: 'Loading grade data...' });

      // Get classes and tasks for grade calculation
      const classes = await getClasses(user.id, true);
      const tasks = await this.getFilteredTasks(user.id, options);

      onProgress?.({ step: 'Processing Grades', progress: 75, message: 'Processing grade information...' });

      // Create CSV header
      const delimiter = options.delimiter || ',';
      const headers = [
        'Class',
        'Course Code',
        'Task Title',
        'Task Type',
        'Due Date',
        'Completed',
        'Grade',
        'Points',
        'Total Points',
        'Percentage'
      ];

      let csvContent = '';
      if (options.includeHeaders !== false) {
        csvContent += headers.join(delimiter) + '\n';
      }

      // Process tasks and create CSV rows
      for (const task of tasks) {
        const taskClass = classes.find(c => c.id === task.class);
        
        const row = [
          this.escapeCsvValue(taskClass?.name || 'Unassigned'),
          this.escapeCsvValue(''), // Course code not available in current schema
          this.escapeCsvValue(task.title),
          this.escapeCsvValue(task.type || ''), // Task type
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
          task.completed ? 'Yes' : 'No',
          '', // Grade - TODO: Get from grades table when available
          '', // Points earned
          '', // Total points
          ''  // Percentage
        ];

        csvContent += row.map(cell => this.escapeCsvValue(cell)).join(delimiter) + '\n';
      }

      onProgress?.({ step: 'Creating File', progress: 95, message: 'Creating CSV file...' });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      onProgress?.({ step: 'Complete', progress: 100, message: 'Grade export complete!' });

      logger.info('CSV grades export completed', { 
        userId: user.id, 
        tasksCount: tasks.length 
      });

      return blob;
    } catch (error) {
      logger.error('CSV grades export failed', error);
      throw errorHandler.handle(error as Error, 'exportGradesCSV');
    }
  }

  /**
   * Export academic calendar in ICS format
   */
  async exportCalendarICS(
    options: ICSExportOptions = { format: 'ics' },
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    try {
      onProgress?.({ step: 'Authenticating', progress: 15, message: 'Verifying user authentication...' });
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      onProgress?.({ step: 'Fetching Tasks', progress: 40, message: 'Loading tasks and assignments...' });

      const tasks = await this.getFilteredTasks(user.id, options);
      const classes = await getClasses(user.id, true);

      onProgress?.({ step: 'Creating Calendar', progress: 70, message: 'Generating calendar events...' });

      // ICS header
      const calendarName = options.calendarName || 'ScheduleBud Academic Calendar';
      const timezone = options.timezone || 'America/Los_Angeles';
      
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ScheduleBud//Academic Calendar//EN',
        `X-WR-CALNAME:${calendarName}`,
        `X-WR-TIMEZONE:${timezone}`,
        'CALSCALE:GREGORIAN'
      ].join('\r\n') + '\r\n';

      // Add timezone definition
      icsContent += [
        'BEGIN:VTIMEZONE',
        `TZID:${timezone}`,
        'BEGIN:STANDARD',
        'DTSTART:20201101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:PST',
        'TZOFFSETFROM:-0700',
        'TZOFFSETTO:-0800',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20210314T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:PDT',
        'TZOFFSETFROM:-0800',
        'TZOFFSETTO:-0700',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n') + '\r\n';

      // Convert tasks to calendar events
      for (const task of tasks) {
        const taskClass = classes.find(c => c.id === task.class);
        const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
        
        // Format dates for ICS (YYYYMMDDTHHMMSSZ)
        const dueDateFormatted = this.formatICSDate(dueDate);
        const createdFormatted = this.formatICSDate(new Date(task.created_at));
        
        icsContent += [
          'BEGIN:VEVENT',
          `UID:task-${task.id}@schedulebud.app`,
          `DTSTAMP:${createdFormatted}`,
          `DTSTART;VALUE=DATE:${dueDateFormatted.split('T')[0]}`,
          `SUMMARY:${this.escapeICSValue(task.title)}`,
          `DESCRIPTION:${this.escapeICSValue('')}`, // Description not available in current schema
          `LOCATION:${this.escapeICSValue(taskClass?.name || '')}`,
          `CATEGORIES:${this.escapeICSValue(task.type || '')}`,
          `STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`,
          'END:VEVENT'
        ].join('\r\n') + '\r\n';
      }

      // ICS footer
      icsContent += 'END:VCALENDAR\r\n';

      onProgress?.({ step: 'Creating File', progress: 95, message: 'Creating ICS file...' });

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });

      onProgress?.({ step: 'Complete', progress: 100, message: 'Calendar export complete!' });

      logger.info('ICS calendar export completed', { 
        userId: user.id, 
        eventsCount: tasks.length 
      });

      return blob;
    } catch (error) {
      logger.error('ICS calendar export failed', error);
      throw errorHandler.handle(error as Error, 'exportCalendarICS');
    }
  }

  /**
   * Export semester archive (JSON + metadata)
   */
  async exportSemesterArchive(
    semester: string,
    year: number,
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    try {
      const semesterOptions: ExportOptions = {
        format: 'json',
        startDate: new Date(year, semester === 'Spring' ? 0 : semester === 'Summer' ? 4 : 7, 1),
        endDate: new Date(year, semester === 'Spring' ? 4 : semester === 'Summer' ? 7 : 11, 31),
        dataTypes: ['tasks', 'classes', 'grades', 'sessions']
      };

      onProgress?.({ step: 'Archive Setup', progress: 5, message: `Creating ${semester} ${year} archive...` });

      const exportBlob = await this.exportJSON(semesterOptions, (progress) => {
        onProgress?.({ 
          ...progress, 
          progress: Math.floor(progress.progress * 0.9), // Scale to 90% for main export
          message: `Archive: ${progress.message}`
        });
      });

      onProgress?.({ step: 'Archive Complete', progress: 100, message: `${semester} ${year} archive ready!` });

      return exportBlob;
    } catch (error) {
      logger.error('Semester archive export failed', error);
      throw errorHandler.handle(error as Error, 'exportSemesterArchive');
    }
  }

  /**
   * Get filtered tasks based on export options
   */
  private async getFilteredTasks(userId: string, options: ExportOptions): Promise<Task[]> {
    const allTasks = await getTasks(userId, true);
    
    let filteredTasks = allTasks;

    // Filter by completion status
    if (options.includeCompleted === false) {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    // Filter by date range
    if (options.startDate || options.endDate) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return true; // Include tasks without due dates
        const taskDate = new Date(task.dueDate);
        
        if (options.startDate && taskDate < options.startDate) {
          return false;
        }
        
        if (options.endDate && taskDate > options.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Filter by class IDs
    if (options.classIds && options.classIds.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.class && options.classIds!.includes(task.class)
      );
    }

    return filteredTasks;
  }

  /**
   * Utility methods for format-specific escaping
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // Escape quotes and wrap in quotes if contains delimiter, quotes, or newlines
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    
    return value;
  }

  private escapeICSValue(value: string): string {
    if (!value) return '';
    
    return value
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  private formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
}

// Export utility functions
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  logger.info('File download initiated', { filename, size: blob.size });
};

export const generateExportFilename = (
  format: string,
  type: string,
  options?: { semester?: string; year?: number; timestamp?: boolean }
): string => {
  const timestamp = options?.timestamp !== false ? 
    new Date().toISOString().split('T')[0] : '';
  
  const semester = options?.semester && options?.year ? 
    `_${options.semester}_${options.year}` : '';
  
  const parts = ['schedulebud', type, semester, timestamp].filter(Boolean);
  return `${parts.join('_')}.${format}`;
};

// Export singleton instance
export const exportService = ExportService.getInstance();