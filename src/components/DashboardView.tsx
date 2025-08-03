import React, { useState, useEffect, useMemo } from "react";
import { getTasks, getTaskTypes } from "../services/dataService";
import type { TaskWithMeta, TaskType, ClassWithRelations } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import { getEventStyle } from "../utils/taskStyles";
import { formatDateForInput, formatTimeForDisplay } from "../utils/dateHelpers";
import { validateAuthState } from "../utils/authHelpers";
import classService from "../services/classService";
import { logger } from "../utils/logger";

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  thisWeekTasks: number;
  completionRate: number;
}

interface ClassStats {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

interface TaskTypeStats {
  id: string;
  name: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}

interface DashboardViewProps {
  onTaskEdit?: (task: TaskWithMeta) => void;
  onSwitchToTasks?: () => void;
  onSwitchToCalendar?: () => void;
  onSwitchToGrades?: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  onTaskEdit, 
  onSwitchToTasks, 
  onSwitchToCalendar,
  onSwitchToGrades
}) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp } = useAuth();
  
  // State management
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  // Load data when auth state is ready
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        logger.debug('Loading dashboard data for user', { userId: user.id });
        
        const fetchedTasks = await getTasks(user.id, isAuthenticated);
        setTasks(fetchedTasks || []);
        
        const fetchedClasses = await classService.refreshClasses(user.id, isAuthenticated);
        setClasses(fetchedClasses || []);
        
        const fetchedTaskTypes = await getTaskTypes(user.id, isAuthenticated);
        setTaskTypes(fetchedTaskTypes || []);
      }
    };
    loadData();
  }, [loading, isAuthenticated, user, user?.id, lastCalendarSyncTimestamp]);

  // Subscribe to class changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      classService.reset();
      return;
    }

    const unsubscribe = classService.subscribe((updatedClasses: ClassWithRelations[]) => {
      setClasses(updatedClasses);
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo((): DashboardStats => {
    const today = formatDateForInput(new Date());
    const weekFromToday = formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    const overdueTasks = tasks.filter(task => {
      if (task.completed) return false;
      const dueDate = task.dueDate || task.date;
      return dueDate && dueDate < today;
    }).length;
    
    const todayTasks = tasks.filter(task => {
      const dueDate = task.dueDate || task.date;
      return dueDate === today;
    }).length;
    
    const thisWeekTasks = tasks.filter(task => {
      const dueDate = task.dueDate || task.date;
      return dueDate && dueDate >= today && dueDate <= weekFromToday;
    }).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      thisWeekTasks,
      completionRate
    };
  }, [tasks]);

  // Calculate class statistics
  const classStats = useMemo((): ClassStats[] => {
    return classes.map(cls => {
      const classTasks = tasks.filter(task => task.class === cls.id);
      const totalTasks = classTasks.length;
      const completedTasks = classTasks.filter(task => task.completed).length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: cls.id,
        name: cls.name || 'Unnamed Class',
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate
      };
    }).filter(stat => stat.totalTasks > 0) // Only show classes with tasks
      .sort((a, b) => b.totalTasks - a.totalTasks); // Sort by task count
  }, [tasks, classes]);

  // Standardized color palette for task types
  const getStandardizedColor = (originalColor: string, typeName: string, index: number): string => {
    const standardColors = [
      '#3B82F6', // Blue - Professional, calm
      '#10B981', // Green - Success, growth
      '#F59E0B', // Amber - Warning, attention
      '#EF4444', // Red - Urgent, important
      '#8B5CF6', // Purple (better) - Creative, unique
      '#06B6D4', // Cyan - Fresh, modern
      '#EC4899', // Pink - Engaging, friendly
      '#84CC16', // Lime - Energy, positive
      '#6366F1', // Indigo - Professional, trustworthy
      '#F97316'  // Orange - Energetic, warm
    ];
    
    // Force standardized colors based on task type name for consistency
    const typeColorMap: Record<string, string> = {
      'homework': '#3B82F6',    // Blue
      'assignment': '#3B82F6',  // Blue
      'exam': '#EF4444',        // Red
      'final': '#EF4444',       // Red
      'midterm': '#F59E0B',     // Amber
      'mid term': '#F59E0B',    // Amber  
      'quiz': '#10B981',        // Green
      'project': '#8B5CF6',     // Purple
      'lab': '#06B6D4',         // Cyan
      'payment': '#84CC16',     // Lime
      'presentation': '#EC4899', // Pink
      'paper': '#6366F1'        // Indigo
    };
    
    // Check if we have a specific color for this type name
    const lowerTypeName = typeName.toLowerCase();
    if (typeColorMap[lowerTypeName]) {
      return typeColorMap[lowerTypeName];
    }
    
    // Replace any ugly/problematic colors
    if (originalColor === '#8b5cf6' || originalColor === '#8B5CF6') {
      return '#F59E0B'; // Use amber instead of purple for better visibility
    }
    
    // Use standardized palette for any remaining types
    return standardColors[index % standardColors.length];
  };

  // Calculate task type statistics
  const taskTypeStats = useMemo((): TaskTypeStats[] => {
    return taskTypes.map((type, index) => {
      const typeTasks = tasks.filter(task => task.type === type.id);
      const totalTasks = typeTasks.length;
      const completedTasks = typeTasks.filter(task => task.completed).length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: type.id,
        name: type.name || 'Unnamed Type',
        color: getStandardizedColor(type.color || '#3B82F6', type.name || 'Unnamed Type', index),
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate
      };
    }).filter(stat => stat.totalTasks > 0) // Only show types with tasks
      .sort((a, b) => b.totalTasks - a.totalTasks); // Sort by task count
  }, [tasks, taskTypes]);

  // Get upcoming tasks (next 7 days, not completed)
  const upcomingTasks = useMemo(() => {
    const today = formatDateForInput(new Date());
    const weekFromToday = formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
    return tasks
      .filter(task => {
        if (task.completed) return false;
        const dueDate = task.dueDate || task.date;
        return dueDate && dueDate >= today && dueDate <= weekFromToday;
      })
      .sort((a, b) => {
        const aDate = a.dueDate || a.date || '';
        const bDate = b.dueDate || b.date || '';
        return aDate.localeCompare(bDate);
      })
      .slice(0, 10); // Show only first 10
  }, [tasks]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    const today = formatDateForInput(new Date());
    
    return tasks
      .filter(task => {
        if (task.completed) return false;
        const dueDate = task.dueDate || task.date;
        return dueDate && dueDate < today;
      })
      .sort((a, b) => {
        const aDate = a.dueDate || a.date || '';
        const bDate = b.dueDate || b.date || '';
        return aDate.localeCompare(bDate);
      })
      .slice(0, 5); // Show only first 5
  }, [tasks]);

  // Validate auth state
  const authState = validateAuthState(user, isAuthenticated, loading);
  
  if (!authState.isValid) {
    if (authState.reason === 'loading') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  const getTaskClassName = (task: TaskWithMeta) => {
    return classes.find(c => c.id === task.class)?.name || 'No Class';
  };

  const getTaskTypeName = (task: TaskWithMeta) => {
    return taskTypes.find(t => t.id === task.type)?.name || 'No Type';
  };

  const StatCard: React.FC<{ 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    color?: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, color = 'blue', onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-md p-4 sm:p-6 transition-smooth ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] min-h-[88px] touch-manipulation' : 'min-h-[88px]'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your tasks and productivity</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Tasks"
            value={dashboardStats.totalTasks}
            onClick={onSwitchToTasks}
          />
          <StatCard
            title="Completion Rate"
            value={`${dashboardStats.completionRate}%`}
            subtitle={`${dashboardStats.completedTasks} of ${dashboardStats.totalTasks} completed`}
            color="green"
          />
          <StatCard
            title="Overdue Tasks"
            value={dashboardStats.overdueTasks}
            color="red"
            onClick={onSwitchToTasks}
          />
          <StatCard
            title="Due This Week"
            value={dashboardStats.thisWeekTasks}
            color="yellow"
            onClick={onSwitchToTasks}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
              <button
                onClick={onSwitchToTasks}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
            
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-gray-500">No upcoming tasks</p>
                <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const style = getEventStyle(task, taskTypes);
                  const className = getTaskClassName(task);
                  const dueDate = task.dueDate || task.date;
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-l-4 ${style.border} bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors`}
                      onClick={() => onTaskEdit?.(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {task.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                            <span>{className}</span>
                            {dueDate && (
                              <span>
                                {new Date(dueDate).toLocaleDateString()}
                                {task.dueTime && ` at ${formatTimeForDisplay(task.dueTime)}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Overdue Tasks</h2>
              {overdueTasks.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {overdueTasks.length}
                </span>
              )}
            </div>
            
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-gray-500">No overdue tasks</p>
                <p className="text-gray-400 text-sm mt-1">Great job staying on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => {
                  const style = getEventStyle(task, taskTypes);
                  const className = getTaskClassName(task);
                  const dueDate = task.dueDate || task.date;
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-l-4 border-red-400 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors`}
                      onClick={() => onTaskEdit?.(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 truncate">
                            {task.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-4 text-sm text-red-700">
                            <span>{className}</span>
                            {dueDate && (
                              <span>
                                Due: {new Date(dueDate).toLocaleDateString()}
                                {task.dueTime && ` at ${formatTimeForDisplay(task.dueTime)}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Class Performance */}
        {classStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance by Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStats.map((stat) => (
                <div key={stat.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                      {stat.name}
                    </h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      stat.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                      stat.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stat.completionRate}%
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Tasks:</span>
                      <span className="font-medium">{stat.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">{stat.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-medium text-blue-600">{stat.pendingTasks}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stat.completionRate >= 80 ? 'bg-green-500' :
                          stat.completionRate >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${stat.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Type Breakdown */}
        {taskTypeStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Task Type Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskTypeStats.map((stat) => (
                <div key={stat.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      ></div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {stat.name}
                      </h3>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      stat.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                      stat.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stat.completionRate}%
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Tasks:</span>
                      <span className="font-medium">{stat.totalTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">{stat.completedTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-medium text-blue-600">{stat.pendingTasks}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: stat.color,
                          width: `${stat.completionRate}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade Tracking Quick Access */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Grade Tracking</h2>
            <button
              onClick={onSwitchToGrades}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              View Grades
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              onClick={onSwitchToGrades}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">GPA Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600">View your current GPA, class performance, and grade analytics</p>
            </div>

            <div 
              onClick={() => {
                onSwitchToGrades?.();
                // Switch to entry view - this will be handled in the parent component
              }}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg cursor-pointer hover:from-green-100 hover:to-green-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Add Grades</h3>
              </div>
              <p className="text-sm text-gray-600">Enter assignment grades and manage your grade categories</p>
            </div>

            <div 
              onClick={onSwitchToGrades}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">What-If Scenarios</h3>
              </div>
              <p className="text-sm text-gray-600">Calculate how grades affect your GPA with interactive scenarios</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardView);