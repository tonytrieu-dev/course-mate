import { useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations, TaskType } from '../types/database';
import { addTaskType, addClass, deleteTaskType, deleteClass, updateTaskType } from '../services/dataService';
import { logger } from '../utils/logger';
import { generateClassId, generateTypeId } from '../utils/idHelpers';

interface UseTaskManagementProps {
  classes: ClassWithRelations[];
  setClasses: (classes: ClassWithRelations[]) => void;
  taskTypes: TaskType[];
  setTaskTypes: (types: TaskType[]) => void;
  isAuthenticated: boolean;
  user: User | null;
  task: { class: string; type: string };
  setTask: React.Dispatch<React.SetStateAction<any>>;
}

export const useTaskManagement = ({
  classes,
  setClasses,
  taskTypes,
  setTaskTypes,
  isAuthenticated,
  user,
  task,
  setTask,
}: UseTaskManagementProps) => {
  // Class management state
  const [showClassInput, setShowClassInput] = useState<boolean>(false);
  const [showClassManagement, setShowClassManagement] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>("");
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);

  // Task type management state
  const [showTypeInput, setShowTypeInput] = useState<boolean>(false);
  const [showTypeManagement, setShowTypeManagement] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [newTypeColor, setNewTypeColor] = useState<string>("blue");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeColor, setEditingTypeColor] = useState<string>("blue");
  const [editingTypeCompletedColor, setEditingTypeCompletedColor] = useState<string>("green");
  const [hoveredTypeId, setHoveredTypeId] = useState<string | null>(null);

  // Class management handlers
  const handleAddClass = useCallback(async () => {
    if (!newClassName.trim()) {
      alert('Please enter a class name');
      return;
    }

    try {
      logger.debug('Adding new class via TaskModal', { className: newClassName, user: !!user });
      
      const classId = generateClassId(newClassName.trim());
      const newClass = {
        id: classId,
        user_id: user?.id || 'local-user',
        name: newClassName.trim(),
        syllabus: null,
        files: [],
        created_at: new Date().toISOString(),
        isTaskClass: true
      } as ClassWithRelations;

      // Save to database using dataService directly
      const savedClass = await addClass(newClass, isAuthenticated);
      
      if (savedClass) {
        logger.debug('Class saved successfully, updating TaskModal UI', { savedClass, currentClassesCount: classes.length });
        
        // Update local TaskModal state
        const updatedClasses = [...classes, savedClass];
        setClasses(updatedClasses);
        
        // Use the saved class ID
        setTask((prev: any) => ({ ...prev, class: savedClass.id }));
        setNewClassName("");
        setShowClassInput(false);
        
        logger.debug('TaskModal state updated', { newClassesCount: updatedClasses.length, selectedClassId: savedClass.id });
      } else {
        throw new Error('Failed to save class to database');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error adding class:', errorMessage);
      alert('Failed to add class. Please try again.');
    }
  }, [newClassName, classes, setClasses, user, isAuthenticated, setTask]);

  const handleDeleteClass = useCallback(async (classId: string) => {
    const classToDelete = classes.find(c => c.id === classId);
    if (!classToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the class "${classToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const success = await deleteClass(classId, isAuthenticated);
      
      if (success) {
        const updatedClasses = classes.filter(c => c.id !== classId);
        setClasses(updatedClasses);
        
        if (task.class === classId) {
          setTask((prev: any) => ({ 
            ...prev, 
            class: updatedClasses.find(c => c.id !== classId)?.id || "" 
          }));
        }
      } else {
        throw new Error('Failed to delete class from database');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error deleting class:', errorMessage);
      alert('Failed to delete class. Please try again.');
    }
  }, [classes, setClasses, task.class, isAuthenticated, setTask]);

  // Task type management handlers
  const handleAddTaskType = useCallback(async () => {
    if (!newTypeName.trim()) {
      alert('Please enter a task type name');
      return;
    }

    try {
      logger.debug('Adding new task type via TaskModal', { typeName: newTypeName, color: newTypeColor });
      
      const typeId = generateTypeId(newTypeName.trim());
      const newType = {
        id: typeId,
        name: newTypeName.trim(),
        color: newTypeColor,
        completedColor: 'green',
        user_id: user?.id || 'local-user',
        created_at: new Date().toISOString(),
      };

      const addedType = await addTaskType(newType, isAuthenticated);
      
      if (addedType) {
        setTaskTypes([...taskTypes, addedType]);
        setTask((prev: any) => ({ ...prev, type: typeId }));
        setNewTypeName("");
        setNewTypeColor("blue");
        setShowTypeInput(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error adding task type:', errorMessage);
      alert('Failed to add task type. Please try again.');
    }
  }, [newTypeName, newTypeColor, taskTypes, isAuthenticated, setTaskTypes, user, setTask]);

  const handleDeleteTaskType = useCallback(async (typeId: string) => {
    const typeToDelete = taskTypes.find(t => t.id === typeId);
    if (!typeToDelete) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete the task type "${typeToDelete.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await deleteTaskType(typeId, isAuthenticated);
      setTaskTypes(taskTypes.filter(t => t.id !== typeId));
      
      if (task.type === typeId) {
        setTask((prev: any) => ({ 
          ...prev, 
          type: taskTypes.find(t => t.id !== typeId)?.id || "" 
        }));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error deleting task type:', errorMessage);
      alert('Failed to delete task type. Please try again.');
    }
  }, [taskTypes, isAuthenticated, setTaskTypes, task.type, setTask]);

  const handleUpdateTaskType = useCallback(async (typeId: string, newColor: string, newCompletedColor: string) => {
    try {
      const typeToUpdate = taskTypes.find(t => t.id === typeId);
      if (!typeToUpdate) return;

      const updatedType = await updateTaskType(
        typeId,
        { 
          color: newColor,
          completedColor: newCompletedColor 
        },
        isAuthenticated
      );

      if (updatedType) {
        setTaskTypes(taskTypes.map(t => 
          t.id === typeId ? { ...t, color: newColor, completedColor: newCompletedColor } : t
        ));
        setEditingTypeId(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating task type:', errorMessage);
      alert('Failed to update task type. Please try again.');
    }
  }, [taskTypes, isAuthenticated, setTaskTypes]);

  return {
    // Class management state
    showClassInput,
    setShowClassInput,
    showClassManagement,
    setShowClassManagement,
    newClassName,
    setNewClassName,
    hoveredClassId,
    setHoveredClassId,
    
    // Task type management state
    showTypeInput,
    setShowTypeInput,
    showTypeManagement,
    setShowTypeManagement,
    newTypeName,
    setNewTypeName,
    newTypeColor,
    setNewTypeColor,
    editingTypeId,
    setEditingTypeId,
    editingTypeColor,
    setEditingTypeColor,
    editingTypeCompletedColor,
    setEditingTypeCompletedColor,
    hoveredTypeId,
    setHoveredTypeId,
    
    // Handlers
    handleAddClass,
    handleDeleteClass,
    handleAddTaskType,
    handleDeleteTaskType,
    handleUpdateTaskType,
  };
};