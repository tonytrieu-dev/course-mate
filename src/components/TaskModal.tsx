import React, { useRef, useEffect } from "react";
import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations, TaskType, TaskWithMeta } from "../types/database";
import { useTaskForm } from "../hooks/useTaskForm";
import { useTaskManagement } from "../hooks/useTaskManagement";
import TaskFormFields from "./taskModal/TaskFormFields";
import ClassManagement from "./taskModal/ClassManagement";
import TaskTypeManagement from "./taskModal/TaskTypeManagement";
import { StudySessionTracker } from "./StudySessionTracker";

export interface TaskData {
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

interface TaskModalProps {
  showModal: boolean;
  onClose: () => void;
  onSubmit: (task: TaskData) => void;
  onDelete?: () => void;
  editingTask: TaskWithMeta | null;
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
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Task form management
  const {
    task,
    setTask,
    handleInputChange,
    modalDateDisplay,
    handleSubmit,
  } = useTaskForm({
    editingTask,
    selectedDate,
    classes,
    taskTypes,
  });

  // Task management (classes and types)
  const taskManagement = useTaskManagement({
    classes,
    setClasses,
    taskTypes,
    setTaskTypes,
    isAuthenticated,
    user,
    task,
    setTask,
  });

  // Focus title input when modal opens
  useEffect(() => {
    if (showModal && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-sm sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">
          {editingTask ? "Edit Task" : "Add Task"}
        </h2>
        <p className="text-sm text-gray-600 mb-3 sm:mb-4">Date: {modalDateDisplay}</p>

        <form onSubmit={(e) => handleSubmit(e, onSubmit)} className="space-y-3 sm:space-y-4">
          <TaskFormFields
            task={task}
            onInputChange={handleInputChange}
            titleInputRef={titleInputRef}
          />

          <ClassManagement
            classes={classes}
            task={task}
            onInputChange={handleInputChange}
            showClassInput={taskManagement.showClassInput}
            setShowClassInput={taskManagement.setShowClassInput}
            newClassName={taskManagement.newClassName}
            setNewClassName={taskManagement.setNewClassName}
            onAddClass={taskManagement.handleAddClass}
            showClassManagement={taskManagement.showClassManagement}
            setShowClassManagement={taskManagement.setShowClassManagement}
            hoveredClassId={taskManagement.hoveredClassId}
            setHoveredClassId={taskManagement.setHoveredClassId}
            onDeleteClass={taskManagement.handleDeleteClass}
          />

          <TaskTypeManagement
            taskTypes={taskTypes}
            task={task}
            onInputChange={handleInputChange}
            showTypeInput={taskManagement.showTypeInput}
            setShowTypeInput={taskManagement.setShowTypeInput}
            newTypeName={taskManagement.newTypeName}
            setNewTypeName={taskManagement.setNewTypeName}
            newTypeColor={taskManagement.newTypeColor}
            setNewTypeColor={taskManagement.setNewTypeColor}
            onAddTaskType={taskManagement.handleAddTaskType}
            showTypeManagement={taskManagement.showTypeManagement}
            setShowTypeManagement={taskManagement.setShowTypeManagement}
            hoveredTypeId={taskManagement.hoveredTypeId}
            setHoveredTypeId={taskManagement.setHoveredTypeId}
            editingTypeId={taskManagement.editingTypeId}
            setEditingTypeId={taskManagement.setEditingTypeId}
            editingTypeColor={taskManagement.editingTypeColor}
            setEditingTypeColor={taskManagement.setEditingTypeColor}
            editingTypeCompletedColor={taskManagement.editingTypeCompletedColor}
            setEditingTypeCompletedColor={taskManagement.setEditingTypeCompletedColor}
            onDeleteTaskType={taskManagement.handleDeleteTaskType}
            onUpdateTaskType={taskManagement.handleUpdateTaskType}
          />

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

          {/* Study Session Tracker */}
          {isAuthenticated && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Study Session</h3>
              <StudySessionTracker taskId={editingTask?.id} />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
            <div className="order-2 sm:order-1">
              {editingTask && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex space-x-2 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
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