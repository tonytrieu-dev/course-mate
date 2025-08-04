import type { Task, Class, TaskType } from '../types/database';
import { addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { logger } from '../utils/logger';

// Filter criteria interfaces
export interface FilterCriteria {
  searchText?: string;
  classIds?: string[];
  taskTypeIds?: string[];
  completionStatus?: 'all' | 'completed' | 'incomplete';
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  gradeWeight?: {
    min?: number;
    max?: number;
  };
  priority?: 'high' | 'medium' | 'low' | 'all';
}

// Academic preset filter definitions
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: FilterCriteria;
}

// Search result with relevance scoring
export interface SearchResult {
  task: Task;
  relevanceScore: number;
  matchedFields: string[];
}

// Filter service class
export class FilterService {
  private static readonly STORAGE_KEY = 'schedulebud_saved_filters';
  
  /**
   * Get predefined academic filter presets
   */
  static getAcademicPresets(): FilterPreset[] {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    return [
      {
        id: 'due-this-week',
        name: 'Due This Week',
        description: 'Tasks due within the current week',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        criteria: {
          completionStatus: 'incomplete',
          dueDateRange: {
            start: weekStart,
            end: weekEnd
          }
        }
      },
      {
        id: 'high-priority',
        name: 'High Priority',
        description: 'Important tasks and high-weight assignments',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
        criteria: {
          completionStatus: 'incomplete',
          gradeWeight: {
            min: 15
          }
        }
      },
      {
        id: 'overdue',
        name: 'Overdue',
        description: 'Tasks past their due date',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        criteria: {
          completionStatus: 'incomplete',
          dueDateRange: {
            end: today
          }
        }
      },
      {
        id: 'upcoming-exams',
        name: 'Upcoming Exams',
        description: 'Exams and tests in the next two weeks',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        criteria: {
          completionStatus: 'incomplete',
          dueDateRange: {
            start: today,
            end: addDays(today, 14)
          }
        }
      },
      {
        id: 'major-projects',
        name: 'Major Projects',
        description: 'High-weight projects and assignments',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
        criteria: {
          completionStatus: 'incomplete',
          gradeWeight: {
            min: 20
          }
        }
      },
      {
        id: 'completed-this-week',
        name: 'Completed This Week',
        description: 'Tasks completed in the current week',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        criteria: {
          completionStatus: 'completed',
          dueDateRange: {
            start: weekStart,
            end: weekEnd
          }
        }
      }
    ];
  }

  /**
   * Filter tasks based on criteria
   */
  static filterTasks(tasks: Task[], criteria: FilterCriteria, classes: Class[] = [], taskTypes: TaskType[] = []): Task[] {
    try {
      return tasks.filter(task => {
        // Search text filter
        if (criteria.searchText && !this.matchesSearchText(task, criteria.searchText, classes, taskTypes)) {
          return false;
        }

        // Class filter
        if (criteria.classIds && criteria.classIds.length > 0 && !criteria.classIds.includes(task.class || '')) {
          return false;
        }

        // Task type filter
        if (criteria.taskTypeIds && criteria.taskTypeIds.length > 0 && !criteria.taskTypeIds.includes(task.type || '')) {
          return false;
        }

        // Completion status filter
        if (criteria.completionStatus && criteria.completionStatus !== 'all') {
          const isCompleted = task.completed;
          if (criteria.completionStatus === 'completed' && !isCompleted) return false;
          if (criteria.completionStatus === 'incomplete' && isCompleted) return false;
        }

        // Due date range filter
        if (criteria.dueDateRange && (task.dueDate || task.date)) {
          const dueDateStr = task.dueDate || task.date;
          if (!dueDateStr) return true;
          
          const taskDueDate = typeof dueDateStr === 'string' ? parseISO(dueDateStr) : dueDateStr;
          
          if (criteria.dueDateRange.start && taskDueDate < criteria.dueDateRange.start) return false;
          if (criteria.dueDateRange.end && taskDueDate > criteria.dueDateRange.end) return false;
        }

        // Grade weight filter - Note: This field doesn't exist in current schema, skip for now
        // if (criteria.gradeWeight && task.grade_weight !== undefined) {
        //   if (criteria.gradeWeight.min !== undefined && task.grade_weight < criteria.gradeWeight.min) return false;
        //   if (criteria.gradeWeight.max !== undefined && task.grade_weight > criteria.gradeWeight.max) return false;
        // }

        return true;
      });
    } catch (error) {
      logger.error('Error filtering tasks', error);
      return tasks; // Return unfiltered tasks on error
    }
  }

  /**
   * Perform full-text search across tasks with relevance scoring
   */
  static searchTasks(tasks: Task[], searchText: string, classes: Class[] = [], taskTypes: TaskType[] = []): SearchResult[] {
    if (!searchText.trim()) {
      return tasks.map(task => ({ task, relevanceScore: 1, matchedFields: [] }));
    }

    const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 1);
    const results: SearchResult[] = [];

    for (const task of tasks) {
      const searchResult = this.calculateRelevanceScore(task, searchTerms, classes, taskTypes);
      if (searchResult.relevanceScore > 0) {
        results.push(searchResult);
      }
    }

