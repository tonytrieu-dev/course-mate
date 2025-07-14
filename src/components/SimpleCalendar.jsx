import React, { useState, useEffect } from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getClasses,
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
  getNextPeriod
} from "../utils/dateHelpers";
import TaskModal from "./TaskModal";

// Reusable EventCard component
const EventCard = ({ task, classes, taskTypes, formatTimeForDisplay, onToggleComplete, onEdit }) => {
  const style = getEventStyle(task, taskTypes);

  return (
    <div
      className={`${style.bg} ${style.border} rounded-md p-2 mb-1 shadow-sm cursor-pointer group relative hover:shadow-md transition-all duration-200 ease-in-out`}
      onClick={(e) => {
        e.stopPropagation();
        onToggleComplete(task);
      }}
      title={`${task.title} - ${classes.find(c => c.id === task.class)?.name || 'No Class'}`}
    >
      {/* Edit button */}
      <button
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/50"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(e, task);
        }}
        aria-label="Edit task"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
        </svg>
      </button>
      
      <div className={`font-semibold text-xs ${style.text} truncate`}>
        {task.title}
      </div>
      <div className="text-xs text-gray-600 truncate">
        {classes.find(c => c.id === task.class)?.name || 'No Class'}
      </div>
      <div className="text-xs text-gray-500 truncate">
        {taskTypes.find(t => t.id === task.type)?.name || 'No Type'}
        {task.isDuration ? 
          ` • ${formatTimeForDisplay(task.startTime)}-${formatTimeForDisplay(task.endTime)}` :
          task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : ''
        }
      </div>
    </div>
  );
};

