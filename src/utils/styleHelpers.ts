// Style utility functions

// Get day cell classes for calendar - responsive and touch-friendly
export const getDayCellClasses = (isCurrentMonth: boolean, isToday: boolean): string => {
  let baseClasses = "flex flex-col justify-start p-1 sm:p-2 border h-32 sm:h-40 md:h-44 relative cursor-pointer transition-all duration-200 ease-in-out touch-manipulation";
  
  if (!isCurrentMonth) {
    baseClasses += " bg-gray-50 text-gray-400";
  } else if (isToday) {
    baseClasses += " bg-blue-100 border-blue-500 rounded-lg";
  } else {
    baseClasses += " hover:bg-blue-50 active:bg-blue-50";
  }
  
  return baseClasses;
};

// Get view button classes
export const getViewButtonClasses = (isActive: boolean): string => {
  return `px-3 py-1 rounded-md font-medium shadow transition-all duration-200 ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'bg-transparent text-gray-700 hover:bg-gray-200'
  }`;
};

// Get navigation button classes
export const getNavButtonClasses = (): string => {
  return "p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200";
};

// Get navigation icon classes
export const getNavIconClasses = (): string => {
  return "w-5 h-5 text-gray-600 hover:text-blue-500";
};