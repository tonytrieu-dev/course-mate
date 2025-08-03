import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, JSX } from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getTaskTypes,
} from "../services/dataService";
import type { TaskData } from "./TaskModal";
import { useAuth } from "../contexts/AuthContext";
import { getEventStyle } from "../utils/taskStyles";
import { 
  formatDateForInput, 
  formatTimeForDisplay, 
  getStartOfWeek, 
  isSameDay,
  getPreviousPeriod,
  getNextPeriod,
  formatHourForDisplay,
  getWeekdayHeaders,
  getCalendarTitle
} from "../utils/dateHelpers";
import { getDayCellClasses, getViewButtonClasses, getNavButtonClasses, getNavIconClasses } from "../utils/styleHelpers";
import { validateAuthState } from "../utils/authHelpers";
import classService from "../services/classService";
import { logger } from "../utils/logger";

// Lazy load TaskModal for better performance
const TaskModal = lazy(() => import("./TaskModal"));
import type { TaskWithMeta, TaskType, ClassWithRelations } from "../types/database";

// Types for component props
interface Position {
  x: number;
  y: number;
}

type ViewType = 'month' | 'week' | 'day';

interface EventCardProps {
  task: TaskWithMeta;
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
}

interface DayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isCurrentDate?: boolean;
  isToday: boolean;
  tasks: TaskWithMeta[];
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
  onClick: () => void;
}

interface HourCellProps {
  hour: number;
  tasks: TaskWithMeta[];
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
  onClick: () => void;
}

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface SimpleCalendarProps {
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

interface ViewOption {
  key: ViewType;
  label: string;
}

// Reusable EventCard component - memoized for performance
const EventCard: React.FC<EventCardProps> = React.memo(({ 
  task, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit 
}) => {
  const style = useMemo(() => getEventStyle(task, taskTypes), [task, taskTypes]);
  
  const className = useMemo(() => 
    classes.find(c => c.id === task.class)?.name || 'No Class', 
    [classes, task.class]
  );
  const typeName = useMemo(() => 
    taskTypes.find(t => t.id === task.type)?.name || 'No Type', 
    [taskTypes, task.type]
  );
  
  const timeDisplay = useMemo(() => {
    if (task.isDuration) {
      return ` • ${formatTimeForDisplay(task.startTime || null)}-${formatTimeForDisplay(task.endTime || null)}`;
    }
    return task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : '';
  }, [task, formatTimeForDisplay]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(task);
  }, [onToggleComplete, task]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e, task);
  }, [onEdit, task]);

  return (
    <div
      className={`${style.bg} ${style.border} rounded-md p-1.5 sm:p-3 mb-1 shadow-sm cursor-pointer group relative hover:shadow-md transition-all duration-200 ease-in-out touch-manipulation min-h-[40px] sm:min-h-[44px] flex flex-col justify-center`}
      onClick={handleClick}
      title={`${task.title} - ${className}`}
    >
      {/* Edit button - always visible on mobile for better accessibility */}
      <button
        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 sm:p-2 rounded hover:bg-white/50 min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px] touch-manipulation"
        onClick={handleEdit}
        aria-label="Edit task"
        type="button"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
        </svg>
      </button>
      
      <div className={`font-semibold text-xs sm:text-sm ${style.text} truncate pr-7 sm:pr-8`}>
        {task.title}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300 truncate pr-7 sm:pr-8">
        {className}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate pr-7 sm:pr-8">
        {typeName}{timeDisplay}
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';

