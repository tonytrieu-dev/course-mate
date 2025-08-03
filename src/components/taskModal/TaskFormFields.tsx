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
        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          Task Title *
        </label>
        <input
          id="task-title"
          ref={titleInputRef}
          type="text"
          value={task.title}
          onChange={(e) => onInputChange("title", e.target.value)}
          className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
          placeholder="Enter task title..."
          aria-required="true"
          aria-describedby="task-title-help"
          required
        />
        <div id="task-title-help" className="sr-only">
          Required field. Enter a descriptive title for your task.
        </div>
      </div>

      {/* Task Type - Duration Toggle */}
      <div>
        <label htmlFor="task-duration" className="flex items-center space-x-2">
          <input
            id="task-duration"
            type="checkbox"
            checked={task.isDuration}
            onChange={(e) => onInputChange("isDuration", e.target.checked)}
            className="rounded border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-4 h-4 sm:w-3 sm:h-3 touch-manipulation"
            aria-describedby="task-duration-help"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Duration-based task</span>
        </label>
        <p id="task-duration-help" className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {task.isDuration 
            ? "Task has start and end times" 
            : "Task has a single due date and time"
          }
        </p>
      </div>

      {/* Date and Time Fields */}
      {task.isDuration ? (
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <legend className="sr-only">Duration-based task time period</legend>
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={task.startDate}
              onChange={(e) => onInputChange("startDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task start date"
            />
          </div>
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Start Time
            </label>
            <input
              id="start-time"
              type="time"
              value={task.startTime}
              onChange={(e) => onInputChange("startTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task start time"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={task.endDate}
              onChange={(e) => onInputChange("endDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task end date"
            />
          </div>
          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="end-time"
              type="time"
              value={task.endTime}
              onChange={(e) => onInputChange("endTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task end time"
            />
          </div>
        </fieldset>
      ) : (
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <legend className="sr-only">Single due date task timing</legend>
          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              id="due-date"
              type="date"
              value={task.dueDate}
              onChange={(e) => onInputChange("dueDate", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task due date"
            />
          </div>
          <div>
            <label htmlFor="due-time" className="block text-sm font-medium text-gray-700 mb-1">
              Due Time
            </label>
            <input
              id="due-time"
              type="time"
              value={task.dueTime}
              onChange={(e) => onInputChange("dueTime", e.target.value)}
              className="w-full p-3 sm:p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 backdrop-blur-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base touch-manipulation text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              aria-label="Task due time"
            />
          </div>
        </fieldset>
      )}
    </>
  );
};

export default TaskFormFields;