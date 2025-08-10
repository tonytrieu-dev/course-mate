/**
 * Validation Module - Handles security validation and task quality checks
 * Extracted from syllabusTaskGenerationService.ts for better maintainability
 */

import { logger } from '../../utils/logger';
import { errorHandler } from '../../utils/errorHandler';
import { SyllabusSecurityService } from '../syllabusSecurityService';
import type { GeneratedTask } from './aiAnalysis';

// Validation configuration
const VALIDATION_CONFIG = {
  MIN_CONFIDENCE_SCORE: 0.7,
  MIN_LAB_CONFIDENCE_SCORE: 0.5, // Relaxed threshold for lab tasks
  VALID_TASK_TYPES: ['assignment', 'exam', 'quiz', 'project', 'reading', 'discussion', 'lab', 'homework', 'paper', 'presentation', 'research'],
  MIN_TITLE_LENGTH: 2,
  MAX_TITLE_LENGTH: 200,
  ACADEMIC_TERMS: [
    'assignment', 'homework', 'project', 'essay', 'paper', 'report', 'presentation',
    'exam', 'midterm', 'final', 'test', 'quiz', 'discussion', 'lab', 'reading'
  ]
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate syllabus content for task generation (security and content checks)
 */
export async function validateSyllabusForTaskGeneration(
  content: string, 
  userId: string
): Promise<ValidationResult> {
  logger.info('🔒 VALIDATION: Starting syllabus validation for task generation', {
    contentLength: content.length,
    userId: userId ? 'provided' : 'missing'
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic content validation
    if (content.length < 100) {
      errors.push('Syllabus content is too short to extract meaningful tasks');
    }

    if (content.length > 500000) { // 500KB limit
      warnings.push('Syllabus content is very large - processing may be slower');
    }

    // Check for academic content indicators
    const hasAcademicContent = detectAcademicTerms(content);
    if (!hasAcademicContent) {
      warnings.push('Content does not appear to contain typical academic/syllabus terminology');
    }

    // Check for date patterns
    const hasDatePatterns = content.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g);
    if (!hasDatePatterns) {
      warnings.push('No date patterns found in content - may affect due date extraction');
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    logger.info('🔒 VALIDATION: Syllabus validation completed', {
      isValid: result.isValid,
      errorCount: errors.length,
      warningCount: warnings.length
    });

    return result;

  } catch (error) {
    logger.error('🔒 VALIDATION: Error during syllabus validation', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings
    };
  }
}

/**
 * Validate generated tasks for quality and security
 */
export function validateGeneratedTasks(tasks: GeneratedTask[], originalContent: string): GeneratedTask[] {
  logger.info('🔍 TASK VALIDATION: Starting task validation', {
    totalTasks: tasks.length,
    labTasks: tasks.filter(t => t.taskType?.toLowerCase() === 'lab').length
  });

  const processedTasks = tasks.map(task => {
    // Fix missing or invalid taskType with smart inference
    if (!task.taskType || !VALIDATION_CONFIG.VALID_TASK_TYPES.includes(task.taskType as any)) {
      const inferredType = inferTaskType(task.title, task.description || '');
      logger.debug('🔍 TASK VALIDATION: Task type inference applied', { 
        originalType: task.taskType, 
        inferredType, 
        taskTitle: task.title 
      });
      task.taskType = inferredType;
    }

    // Enhanced lab task logging
    if (task.taskType?.toLowerCase() === 'lab') {
      logger.info('🧪 LAB VALIDATION: Processing lab task', {
        title: task.title,
        taskType: task.taskType,
        dueDate: task.dueDate,
        assignmentDate: task.assignmentDate,
        sessionDate: task.sessionDate,
        courseCode: task.courseCode,
        courseName: task.courseName,
        subject: task.subject,
        confidenceScore: task.confidenceScore
      });
    }

    return task;
  });

  const validatedTasks = processedTasks.filter(task => {
    // Basic title validation
    if (!task.title || task.title.length < VALIDATION_CONFIG.MIN_TITLE_LENGTH) {
      logger.warn('🔍 TASK VALIDATION: Task rejected - title too short', { 
        title: task.title,
        taskType: task.taskType
      });
      return false;
    }

    if (task.title.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
      logger.warn('🔍 TASK VALIDATION: Task rejected - title too long', { 
        title: task.title.substring(0, 50) + '...',
        length: task.title.length,
        taskType: task.taskType
      });
      return false;
    }

    // Task type validation (should pass after inference)
    if (!VALIDATION_CONFIG.VALID_TASK_TYPES.includes(task.taskType as any)) {
      logger.warn('🔍 TASK VALIDATION: Task rejected - invalid task type after inference', { 
        taskType: task.taskType,
        title: task.title
      });
      return false;
    }

    // Confidence score validation with relaxed thresholds for labs
    const isLab = task.taskType?.toLowerCase() === 'lab';
    const confidenceThreshold = isLab 
      ? VALIDATION_CONFIG.MIN_LAB_CONFIDENCE_SCORE 
      : VALIDATION_CONFIG.MIN_CONFIDENCE_SCORE;
    
    if (task.confidenceScore < confidenceThreshold) {
      if (isLab) {
        logger.warn('🧪 LAB VALIDATION: Lab task rejected - low confidence (relaxed threshold)', { 
          title: task.title,
          taskType: task.taskType,
          confidence: task.confidenceScore,
          threshold: confidenceThreshold,
          originalThreshold: VALIDATION_CONFIG.MIN_CONFIDENCE_SCORE
        });
      } else {
        logger.warn('🔍 TASK VALIDATION: Task rejected - low confidence', { 
          title: task.title, 
          confidence: task.confidenceScore,
          threshold: confidenceThreshold
        });
      }
      return false;
    }

    // Source verification - check if task appears to be derived from original content
    if (!verifyTaskSourceRelevance(task, originalContent)) {
      logger.warn('🔍 TASK VALIDATION: Task rejected - not clearly derived from source content', {
        title: task.title,
        taskType: task.taskType
      });
      return false;
    }

    return true;
  });

  const rejectedCount = processedTasks.length - validatedTasks.length;
  
  logger.info('🔍 TASK VALIDATION: Task validation completed', {
    inputTasks: tasks.length,
    processedTasks: processedTasks.length,
    validatedTasks: validatedTasks.length,
    rejectedTasks: rejectedCount,
    validationRate: `${((validatedTasks.length / Math.max(tasks.length, 1)) * 100).toFixed(1)}%`
  });

  return validatedTasks;
}

/**
 * Detect academic terms in content
 */
function detectAcademicTerms(content: string): boolean {
  const contentLower = content.toLowerCase();
  const termMatches = VALIDATION_CONFIG.ACADEMIC_TERMS.filter(term => 
    contentLower.includes(term)
  ).length;
  
  return termMatches >= 3; // Require at least 3 academic terms
}

/**
 * Infer task type from title and description
 */
export function inferTaskType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Lab patterns (highest priority for engineering courses)
  if (text.match(/\b(lab|laboratory|experiment|practical)\b/)) {
    return 'lab';
  }
  
  // Exam patterns
  if (text.match(/\b(exam|test|midterm|final|quiz)\b/)) {
    if (text.includes('quiz')) return 'quiz';
    return 'exam';
  }
  
  // Project patterns
  if (text.match(/\b(project|capstone|design)\b/)) {
    return 'project';
  }
  
  // Paper/essay patterns
  if (text.match(/\b(paper|essay|report|write|writing)\b/)) {
    return 'paper';
  }
  
  // Presentation patterns
  if (text.match(/\b(presentation|present|demo|showcase)\b/)) {
    return 'presentation';
  }
  
  // Reading patterns
  if (text.match(/\b(reading|read|chapter|textbook)\b/)) {
    return 'reading';
  }
  
  // Discussion patterns
  if (text.match(/\b(discussion|forum|post|reply)\b/)) {
    return 'discussion';
  }
  
  // Research patterns
  if (text.match(/\b(research|study|investigate|analysis)\b/)) {
    return 'research';
  }
  
  // Homework patterns (broader catch-all)
  if (text.match(/\b(homework|hw|assignment|problem|exercise)\b/)) {
    return 'homework';
  }
  
  // Default fallback
  return 'assignment';
}

/**
 * Verify that a task appears to be derived from the original content
 */
function verifyTaskSourceRelevance(task: GeneratedTask, originalContent: string): boolean {
  // For labs, be more lenient since they're critical for engineering courses
  const isLab = task.taskType?.toLowerCase() === 'lab';
  
  if (isLab) {
    // For labs, check for lab-related terms in content
    const contentLower = originalContent.toLowerCase();
    const hasLabContent = 
      contentLower.includes('lab') || 
      contentLower.includes('laboratory') ||
      contentLower.includes('experiment') ||
      /lab\s*\d+/.test(contentLower);
    
    if (hasLabContent) {
      return true;
    }
  }
  
  // For other tasks, check if task title words appear in content
  const titleWords = task.title.toLowerCase()
    .split(' ')
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !['the', 'and', 'for', 'you', 'are', 'with'].includes(word)); // Filter stop words
  
  const contentLower = originalContent.toLowerCase();
  
  // Check if enough title words appear in content
  const matchingWords = titleWords.filter(word => contentLower.includes(word));
  const matchRatio = matchingWords.length / Math.max(titleWords.length, 1);
  
  // Relaxed matching for labs, stricter for other task types
  const requiredMatchRatio = isLab ? 0.3 : 0.5;
  
  return matchRatio >= requiredMatchRatio;
}

