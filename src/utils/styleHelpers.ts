// Style utility functions

// Get day cell classes for calendar - responsive and touch-friendly with enhanced dark mode
export const getDayCellClasses = (isCurrentMonth: boolean, isToday: boolean): string => {
  let baseClasses = "flex flex-col justify-start p-1 sm:p-2 border-2 h-20 sm:h-24 md:h-32 lg:h-40 relative cursor-pointer transition-all duration-200 ease-in-out touch-manipulation";
  
  if (!isCurrentMonth) {
    baseClasses += " bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-600";
  } else if (isToday) {
    baseClasses += " bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-300 border-3 dark:border-3 rounded-lg shadow-sm";
  } else {
    baseClasses += " bg-white dark:bg-slate-800/30 border-gray-300 dark:border-slate-500 hover:bg-blue-50 dark:hover:bg-slate-700/30 active:bg-blue-100 dark:active:bg-slate-600/50 hover:border-gray-400 dark:hover:border-slate-400";
  }
  
  return baseClasses;
};

// Get view button classes with enhanced dark mode
export const getViewButtonClasses = (isActive: boolean): string => {
  return `px-3 py-1 rounded-md font-medium shadow transition-all duration-200 ${
    isActive
      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md'
      : 'bg-transparent text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600/50'
  }`;
};

// Get navigation button classes with enhanced dark mode
export const getNavButtonClasses = (): string => {
  return "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors duration-200 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-600/30";
};

// Get navigation icon classes with enhanced dark mode
export const getNavIconClasses = (): string => {
  return "w-5 h-5 text-gray-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400";
};