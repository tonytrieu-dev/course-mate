import React, { useMemo } from 'react';
import type { TaskType } from '../../types/database';
import { TaskData } from '../TaskModal';

interface ColorOption {
  name: string;
  bg: string;
  border: string;
  ring: string;
}

interface TaskTypeManagementProps {
  taskTypes: TaskType[];
  task: { type: string };
  onInputChange: <K extends keyof TaskData>(field: K, value: TaskData[K]) => void;
  
  // Type input state
  showTypeInput: boolean;
  setShowTypeInput: (show: boolean) => void;
  newTypeName: string;
  setNewTypeName: (name: string) => void;
  newTypeColor: string;
  setNewTypeColor: (color: string) => void;
  onAddTaskType: () => void;
  
  // Type management state
  showTypeManagement: boolean;
  setShowTypeManagement: (show: boolean) => void;
  hoveredTypeId: string | null;
  setHoveredTypeId: (id: string | null) => void;
  editingTypeId: string | null;
  setEditingTypeId: (id: string | null) => void;
  editingTypeColor: string;
  setEditingTypeColor: (color: string) => void;
  editingTypeCompletedColor: string;
  setEditingTypeCompletedColor: (color: string) => void;
  onDeleteTaskType: (id: string) => void;
  onUpdateTaskType: (id: string, color: string, completedColor: string) => void;
}

const TaskTypeManagement: React.FC<TaskTypeManagementProps> = ({
  taskTypes,
  task,
  onInputChange,
  showTypeInput,
  setShowTypeInput,
  newTypeName,
  setNewTypeName,
  newTypeColor,
  setNewTypeColor,
  onAddTaskType,
  showTypeManagement,
  setShowTypeManagement,
  hoveredTypeId,
  setHoveredTypeId,
  editingTypeId,
  setEditingTypeId,
  editingTypeColor,
  setEditingTypeColor,
  editingTypeCompletedColor,
  setEditingTypeCompletedColor,
  onDeleteTaskType,
  onUpdateTaskType,
}) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          Task Type {taskTypes.length > 0 && "*"}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowTypeInput(!showTypeInput)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            + Add
          </button>
          {taskTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTypeManagement(!showTypeManagement)}
              className="text-xs text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {showTypeInput && (
        <div className="mb-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
          <div className="space-y-2">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter task type name..."
              className="w-full p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div>
              <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Color:</label>
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
                onClick={onAddTaskType}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowTypeInput(false)}
                className="px-3 py-2 bg-gray-300 dark:bg-slate-600/50 text-gray-700 dark:text-slate-200 text-sm rounded-md hover:bg-gray-400 dark:hover:bg-slate-600/70"
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
          onChange={(e) => onInputChange("type", e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-slate-600/50 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
        <p className="text-sm text-gray-500 dark:text-slate-400 italic">
          No task types available. Add one above.
        </p>
      )}

      {showTypeManagement && taskTypes.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Manage Task Types</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {taskTypes.map((type) => (
              <div
                key={type.id}
                className={`p-2 rounded text-sm ${
                  hoveredTypeId === type.id ? 'bg-gray-200 dark:bg-slate-600/50' : 'bg-white dark:bg-slate-700/50'
                }`}
                onMouseEnter={() => setHoveredTypeId(type.id)}
                onMouseLeave={() => setHoveredTypeId(null)}
              >
                {editingTypeId === type.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-slate-100">{type.name}</span>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => onUpdateTaskType(type.id, editingTypeColor, editingTypeCompletedColor)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTypeId(null)}
                          className="text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Task Color:</label>
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
                      <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Completed Task Color:</label>
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
                      <span className="text-gray-900 dark:text-slate-100">{type.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTypeId(type.id);
                          setEditingTypeColor(type.color || 'blue');
                          setEditingTypeCompletedColor(type.completedColor || 'green');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTaskType(type.id)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
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
  );
};

export default TaskTypeManagement;