import React, { useState, useEffect, useCallback } from "react";
import type { ClassWithRelations, ClassFile, ClassSyllabus } from "../types/database";
import {
  getSettings,
  updateSettings,
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabaseClient";
import { fetchCanvasCalendar } from "../services/canvasService";
import { useFileManager } from "../hooks/useFileManager";
import { TextFormattingProvider } from "../contexts/TextFormattingContext";
import { useResizable } from "../hooks/useResizable";
import { useFontSizes } from "../hooks/useLocalStorageState";
import LoginComponent from "./LoginComponent";
import CanvasSettings from "./CanvasSettings";
import SyllabusModal from "./SyllabusModal";
import EditableText from "./EditableText";
import InlineSizeControl from "./InlineSizeControl";
import ChatbotPanel from "./ChatbotPanel";
import ClassList from "./ClassList";
import AuthSection from "./AuthSection";
import classService from "../services/classService";
import { logger } from "../utils/logger";

// Constants
const AUTO_SYNC_DELAY = 1500;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 256;

interface Position {
  x: number;
  y: number;
}

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, logout, setLastCalendarSyncTimestamp } = useAuth();
  const { getClassData } = useFileManager();
  
  // Core state
  const [title, setTitle] = useState<string>("UCR 🐻");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [classes, setClasses] = useState<ClassWithRelations[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [hoveredClassId, setHoveredClassId] = useState<string | null>(null);
  const [showSyllabusModal, setShowSyllabusModal] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithRelations | null>(null);
  const [isHoveringClassArea, setIsHoveringClassArea] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState<boolean>(false);
  const [classesTitle, setClassesTitle] = useState<string>("Current Classes");
  const [isEditingClassesTitle, setIsEditingClassesTitle] = useState<boolean>(false);
  const [showChatbotPanel, setShowChatbotPanel] = useState<boolean>(false);
  const [chatbotPanelHeight, setChatbotPanelHeight] = useState<number>(400);
  const [chatbotPosition, setChatbotPosition] = useState<Position>({ x: 16, y: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCanvasSyncing, setIsCanvasSyncing] = useState<boolean>(false);
  
  // Font sizes with optimized localStorage access
  const {
    sidebar: fontSize,
    title: titleSize,
    classesHeader: classesHeaderSize,
    className: classNameSize,
    setSidebarSize: setFontSize,
    setTitleSize,
    setClassesHeaderSize,
    setClassNameSize
  } = useFontSizes({
    sidebar: 16,
    title: 50,
    classesHeader: 20,
    className: 14
  });
  
  // UI control state
  const [showTitleSizeControl, setShowTitleSizeControl] = useState<boolean>(false);
  const [showClassesHeaderSizeControl, setShowClassesHeaderSizeControl] = useState<boolean>(false);
  const [showClassNameSizeControl, setShowClassNameSizeControl] = useState<string | null>(null);
  
  // Resizable sidebar hook
  const { 
    width: sidebarWidth, 
    setWidth: setSidebarWidth, 
    isResizing, 
    startResize, 
    elementRef: sidebarRef 
  } = useResizable(
    DEFAULT_SIDEBAR_WIDTH,
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
    'sidebarWidth'
  );

  // Auto-sync Canvas calendar
  useEffect(() => {
    const autoSyncCanvas = async (): Promise<void> => {
      const canvasUrl = localStorage.getItem("canvas_calendar_url");
      const autoSync = localStorage.getItem("canvas_auto_sync") === "true";
      logger.debug('AutoSyncCanvas triggered', { canvasUrl: !!canvasUrl, autoSync, userAuthenticated: !!user });

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

    return () => clearTimeout(timerId); // Cleanup timer if component unmounts
  }, [isAuthenticated, user, setLastCalendarSyncTimestamp]);

  // Load data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      // Load classes from centralized class service
      const fetchedClasses = await classService.initialize(user?.id, true);
      // Filter out task-only classes from sidebar display
      const sidebarClasses = fetchedClasses.filter(cls => !cls.isTaskClass);
      setClasses(sidebarClasses);

      // Load settings
      const settings = getSettings();
      if (settings && settings.title) {
        setTitle(settings.title);
      }
      if (settings && settings.classesTitle) {
        setClassesTitle(settings.classesTitle);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Subscribe to class changes from the class service
  useEffect(() => {
    if (!isAuthenticated) {
      classService.reset();
      return;
    }

    const unsubscribe = classService.subscribe((updatedClasses: ClassWithRelations[]) => {
      // Filter out task-only classes from sidebar display
      const sidebarClasses = updatedClasses.filter(cls => !cls.isTaskClass);
      setClasses(sidebarClasses);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Save font size preferences
  useEffect(() => {
    localStorage.setItem('sidebarFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('titleFontSize', titleSize.toString());
  }, [titleSize]);

  useEffect(() => {
    localStorage.setItem('classesHeaderFontSize', classesHeaderSize.toString());
  }, [classesHeaderSize]);

  useEffect(() => {
    localStorage.setItem('classNameFontSize', classNameSize.toString());
  }, [classNameSize]);

  // Title editing functions
  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    const currentSettings = getSettings();
    updateSettings({ ...currentSettings, title });
  }, [title]);

  // Class editing functions
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
  }, [classes, getClassData]);

  // File management callbacks
  const handleSyllabusUpdate = useCallback(async (syllabusRecord: ClassSyllabus | null) => {
    if (!selectedClass) return;
    
    const updatedClass = { ...selectedClass, syllabus: syllabusRecord };
    setSelectedClass(updatedClass);
    
    // Update class using class service
    await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
  }, [selectedClass, isAuthenticated]);

  const handleFileUpdate = useCallback(async (fileRecord: ClassFile | null, remainingFiles?: ClassFile[]) => {
    if (!selectedClass) return;
    
    if (fileRecord) {
      // Adding new file
      const updatedClass = {
        ...selectedClass,
        files: [...(selectedClass.files || []), fileRecord],
      };
      setSelectedClass(updatedClass);
      
      // Update class using class service
      await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
    } else if (remainingFiles) {
      // File deleted, update with remaining files
      const updatedClass = {
        ...selectedClass,
        files: remainingFiles,
      };
      
      setSelectedClass(updatedClass);
      
      // Update class using class service
      await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
    }
  }, [selectedClass, isAuthenticated]);

  const handleSidebarToggle = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // Reset to default width when expanding
    if (isSidebarCollapsed) {
      const savedWidth = localStorage.getItem('sidebarWidth');
      setSidebarWidth(savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH);
    }
  }, [isSidebarCollapsed, setSidebarWidth]);

  const handleClassesTitleBlur = useCallback(() => {
    setIsEditingClassesTitle(false);
    const currentSettings = getSettings();
    updateSettings({ ...currentSettings, classesTitle });
  }, [classesTitle]);

  return (
    <TextFormattingProvider>
      <style>
        {`
          .empty-placeholder:empty::before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
          }
          .text-formatting-active {
            background-color: #EBF8FF;
            border-color: #3B82F6;
          }
        `}
      </style>
      <div 
        ref={sidebarRef as React.RefObject<HTMLDivElement>}
        className={`${isSidebarCollapsed ? 'w-16' : ''} border-r border-gray-300 py-3 px-2.5 bg-white h-full box-border font-sans flex flex-col transition-all duration-300 relative overflow-hidden`}
        style={{
          width: isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
          minWidth: isSidebarCollapsed ? '64px' : `${MIN_SIDEBAR_WIDTH}px`,
          maxWidth: isSidebarCollapsed ? '64px' : `${MAX_SIDEBAR_WIDTH}px`
        }}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={handleSidebarToggle}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          <span className={`text-gray-600 text-sm transform transition-transform duration-200 ${
            isSidebarCollapsed ? 'rotate-180' : ''
          }`}>
            ◀
          </span>
        </button>
        
        <div className="pt-16">
          {!isSidebarCollapsed && (
            <div className="text-center mb-3">
              <EditableText
                value={title}
                onChange={setTitle}
                onBlur={handleTitleBlur}
                isEditing={isEditingTitle}
                onClick={handleTitleClick}
                onDoubleClick={() => setShowTitleSizeControl(true)}
                className={isEditingTitle 
                  ? "text-4xl font-bold w-[90%] p-0.5 text-blue-700 border border-gray-300 mt-0 mb-3 font-inherit outline-none"
                  : "text-blue-700 cursor-pointer leading-tight font-inherit font-semibold transition-all duration-200 hover:text-blue-800 inline-block"
                }
                style={{ fontSize: `${titleSize}px` }}
                title="Double-click to adjust size"
              />
              <InlineSizeControl 
                size={titleSize} 
                setSize={setTitleSize} 
                minSize={24} 
                maxSize={72} 
                show={showTitleSizeControl} 
                setShow={setShowTitleSizeControl} 
              />
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="flex justify-center mb-3">
              <div 
                className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-blue-800 transition-colors duration-200"
                onClick={() => setIsSidebarCollapsed(false)}
                title={title}
              >
                {title.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Empty space to push content down */}
        <div className="mt-8"></div>

        <div
          className="relative flex-1 min-h-0 overflow-y-auto"
          onMouseEnter={() => setIsHoveringClassArea(true)}
          onMouseLeave={() => setIsHoveringClassArea(false)}
        >
          {!isSidebarCollapsed && (
            <div className="mb-4 px-8">
              <div className="flex items-center">
                <EditableText
                  value={classesTitle}
                  onChange={setClassesTitle}
                  onBlur={handleClassesTitleBlur}
                  isEditing={isEditingClassesTitle}
                  onClick={() => setIsEditingClassesTitle(true)}
                  onDoubleClick={() => setShowClassesHeaderSizeControl(true)}
                  className={isEditingClassesTitle
                    ? "text-yellow-500 font-medium normal-case bg-transparent border-b-2 border-yellow-500 outline-none min-w-0 max-w-full inline-block"
                    : "text-yellow-500 font-medium normal-case cursor-pointer transition-all duration-200 hover:text-yellow-600 inline-block"
                  }
                  style={isEditingClassesTitle 
                    ? { fontSize: `${classesHeaderSize}px`, minWidth: `${classesTitle.length + 1}ch` }
                    : { fontSize: `${classesHeaderSize}px` }
                  }
                  title="Double-click to adjust size"
                />
                <InlineSizeControl 
                  size={classesHeaderSize} 
                  setSize={setClassesHeaderSize} 
                  minSize={14} 
                  maxSize={32} 
                  show={showClassesHeaderSizeControl} 
                  setShow={setShowClassesHeaderSizeControl} 
                />
              </div>
            </div>
          )}

          <ClassList
            classes={classes}
            setClasses={setClasses}
            selectedClass={selectedClass}
            editingClassId={editingClassId}
            setEditingClassId={setEditingClassId}
            hoveredClassId={hoveredClassId}
            setHoveredClassId={setHoveredClassId}
            onClassClick={handleClassClick}
            classNameSize={classNameSize}
            setClassNameSize={setClassNameSize}
            showClassNameSizeControl={showClassNameSizeControl}
            setShowClassNameSizeControl={setShowClassNameSizeControl}
            isAuthenticated={isAuthenticated}
            isSidebarCollapsed={isSidebarCollapsed}
            isHoveringClassArea={isHoveringClassArea}
          />
        </div>

        <div className="px-2 mt-auto border-t pt-6 flex-shrink-0 max-h-96 overflow-y-auto">
          {/* Class Chatbot Button - Notion Style */}
          {!isSidebarCollapsed && (
            <div className="mb-3">
            <button
              onClick={() => setShowChatbotPanel(!showChatbotPanel)}
              className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-all duration-200 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base">🤖</span>
                <span className="text-gray-700 text-sm font-normal">
                  Class Chatbot
                </span>
              </div>
            </button>
          </div>
          )}
          
          {/* Collapsed chatbot icon */}
          {isSidebarCollapsed && (
            <div className="mb-3 flex justify-center">
              <button
                onClick={() => setShowChatbotPanel(!showChatbotPanel)}
                className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
                title="Class Chatbot"
                type="button"
              >
                <span className="text-gray-600 text-lg">🤖</span>
              </button>
            </div>
          )}
        </div>

        {/* Canvas Sync Button - Positioned closer to chatbot */}
        <div className="px-2 mb-2">
          {!isSidebarCollapsed ? (
            <button
              onClick={() => setShowCanvasSettings(true)}
              className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-all duration-200 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base">🎓</span>
                <span className="text-gray-700 text-sm font-normal">
                  Canvas Sync
                </span>
                {isCanvasSyncing && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setShowCanvasSettings(true)}
                className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
                title="Canvas Sync"
                type="button"
              >
                <span className="text-gray-600 text-lg">🎓</span>
              </button>
            </div>
          )}
        </div>

        {/* Auth Controls */}
        <div className="px-2 mt-auto mb-8 flex-shrink-0">
          <AuthSection
            user={user}
            isAuthenticated={isAuthenticated}
            logout={logout}
            onShowLogin={() => setShowLogin(true)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </div>

        <SyllabusModal
          show={showSyllabusModal}
          selectedClass={selectedClass}
          onClose={() => setShowSyllabusModal(false)}
          onSyllabusUpdate={handleSyllabusUpdate}
          onFileUpdate={handleFileUpdate}
        />
        {showLogin && !isAuthenticated && (
          <LoginComponent onClose={() => setShowLogin(false)} />
        )}
        {showCanvasSettings && (
          <CanvasSettings onClose={() => setShowCanvasSettings(false)} />
        )}
        </div>
        {/* Resize Handle */}
        {!isSidebarCollapsed && (
          <div
            className="resize-handle fixed top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 transition-all duration-200 z-50"
            style={{ 
              left: `${sidebarWidth - 2}px`,
              backgroundColor: isResizing ? '#3B82F6' : 'transparent',
              boxShadow: isResizing ? '0 0 0 1px #3B82F6' : 'none'
            }}
            onMouseDown={startResize}
            title="Drag to resize sidebar"
          >
            <div className="absolute inset-y-0 -left-1 w-3 hover:bg-blue-500/10 transition-colors duration-200" />
          </div>
        )}

        <ChatbotPanel
          selectedClass={selectedClass}
          show={showChatbotPanel}
          onClose={() => setShowChatbotPanel(false)}
          position={chatbotPosition}
          onPositionChange={setChatbotPosition}
          height={chatbotPanelHeight}
          onHeightChange={setChatbotPanelHeight}
          fontSize={fontSize}
        />
      </TextFormattingProvider>
    );
};

export default Sidebar;