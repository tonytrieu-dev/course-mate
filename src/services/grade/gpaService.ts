import type { User } from '@supabase/supabase-js';
import type {
  GpaSettings,
  GpaSettingsInsert,
  ClassGpaInfo,
  ClassGpaInfoInsert,
  GPACalculation,
  ClassGradeInfo,
  WhatIfScenario,
  GradeChange,
  ClassWithGrades
} from '../../types/database';
import { supabase } from '../supabaseClient';
import { logger } from '../../utils/logger';
import { getClassWithGrades } from './gradeOperations';
import { getClasses } from '../class/classOperations';

// Default GPA settings for 4.0 scale
const DEFAULT_GPA_SETTINGS: Omit<GpaSettingsInsert, 'user_id'> = {
  scale_type: 'four_point',
  a_min: 90,
  b_min: 80,
  c_min: 70,
  d_min: 60,
  a_plus_min: 97,
  quality_points: {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0
  }
};

// GPA Settings Operations
export const getGpaSettings = async (userId: string, useSupabase = false): Promise<GpaSettings | null> => {
  try {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('gpa_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Not found is ok
      return data;
    } else {
      const stored = localStorage.getItem(`gpa_settings_${userId}`);
      return stored ? JSON.parse(stored) : null;
    }
  } catch (error) {
    logger.error('[getGpaSettings] Error:', error);
    return null;
  }
};

export const initializeGpaSettings = async (userId: string, useSupabase = false): Promise<GpaSettings> => {
  try {
    // Check if settings already exist
    let settings = await getGpaSettings(userId, useSupabase);
    
    if (settings) return settings;

    // Create default settings
    const newSettings: GpaSettingsInsert = {
      ...DEFAULT_GPA_SETTINGS,
      user_id: userId,
      id: crypto.randomUUID()
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('gpa_settings')
        .insert(newSettings)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const settingsData = {
        ...newSettings,
        created_at: new Date().toISOString()
      } as GpaSettings;
      
      localStorage.setItem(`gpa_settings_${userId}`, JSON.stringify(settingsData));
      return settingsData;
    }
  } catch (error) {
    logger.error('[initializeGpaSettings] Error:', error);
    // Return default settings even if save fails
    return {
      ...DEFAULT_GPA_SETTINGS,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString()
    } as GpaSettings;
  }
};

