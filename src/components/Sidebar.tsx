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
const CanvasSettings = lazy(() => import("./CanvasSettings"));
const SyllabusModal = lazy(() => import("./SyllabusModal"));
const ChatbotPanel = lazy(() => import("./ChatbotPanel"));
const AuthSection = lazy(() => import("./AuthSection"));

// Constants
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 256;

const Sidebar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Custom hooks for state management
  const sidebarState = useSidebarState();
  const {
    title,
    setTitle,
    isEditingTitle,
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
    showCanvasSettings,
    setShowCanvasSettings,
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

  // Enhanced sidebar toggle handler
  const handleEnhancedSidebarToggle = () => {
    handleSidebarToggle();
    // Reset to default width when expanding with smooth animation
    if (isSidebarCollapsed) {
      setTimeout(() => {
        const savedWidth = localStorage.getItem('sidebarWidth');
        setSidebarWidth(savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH);
      }, 150);
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
          }
          .sidebar-resizing * {
            pointer-events: none;
          }
          .resize-handle {
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .resize-handle:hover {
            transform: scaleX(1.2);
          }
          .resize-handle.active {
            background-color: #3B82F6 !important;
            transform: none;
            box-shadow: 0 0 0 0.5px #3B82F6;
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
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .sidebar-no-transition {
            transition: none;
          }
        `}
      </style>
      <div 
        ref={sidebarRef as React.RefObject<HTMLDivElement>}
        className={`${
          isSidebarCollapsed ? 'w-16' : ''
        } border-r border-gray-300 py-3 px-2.5 bg-white h-full box-border font-sans flex flex-col relative overflow-hidden ${
          isResizing ? 'sidebar-no-transition' : 'sidebar-transition'
        }`}
        style={{
          width: isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
          minWidth: isSidebarCollapsed ? '64px' : `${MIN_SIDEBAR_WIDTH}px`,
          maxWidth: isSidebarCollapsed ? '64px' : `${MAX_SIDEBAR_WIDTH}px`,
          willChange: isResizing ? 'width' : 'auto'
        }}
      >
        {/* Collapse Toggle Button */}
        <SidebarToggleButton
          isSidebarCollapsed={isSidebarCollapsed}
          onToggle={handleEnhancedSidebarToggle}
        />
        
        {/* Title Section */}
        <SidebarTitle
          title={title}
          setTitle={setTitle}
          isEditingTitle={isEditingTitle}
          onTitleClick={handleTitleClick}
          onTitleBlur={handleTitleBlur}
          titleSize={titleSize}
          setTitleSize={setTitleSize}
          showTitleSizeControl={showTitleSizeControl}
          setShowTitleSizeControl={setShowTitleSizeControl}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(false)}
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
                    ? "text-yellow-500 font-medium normal-case bg-transparent outline-none min-w-0 max-w-full inline-block"
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

        {/* Controls Section */}
        <SidebarControls
          isSidebarCollapsed={isSidebarCollapsed}
          isCanvasSyncing={isCanvasSyncing}
          onShowChatbot={() => setShowChatbotPanel(!showChatbotPanel)}
          onShowCanvasSettings={() => setShowCanvasSettings(true)}
        />

        {/* Auth Controls */}
        <div className="px-2 mt-auto mb-8 flex-shrink-0">
          <Suspense fallback={
            <div className="animate-pulse bg-gray-200 h-10 rounded" />
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

        {/* Modals and Panels */}
        <Suspense fallback={
          showSyllabusModal ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-center mt-4 text-gray-600">Loading syllabus editor...</p>
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

        {showCanvasSettings && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-center mt-4 text-gray-600">Loading Canvas settings...</p>
              </div>
            </div>
          }>
            <CanvasSettings onClose={() => setShowCanvasSettings(false)} />
          </Suspense>
        )}

        {/* Resize Handle */}
        <SidebarResizeHandle
          isSidebarCollapsed={isSidebarCollapsed}
          sidebarWidth={sidebarWidth}
          isResizing={isResizing}
          onStartResize={startResize}
        />

        {/* Chatbot Panel */}
        <Suspense fallback={
          showChatbotPanel ? (
            <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4" style={{ width: '400px', height: `${chatbotPanelHeight}px` }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-8" />
              <p className="text-center mt-4 text-gray-600">Loading chatbot...</p>
            </div>
          ) : null
        }>
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
        </Suspense>
      </div>
    </TextFormattingProvider>
  );
};

export default Sidebar;