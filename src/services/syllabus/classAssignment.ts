/**
 * Class Assignment Module - Handles automatic class assignment for tasks
 * Extracted from syllabusTaskGenerationService.ts for better maintainability
 */

import { logger } from '../../utils/logger';
import type { GeneratedTask } from './aiAnalysis';
import type { User } from '@supabase/supabase-js';

/**
 * Determine the appropriate class for a task based on AI-detected course information
 */
export async function determineTaskClass(
  generatedTask: GeneratedTask,
  fallbackClassId: string,
  user: User
): Promise<string> {
  try {
    logger.info('🏫 CLASS ASSIGNMENT: Determining class for task', {
      taskTitle: generatedTask.title,
      courseCode: generatedTask.courseCode,
      courseName: generatedTask.courseName,
      subject: generatedTask.subject
    });

    // Import class operations
    const { getClasses, addClass } = await import('../class/classOperations');
    const { getSettings } = await import('../settings/settingsOperations');
    
    // If no course information was detected by AI, use fallback class
    if (!generatedTask.courseCode && !generatedTask.courseName) {
      logger.debug('🏫 CLASS ASSIGNMENT: No course information detected, using fallback class', {
        taskTitle: generatedTask.title,
        fallbackClassId
      });
      return fallbackClassId;
    }

    // Get existing classes for the user
    const existingClasses = await getClasses(user.id, true);
    
    // Try to find existing class based on detected course information
    const detectedCourseCode = generatedTask.courseCode?.toLowerCase();
    const detectedCourseName = generatedTask.courseName?.toLowerCase();
    
    logger.debug('🏫 CLASS ASSIGNMENT: Searching for matching class', {
      taskTitle: generatedTask.title,
      detectedCourseCode,
      detectedCourseName,
      existingClassCount: existingClasses.length
    });

    // Enhanced class matching logic (similar to Canvas import)
    const matchingClass = existingClasses.find(cls => {
      const classId = cls.id.toLowerCase();
      const className = cls.name.toLowerCase();
      
      // Direct course code match
      if (detectedCourseCode && classId === detectedCourseCode) {
        logger.debug('🏫 CLASS ASSIGNMENT: Found direct course code match', {
          taskTitle: generatedTask.title,
          matchedClass: cls.name,
          classId: cls.id
        });
        return true;
      }
      
      // Course code in class name
      if (detectedCourseCode && className.includes(detectedCourseCode)) {
        logger.debug('🏫 CLASS ASSIGNMENT: Found course code in class name', {
          taskTitle: generatedTask.title,
          matchedClass: cls.name,
          classId: cls.id
        });
        return true;
      }
      
      // Course name match
      if (detectedCourseName && className.includes(detectedCourseName)) {
        logger.debug('🏫 CLASS ASSIGNMENT: Found course name match', {
          taskTitle: generatedTask.title,
          matchedClass: cls.name,
          classId: cls.id
        });
        return true;
      }
      
      // Try subject matching (e.g., CS101 matches Computer Science)
      if (detectedCourseCode) {
        const subjectMatch = detectedCourseCode.match(/([a-z]+)(\d+)/);
        if (subjectMatch) {
          const [, subject] = subjectMatch;
          const subjectMappings = getSubjectMappings();
          
          const relatedTerms = subjectMappings[subject] || [subject];
          if (relatedTerms.some(term => className.includes(term))) {
            logger.debug('🏫 CLASS ASSIGNMENT: Found subject match', {
              taskTitle: generatedTask.title,
              subject,
              relatedTerms,
              matchedClass: cls.name,
              classId: cls.id
            });
            return true;
          }
        }
      }
      
      return false;
    });

    if (matchingClass) {
      logger.debug('🏫 CLASS ASSIGNMENT: Using existing matching class', {
        taskTitle: generatedTask.title,
        matchedClass: matchingClass.name,
        classId: matchingClass.id
      });
      return matchingClass.id;
    }

    // No existing class found, create a new one based on detected course information
    const settings = getSettings();
    const useDescriptiveNames = settings.classNamingStyle === 'descriptive';
    
    let newClassName: string;
    let newClassId: string;
    
    if (detectedCourseCode && detectedCourseName) {
      // We have both code and name
      newClassName = useDescriptiveNames ? detectedCourseName : detectedCourseCode.toUpperCase();
      newClassId = detectedCourseCode.toLowerCase();
    } else if (detectedCourseCode) {
      // Only have course code
      newClassName = useDescriptiveNames ? generateUserFriendlyClassName(detectedCourseCode) : detectedCourseCode.toUpperCase();
      newClassId = detectedCourseCode.toLowerCase();
    } else if (detectedCourseName) {
      // Only have course name
      newClassName = detectedCourseName;
      newClassId = detectedCourseName.toLowerCase().replace(/\s+/g, '');
    } else {
      // Fallback to default class
      return fallbackClassId;
    }

    // Create the new class
    logger.info('🏫 CLASS ASSIGNMENT: Creating new class for detected course', {
      taskTitle: generatedTask.title,
      newClassName,
      newClassId,
      detectedCourseCode,
      detectedCourseName,
      useDescriptiveNames
    });

    await addClass({
      id: newClassId,
      name: newClassName,
      user_id: user.id,
      istaskclass: true, // Mark as task class since it's from AI-generated content
      created_at: new Date().toISOString()
    }, true);

    logger.info('✅ CLASS ASSIGNMENT: Successfully created new class for AI-detected course', {
      taskTitle: generatedTask.title,
      createdClass: newClassName,
      classId: newClassId
    });

    return newClassId;

  } catch (error) {
    logger.error('🏫 CLASS ASSIGNMENT: Error determining task class, using fallback', {
      taskTitle: generatedTask.title,
      fallbackClassId,
      error: error instanceof Error ? error.message : String(error)
    });
    return fallbackClassId;
  }
}

/**
 * Get subject mappings for course code matching
 */
export function getSubjectMappings(): { [key: string]: string[] } {
  return {
    'cs': ['computer', 'computing'],
    'math': ['mathematics', 'math'],
    'ee': ['electrical', 'engineering'],
    'me': ['mechanical', 'engineering'],
    'ce': ['computer', 'civil', 'engineering'],
    'phys': ['physics', 'physical'],
    'chem': ['chemistry', 'chemical'],
    'biol': ['biology', 'biological'],
    'psyc': ['psychology', 'psychological'],
    'econ': ['economics', 'economic'],
    'engl': ['english', 'literature'],
    'hist': ['history', 'historical']
  };
}

/**
 * Generate user-friendly class name from course code
 */
export function generateUserFriendlyClassName(courseCode: string): string {
  // Remove common prefixes and clean up codes
  const cleanCode = courseCode.replace(/^(canvas|task)_?/i, '').toUpperCase();
  
  // Pattern matching for common course formats  
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
      'ENGL': 'English',
      'HIST': 'History',
      'PSYC': 'Psychology',
      'ECON': 'Economics',
      'POLI': 'Political Science',
      'PHIL': 'Philosophy',
      'ANTH': 'Anthropology',
      'SOCI': 'Sociology',
      'ME': 'Mechanical Engineering',
      'CE': 'Civil Engineering'
    };
    
    const fullSubjectName = subjectNames[subject] || subject;
    return `${fullSubjectName} ${number}`;
  }
  
  // Fallback: capitalize and format nicely
  return cleanCode.replace(/([A-Z])(\d)/g, '$1 $2').replace(/_/g, ' ');
}

/**
 * Detect academic subject from task information
 */
export function detectSubjectFromTask(generatedTask: GeneratedTask): string {
  // First, use AI-detected subject if available
  if (generatedTask.subject) {
    // Map AI subject to our standard names
    const subjectMappings: { [key: string]: string } = {
      'EE': 'Electrical Engineering',
      'ECE': 'Electrical Engineering', 
      'Electrical Engineering': 'Electrical Engineering',
      'CHEM': 'Chemistry',
      'Chemistry': 'Chemistry',
      'Chemical': 'Chemistry',
      'PHYS': 'Physics',
      'Physics': 'Physics',
      'Physical Science': 'Physics',
      'CS': 'Computer Science',
      'Computer Science': 'Computer Science',
      'MATH': 'Mathematics',
      'Mathematics': 'Mathematics'
    };
    
    const mappedSubject = subjectMappings[generatedTask.subject];
    if (mappedSubject) {
      logger.debug('📚 SUBJECT DETECTION: Subject detected from AI subject field', {
        taskTitle: generatedTask.title,
        aiSubject: generatedTask.subject,
        mappedSubject
      });
      return mappedSubject;
    }
  }

  // Enhanced fallback: detect from course code or course name
  const courseInfo = (generatedTask.courseCode || generatedTask.courseName || '').toLowerCase();
  
  // Enhanced EE detection patterns
  if (courseInfo.includes('ee ') || courseInfo.includes('ee1') || courseInfo.includes('ee2') || 
      courseInfo.includes('ee123') || courseInfo.includes('ee 123') ||
      courseInfo.includes('ece') || courseInfo.includes('electrical') ||
      courseInfo.includes('power electronics')) {
    logger.debug('📚 SUBJECT DETECTION: EE subject detected from course info', {
      taskTitle: generatedTask.title,
      courseInfo: generatedTask.courseCode || generatedTask.courseName
    });
    return 'Electrical Engineering';
  }
  
  if (courseInfo.includes('chem') || courseInfo.includes('chemistry')) {
    return 'Chemistry';
  }
  
  if (courseInfo.includes('phys') || courseInfo.includes('physics')) {
    return 'Physics';
  }

  if (courseInfo.includes('cs ') || courseInfo.includes('cs1') || courseInfo.includes('cs2') || 
      courseInfo.includes('computer')) {
    return 'Computer Science';
  }

  if (courseInfo.includes('math') || courseInfo.includes('mathematics')) {
    return 'Mathematics';
  }

  // Additional fallback: check task title for subject indicators
  const taskTitle = generatedTask.title.toLowerCase();
  
  // Enhanced EE detection from task content
  if (taskTitle.includes('power') && (taskTitle.includes('electronic') || taskTitle.includes('electronics'))) {
    logger.debug('📚 SUBJECT DETECTION: EE subject detected from power electronics in title', {
      taskTitle: generatedTask.title
    });
    return 'Electrical Engineering';
  }
  
  if (taskTitle.includes('circuit') || taskTitle.includes('voltage') || taskTitle.includes('current') || 
      taskTitle.includes('rectifier') || taskTitle.includes('converter') || taskTitle.includes('inverter')) {
    logger.debug('📚 SUBJECT DETECTION: EE subject detected from electrical terms in title', {
      taskTitle: generatedTask.title
    });
    return 'Electrical Engineering';
  }

  // Final fallback: check for common lab patterns that might indicate subject
  if (taskTitle.includes('lab') && (taskTitle.includes('characterization') || taskTitle.includes('bridge'))) {
    logger.debug('📚 SUBJECT DETECTION: EE subject inferred from lab content', {
      taskTitle: generatedTask.title
    });
    return 'Electrical Engineering';
  }

  logger.debug('📚 SUBJECT DETECTION: Subject detection failed, returning Unknown', {
    taskTitle: generatedTask.title,
    courseCode: generatedTask.courseCode,
    courseName: generatedTask.courseName,
    subject: generatedTask.subject
  });

  return 'Unknown';
}