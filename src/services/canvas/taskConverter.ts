import type { User } from '@supabase/supabase-js';
import type { TaskInsert } from '../../types/database';
import { addClass, getClasses } from '../class/classOperations';
import { getSettings } from '../settings/settingsOperations';
import { logger } from '../../utils/logger';
import { CanvasEvent } from './icsParser';
import { parseICSDate } from './icsParser';

/**
 * Converts technical class codes to user-friendly names
 * 
 * @param classCode - Technical class code from Canvas
 * @returns User-friendly class name
 */
export function generateUserFriendlyClassName(classCode: string): string {
  // Remove common prefixes and clean up codes
  const cleanCode = classCode.replace(/^(canvas|task)_?/i, '').toUpperCase();
  
  // Pattern matching for common course formats
  if (cleanCode.match(/^UGRD(\d+[A-Z]*)$/)) {
    const courseNum = cleanCode.replace('UGRD', '');
    return `Undergraduate Course ${courseNum}`;
  }
  
  if (cleanCode.match(/^[A-Z]{2,4}\d+[A-Z]*$/)) {
    // Format like EE123, CS100, MATH120
    const subject = cleanCode.match(/^[A-Z]{2,4}/)?.[0] || '';
    const number = cleanCode.replace(/^[A-Z]{2,4}/, '');
    
    // Common subject mappings
    const subjectNames: { [key: string]: string } = {
      'EE': 'Electrical Engineering',
      'CS': 'Computer Science',
      'MATH': 'Mathematics',
      'PHYS': 'Physics',
      'CHEM': 'Chemistry',
      'BIOL': 'Biology',
      'UGRD': 'Undergraduate',
      'ENGL': 'English',
      'HIST': 'History',
      'PSYC': 'Psychology',
      'ECON': 'Economics',
      'POLI': 'Political Science',
      'PHIL': 'Philosophy',
      'ANTH': 'Anthropology',
      'SOCI': 'Sociology'
    };
    
    const fullSubjectName = subjectNames[subject] || subject;
    return `${fullSubjectName} ${number}`;
  }
  
  // Fallback: capitalize and format nicely
  return cleanCode.replace(/([A-Z])(\d)/g, '$1 $2').replace(/_/g, ' ');
}

/**
 * Ensures a class exists, creating it if necessary
 * 
 * @param classCode - Class code to ensure exists
 * @param useSupabase - Whether to use Supabase storage
 * @param user - User object for permissions
 * @returns Promise resolving to class ID
 */
