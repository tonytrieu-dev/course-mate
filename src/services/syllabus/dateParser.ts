/**
 * Date Parser Module - Handles lab schedule and due date extraction from syllabi
 * Extracted from syllabusTaskGenerationService.ts for better maintainability
 */

import { logger } from '../../utils/logger';
import type { GeneratedTask } from './aiAnalysis';

/**
 * Lab schedule entry interface
 */
export interface LabScheduleEntry {
  title: string;
  date: string;
}

/**
 * Enhanced lab tasks with manual date parsing from syllabus content
 */
export async function enhanceLabTasksWithManualDateParsing(
  tasks: GeneratedTask[], 
  classId: string
): Promise<GeneratedTask[]> {
  logger.info('📅 DATE PARSING: Starting lab task enhancement with manual parsing', {
    totalTasks: tasks.length,
    labTasks: tasks.filter(t => t.taskType?.toLowerCase() === 'lab').length,
    classId
  });

  try {
    // Get lab schedule from document chunks (if available)
    const labSchedule = await parseLabScheduleFromDocumentChunks(classId);
    
    if (labSchedule.length === 0) {
      logger.warn('📅 DATE PARSING: No lab schedule found in document chunks', { classId });
      return tasks;
    }

    logger.info('📅 DATE PARSING: Found lab schedule from document chunks', {
      scheduleEntries: labSchedule.length,
      schedule: labSchedule.map(entry => ({ title: entry.title, date: entry.date }))
    });

    // Enhance lab tasks with the schedule
    const enhancedTasks = tasks.map(task => {
      if (task.taskType?.toLowerCase() !== 'lab') {
        return task;
      }

      // Find matching lab session
      const matchingSession = findMatchingLabSession(task, labSchedule);
      if (matchingSession) {
        logger.info('📅 DATE PARSING: Enhanced lab task with manual date parsing', {
          originalTask: task.title,
          originalDueDate: task.dueDate,
          matchingSession: matchingSession.title,
          enhancedDueDate: matchingSession.date
        });

        return {
          ...task,
          dueDate: matchingSession.date,
          sessionDate: matchingSession.date
        };
      }

      return task;
    });

    const enhancedLabCount = enhancedTasks.filter(t => 
      t.taskType?.toLowerCase() === 'lab' && t.dueDate
    ).length;

    logger.info('📅 DATE PARSING: Completed lab task enhancement', {
      totalLabTasks: tasks.filter(t => t.taskType?.toLowerCase() === 'lab').length,
      enhancedLabTasks: enhancedLabCount,
      enhancementRate: `${((enhancedLabCount / Math.max(tasks.filter(t => t.taskType?.toLowerCase() === 'lab').length, 1)) * 100).toFixed(1)}%`
    });

    return enhancedTasks;

  } catch (error) {
    logger.error('📅 DATE PARSING: Error in lab task enhancement', {
      error: error instanceof Error ? error.message : 'Unknown error',
      classId
    });
    return tasks; // Return original tasks if enhancement fails
  }
}

/**
 * Parse lab schedule from document chunks (placeholder for now)
 */
export async function parseLabScheduleFromDocumentChunks(classId: string): Promise<LabScheduleEntry[]> {
  // This is a placeholder - in the original implementation, this would fetch
  // document chunks from the database and parse them for lab schedules
  logger.debug('📅 DATE PARSING: parseLabScheduleFromDocumentChunks placeholder called', { classId });
  return [];
}

/**
 * Parse lab schedule from syllabus content using multiple parsing strategies
 */
