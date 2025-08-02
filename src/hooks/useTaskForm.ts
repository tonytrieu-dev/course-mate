import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations, TaskType, TaskWithMeta } from '../types/database';
import { TaskData } from '../components/TaskModal';

interface UseTaskFormProps {
  editingTask: TaskWithMeta | null;
  selectedDate: Date | null;
  classes: ClassWithRelations[];
  taskTypes: TaskType[];
}

interface UseTaskFormReturn {
  task: TaskData;
  setTask: (task: TaskData) => void;
  handleInputChange: <K extends keyof TaskData>(field: K, value: TaskData[K]) => void;
  modalDateDisplay: string;
  handleSubmit: (e: React.FormEvent, onSubmit: (task: TaskData) => void) => void;
}

export const useTaskForm = ({
  editingTask,
  selectedDate,
  classes,
  taskTypes,
}: UseTaskFormProps): UseTaskFormReturn => {
  const [task, setTask] = useState<TaskData>({
    title: "",
    class: "",
    type: "",
    isDuration: false,
    dueDate: "",
    dueTime: "23:59",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "11:00",
    completed: false,
  });

  // Update task state when props change
  useEffect(() => {
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : "";
    let newTaskState: TaskData = {
      title: "",
      class: classes.length > 0 ? classes[0].id : "",
      type: taskTypes.length > 0 ? taskTypes[0].id : "",
      isDuration: false,
      dueDate: formattedDate,
      dueTime: "23:59",
      startDate: formattedDate,
      startTime: "08:00",
      endDate: formattedDate,
      endTime: "11:00",
      completed: false,
    };

    // If editing an existing task, override with its data
    if (editingTask) {
      newTaskState = {
        ...newTaskState,
        id: editingTask.id,
        title: editingTask.title || "",
        class: editingTask.class || newTaskState.class,
        type: editingTask.type || newTaskState.type,
        isDuration: Boolean(editingTask.isDuration),
        dueDate: editingTask.dueDate || newTaskState.dueDate,
        dueTime: editingTask.dueTime || newTaskState.dueTime,
        startDate: editingTask.startDate || newTaskState.startDate,
        startTime: editingTask.startTime || newTaskState.startTime,
        endDate: editingTask.endDate || newTaskState.endDate,
        endTime: editingTask.endTime || newTaskState.endTime,
        completed: Boolean(editingTask.completed),
        date: editingTask.date,
      };
    }

    setTask(newTaskState);
  }, [editingTask, selectedDate, classes, taskTypes]);

  // Memoize the modal date display to prevent recalculation on every render
  const modalDateDisplay = useMemo(() => {
    if (editingTask) {
      const dateStr = editingTask.dueDate || editingTask.date;
      if (dateStr) {
        // Parse date string correctly to avoid timezone issues
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
      }
    }
    return selectedDate?.toLocaleDateString() || "No Date";
  }, [editingTask, selectedDate]);

  const handleInputChange = useCallback(<K extends keyof TaskData>(field: K, value: TaskData[K]) => {
    setTask(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent, onSubmit: (task: TaskData) => void) => {
    e.preventDefault();
    
    // Basic validation
    if (!task.title || !task.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    // Only validate class/type if they exist
    if (classes.length > 0 && !task.class) {
      alert('Please select a class');
      return;
    }
    
    if (taskTypes.length > 0 && !task.type) {
      alert('Please select a task type');
      return;
    }
    
    // Ensure we have an id for editing tasks
    const taskToSubmit: TaskData = { 
      ...task, 
      id: editingTask ? editingTask.id : task.id 
    };
    
    onSubmit(taskToSubmit);
  }, [task, classes.length, taskTypes.length, editingTask]);

  return {
    task,
    setTask,
    handleInputChange,
    modalDateDisplay,
    handleSubmit,
  };
};