// Reusable DayCell component - memoized for performance
const DayCell: React.FC<DayCellProps> = React.memo(({ 
  day, 
  isCurrentMonth, 
  isCurrentDate, 
  isToday, 
  tasks, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit, 
  onClick 
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const cellClasses = useMemo(() => getDayCellClasses(isCurrentMonth, isToday), [isCurrentMonth, isToday]);
  const dateClasses = useMemo(() => 
    `text-sm font-semibold absolute top-2 left-2 ${isToday ? 'text-blue-700' : 'text-gray-500'}`,
    [isToday]
  );

  // Performance optimization: limit visible tasks for large datasets
  const MAX_VISIBLE_TASKS = 3;
  const visibleTasks = useMemo(() => {
    if (tasks.length <= MAX_VISIBLE_TASKS || showAllTasks) {
      return tasks;
    }
    return tasks.slice(0, MAX_VISIBLE_TASKS);
  }, [tasks, showAllTasks]);

  const hiddenTasksCount = useMemo(() => {
    return Math.max(0, tasks.length - MAX_VISIBLE_TASKS);
  }, [tasks.length]);

  const handleShowMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTasks(true);
  }, []);

  return (
    <div
      className={cellClasses}
      onClick={onClick}
    >
      {/* Date number */}
      <div className={dateClasses}>
        {day}
      </div>
      
      {/* Events container */}
      <div className="mt-8 overflow-y-auto flex-1">
        {visibleTasks.map((task) => (
          <EventCard
            key={task.id}
            task={task}
            classes={classes}
            taskTypes={taskTypes}
            formatTimeForDisplay={formatTimeForDisplay}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
          />
        ))}
        
        {/* Show more button for performance with large task lists */}
        {!showAllTasks && hiddenTasksCount > 0 && (
          <button
            onClick={handleShowMore}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2 mt-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors min-h-[32px] touch-manipulation"
            aria-label={`Show ${hiddenTasksCount} more tasks`}
          >
            +{hiddenTasksCount} more
          </button>
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

// Reusable HourCell component for day view - memoized for performance
const HourCell: React.FC<HourCellProps> = React.memo(({ 
  hour, 
  tasks, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit, 
  onClick 
}) => {
  const hourDisplay = useMemo(() => formatHourForDisplay(hour), [hour]);

  return (
    <div 
      className="border border-gray-300 p-2 flex min-h-20 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
      onClick={onClick}
    >
      <div className="w-16 font-bold text-gray-600">
        {hourDisplay}
      </div>
      <div className="flex-1">
        {tasks.map((task) => (
          <EventCard
            key={task.id}
            task={task}
            classes={classes}
            taskTypes={taskTypes}
            formatTimeForDisplay={formatTimeForDisplay}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
});

HourCell.displayName = 'HourCell';

// Enhanced CalendarHeader component with clickable month/year dials - memoized
const CalendarHeader: React.FC<CalendarHeaderProps> = React.memo(({ 
  currentDate,
  onDateChange,
  onPrevious, 
  onNext, 
  view, 
  onViewChange 
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const viewOptions: ViewOption[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleDateChange = useCallback((monthIndex: number, year: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    newDate.setFullYear(year);
    onDateChange(newDate);
    setShowDatePicker(false);
  }, [currentDate, onDateChange]);

  const renderDateTitle = () => {
    if (view === "month") {
      const monthName = currentDate.toLocaleString("default", { month: "long" });
      const year = currentDate.getFullYear();
      
      return (
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] touch-manipulation"
            type="button"
            aria-label={`${monthName} ${year}, click to change date`}
            aria-expanded={showDatePicker}
            aria-haspopup="true"
          >
            <span>{monthName}</span>
            <span>{year}</span>
            {showDatePicker && (
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          {/* Combined Date Picker */}
          {showDatePicker && (
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 w-80 max-w-[90vw] max-h-96 overflow-y-auto"
              role="dialog"
              aria-labelledby="date-picker-title"
              aria-modal="false"
            >
              <div className="p-4">
                <h3 id="date-picker-title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Month and Year</h3>
                
                {/* Year Selection */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Year</label>
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                    {years.map((yearOption) => (
                      <button
                        key={yearOption}
                        onClick={() => handleDateChange(currentDate.getMonth(), yearOption)}
                        className={`px-3 py-2 text-sm rounded transition-colors duration-200 min-h-[40px] touch-manipulation ${
                          yearOption === currentDate.getFullYear() 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900'
                        }`}
                        type="button"
                      >
                        {yearOption}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Month Selection */}
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Month</label>
                  <div className="grid grid-cols-3 gap-1">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => handleDateChange(index, currentDate.getFullYear())}
                        className={`px-3 py-2 text-sm rounded transition-colors duration-200 min-h-[40px] touch-manipulation ${
                          index === currentDate.getMonth() 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900'
                        }`}
                        type="button"
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // For week and day views, show the original title format
      return <h2 className="text-2xl font-bold text-gray-800">{getCalendarTitle(currentDate, view)}</h2>;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [showDatePicker]);

  return (
    <div className="flex flex-col space-y-4 mb-6">
      {/* Title with clickable month/year dials - centered */}
      <div className="flex justify-center">
        {renderDateTitle()}
      </div>
      
      {/* Controls - right aligned */}
      <div className="flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-3 sm:gap-4">
        {/* View toggle buttons */}
        <div 
          className="flex bg-gray-100 rounded-lg p-1 gap-2 sm:gap-3 w-full sm:w-auto max-w-xs sm:max-w-none"
          role="group"
          aria-label="Calendar view options"
        >
          {viewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={`${getViewButtonClasses(view === option.key)} flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-[44px] touch-manipulation`}
              type="button"
              aria-pressed={view === option.key}
              aria-label={`Switch to ${option.label.toLowerCase()} view`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onPrevious}
            className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation"
            aria-label="Previous period"
            type="button"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation"
            aria-label="Next period"
            type="button"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ view: initialView = 'month', onViewChange }) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [internalView, setInternalView] = useState<ViewType>(initialView);
  const view = initialView; // Use prop value directly
  const handleViewChange = onViewChange || setInternalView; // Use external handler if provided
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);

  // Handler to update classes - this will be called by TaskModal when classes change
  const handleClassUpdate = useCallback(async (updatedClasses: ClassWithRelations[]) => {
    // Update the local classes state
    setClasses(updatedClasses);
    logger.debug('Classes updated through TaskModal', { classCount: updatedClasses.length });
    
    // Force refresh the class service to keep it in sync
    if (user?.id) {
      await classService.refreshClasses(user.id, isAuthenticated);
    }
  }, [user?.id, isAuthenticated]);

  // Load data when auth state is ready (initial load and after Canvas sync)
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        logger.debug('Loading data for user', { userId: user.id, trigger: lastCalendarSyncTimestamp ? 'sync' : 'initial' });
        
        const fetchedTasks = await getTasks(user.id, isAuthenticated);
        logger.debug('Fetched tasks from server', { taskCount: fetchedTasks?.length || 0 });
        setTasks(fetchedTasks || []);
        
        // Use class service for centralized class management
        // Force refresh to ensure we get latest classes including new ones
        const fetchedClasses = await classService.refreshClasses(user.id, isAuthenticated);
        setClasses(fetchedClasses || []);

        const fetchedTaskTypes = await getTaskTypes(user.id, isAuthenticated);
        setTaskTypes(fetchedTaskTypes || []);

      } else {
        logger.debug('Skipping data load - conditions not met', { loading, isAuthenticated, userId: user?.id });
      }
    };
    loadData();
  }, [loading, isAuthenticated, user, user?.id, lastCalendarSyncTimestamp]);

  // Subscribe to class changes from the class service
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

  // Validate auth state and show appropriate UI
  const authState = validateAuthState(user, isAuthenticated, loading);
  
  if (!authState.isValid) {
    if (authState.reason === 'loading') {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your calendar...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Navigation functions
  const previousPeriod = useCallback(() => {
    setCurrentDate(getPreviousPeriod(currentDate, view));
  }, [currentDate, view]);

  const nextPeriod = useCallback(() => {
    setCurrentDate(getNextPeriod(currentDate, view));
  }, [currentDate, view]);

  const handleDateClick = useCallback((day: number, month = currentDate.getMonth(), year = currentDate.getFullYear()) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setEditingTask(null);
    setShowTaskModal(true);
  }, [currentDate]);

  const handleTaskClick = useCallback((e: React.MouseEvent, task: TaskWithMeta) => {
    e.stopPropagation();
    // Use the appropriate date field depending on task type
    const taskDateStr = task.dueDate || task.date;
    const taskDate = taskDateStr ? new Date(taskDateStr) : new Date();
    setSelectedDate(taskDate);
    setEditingTask(task);
    setShowTaskModal(true);
  }, []);

  const handleTaskSubmit = async (taskData: Partial<TaskWithMeta>): Promise<void> => {
    try {
      if (!selectedDate) return;

      const completeTaskData = {
        ...taskData,
        date: formatDateForInput(selectedDate),
        completed: taskData.completed || false,
      };

      let result: TaskWithMeta | null;
      if (editingTask) {
        logger.debug('Updating task', { id: editingTask.id, title: completeTaskData.title });
        result = await updateTask(
          editingTask.id,
          completeTaskData,
          isAuthenticated
        ) as TaskWithMeta;
        logger.debug('Task update result', { success: !!result, id: result?.id });
        
        // Immediately update local state for edited task
        if (result) {
          logger.debug('Immediately updating task in local state', { id: result.id });
          setTasks(prevTasks => {
            const updated = prevTasks.map(task => 
              task.id === editingTask.id ? { ...task, ...result } : task
            ).filter(task => task !== null) as TaskWithMeta[];
            logger.debug('Updated tasks array', { taskCount: updated.length });
            return updated;
          });
        }
      } else {
        logger.debug('Creating new task', { title: completeTaskData.title });
        result = await addTask(completeTaskData, isAuthenticated) as TaskWithMeta;
        logger.debug('Task creation result', { success: !!result, id: result?.id });
        
        // Immediately add new task to local state
        if (result) {
          logger.debug('Immediately adding new task to local state', { id: result.id });
          setTasks(prevTasks => {
            const updated = [...prevTasks, result].filter(task => task !== null) as TaskWithMeta[];
            logger.debug('Updated tasks array with new task', { taskCount: updated.length });
            return updated;
          });
        }
      }
      
      if (result) {
        setLastCalendarSyncTimestamp(Date.now());
        setShowTaskModal(false);
        setEditingTask(null);
      } else {
        throw new Error('Task operation returned no result');
      }
    } catch (error) {
      logger.error('Task submission error', error);
      const operation = editingTask ? 'updating' : 'creating';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`There was an error ${operation} your task. Please try again. Error: ${errorMessage}`);
    }
  };

  const handleDeleteTask = async (): Promise<void> => {
    if (editingTask) {
      try {
        const success = await deleteTask(editingTask.id, isAuthenticated);
        if (success) {
          // Immediately remove task from local state
          logger.debug('Immediately removing task from local state', { id: editingTask.id });
          setTasks(prevTasks => {
            const updated = prevTasks.filter(task => task.id !== editingTask.id);
            logger.debug('Updated tasks array after deletion', { taskCount: updated.length });
            return updated;
          });
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

  // Performance optimization: Create indexed task lookup for large datasets
  const tasksIndex = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return new Map<string, TaskWithMeta[]>();
    }

    const index = new Map<string, TaskWithMeta[]>();
    
    // Batch process tasks to avoid blocking UI for very large datasets
    const processTasks = (startIndex: number, batchSize: number = 100): void => {
      const endIndex = Math.min(startIndex + batchSize, tasks.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const task = tasks[i];
        let dateKey: string | null = null;
        
        if (task.dueDate) {
          dateKey = task.dueDate;
        } else if (task.startDate) {
          dateKey = task.startDate;
        }
        
        if (dateKey) {
          if (!index.has(dateKey)) {
            index.set(dateKey, []);
          }
          index.get(dateKey)!.push(task);
        }
      }
    };

    // Process all tasks in batches
    for (let i = 0; i < tasks.length; i += 100) {
      processTasks(i);
    }

    // Sort tasks for each date by time
    index.forEach((dayTasks) => {
      dayTasks.sort((a, b) => {
        const timeA = a.dueTime || a.startTime || '00:00';
        const timeB = b.dueTime || b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return index;
  }, [tasks]);

  const getTasksForDay = useCallback((day: number, month = currentDate.getMonth(), year = currentDate.getFullYear()): TaskWithMeta[] => {
    const targetDate = new Date(year, month, day);
    const targetDateStr = formatDateForInput(targetDate);
    
    return tasksIndex.get(targetDateStr) || [];
  }, [tasksIndex, currentDate]);

  const renderMonthView = (): JSX.Element => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();

    const days: JSX.Element[] = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 sm:h-24 md:h-32 lg:h-40"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      const isToday = isSameDay(today, new Date(year, month, day));
      const isCurrentMonth = true;

      days.push(
        <DayCell
          key={day}
          day={day}
          isCurrentMonth={isCurrentMonth}
          isToday={isToday}
          tasks={dayTasks}
          classes={classes}
          taskTypes={taskTypes}
          formatTimeForDisplay={formatTimeForDisplay}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleTaskClick}
          onClick={() => handleDateClick(day)}
        />
      );
    }

    return (
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[320px] w-full px-2 sm:px-0">
          {getWeekdayHeaders().map((day) => (
            <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-300 py-1 sm:py-2 text-xs sm:text-sm md:text-base">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 2)}</span>
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Add a function to toggle task completion
  const toggleTaskCompletion = useCallback(async (task: TaskWithMeta): Promise<void> => {
    const originalCompleted = task.completed;
    
    // Optimistically update local state for instant UI feedback
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    );
    
    try {
      const updatedTask = {
        ...task,
        completed: !task.completed
      };
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

  // Week view rendering
  const renderWeekView = (): JSX.Element => {
    const startOfWeek = getStartOfWeek(currentDate);
    const today = new Date();

    const days: JSX.Element[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      // Get tasks for this specific day
      const dayTasks = getTasksForDay(day.getDate(), day.getMonth(), day.getFullYear());
      const isToday = isSameDay(today, day);

      days.push(
        <DayCell
          key={i}
          day={day.getDate()}
          isCurrentMonth={true}
          isToday={isToday}
          tasks={dayTasks}
          classes={classes}
          taskTypes={taskTypes}
          formatTimeForDisplay={formatTimeForDisplay}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleTaskClick}
          onClick={() => handleDateClick(day.getDate(), day.getMonth(), day.getFullYear())}
        />
      );
    }

    return (
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 min-w-[320px] w-full px-2 sm:px-0">
          {getWeekdayHeaders().map((day) => (
            <div key={day} className="text-center font-bold text-gray-700 dark:text-gray-300 py-1 sm:py-2 text-xs sm:text-sm md:text-base">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 2)}</span>
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Day view rendering
  const renderDayView = (): JSX.Element => {
    const dayTasks = getTasksForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear());
    const tasksByHour: Record<number, TaskWithMeta[]> = {};
    
    // Initialize hours with empty arrays
    for (let i = 0; i <= 24; i++) {
      tasksByHour[i] = [];
    }

    // Sort tasks into hourly buckets
    dayTasks.forEach(task => {
      if (task.isDuration && task.startTime) {
        // For duration tasks, place at start time
        const hour = parseInt(task.startTime.split(':')[0], 10);
        if (tasksByHour[hour]) {
          tasksByHour[hour].push(task);
        }
      } else if (task.dueTime) {
        // For deadline tasks, place at due time
        const hour = parseInt(task.dueTime.split(':')[0], 10);
        if (tasksByHour[hour]) {
          tasksByHour[hour].push(task);
        }
      } else {
        tasksByHour[9].push(task);
      }
    });

    // Render hours from 4 AM to 11 PM
    const hours: JSX.Element[] = [];

    // Add 4 AM to 11 PM
    for (let i = 4; i <= 23; i++) {
      hours.push(
        <HourCell
          key={i}
          hour={i}
          tasks={tasksByHour[i] || []}
          classes={classes}
          taskTypes={taskTypes}
          formatTimeForDisplay={formatTimeForDisplay}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleTaskClick}
          onClick={() => {
            const clickedTime = new Date(currentDate);
            clickedTime.setHours(i, 0, 0, 0);
            setSelectedDate(clickedTime);
            setEditingTask(null);
            setShowTaskModal(true);
          }}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-0.5">
        {hours}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 sm:p-4">
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrevious={previousPeriod}
        onNext={nextPeriod}
        view={view}
        onViewChange={handleViewChange}
      />

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto" />
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Loading task editor...</p>
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
          classes={classes}
          taskTypes={taskTypes}
          isAuthenticated={isAuthenticated}
          setTaskTypes={setTaskTypes}
          setClasses={handleClassUpdate}
          user={user}
        />
      </Suspense>
    </div>
  );
};

// Memoize the main component for better performance
export default React.memo(SimpleCalendar);