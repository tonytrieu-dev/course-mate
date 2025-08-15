import { useEffect, useCallback } from 'react';
import type { ClassWithRelations, ClassSyllabus, ClassFile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { useTextFormatting } from '../contexts/TextFormattingContext';
import { useFileManager } from './useFileManager';
import { getSettings, updateSettings } from '../services/dataService';
import { getSettingsWithSync, updateSettingsWithSync } from '../services/settings/settingsOperations';
import { supabase } from '../services/supabaseClient';
import { fetchCanvasCalendar } from '../services/canvasService';
import classService from '../services/classService';
import { logger } from '../utils/logger';

const AUTO_SYNC_DELAY = 1500;

interface UseSidebarDataProps {
  title: string;
  setTitle: (title: string) => void;
  classesTitle: string;
  setClassesTitle: (title: string) => void;
  classes: ClassWithRelations[];
  setClasses: (classes: ClassWithRelations[]) => void;
  selectedClass: ClassWithRelations | null;
  setSelectedClass: (cls: ClassWithRelations | null) => void;
  setShowSyllabusModal: (show: boolean) => void;
  setIsCanvasSyncing: (syncing: boolean) => void;
}

interface UseSidebarDataReturn {
  handleTitleBlur: () => void;
  handleTitleBlurWithFormatting: () => void;
  handleClassesTitleBlur: () => void;
  handleClassClick: (classId: string) => Promise<void>;
  handleSyllabusUpdate: (syllabusRecord: ClassSyllabus | null) => Promise<void>;
  handleFileUpdate: (fileRecord: ClassFile | null, remainingFiles?: ClassFile[]) => Promise<void>;
}

export const useSidebarData = ({
  title,
  setTitle,
  classesTitle,
  setClassesTitle,
  classes,
  setClasses,
  selectedClass,
  setSelectedClass,
  setShowSyllabusModal,
  setIsCanvasSyncing,
}: UseSidebarDataProps): UseSidebarDataReturn => {
  const { user, isAuthenticated, setLastCalendarSyncTimestamp } = useAuth();
  const { elementFormatting, setElementFormatting } = useTextFormatting();
  const { getClassData } = useFileManager();

  // Auto-sync Canvas calendar
  useEffect(() => {
    const autoSyncCanvas = async (): Promise<void> => {
      const canvasUrl = localStorage.getItem("canvas_calendar_url");
      const autoSync = localStorage.getItem("canvas_auto_sync") === "true";
      
      logger.debug('AutoSyncCanvas triggered', { 
        canvasUrl: !!canvasUrl, 
        autoSync, 
        userAuthenticated: !!user
      });

      if (user && canvasUrl && autoSync) {
        try {
          setIsCanvasSyncing(true);
          logger.info('Starting Canvas calendar auto-sync', { userId: user.id });
          const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated, user);
          logger.debug('Canvas calendar fetch completed', { success: result?.success });

          if (result && result.success) {
            logger.info('Canvas auto-sync successful, updating timestamp');
            setLastCalendarSyncTimestamp(Date.now());
          } else {
            logger.warn('Canvas auto-sync failed or returned invalid result', { resultSuccess: result?.success });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Canvas auto-sync error', { error: errorMessage });
        } finally {
          setIsCanvasSyncing(false);
        }
      }
    };

    const timerId = setTimeout(() => {
      autoSyncCanvas();
    }, AUTO_SYNC_DELAY); 

    return () => clearTimeout(timerId);
  }, [isAuthenticated, user]);

  // Load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      const fetchedClasses = await classService.initialize(user?.id, true);
      const sidebarClasses = fetchedClasses.filter(cls => !cls.isTaskClass);
      setClasses(sidebarClasses);

      // Load settings with Supabase sync if user is authenticated
      const settings = user?.id 
        ? await getSettingsWithSync(user.id) 
        : getSettings();
        
      if (settings && settings.title) {
        setTitle(settings.title);
      }
      if (settings && settings.classesTitle) {
        setClassesTitle(settings.classesTitle);
      }
      
      // Load formatting from settings into the context
      if (settings && settings.elementFormatting) {
        setElementFormatting(settings.elementFormatting);
      }
    };

    loadData();
  }, [isAuthenticated, setClasses, setTitle, setClassesTitle, setElementFormatting]);

  // Subscribe to class changes
  useEffect(() => {
    if (!isAuthenticated) {
      classService.reset();
      return;
    }

    const unsubscribe = classService.subscribe((updatedClasses: ClassWithRelations[]) => {
      const sidebarClasses = updatedClasses.filter(cls => !cls.isTaskClass);
      setClasses(sidebarClasses);
    });

    return unsubscribe;
  }, [isAuthenticated, setClasses]);

  // Event handlers
  const handleTitleBlur = useCallback(async () => {
    const currentSettings = await getSettingsWithSync(user?.id);
    await updateSettingsWithSync({ ...currentSettings, title }, user?.id);
  }, [title, user?.id]);

  const handleTitleBlurWithFormatting = useCallback(async () => {
    const currentSettings = await getSettingsWithSync(user?.id);
    const updatedSettings = {
      ...currentSettings,
      title,
      elementFormatting: { ...(currentSettings.elementFormatting || {}), ...elementFormatting }
    };
    await updateSettingsWithSync(updatedSettings, user?.id);
  }, [title, elementFormatting, user?.id]);

  const handleClassesTitleBlur = useCallback(async () => {
    const currentSettings = await getSettingsWithSync(user?.id);
    const updatedSettings = {
      ...currentSettings,
      classesTitle,
      elementFormatting: { ...(currentSettings.elementFormatting || {}), ...elementFormatting }
    };
    await updateSettingsWithSync(updatedSettings, user?.id);
  }, [classesTitle, elementFormatting, user?.id]);

  const handleClassClick = useCallback(async (classId: string) => {
    const classObj = classes.find((c) => c.id === classId);
    if (!classObj) return;
    
    const classData = await getClassData(classId);
    
    const updatedClass: ClassWithRelations = {
      ...classObj,
      ...classData,
    };

    setSelectedClass(updatedClass);
    setShowSyllabusModal(true);
  }, [classes, getClassData, setSelectedClass, setShowSyllabusModal]);

  const handleSyllabusUpdate = useCallback(async (syllabusRecord: ClassSyllabus | null) => {
    if (!selectedClass) return;
    
    const updatedClass = { ...selectedClass, syllabus: syllabusRecord };
    setSelectedClass(updatedClass);
    
    await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
  }, [selectedClass, isAuthenticated, setSelectedClass]);

  const handleFileUpdate = useCallback(async (fileRecord: ClassFile | null, remainingFiles?: ClassFile[]) => {
    if (!selectedClass) return;
    
    if (fileRecord) {
      const updatedClass = {
        ...selectedClass,
        files: [...(selectedClass.files || []), fileRecord],
      };
      setSelectedClass(updatedClass);
      await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
    } else if (remainingFiles) {
      const updatedClass = {
        ...selectedClass,
        files: remainingFiles,
      };
      setSelectedClass(updatedClass);
      await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
    }
  }, [selectedClass, isAuthenticated, setSelectedClass]);

  return {
    handleTitleBlur,
    handleTitleBlurWithFormatting,
    handleClassesTitleBlur,
    handleClassClick,
    handleSyllabusUpdate,
    handleFileUpdate,
  };
};