import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations, TaskType } from "../types/database";
import { addTaskType, addClass, deleteTaskType, deleteClass, updateTaskType } from "../services/dataService";
import { logger } from "../utils/logger";
import { generateClassId, generateTypeId } from "../utils/idHelpers";

interface TaskData {
  id?: string;
  title: string;
  class: string;
  type: string;
  isDuration: boolean;
  dueDate: string;
  dueTime: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  completed: boolean;
  date?: string;
}

interface ColorOption {
  name: string;
  bg: string;
  border: string;
  ring: string;
}

interface TaskModalProps {
  showModal: boolean;
  onClose: () => void;
  onSubmit: (task: TaskData) => void;
  onDelete?: () => void;
  editingTask: TaskData | null;
  selectedDate: Date | null;
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  isAuthenticated: boolean;
  setTaskTypes: (types: TaskType[]) => void;
  setClasses: (classes: ClassWithRelations[]) => void;
  user: User | null;
}

const TaskModal: React.FC<TaskModalProps> = ({
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
  const [task, setTask] = useState<TaskData>({
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

  // Update task state when props change
  useEffect(() => {
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : "";
    let newTaskState: TaskData = {
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
  }, [editingTask, selectedDate, classes, taskTypes]);

  const [showClassInput, setShowClassInput] = useState<boolean>(false);
  const [showTypeInput, setShowTypeInput] = useState<boolean>(false);
  const [showClassManagement, setShowClassManagement] = useState<boolean>(false);
  const [showTypeManagement, setShowTypeManagement] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>("");
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [newTypeColor, setNewTypeColor] = useState<string>("blue");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeColor, setEditingTypeColor] = useState<string>("blue");
  const [editingTypeCompletedColor, setEditingTypeCompletedColor] = useState<string>("green");
  
  // Memoize color options to prevent re-creation on every render
  const colorOptions = useMemo<ColorOption[]>(() => [
    { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-500', ring: 'ring-blue-500' },
    { name: 'green', bg: 'bg-green-100', border: 'border-green-500', ring: 'ring-green-500' },
    { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-500', ring: 'ring-purple-500' },
    { name: 'red', bg: 'bg-red-100', border: 'border-red-500', ring: 'ring-red-500' },
    { name: 'amber', bg: 'bg-amber-100', border: 'border-amber-500', ring: 'ring-amber-500' },
    { name: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-500', ring: 'ring-indigo-500' },
    { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-500', ring: 'ring-pink-500' },
    { name: 'gray', bg: 'bg-gray-100', border: 'border-gray-500', ring: 'ring-gray-500' }
  ], []);
  
  const [hoveredTypeId, setHoveredTypeId] = useState<string | null>(null);
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  
  // Memoize the modal date display to prevent recalculation on every render
  const modalDateDisplay = useMemo(() => {
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
  }, [editingTask, selectedDate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
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
    
    // Ensure we have an id for editing tasks
    const taskToSubmit: TaskData = { 
      ...task, 
      id: editingTask ? editingTask.id : task.id 
    };
    
    logger.debug('TaskModal validation passed, submitting task', { taskId: taskToSubmit.id, isDuration: taskToSubmit.isDuration });
    onSubmit(taskToSubmit);
  }, [task, classes.length, taskTypes.length, editingTask, onSubmit]);

  const handleDeleteTaskType = useCallback(async (typeId: string) => {
    const typeToDelete = taskTypes.find(t => t.id === typeId);
    if (!typeToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the task type "${typeToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await deleteTaskType(typeId, isAuthenticated);
      setTaskTypes(taskTypes.filter(t => t.id !== typeId));
      
      if (task.type === typeId) {
        setTask(prev => ({ 
          ...prev, 
          type: taskTypes.find(t => t.id !== typeId)?.id || "" 
        }));
      }
    } catch (error: any) {
      console.error('Error deleting task type:', error);
      alert('Failed to delete task type. Please try again.');
    }
  }, [taskTypes, isAuthenticated, setTaskTypes, task.type]);

  const handleDeleteClass = useCallback(async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the class "${classToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      // Delete from database using dataService directly (bypassing classService to maintain independence)
      const success = await deleteClass(classId, isAuthenticated);
      
      if (success) {
        // Update local TaskModal state
        const updatedClasses = classes.filter(c => c.id !== classId);
        setClasses(updatedClasses);
        
        if (task.class === classId) {
          setTask(prev => ({ 
            ...prev, 
            class: updatedClasses.find(c => c.id !== classId)?.id || "" 
          }));
        }
      } else {
        throw new Error('Failed to delete class from database');
      }
    } catch (error: any) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  }, [classes, setClasses, task.class]);

  const handleAddClass = useCallback(async () => {
    if (!newClassName.trim()) {
      alert('Please enter a class name');
      return;
    }

    try {
      logger.debug('Adding new class via TaskModal', { className: newClassName, user: !!user });
      
      const classId = generateClassId(newClassName.trim());
      const newClass = {
        id: classId,
        user_id: user?.id || 'local-user',
        name: newClassName.trim(),
        syllabus: null,
        files: [],
        created_at: new Date().toISOString(),
        isTaskClass: true
      } as ClassWithRelations;

      // Save to database using dataService directly (bypassing classService to maintain independence)
      const savedClass = await addClass(newClass as any, isAuthenticated);
      
      if (savedClass) {
        logger.debug('Class saved successfully, updating TaskModal UI', { savedClass, currentClassesCount: classes.length });
        
        // Update local TaskModal state
        const updatedClasses = [...classes, savedClass];
        setClasses(updatedClasses);
        
        // Use the saved class ID (in case it was modified by the database)
        setTask(prev => ({ ...prev, class: savedClass.id }));
        setNewClassName("");
        setShowClassInput(false);
        
        logger.debug('TaskModal state updated', { newClassesCount: updatedClasses.length, selectedClassId: savedClass.id });
      } else {
        throw new Error('Failed to save class to database');
      }
    } catch (error: any) {
      console.error('Error adding class:', error);
      alert('Failed to add class. Please try again.');
    }
  }, [newClassName, classes, setClasses, user]);

  const handleAddTaskType = useCallback(async () => {
    if (!newTypeName.trim()) {
      alert('Please enter a task type name');
      return;
    }

    try {
      logger.debug('Adding new task type via TaskModal', { typeName: newTypeName, color: newTypeColor });
      
      const typeId = generateTypeId(newTypeName.trim());
      const newType = {
        id: typeId,
        name: newTypeName.trim(),
        color: newTypeColor,
        completedColor: 'green',
        user_id: user?.id || 'local-user',
        created_at: new Date().toISOString(),
      };

      const addedType = await addTaskType(newType, isAuthenticated);
      
      if (addedType) {
        setTaskTypes([...taskTypes, addedType]);
        setTask(prev => ({ ...prev, type: typeId }));
        setNewTypeName("");
        setNewTypeColor("blue");
        setShowTypeInput(false);
      }
    } catch (error: any) {
      console.error('Error adding task type:', error);
      alert('Failed to add task type. Please try again.');
    }
  }, [newTypeName, newTypeColor, taskTypes, isAuthenticated, setTaskTypes, user]);

  const handleUpdateTaskType = useCallback(async (typeId: string, newColor: string, newCompletedColor: string) => {
    try {
      const typeToUpdate = taskTypes.find(t => t.id === typeId);
      if (!typeToUpdate) return;

      const updatedType = await updateTaskType(
        typeId,
        { 
          color: newColor,
          completedColor: newCompletedColor 
        },
        isAuthenticated
      );

      if (updatedType) {
        setTaskTypes(taskTypes.map(t => 
          t.id === typeId ? { ...t, color: newColor, completedColor: newCompletedColor } : t
        ));
        setEditingTypeId(null);
      }
    } catch (error: any) {
      console.error('Error updating task type:', error);
      alert('Failed to update task type. Please try again.');
    }
  }, [taskTypes, isAuthenticated, setTaskTypes]);

  const handleInputChange = useCallback(<K extends keyof TaskData>(field: K, value: TaskData[K]) => {
    setTask(prev => ({ ...prev, [field]: value }));
  }, []);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when modal opens
  useEffect(() => {
    if (showModal && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {editingTask ? "Edit Task" : "Add Task"}
        </h2>
        <p className="text-sm text-gray-600 mb-4">Date: {modalDateDisplay}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={task.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter task title..."
              required
            />
          </div>

          {/* Task Type - Duration Toggle */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={task.isDuration}
                onChange={(e) => handleInputChange("isDuration", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">Duration-based task</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {task.isDuration 
                ? "Task has start and end times" 
                : "Task has a single due date and time"
              }
            </p>
          </div>

          {/* Date and Time Fields */}
          {task.isDuration ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={task.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={task.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={task.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={task.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  value={task.dueTime}
                  onChange={(e) => handleInputChange("dueTime", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Class Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Class {classes.length > 0 && "*"}
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowClassInput(!showClassInput)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add
                </button>
                {classes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClassManagement(!showClassManagement)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>

            {showClassInput && (
              <div className="mb-2 p-3 bg-gray-50 rounded-md">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Enter class name..."
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClassInput(false)}
                    className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {classes.length > 0 ? (
              <select
                value={task.class}
                onChange={(e) => handleInputChange("class", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No classes available. Add one above.
              </p>
            )}

            {showClassManagement && classes.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Manage Classes</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        hoveredClassId === cls.id ? 'bg-gray-200' : 'bg-white'
                      }`}
                      onMouseEnter={() => setHoveredClassId(cls.id)}
                      onMouseLeave={() => setHoveredClassId(null)}
                    >
                      <span>{cls.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Task Type Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Task Type {taskTypes.length > 0 && "*"}
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTypeInput(!showTypeInput)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Add
                </button>
                {taskTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTypeManagement(!showTypeManagement)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>

            {showTypeInput && (
              <div className="mb-2 p-3 bg-gray-50 rounded-md">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter task type name..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color:</label>
                    <div className="flex space-x-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setNewTypeColor(color.name)}
                          className={`w-6 h-6 rounded-full ${color.bg} ${
                            newTypeColor === color.name ? `ring-2 ${color.ring}` : 'border border-gray-300'
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddTaskType}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTypeInput(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {taskTypes.length > 0 ? (
              <select
                value={task.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">Select a task type...</option>
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No task types available. Add one above.
              </p>
            )}

            {showTypeManagement && taskTypes.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Manage Task Types</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {taskTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-2 rounded text-sm ${
                        hoveredTypeId === type.id ? 'bg-gray-200' : 'bg-white'
                      }`}
                      onMouseEnter={() => setHoveredTypeId(type.id)}
                      onMouseLeave={() => setHoveredTypeId(null)}
                    >
                      {editingTypeId === type.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{type.name}</span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateTaskType(type.id, editingTypeColor, editingTypeCompletedColor)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTypeId(null)}
                                className="text-gray-600 hover:text-gray-800 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Task Color:</label>
                            <div className="flex space-x-1">
                              {colorOptions.map((color) => (
                                <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => setEditingTypeColor(color.name)}
                                  className={`w-5 h-5 rounded-full ${color.bg} ${
                                    editingTypeColor === color.name ? `ring-2 ${color.ring}` : 'border border-gray-300'
                                  }`}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Completed Task Color:</label>
                            <div className="flex space-x-1">
                              {colorOptions.map((color) => (
                                <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => setEditingTypeCompletedColor(color.name)}
                                  className={`w-5 h-5 rounded-full ${color.bg} ${
                                    editingTypeCompletedColor === color.name ? `ring-2 ${color.ring}` : 'border border-gray-300'
                                  }`}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-${type.color || 'blue'}-100 border border-${type.color || 'blue'}-500`}
                            />
                            <span>{type.name}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTypeId(type.id);
                                setEditingTypeColor(type.color || 'blue');
                                setEditingTypeCompletedColor((type as any).completedColor || 'green');
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTaskType(type.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Completed Checkbox (only for editing) */}
          {editingTask && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => handleInputChange("completed", e.target.checked)}
                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                />
                <span className="text-sm font-medium text-gray-700">Mark as completed</span>
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between space-x-3 pt-4">
            <div>
              {editingTask && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editingTask ? "Update Task" : "Add Task"}
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