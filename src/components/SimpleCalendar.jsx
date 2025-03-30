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

const SimpleCalendar = ({ view }) => {
  const { isAuthenticated } = useAuth();
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
    startTime: "08:00", // Default to 8:00 AM
    endDate: null,
    endTime: "11:00", // Default to 11:00 AM
  });

  const [editingTask, setEditingTask] = useState(null);

  // State for inline management
  const [showClassInput, setShowClassInput] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // Load data from service
  useEffect(() => {
    const loadData = async () => {
      // Load tasks
      const fetchedTasks = await getTasks(isAuthenticated);
      setTasks(fetchedTasks);

      // Load classes
      const fetchedClasses = await getClasses(isAuthenticated);
      setClasses(fetchedClasses);

      // Load task types
      const fetchedTaskTypes = await getTaskTypes(isAuthenticated);
      setTaskTypes(fetchedTaskTypes);
    };

    loadData();
  }, [isAuthenticated]);

  // Refreshes calendar data / view when tasks are added to the app
  useEffect(() => {
    const refreshCalendarData = async () => {
      console.log("Calendar: Refreshing task data...");
      const fetchedTasks = await getTasks(isAuthenticated);
      console.log(`Calendar: Loaded ${fetchedTasks.length} tasks`);
      setTasks(fetchedTasks);
    };

    // Listen for custom event
    window.addEventListener("calendar-update", refreshCalendarData);

    // Clean up event listener
    return () => {
      window.removeEventListener("calendar-update", refreshCalendarData);
    };
  }, [isAuthenticated]);

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

  const handleDateClick = (day) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
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
    });

    setShowTaskModal(true);
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    const taskDate = new Date(task.date);
    setSelectedDate(taskDate);

    // Format dates for editing existing task
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
    };

    setEditingTask(task);
    setNewTask(taskDataForEdit);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    // Create a full date object for the task
    let taskData = {
      ...newTask,
      date: selectedDate, // Keep the original date for backward compatibility
    };

    if (editingTask) {
      // Update existing task
      const updatedTask = await updateTask(
        editingTask.id,
        taskData,
        isAuthenticated
      );
      setTasks(
        tasks.map((task) => (task.id === editingTask.id ? updatedTask : task))
      );
    } else {
      // Add new task
      const newTaskObj = await addTask(taskData, isAuthenticated);
      setTasks([...tasks, newTaskObj]);
    }

    // Reset form and close modal
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
    });
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async () => {
    if (editingTask) {
      await deleteTask(editingTask.id, isAuthenticated);
      setTasks(tasks.filter((task) => task.id !== editingTask.id));
      setShowTaskModal(false);
      setEditingTask(null);
    }
  };

  // Replace the getTasksForDay function in SimpleCalendar.jsx with this improved version

  const getTasksForDay = (day) => {
    return tasks.filter((task) => {
      // Create the target date for comparison
      const targetDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );

      // For debugging
      console.log(
        `Task: ${task.title}, taskDate: ${task.date}, dueDate: ${task.dueDate}`
      );

      // For simple deadline tasks (backward compatibility)
      if (!task.isDuration && task.date) {
        try {
          const taskDate = new Date(task.date);
          console.log(`Checking task date: ${taskDate.toLocaleDateString()}`);
          if (
            taskDate.getDate() === day &&
            taskDate.getMonth() === currentDate.getMonth() &&
            taskDate.getFullYear() === currentDate.getFullYear()
          ) {
            console.log(`Match found with task.date for ${task.title}`);
            return true;
          }
        } catch (e) {
          console.error("Error parsing task.date:", e);
        }
      }

      // For deadline tasks with dueDate
      if (task.dueDate) {
        try {
          const dueDate = new Date(task.dueDate);
          console.log(`Checking due date: ${dueDate.toLocaleDateString()}`);

          // If it's just a date string like "2023-03-19"
          if (
            dueDate.getDate() === day &&
            dueDate.getMonth() === currentDate.getMonth() &&
            dueDate.getFullYear() === currentDate.getFullYear()
          ) {
            console.log(`Match found with task.dueDate for ${task.title}`);
            return true;
          }
        } catch (e) {
          console.error("Error parsing task.dueDate:", e);
        }
      }

      // For duration tasks
      if (task.isDuration && task.startDate && task.endDate) {
        try {
          const startDate = new Date(task.startDate);
          const endDate = new Date(task.endDate);
          console.log(
            `Checking duration from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
          );

          // Check if this day falls within the start and end dates
          if (targetDate >= startDate && targetDate <= endDate) {
            console.log(`Match found within date range for ${task.title}`);
            return true;
          }
        } catch (e) {
          console.error("Error parsing duration dates:", e);
        }
      }

      // Special handling for the syllabus data which might be in a different format
      if (task.classId && task.className && task.dueDate) {
        try {
          // Try different date formats
          let dueDate;

          // Direct string might be ISO format
          dueDate = new Date(task.dueDate);

          console.log(
            `Checking special format due date: ${dueDate.toLocaleDateString()}`
          );

          if (
            dueDate.getDate() === day &&
            dueDate.getMonth() === currentDate.getMonth() &&
            dueDate.getFullYear() === currentDate.getFullYear()
          ) {
            console.log(`Match found with special format for ${task.title}`);
            return true;
          }
        } catch (e) {
          console.error("Error parsing special format date:", e);
        }
      }

      return false;
    });
  };

  // Format time for display (e.g., "8:00 AM")
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Month view rendering
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);

      days.push(
        <div
          key={day}
          className="border border-gray-300 p-1 h-20 cursor-pointer overflow-hidden"
          onClick={() => handleDateClick(day)}
        >
          <div className="font-bold">{day}</div>
          {dayTasks.map((task) => {
            // Get the appropriate bg color based on class
            let bgColor = "bg-blue-50";
            let borderColor = "border-l-blue-500";

            // Find the class
            const taskClass = classes.find((c) => c.id === task.class);

            if (taskClass) {
              if (task.class === "cs179g") {
                bgColor = "bg-blue-50";
                borderColor = "border-l-blue-500";
              } else if (task.class === "cs147") {
                bgColor = "bg-green-50";
                borderColor = "border-l-green-500";
              } else if (task.class === "ee100a") {
                bgColor = "bg-orange-50";
                borderColor = "border-l-orange-500";
              } else {
                bgColor = "bg-purple-50";
                borderColor = "border-l-purple-500";
              }
            }

            // Add visual indicator for tasks with specific times
            let timeDisplay = "";
            if (task.isDuration) {
              timeDisplay = ` (${formatTimeForDisplay(
                task.startTime
              )}-${formatTimeForDisplay(task.endTime)})`;
            } else if (task.dueTime) {
              timeDisplay = ` (Due: ${formatTimeForDisplay(task.dueTime)})`;
            }

            return (
              <div
                key={task.id}
                className={`${bgColor} ${borderColor} border-l-3 py-0.5 px-1 my-0.5 text-xs rounded whitespace-nowrap overflow-hidden text-ellipsis`}
                onClick={(e) => handleTaskClick(e, task)}
              >
                {task.title}
                {task.isDuration && <span className="ml-1">⏱️</span>}
                {!task.isDuration && <span className="ml-1">📅</span>}
              </div>
            );
          })}
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

                            // Add type via data service
                            const typesToAdd = [...taskTypes, newType];
                            setTaskTypes(typesToAdd);

                            setNewTask({ ...newTask, type: newType.id });
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
                    className={`px-3 py-1 ${
                      !newTask.isDuration
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
                    className={`px-3 py-1 ${
                      newTask.isDuration
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
      days.push(
        <div key={i} className="border border-gray-300 p-2.5 min-h-64">
          <div className="font-bold">{day.getDate()}</div>
          <div>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1">{days}</div>;
  };

  // Day view rendering
  const renderDayView = () => {
    const hours = [];
    for (let i = 7; i <= 23; i++) {
      const hour12Format = i % 12 || 12;
      const beforeOrAfterNoon = i < 12 ? " AM" : " PM";

      hours.push(
        <div key={i} className="border border-gray-300 p-2.5 flex">
          <div className="w-16 font-bold">
            {hour12Format}
            {beforeOrAfterNoon}
          </div>
          <div className="flex-1 min-h-10"></div>
        </div>
      );
    }

    hours.push(
      <div key={0} className="border border-gray-300 p-2.5 flex">
        <div className="w-16 font-bold">12 AM</div>
        <div className="flex-1 min-h-10"></div>
      </div>
    );

    return <div className="grid grid-cols-1 gap-0">{hours}</div>;
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
