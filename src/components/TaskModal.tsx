import React, { useRef, useEffect, useCallback, KeyboardEvent, useState } from "react";
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
  onSubmit: (task: TaskData) => Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Enhanced submit handler with loading state
  const handleAsyncSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use the form validation from useTaskForm
      handleSubmit(e, async (taskData) => {
        await onSubmit(taskData);
      });
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [handleSubmit, onSubmit, isSubmitting]);

  // Focus title input when modal opens
  useEffect(() => {
    if (showModal && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start sm:items-center z-[9999] p-1 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      data-testid="modal-backdrop"
    >
      <div 
        className="bg-white dark:bg-slate-800/95 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-t-lg sm:rounded-lg w-full max-w-lg sm:max-w-2xl max-h-[100vh] sm:max-h-[95vh] overflow-y-auto mt-auto sm:mt-0 shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          id="modal-title"
          className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 dark:text-white"
        >
          {editingTask ? "Edit Task" : "Add Task"}
        </h2>
        <p 
          id="modal-description"
          className="text-sm text-gray-600 dark:text-slate-400 mb-3 sm:mb-4"
        >
          Date: {modalDateDisplay}
        </p>

        <form onSubmit={handleAsyncSubmit} className="space-y-3 sm:space-y-4">
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
            isAddingClass={taskManagement.isAddingClass}
            isDeletingClass={taskManagement.isDeletingClass}
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
                  className="rounded border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Mark as completed</span>
              </label>
            </div>
          )}

          {/* Study Session Tracker */}
          {isAuthenticated && (
            <div className="border-t border-gray-200 dark:border-slate-600/50 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Study Session</h3>
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
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
                  aria-label="Delete this task permanently"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex space-x-2 order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-gray-300 dark:bg-slate-600/50 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-400 dark:hover:bg-slate-600/70 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
                aria-label="Cancel and close task modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 sm:flex-initial px-4 py-3 sm:py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                aria-label={editingTask ? "Update task with current information" : "Create new task with entered information"}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isSubmitting 
                  ? (editingTask ? "Updating..." : "Creating...")
                  : (editingTask ? "Update Task" : "Add Task")
                }
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