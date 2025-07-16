// Utility function to determine task card styling based on task state and type
export const getEventStyle = (task, taskTypes) => {
  if (task.completed) {
    return {
      bg: "bg-green-100",
      border: "border-l-4 border-green-500",
      text: "text-green-800"
    };
  }
  
  // Use custom color from task type if available
  const taskType = taskTypes.find(t => t.id === task.type);
  const color = taskType?.color || 'blue'; // Default to blue if no color is set
  
  // Color mappings for all available colors
  const colorStyles = {
    blue: { bg: "bg-blue-100", border: "border-l-4 border-blue-500", text: "text-blue-800" },
    green: { bg: "bg-green-100", border: "border-l-4 border-green-500", text: "text-green-800" },
    purple: { bg: "bg-purple-100", border: "border-l-4 border-purple-500", text: "text-purple-800" },
    red: { bg: "bg-red-100", border: "border-l-4 border-red-500", text: "text-red-800" },
    amber: { bg: "bg-amber-100", border: "border-l-4 border-amber-500", text: "text-amber-800" },
    indigo: { bg: "bg-indigo-100", border: "border-l-4 border-indigo-500", text: "text-indigo-800" },
    pink: { bg: "bg-pink-100", border: "border-l-4 border-pink-500", text: "text-pink-800" },
    gray: { bg: "bg-gray-100", border: "border-l-4 border-gray-500", text: "text-gray-800" }
  };
  
  return colorStyles[color] || colorStyles.blue;
};