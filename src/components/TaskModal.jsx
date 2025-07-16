import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { addTaskType, addClass, deleteTaskType, deleteClass } from "../services/dataService";
import classService from "../services/classService";
import { logger } from "../utils/logger";

const TaskModal = ({
  showModal,
  onClose,
  onSubmit,
  onDelete,
  editingTask,
  selectedDate,
  classes,
  taskTypes,
  isAuthenticated,
  setTaskTypes,
  setClasses,
  user
}) => {
  const [task, setTask] = useState({
    title: "",
    class: "",
    type: "",
    isDuration: false,
    dueDate: "",
    dueTime: "23:59",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "11:00",
    completed: false,
  });

  // Memoize default task state to prevent unnecessary recalculations
  const defaultTaskState = useMemo(() => {
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : "";
    return {
      title: "",
      class: classes.length > 0 ? classes[0].id : "",
      type: taskTypes.length > 0 ? taskTypes[0].id : "",
      isDuration: false,
      dueDate: formattedDate,
      dueTime: "23:59",
      startDate: formattedDate,
      startTime: "08:00",
      endDate: formattedDate,
      endTime: "11:00",
      completed: false,
    };
  }, [selectedDate, classes, taskTypes]);

  // Update task state when props change
  useEffect(() => {
    let newTaskState = { ...defaultTaskState };

    // If editing an existing task, override with its data
    if (editingTask) {
      newTaskState = {
        ...newTaskState,
        title: editingTask.title || "",
        class: editingTask.class || newTaskState.class,
        type: editingTask.type || newTaskState.type,
        isDuration: Boolean(editingTask.isDuration),
        dueDate: editingTask.dueDate || newTaskState.dueDate,
        dueTime: editingTask.dueTime || newTaskState.dueTime,
        startDate: editingTask.startDate || newTaskState.startDate,
        startTime: editingTask.startTime || newTaskState.startTime,
        endDate: editingTask.endDate || newTaskState.endDate,
        endTime: editingTask.endTime || newTaskState.endTime,
        completed: Boolean(editingTask.completed),
      };
    }

    setTask(newTaskState);
  }, [editingTask, defaultTaskState]);

  const [showClassInput, setShowClassInput] = useState(false);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showTypeManagement, setShowTypeManagement] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("blue");
  const [hoveredTypeId, setHoveredTypeId] = useState(null);
  const [hoveredClassId, setHoveredClassId] = useState(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    logger.debug('TaskModal form submitted', { hasTitle: !!task.title, classCount: classes.length, typeCount: taskTypes.length });
    
    // Basic validation
    if (!task.title || !task.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    // Only validate class/type if they exist
    if (classes.length > 0 && !task.class) {
      alert('Please select a class');
      return;
    }
    
    if (taskTypes.length > 0 && !task.type) {
      alert('Please select a task type');
      return;
    }
    
    logger.debug('TaskModal validation passed, submitting task', { taskId: task.id, isDuration: task.isDuration });
    onSubmit(task);
  }, [task, classes.length, taskTypes.length, onSubmit]);

  const handleDeleteTaskType = async (typeId) => {
    const typeToDelete = taskTypes.find(t => t.id === typeId);
    if (!typeToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the task type "${typeToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const success = await deleteTaskType(typeId, isAuthenticated);
      if (success) {
        // Update local state to remove the deleted type
        setTaskTypes(prevTypes => prevTypes.filter(type => type.id !== typeId));
        
        // If the current task has this type, clear it
        if (task.type === typeId) {
          setTask({ ...task, type: "" });
        }
      }
    } catch (error) {
      console.error("Error deleting task type:", error);
      alert("Failed to delete task type. Please try again.");
    }
  };

  const handleDeleteClass = async (classId) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the class "${classToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const success = await deleteClass(classId, isAuthenticated);
      if (success) {
        // Update classService to reflect the deletion
        const currentClasses = classService.getCurrentClasses();
        const updatedClasses = currentClasses.filter(cls => cls.id !== classId);
        classService.classes = updatedClasses;
        classService.notifyListeners();
        
        // Update parent component's classes state
        if (setClasses) {
          setClasses(prevClasses => prevClasses.filter(cls => cls.id !== classId));
        }
        
        // If the current task has this class, clear it
        if (task.class === classId) {
          setTask({ ...task, class: "" });
        }
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class. Please try again.");
    }
  };

  // Reset input states when modal closes
  useEffect(() => {
    if (!showModal) {
      setShowClassInput(false);
      setShowTypeInput(false);
      setShowClassManagement(false);
      setShowTypeManagement(false);
      setNewClassName("");
      setNewTypeName("");
      setNewTypeColor("blue");
      setHoveredTypeId(null);
      setHoveredClassId(null);
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 w-[500px] max-w-lg mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {editingTask ? "Edit Task" : "Add Task"} for{" "}
          {(() => {
            if (editingTask) {
              const dateStr = editingTask.dueDate || editingTask.date;
              if (dateStr) {
                // Parse date string correctly to avoid timezone issues
                const [year, month, day] = dateStr.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
              }
            }
            return selectedDate?.toLocaleDateString() || "No Date";
          })()}
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Task Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Task title</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
              required
            />
          </div>

          {/* Class Selection with inline management */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <div className="flex flex-col space-y-2">
              <select
                value={task.class}
                onChange={(e) => {
                  if (e.target.value === "add-new") {
                    setShowClassInput(true);
                  } else {
                    setTask({ ...task, class: e.target.value });
                  }
                }}
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
                <option value="add-new">+ Add new class</option>
              </select>

              {/* Class Management Section - Collapsible */}
              {classes.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowClassManagement(!showClassManagement)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-600 hover:text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <span>Manage classes</span>
                    <span className={`transform transition-transform duration-200 ${showClassManagement ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {showClassManagement && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-2 border border-gray-100">
                      <div className="space-y-1">
                        {classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-100 transition-colors duration-150"
                            onMouseEnter={() => setHoveredClassId(cls.id)}
                            onMouseLeave={() => setHoveredClassId(null)}
                          >
                            <span className="text-sm text-gray-700">{cls.name}</span>
                            {hoveredClassId === cls.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(cls.id)}
                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors duration-150"
                                title={`Delete "${cls.name}" class`}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Add Class button clicked');
                        console.log('newClassName:', newClassName);
                        console.log('isAuthenticated:', isAuthenticated);
                        console.log('user:', user);
                        
                        if (newClassName.trim()) {
                          const autoId = newClassName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_task_" + Date.now().toString().slice(-4);
                          const newClass = {
                            id: autoId,
                            name: newClassName.trim(),
                            syllabus: null,
                            files: [],
                            isTaskClass: true // Mark as task-only class
                          };
                          
                          console.log('Creating class:', newClass);
                          
                          try {
                            // Save directly to data service
                            const savedClass = await addClass(newClass, isAuthenticated);
                            console.log('savedClass result:', savedClass);
                            
                            if (savedClass) {
                              // Force refresh the classService to ensure persistence
                              const userId = savedClass.user_id || user?.id;
                              await classService.refreshClasses(userId, isAuthenticated);
                              
                              // Update parent component's classes state
                              if (setClasses) {
                                setClasses(prevClasses => [...prevClasses, savedClass]);
                              }
                              
                              setTask({ ...task, class: savedClass.id });
                              console.log('Class created successfully');
                            } else {
                              console.error('savedClass is null/undefined');
                              alert("Failed to save class. Please try again.");
                            }
                          } catch (error) {
                            console.error("Error creating class:", error);
                            alert("Failed to save class. Please try again.");
                          }
                          
                          setNewClassName("");
                          setShowClassInput(false);
                        } else {
                          console.log('No class name entered');
                          alert('Please enter a class name');
                        }
                      }}
                      className="bg-green-500 text-white px-3 py-2 hover:bg-green-600 rounded-r cursor-pointer"
                      style={{ zIndex: 1000 }}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex flex-col space-y-2">
              {/* Custom dropdown container */}
              <div className="relative">
                <select
                  value={task.type}
                  onChange={(e) => {
                    if (e.target.value === "add-new") {
                      setShowTypeInput(true);
                      setTask({ ...task, type: "" });
                    } else {
                      setTask({ ...task, type: e.target.value });
                    }
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                >
                  <option value="">Select a type</option>
                  {taskTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                  <option value="add-new">+ Add new type</option>
                </select>
              </div>

              {/* Task Type Management Section - Collapsible */}
              {taskTypes.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTypeManagement(!showTypeManagement)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-600 hover:text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <span>Manage task types</span>
                    <span className={`transform transition-transform duration-200 ${showTypeManagement ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {showTypeManagement && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-2 border border-gray-100">
                      <div className="space-y-1">
                        {taskTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-100 transition-colors duration-150"
                            onMouseEnter={() => setHoveredTypeId(type.id)}
                            onMouseLeave={() => setHoveredTypeId(null)}
                          >
                            <span className="text-sm text-gray-700">{type.name}</span>
                            {hoveredTypeId === type.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTaskType(type.id)}
                                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors duration-150"
                                title={`Delete "${type.name}" task type`}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showTypeInput && (
                <div className="mt-2 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Type Name</label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Enter task type name"
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-500', ring: 'ring-blue-500' },
                        { name: 'green', bg: 'bg-green-100', border: 'border-green-500', ring: 'ring-green-500' },
                        { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-500', ring: 'ring-purple-500' },
                        { name: 'red', bg: 'bg-red-100', border: 'border-red-500', ring: 'ring-red-500' },
                        { name: 'amber', bg: 'bg-amber-100', border: 'border-amber-500', ring: 'ring-amber-500' },
                        { name: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-500', ring: 'ring-indigo-500' },
                        { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-500', ring: 'ring-pink-500' },
                        { name: 'gray', bg: 'bg-gray-100', border: 'border-gray-500', ring: 'ring-gray-500' }
                      ].map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setNewTypeColor(color.name)}
                          className={`h-8 w-full rounded-md border-2 transition-all duration-200 ${color.bg} ${
                            newTypeColor === color.name 
                              ? `${color.border} ring-2 ${color.ring} ring-opacity-50` 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setNewTypeName("");
                        setNewTypeColor("blue");
                        setShowTypeInput(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (newTypeName.trim()) {
                          const autoId = newTypeName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString().slice(-4);
                          const newType = {
                            id: autoId,
                            name: newTypeName.trim(),
                            color: newTypeColor,
                          };

                          try {
                            const savedType = await addTaskType(newType, isAuthenticated);
                            if (savedType) {
                              setTaskTypes(prevTypes => [...prevTypes, savedType]);
                              setTask({ ...task, type: savedType.id });
                            }
                          } catch (error) {
                            alert("Failed to save task type. Please try again.");
                          }

                          setNewTypeName("");
                          setNewTypeColor("blue");
                          setShowTypeInput(false);
                        }
                      }}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      Create Type
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Options */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 mr-4">Time Type</label>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  type="button"
                  className={`px-3 py-1 ${!task.isDuration ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
                  onClick={() => setTask({ ...task, isDuration: false })}
                >
                  Deadline
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 ${task.isDuration ? "bg-blue-500 text-white" : "bg-white text-gray-700"}`}
                  onClick={() => setTask({ ...task, isDuration: true })}
                >
                  Duration
                </button>
              </div>
            </div>

            {/* Deadline Mode */}
            {!task.isDuration && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date & Time</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                  <input
                    type="time"
                    value={task.dueTime || ""}
                    onChange={(e) => setTask({ ...task, dueTime: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Duration Mode */}
            {task.isDuration && (
              <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={task.startDate || ""}
                      onChange={(e) => setTask({ ...task, startDate: e.target.value })}
                      className="p-3 border border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                    <input
                      type="time"
                      value={task.startTime || ""}
                      onChange={(e) => setTask({ ...task, startTime: e.target.value })}
                      className="p-3 border border-gray-200 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={task.endDate || ""}
                      onChange={(e) => setTask({ ...task, endDate: e.target.value })}
                      className="p-3 border border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                    <input
                      type="time"
                      value={task.endTime || ""}
                      onChange={(e) => setTask({ ...task, endTime: e.target.value })}
                      className="p-3 border border-gray-200 rounded-lg w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {editingTask && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                onClick={(e) => {
                  console.log('Submit button clicked');
                  // Let the form submission handle it, but add logging
                }}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                {editingTask ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(TaskModal);