// Utility function to determine task card styling based on task state and type
export const getEventStyle = (task, taskTypes) => {
  if (task.completed) {
    return {
      bg: "bg-green-100",
      border: "border-l-4 border-green-500",
      text: "text-green-800"
    };
  }
  
  // Different colors based on task type
  const taskType = taskTypes.find(t => t.id === task.type)?.name?.toLowerCase() || '';
  
  if (taskType.includes('mid term') || taskType.includes('final') || taskType.includes('quiz')) {
    return {
      bg: "bg-indigo-100",
      border: "border-l-4 border-indigo-500",
      text: "text-indigo-800"
    };
  } else if (taskType.includes('homework') || taskType.includes('assignment')) {
    return {
      bg: "bg-blue-100",
      border: "border-l-4 border-blue-500",
      text: "text-blue-800"
    };
  } else if (taskType.includes('project')) {
    return {
      bg: "bg-purple-100",
      border: "border-l-4 border-purple-500",
      text: "text-purple-800"
    };
  } else {
    return {
      bg: "bg-amber-100",
      border: "border-l-4 border-amber-500",
      text: "text-amber-800"
    };
  }
};