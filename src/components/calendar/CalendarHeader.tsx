import React, { useState, useCallback, useEffect } from 'react';
import { getCalendarTitle } from '../../utils/dateHelpers';
import { getViewButtonClasses } from '../../utils/styleHelpers';

type ViewType = 'month' | 'week' | 'day';

interface ViewOption {
  key: ViewType;
  label: string;
}

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

// Enhanced CalendarHeader component with clickable month/year dials - memoized
const CalendarHeader: React.FC<CalendarHeaderProps> = React.memo(({ 
  currentDate,
  onDateChange,
  onPrevious, 
  onNext, 
  view, 
  onViewChange 
}) => {
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);

  const viewOptions: ViewOption[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleDateChange = useCallback((monthIndex: number, year: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    newDate.setFullYear(year);
    onDateChange(newDate);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  }, [currentDate, onDateChange]);

  const renderDateTitle = () => {
    if (view === "month") {
      const monthName = currentDate.toLocaleString("default", { month: "long" });
      const year = currentDate.getFullYear();
      
      return (
        <div className="relative">
          {/* Separate clickable month and year areas */}
          <div className="flex items-center gap-0 text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100">
            {/* Month button */}
            <button
              onClick={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
              className={`px-1 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 min-h-[44px] touch-manipulation ${showMonthPicker ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
              type="button"
              aria-label={`${monthName}, click to change month`}
              aria-expanded={showMonthPicker}
              aria-haspopup="true"
            >
              <span>{monthName}</span>
              {showMonthPicker && (
                <svg 
                  className="w-4 h-4 ml-1 inline-block transition-transform duration-200 rotate-180" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Year button */}
            <button
              onClick={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              }}
              className={`px-1 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 min-h-[44px] touch-manipulation ${showYearPicker ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
              type="button"
              aria-label={`${year}, click to change year`}
              aria-expanded={showYearPicker}
              aria-haspopup="true"
            >
              <span>{year}</span>
              {showYearPicker && (
                <svg 
                  className="w-4 h-4 ml-1 inline-block transition-transform duration-200 rotate-180" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
          
        </div>
      );
    } else {
      // For week and day views, show centered title with proper dark mode styling
      return <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white text-center">{getCalendarTitle(currentDate, view)}</h2>;
    }
  };

  // Portal-style dropdowns positioned at header level to avoid z-index issues
  const renderDropdowns = () => {
    return (
      <>
        {/* Full-screen backdrop */}
        {(showMonthPicker || showYearPicker) && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9998] cursor-default"
            onClick={() => {
              setShowMonthPicker(false);
              setShowYearPicker(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            style={{ pointerEvents: 'all' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowMonthPicker(false);
                setShowYearPicker(false);
              }
            }}
            aria-label="Close date picker"
          />
        )}
        
        {/* Month picker dropdown - positioned to avoid backdrop interference */}
        {showMonthPicker && (
          <div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-2xl dark:shadow-slate-900/60 z-[9999] w-60"
            role="dialog"
            aria-labelledby="month-picker-title"
            aria-modal="true"
            style={{ pointerEvents: 'all' }}
          >
            <div className="p-3">
              <div className="grid grid-cols-4 gap-1">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleDateChange(index, currentDate.getFullYear())}
                    className={`px-2 py-1.5 text-xs rounded transition-all duration-200 min-h-[32px] touch-manipulation ${
                      index === currentDate.getMonth() 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50'
                    }`}
                    type="button"
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Year picker dropdown - positioned to avoid backdrop interference */}
        {showYearPicker && (
          <div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-2xl dark:shadow-slate-900/60 z-[9999] w-48 max-h-64"
            role="dialog"
            aria-labelledby="year-picker-title"
            aria-modal="true"
            style={{ pointerEvents: 'all' }}
          >
            <div className="p-3">
              <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                {years.map((yearOption) => (
                  <button
                    key={yearOption}
                    onClick={() => handleDateChange(currentDate.getMonth(), yearOption)}
                    className={`px-2 py-1.5 text-xs rounded transition-all duration-200 min-h-[32px] touch-manipulation ${
                      yearOption === currentDate.getFullYear() 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/50'
                    }`}
                    type="button"
                  >
                    {yearOption}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Close pickers when pressing Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    if (showMonthPicker || showYearPicker) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
    return undefined;
  }, [showMonthPicker, showYearPicker]);

  return (
    <div className="mb-8">
      {/* Portal-style dropdowns and backdrop */}
      {renderDropdowns()}
      
      {/* Container with absolutely positioned elements for perfect centering */}
      <div className="relative min-h-[60px] flex items-center justify-center">
        {/* Title - absolutely centered in the container */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {renderDateTitle()}
        </div>
        
        {/* Controls - positioned absolutely on the right, hover-only visibility */}
        <div className="group absolute right-0 top-1/2 transform -translate-y-1/2">
          {/* Invisible hover area to trigger controls - non-clickable */}
          <div className="absolute -inset-4 rounded-lg pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* View toggle buttons */}
          <div 
            className="flex bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1 gap-2 sm:gap-3 border border-gray-200 dark:border-slate-600/30"
            role="group"
            aria-label="Calendar view options"
          >
            {viewOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => onViewChange(option.key)}
                className={`${getViewButtonClasses(view === option.key)} px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium min-h-[40px] sm:min-h-[44px] touch-manipulation`}
                type="button"
                aria-pressed={view === option.key}
                aria-label={`Switch to ${option.label.toLowerCase()} view`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Navigation arrows */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPrevious}
              className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 active:bg-gray-200 dark:active:bg-slate-600/50 transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation border border-gray-200 dark:border-slate-600/30 bg-white dark:bg-slate-800/50"
              aria-label="Previous period"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onNext}
              className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 active:bg-gray-200 dark:active:bg-slate-600/50 transition-colors duration-200 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-manipulation border border-gray-200 dark:border-slate-600/30 bg-white dark:bg-slate-800/50"
              aria-label="Next period"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

export default CalendarHeader;