    // Sort by relevance score (highest first)
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Check if task matches search text
   */
  private static matchesSearchText(task: Task, searchText: string, classes: Class[], taskTypes: TaskType[]): boolean {
    const searchLower = searchText.toLowerCase();
    const searchTerms = searchLower.split(' ').filter(term => term.length > 1);
    
    if (searchTerms.length === 0) return true;

    // Get related class and task type
    const taskClass = classes.find(c => c.id === task.class);
    const taskType = taskTypes.find(t => t.id === task.type);

    // Fields to search (adapted to current schema)
    const searchableContent = [
      task.title,
      // task.description, // Not in current schema
      // task.notes, // Not in current schema
      taskClass?.name,
      // taskClass?.descriptive_name, // Not in current schema
      taskType?.name,
      // task.canvas_assignment_name // Not in current schema
    ].filter(Boolean).join(' ').toLowerCase();

    // Check if all search terms are found
    return searchTerms.every(term => searchableContent.includes(term));
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevanceScore(task: Task, searchTerms: string[], classes: Class[], taskTypes: TaskType[]): SearchResult {
    let score = 0;
    const matchedFields: string[] = [];

    // Get related data
    const taskClass = classes.find(c => c.id === task.class);
    const taskType = taskTypes.find(t => t.id === task.type);

    // Title matches (highest weight)
    const titleMatches = this.countMatches(task.title || '', searchTerms);
    if (titleMatches > 0) {
      score += titleMatches * 10;
      matchedFields.push('title');
    }

    // Class name matches
    const classNameMatches = this.countMatches(taskClass?.name || '', searchTerms);
    if (classNameMatches > 0) {
      score += classNameMatches * 8;
      matchedFields.push('class');
    }

    // Task type matches
    const taskTypeMatches = this.countMatches(taskType?.name || '', searchTerms);
    if (taskTypeMatches > 0) {
      score += taskTypeMatches * 6;
      matchedFields.push('type');
    }

    // Note: Description, notes, and canvas assignment name are not in current schema
    // These can be added when the schema is extended

    return { task, relevanceScore: score, matchedFields };
  }

  /**
   * Count matches of search terms in text
   */
  private static countMatches(text: string, searchTerms: string[]): number {
    const textLower = text.toLowerCase();
    return searchTerms.reduce((count, term) => {
      const termCount = (textLower.match(new RegExp(term, 'g')) || []).length;
      return count + termCount;
    }, 0);
  }

  /**
   * Save custom filter preset
   */
  static saveFilterPreset(preset: FilterPreset): void {
    try {
      const savedFilters = this.getSavedFilterPresets();
      const existingIndex = savedFilters.findIndex(f => f.id === preset.id);
      
      if (existingIndex >= 0) {
        savedFilters[existingIndex] = preset;
      } else {
        savedFilters.push(preset);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedFilters));
      logger.info('Filter preset saved', { presetId: preset.id });
    } catch (error) {
      logger.error('Error saving filter preset', error);
    }
  }

  /**
   * Get saved filter presets from localStorage
   */
  static getSavedFilterPresets(): FilterPreset[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error('Error loading saved filter presets', error);
      return [];
    }
  }

  /**
   * Delete saved filter preset
   */
  static deleteFilterPreset(presetId: string): void {
    try {
      const savedFilters = this.getSavedFilterPresets();
      const filtered = savedFilters.filter(f => f.id !== presetId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      logger.info('Filter preset deleted', { presetId });
    } catch (error) {
      logger.error('Error deleting filter preset', error);
    }
  }

  /**
   * Get all available filter presets (academic + saved)
   */
  static getAllFilterPresets(): FilterPreset[] {
    return [...this.getAcademicPresets(), ...this.getSavedFilterPresets()];
  }

  /**
   * Create smart academic queries from natural language
   */
  static parseAcademicQuery(query: string, classes: Class[], taskTypes: TaskType[]): FilterCriteria | null {
    const queryLower = query.toLowerCase();
    const criteria: FilterCriteria = { searchText: query };

    try {
      // Due date patterns
      if (queryLower.includes('due this week') || queryLower.includes('this week')) {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        criteria.dueDateRange = { start: weekStart, end: weekEnd };
        criteria.completionStatus = 'incomplete';
      }

      if (queryLower.includes('overdue') || queryLower.includes('past due')) {
        criteria.dueDateRange = { end: new Date() };
        criteria.completionStatus = 'incomplete';
      }

      // Priority patterns
      if (queryLower.includes('high priority') || queryLower.includes('important')) {
        criteria.gradeWeight = { min: 15 };
      }

      // Completion patterns
      if (queryLower.includes('completed') || queryLower.includes('finished')) {
        criteria.completionStatus = 'completed';
      }

      if (queryLower.includes('incomplete') || queryLower.includes('unfinished')) {
        criteria.completionStatus = 'incomplete';
      }

      // Class patterns - find mentioned classes
      const mentionedClassIds: string[] = [];
      for (const cls of classes) {
        const classTerms = [cls.name].filter(Boolean).map(name => name.toLowerCase());
        if (classTerms.some(term => queryLower.includes(term))) {
          mentionedClassIds.push(cls.id);
        }
      }
      if (mentionedClassIds.length > 0) {
        criteria.classIds = mentionedClassIds;
      }

      // Task type patterns
      const mentionedTypeIds: string[] = [];
      for (const type of taskTypes) {
        if (queryLower.includes(type.name.toLowerCase())) {
          mentionedTypeIds.push(type.id);
        }
      }
      if (mentionedTypeIds.length > 0) {
        criteria.taskTypeIds = mentionedTypeIds;
      }

      return criteria;
    } catch (error) {
      logger.error('Error parsing academic query', error);
      return { searchText: query };
    }
  }
}

export default FilterService;