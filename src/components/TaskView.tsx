import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
// Removed updateTask, deleteTask imports - now using taskService methods to avoid race conditions
import type { TaskWithMeta, TaskType, ClassWithRelations } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import { getEventStyle } from "../utils/taskStyles";
import { formatDateForInput, formatTimeForDisplay } from "../utils/dateHelpers";
import { validateAuthState } from "../utils/authHelpers";
import classService from "../services/classService";
import taskService from "../services/taskService";
import taskTypeService from "../services/taskTypeService";
import { logger } from "../utils/logger";
import type { TaskData } from "./TaskModal";
import TaskFilter from "./TaskFilter";
import { FilterService, FilterCriteria, SearchResult } from "../services/filterService";
import type { Task, Class } from "../types/index";

// Lazy load TaskModal for better performance
const TaskModal = lazy(() => import("./TaskModal"));

// Filter and sort options
type FilterType = 'all' | 'pending' | 'completed' | 'overdue' | 'today' | 'thisWeek';
type SortType = 'dueDate' | 'created' | 'priority' | 'title' | 'class';
type SortOrder = 'asc' | 'desc';

interface TaskViewProps {
  onTaskEdit?: (task: TaskWithMeta) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ onTaskEdit }) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp } = useAuth();
  
  // State management
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithMeta[]>([]);
  
  // New advanced filtering state
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Legacy filter and sort state (keep for backward compatibility)
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  
  // Selection and bulk operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  
  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Initialize services when auth state is ready
  useEffect(() => {
    const initializeServices = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        logger.debug('Initializing task view services for user', { userId: user.id });
        
        // Initialize all services in parallel for better performance
        await Promise.all([
          taskService.initialize(user.id, isAuthenticated),
          classService.initialize(user.id, isAuthenticated),
          taskTypeService.initialize(user.id, isAuthenticated)
        ]);
        
        // Set initial data from services
        setTasks(taskService.getCurrentTasks());
        setClasses(classService.getCurrentClasses());
        setTaskTypes(taskTypeService.getCurrentTaskTypes());
      } else if (!isAuthenticated) {
        // Reset services when not authenticated
        taskService.reset();
        classService.reset();
        taskTypeService.reset();
      }
    };
    initializeServices();
  }, [loading, isAuthenticated, user, user?.id, lastCalendarSyncTimestamp]);

  // Subscribe to service changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Subscribe to all services
    const unsubscribeClasses = classService.subscribe((updatedClasses: ClassWithRelations[]) => {
      setClasses(updatedClasses);
    });

    const unsubscribeTasks = taskService.subscribe((updatedTasks: TaskWithMeta[]) => {
      setTasks(updatedTasks);
    });

    const unsubscribeTaskTypes = taskTypeService.subscribe((updatedTaskTypes: TaskType[]) => {
      setTaskTypes(updatedTaskTypes);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeTasks();
      unsubscribeTaskTypes();
    };
  }, [isAuthenticated, user]);

  // Convert TaskWithMeta to Task interface for FilterService
  const convertToTask = useCallback((taskWithMeta: TaskWithMeta): Task => {
    return {
      id: taskWithMeta.id,
      user_id: taskWithMeta.user_id || user?.id || '',
      title: taskWithMeta.title || '',
      completed: taskWithMeta.completed || false,
      class: taskWithMeta.class,
      type: taskWithMeta.type,
      date: taskWithMeta.date,
      isDuration: taskWithMeta.isDuration,
      dueDate: taskWithMeta.dueDate,
      dueTime: taskWithMeta.dueTime,
      startDate: taskWithMeta.startDate,
      startTime: taskWithMeta.startTime,
      endDate: taskWithMeta.endDate,
      endTime: taskWithMeta.endTime,
      priority: taskWithMeta.priority,
      canvas_uid: taskWithMeta.canvas_uid,
      created_at: taskWithMeta.created_at || new Date().toISOString(),
      updated_at: taskWithMeta.updated_at
    };
  }, [user]);

  // Convert ClassWithRelations to Class interface for FilterService
  const convertToClass = useCallback((classWithRelations: ClassWithRelations): Class => {
    return {
      id: classWithRelations.id,
      user_id: classWithRelations.user_id || user?.id || '',
      name: classWithRelations.name,
      istaskclass: classWithRelations.isTaskClass,
      created_at: classWithRelations.created_at || new Date().toISOString(),
      updated_at: classWithRelations.updated_at
    };
  }, [user]);

  // New advanced filtering with FilterService
  useEffect(() => {
    if (tasks.length === 0) {
      setFilteredTasks([]);
      setSearchResults([]);
      return;
    }

    try {
      // Convert data to FilterService compatible format
      const convertedTasks = tasks.map(convertToTask);
      const convertedClasses = classes.map(convertToClass);

      // Apply filtering using FilterService
      let filteredResults: TaskWithMeta[] = [];

      if (filterCriteria.searchText && filterCriteria.searchText.trim()) {
        // Use full-text search with relevance scoring
        const searchResults = FilterService.searchTasks(
          convertedTasks,
          filterCriteria.searchText,
          convertedClasses,
          taskTypes
        );
        
        // Apply additional filters to search results
        const additionalCriteria = { ...filterCriteria };
        delete additionalCriteria.searchText; // Remove search text from additional filtering
        
        const filteredSearchTasks = FilterService.filterTasks(
          searchResults.map(result => result.task),
          additionalCriteria,
          convertedClasses,
          taskTypes
        );

        // Map back to TaskWithMeta and maintain relevance order
        filteredResults = searchResults
          .filter(result => filteredSearchTasks.some(task => task.id === result.task.id))
          .map(result => tasks.find(task => task.id === result.task.id)!)
          .filter(Boolean);

        setSearchResults(searchResults);
      } else {
        // Standard filtering without search
        const filtered = FilterService.filterTasks(
          convertedTasks,
          filterCriteria,
          convertedClasses,
          taskTypes
        );

        // Map back to TaskWithMeta
        filteredResults = filtered
          .map(task => tasks.find(t => t.id === task.id)!)
          .filter(Boolean);

        setSearchResults([]);
      }

      // Apply legacy sorting (keep existing sorting logic)
      filteredResults.sort((a, b) => {
        let compareValue = 0;
        
        switch (sortType) {
          case 'dueDate': {
            const aDate = a.dueDate || a.date || '';
            const bDate = b.dueDate || b.date || '';
            compareValue = aDate.localeCompare(bDate);
            break;
          }
          case 'created': {
            const aCreated = a.created_at || '';
            const bCreated = b.created_at || '';
            compareValue = aCreated.localeCompare(bCreated);
            break;
          }
          case 'title':
            compareValue = (a.title || '').localeCompare(b.title || '');
            break;
          case 'class': {
            const aClassName = classes.find(c => c.id === a.class)?.name || '';
            const bClassName = classes.find(c => c.id === b.class)?.name || '';
            compareValue = aClassName.localeCompare(bClassName);
            break;
          }
          default:
            compareValue = 0;
        }
        
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });

      setFilteredTasks(filteredResults);
    } catch (error) {
      logger.error('Error applying advanced filters', error);
      // Fallback to unfiltered tasks
      setFilteredTasks([...tasks]);
    }
  }, [tasks, filterCriteria, sortType, sortOrder, classes, taskTypes, convertToTask, convertToClass]);

  // Handle filter changes from TaskFilter component
  const handleFilterChange = useCallback((criteria: FilterCriteria) => {
    setFilterCriteria(criteria);
  }, []);

  // Validate auth state
  const authState = validateAuthState(user, isAuthenticated, loading);
  
  if (!authState.isValid) {
    if (authState.reason === 'loading') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tasks...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Task completion toggle
  const toggleTaskCompletion = useCallback(async (task: TaskWithMeta): Promise<void> => {
    try {
      // Use taskService.updateTask instead of direct updateTask to avoid race conditions
      // This will update the service state and notify all subscribers consistently
      const updatedTask = { ...task, completed: !task.completed };
      const result = await taskService.updateTask(task.id, updatedTask, isAuthenticated);
      
      if (result) {
        setLastCalendarSyncTimestamp(Date.now());
      } else {
        logger.error('Failed to update task completion - no result returned');
      }
    } catch (error) {
      logger.error('Failed to update task completion', error);
      // No need for revert - service subscription will maintain consistent state
    }
  }, [isAuthenticated, setLastCalendarSyncTimestamp]);

  // Handle task edit
  const handleTaskEdit = useCallback((task: TaskWithMeta) => {
    const taskDate = task.dueDate || task.date;
    const selectedTaskDate = taskDate ? new Date(taskDate) : new Date();
    setSelectedDate(selectedTaskDate);
    setEditingTask(task);
    setShowTaskModal(true);
    onTaskEdit?.(task);
  }, [onTaskEdit]);

  // Handle task submit (create/update)
  const handleTaskSubmit = async (taskData: Partial<TaskWithMeta>): Promise<void> => {
    try {
      if (!selectedDate) return;

      const completeTaskData = {
        ...taskData,
        date: formatDateForInput(selectedDate),
        completed: taskData.completed || false,
      };

      let result: TaskWithMeta | null = null;
      if (editingTask) {
        // Use taskService to ensure consistent state updates
        result = await taskService.updateTask(
          editingTask.id,
          completeTaskData,
          isAuthenticated
        ) as TaskWithMeta;
        
        if (result) {
          setLastCalendarSyncTimestamp(Date.now());
          setShowTaskModal(false);
          setEditingTask(null);
        }
      }
    } catch (error) {
      logger.error('Task submission error', error);
      const operation = editingTask ? 'updating' : 'creating';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`There was an error ${operation} your task. Please try again. Error: ${errorMessage}`);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (): Promise<void> => {
    if (editingTask) {
      try {
        // Use taskService to ensure consistent state updates
        const success = await taskService.deleteTask(editingTask.id, isAuthenticated);
        if (success) {
          setLastCalendarSyncTimestamp(Date.now());
        }
        setShowTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        logger.error('Task deletion error', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`There was an error deleting your task. Please try again. Error: ${errorMessage}`);
      }
    }
  };

  // Handle bulk operations
  const handleBulkComplete = async () => {
    const tasksToUpdate = Array.from(selectedTasks);
    try {
      // Use taskService to ensure consistent state updates
      await Promise.all(
        tasksToUpdate.map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return taskService.updateTask(taskId, { ...task, completed: true }, isAuthenticated);
          }
          return Promise.resolve();
        })
      );
      
      // Service subscription will update tasks state, just clear selection
      setSelectedTasks(new Set());
      setLastCalendarSyncTimestamp(Date.now());
    } catch (error) {
      logger.error('Bulk complete error', error);
      alert('There was an error completing the selected tasks. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} selected tasks?`)) {
      return;
    }

    const tasksToDelete = Array.from(selectedTasks);
    try {
      // Use taskService to ensure consistent state updates
      await Promise.all(
        tasksToDelete.map(taskId => taskService.deleteTask(taskId, isAuthenticated))
      );
      
      // Service subscription will update tasks state, just clear selection
      setSelectedTasks(new Set());
      setLastCalendarSyncTimestamp(Date.now());
    } catch (error) {
      logger.error('Bulk delete error', error);
      alert('There was an error deleting the selected tasks. Please try again.');
    }
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Select all visible tasks
  const selectAllTasks = () => {
    const allTaskIds = new Set(filteredTasks.map(task => task.id));
    setSelectedTasks(allTaskIds);
    setShowBulkActions(allTaskIds.size > 0);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  };

  const getTaskClassName = (task: TaskWithMeta) => {
    return classes.find(c => c.id === task.class)?.name || 'No Class';
  };

  const getTaskTypeName = (task: TaskWithMeta) => {
    return taskTypes.find(t => t.id === task.type)?.name || 'No Type';
  };

  const isOverdue = (task: TaskWithMeta) => {
    if (task.completed) return false;
    const dueDate = task.dueDate || task.date;
    const today = formatDateForInput(new Date());
    return dueDate && dueDate < today;
  };

  return (
    <>
    <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700/50 p-4 h-full flex flex-col hover:shadow-xl transition-smooth">
      {/* Header */}
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Task Management</h1>
      </div>

      {/* Advanced Filtering and Search */}
      <TaskFilter
        onFilterChange={handleFilterChange}
        classes={classes.map(convertToClass)}
        taskTypes={taskTypes}
        initialCriteria={filterCriteria}
        taskCount={tasks.length}
        filteredCount={filteredTasks.length}
      />

      {/* Sort Controls */}
      <div className="bg-gray-50 dark:bg-slate-700/50 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-gray-800 dark:text-slate-200">Sort by:</span>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="appearance-none px-3 py-2 border border-gray-300 dark:border-slate-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700/50 backdrop-blur-sm text-gray-900 dark:text-slate-100 min-h-[44px] touch-manipulation"
              style={{ 
                backgroundImage: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              <option value="dueDate">Due Date</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
              <option value="class">Class</option>
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors min-h-[44px] touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50"
          >
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={sortOrder === 'asc' ? "M8 9l4-4 4 4m0 6l-4 4-4-4" : "M16 15l-4 4-4-4m0-6l4-4 4 4"} />
            </svg>
          </button>

          {/* Search Results Info */}
          {searchResults.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-slate-400 ml-auto">
              Results sorted by relevance
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200 dark:border-blue-700/50 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkComplete}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 active:bg-green-800 transition-colors min-h-[44px] touch-manipulation shadow-sm"
            >
              Complete
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 active:bg-red-800 transition-colors min-h-[44px] touch-manipulation shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 active:bg-gray-800 transition-colors min-h-[44px] touch-manipulation shadow-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Task List Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-gray-800 dark:text-slate-200">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllTasks}
                className="text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Select All
              </button>
              {selectedTasks.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-base font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Add Task Button - positioned at the end of first task area */}
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setEditingTask(null);
            setShowTaskModal(true);
          }}
          className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 min-h-[44px] touch-manipulation shadow-sm hover:shadow-md opacity-0 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-slate-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-lg">No tasks found</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">
              {filterType === 'all' ? 'Create your first task to get started' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const style = getEventStyle(task, taskTypes);
              const className = getTaskClassName(task);
              const typeName = getTaskTypeName(task);
              const overdue = isOverdue(task);
              
              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-4 rounded-xl border-l-4 ${style.border} ${
                    task.completed ? 'bg-gray-50 dark:bg-slate-800/50 opacity-75' : 'bg-white dark:bg-slate-700/50 backdrop-blur-sm'
                  } shadow-md hover:shadow-lg transition-smooth cursor-pointer group min-h-[64px] touch-manipulation border border-gray-100 dark:border-slate-600/50 hover:border-gray-200 dark:hover:border-slate-500/50`}
                  onClick={() => handleTaskEdit(task)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox - with expanded clickable area */}
                    <div 
                      className="flex-shrink-0 flex items-center justify-center w-8 h-8 mt-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskSelection(task.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleTaskSelection(task.id);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600/50 rounded touch-manipulation bg-white dark:bg-slate-700/50 cursor-pointer"
                      />
                    </div>
                    
                    {/* Task completion toggle - with expanded clickable area */}
                    <div 
                      className="flex-shrink-0 flex items-center justify-center w-8 h-8 mt-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task);
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompletion(task);
                        }}
                        className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors touch-manipulation hover:scale-105 active:scale-95 cursor-pointer ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-slate-600/50 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-slate-700/50'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Task content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'} ${overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {task.title}
                            {overdue && !task.completed && (
                              <span className="ml-2 inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Overdue
                              </span>
                            )}
                          </h3>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                            <span>{className}</span>
                            <span>{typeName}</span>
                            {(task.dueDate || task.date) && (
                              <span>
                                Due: {new Date(task.dueDate || task.date || '').toLocaleDateString()}
                                {task.dueTime && ` at ${formatTimeForDisplay(task.dueTime)}`}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskEdit(task);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                          </svg>
                        </button>
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

    {/* Task Modal - Rendered outside main container for proper positioning */}
    <Suspense fallback={
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10050]">
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-center mt-4 text-gray-600 dark:text-slate-300">Loading task editor...</p>
        </div>
      </div>
    }>
      <TaskModal
        showModal={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        onDelete={handleDeleteTask}
        editingTask={editingTask}
        selectedDate={selectedDate}
        classes={classes.filter(cls => cls.isTaskClass === true)}
        taskTypes={taskTypes}
        isAuthenticated={isAuthenticated}
        setTaskTypes={setTaskTypes}
        setClasses={setClasses}
        user={user}
      />
    </Suspense>
    </>
  );
};

export default React.memo(TaskView);