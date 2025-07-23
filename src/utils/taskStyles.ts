import type { Task, TaskType } from '../types/database';

/**
 * Style object for event display
 */
interface EventStyle {
  bg: string;
  border: string;
  text: string;
}

/**
 * Available color options for task types
 */
type TaskColor = 'blue' | 'green' | 'purple' | 'red' | 'amber' | 'indigo' | 'pink' | 'gray' | 'orange';

/**
 * Utility function to determine task card styling based on task state and type
 */
export const getEventStyle = (task: Task, taskTypes: TaskType[]): EventStyle => {
  // Get the task type
  const taskType = taskTypes.find(t => t.id === task.type);
  
  // Color mappings for all available colors
  const colorStyles: Record<TaskColor, EventStyle> = {
    blue: { bg: "bg-blue-100", border: "border-l-4 border-blue-500", text: "text-blue-800" },
    green: { bg: "bg-green-100", border: "border-l-4 border-green-500", text: "text-green-800" },
    purple: { bg: "bg-purple-100", border: "border-l-4 border-purple-500", text: "text-purple-800" },
    red: { bg: "bg-red-100", border: "border-l-4 border-red-500", text: "text-red-800" },
    amber: { bg: "bg-amber-100", border: "border-l-4 border-amber-500", text: "text-amber-800" },
    indigo: { bg: "bg-indigo-100", border: "border-l-4 border-indigo-500", text: "text-indigo-800" },
    pink: { bg: "bg-pink-100", border: "border-l-4 border-pink-500", text: "text-pink-800" },
    gray: { bg: "bg-gray-100", border: "border-l-4 border-gray-500", text: "text-gray-800" },
    orange: { bg: "bg-orange-100", border: "border-l-4 border-orange-500", text: "text-orange-800" }
  };
  
  if (task.completed) {
    // Use custom completed color from task type if available, otherwise default to green
    const completedColor = (taskType?.completedColor || 'green') as TaskColor;
    return colorStyles[completedColor] || colorStyles.green;
  }
  
  // Use custom color from task type if available, otherwise default to blue
  const color = (taskType?.color || 'blue') as TaskColor;
  return colorStyles[color] || colorStyles.blue;
};