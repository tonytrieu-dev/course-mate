import React, { useMemo } from 'react';
import { formatHourForDisplay } from '../../utils/dateHelpers';
import EventCard from './EventCard';
import type { TaskWithMeta, TaskType, ClassWithRelations } from '../../types/database';

interface HourCellProps {
  hour: number;
  tasks: TaskWithMeta[];
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
  formatTimeForDisplay: (time: string | null) => string;
  onToggleComplete: (task: TaskWithMeta) => void;
  onEdit: (e: React.MouseEvent, task: TaskWithMeta) => void;
  onClick: () => void;
}

// Reusable HourCell component for day view - memoized for performance
const HourCell: React.FC<HourCellProps> = React.memo(({ 
  hour, 
  tasks, 
  classes, 
  taskTypes, 
  formatTimeForDisplay, 
  onToggleComplete, 
  onEdit, 
  onClick 
}) => {
  const hourDisplay = useMemo(() => formatHourForDisplay(hour), [hour]);

  return (
    <div 
      className="border border-gray-300 dark:border-slate-600/50 p-2 flex min-h-20 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-200 bg-white dark:bg-slate-800/30"
      onClick={onClick}
    >
      <div className="w-16 font-bold text-gray-600 dark:text-slate-400">
        {hourDisplay}
      </div>
      <div className="flex-1">
        {tasks.map((task) => (
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
      </div>
    </div>
  );
});

HourCell.displayName = 'HourCell';

export default HourCell;