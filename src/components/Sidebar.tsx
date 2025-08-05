import React, { useEffect, lazy, Suspense, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TextFormattingProvider, useTextFormatting } from "../contexts/TextFormattingContext";
import { useResizable } from "../hooks/useResizable";
import { useFontSizes } from "../hooks/useLocalStorageState";
import { useSidebarState } from "../hooks/useSidebarState";
import { useSidebarData } from "../hooks/useSidebarData";
import LoginComponent from "./LoginComponent";
import EditableText from "./EditableText";
import ClassList from "./ClassList";
import SidebarTitle from "./sidebar/SidebarTitle";
import SidebarToggleButton from "./sidebar/SidebarToggleButton";
import SidebarResizeHandle from "./sidebar/SidebarResizeHandle";
import SidebarControls from "./sidebar/SidebarControls";

// Lazy load heavy components for better performance
const Settings = lazy(() => import("./Settings"));
const SyllabusModal = lazy(() => import("./SyllabusModal"));
const ChatbotPanel = lazy(() => import("./ChatbotPanel"));
const AuthSection = lazy(() => import("./AuthSection"));
const StudyAnalyticsDashboard = lazy(() => import("./StudyAnalyticsDashboard"));

// Constants
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 256;

interface SidebarProps {
  isNavCollapsed?: boolean;
  setIsNavCollapsed?: (collapsed: boolean) => void;
  onTasksRefresh?: () => void;
}

