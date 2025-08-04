import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getClassWithGrades, 
  addAssignment, 
  addGrade, 
  getGradeCategoriesByClass,
  addGradeCategory,
  createAssignmentFromTask 
} from '../services/grade/gradeOperations';
import { updateClassGpaInfo, initializeGpaSettings } from '../services/grade/gpaService';
import { getClasses } from '../services/class/classOperations';
import type { 
  Class, 
  GradeCategory, 
  AssignmentInsert, 
  GradeInsert,
  GradeCategoryInsert,
  ClassGpaInfoInsert
} from '../types/database';

interface GradeEntryProps {
  onGradeAdded?: () => void;
  initialClassId?: string;
}

const GradeEntry: React.FC<GradeEntryProps> = ({ onGradeAdded, initialClassId }) => {
  const { user, isAuthenticated } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || '');
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignment' | 'category' | 'class-setup'>('assignment');

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    pointsPossible: '',
    dueDate: '',
    isExtraCredit: false
  });

  // Grade form state
  const [gradeForm, setGradeForm] = useState({
    pointsEarned: '',
    percentage: '',
    letterGrade: '',
    feedback: '',
    gradedAt: new Date().toISOString().split('T')[0]
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    weight: '',
    dropLowest: '0',
    color: '#6b7280'
  });

  // Class setup form state
  const [classSetupForm, setClassSetupForm] = useState({
    creditHours: '3',
    semester: 'Fall',
    year: new Date().getFullYear().toString()
  });

  // Load classes and initialize
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      try {
        const classesData = await getClasses(user.id, isAuthenticated);
        setClasses(classesData);
        
        // Initialize GPA settings if this is first time
        await initializeGpaSettings(user.id, isAuthenticated);
        
        if (initialClassId && classesData.some(c => c.id === initialClassId)) {
          setSelectedClassId(initialClassId);
        } else if (classesData.length > 0 && !selectedClassId) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };

    loadData();
  }, [user?.id, isAuthenticated, initialClassId, selectedClassId]);

  // Load categories when class changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!selectedClassId || !user?.id) return;
      
      try {
        const categoriesData = await getGradeCategoriesByClass(selectedClassId, user.id, isAuthenticated);
        setCategories(categoriesData);
        
        if (categoriesData.length > 0 && !assignmentForm.categoryId) {
          setAssignmentForm(prev => ({ ...prev, categoryId: categoriesData[0].id }));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [selectedClassId, user?.id, isAuthenticated, assignmentForm.categoryId]);

  // Handle assignment creation with grade
  const handleSubmitAssignmentWithGrade = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedClassId) return;

    setLoading(true);
    try {
      // Create assignment
      const assignmentData: AssignmentInsert = {
        user_id: user.id,
        class_id: selectedClassId,
        name: assignmentForm.name,
        description: assignmentForm.description || undefined,
        category_id: assignmentForm.categoryId,
        points_possible: Number(assignmentForm.pointsPossible),
        due_date: assignmentForm.dueDate || undefined,
        is_extra_credit: assignmentForm.isExtraCredit
      };

      const newAssignment = await addAssignment(assignmentData, isAuthenticated);
      if (!newAssignment) throw new Error('Failed to create assignment');

      // Create grade if provided
      if (gradeForm.pointsEarned || gradeForm.percentage) {
        const pointsEarned = gradeForm.pointsEarned ? 
          Number(gradeForm.pointsEarned) : 
          (Number(gradeForm.percentage) / 100) * Number(assignmentForm.pointsPossible);

        const percentage = gradeForm.percentage ? 
          Number(gradeForm.percentage) : 
          (pointsEarned / Number(assignmentForm.pointsPossible)) * 100;

        const gradeData: GradeInsert = {
          user_id: user.id,
          assignment_id: newAssignment.id,
          points_earned: pointsEarned,
          percentage,
          letter_grade: gradeForm.letterGrade || undefined,
          feedback: gradeForm.feedback || undefined,
          graded_at: gradeForm.gradedAt || undefined
        };

        await addGrade(gradeData, isAuthenticated);
      }

      // Reset forms
      setAssignmentForm({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        pointsPossible: '',
        dueDate: '',
        isExtraCredit: false
      });
      setGradeForm({
        pointsEarned: '',
        percentage: '',
        letterGrade: '',
        feedback: '',
        gradedAt: new Date().toISOString().split('T')[0]
      });

      onGradeAdded?.();
    } catch (error) {
      console.error('Error creating assignment and grade:', error);
      alert('Error creating assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedClassId, assignmentForm, gradeForm, categories, isAuthenticated, onGradeAdded]);

  // Handle category creation
  const handleSubmitCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedClassId) return;

    setLoading(true);
    try {
      const categoryData: GradeCategoryInsert = {
        user_id: user.id,
        class_id: selectedClassId,
        name: categoryForm.name,
        weight: Number(categoryForm.weight),
        drop_lowest: Number(categoryForm.dropLowest),
        color: categoryForm.color
      };

      const newCategory = await addGradeCategory(categoryData, isAuthenticated);
      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        setCategoryForm({
          name: '',
          weight: '',
          dropLowest: '0',
          color: '#6b7280'
        });
        
        // Switch back to assignment tab
        setActiveTab('assignment');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedClassId, categoryForm, isAuthenticated]);

  // Handle class setup
  const handleSubmitClassSetup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedClassId) return;

    setLoading(true);
    try {
      const classGpaData: ClassGpaInfoInsert = {
        user_id: user.id,
        class_id: selectedClassId,
        credit_hours: Number(classSetupForm.creditHours),
        semester: classSetupForm.semester,
        year: Number(classSetupForm.year),
        is_completed: false
      };

      await updateClassGpaInfo(classGpaData, isAuthenticated);
      
      // Switch to assignment tab after setup
      setActiveTab('assignment');
    } catch (error) {
      console.error('Error setting up class:', error);
      alert('Error setting up class. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedClassId, classSetupForm, isAuthenticated]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800/95 rounded-lg shadow dark:shadow-slate-900/20 dark:border dark:border-slate-700/50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Grade Entry</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Add assignments, grades, and manage your grade categories</p>
        </div>

        {/* Class Selection */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700/50">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Select Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          >
            <option value="">Select a class...</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <>
            {/* Tab Navigation */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50">
              <nav className="flex space-x-8">
                {[
                  { id: 'assignment', label: 'Add Assignment & Grade', icon: '📝' },
                  { id: 'category', label: 'Manage Categories', icon: '📊' },
                  { id: 'class-setup', label: 'Class Setup', icon: '⚙️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Assignment & Grade Tab */}
              {activeTab === 'assignment' && (
                <form onSubmit={handleSubmitAssignmentWithGrade} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assignment Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Assignment Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Assignment Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={assignmentForm.name}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                          placeholder="Homework 1, Midterm Exam, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Category *
                        </label>
                        <select
                          required
                          value={assignmentForm.categoryId}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, categoryId: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        >
                          <option value="">Select category...</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name} ({category.weight}%)
                            </option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            No categories found. Create one in the Categories tab first.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Points Possible *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.1"
                            value={assignmentForm.pointsPossible}
                            onChange={(e) => setAssignmentForm(prev => ({ ...prev, pointsPossible: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={assignmentForm.dueDate}
                            onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={assignmentForm.isExtraCredit}
                            onChange={(e) => setAssignmentForm(prev => ({ ...prev, isExtraCredit: e.target.checked }))}
                            className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Extra Credit</span>
                        </label>
                      </div>
                    </div>

                    {/* Grade Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Grade (Optional)</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Leave blank if not graded yet</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Points Earned
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={gradeForm.pointsEarned}
                            onChange={(e) => {
                              const points = e.target.value;
                              setGradeForm(prev => ({ 
                                ...prev, 
                                pointsEarned: points,
                                percentage: points && assignmentForm.pointsPossible ? 
                                  ((Number(points) / Number(assignmentForm.pointsPossible)) * 100).toFixed(1) : 
                                  ''
                              }));
                            }}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="85"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Percentage
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={gradeForm.percentage}
                            onChange={(e) => {
                              const percentage = e.target.value;
                              setGradeForm(prev => ({ 
                                ...prev, 
                                percentage,
                                pointsEarned: percentage && assignmentForm.pointsPossible ? 
                                  ((Number(percentage) / 100) * Number(assignmentForm.pointsPossible)).toFixed(1) : 
                                  ''
                              }));
                            }}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="85.0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Letter Grade
                        </label>
                        <select
                          value={gradeForm.letterGrade}
                          onChange={(e) => setGradeForm(prev => ({ ...prev, letterGrade: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        >
                          <option value="">Auto-calculate</option>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B">B</option>
                          <option value="B-">B-</option>
                          <option value="C+">C+</option>
                          <option value="C">C</option>
                          <option value="C-">C-</option>
                          <option value="D+">D+</option>
                          <option value="D">D</option>
                          <option value="D-">D-</option>
                          <option value="F">F</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Feedback
                        </label>
                        <textarea
                          value={gradeForm.feedback}
                          onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                          rows={3}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                          placeholder="Teacher comments or notes..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50">
                    <button
                      type="submit"
                      disabled={loading || !assignmentForm.name || !assignmentForm.categoryId || !assignmentForm.pointsPossible}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Adding...' : 'Add Assignment'}
                    </button>
                  </div>
                </form>
              )}

              {/* Category Management Tab */}
              {activeTab === 'category' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Current Categories</h3>
                    {categories.length > 0 ? (
                      <div className="space-y-2">
                        {categories.map(category => (
                          <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg bg-white dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium text-gray-900 dark:text-slate-100">{category.name}</span>
                              <span className="text-sm text-gray-600 dark:text-slate-400">({category.weight}%)</span>
                              {category.drop_lowest && category.drop_lowest > 0 && (
                                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
                                  Drop {category.drop_lowest} lowest
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                          Total weight: {categories.reduce((sum, cat) => sum + cat.weight, 0)}%
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-slate-400">No categories created yet.</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-slate-700/50 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Add New Category</h3>
                    <form onSubmit={handleSubmitCategory} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="Homework, Exams, Projects, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Weight (%) *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            value={categoryForm.weight}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, weight: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="30"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Drop Lowest (optional)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={categoryForm.dropLowest}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, dropLowest: e.target.value }))}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Color
                          </label>
                          <input
                            type="color"
                            value={categoryForm.color}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !categoryForm.name || !categoryForm.weight}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Adding...' : 'Add Category'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Class Setup Tab */}
              {activeTab === 'class-setup' && (
                <form onSubmit={handleSubmitClassSetup} className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                    Class Setup for {selectedClass?.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Configure credit hours and semester information for GPA calculation.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Credit Hours *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="6"
                        step="0.5"
                        value={classSetupForm.creditHours}
                        onChange={(e) => setClassSetupForm(prev => ({ ...prev, creditHours: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Semester *
                      </label>
                      <select
                        required
                        value={classSetupForm.semester}
                        onChange={(e) => setClassSetupForm(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      >
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                        <option value="Winter">Winter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Year *
                      </label>
                      <input
                        type="number"
                        required
                        min="2020"
                        max="2030"
                        value={classSetupForm.year}
                        onChange={(e) => setClassSetupForm(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Class Setup'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {!selectedClassId && classes.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 dark:text-slate-400 mb-4">No classes found. Create a class first to start tracking grades.</p>
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Create Your First Class
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeEntry;