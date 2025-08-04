import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FilterService, FilterCriteria, FilterPreset } from '../services/filterService';
import type { Class, TaskType } from '../types/index';

interface TaskFilterProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  classes: Class[];
  taskTypes: TaskType[];
  initialCriteria?: FilterCriteria;
  taskCount?: number;
  filteredCount?: number;
}

interface FilterChip {
  id: string;
  label: string;
  type: 'preset' | 'class' | 'taskType' | 'status' | 'dateRange' | 'gradeWeight';
  removable: boolean;
}

const TaskFilter: React.FC<TaskFilterProps> = ({
  onFilterChange,
  classes,
  taskTypes,
  initialCriteria = {},
  taskCount = 0,
  filteredCount = 0
}) => {
  // State management
  const [searchText, setSearchText] = useState(initialCriteria.searchText || '');
  const [activeCriteria, setActiveCriteria] = useState<FilterCriteria>(initialCriteria);
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Get filter presets
  const academicPresets = useMemo(() => FilterService.getAcademicPresets(), []);
  const savedPresets = useMemo(() => FilterService.getSavedFilterPresets(), []);
  const allPresets = useMemo(() => [...academicPresets, ...savedPresets], [academicPresets, savedPresets]);

  // Generate filter chips based on active criteria
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    // Class filters
    if (activeCriteria.classIds && activeCriteria.classIds.length > 0) {
      activeCriteria.classIds.forEach(classId => {
        const className = classes.find(c => c.id === classId);
        if (className) {
          chips.push({
            id: `class-${classId}`,
            label: className.name,
            type: 'class',
            removable: true
          });
        }
      });
    }

    // Task type filters
    if (activeCriteria.taskTypeIds && activeCriteria.taskTypeIds.length > 0) {
      activeCriteria.taskTypeIds.forEach(typeId => {
        const taskType = taskTypes.find(t => t.id === typeId);
        if (taskType) {
          chips.push({
            id: `taskType-${typeId}`,
            label: taskType.name,
            type: 'taskType',
            removable: true
          });
        }
      });
    }

    // Completion status filter
    if (activeCriteria.completionStatus && activeCriteria.completionStatus !== 'all') {
      chips.push({
        id: 'completion-status',
        label: activeCriteria.completionStatus === 'completed' ? 'Completed' : 'Incomplete',
        type: 'status',
        removable: true
      });
    }

    // Date range filter
    if (activeCriteria.dueDateRange) {
      let dateLabel = 'Custom Date Range';
      if (activeCriteria.dueDateRange.start && activeCriteria.dueDateRange.end) {
        const start = activeCriteria.dueDateRange.start.toLocaleDateString();
        const end = activeCriteria.dueDateRange.end.toLocaleDateString();
        dateLabel = `${start} - ${end}`;
      } else if (activeCriteria.dueDateRange.start) {
        dateLabel = `After ${activeCriteria.dueDateRange.start.toLocaleDateString()}`;
      } else if (activeCriteria.dueDateRange.end) {
        dateLabel = `Before ${activeCriteria.dueDateRange.end.toLocaleDateString()}`;
      }
      
      chips.push({
        id: 'date-range',
        label: dateLabel,
        type: 'dateRange',
        removable: true
      });
    }

    // Grade weight filter
    if (activeCriteria.gradeWeight) {
      let weightLabel = 'Grade Weight: ';
      if (activeCriteria.gradeWeight.min !== undefined && activeCriteria.gradeWeight.max !== undefined) {
        weightLabel += `${activeCriteria.gradeWeight.min}%-${activeCriteria.gradeWeight.max}%`;
      } else if (activeCriteria.gradeWeight.min !== undefined) {
        weightLabel += `≥${activeCriteria.gradeWeight.min}%`;
      } else if (activeCriteria.gradeWeight.max !== undefined) {
        weightLabel += `≤${activeCriteria.gradeWeight.max}%`;
      }
      
      chips.push({
        id: 'grade-weight',
        label: weightLabel,
        type: 'gradeWeight',
        removable: true
      });
    }

    return chips;
  }, [activeCriteria, classes, taskTypes]);

  // Handle search text change with debouncing
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    const newCriteria = { ...activeCriteria, searchText: text || undefined };
    setActiveCriteria(newCriteria);
    onFilterChange(newCriteria);
  }, [activeCriteria, onFilterChange]);

  // Apply preset filter
  const applyPreset = useCallback((preset: FilterPreset) => {
    const newCriteria = { ...preset.criteria };
    setActiveCriteria(newCriteria);
    setSearchText(newCriteria.searchText || '');
    onFilterChange(newCriteria);
    setShowPresets(false);
  }, [onFilterChange]);

  // Remove filter chip
  const removeFilterChip = useCallback((chipId: string) => {
    const newCriteria = { ...activeCriteria };

    if (chipId.startsWith('class-')) {
      const classId = chipId.replace('class-', '');
      newCriteria.classIds = newCriteria.classIds?.filter(id => id !== classId);
      if (newCriteria.classIds?.length === 0) delete newCriteria.classIds;
    } else if (chipId.startsWith('taskType-')) {
      const typeId = chipId.replace('taskType-', '');
      newCriteria.taskTypeIds = newCriteria.taskTypeIds?.filter(id => id !== typeId);
      if (newCriteria.taskTypeIds?.length === 0) delete newCriteria.taskTypeIds;
    } else if (chipId === 'completion-status') {
      delete newCriteria.completionStatus;
    } else if (chipId === 'date-range') {
      delete newCriteria.dueDateRange;
    } else if (chipId === 'grade-weight') {
      delete newCriteria.gradeWeight;
    }

    setActiveCriteria(newCriteria);
    onFilterChange(newCriteria);
  }, [activeCriteria, onFilterChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const newCriteria: FilterCriteria = {};
    setActiveCriteria(newCriteria);
    setSearchText('');
    onFilterChange(newCriteria);
  }, [onFilterChange]);

  // Handle smart search with academic query parsing
  const handleSmartSearch = useCallback((text: string) => {
    if (text.length > 10) { // Only parse longer queries
      const parsedCriteria = FilterService.parseAcademicQuery(text, classes, taskTypes);
      if (parsedCriteria && Object.keys(parsedCriteria).length > 1) { // More than just searchText
        setActiveCriteria(parsedCriteria);
        setSearchText(text);
        onFilterChange(parsedCriteria);
        return;
      }
    }
    handleSearchChange(text);
  }, [classes, taskTypes, handleSearchChange, onFilterChange]);

  // Click outside to close presets
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    if (showPresets) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showPresets]);

  // Focus management
  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setSearchFocused(false), 150); // Delay to allow clicks
  }, []);

  return (
    <div className="w-full space-y-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => handleSmartSearch(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400 
                     focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                     text-sm transition-colors duration-200"
            placeholder="Search tasks or try 'CS assignments due this week'..."
            aria-label="Search tasks with smart academic queries"
          />
          {searchText && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search suggestions for smart queries */}
        {searchFocused && searchText.length > 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              💡 Try: "due this week", "overdue CS tasks", "high priority projects"
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Presets Button */}
        <div className="relative" ref={presetsRef}>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            aria-haspopup="true"
            aria-expanded={showPresets}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Quick Filters
            <svg className={`ml-2 h-4 w-4 transition-transform duration-200 ${showPresets ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Filter Presets Dropdown */}
          {showPresets && (
            <div className="absolute z-20 mt-2 w-80 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl">
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Academic Filters</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {academicPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 
                             border-b border-gray-100 dark:border-gray-600 last:border-b-0
                             focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-600"
                  >
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={preset.icon} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{preset.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preset.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear All Button */}
        {(filterChips.length > 0 || searchText) && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 
                     hover:text-red-700 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All
          </button>
        )}

        {/* Results Count */}
        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {filteredCount !== undefined && taskCount !== undefined && (
            <span>
              {filteredCount === taskCount 
                ? `${taskCount} tasks`
                : `${filteredCount} of ${taskCount} tasks`
              }
            </span>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <div
              key={chip.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm 
                       bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 
                       border border-blue-200 dark:border-blue-700"
            >
              <span className="truncate max-w-40">{chip.label}</span>
              {chip.removable && (
                <button
                  onClick={() => removeFilterChip(chip.id)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full 
                           text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilter;