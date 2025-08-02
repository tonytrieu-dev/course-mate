import React from 'react';
import type { ClassWithRelations } from '../../types/database';
import { TaskData } from '../TaskModal';

interface ColorOption {
  name: string;
  bg: string;
  border: string;
  ring: string;
}

interface ClassManagementProps {
  classes: ClassWithRelations[];
  task: { class: string };
  onInputChange: <K extends keyof TaskData>(field: K, value: TaskData[K]) => void;
  
  // Class input state
  showClassInput: boolean;
  setShowClassInput: (show: boolean) => void;
  newClassName: string;
  setNewClassName: (name: string) => void;
  onAddClass: () => void;
  
  // Class management state
  showClassManagement: boolean;
  setShowClassManagement: (show: boolean) => void;
  hoveredClassId: string | null;
  setHoveredClassId: (id: string | null) => void;
  onDeleteClass: (id: string) => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  task,
  onInputChange,
  showClassInput,
  setShowClassInput,
  newClassName,
  setNewClassName,
  onAddClass,
  showClassManagement,
  setShowClassManagement,
  hoveredClassId,
  setHoveredClassId,
  onDeleteClass,
}) => {
  // Filter to only show task classes in the dropdown and management
  const taskClasses = classes.filter(cls => cls.isTaskClass === true);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          Class {taskClasses.length > 0 && "*"}
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowClassInput(!showClassInput)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add
          </button>
          {taskClasses.length > 0 && (
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
              onClick={onAddClass}
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

      {taskClasses.length > 0 ? (
        <select
          value={task.class}
          onChange={(e) => onInputChange("class", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          required
        >
          <option value="">Select a class...</option>
          {taskClasses.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-500 italic">
          No taskClasses available. Add one above.
        </p>
      )}

      {showClassManagement && taskClasses.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Manage Classes</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {taskClasses.map((cls) => (
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
                  onClick={() => onDeleteClass(cls.id)}
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
  );
};

export default ClassManagement;