export function parseLabScheduleFromContent(
  syllabusContent: string, 
  currentYear: number = new Date().getFullYear()
): LabScheduleEntry[] {
  logger.info('📅 DATE PARSING: Starting comprehensive lab schedule parsing', {
    contentLength: syllabusContent.length,
    currentYear
  });

  try {
    const lines = syllabusContent.split('\n').map(line => line.trim());
    
    // Three-tier parsing approach
    const directMatches = parseDirectLineMatches(lines, currentYear);
    const wordAssociationMatches = parseLabsWithWordAssociation(syllabusContent, currentYear);
    const regexMatches = parseLabsWithComprehensiveRegex(syllabusContent, currentYear);
    
    // Merge and deduplicate results
    const mergedSchedule = mergeLabSchedules(
      directMatches, 
      wordAssociationMatches, 
      regexMatches
    );
    
    const finalSchedule = deduplicateAndSortLabs(mergedSchedule);
    
    logger.info('📅 DATE PARSING: Completed comprehensive lab schedule parsing', {
      directMatches: directMatches.length,
      wordAssociationMatches: wordAssociationMatches.length,  
      regexMatches: regexMatches.length,
      finalSchedule: finalSchedule.length,
      schedule: finalSchedule
    });

    return finalSchedule;

  } catch (error) {
    logger.error('📅 DATE PARSING: Error in lab schedule parsing', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * Parse labs using direct line matching (most reliable)
 */
export function parseDirectLineMatches(lines: string[], currentYear: number): LabScheduleEntry[] {
  logger.debug('📅 PARSING STRATEGY 1: Starting direct line matches');
  
  const schedule: LabScheduleEntry[] = [];
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // Look for lines containing both date patterns and "lab"
    if (lineLower.includes('lab') && /\d+\/\d+/.test(line)) {
      // Extract date patterns from the line
      const dateMatches = line.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g);
      const labMatches = line.match(/lab\s*(\d+|[a-z]|\w+)/gi);
      
      if (dateMatches && labMatches) {
        for (let i = 0; i < Math.min(dateMatches.length, labMatches.length); i++) {
          const dateStr = dateMatches[i];
          const labTitle = labMatches[i];
          const convertedDate = convertDateToISO(dateStr, currentYear);
          
          if (convertedDate) {
            schedule.push({
              title: labTitle.trim(),
              date: convertedDate
            });
          }
        }
      }
    }
  }
  
  logger.debug('📅 PARSING STRATEGY 1: Direct line matches completed', {
    matches: schedule.length
  });
  
  return schedule;
}

/**
 * Parse labs using word association (looks for dates near "lab" mentions)  
 */
export function parseLabsWithWordAssociation(syllabusContent: string, currentYear: number): LabScheduleEntry[] {
  logger.debug('📅 PARSING STRATEGY 2: Starting word association parsing');
  
  const schedule: LabScheduleEntry[] = [];
  const words = syllabusContent.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    
    if (word.includes('lab')) {
      // Look for dates in nearby words (within 100 characters before this lab mention)
      const startIndex = Math.max(0, i - 15); // ~15 words = ~100 chars
      const endIndex = Math.min(words.length, i + 5);
      const nearbyWords = words.slice(startIndex, endIndex);
      const nearbyText = nearbyWords.join(' ');
      
      // Find date patterns in nearby text
      const dateMatches = nearbyText.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g);
      if (dateMatches) {
        // Use the closest date (prefer dates that appear BEFORE the lab mention)
        const bestDateMatch = dateMatches[0];
        const convertedDate = convertDateToISO(bestDateMatch, currentYear);
        
        if (convertedDate) {
          // Extract lab identifier
          const labMatch = words[i].match(/lab\s*(\d+|[a-z]|\w+)/i);
          const labTitle = labMatch ? labMatch[0] : `Lab ${words[i]}`;
          
          schedule.push({
            title: labTitle.trim(),
            date: convertedDate
          });
        }
      }
    }
  }
  
  logger.debug('📅 PARSING STRATEGY 2: Word association parsing completed', {
    matches: schedule.length
  });
  
  return schedule;
}

/**
 * Parse labs using comprehensive regex patterns (fallback method)
 */
export function parseLabsWithComprehensiveRegex(syllabusContent: string, currentYear: number): LabScheduleEntry[] {
  logger.debug('📅 PARSING STRATEGY 3: Starting comprehensive regex parsing');
  
  const schedule: LabScheduleEntry[] = [];
  
  // Pattern: "Lab X - MM/DD" or "Lab X: MM/DD"
  const labDatePattern = /lab\s*(\d+|[a-z]+)[\s\-:]*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi;
  const matches = Array.from(syllabusContent.matchAll(labDatePattern));
  
  for (const match of matches) {
    const labTitle = `Lab ${match[1]}`;
    const dateStr = match[2];
    const convertedDate = convertDateToISO(dateStr, currentYear);
    
    if (convertedDate) {
      schedule.push({
        title: labTitle,
        date: convertedDate
      });
    }
  }
  
  logger.debug('📅 PARSING STRATEGY 3: Comprehensive regex parsing completed', {
    matches: schedule.length
  });
  
  return schedule;
}

/**
 * Merge multiple lab schedules with intelligent conflict resolution
 */
export function mergeLabSchedules(
  ...schedules: LabScheduleEntry[][]
): LabScheduleEntry[] {
  logger.debug('📅 DATE PARSING: Merging lab schedules', {
    scheduleCount: schedules.length,
    totalEntries: schedules.reduce((sum, schedule) => sum + schedule.length, 0)
  });
  
  const merged: LabScheduleEntry[] = [];
  
  // Combine all schedules
  for (const schedule of schedules) {
    merged.push(...schedule);
  }
  
  return merged;
}

/**
 * Remove duplicates and sort lab schedule entries
 */
export function deduplicateAndSortLabs(schedule: LabScheduleEntry[]): LabScheduleEntry[] {
  logger.debug('📅 DATE PARSING: Deduplicating and sorting labs', {
    inputEntries: schedule.length
  });
  
  // Use Map to deduplicate by title
  const uniqueMap = new Map<string, LabScheduleEntry>();
  
  for (const entry of schedule) {
    const normalizedTitle = entry.title.toLowerCase().replace(/\s+/g, '');
    
    if (!uniqueMap.has(normalizedTitle) || 
        new Date(entry.date) > new Date(uniqueMap.get(normalizedTitle)!.date)) {
      // Keep the entry with the later date if there are duplicates
      uniqueMap.set(normalizedTitle, entry);
    }
  }
  
  const deduplicatedSchedule = Array.from(uniqueMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  logger.debug('📅 DATE PARSING: Deduplication and sorting completed', {
    inputEntries: schedule.length,
    outputEntries: deduplicatedSchedule.length,
    duplicatesRemoved: schedule.length - deduplicatedSchedule.length
  });
  
  return deduplicatedSchedule;
}

/**
 * Convert date string to ISO format (YYYY-MM-DD)
 */
export function convertDateToISO(dateString: string, currentYear?: number): string | null {
  try {
    const year = currentYear || new Date().getFullYear();
    
    // Handle MM/DD or MM/DD/YY or MM/DD/YYYY formats
    const parts = dateString.split('/');
    if (parts.length < 2) return null;
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let yearToUse = year;
    
    if (parts.length === 3) {
      const yearPart = parseInt(parts[2], 10);
      if (yearPart < 100) {
        // Convert 2-digit year to 4-digit (assume 20xx)
        yearToUse = 2000 + yearPart;
      } else {
        yearToUse = yearPart;
      }
    }
    
    // Validate month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    
    // Create date and format as ISO string
    const date = new Date(yearToUse, month - 1, day);
    return date.toISOString().split('T')[0];
    
  } catch (error) {
    logger.warn('📅 DATE PARSING: Error converting date to ISO', {
      dateString,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Find matching lab session for a generated task
 */
export function findMatchingLabSession(
  generatedTask: GeneratedTask,
  labSchedule: LabScheduleEntry[]
): LabScheduleEntry | null {
  const taskTitle = generatedTask.title.toLowerCase();
  
  // Try to extract lab number/identifier from task title
  const labMatch = taskTitle.match(/lab\s*(\d+|[a-z]+)/i);
  if (!labMatch) return null;
  
  const labId = labMatch[1].toLowerCase();
  
  // Find matching entry in schedule
  for (const entry of labSchedule) {
    const entryTitle = entry.title.toLowerCase();
    const entryMatch = entryTitle.match(/lab\s*(\d+|[a-z]+)/i);
    
    if (entryMatch && entryMatch[1].toLowerCase() === labId) {
      return entry;
    }
  }
  
  return null;
}