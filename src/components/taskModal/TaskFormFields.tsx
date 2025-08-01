import React from 'react';
import { TaskData } from '../TaskModal';

interface TaskFormFieldsProps {
  task: TaskData;
  onInputChange: <K extends keyof TaskData>(field: K, value: TaskData[K]) => void;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  task,
  onInputChange,
  titleInputRef,
}) => {
  return (
    <>
      {/* Task Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          ref={titleInputRef}
          type="text"
          value={task.title}
          onChange={(e) => onInputChange("title", e.target.value)}
          className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
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
            onChange={(e) => onInputChange("isDuration", e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-4 h-4 sm:w-3 sm:h-3 touch-manipulation"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={task.startDate}
              onChange={(e) => onInputChange("startDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={task.startTime}
              onChange={(e) => onInputChange("startTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={task.endDate}
              onChange={(e) => onInputChange("endDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={task.endTime}
              onChange={(e) => onInputChange("endTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={task.dueDate}
              onChange={(e) => onInputChange("dueDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Time
            </label>
            <input
              type="time"
              value={task.dueTime}
              onChange={(e) => onInputChange("dueTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TaskFormFields;