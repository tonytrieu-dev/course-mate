import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, JSX } from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getTaskTypes,
} from "../services/dataService";
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
      className={`${style.bg} ${style.border} rounded-md p-2 mb-1 shadow-sm cursor-pointer group relative hover:shadow-md transition-all duration-200 ease-in-out`}
      onClick={handleClick}
      title={`${task.title} - ${className}`}
    >
      {/* Edit button */}
      <button
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/50"
        onClick={handleEdit}
        aria-label="Edit task"
        type="button"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
        </svg>
      </button>
      
      <div className={`font-semibold text-xs ${style.text} truncate`}>
        {task.title}
      </div>
      <div className="text-xs text-gray-600 truncate">
        {className}
      </div>
      <div className="text-xs text-gray-500 truncate">
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
  const cellClasses = useMemo(() => getDayCellClasses(isCurrentMonth, isToday), [isCurrentMonth, isToday]);
  const dateClasses = useMemo(() => 
    `text-sm font-semibold absolute top-2 left-2 ${isToday ? 'text-blue-700' : 'text-gray-500'}`,
    [isToday]
  );

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
            className="flex items-center gap-2 text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-100"
            type="button"
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
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Month and Year</h3>
                
                {/* Year Selection */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2">Year</label>
                  <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                    {years.map((yearOption) => (
                      <button
                        key={yearOption}
                        onClick={() => handleDateChange(currentDate.getMonth(), yearOption)}
                        className={`px-2 py-1 text-sm rounded transition-colors duration-200 ${
                          yearOption === currentDate.getFullYear() 
                            ? 'bg-blue-100 text-blue-800 font-semibold' 
                            : 'text-gray-700 hover:bg-blue-50'
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
                  <label className="block text-xs text-gray-600 mb-2">Month</label>
                  <div className="grid grid-cols-3 gap-1">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => handleDateChange(index, currentDate.getFullYear())}
                        className={`px-2 py-1 text-sm rounded transition-colors duration-200 ${
                          index === currentDate.getMonth() 
                            ? 'bg-blue-100 text-blue-800 font-semibold' 
                            : 'text-gray-700 hover:bg-blue-50'
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
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      {/* Title with clickable month/year dials for month view */}
      {renderDateTitle()}
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* View toggle buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {viewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={getViewButtonClasses(view === option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className={getNavButtonClasses()}
            aria-label="Previous period"
            type="button"
          >
            <svg className={getNavIconClasses()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className={getNavButtonClasses()}
            aria-label="Next period"
            type="button"
          >
            <svg className={getNavIconClasses()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ view: initialView = 'month' }) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [tasks, setTasks] = useState<TaskWithMeta[]>([]);
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [taskModalClasses, setTaskModalClasses] = useState<ClassWithRelations[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  
  // Combined classes array for EventCard display (includes both regular and TaskModal classes)
  const allClasses = useMemo(() => [...classes, ...taskModalClasses], [classes, taskModalClasses]);
  const [view, setView] = useState<ViewType>(initialView);
  const [editingTask, setEditingTask] = useState<TaskWithMeta | null>(null);

  // Load data when auth state is ready (initial load only)
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!loading && isAuthenticated && user && user.id) {
        console.log('Loading initial data for user:', user.id);
        
        const fetchedTasks = await getTasks(user.id, isAuthenticated);
        console.log('Fetched tasks from server:', fetchedTasks);
        setTasks(fetchedTasks || []);
        
        // Use class service for centralized class management
        // Force refresh to ensure we get latest classes including new ones
        const fetchedClasses = await classService.refreshClasses(user.id, isAuthenticated);
        // Include all classes for calendar display
        setClasses(fetchedClasses || []);
        // Initialize TaskModal with its own independent classes (only task classes)
        setTaskModalClasses(fetchedClasses?.filter(cls => cls.isTaskClass === true) || []);

        const fetchedTaskTypes = await getTaskTypes(user.id, isAuthenticated);
        setTaskTypes(fetchedTaskTypes || []);

      } else {
        console.log('Skipping data load - conditions not met:', { loading, isAuthenticated, userId: user?.id });
      }
    };
    loadData();
  }, [loading, isAuthenticated, user, user?.id]);

  // Subscribe to class changes from the class service
  useEffect(() => {
    if (!isAuthenticated || !user) {
      classService.reset();
      return;
    }

    const unsubscribe = classService.subscribe((updatedClasses: ClassWithRelations[]) => {
      // Include all classes for calendar display
      setClasses(updatedClasses);
      // Keep TaskModal classes separate - only update with task classes from the service
      setTaskModalClasses(updatedClasses.filter(cls => cls.isTaskClass === true));
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  // Validate auth state and show appropriate UI
  const authState = validateAuthState(user, isAuthenticated, loading);
  
  if (!authState.isValid) {
    if (authState.reason === 'loading') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your calendar...</p>
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
        console.log('Updating task:', { id: editingTask.id, data: completeTaskData });
        result = await updateTask(
          editingTask.id,
          completeTaskData,
          isAuthenticated
        ) as TaskWithMeta;
        console.log('Task update result:', result);
        
        // Immediately update local state for edited task
        if (result) {
          console.log('Immediately updating task in local state:', result);
          setTasks(prevTasks => {
            const updated = prevTasks.map(task => 
              task.id === editingTask.id ? { ...task, ...result } : task
            ).filter(task => task !== null) as TaskWithMeta[];
            console.log('Updated tasks array:', updated);
            return updated;
          });
        }
      } else {
        console.log('Creating new task:', completeTaskData);
        result = await addTask(completeTaskData, isAuthenticated) as TaskWithMeta;
        console.log('Task creation result:', result);
        
        // Immediately add new task to local state
        if (result) {
          console.log('Immediately adding new task to local state:', result);
          setTasks(prevTasks => {
            const updated = [...prevTasks, result].filter(task => task !== null) as TaskWithMeta[];
            console.log('Updated tasks array with new task:', updated);
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
      console.error('Task submission error:', error);
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
          console.log('Immediately removing task from local state:', editingTask.id);
          setTasks(prevTasks => {
            const updated = prevTasks.filter(task => task.id !== editingTask.id);
            console.log('Updated tasks array after deletion:', updated);
            return updated;
          });
          setLastCalendarSyncTimestamp(Date.now());
        }
        setShowTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        console.error('Task deletion error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`There was an error deleting your task. Please try again. Error: ${errorMessage}`);
      }
    }
  };

  const getTasksForDay = useCallback((day: number, month = currentDate.getMonth(), year = currentDate.getFullYear()): TaskWithMeta[] => {
    const targetDate = new Date(year, month, day);
    const targetDateStr = formatDateForInput(targetDate);

    if (!tasks || tasks.length === 0) {
      return [];
    }

    const dayTasks = tasks.filter(task => {
      let match = false;
      if (task.dueDate) {
        match = task.dueDate === targetDateStr;
      } else if (task.date) {
        const taskDate = new Date(task.date);
        const taskDateStr = formatDateForInput(taskDate);
        match = taskDateStr === targetDateStr;
      }
      return match;
    });
    
    return dayTasks.sort((a, b) => {
      const timeA = a.dueTime || (a.date ? new Date(a.date).toLocaleTimeString() : '00:00');
      const timeB = b.dueTime || (b.date ? new Date(b.date).toLocaleTimeString() : '00:00');
      return timeA.localeCompare(timeB);
    });
  }, [tasks, currentDate]);

  const renderMonthView = (): JSX.Element => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();

    const days: JSX.Element[] = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-40"></div>);
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
          classes={allClasses}
          taskTypes={taskTypes}
          formatTimeForDisplay={formatTimeForDisplay}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleTaskClick}
          onClick={() => handleDateClick(day)}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-0.5 min-w-[800px]">
          {getWeekdayHeaders().map((day) => (
            <div key={day} className="text-center font-bold text-gray-700 py-2 text-sm">
              {day}
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
      console.error('Failed to update task completion:', error);
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
          classes={allClasses}
          taskTypes={taskTypes}
          formatTimeForDisplay={formatTimeForDisplay}
          onToggleComplete={toggleTaskCompletion}
          onEdit={handleTaskClick}
          onClick={() => handleDateClick(day.getDate(), day.getMonth(), day.getFullYear())}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-0.5 min-w-[800px]">
          {getWeekdayHeaders().map((day) => (
            <div key={day} className="text-center font-bold text-gray-700 py-2 text-sm">
              {day}
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
          classes={allClasses}
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
    <div className="bg-white rounded-xl shadow-md p-4">
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrevious={previousPeriod}
        onNext={nextPeriod}
        view={view}
        onViewChange={setView}
      />

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

      <Suspense fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          editingTask={editingTask as unknown as TaskData | null}
          selectedDate={selectedDate}
          classes={taskModalClasses}
          taskTypes={taskTypes}
          isAuthenticated={isAuthenticated}
          setTaskTypes={setTaskTypes}
          setClasses={setTaskModalClasses}
          user={user}
        />
      </Suspense>
    </div>
  );
};

// Memoize the main component for better performance
export default React.memo(SimpleCalendar);