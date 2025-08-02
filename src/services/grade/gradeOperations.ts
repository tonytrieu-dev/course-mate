import type { User } from '@supabase/supabase-js';
import type { 
  Assignment, 
  AssignmentInsert, 
  AssignmentUpdate,
  Grade,
  GradeInsert,
  GradeUpdate,
  GradeCategory,
  GradeCategoryInsert,
  GradeCategoryUpdate,
  AssignmentWithGrade,
  ClassWithGrades
} from '../../types/database';
import { supabase } from '../supabaseClient';
import { logger } from '../../utils/logger';
import { errorHandler } from '../../utils/errorHandler';
import { getClasses } from '../class/classOperations';

// CRUD Operations for Assignments
export const getAssignments = async (userId?: string, useSupabase = false): Promise<Assignment[]> => {
  try {
    if (useSupabase && userId) {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } else {
      // Local storage fallback
      const stored = localStorage.getItem('grade_assignments');
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    logger.error('[getAssignments] Error:', error);
    return [];
  }
};

export const getAssignmentsByClass = async (classId: string, userId?: string, useSupabase = false): Promise<AssignmentWithGrade[]> => {
  try {
    if (useSupabase && userId) {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          grade:grades(*),
          category:grade_categories(*)
        `)
        .eq('user_id', userId)
        .eq('class_id', classId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data?.map(assignment => ({
        ...assignment,
        grade: assignment.grade?.[0] || undefined,
        category: assignment.category
      })) || [];
    } else {
      // Local storage implementation
      const assignments = await getAssignments(userId, useSupabase);
      const grades = await getGrades(userId, useSupabase);
      const categories = await getGradeCategories(userId, useSupabase);
      
      return assignments
        .filter(assignment => assignment.class_id === classId)
        .map(assignment => ({
          ...assignment,
          grade: grades.find(grade => grade.assignment_id === assignment.id),
          category: categories.find(cat => cat.id === assignment.category_id)!
        }));
    }
  } catch (error) {
    logger.error('[getAssignmentsByClass] Error:', error);
    return [];
  }
};

export const addAssignment = async (assignment: AssignmentInsert, useSupabase = false): Promise<Assignment | null> => {
  try {
    const assignmentData = {
      ...assignment,
      id: assignment.id || crypto.randomUUID(),
      created_at: assignment.created_at || new Date().toISOString(),
      is_extra_credit: assignment.is_extra_credit || false
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Local storage
      const assignments = await getAssignments(assignment.user_id, false);
      const newAssignments = [...assignments, assignmentData as Assignment];
      localStorage.setItem('grade_assignments', JSON.stringify(newAssignments));
      return assignmentData as Assignment;
    }
  } catch (error) {
    logger.error('[addAssignment] Error:', error);
    return null;
  }
};

export const updateAssignment = async (
  id: string, 
  updates: AssignmentUpdate, 
  useSupabase = false
): Promise<Assignment | null> => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Local storage
      const assignments = await getAssignments();
      const updatedAssignments = assignments.map(assignment =>
        assignment.id === id ? { ...assignment, ...updateData } : assignment
      );
      localStorage.setItem('grade_assignments', JSON.stringify(updatedAssignments));
      return updatedAssignments.find(a => a.id === id) || null;
    }
  } catch (error) {
    logger.error('[updateAssignment] Error:', error);
    return null;
  }
};

export const deleteAssignment = async (id: string, useSupabase = false): Promise<boolean> => {
  try {
    if (useSupabase) {
      // Also delete associated grades
      await supabase.from('grades').delete().eq('assignment_id', id);
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
    } else {
      // Local storage
      const assignments = await getAssignments();
      const filteredAssignments = assignments.filter(assignment => assignment.id !== id);
      localStorage.setItem('grade_assignments', JSON.stringify(filteredAssignments));
      
      // Also delete associated grades
      const grades = await getGrades();
      const filteredGrades = grades.filter(grade => grade.assignment_id !== id);
      localStorage.setItem('grade_grades', JSON.stringify(filteredGrades));
    }
    return true;
  } catch (error) {
    logger.error('[deleteAssignment] Error:', error);
    return false;
  }
};

// CRUD Operations for Grades
export const getGrades = async (userId?: string, useSupabase = false): Promise<Grade[]> => {
  try {
    if (useSupabase && userId) {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const stored = localStorage.getItem('grade_grades');
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    logger.error('[getGrades] Error:', error);
    return [];
  }
};

export const addGrade = async (grade: GradeInsert, useSupabase = false): Promise<Grade | null> => {
  try {
    const gradeData = {
      ...grade,
      id: grade.id || crypto.randomUUID(),
      created_at: grade.created_at || new Date().toISOString(),
      is_dropped: grade.is_dropped || false
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('grades')
        .insert(gradeData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const grades = await getGrades();
      const newGrades = [...grades, gradeData as Grade];
      localStorage.setItem('grade_grades', JSON.stringify(newGrades));
      return gradeData as Grade;
    }
  } catch (error) {
    logger.error('[addGrade] Error:', error);
    return null;
  }
};

export const updateGrade = async (
  id: string, 
  updates: GradeUpdate, 
  useSupabase = false
): Promise<Grade | null> => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('grades')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const grades = await getGrades();
      const updatedGrades = grades.map(grade =>
        grade.id === id ? { ...grade, ...updateData } : grade
      );
      localStorage.setItem('grade_grades', JSON.stringify(updatedGrades));
      return updatedGrades.find(g => g.id === id) || null;
    }
  } catch (error) {
    logger.error('[updateGrade] Error:', error);
    return null;
  }
};

// CRUD Operations for Grade Categories
export const getGradeCategories = async (userId?: string, useSupabase = false): Promise<GradeCategory[]> => {
  try {
    if (useSupabase && userId) {
      const { data, error } = await supabase
        .from('grade_categories')
        .select('*')
        .eq('user_id', userId)
        .order('weight', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const stored = localStorage.getItem('grade_categories');
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    logger.error('[getGradeCategories] Error:', error);
    return [];
  }
};

export const getGradeCategoriesByClass = async (
  classId: string, 
  userId?: string, 
  useSupabase = false
): Promise<GradeCategory[]> => {
  try {
    const categories = await getGradeCategories(userId, useSupabase);
    return categories.filter(category => category.class_id === classId);
  } catch (error) {
    logger.error('[getGradeCategoriesByClass] Error:', error);
    return [];
  }
};

export const addGradeCategory = async (
  category: GradeCategoryInsert, 
  useSupabase = false
): Promise<GradeCategory | null> => {
  try {
    const categoryData = {
      ...category,
      id: category.id || crypto.randomUUID(),
      created_at: category.created_at || new Date().toISOString(),
      drop_lowest: category.drop_lowest || 0
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('grade_categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const categories = await getGradeCategories();
      const newCategories = [...categories, categoryData as GradeCategory];
      localStorage.setItem('grade_categories', JSON.stringify(newCategories));
      return categoryData as GradeCategory;
    }
  } catch (error) {
    logger.error('[addGradeCategory] Error:', error);
    return null;
  }
};

// Smart assignment creation from Canvas tasks
export const createAssignmentFromTask = async (
  taskId: string,
  classId: string,
  userId: string,
  categoryId: string,
  pointsPossible: number,
  useSupabase = false
): Promise<Assignment | null> => {
  try {
    // Get the task to extract information
    const tasks = JSON.parse(localStorage.getItem('calendar_tasks') || '[]');
    const task = tasks.find((t: any) => t.id === taskId);
    
    if (!task) {
      logger.error('[createAssignmentFromTask] Task not found');
      return null;
    }

    const assignmentData: AssignmentInsert = {
      user_id: userId,
      class_id: classId,
      task_id: taskId,
      name: task.title,
      description: task.description || undefined,
      category_id: categoryId,
      points_possible: pointsPossible,
      due_date: task.dueDate || task.date,
      is_extra_credit: false
    };

    return await addAssignment(assignmentData, useSupabase);
  } catch (error) {
    logger.error('[createAssignmentFromTask] Error:', error);
    return null;
  }
};

// Get class with all grade information
export const getClassWithGrades = async (
  classId: string, 
  userId?: string, 
  useSupabase = false
): Promise<ClassWithGrades | null> => {
  try {
    // Get basic class info
    const classes = await getClasses(userId, useSupabase);
    const classInfo = classes.find(c => c.id === classId);
    
    if (!classInfo) return null;

    // Get assignments with grades
    const assignments = await getAssignmentsByClass(classId, userId, useSupabase);
    
    // Get categories
    const categories = await getGradeCategoriesByClass(classId, userId, useSupabase);

    // Calculate current grade (implementation in next service file)
    const currentGrade = calculateClassGrade(assignments, categories);
    
    return {
      ...classInfo,
      assignments,
      categories,
      currentGrade: currentGrade.percentage,
      currentLetterGrade: currentGrade.letterGrade
    };
  } catch (error) {
    logger.error('[getClassWithGrades] Error:', error);
    return null;
  }
};

// Helper function to calculate class grade (basic implementation)
const calculateClassGrade = (
  assignments: AssignmentWithGrade[], 
  categories: GradeCategory[]
): { percentage: number; letterGrade: string } => {
  try {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Calculate grade for each category
    for (const category of categories) {
      const categoryAssignments = assignments.filter(a => a.category_id === category.id);
      const gradedAssignments = categoryAssignments.filter(a => a.grade && a.grade.points_earned !== null);
      
      if (gradedAssignments.length === 0) continue;

      // Calculate category average
      const totalPoints = gradedAssignments.reduce((sum, a) => sum + a.points_possible, 0);
      const earnedPoints = gradedAssignments.reduce((sum, a) => sum + (a.grade?.points_earned || 0), 0);
      const categoryPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      totalWeightedScore += categoryPercentage * (category.weight / 100);
      totalWeight += category.weight;
    }

    const finalPercentage = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    
    // Convert to letter grade (basic 90/80/70/60 scale)
    let letterGrade = 'F';
    if (finalPercentage >= 90) letterGrade = 'A';
    else if (finalPercentage >= 80) letterGrade = 'B';
    else if (finalPercentage >= 70) letterGrade = 'C';
    else if (finalPercentage >= 60) letterGrade = 'D';

    return { percentage: Math.round(finalPercentage * 100) / 100, letterGrade };
  } catch (error) {
    logger.error('[calculateClassGrade] Error:', error);
    return { percentage: 0, letterGrade: 'F' };
  }
};