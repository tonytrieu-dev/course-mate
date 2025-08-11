import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, JSX } from "react";
import { addTask, updateTask, deleteTask } from "../services/dataService";
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
import taskService from "../services/taskService";
import taskTypeService from "../services/taskTypeService";
import { logger } from "../utils/logger";

// Lazy load TaskModal for better performance
const TaskModal = lazy(() => import("./TaskModal"));
import type { TaskWithMeta, TaskType, ClassWithRelations } from "../types/database";

// Import calendar components
import { EventCard, DayCell, HourCell, CalendarHeader } from "./calendar";

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


interface SimpleCalendarProps {
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
}






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

  // Initialize services when auth state is ready (initial load and after Canvas sync)
  useEffect(() => {
    const initializeServices = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        logger.debug('Initializing calendar services for user', { userId: user.id, trigger: lastCalendarSyncTimestamp ? 'sync' : 'initial' });
        
        // Initialize all services in parallel for better performance
        await Promise.all([
          taskService.refreshTasks(user.id, isAuthenticated),
          classService.refreshClasses(user.id, isAuthenticated),
          taskTypeService.refreshTaskTypes(user.id, isAuthenticated)
        ]);
        
        // Set initial data from services
        setTasks(taskService.getCurrentTasks());
        setClasses(classService.getCurrentClasses());
        setTaskTypes(taskTypeService.getCurrentTaskTypes());
        
        logger.debug('Calendar services initialized', { 
          taskCount: taskService.getCurrentTasks().length,
          classCount: classService.getCurrentClasses().length,
          taskTypeCount: taskTypeService.getCurrentTaskTypes().length
        });
      } else if (!isAuthenticated) {
        // Reset services when not authenticated
        taskService.reset();
        classService.reset();
        taskTypeService.reset();
        logger.debug('Services reset - user not authenticated');
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

  // Validate auth state and show appropriate UI
  const authState = validateAuthState(user, isAuthenticated, loading);
  
  if (!authState.isValid) {
    if (authState.reason === 'loading') {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-8 border-blue-600 mx-auto"></div>
            <p className="mt-8 text-2xl font-bold text-gray-600 dark:text-gray-400">Loading your calendar...</p>
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
        } else if (task.date) {
          dateKey = task.date;
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
            <div key={day} className="text-center font-bold text-gray-700 dark:text-slate-300 py-1 sm:py-2 text-xs sm:text-sm md:text-base">
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
            <div key={day} className="text-center font-bold text-gray-700 dark:text-slate-300 py-1 sm:py-2 text-xs sm:text-sm md:text-base">
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
    <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur-sm rounded-xl shadow-lg dark:shadow-slate-900/20 border border-gray-100 dark:border-slate-700/50 p-2 sm:p-4">
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
            <div className="animate-spin rounded-full h-20 w-20 border-b-6 border-blue-600 mx-auto" />
            <p className="text-center mt-6 text-lg font-medium text-gray-600 dark:text-gray-400">Loading task editor...</p>
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