// Inner Sidebar component that can use TextFormattingContext
const SidebarInner: React.FC<SidebarProps> = ({ 
  isNavCollapsed = false, 
  setIsNavCollapsed = () => {},
  onTasksRefresh
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getFontSize } = useTextFormatting();
  
  // Custom hooks for state management
  const sidebarState = useSidebarState();
  const {
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    classes,
    setClasses,
    editingClassId,
    setEditingClassId,
    hoveredClassId,
    setHoveredClassId,
    showSyllabusModal,
    setShowSyllabusModal,
    selectedClass,
    setSelectedClass,
    isHoveringClassArea,
    setIsHoveringClassArea,
    showLogin,
    setShowLogin,
    showSettings,
    setShowSettings,
    classesTitle,
    setClassesTitle,
    isEditingClassesTitle,
    setIsEditingClassesTitle,
    showChatbotPanel,
    setShowChatbotPanel,
    chatbotPanelHeight,
    setChatbotPanelHeight,
    chatbotPosition,
    setChatbotPosition,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    showClassNameSizeControl,
    setShowClassNameSizeControl,
    isCanvasSyncing,
    setIsCanvasSyncing,
    showStudyAnalytics,
    setShowStudyAnalytics,
    handleTitleClick,
    handleSidebarToggle,
    handleClassesTitleBlur,
  } = sidebarState;
  
  // Font sizes with optimized localStorage access
  const {
    sidebar: fontSize,
    className: classNameSize,
    setSidebarSize: setFontSize,
    setClassNameSize
  } = useFontSizes({
    sidebar: 16,
    className: 14
  });

  // Color state management
  const [titleColor, setTitleColor] = React.useState(() => {
    return localStorage.getItem('titleColor') || 'blue';
  });
  const [classesHeaderColor, setClassesHeaderColor] = React.useState(() => {
    return localStorage.getItem('classesHeaderColor') || 'yellow';
  });
  const [showTitleColorPicker, setShowTitleColorPicker] = React.useState(false);
  const [showClassesHeaderColorPicker, setShowClassesHeaderColorPicker] = React.useState(false);

  // Font size state management for classes header
  const [classesHeaderSize, setClassesHeaderSize] = React.useState(() => getFontSize('classes-header'));

  // Listen for font size changes from keyboard shortcuts
  useEffect(() => {
    const handleFontSizeChange = (event: CustomEvent) => {
      if (event.detail.elementType === 'classes-header') {
        setClassesHeaderSize(event.detail.fontSize);
      }
    };

    window.addEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    };
  }, []);

  // Update font size if it changes in context
  useEffect(() => {
    const currentFontSize = getFontSize('classes-header');
    setClassesHeaderSize(currentFontSize);
  }, [getFontSize]);

  // Standard color options with dark mode support
  const colorOptions = [
    { name: 'blue', class: 'text-blue-700 dark:text-blue-400', hoverClass: 'hover:text-blue-800 dark:hover:text-blue-300' },
    { name: 'red', class: 'text-red-700 dark:text-red-400', hoverClass: 'hover:text-red-800 dark:hover:text-red-300' },
    { name: 'green', class: 'text-green-700 dark:text-green-400', hoverClass: 'hover:text-green-800 dark:hover:text-green-300' },
    { name: 'yellow', class: 'text-yellow-600 dark:text-yellow-400', hoverClass: 'hover:text-yellow-700 dark:hover:text-yellow-300' },
    { name: 'purple', class: 'text-purple-700 dark:text-purple-400', hoverClass: 'hover:text-purple-800 dark:hover:text-purple-300' },
    { name: 'pink', class: 'text-pink-700 dark:text-pink-400', hoverClass: 'hover:text-pink-800 dark:hover:text-pink-300' },
    { name: 'indigo', class: 'text-indigo-700 dark:text-indigo-400', hoverClass: 'hover:text-indigo-800 dark:hover:text-indigo-300' },
    { name: 'gray', class: 'text-gray-700 dark:text-gray-400', hoverClass: 'hover:text-gray-800 dark:hover:text-gray-300' },
    { name: 'orange', class: 'text-orange-700 dark:text-orange-400', hoverClass: 'hover:text-orange-800 dark:hover:text-orange-300' },
    { name: 'teal', class: 'text-teal-700 dark:text-teal-400', hoverClass: 'hover:text-teal-800 dark:hover:text-teal-300' }
  ];

  // Get color classes for a given color name
  const getColorClasses = (colorName: string) => {
    const color = colorOptions.find(c => c.name === colorName);
    return color || colorOptions[0]; // Default to blue if not found
  };
  
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

  // Data management hook
  const {
    handleTitleBlur,
    handleClassClick,
    handleSyllabusUpdate,
    handleFileUpdate,
  } = useSidebarData({
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
  });

  // Save font size preferences
  useEffect(() => {
    localStorage.setItem('sidebarFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('classNameFontSize', classNameSize.toString());
  }, [classNameSize]);

  // Save color preferences
  useEffect(() => {
    localStorage.setItem('titleColor', titleColor);
  }, [titleColor]);

  useEffect(() => {
    localStorage.setItem('classesHeaderColor', classesHeaderColor);
  }, [classesHeaderColor]);

  // Enhanced sidebar toggle handler with improved timing
  const handleEnhancedSidebarToggle = () => {
    handleSidebarToggle();
    // Reset to default width when expanding with synchronized animation
    if (isSidebarCollapsed) {
      // Use requestAnimationFrame for smoother animation synchronization
      requestAnimationFrame(() => {
        setTimeout(() => {
          const savedWidth = localStorage.getItem('sidebarWidth');
          setSidebarWidth(savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH);
        }, 50); // Reduced from 150ms to 50ms for snappier feel
      });
    }
  };

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
          .sidebar-resizing {
            user-select: none;
            cursor: ew-resize !important;
            /* Disable expensive visual effects during resize */
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
          }
          .sidebar-resizing * {
            pointer-events: none;
            /* Disable transitions and animations during resize for performance */
            transition: none !important;
            animation: none !important;
          }
          .resize-handle {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .resize-handle:hover {
            transform: scaleX(1.3);
            opacity: 0.8;
          }
          .resize-handle.active {
            background-color: #3B82F6 !important;
            transform: scaleX(1.2);
            box-shadow: 0 0 0 1px #3B82F6;
            opacity: 1;
          }
          .resize-indicator {
            width: 2px;
            background-color: #3B82F6;
            opacity: 0;
            transition: opacity 0.15s ease;
          }
          .resize-indicator.visible {
            opacity: 1;
          }
          .sidebar-transition {
            transition: width 0.3s ease;
            will-change: auto;
          }
          .sidebar-no-transition {
            transition: none;
            will-change: width; /* Hint browser to optimize for width changes during resize */
          }
          .sidebar-content-fade {
            transition: opacity 0.2s ease-out, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar-content-fade.collapsed {
            opacity: 0;
            transform: translateX(-8px);
          }
          .sidebar-content-fade.expanded {
            opacity: 1;
            transform: translateX(0);
          }
        `}
      </style>
      <div 
        ref={sidebarRef as React.RefObject<HTMLDivElement>}
        className={`${
          isSidebarCollapsed ? 'w-16' : ''
        } border-r border-gray-300 dark:border-slate-700/50 py-3 px-2.5 bg-white ${
          isResizing 
            ? 'dark:bg-slate-900 sidebar-no-transition' // No backdrop-blur during resize for performance
            : 'dark:bg-slate-900/95 dark:backdrop-blur-sm sidebar-transition'
        } h-full box-border font-sans flex flex-col relative z-[9998]`}
        style={{
          width: isSidebarCollapsed ? '64px' : `${sidebarWidth}px`
        }}
      >
        {/* Collapse Toggle Button */}
        <SidebarToggleButton
          isSidebarCollapsed={isSidebarCollapsed}
          onToggle={handleEnhancedSidebarToggle}
          sidebarWidth={sidebarWidth}
        />
        
        {/* Title Section */}
        <SidebarTitle
          title={title}
          setTitle={setTitle}
          isEditingTitle={isEditingTitle}
          onTitleClick={handleTitleClick}
          onTitleBlur={() => {
            handleTitleBlur();
            setIsEditingTitle(false);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(false)}
          titleColor={titleColor}
          setTitleColor={setTitleColor}
          showTitleColorPicker={showTitleColorPicker}
          setShowTitleColorPicker={setShowTitleColorPicker}
          colorOptions={colorOptions}
          getColorClasses={getColorClasses}
        />

        {/* Empty space to push content down */}
        <div className="mt-8"></div>

        {/* Classes Section */}
        <div
          className={`relative flex-1 min-h-0 overflow-y-auto pb-6 ${
            isResizing ? 'pointer-events-none' : ''
          }`}
          onMouseEnter={() => setIsHoveringClassArea(true)}
          onMouseLeave={() => setIsHoveringClassArea(false)}
        >
          {!isSidebarCollapsed && (
            <div className={`mb-4 px-8 sidebar-content-fade ${
              isSidebarCollapsed ? 'collapsed' : 'expanded'
            }`}>
              <div className="flex items-center">
                <div 
                  className="relative inline-block"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowClassesHeaderColorPicker(true);
                  }}
                >
                  <EditableText
                    value={classesTitle}
                    onChange={setClassesTitle}
                    onBlur={() => {
                      handleClassesTitleBlur();
                      setIsEditingClassesTitle(false);
                    }}
                    isEditing={isEditingClassesTitle}
                    onClick={() => setIsEditingClassesTitle(true)}
                    className={isEditingClassesTitle
                      ? `${getColorClasses(classesHeaderColor).class} font-medium normal-case bg-transparent outline-none min-w-0 max-w-full inline-block`
                      : `${getColorClasses(classesHeaderColor).class} font-medium normal-case cursor-pointer transition-all duration-200 ${getColorClasses(classesHeaderColor).hoverClass} inline-block`
                    }
                    style={isEditingClassesTitle 
                      ? { fontSize: `${classesHeaderSize}px`, minWidth: `${classesTitle.length + 1}ch` }
                      : { fontSize: `${classesHeaderSize}px` }
                    }
                    title="Left-click to edit, Right-click to change color • Focus and use Ctrl+Plus/Minus to resize"
                    data-element-type="classes-header"
                    tabIndex={0}
                    aria-label={`Classes section header: ${classesTitle}. Click to edit, right-click to change color, focus and use Ctrl+Plus/Minus to resize.`}
                  />
                </div>
                {/* Ultra-Compact Classes Header Color Picker */}
                {showClassesHeaderColorPicker && (
                  <>
                    {/* Enhanced backdrop */}
                    <div 
                      className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowClassesHeaderColorPicker(false)}
                      aria-label="Close color picker"
                    />
                    {/* Ultra-compact color picker positioned to the right of text */}
                    <div className="absolute z-50 left-full ml-3 top-0 bg-slate-800/95 backdrop-blur-lg 
                                   border border-slate-600/50 rounded-lg shadow-xl p-3 
                                   w-[140px] animate-fadeIn">
                      {/* Minimal header */}
                      <div className="text-xs font-medium text-slate-200 mb-2 text-center">Color</div>
                      
                      {/* Ultra-compact 2-row grid */}
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              setClassesHeaderColor(color.name);
                              setShowClassesHeaderColorPicker(false);
                            }}
                            className={`w-5 h-5 rounded border ${color.class.replace('text-', 'bg-')} 
                                       transition-all duration-150 hover:scale-110 active:scale-95
                                       focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1
                                       shadow-sm ${
                              classesHeaderColor === color.name 
                                ? 'border-slate-200 ring-1 ring-blue-400 scale-110' 
                                : 'border-slate-500 hover:border-slate-400'
                            }`}
                            title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                          >
                            {classesHeaderColor === color.name && (
                              <svg className="w-2.5 h-2.5 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Minimal close button */}
                      <button
                        onClick={() => setShowClassesHeaderColorPicker(false)}
                        className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 
                                  hover:text-slate-200 transition-all duration-150 py-1.5 rounded 
                                  focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
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
            onExpandSidebar={() => setIsSidebarCollapsed(false)}
            classNameSize={classNameSize}
            setClassNameSize={setClassNameSize}
            showClassNameSizeControl={showClassNameSizeControl}
            setShowClassNameSizeControl={setShowClassNameSizeControl}
            isAuthenticated={isAuthenticated}
            isSidebarCollapsed={isSidebarCollapsed}
            isHoveringClassArea={isHoveringClassArea}
          />
        </div>

        {/* Controls Section */}
        <SidebarControls
          isSidebarCollapsed={isSidebarCollapsed}
          isCanvasSyncing={isCanvasSyncing}
          onShowChatbot={() => setShowChatbotPanel(!showChatbotPanel)}
          onShowSettings={() => setShowSettings(true)}
          onShowStudyAnalytics={() => setShowStudyAnalytics(true)}
        />

        {/* Auth Controls - minimal gap */}
        <div className="px-2 mb-3 flex-shrink-0">
          <Suspense fallback={
            <div className="animate-pulse bg-gray-200 dark:bg-slate-700 h-10 rounded" />
          }>
            <AuthSection
              user={user}
              isAuthenticated={isAuthenticated}
              logout={logout}
              onShowLogin={() => setShowLogin(true)}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </Suspense>
        </div>

        {/* Resize Handle */}
        <SidebarResizeHandle
          isSidebarCollapsed={isSidebarCollapsed}
          sidebarWidth={sidebarWidth}
          isResizing={isResizing}
          onStartResize={startResize}
        />
      </div>

      {/* Modals and Panels - OUTSIDE sidebar container */}
      <Suspense fallback={
        showSyllabusModal ? (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] border border-gray-100 dark:border-slate-700/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-center mt-4 text-gray-600 dark:text-slate-400">Loading syllabus editor...</p>
            </div>
          </div>
        ) : null
      }>
        <SyllabusModal
          show={showSyllabusModal}
          selectedClass={selectedClass}
          onClose={() => setShowSyllabusModal(false)}
          onSyllabusUpdate={handleSyllabusUpdate}
          onFileUpdate={handleFileUpdate}
          onTasksRefresh={onTasksRefresh}
        />
      </Suspense>

      {showLogin && !isAuthenticated && (
        <LoginComponent onClose={() => setShowLogin(false)} />
      )}

      {showSettings && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-100 dark:border-slate-700/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-center mt-4 text-gray-600 dark:text-slate-400">Loading Settings...</p>
            </div>
          </div>
        }>
          <Settings 
            onClose={() => setShowSettings(false)}
            user={user}
            classes={classes}
            useSupabase={isAuthenticated}
            isNavCollapsed={isNavCollapsed}
            setIsNavCollapsed={setIsNavCollapsed}
          />
        </Suspense>
      )}

      {showStudyAnalytics && isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-800/90 dark:backdrop-blur-md rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl dark:shadow-slate-900/40 border border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Study Analytics</h2>
              <button
                onClick={() => setShowStudyAnalytics(false)}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="ml-4 text-gray-600 dark:text-gray-400">Loading Study Analytics...</p>
                </div>
              }>
                <StudyAnalyticsDashboard />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Panel */}
      <Suspense fallback={
        showChatbotPanel ? (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800/90 dark:backdrop-blur-md rounded-lg shadow-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-600/50 p-4" style={{ width: '400px', height: `${chatbotPanelHeight}px` }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-8" />
            <p className="text-center mt-4 text-gray-600 dark:text-slate-400">Loading chatbot...</p>
          </div>
        ) : null
      }>
        <ChatbotPanel
          selectedClass={selectedClass}
          classes={classes}
          show={showChatbotPanel}
          onClose={() => setShowChatbotPanel(false)}
          position={chatbotPosition}
          onPositionChange={setChatbotPosition}
          height={chatbotPanelHeight}
          onHeightChange={setChatbotPanelHeight}
          fontSize={fontSize}
        />
      </Suspense>
    </TextFormattingProvider>
  );
};

// Main Sidebar wrapper component
const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <TextFormattingProvider>
      <SidebarInner {...props} />
    </TextFormattingProvider>
  );
};

export default Sidebar;