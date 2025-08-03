import React, { useEffect, lazy, Suspense } from "react";
import { useAuth } from "../contexts/AuthContext";
import { TextFormattingProvider } from "../contexts/TextFormattingContext";
import { useResizable } from "../hooks/useResizable";
import { useFontSizes } from "../hooks/useLocalStorageState";
import { useSidebarState } from "../hooks/useSidebarState";
import { useSidebarData } from "../hooks/useSidebarData";
import LoginComponent from "./LoginComponent";
import EditableText from "./EditableText";
import InlineSizeControl from "./InlineSizeControl";
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isNavCollapsed = false, 
  setIsNavCollapsed = () => {} 
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  
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
    showTitleSizeControl,
    setShowTitleSizeControl,
    showClassesHeaderSizeControl,
    setShowClassesHeaderSizeControl,
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

  // Color state management
  const [titleColor, setTitleColor] = React.useState(() => {
    return localStorage.getItem('titleColor') || 'blue';
  });
  const [classesHeaderColor, setClassesHeaderColor] = React.useState(() => {
    return localStorage.getItem('classesHeaderColor') || 'yellow';
  });
  const [showTitleColorPicker, setShowTitleColorPicker] = React.useState(false);
  const [showClassesHeaderColorPicker, setShowClassesHeaderColorPicker] = React.useState(false);

  // Standard color options
  const colorOptions = [
    { name: 'blue', class: 'text-blue-700', hoverClass: 'hover:text-blue-800' },
    { name: 'red', class: 'text-red-700', hoverClass: 'hover:text-red-800' },
    { name: 'green', class: 'text-green-700', hoverClass: 'hover:text-green-800' },
    { name: 'yellow', class: 'text-yellow-600', hoverClass: 'hover:text-yellow-700' },
    { name: 'purple', class: 'text-purple-700', hoverClass: 'hover:text-purple-800' },
    { name: 'pink', class: 'text-pink-700', hoverClass: 'hover:text-pink-800' },
    { name: 'indigo', class: 'text-indigo-700', hoverClass: 'hover:text-indigo-800' },
    { name: 'gray', class: 'text-gray-700', hoverClass: 'hover:text-gray-800' },
    { name: 'orange', class: 'text-orange-700', hoverClass: 'hover:text-orange-800' },
    { name: 'teal', class: 'text-teal-700', hoverClass: 'hover:text-teal-800' }
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
    localStorage.setItem('titleFontSize', titleSize.toString());
  }, [titleSize]);

  useEffect(() => {
    localStorage.setItem('classesHeaderFontSize', classesHeaderSize.toString());
  }, [classesHeaderSize]);

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
        } h-full box-border font-sans flex flex-col relative`}
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
          titleSize={titleSize}
          setTitleSize={setTitleSize}
          showTitleSizeControl={showTitleSizeControl}
          setShowTitleSizeControl={setShowTitleSizeControl}
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
          className={`relative flex-1 min-h-0 overflow-y-auto ${
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
                <EditableText
                  value={classesTitle}
                  onChange={setClassesTitle}
                  onBlur={() => {
                    handleClassesTitleBlur();
                    setIsEditingClassesTitle(false);
                  }}
                  isEditing={isEditingClassesTitle}
                  onClick={() => setIsEditingClassesTitle(true)}
                  onDoubleClick={() => setShowClassesHeaderSizeControl(true)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowClassesHeaderColorPicker(true);
                  }}
                  className={isEditingClassesTitle
                    ? `${getColorClasses(classesHeaderColor).class} font-medium normal-case bg-transparent outline-none min-w-0 max-w-full inline-block`
                    : `${getColorClasses(classesHeaderColor).class} font-medium normal-case cursor-pointer transition-all duration-200 ${getColorClasses(classesHeaderColor).hoverClass} inline-block`
                  }
                  style={isEditingClassesTitle 
                    ? { fontSize: `${classesHeaderSize}px`, minWidth: `${classesTitle.length + 1}ch` }
                    : { fontSize: `${classesHeaderSize}px` }
                  }
                  title="Left-click to edit, Right-click to change color"
                />
                <InlineSizeControl 
                  size={classesHeaderSize} 
                  setSize={setClassesHeaderSize} 
                  minSize={14} 
                  maxSize={32} 
                  show={showClassesHeaderSizeControl} 
                  setShow={setShowClassesHeaderSizeControl} 
                />
                {/* Classes Header Color Picker */}
                {showClassesHeaderColorPicker && (
                  <>
                    {/* Backdrop to prevent interaction with content below */}
                    <div 
                      className="fixed inset-0 z-40 bg-black bg-opacity-25"
                      onClick={() => setShowClassesHeaderColorPicker(false)}
                    />
                    {/* Color picker positioned to avoid overlapping */}
                    <div className="absolute z-50 top-8 left-0 bg-white dark:bg-slate-800/90 dark:backdrop-blur-md border border-gray-300 dark:border-slate-600/50 rounded-lg shadow-xl dark:shadow-slate-900/40 p-4 min-w-[200px]">
                      <div className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-3">Choose Color</div>
                      <div className="grid grid-cols-5 gap-3 mb-3">
                        {colorOptions.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              setClassesHeaderColor(color.name);
                              setShowClassesHeaderColorPicker(false);
                            }}
                            className={`w-7 h-7 rounded-full border-2 ${color.class.replace('text-', 'bg-')} ${
                              classesHeaderColor === color.name 
                                ? 'border-gray-800 ring-2 ring-gray-300' 
                                : 'border-gray-300 hover:border-gray-500'
                            } hover:scale-110 transition-all duration-200 shadow-sm`}
                            title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setShowClassesHeaderColorPicker(false)}
                        className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-1 px-2 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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

        {/* Auth Controls */}
        <div className="px-2 mt-auto mb-8 flex-shrink-0">
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

export default Sidebar;