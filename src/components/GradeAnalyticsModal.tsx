import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calculateFullGPA } from '../services/grade/gpaService';
import { getClassWithGrades } from '../services/grade/gradeOperations';
import type { 
  GPACalculation, 
  ClassWithGrades, 
  ClassGradeInfo,
  AssignmentWithGrade 
} from '../types/database';

interface GradeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChartData {
  gpaHistory: { date: string; gpa: number; semester: string }[];
  classPerformance: { className: string; grade: number; letterGrade: string; creditHours: number }[];
  categoryBreakdown: { category: string; percentage: number; color: string; assignmentCount: number }[];
  assignmentTrends: { date: string; grade: number; assignmentName: string; className: string }[];
}

const GradeAnalyticsModal: React.FC<GradeAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [gpaData, setGpaData] = useState<GPACalculation | null>(null);
  const [classesWithGrades, setClassesWithGrades] = useState<ClassWithGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'classes' | 'categories'>('overview');

  // Load grade data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user?.id || !isOpen) return;
      
      setLoading(true);
      try {
        // Get user's academic system preference
        const generalSettings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
        const userAcademicSystem = generalSettings?.academicSystem || 'semester';
        
        const gpaCalc = await calculateFullGPA(user.id, isAuthenticated, userAcademicSystem);
        setGpaData(gpaCalc);

        // Load detailed class information
        const classesData: ClassWithGrades[] = [];
        for (const classGrade of gpaCalc.classGrades) {
          const classWithGrades = await getClassWithGrades(classGrade.classId, user.id, isAuthenticated);
          if (classWithGrades) {
            classesData.push(classWithGrades);
          }
        }
        setClassesWithGrades(classesData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user?.id, isAuthenticated, isOpen]);

  // Process data for charts
  const chartData = useMemo((): ChartData => {
    if (!gpaData || !classesWithGrades.length) {
      return {
        gpaHistory: [],
        classPerformance: [],
        categoryBreakdown: [],
        assignmentTrends: []
      };
    }

    // GPA History (simulated - in real app would come from historical data)
    const gpaHistory = [
      { date: '2024-01', gpa: Math.max(gpaData.currentGPA - 0.3, 2.0), semester: 'Spring 2024' },
      { date: '2024-05', gpa: Math.max(gpaData.currentGPA - 0.15, 2.2), semester: 'Summer 2024' },
      { date: '2024-08', gpa: gpaData.currentGPA, semester: 'Fall 2024' }
    ];

    // Class Performance
    const classPerformance = gpaData.classGrades.map(classGrade => ({
      className: classGrade.className,
      grade: classGrade.currentGrade,
      letterGrade: classGrade.letterGrade,
      creditHours: classGrade.creditHours
    }));

    // Category Breakdown across all classes
    const categoryMap = new Map<string, { total: number; count: number; color: string }>();
    
    classesWithGrades.forEach(classData => {
      classData.categories.forEach(category => {
        const assignments = classData.assignments.filter(a => a.category_id === category.id && a.grade);
        if (assignments.length > 0) {
          const totalPoints = assignments.reduce((sum, a) => sum + a.points_possible, 0);
          const earnedPoints = assignments.reduce((sum, a) => sum + (a.grade?.points_earned || 0), 0);
          const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
          
          if (categoryMap.has(category.name)) {
            const existing = categoryMap.get(category.name)!;
            existing.total += percentage;
            existing.count += 1;
          } else {
            categoryMap.set(category.name, {
              total: percentage,
              count: 1,
              color: category.color || '#6b7280'
            });
          }
        }
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
      category: name,
      percentage: data.total / data.count,
      color: data.color,
      assignmentCount: data.count
    }));

    // Assignment Trends (last 20 assignments)
    const allAssignments: (AssignmentWithGrade & { className: string })[] = [];
    classesWithGrades.forEach(classData => {
      classData.assignments
        .filter(a => a.grade)
        .forEach(assignment => {
          allAssignments.push({
            ...assignment,
            className: classData.name
          });
        });
    });

    const assignmentTrends = allAssignments
      .sort((a, b) => new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime())
      .slice(-20)
      .map(assignment => ({
        date: assignment.due_date || '',
        grade: assignment.grade?.percentage || 0,
        assignmentName: assignment.name,
        className: assignment.className
      }));

    return {
      gpaHistory,
      classPerformance,
      categoryBreakdown,
      assignmentTrends
    };
  }, [gpaData, classesWithGrades]);

  const exportData = () => {
    const exportObj = {
      summary: {
        currentGPA: gpaData?.currentGPA,
        semesterGPA: gpaData?.semesterGPA,
        totalCreditHours: gpaData?.totalCreditHours,
        classCount: gpaData?.classGrades.length
      },
      classPerformance: chartData.classPerformance,
      categoryBreakdown: chartData.categoryBreakdown,
      assignmentTrends: chartData.assignmentTrends,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grade-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 dark:border-slate-700/50 w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Analytics</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">Detailed insights into your academic performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Export Data
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-slate-700/50">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'trends', name: 'GPA Trends', icon: '📈' },
              { id: 'classes', name: 'Class Performance', icon: '📚' },
              { id: 'categories', name: 'Category Breakdown', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !gpaData ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Grade Data</h3>
              <p className="text-gray-600 dark:text-slate-400">Start adding grades to see your analytics.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* GPA Summary */}
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GPA Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{gpaData.currentGPA}</div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Current GPA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{gpaData.semesterGPA}</div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Semester GPA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{gpaData.totalCreditHours}</div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Credit Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{gpaData.classGrades.length}</div>
                        <div className="text-sm text-gray-600 dark:text-slate-400">Classes</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Highest Grade</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {chartData.classPerformance.length > 0 
                            ? Math.max(...chartData.classPerformance.map(c => c.grade)).toFixed(1)
                            : '0.0'
                          }%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Average Grade</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {chartData.classPerformance.length > 0 
                            ? (chartData.classPerformance.reduce((sum, c) => sum + c.grade, 0) / chartData.classPerformance.length).toFixed(1)
                            : '0.0'
                          }%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Total Assignments</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {classesWithGrades.reduce((sum, c) => sum + c.assignments.filter(a => a.grade).length, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Grade Categories</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {chartData.categoryBreakdown.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GPA Trends Tab */}
              {activeTab === 'trends' && (
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GPA Trends Over Time</h3>
                  <div className="h-64 flex items-end justify-center space-x-4">
                    {chartData.gpaHistory.map((point, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600"
                          style={{ 
                            height: `${(point.gpa / 4.0) * 200}px`, 
                            width: '40px' 
                          }}
                        />
                        <div className="mt-2 text-center">
                          <div className="font-medium text-gray-900 dark:text-white">{point.gpa}</div>
                          <div className="text-xs text-gray-600 dark:text-slate-400">{point.semester}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Performance Tab */}
              {activeTab === 'classes' && (
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Performance Comparison</h3>
                  <div className="space-y-4">
                    {chartData.classPerformance.map((classData, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{classData.className}</div>
                          <div className="text-sm text-gray-600 dark:text-slate-400">{classData.creditHours} credit hours</div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">{classData.grade.toFixed(1)}%</div>
                            <div className={`text-sm font-medium px-2 py-1 rounded ${
                              classData.letterGrade === 'A' || classData.letterGrade === 'A+' || classData.letterGrade === 'A-' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                              classData.letterGrade.startsWith('B') 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                              classData.letterGrade.startsWith('C') 
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                              classData.letterGrade.startsWith('D') 
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                              {classData.letterGrade}
                            </div>
                          </div>
                          <div className="w-24 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(classData.grade / 100) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Breakdown Tab */}
              {activeTab === 'categories' && (
                <div className="bg-white dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-slate-700/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Category Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chartData.categoryBreakdown.map((category, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">{category.category}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            {category.assignmentCount} assignments
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {category.percentage.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${category.percentage}%`,
                              backgroundColor: category.color 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeAnalyticsModal;