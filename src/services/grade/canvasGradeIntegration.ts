import type { User } from '@supabase/supabase-js';
import type { 
  Task,
  AssignmentInsert,
  GradeCategoryInsert
} from '../../types/database';
import { getTasks } from '../dataService';
import { getClasses } from '../class/classOperations';
import { 
  getGradeCategoriesByClass,
  addGradeCategory,
  createAssignmentFromTask 
} from './gradeOperations';
import { logger } from '../../utils/logger';

/**
 * Smart Canvas task to assignment integration
 * Analyzes existing Canvas tasks and suggests/creates grade assignments
 */

interface CanvasTaskAnalysis {
  taskId: string;
  taskTitle: string;
  className: string;
  classId: string;
  suggestedCategory: string;
  suggestedPoints: number;
  confidence: number;
  reasoning: string;
}

interface IntegrationSummary {
  totalTasks: number;
  analyzedTasks: number;
  createdAssignments: number;
  createdCategories: number;
  skippedTasks: number;
  errors: string[];
}

// Task type to category mapping with point suggestions
const TASK_TYPE_MAPPING = {
  'homework': { category: 'Homework', points: 100, weight: 30 },
  'assignment': { category: 'Assignments', points: 100, weight: 35 },
  'exam': { category: 'Exams', points: 200, weight: 40 },
  'midterm': { category: 'Exams', points: 200, weight: 40 },
  'final': { category: 'Exams', points: 300, weight: 40 },
  'quiz': { category: 'Quizzes', points: 50, weight: 15 },
  'test': { category: 'Exams', points: 150, weight: 40 },
  'project': { category: 'Projects', points: 200, weight: 25 },
  'lab': { category: 'Labs', points: 75, weight: 20 },
  'discussion': { category: 'Participation', points: 25, weight: 10 },
  'paper': { category: 'Papers', points: 150, weight: 25 },
  'presentation': { category: 'Presentations', points: 100, weight: 15 },
  'reading': { category: 'Reading', points: 50, weight: 10 },
  'research': { category: 'Research', points: 150, weight: 20 }
};

/**
 * Analyze Canvas tasks and suggest grade assignments
 */
export const analyzeCanvasTasksForGrades = async (
  userId: string,
  useSupabase = false
): Promise<CanvasTaskAnalysis[]> => {
  try {
    logger.debug('[analyzeCanvasTasksForGrades] Starting analysis for user:', userId);

    // Get all Canvas tasks (tasks with canvas_uid)
    const allTasks = await getTasks(userId, useSupabase);
    const canvasTasks = allTasks.filter(task => task.canvas_uid && task.canvas_uid.trim() !== '');

    logger.debug(`[analyzeCanvasTasksForGrades] Found ${canvasTasks.length} Canvas tasks`);

    const analyses: CanvasTaskAnalysis[] = [];

    for (const task of canvasTasks) {
      try {
        const analysis = analyzeTaskForGradeAssignment(task);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (error) {
        logger.error(`[analyzeCanvasTasksForGrades] Error analyzing task ${task.id}:`, error);
      }
    }

    logger.debug(`[analyzeCanvasTasksForGrades] Analyzed ${analyses.length} tasks`);
    return analyses;

  } catch (error) {
    logger.error('[analyzeCanvasTasksForGrades] Error:', error);
    return [];
  }
};

/**
 * Analyze individual task and suggest grade assignment
 */
const analyzeTaskForGradeAssignment = (task: Task): CanvasTaskAnalysis | null => {
  try {
    const title = task.title.toLowerCase();
    const type = task.type?.toLowerCase() || '';
    
    // Try to match task type or title to category
    let bestMatch = { category: 'Assignments', points: 100, weight: 30 };
    let confidence = 0.3; // Default low confidence
    let reasoning = 'Default assignment category';

    // Check task type first
    if (type && TASK_TYPE_MAPPING[type as keyof typeof TASK_TYPE_MAPPING]) {
      bestMatch = TASK_TYPE_MAPPING[type as keyof typeof TASK_TYPE_MAPPING];
      confidence = 0.8;
      reasoning = `Matched task type: ${type}`;
    } else {
      // Analyze title for keywords
      for (const [keyword, mapping] of Object.entries(TASK_TYPE_MAPPING)) {
        if (title.includes(keyword)) {
          bestMatch = mapping;
          confidence = 0.7;
          reasoning = `Title contains keyword: ${keyword}`;
          break;
        }
      }

      // Special patterns for better detection
      if (title.includes('hw ') || title.includes('homework')) {
        bestMatch = TASK_TYPE_MAPPING.homework;
        confidence = 0.9;
        reasoning = 'Homework pattern detected';
      } else if (title.includes('exam') || title.includes('test')) {
        bestMatch = TASK_TYPE_MAPPING.exam;
        confidence = 0.9;
        reasoning = 'Exam pattern detected';
      } else if (title.includes('quiz')) {
        bestMatch = TASK_TYPE_MAPPING.quiz;
        confidence = 0.9;
        reasoning = 'Quiz pattern detected';
      } else if (title.includes('project')) {
        bestMatch = TASK_TYPE_MAPPING.project;
        confidence = 0.9;
        reasoning = 'Project pattern detected';
      } else if (title.includes('lab')) {
        bestMatch = TASK_TYPE_MAPPING.lab;
        confidence = 0.8;
        reasoning = 'Lab pattern detected';
      }
    }

    return {
      taskId: task.id,
      taskTitle: task.title,
      className: task.class || 'Unknown Class',
      classId: task.class || 'unknown',
      suggestedCategory: bestMatch.category,
      suggestedPoints: bestMatch.points,
      confidence,
      reasoning
    };

  } catch (error) {
    logger.error('[analyzeTaskForGradeAssignment] Error:', error);
    return null;
  }
};

/**
 * Create grade assignments from Canvas tasks automatically
 */
export const createGradeAssignmentsFromCanvasTasks = async (
  userId: string,
  analyses: CanvasTaskAnalysis[],
  minConfidence = 0.7,
  useSupabase = false
): Promise<IntegrationSummary> => {
  const summary: IntegrationSummary = {
    totalTasks: analyses.length,
    analyzedTasks: 0,
    createdAssignments: 0,
    createdCategories: 0,
    skippedTasks: 0,
    errors: []
  };

  try {
    logger.debug(`[createGradeAssignmentsFromCanvasTasks] Processing ${analyses.length} analyses`);

    // Get all classes to validate class IDs
    const classes = await getClasses(userId, useSupabase);
    const validClassIds = new Set(classes.map(c => c.id));

    // Track created categories to avoid duplicates
    const createdCategories = new Map<string, string>(); // classId-categoryName -> categoryId

    for (const analysis of analyses) {
      try {
        summary.analyzedTasks++;

        // Skip low confidence matches unless forced
        if (analysis.confidence < minConfidence) {
          summary.skippedTasks++;
          logger.debug(`[createGradeAssignmentsFromCanvasTasks] Skipping low confidence task: ${analysis.taskTitle}`);
          continue;
        }

        // Skip if class doesn't exist
        if (!validClassIds.has(analysis.classId)) {
          summary.skippedTasks++;
          summary.errors.push(`Class not found: ${analysis.className} (${analysis.classId})`);
          continue;
        }

        // Ensure category exists
        let categoryId: string | undefined;
        const categoryKey = `${analysis.classId}-${analysis.suggestedCategory}`;
        
        if (createdCategories.has(categoryKey)) {
          categoryId = createdCategories.get(categoryKey);
        } else {
          // Check if category already exists
          const existingCategories = await getGradeCategoriesByClass(analysis.classId, userId, useSupabase);
          const existingCategory = existingCategories.find(c => 
            c.name.toLowerCase() === analysis.suggestedCategory.toLowerCase()
          );

          if (existingCategory) {
            categoryId = existingCategory.id;
            createdCategories.set(categoryKey, categoryId);
          } else {
            // Create new category
            const weight = TASK_TYPE_MAPPING[analysis.suggestedCategory.toLowerCase() as keyof typeof TASK_TYPE_MAPPING]?.weight || 25;
            
            const categoryData: GradeCategoryInsert = {
              user_id: userId,
              class_id: analysis.classId,
              name: analysis.suggestedCategory,
              weight: weight,
              color: getCategoryColor(analysis.suggestedCategory)
            };

            const newCategory = await addGradeCategory(categoryData, useSupabase);
            if (newCategory) {
              categoryId = newCategory.id;
              createdCategories.set(categoryKey, categoryId);
              summary.createdCategories++;
              logger.debug(`[createGradeAssignmentsFromCanvasTasks] Created category: ${analysis.suggestedCategory}`);
            }
          }
        }

        if (!categoryId) {
          summary.errors.push(`Failed to create/find category for task: ${analysis.taskTitle}`);
          continue;
        }

        // Create assignment from task
        const assignment = await createAssignmentFromTask(
          analysis.taskId,
          analysis.classId,
          userId,
          categoryId,
          analysis.suggestedPoints,
          useSupabase
        );

        if (assignment) {
          summary.createdAssignments++;
          logger.debug(`[createGradeAssignmentsFromCanvasTasks] Created assignment: ${analysis.taskTitle}`);
        } else {
          summary.errors.push(`Failed to create assignment for task: ${analysis.taskTitle}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        summary.errors.push(`Error processing ${analysis.taskTitle}: ${errorMsg}`);
        logger.error(`[createGradeAssignmentsFromCanvasTasks] Error processing analysis:`, error);
      }
    }

    logger.debug('[createGradeAssignmentsFromCanvasTasks] Summary:', summary);
    return summary;

  } catch (error) {
    logger.error('[createGradeAssignmentsFromCanvasTasks] Error:', error);
    summary.errors.push(`Integration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return summary;
  }
};

/**
 * Get appropriate color for category
 */
const getCategoryColor = (categoryName: string): string => {
  const colorMap: Record<string, string> = {
    'homework': '#3b82f6', // blue
    'assignments': '#3b82f6', // blue
    'exams': '#ef4444', // red
    'quizzes': '#f59e0b', // amber
    'projects': '#10b981', // green
    'labs': '#8b5cf6', // purple
    'participation': '#f59e0b', // amber
    'papers': '#06b6d4', // cyan
    'presentations': '#ec4899', // pink
    'reading': '#84cc16', // lime
    'research': '#6366f1' // indigo
  };

  return colorMap[categoryName.toLowerCase()] || '#6b7280'; // default gray
};

/**
 * Full integration workflow: analyze and create assignments
 */
export const integrateCanvasTasksWithGrades = async (
  userId: string,
  options: {
    minConfidence?: number;
    createCategories?: boolean;
    useSupabase?: boolean;
  } = {}
): Promise<{ analyses: CanvasTaskAnalysis[]; summary: IntegrationSummary }> => {
  const {
    minConfidence = 0.7,
    createCategories = true,
    useSupabase = false
  } = options;

  try {
    logger.debug('[integrateCanvasTasksWithGrades] Starting integration');

    // Step 1: Analyze Canvas tasks
    const analyses = await analyzeCanvasTasksForGrades(userId, useSupabase);

    // Step 2: Create assignments if requested
    let summary: IntegrationSummary = {
      totalTasks: analyses.length,
      analyzedTasks: analyses.length,
      createdAssignments: 0,
      createdCategories: 0,
      skippedTasks: 0,
      errors: []
    };

    if (createCategories && analyses.length > 0) {
      summary = await createGradeAssignmentsFromCanvasTasks(
        userId,
        analyses,
        minConfidence,
        useSupabase
      );
    }

    logger.debug('[integrateCanvasTasksWithGrades] Integration complete');
    return { analyses, summary };

  } catch (error) {
    logger.error('[integrateCanvasTasksWithGrades] Error:', error);
    return {
      analyses: [],
      summary: {
        totalTasks: 0,
        analyzedTasks: 0,
        createdAssignments: 0,
        createdCategories: 0,
        skippedTasks: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    };
  }
};