import React, { useState, useEffect } from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getClasses,
  getTaskTypes,
  addTaskType,
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";

const TASKS_KEY = "calendar_tasks";
const getLocalData = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const SimpleCalendar = ({ view }) => {
  const { user, isAuthenticated, loading, lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  // Enhanced task model with time features
  const [newTask, setNewTask] = useState({
    title: "",
    class: "",
    type: "",
    isDuration: false,
    dueDate: null,
    dueTime: "23:59", // Default to 11:59 PM
    startDate: null,
    startTime: "08:00",
    endDate: null,
    endTime: "11:00",
    completed: false,
  });

  const [editingTask, setEditingTask] = useState(null);

  // State for inline management
  const [showClassInput, setShowClassInput] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // Load data when auth state is ready or a sync has occurred
  useEffect(() => {
    const loadData = async () => {
      // Make sure user and user.id are available for Supabase fetches
      // Also ensure lastCalendarSyncTimestamp is present to react to explicit sync triggers
      console.log('[SimpleCalendar] useEffect loadData triggered. Dependencies: loading:', loading, 'isAuthenticated:', isAuthenticated, 'user present:', !!user, 'user.id present:', user ? !!user.id : false, 'lastCalendarSyncTimestamp:', lastCalendarSyncTimestamp);

      if (!loading && isAuthenticated && user && user.id && lastCalendarSyncTimestamp) { // Added lastCalendarSyncTimestamp to the condition
        console.log('[SimpleCalendar] loadData: Criteria FULLY met. User ID:', user.id, 'Sync Timestamp:', lastCalendarSyncTimestamp, '. Fetching tasks, classes, types...');
        
        const fetchedTasks = await getTasks(user.id, isAuthenticated);
        setTasks(fetchedTasks || []);
        console.log('[SimpleCalendar] loadData: setTasks called with', fetchedTasks ? fetchedTasks.length : 0, 'tasks.');
        
        const fetchedClasses = await getClasses(user.id, isAuthenticated);
        setClasses(fetchedClasses || []);
        console.log('[SimpleCalendar] loadData: setClasses called with', fetchedClasses ? fetchedClasses.length : 0, 'classes.');

        const fetchedTaskTypes = await getTaskTypes(user.id, isAuthenticated);
        setTaskTypes(fetchedTaskTypes || []);
        console.log('[SimpleCalendar] loadData: setTaskTypes called with', fetchedTaskTypes ? fetchedTaskTypes.length : 0, 'types.');

      } else {
        console.log(
          '[SimpleCalendar] loadData: Criteria NOT met for fetching. loading:', loading,
          'isAuthenticated:', isAuthenticated,
          'User object present:', !!user,
          'User ID present:', user ? !!user.id : false,
          'lastCalendarSyncTimestamp value:', lastCalendarSyncTimestamp
        );
      }
    };
    loadData();
  }, [loading, isAuthenticated, user, user?.id, lastCalendarSyncTimestamp]); // Added user?.id to dependency array for more direct reactivity

  // Show a spinner if still loading
  if (loading) { // This loading is from useAuth()
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  // Log current tasks state before rendering the actual calendar
  console.log(`[SimpleCalendar] Rendering. isAuthenticated: ${isAuthenticated}, Auth loading: ${loading}, Tasks in state (at render start): ${tasks.length}`);
  if (tasks.length > 0) {
    // console.log('[SimpleCalendar] First task for render:', tasks[0]); // Log first task to check structure
  }

  // Navigation functions
  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === "day") {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === "day") {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day, month = currentDate.getMonth(), year = currentDate.getFullYear()) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setEditingTask(null);

    // Initialize dates for new task
    const formattedClickedDate = formatDateForInput(clickedDate);

    setNewTask({
      title: "",
      class: classes.length > 0 ? classes[0].id : "",
      type: taskTypes.length > 0 ? taskTypes[0].id : "",
      isDuration: false,
      dueDate: formattedClickedDate,
      dueTime: "23:59",
      startDate: formattedClickedDate,
      startTime: "08:00",
      endDate: formattedClickedDate,
      endTime: "11:00",
      completed: false,
    });

    setShowTaskModal(true);
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    const taskDate = new Date(task.date);
    setSelectedDate(taskDate);

    const formattedTaskDate = formatDateForInput(taskDate);

    // Prepare task data based on whether it's a duration-based task
    let taskDataForEdit = {
      title: task.title,
      class: task.class,
      type: task.type,
      isDuration: task.isDuration || false,
      dueDate: task.dueDate || formattedTaskDate,
      dueTime: task.dueTime || "23:59",
      startDate: task.startDate || formattedTaskDate,
      startTime: task.startTime || "08:00",
      endDate: task.endDate || formattedTaskDate,
      endTime: task.endTime || "11:00",
      completed: task.completed || false,
    };

    setEditingTask(task);
    setNewTask(taskDataForEdit);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    try {
      let taskData = {
        ...newTask,
        date: formatDateForInput(selectedDate),
        completed: newTask.completed || false,
      };

      if (editingTask) {
        const updatedTask = await updateTask(
          editingTask.id,
          taskData,
          isAuthenticated
        );
        if (updatedTask) { 
          setLastCalendarSyncTimestamp(Date.now());
        }
      } else {
        const newTaskObj = await addTask(taskData, isAuthenticated);
        if (newTaskObj) {
          setLastCalendarSyncTimestamp(Date.now());
        }
      }

      setNewTask({
        title: "",
        class: classes.length > 0 ? classes[0].id : "",
        type: taskTypes.length > 0 ? taskTypes[0].id : "",
        isDuration: false,
        dueDate: null,
        dueTime: "23:59",
        startDate: null,
        startTime: "08:00",
        endDate: null,
        endTime: "11:00",
        completed: false,
      });
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error("Error submitting task:", error);
      alert("There was an error adding your task. Please try again.");
      // Don't close the modal so the user can try again
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

  // Helper to format a Date object to YYYY-MM-DD string
  const getYYYYMMDD = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTasksForDay = (day, month = currentDate.getMonth(), year = currentDate.getFullYear()) => {
    const targetDate = new Date(year, month, day);
    const targetDateStr = getYYYYMMDD(targetDate);
    console.log(`[SimpleCalendar] getTasksForDay called for ${targetDateStr}. Tasks available when called: ${tasks.length}`);

    if (!tasks || tasks.length === 0) {
      console.log(`[SimpleCalendar] getTasksForDay: No tasks available in state for ${targetDateStr}.`);
      return [];
    }

    const dayTasks = tasks.filter(task => {
      let match = false;
      if (task.dueDate) {
        match = task.dueDate === targetDateStr;
      } else {
        const taskDate = task.date ? new Date(task.date) : null;
        const taskDateStr = getYYYYMMDD(taskDate);
        match = taskDateStr === targetDateStr;
      }
      return match;
    });
    
    console.log(`[getTasksForDay] For ${targetDateStr}, found ${dayTasks.length} tasks.`);
    return dayTasks.sort((a, b) => {
      const timeA = a.dueTime || (a.date ? new Date(a.date).toLocaleTimeString() : '00:00');
      const timeB = b.dueTime || (b.date ? new Date(b.date).toLocaleTimeString() : '00:00');
      return timeA.localeCompare(timeB);
    });
  };

  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      // Add min-height to empty cells as well
      days.push(<div key={`empty-${i}`} className="min-h-[8rem]"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);

      days.push(
        <div
          key={day}
          // Add min-height and flex properties for dynamic sizing
          className="border border-gray-300 p-1 cursor-pointer overflow-hidden flex flex-col min-h-[8rem]"
          onClick={() => handleDateClick(day)}
        >
          <div className="font-bold">{day}</div>
          {/* Ensure this container grows and scrolls if needed */}
          <div className="flex-grow overflow-y-auto">
            {dayTasks.map((task) => {
              let bgColor = task.completed ? "bg-green-200" : "bg-blue-200";
              let borderColor = task.completed ? "border-l-green-600" : "border-l-blue-600";
              return (
                <div
                  key={task.id}
                  className={`${bgColor} ${borderColor} border-l-3 py-1 px-2 my-1 text-xs rounded cursor-pointer group relative`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task);
                  }}
                >
                  {/* Pencil icon for editing */}
                  <button
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(e, task);
                    }}
                    aria-label="Edit task"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-gray-600">
                    {classes.find(c => c.id === task.class)?.name || 'No Class'}
                  </div>
                  <div className="text-gray-500">
                    {taskTypes.find(t => t.id === task.type)?.name || 'No Type'}
                    {task.isDuration ? 
                      ` • ${formatTimeForDisplay(task.startTime)}-${formatTimeForDisplay(task.endTime)}` :
                      task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : ''
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-7 gap-0.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-bold">
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
      console.error("Error toggling task completion:", error);
    }
  };

  // Task Modal with Inline Management
  const renderTaskModal = () => {
    if (!showTaskModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-10">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-w-lg">
          <h3 className="text-xl font-semibold mb-4">
            {editingTask ? "Edit Task" : "Add Task"} for{" "}
            {selectedDate?.toLocaleDateString()}
          </h3>
          <form onSubmit={handleTaskSubmit}>
            {/* Task Title */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Task title:</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Class Selection with inline management */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Class:</label>
              <div className="flex flex-col space-y-2">
                {/* Class dropdown */}
                <select
                  value={newTask.class}
                  onChange={(e) => {
                    if (e.target.value === "add-new") {
                      setShowClassInput(true);
                    } else {
                      setNewTask({ ...newTask, class: e.target.value });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                  <option value="add-new">+ Add new class</option>
                </select>

                {/* New class input - simplified with auto-generated ID */}
                {showClassInput && (
                  <div className="mt-2">
                    <div className="flex">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Enter class name (e.g., CS 175)"
                        className="flex-1 p-2 border border-gray-300 rounded-l shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newClassName.trim()) {
                            // Auto-generate ID by converting name to lowercase, removing spaces and special chars
                            const autoId =
                              newClassName
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "") +
                              "_" +
                              Date.now().toString().slice(-4);

                            const newClass = {
                              id: autoId,
                              name: newClassName.trim(),
                            };

                            // Add class via data service
                            const classesToAdd = [...classes, newClass];
                            setClasses(classesToAdd);

                            setNewTask({ ...newTask, class: newClass.id });
                            setNewClassName("");
                            setShowClassInput(false);
                          }
                        }}
                        className="bg-green-500 text-white px-3 py-2 hover:bg-green-600 rounded-r"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewClassName("");
                          setShowClassInput(false);
                        }}
                        className="bg-gray-300 text-gray-700 px-2 ml-1 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Type Selection with inline management */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Type:</label>
              <div className="flex flex-col space-y-2">
                {/* Type dropdown */}
                <select
                  value={newTask.type}
                  onChange={(e) => {
                    if (e.target.value === "add-new") {
                      setShowTypeInput(true);
                      setNewTask({ ...newTask, type: "" });
                    } else {
                      setNewTask({ ...newTask, type: e.target.value });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a type</option>
                  {taskTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                  <option value="add-new">+ Add new type</option>
                </select>

                {/* New type input - simplified with auto-generated ID */}
                {showTypeInput && (
                  <div className="mt-2">
                    <div className="flex">
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Enter type name (e.g., Midterm)"
                        className="flex-1 p-2 border border-gray-300 rounded-l shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newTypeName.trim()) {
                            // Auto-generate ID by converting name to lowercase, removing spaces and special chars
                            const autoId =
                              newTypeName
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "") +
                              "_" +
                              Date.now().toString().slice(-4);

                            const newType = {
                              id: autoId,
                              name: newTypeName.trim(),
                            };

                            try {
                              // Import addTaskType at the top of the file
                              const savedType = await addTaskType(newType, isAuthenticated);
                              if (savedType) {
                                // Update local state with the saved type
                                setTaskTypes(prevTypes => [...prevTypes, savedType]);
                                setNewTask({ ...newTask, type: savedType.id });
                              }
                            } catch (error) {
                              console.error("Error saving task type:", error);
                              alert("Failed to save task type. Please try again.");
                            }

                            setNewTypeName("");
                            setShowTypeInput(false);
                          }
                        }}
                        className="bg-green-500 text-white px-3 py-2 hover:bg-green-600 rounded-r"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTypeName("");
                          setShowTypeInput(false);
                        }}
                        className="bg-gray-300 text-gray-700 px-2 ml-1 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Time Options */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="block text-gray-700 mr-4">Time Type:</label>
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button
                    type="button"
                    className={`px-3 py-1 ${!newTask.isDuration
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                      }`}
                    onClick={() =>
                      setNewTask({ ...newTask, isDuration: false })
                    }
                  >
                    Deadline
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 ${newTask.isDuration
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700"
                      }`}
                    onClick={() => setNewTask({ ...newTask, isDuration: true })}
                  >
                    Duration
                  </button>
                </div>
              </div>

              {/* Deadline Mode */}
              {!newTask.isDuration && (
                <div className="bg-blue-50 p-3 rounded">
                  <label className="block text-gray-700 mb-2">
                    Due Date & Time:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTask.dueDate || ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded flex-1"
                      required
                    />
                    <input
                      type="time"
                      value={newTask.dueTime || ""}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueTime: e.target.value })
                      }
                      className="p-2 border border-gray-300 rounded w-32"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Duration Mode */}
              {newTask.isDuration && (
                <div className="bg-green-50 p-3 rounded">
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">
                      Start Date & Time:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newTask.startDate || ""}
                        onChange={(e) =>
                          setNewTask({ ...newTask, startDate: e.target.value })
                        }
                        className="p-2 border border-gray-300 rounded flex-1"
                        required
                      />
                      <input
                        type="time"
                        value={newTask.startTime || ""}
                        onChange={(e) =>
                          setNewTask({ ...newTask, startTime: e.target.value })
                        }
                        className="p-2 border border-gray-300 rounded w-32"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">
                      End Date & Time:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newTask.endDate || ""}
                        onChange={(e) =>
                          setNewTask({ ...newTask, endDate: e.target.value })
                        }
                        className="p-2 border border-gray-300 rounded flex-1"
                        required
                      />
                      <input
                        type="time"
                        value={newTask.endTime || ""}
                        onChange={(e) =>
                          setNewTask({ ...newTask, endTime: e.target.value })
                        }
                        className="p-2 border border-gray-300 rounded w-32"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
              >
                Cancel
              </button>
              <div>
                {editingTask && (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded mr-2 transition"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
                >
                  {editingTask ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Week view rendering
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      // Get tasks for this specific day
      const dayTasks = getTasksForDay(day.getDate(), day.getMonth(), day.getFullYear());

      days.push(
        <div
          key={i}
          className="border border-gray-300 p-2 h-64 cursor-pointer overflow-auto"
          onClick={() => handleDateClick(day.getDate(), day.getMonth(), day.getFullYear())}
        >
          <div className="font-bold">{day.getDate()}</div>
          <div className="text-sm text-gray-600 mb-1">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.getDay()]}
          </div>

          {dayTasks.map((task) => {
            let bgColor = task.completed ? "bg-green-200" : "bg-blue-200";
            let borderColor = task.completed ? "border-l-green-600" : "border-l-blue-600";
            return (
              <div
                key={task.id}
                className={`${bgColor} ${borderColor} border-l-3 py-1 px-2 my-1 text-xs rounded cursor-pointer group relative`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskCompletion(task);
                }}
              >
                {/* Pencil icon for editing */}
                <button
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick(e, task);
                  }}
                  aria-label="Edit task"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                  </svg>
                </button>
                <div className="font-medium">{task.title}</div>
                <div className="text-gray-600">
                  {classes.find(c => c.id === task.class)?.name || 'No Class'}
                </div>
                <div className="text-gray-500">
                  {taskTypes.find(t => t.id === task.type)?.name || 'No Type'}
                  {task.isDuration ? 
                    ` • ${formatTimeForDisplay(task.startTime)}-${formatTimeForDisplay(task.endTime)}` :
                    task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : ''
                  }
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1">{days}</div>;
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
            {tasksForHour.map((task) => {
              let bgColor = task.completed ? "bg-green-200" : "bg-blue-200";
              let borderColor = task.completed ? "border-l-green-600" : "border-l-blue-600";
              return (
                <div
                  key={task.id}
                  className={`${bgColor} ${borderColor} border-l-3 py-1 px-2 mb-1 text-sm rounded cursor-pointer group relative`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task);
                  }}
                >
                  {/* Pencil icon for editing */}
                  <button
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(e, task);
                    }}
                    aria-label="Edit task"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-gray-600">
                    {classes.find(c => c.id === task.class)?.name || 'No Class'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {taskTypes.find(t => t.id === task.type)?.name || 'No Type'}
                    {task.isDuration ? 
                      ` • ${formatTimeForDisplay(task.startTime)}-${formatTimeForDisplay(task.endTime)}` :
                      task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : ''
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Code to add 12 AM 
    hours.push(
      <div key={0} className="border border-gray-300 p-2 flex min-h-20">
        <div className="w-16 font-bold">12 AM</div>
        <div className="flex-1">
          {(tasksByHour[0] || []).map((task) => {
            let bgColor = task.completed ? "bg-green-200" : "bg-blue-200";
            let borderColor = task.completed ? "border-l-green-600" : "border-l-blue-600";
            return (
              <div
                key={task.id}
                className={`${bgColor} ${borderColor} border-l-3 py-1 px-2 mb-1 text-sm rounded cursor-pointer group relative`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskCompletion(task);
                }}
              >
                {/* Pencil icon for editing */}
                <button
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick(e, task);
                  }}
                  aria-label="Edit task"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                  </svg>
                </button>
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-gray-600">
                  {classes.find(c => c.id === task.class)?.name || 'No Class'}
                </div>
                <div className="text-xs text-gray-500">
                  {taskTypes.find(t => t.id === task.type)?.name || 'No Type'}
                  {task.isDuration ? 
                    ` • ${formatTimeForDisplay(task.startTime)}-${formatTimeForDisplay(task.endTime)}` :
                    task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : ''
                  }
                </div>
              </div>
            );
          })}
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
    <div className="border border-gray-300 p-4 bg-white">
      <div className="flex justify-between mb-4">
        <button onClick={previousPeriod} className="py-1 px-2.5">
          ←
        </button>
        <h3 className="m-0 font-bold text-xl">{renderTitle()}</h3>
        <button onClick={nextPeriod} className="py-1 px-2.5">
          →
        </button>
      </div>

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}

      {renderTaskModal()}
    </div>
  );
};

export default SimpleCalendar;
