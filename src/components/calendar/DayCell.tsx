import React, { useState, useMemo, useCallback } from 'react';
import { getDayCellClasses } from '../../utils/styleHelpers';
import EventCard from './EventCard';
import type { TaskWithMeta, TaskType, ClassWithRelations } from '../../types/database';

interface DayCellProps {
  day: number;
  isCurrentMonth: boolean;
  isCurrentDate?: boolean;
  isToday: boolean;
  tasks: TaskWithMeta[];
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
  onClick: () => void;
}

// Reusable DayCell component - memoized for performance
const DayCell: React.FC<DayCellProps> = React.memo(({ 
  day, 
  isCurrentMonth, 
  isCurrentDate, 
  isToday, 
  tasks, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit, 
  onClick 
}) => {
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const cellClasses = useMemo(() => getDayCellClasses(isCurrentMonth, isToday), [isCurrentMonth, isToday]);
  const dateClasses = useMemo(() => 
    `text-sm font-semibold absolute top-2 left-2 ${isToday ? 'text-blue-700 dark:text-blue-100' : 'text-gray-500 dark:text-slate-300'}`,
    [isToday]
  );

  // Performance optimization: limit visible tasks for large datasets
  const MAX_VISIBLE_TASKS = 3;
  const visibleTasks = useMemo(() => {
    if (tasks.length <= MAX_VISIBLE_TASKS || showAllTasks) {
      return tasks;
    }
    return tasks.slice(0, MAX_VISIBLE_TASKS);
  }, [tasks, showAllTasks]);

  const hiddenTasksCount = useMemo(() => {
    return Math.max(0, tasks.length - MAX_VISIBLE_TASKS);
  }, [tasks.length]);

  const handleShowMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllTasks(true);
  }, []);

  return (
    <div
      className={cellClasses}
      onClick={onClick}
    >
      {/* Date number */}
      <div className={dateClasses}>
        {day}
      </div>
      
      {/* Events container */}
      <div className="mt-8 overflow-y-auto flex-1">
        {visibleTasks.map((task) => (
          <EventCard
            key={task.id}
            task={task}
            classes={classes}
            taskTypes={taskTypes}
            formatTimeForDisplay={formatTimeForDisplay}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
          />
        ))}
        
        {/* Show more button for performance with large task lists */}
        {!showAllTasks && hiddenTasksCount > 0 && (
          <button
            onClick={handleShowMore}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-2 mt-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors min-h-[32px] touch-manipulation"
            aria-label={`Show ${hiddenTasksCount} more tasks`}
          >
            +{hiddenTasksCount} more
          </button>
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

export default DayCell;