import React, { useMemo, useCallback } from 'react';
import { getEventStyle } from '../../utils/taskStyles';
import type { TaskWithMeta, TaskType, ClassWithRelations } from '../../types/database';

interface EventCardProps {
  task: TaskWithMeta;
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
}

// Reusable EventCard component - memoized for performance
const EventCard: React.FC<EventCardProps> = React.memo(({ 
  task, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit 
}) => {
  const style = useMemo(() => getEventStyle(task, taskTypes), [task, taskTypes]);
  
  const className = useMemo(() => 
    classes.find(c => c.id === task.class)?.name || 'No Class', 
    [classes, task.class]
  );
  const typeName = useMemo(() => 
    taskTypes.find(t => t.id === task.type)?.name || 'No Type', 
    [taskTypes, task.type]
  );
  
  const timeDisplay = useMemo(() => {
    if (task.isDuration) {
      return ` • ${formatTimeForDisplay(task.startTime || null)}-${formatTimeForDisplay(task.endTime || null)}`;
    }
    return task.dueTime ? ` • Due ${formatTimeForDisplay(task.dueTime)}` : '';
  }, [task, formatTimeForDisplay]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(task);
  }, [onToggleComplete, task]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e, task);
  }, [onEdit, task]);

  return (
    <div
      className={`${style.bg} ${style.border} rounded-md p-1 sm:p-2 mb-0.5 shadow-sm cursor-pointer group relative hover:shadow-md transition-all duration-200 ease-in-out touch-manipulation min-h-[32px] sm:min-h-[36px] flex flex-col justify-center`}
      onClick={handleClick}
      title={`${task.title} - ${className}`}
    >
      {/* Edit button - always visible on mobile for better accessibility */}
      <button
        className="absolute top-0.5 right-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 sm:p-1 rounded hover:bg-white/50 min-h-[24px] min-w-[24px] sm:min-h-[28px] sm:min-w-[28px] touch-manipulation text-gray-600 hover:text-gray-800 dark:text-gray-700 dark:hover:text-gray-900"
        onClick={handleEdit}
        aria-label="Edit task"
        type="button"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
        </svg>
      </button>
      
      <div className={`font-semibold text-xs ${style.text} truncate pr-6 sm:pr-7`}>
        {task.title}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-800 truncate pr-6 sm:pr-7 leading-tight">
        {className}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-700 truncate pr-6 sm:pr-7 leading-tight">
        {typeName}{timeDisplay}
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';

export default EventCard;