export async function ensureClassExists(classCode: string, useSupabase: boolean, user: User | null): Promise<string> {
  try {
    const userId = user?.id;
    const classes = await getClasses(userId, useSupabase);
    
    logger.debug(`[ensureClassExists] Looking for class "${classCode}" among ${classes.length} existing classes`);
    
    // Enhanced class matching - check multiple patterns
    const existingClass = classes.find(cls => {
      const classId = cls.id.toLowerCase();
      const className = cls.name.toLowerCase();
      const searchCode = classCode.toLowerCase();
      
      logger.debug(`[ensureClassExists] Checking class "${cls.name}" (id: ${cls.id}) against search code "${classCode}"`);
      
      // Direct ID match
      if (classId === searchCode) {
        logger.debug(`[ensureClassExists] Direct ID match found`);
        return true;
      }
      
      // Direct name match
      if (className === searchCode) {
        logger.debug(`[ensureClassExists] Direct name match found`);
        return true;
      }
      
      // Check if the class code matches common patterns
      // For example: "ugrd198g" should match "EE123" if that's what we're looking for
      // Convert Canvas codes to standard format for matching
      const standardizedCode = classCode.replace(/^ugrd/i, '').replace(/_/g, '');
      if (classId === standardizedCode.toLowerCase()) {
        logger.debug(`[ensureClassExists] Standardized code match found (${standardizedCode})`);
        return true;
      }
      if (className.replace(/\s/g, '').toLowerCase() === standardizedCode.toLowerCase()) {
        logger.debug(`[ensureClassExists] Standardized name match found (${standardizedCode})`);
        return true;
      }
      
      // Try to match against subject codes (e.g., EE123 matches EE 123)
      const subjectMatch = classCode.match(/([A-Z]+)(\d+)/i);
      if (subjectMatch) {
        const [, subject, number] = subjectMatch;
        const pattern = `${subject}${number}`.toLowerCase();
        if (classId === pattern) {
          logger.debug(`[ensureClassExists] Subject code ID match found (${pattern})`);
          return true;
        }
        if (className.replace(/\s/g, '').toLowerCase() === pattern) {
          logger.debug(`[ensureClassExists] Subject code name match found (${pattern})`);
          return true;
        }
      }
      
      // Additional check: reverse matching - check if existing class patterns match search code
      // E.g., if we have "EE123" class and search for "ee123"
      const existingSubjectMatch = cls.id.match(/([A-Z]+)(\d+)/i) || cls.name.match(/([A-Z]+)\s*(\d+)/i);
      if (existingSubjectMatch) {
        const [, existingSubject, existingNumber] = existingSubjectMatch;
        const existingPattern = `${existingSubject}${existingNumber}`.toLowerCase();
        if (searchCode === existingPattern) {
          logger.debug(`[ensureClassExists] Reverse subject match found (${existingPattern})`);
          return true;
        }
        
        // Also try without the subject (in case Canvas code is just numbers)
        if (searchCode === existingNumber.toLowerCase()) {
          logger.debug(`[ensureClassExists] Number-only match found (${existingNumber})`);
          return true;
        }
      }
      
      return false;
    });
    
    if (existingClass) {
      logger.debug(`[ensureClassExists] Found existing class: "${existingClass.name}" (id: ${existingClass.id}) for code "${classCode}"`);
      return existingClass.id; // Return the existing class ID
    }
    
    // Get user's naming preference - ensure we get the latest settings
    const settings = getSettings();
    const useDescriptiveNames = settings.classNamingStyle === 'descriptive';
    
    logger.debug(`[ensureClassExists] Settings retrieved:`, { 
      classNamingStyle: settings.classNamingStyle, 
      useDescriptiveNames,
      fullSettings: settings,
      rawClassNamingStyle: settings.classNamingStyle,
      isDescriptive: settings.classNamingStyle === 'descriptive',
      isTechnical: settings.classNamingStyle === 'technical',
      isUndefined: settings.classNamingStyle === undefined
    });
    
    // Double-check the settings logic
    logger.debug(`[ensureClassExists] Decision logic - useDescriptiveNames: ${useDescriptiveNames}, will use: ${useDescriptiveNames ? 'generateUserFriendlyClassName' : 'classCode.toUpperCase'}`);
    
    // Create the class with the user's preferred naming style
    const className = useDescriptiveNames 
      ? generateUserFriendlyClassName(classCode)
      : classCode.toUpperCase(); // Keep technical code but make it uppercase for consistency
    
    logger.debug(`[ensureClassExists] Creating new class: "${className}" (code: ${classCode}, style: ${settings.classNamingStyle || 'technical'})`);
    logger.debug(`[ensureClassExists] Name generation details:`, {
      input: classCode,
      useDescriptiveNames,
      generatedName: className,
      descriptiveName: generateUserFriendlyClassName(classCode),
      technicalName: classCode.toUpperCase()
    });
    
    await addClass({
      id: classCode.toLowerCase(),
      name: className,
      user_id: userId || 'local-user',
      istaskclass: true, // Mark as task class since it's from Canvas
      created_at: new Date().toISOString()
    }, useSupabase);
    
    logger.debug(`[ensureClassExists] Successfully created class: "${className}"`);
    return classCode.toLowerCase(); // Return the new class ID
  } catch (error) {
    logger.error(`[ensureClassExists] Error creating class "${classCode}":`, error);
    return classCode.toLowerCase(); // Return the original code as fallback
  }
}

/**
 * Converts Canvas event to ScheduleBud task format
 * 
 * @param event - Canvas event object from ICS parsing
 * @returns Partial task object ready for insertion
 */
export function convertEventToTask(event: CanvasEvent): Partial<TaskInsert> {
  // DTSTART;VALUE=DATE typically means the due DATE for Canvas assignments
  // The ICS file doesn't provide a specific time.
  const dueDate = event.start ? parseICSDate(event.start) : new Date();
  const isDuration = false; // Canvas assignments from ICS are usually just due dates

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Default due time to end of day as Canvas often does
  const defaultDueTime = "23:59";

  let taskClass = 'canvas'; // Default class for canvas items
  let cleanTitle = event.summary || 'Canvas Event';
  
  if (event.summary) {
    // Try multiple patterns to extract class code from Canvas summary
    // Pattern 1: [UGRD_198G_F01_25U] format (from your Canvas data)
    let classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*_[^_\]]+(?:_[^_\]]+)*)\]/i);
    if (classMatch) {
      // Remove the course code from the title
      cleanTitle = event.summary.replace(/\s*\[[A-Z]+_\d+[A-Z]*_[^_\]]+(?:_[^_\]]+)*\]\s*/i, '').trim();
      
      // Convert Canvas format to readable class code
      const canvasCode = classMatch[1];
      // Extract course prefix and number (e.g., UGRD_198G -> UGRD198G)
      const simplifiedMatch = canvasCode.match(/^([A-Z]+)_(\d+[A-Z]*)/);
      if (simplifiedMatch) {
        taskClass = (simplifiedMatch[1] + simplifiedMatch[2]).toLowerCase();
      } else {
        taskClass = canvasCode.toLowerCase().replace(/_/g, '');
      }
    } else {
      // Pattern 2: Traditional format like "CS 100" or "MATH120"
      classMatch = event.summary.match(/^([A-Z]{2,4}\s*\d{1,3}[A-Z]?)/i);
      if (classMatch) {
        const className = classMatch[1].trim();
        taskClass = className.toLowerCase().replace(/\s+/g, '');
        // Don't remove this from title as it's usually part of the assignment name
      } else {
        // Pattern 3: Course code at end of summary like "Assignment 1 [EE_123_B01_25U]"
        classMatch = event.summary.match(/\[([A-Z]+_\d+[A-Z]*)/i);
        if (classMatch) {
          // Remove the course code from the title
          cleanTitle = event.summary.replace(/\s*\[[A-Z]+_\d+[A-Z]*_[^_\]]*\]\s*/i, '').trim();
          
          const coursePrefix = classMatch[1].replace(/_/g, '').toLowerCase();
          taskClass = coursePrefix;
        }
      }
    }
    
    // Event converted: extracted class and cleaned title;
  }

  const task: Partial<TaskInsert> = {
    title: cleanTitle,
    type: getTaskTypeFromEvent(event),
    canvas_uid: event.uid || undefined,
    // Use the correct field names that match your database schema
    dueDate: formatDate(dueDate),  // Database expects "dueDate" not "due_date"
    dueTime: defaultDueTime,       // Database expects "dueTime"
    class: taskClass,              // Database expects "class" field
    isDuration: isDuration,        // Database expects "isDuration"
    completed: false,              // Ensure completed is set
  };

  return task;
}

/**
 * Determines task type from Canvas event content
 * 
 * @param event - Canvas event object
 * @returns Task type string
 */
export function getTaskTypeFromEvent(event: CanvasEvent): string {
  const summary = (event.summary || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  const fullText = `${summary} ${description}`.toLowerCase();

  logger.debug(`[getTaskTypeFromEvent] Analyzing: "${summary}" | Full text: "${fullText}"`);

  // Check reflection patterns first (before exam patterns that might match "final")
  if (fullText.match(/\b(reflection|journal|weekly reflection|week \d+ reflection)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched reflection pattern`);
    return 'homework';
  }
  
  // Homework/assignment patterns (check early to catch things like "HW 3")
  if (fullText.match(/\b(homework|hw \d+|assignment \d+|problem set|exercise|weekly assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched homework pattern`);
    return 'homework';
  }
  
  // Exam-related patterns (more specific to avoid false matches)
  if (fullText.match(/\b(exam \d+|midterm exam?|final exam|test \d+)\b/) || 
      fullText.match(/\b(exam|midterm|test)\b/) && !fullText.match(/\b(reflection|journal|homework|assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched exam pattern`);
    return 'exam';
  }
  
  // Quiz patterns
  if (fullText.match(/\b(quiz|quizzes)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched quiz pattern`);
    return 'quiz';
  }
  
  // Lab patterns
  if (fullText.match(/\b(lab \d+|laboratory|practical|lab report|lab assignment)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched lab pattern`);
    return 'lab';
  }
  
  // Project patterns  
  if (fullText.match(/\b(project|capstone|final project)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched project pattern`);
    return 'project';
  }
  
  // Discussion patterns
  if (fullText.match(/\b(discussion|forum|post|reply|respond)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched discussion pattern`);
    return 'discussion';
  }
  
  // Reading patterns
  if (fullText.match(/\b(reading|read|chapter|textbook)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched reading pattern`);
    return 'reading';
  }
  
  // Presentation patterns
  if (fullText.match(/\b(presentation|present|slide|demo)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched presentation pattern`);
    return 'presentation';
  }
  
  // Paper/essay patterns
  if (fullText.match(/\b(paper|essay|report|write|writing|draft)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched paper pattern`);
    return 'paper';
  }
  
  // Research patterns
  if (fullText.match(/\b(research|study|investigate|analysis|analyze)\b/)) {
    logger.debug(`[getTaskTypeFromEvent] Matched research pattern`);
    return 'research';
  }
  
  // Default fallback
  logger.debug(`[getTaskTypeFromEvent] Using default assignment type`);
  return 'assignment';
}