// Reusable DayCell component
const DayCell = ({ 
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
  const getDayCellClasses = () => {
    let baseClasses = "flex flex-col justify-start p-2 border h-40 relative cursor-pointer transition-all duration-200 ease-in-out";
    
    if (!isCurrentMonth) {
      baseClasses += " bg-gray-50 text-gray-400";
    } else if (isToday) {
      baseClasses += " bg-blue-100 border-blue-500 rounded-lg";
    } else {
      baseClasses += " hover:bg-blue-50";
    }
    
    return baseClasses;
  };

  return (
    <div
      className={getDayCellClasses()}
      onClick={onClick}
    >
      {/* Date number */}
      <div className={`text-sm font-semibold absolute top-2 left-2 ${
        isToday ? 'text-blue-700' : 'text-gray-500'
      }`}>
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
};

// Reusable CalendarHeader component
const CalendarHeader = ({ 
  title, 
  onPrevious, 
  onNext, 
  view, 
  onViewChange 
}) => {
  const viewOptions = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      
      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* View toggle buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {viewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={`px-3 py-1 rounded-md font-medium shadow transition-all duration-200 ${
                view === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Previous period"
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Next period"
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const SimpleCalendar = ({ view: initialView }) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [view, setView] = useState(initialView || 'month');

  const [editingTask, setEditingTask] = useState(null);


  // Load data when auth state is ready or a sync has occurred
  useEffect(() => {
    const loadData = async () => {

      if (!loading && isAuthenticated && user && user.id && lastCalendarSyncTimestamp) {
        
        const fetchedTasks = await getTasks(user.id, isAuthenticated);
        setTasks(fetchedTasks || []);
        
        const fetchedClasses = await getClasses(user.id, isAuthenticated);
        setClasses(fetchedClasses || []);

        const fetchedTaskTypes = await getTaskTypes(user.id, isAuthenticated);
        setTaskTypes(fetchedTaskTypes || []);

      } else {
      }
    };
    loadData();
  }, [loading, isAuthenticated, user, user?.id, lastCalendarSyncTimestamp]);

  // Show a spinner if still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }


  // Navigation functions
  const previousPeriod = () => {
    setCurrentDate(getPreviousPeriod(currentDate, view));
  };

  const nextPeriod = () => {
    setCurrentDate(getNextPeriod(currentDate, view));
  };


  const handleDateClick = (day, month = currentDate.getMonth(), year = currentDate.getFullYear()) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    const taskDate = new Date(task.date);
    setSelectedDate(taskDate);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      const completeTaskData = {
        ...taskData,
        date: formatDateForInput(selectedDate),
        completed: taskData.completed || false,
      };

      if (editingTask) {
        const updatedTask = await updateTask(
          editingTask.id,
          completeTaskData,
          isAuthenticated
        );
        if (updatedTask) { 
          setLastCalendarSyncTimestamp(Date.now());
        }
      } else {
        const newTaskObj = await addTask(completeTaskData, isAuthenticated);
        if (newTaskObj) {
          setLastCalendarSyncTimestamp(Date.now());
        }
      }

      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      alert("There was an error adding your task. Please try again.");
    }
  };

  const handleDeleteTask = async () => {
    if (editingTask) {
      const success = await deleteTask(editingTask.id, isAuthenticated);
      if (success) {
        setLastCalendarSyncTimestamp(Date.now());
      }
      setShowTaskModal(false);
      setEditingTask(null);
    }
  };


  const getTasksForDay = (day, month = currentDate.getMonth(), year = currentDate.getFullYear()) => {
    const targetDate = new Date(year, month, day);
    const targetDateStr = formatDateForInput(targetDate);

    if (!tasks || tasks.length === 0) {
      return [];
    }

    const dayTasks = tasks.filter(task => {
      let match = false;
      if (task.dueDate) {
        match = task.dueDate === targetDateStr;
      } else {
        const taskDate = task.date ? new Date(task.date) : null;
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
  };


  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();

    const days = [];

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
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-0.5 min-w-[800px]">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
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
  const toggleTaskCompletion = async (task) => {
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
    }
  };


  // Week view rendering
  const renderWeekView = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const today = new Date();

    const days = [];
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
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-0.5 min-w-[800px]">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
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
  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear());
    const tasksByHour = {};
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

    // Render hours from 7 AM to 11 PM
    const hours = [];
    for (let i = 7; i <= 23; i++) {
      const format12Hours = i % 12 || 12;
      const beforeOrAfterNoon = i < 12 ? " AM" : " PM";
      const tasksForHour = tasksByHour[i] || [];

      hours.push(
        <div key={i} className="border border-gray-300 p-2 flex min-h-20">
          <div className="w-16 font-bold">
            {format12Hours}
            {beforeOrAfterNoon}
          </div>
          <div className="flex-1">
            {tasksForHour.map((task) => (
              <EventCard
                key={task.id}
                task={task}
                classes={classes}
                taskTypes={taskTypes}
                formatTimeForDisplay={formatTimeForDisplay}
                onToggleComplete={toggleTaskCompletion}
                onEdit={handleTaskClick}
              />
            ))}
          </div>
        </div>
      );
    }

    // Code to add 12 AM 
    hours.push(
      <div key={0} className="border border-gray-300 p-2 flex min-h-20">
        <div className="w-16 font-bold">12 AM</div>
        <div className="flex-1">
          {(tasksByHour[0] || []).map((task) => (
            <EventCard
              key={task.id}
              task={task}
              classes={classes}
              taskTypes={taskTypes}
              formatTimeForDisplay={formatTimeForDisplay}
              onToggleComplete={toggleTaskCompletion}
              onEdit={handleTaskClick}
            />
          ))}
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 gap-0.5">
        <div className="p-2 mb-2 text-lg font-bold">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        {hours}
      </div>
    );
  };

  // Calendar title based on view
  const renderTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endOfWeek.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <CalendarHeader
        title={renderTitle()}
        onPrevious={previousPeriod}
        onNext={nextPeriod}
        view={view}
        onViewChange={setView}
      />

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

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
      />
    </div>
  );
};

export default SimpleCalendar;
