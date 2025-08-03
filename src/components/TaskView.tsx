import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { getTasks, updateTask, deleteTask, getTaskTypes } from "../services/dataService";
import type { TaskWithMeta, TaskType, ClassWithRelations } from "../types/database";
import { useAuth } from "../contexts/AuthContext";
import { getEventStyle } from "../utils/taskStyles";
import { formatDateForInput, formatTimeForDisplay } from "../utils/dateHelpers";
import { validateAuthState } from "../utils/authHelpers";
import classService from "../services/classService";
import { logger } from "../utils/logger";
import type { TaskData } from "./TaskModal";

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
  
  // Filter and sort state
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

  // Load data when auth state is ready
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        logger.debug('Loading task view data for user', { userId: user.id });
        
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

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks];
    const today = new Date();
    const todayStr = formatDateForInput(today);
    const weekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekFromTodayStr = formatDateForInput(weekFromToday);

    // Apply filters
    switch (filterType) {
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (task.completed) return false;
          const dueDate = task.dueDate || task.date;
          return dueDate && dueDate < todayStr;
        });
        break;
      case 'today':
        filtered = filtered.filter(task => {
          const dueDate = task.dueDate || task.date;
          return dueDate === todayStr;
        });
        break;
      case 'thisWeek':
        filtered = filtered.filter(task => {
          const dueDate = task.dueDate || task.date;
          return dueDate && dueDate >= todayStr && dueDate <= weekFromTodayStr;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        classes.find(c => c.id === task.class)?.name?.toLowerCase().includes(query) ||
        taskTypes.find(t => t.id === task.type)?.name?.toLowerCase().includes(query)
      );
    }

    // Apply class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(task => task.class === selectedClass);
    }

    // Apply task type filter
    if (selectedTaskType !== 'all') {
      filtered = filtered.filter(task => task.type === selectedTaskType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
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

    setFilteredTasks(filtered);
  }, [tasks, filterType, sortType, sortOrder, searchQuery, selectedClass, selectedTaskType, classes, taskTypes]);

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
    const originalCompleted = task.completed;
    
    // Optimistically update local state
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    );
    
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await updateTask(task.id, updatedTask, isAuthenticated);
      setLastCalendarSyncTimestamp(Date.now());
    } catch (error) {
      logger.error('Failed to update task completion', error);
      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, completed: originalCompleted } : t
        )
      );
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
        result = await updateTask(
          editingTask.id,
          completeTaskData,
          isAuthenticated
        ) as TaskWithMeta;
        
        if (result) {
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === editingTask.id ? { ...task, ...result } : task
            )
          );
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
        const success = await deleteTask(editingTask.id, isAuthenticated);
        if (success) {
          setTasks(prevTasks => prevTasks.filter(task => task.id !== editingTask.id));
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
      await Promise.all(
        tasksToUpdate.map(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            return updateTask(taskId, { ...task, completed: true }, isAuthenticated);
          }
          return Promise.resolve();
        })
      );
      
      setTasks(prevTasks =>
        prevTasks.map(task =>
          selectedTasks.has(task.id) ? { ...task, completed: true } : task
        )
      );
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
      await Promise.all(
        tasksToDelete.map(taskId => deleteTask(taskId, isAuthenticated))
      );
      
      setTasks(prevTasks => prevTasks.filter(task => !selectedTasks.has(task.id)));
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-full flex flex-col hover:shadow-xl transition-smooth">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
        
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setEditingTask(null);
            setShowTaskModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center gap-2 min-h-[44px] touch-manipulation shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            />
          </div>

          {/* Filter Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="thisWeek">This Week</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* Task Type Filter */}
          <div>
            <select
              value={selectedTaskType}
              onChange={(e) => setSelectedTaskType(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Types</option>
              {taskTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dueDate">Due Date</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
              <option value="class">Class</option>
            </select>
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors min-h-[44px] touch-manipulation rounded-lg hover:bg-gray-100"
          >
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={sortOrder === 'asc' ? "M8 9l4-4 4 4m0 6l-4 4-4-4" : "M16 15l-4 4-4-4m0-6l4-4 4 4"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-blue-800">
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
          <span className="text-sm text-gray-600">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllTasks}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Select All
              </button>
              {selectedTasks.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No tasks found</p>
            <p className="text-gray-400 text-sm mt-2">
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
                    task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                  } shadow-md hover:shadow-lg transition-smooth cursor-pointer group min-h-[64px] touch-manipulation border border-gray-100 hover:border-gray-200`}
                  onClick={() => handleTaskEdit(task)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTaskSelection(task.id);
                      }}
                      className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
                    />
                    
                    {/* Task completion toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task);
                      }}
                      className={`mt-1 h-6 w-6 rounded border-2 flex items-center justify-center transition-colors touch-manipulation hover:scale-105 active:scale-95 ${
                        task.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Task content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'} ${overdue ? 'text-red-600' : ''}`}>
                            {task.title}
                            {overdue && !task.completed && (
                              <span className="ml-2 inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Overdue
                              </span>
                            )}
                          </h3>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
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

      {/* Task Modal */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-center mt-4 text-gray-600">Loading task editor...</p>
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
    </div>
  );
};

export default React.memo(TaskView);