/**
 * Get task type color for UI display
 */
export function getTaskTypeColor(taskType: string): string {
  const colorMap: Record<string, string> = {
    'assignment': '#3B82F6', // Blue
    'homework': '#3B82F6',   // Blue
    'exam': '#EF4444',       // Red
    'quiz': '#F59E0B',       // Amber
    'project': '#8B5CF6',    // Purple
    'reading': '#10B981',    // Emerald
    'discussion': '#06B6D4', // Cyan
    'lab': '#F97316',        // Orange
    'paper': '#84CC16',      // Lime
    'presentation': '#EC4899', // Pink
    'research': '#6366F1'    // Indigo
  };
  
  return colorMap[taskType.toLowerCase()] || '#6B7280'; // Gray fallback
}

/**
 * Estimate task duration based on type
 */
export function estimateTaskDuration(taskType: string): number {
  const durationMap: Record<string, number> = {
    'assignment': 120,    // 2 hours
    'homework': 90,       // 1.5 hours
    'exam': 180,          // 3 hours (study time)
    'quiz': 30,           // 30 minutes
    'project': 480,       // 8 hours
    'reading': 60,        // 1 hour
    'discussion': 30,     // 30 minutes
    'lab': 180,           // 3 hours
    'paper': 300,         // 5 hours
    'presentation': 240,  // 4 hours
    'research': 360       // 6 hours
  };
  
  return durationMap[taskType.toLowerCase()] || 120; // 2 hours fallback
}