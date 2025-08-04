import type { 
  GradeCategoryInsert, 
  AssignmentInsert, 
  GradeInsert,
  ClassGpaInfoInsert 
} from '../../types/database';
import { logger } from '../../utils/logger';
import {
  addGradeCategory,
  addAssignment,
  addGrade,
  getClassWithGrades
} from './gradeOperations';
import {
  updateClassGpaInfo,
  calculateFullGPA,
  calculateWhatIfScenario,
  initializeGpaSettings
} from './gpaService';

/**
 * Demo function to set up sample grade data for testing
 * This helps users understand how the grade tracking system works
 */
export const setupSampleGradeData = async (
  userId: string, 
  classId: string, 
  className: string,
  useSupabase = false
) => {
  try {
    logger.info(`Setting up sample grade data for ${className}...`);

    // Initialize GPA settings
    await initializeGpaSettings(userId, useSupabase);

    // Setup class GPA info (3 credit hours, Fall 2024)
    const classGpaInfo: ClassGpaInfoInsert = {
      user_id: userId,
      class_id: classId,
      credit_hours: 3,
      semester: 'Fall',
      year: 2024,
      is_completed: false
    };
    await updateClassGpaInfo(classGpaInfo, useSupabase);

    // Create grade categories
    const categories = [
      { name: 'Homework', weight: 30, color: '#3b82f6' },
      { name: 'Exams', weight: 40, color: '#ef4444' },
      { name: 'Projects', weight: 20, color: '#10b981' },
      { name: 'Participation', weight: 10, color: '#f59e0b' }
    ];

    const createdCategories = [];
    for (const category of categories) {
      const categoryData: GradeCategoryInsert = {
        user_id: userId,
        class_id: classId,
        name: category.name,
        weight: category.weight,
        color: category.color,
        drop_lowest: category.name === 'Homework' ? 1 : 0 // Drop lowest homework
      };
      
      const created = await addGradeCategory(categoryData, useSupabase);
      if (created) createdCategories.push(created);
    }

    // Create sample assignments with grades
    const sampleAssignments = [
      // Homework (30%)
      { name: 'HW 1: Basic Concepts', category: 'Homework', points: 100, earned: 92 },
      { name: 'HW 2: Problem Solving', category: 'Homework', points: 100, earned: 88 },
      { name: 'HW 3: Applications', category: 'Homework', points: 100, earned: 95 },
      { name: 'HW 4: Advanced Topics', category: 'Homework', points: 100, earned: 78 }, // Will be dropped (lowest)
      
      // Exams (40%)
      { name: 'Midterm Exam', category: 'Exams', points: 200, earned: 172 }, // 86%
      { name: 'Final Exam', category: 'Exams', points: 200, earned: null }, // Not taken yet
      
      // Projects (20%)
      { name: 'Group Project', category: 'Projects', points: 150, earned: 138 }, // 92%
      
      // Participation (10%)
      { name: 'Class Participation', category: 'Participation', points: 100, earned: 95 }
    ];

    for (const assignmentData of sampleAssignments) {
      const category = createdCategories.find(c => c.name === assignmentData.category);
      if (!category) continue;

      // Create assignment
      const assignment: AssignmentInsert = {
        user_id: userId,
        class_id: classId,
        name: assignmentData.name,
        category_id: category.id,
        points_possible: assignmentData.points,
        due_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Random past date
      };

      const createdAssignment = await addAssignment(assignment, useSupabase);
      if (!createdAssignment) continue;

      // Add grade if earned points exist
      if (assignmentData.earned !== null) {
        const grade: GradeInsert = {
          user_id: userId,
          assignment_id: createdAssignment.id,
          points_earned: assignmentData.earned,
          percentage: (assignmentData.earned / assignmentData.points) * 100,
          graded_at: new Date().toISOString()
        };

        await addGrade(grade, useSupabase);
      }
    }

    logger.info(`✅ Sample grade data created for ${className}`);
    
    // Calculate and display current GPA
    const gpaData = await calculateFullGPA(userId, useSupabase);
    logger.info(`📊 Current GPA: ${gpaData.currentGPA}`);
    
    // Get class with grades to show current performance
    const classWithGrades = await getClassWithGrades(classId, userId, useSupabase);
    if (classWithGrades) {
      logger.info(`📋 ${className} current grade: ${classWithGrades.currentGrade?.toFixed(1)}% (${classWithGrades.currentLetterGrade})`);
    }

    return {
      success: true,
      message: `Sample data created for ${className}`,
      gpaData
    };

  } catch (error) {
    console.error('Error setting up sample grade data:', error);
    return {
      success: false,
      message: 'Failed to create sample data',
      error
    };
  }
};

/**
 * Demo function to show what-if scenario calculations
 */
export const demoWhatIfScenarios = async (userId: string, useSupabase = false) => {
  try {
    logger.info('🎯 Demo: What-If Scenarios');

    // Get current GPA
    const currentGPA = await calculateFullGPA(userId, useSupabase);
    logger.info(`Current GPA: ${currentGPA.currentGPA}`);

    // Example: What if I get an A on my final exam?
    // This would need actual assignment IDs from the database
    logger.info('\n📈 What-if scenarios:');
    logger.info('1. "What if I get 95% on my final exam?"');
    logger.info('2. "What grade do I need on the final to get an A in the class?"');
    logger.info('3. "How would dropping this class affect my GPA?"');
    
    // Note: Actual implementation would require real assignment IDs
    logger.info('\n💡 Use the interactive grade sliders in the dashboard to test scenarios!');

    return currentGPA;
  } catch (error) {
    console.error('Error in what-if demo:', error);
    return null;
  }
};

/**
 * Helper function to create a complete demo setup
 */
export const createFullGradeDemo = async (userId: string, useSupabase = false) => {
  console.log('🚀 Creating full grade tracking demo...');

  // Sample classes
  const demoClasses = [
    { id: 'cs101', name: 'Computer Science 101' },
    { id: 'math120', name: 'Calculus I' },
    { id: 'eng110', name: 'English Composition' }
  ];

  const results = [];
  for (const demoClass of demoClasses) {
    const result = await setupSampleGradeData(
      userId, 
      demoClass.id, 
      demoClass.name, 
      useSupabase
    );
    results.push(result);
  }

  // Show final GPA calculation
  const finalGPA = await calculateFullGPA(userId, useSupabase);
  console.log('\n🎓 Final Results:');
  console.log(`Cumulative GPA: ${finalGPA.cumulativeGPA}`);
  console.log(`Semester GPA: ${finalGPA.semesterGPA}`);
  console.log(`Total Credit Hours: ${finalGPA.totalCreditHours}`);

  // Demo what-if scenarios
  await demoWhatIfScenarios(userId, useSupabase);

  return {
    success: true,
    message: 'Full demo created successfully',
    gpaData: finalGPA,
    classResults: results
  };
};