// Class GPA Info Operations
export const getClassGpaInfo = async (userId: string, useSupabase = false): Promise<ClassGpaInfo[]> => {
  try {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('class_gpa_info')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('semester', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } else {
      const stored = localStorage.getItem(`class_gpa_info_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    logger.error('[getClassGpaInfo] Error:', error);
    return [];
  }
};

export const updateClassGpaInfo = async (
  classGpaInfo: ClassGpaInfoInsert,
  useSupabase = false
): Promise<ClassGpaInfo | null> => {
  try {
    const gpaInfoData = {
      ...classGpaInfo,
      id: classGpaInfo.id || crypto.randomUUID(),
      created_at: classGpaInfo.created_at || new Date().toISOString()
    };

    if (useSupabase) {
      const { data, error } = await supabase
        .from('class_gpa_info')
        .upsert(gpaInfoData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const allGpaInfo = await getClassGpaInfo(classGpaInfo.user_id, false);
      const existingIndex = allGpaInfo.findIndex(info => 
        info.class_id === classGpaInfo.class_id && info.user_id === classGpaInfo.user_id
      );
      
      if (existingIndex >= 0) {
        allGpaInfo[existingIndex] = { ...allGpaInfo[existingIndex], ...gpaInfoData };
      } else {
        allGpaInfo.push(gpaInfoData as ClassGpaInfo);
      }
      
      localStorage.setItem(`class_gpa_info_${classGpaInfo.user_id}`, JSON.stringify(allGpaInfo));
      return gpaInfoData as ClassGpaInfo;
    }
  } catch (error) {
    logger.error('[updateClassGpaInfo] Error:', error);
    return null;
  }
};

// Core GPA Calculation Functions
export const calculateLetterGrade = (percentage: number, gpaSettings: GpaSettings): string => {
  if (percentage >= (gpaSettings.a_plus_min || 97)) return 'A+';
  if (percentage >= gpaSettings.a_min) return 'A';
  if (percentage >= gpaSettings.a_min - 3) return 'A-';
  if (percentage >= gpaSettings.b_min + 3) return 'B+';
  if (percentage >= gpaSettings.b_min) return 'B';
  if (percentage >= gpaSettings.b_min - 3) return 'B-';
  if (percentage >= gpaSettings.c_min + 3) return 'C+';
  if (percentage >= gpaSettings.c_min) return 'C';
  if (percentage >= gpaSettings.c_min - 3) return 'C-';
  if (percentage >= gpaSettings.d_min + 3) return 'D+';
  if (percentage >= gpaSettings.d_min) return 'D';
  if (percentage >= gpaSettings.d_min - 3) return 'D-';
  return 'F';
};

export const getQualityPoints = (letterGrade: string, gpaSettings: GpaSettings): number => {
  return gpaSettings.quality_points[letterGrade] || 0;
};

export const calculateClassCurrentGrade = (classWithGrades: ClassWithGrades): number => {
  const { assignments, categories } = classWithGrades;
  
  if (categories.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Calculate grade for each category
  for (const category of categories) {
    const categoryAssignments = assignments.filter(a => a.category_id === category.id);
    const gradedAssignments = categoryAssignments.filter(a => 
      a.grade && 
      a.grade.points_earned !== null && 
      !a.grade.is_dropped
    );
    
    if (gradedAssignments.length === 0) continue;

    // Apply drop lowest if configured
    let sortedAssignments = gradedAssignments;
    if (category.drop_lowest && category.drop_lowest > 0) {
      sortedAssignments = gradedAssignments
        .map(a => ({
          ...a,
          percentage: (a.grade!.points_earned! / a.points_possible) * 100
        }))
        .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
        .slice(0, gradedAssignments.length - category.drop_lowest); // Drop the lowest
    }

    // Calculate category average
    const totalPoints = sortedAssignments.reduce((sum, a) => sum + a.points_possible, 0);
    const earnedPoints = sortedAssignments.reduce((sum, a) => sum + (a.grade?.points_earned || 0), 0);
    const categoryPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    totalWeightedScore += categoryPercentage * (category.weight / 100);
    totalWeight += category.weight;
  }

  return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
};

export const calculateFullGPA = async (
  userId: string, 
  useSupabase = false
): Promise<GPACalculation> => {
  try {
    // Get GPA settings
    const gpaSettings = await initializeGpaSettings(userId, useSupabase);
    
    // Get all classes and their GPA info
    const classes = await getClasses(userId, useSupabase);
    const classGpaInfos = await getClassGpaInfo(userId, useSupabase);
    
    const classGrades: ClassGradeInfo[] = [];
    let totalQualityPoints = 0;
    let totalCreditHours = 0;
    let currentSemesterQualityPoints = 0;
    let currentSemesterCreditHours = 0;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentSemester = currentMonth >= 8 ? 'Fall' : currentMonth >= 1 ? 'Spring' : 'Winter';

    for (const classInfo of classes) {
      const gpaInfo = classGpaInfos.find(info => info.class_id === classInfo.id);
      
      if (!gpaInfo) continue; // Skip classes without GPA info

      // Get current grade for the class
      const classWithGrades = await getClassWithGrades(classInfo.id, userId, useSupabase);
      const currentGrade = classWithGrades ? calculateClassCurrentGrade(classWithGrades) : 0;
      
      // Use final grade if completed, otherwise use current grade
      const finalGrade = gpaInfo.is_completed ? (gpaInfo.final_gpa || 0) : currentGrade;
      const letterGrade = gpaInfo.is_completed ? 
        (gpaInfo.final_grade || calculateLetterGrade(finalGrade, gpaSettings)) :
        calculateLetterGrade(finalGrade, gpaSettings);
      
      const qualityPoints = getQualityPoints(letterGrade, gpaSettings) * gpaInfo.credit_hours;
      
      classGrades.push({
        classId: classInfo.id,
        className: classInfo.name,
        currentGrade: finalGrade,
        letterGrade,
        creditHours: gpaInfo.credit_hours,
        qualityPoints,
        isCompleted: gpaInfo.is_completed
      });

      totalQualityPoints += qualityPoints;
      totalCreditHours += gpaInfo.credit_hours;

      // Track current semester
      if (gpaInfo.year === currentYear && gpaInfo.semester === currentSemester) {
        currentSemesterQualityPoints += qualityPoints;
        currentSemesterCreditHours += gpaInfo.credit_hours;
      }
    }

    const cumulativeGPA = totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;
    const semesterGPA = currentSemesterCreditHours > 0 ? 
      currentSemesterQualityPoints / currentSemesterCreditHours : 0;

    return {
      currentGPA: Math.round(cumulativeGPA * 100) / 100,
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      totalCreditHours,
      totalQualityPoints: Math.round(totalQualityPoints * 100) / 100,
      semesterGPA: Math.round(semesterGPA * 100) / 100,
      classGrades
    };
  } catch (error) {
    logger.error('[calculateFullGPA] Error:', error);
    return {
      currentGPA: 0,
      cumulativeGPA: 0,
      totalCreditHours: 0,
      totalQualityPoints: 0,
      semesterGPA: 0,
      classGrades: []
    };
  }
};

// What-If Scenario Calculator
export const calculateWhatIfScenario = async (
  userId: string,
  changes: GradeChange[],
  useSupabase = false
): Promise<WhatIfScenario> => {
  try {
    // Get current GPA
    const currentGPA = await calculateFullGPA(userId, useSupabase);
    
    // Get GPA settings
    const gpaSettings = await initializeGpaSettings(userId, useSupabase);
    
    // Calculate new GPA with changes
    const modifiedClassGrades = [...currentGPA.classGrades];
    
    for (const change of changes) {
      // Find the assignment and its class
      const classGrade = modifiedClassGrades.find(cg => 
        cg.classId === change.className || // If className is actually classId
        cg.className === change.className
      );
      
      if (!classGrade) continue;

      // Get the class with grades to recalculate
      const classWithGrades = await getClassWithGrades(classGrade.classId, userId, useSupabase);
      if (!classWithGrades) continue;

      // Simulate the grade change
      const assignment = classWithGrades.assignments.find(a => a.id === change.assignmentId);
      if (!assignment) continue;

      // Create a copy with the modified grade
      const modifiedAssignments = classWithGrades.assignments.map(a => {
        if (a.id === change.assignmentId) {
          return {
            ...a,
            grade: {
              ...a.grade!,
              points_earned: change.pointsEarned,
              percentage: (change.pointsEarned / change.pointsPossible) * 100
            }
          };
        }
        return a;
      });

      // Recalculate class grade
      const newClassGrade = calculateClassCurrentGrade({
        ...classWithGrades,
        assignments: modifiedAssignments
      });

      const newLetterGrade = calculateLetterGrade(newClassGrade, gpaSettings);
      const newQualityPoints = getQualityPoints(newLetterGrade, gpaSettings) * classGrade.creditHours;

      // Update the class grade
      classGrade.currentGrade = newClassGrade;
      classGrade.letterGrade = newLetterGrade;
      classGrade.qualityPoints = newQualityPoints;
    }

    // Recalculate total GPA with changes
    const newTotalQualityPoints = modifiedClassGrades.reduce((sum, cg) => sum + cg.qualityPoints, 0);
    const newTotalCreditHours = modifiedClassGrades.reduce((sum, cg) => sum + cg.creditHours, 0);
    const newGPA = newTotalCreditHours > 0 ? newTotalQualityPoints / newTotalCreditHours : 0;

    const gpaChange = newGPA - currentGPA.currentGPA;

    return {
      scenarioName: `What-if with ${changes.length} change${changes.length === 1 ? '' : 's'}`,
      changes,
      resultingGPA: Math.round(newGPA * 100) / 100,
      gpaChange: Math.round(gpaChange * 100) / 100
    };
  } catch (error) {
    logger.error('[calculateWhatIfScenario] Error:', error);
    return {
      scenarioName: 'Error calculating scenario',
      changes,
      resultingGPA: 0,
      gpaChange: 0
    };
  }
};

// Calculate what grade is needed on an assignment to achieve target class grade
export const calculateNeededGrade = async (
  classId: string,
  assignmentId: string,
  targetGrade: number,
  userId: string,
  useSupabase = false
): Promise<{ neededPercentage: number; neededPoints: number; isPossible: boolean }> => {
  try {
    const classWithGrades = await getClassWithGrades(classId, userId, useSupabase);
    if (!classWithGrades) {
      return { neededPercentage: 0, neededPoints: 0, isPossible: false };
    }

    const assignment = classWithGrades.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { neededPercentage: 0, neededPoints: 0, isPossible: false };
    }

    // Calculate current grade without this assignment
    const otherAssignments = classWithGrades.assignments.filter(a => a.id !== assignmentId);
    const currentGradeWithoutAssignment = calculateClassCurrentGrade({
      ...classWithGrades,
      assignments: otherAssignments
    });

    // Find the category weight for this assignment
    const category = classWithGrades.categories.find(c => c.id === assignment.category_id);
    if (!category) {
      return { neededPercentage: 0, neededPoints: 0, isPossible: false };
    }

    // Calculate what percentage this assignment needs to achieve target
    const categoryWeight = category.weight / 100;
    const otherCategoriesWeight = (100 - category.weight) / 100;
    
    // Simplified calculation: assumes this is the only assignment in category
    // More complex logic would be needed for multiple assignments per category
    const neededAssignmentScore = (targetGrade - (currentGradeWithoutAssignment * otherCategoriesWeight)) / categoryWeight;
    
    const neededPoints = (neededAssignmentScore / 100) * assignment.points_possible;
    const isPossible = neededAssignmentScore <= 100 && neededAssignmentScore >= 0;

    return {
      neededPercentage: Math.round(neededAssignmentScore * 100) / 100,
      neededPoints: Math.round(neededPoints * 100) / 100,
      isPossible
    };
  } catch (error) {
    logger.error('[calculateNeededGrade] Error:', error);
    return { neededPercentage: 0, neededPoints: 0, isPossible: false };
  }
};