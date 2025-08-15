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
  const { getFontSize, getFontWeight, elementFormatting, setElementFormatting } = useTextFormatting();
  
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
    chatbotPanelWidth,
    setChatbotPanelWidth,
    chatbotPosition,
    setChatbotPosition,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
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
  const [classesColorPickerPosition, setClassesColorPickerPosition] = React.useState({ x: 0, y: 0 });

  // Track font size with local state that syncs with context
  const [classesHeaderSize, setClassesHeaderSize] = React.useState(() => {
    const formatting = elementFormatting['classes-header'];
    return formatting?.fontSize || getFontSize('classes-header');
  });

  // Track font weight with local state that syncs with context
  const [classesHeaderWeight, setClassesHeaderWeight] = React.useState(() => {
    const formatting = elementFormatting['classes-header'];
    return formatting?.bold ? 'bold' : getFontWeight('classes-header');
  });
  
  // Update local state when context changes
  useEffect(() => {
    const formatting = elementFormatting['classes-header'];
    const newSize = formatting?.fontSize || getFontSize('classes-header');
    if (newSize !== classesHeaderSize) {
      setClassesHeaderSize(newSize);
    }
    
    const newWeight = formatting?.bold ? 'bold' : getFontWeight('classes-header');
    if (newWeight !== classesHeaderWeight) {
      setClassesHeaderWeight(newWeight);
    }
  }, [elementFormatting, getFontSize, getFontWeight, classesHeaderSize, classesHeaderWeight]);
  
  // Listen for font size change events
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

  // Listen for font weight change events
  useEffect(() => {
    const handleFontWeightChange = (event: CustomEvent) => {
      if (event.detail.elementType === 'classes-header') {
        setClassesHeaderWeight(event.detail.fontWeight);
      }
    };
    
    window.addEventListener('fontWeightChanged', handleFontWeightChange as EventListener);
    return () => {
      window.removeEventListener('fontWeightChanged', handleFontWeightChange as EventListener);
    };
  }, []);

  // Standard color options with consistent shades across light and dark themes
  const colorOptions = [
    { 
      name: 'blue', 
      class: 'text-[#1D4ED8] dark:text-[#1D4ED8]', 
      hoverClass: 'hover:text-[#1E40AF] dark:hover:text-[#1E40AF]',
      bgClass: 'bg-[#1D4ED8] dark:bg-[#1D4ED8]',
      hoverBgClass: 'hover:bg-[#1E40AF] dark:hover:bg-[#1E40AF]'
    },
    { 
      name: 'red', 
      class: 'text-[#DC2626] dark:text-[#DC2626]', 
      hoverClass: 'hover:text-[#B91C1C] dark:hover:text-[#B91C1C]',
      bgClass: 'bg-[#DC2626] dark:bg-[#DC2626]',
      hoverBgClass: 'hover:bg-[#B91C1C] dark:hover:bg-[#B91C1C]'
    },
    { 
      name: 'green', 
      class: 'text-[#16A34A] dark:text-[#16A34A]', 
      hoverClass: 'hover:text-[#15803D] dark:hover:text-[#15803D]',
      bgClass: 'bg-[#16A34A] dark:bg-[#16A34A]',
      hoverBgClass: 'hover:bg-[#15803D] dark:hover:bg-[#15803D]'
    },
    { 
      name: 'yellow', 
      class: 'text-[#CA8A04] dark:text-[#CA8A04]', 
      hoverClass: 'hover:text-[#A16207] dark:hover:text-[#A16207]',
      bgClass: 'bg-[#CA8A04] dark:bg-[#CA8A04]',
      hoverBgClass: 'hover:bg-[#A16207] dark:hover:bg-[#A16207]'
    },
    { 
      name: 'purple', 
      class: 'text-[#9333EA] dark:text-[#9333EA]', 
      hoverClass: 'hover:text-[#7C3AED] dark:hover:text-[#7C3AED]',
      bgClass: 'bg-[#9333EA] dark:bg-[#9333EA]',
      hoverBgClass: 'hover:bg-[#7C3AED] dark:hover:bg-[#7C3AED]'
    },
    { 
      name: 'pink', 
      class: 'text-[#DB2777] dark:text-[#DB2777]', 
      hoverClass: 'hover:text-[#BE185D] dark:hover:text-[#BE185D]',
      bgClass: 'bg-[#DB2777] dark:bg-[#DB2777]',
      hoverBgClass: 'hover:bg-[#BE185D] dark:hover:bg-[#BE185D]'
    },
    { 
      name: 'rose', 
      class: 'text-[#F43F5E] dark:text-[#F43F5E]', 
      hoverClass: 'hover:text-[#E11D48] dark:hover:text-[#E11D48]',
      bgClass: 'bg-[#F43F5E] dark:bg-[#F43F5E]',
      hoverBgClass: 'hover:bg-[#E11D48] dark:hover:bg-[#E11D48]'
    },
    { 
      name: 'lavender', 
      class: 'text-[#C084FC] dark:text-[#C084FC]', 
      hoverClass: 'hover:text-[#A855F7] dark:hover:text-[#A855F7]',
      bgClass: 'bg-[#C084FC] dark:bg-[#C084FC]',
      hoverBgClass: 'hover:bg-[#A855F7] dark:hover:bg-[#A855F7]'
    },
    { 
      name: 'indigo', 
      class: 'text-[#4F46E5] dark:text-[#4F46E5]', 
      hoverClass: 'hover:text-[#4338CA] dark:hover:text-[#4338CA]',
      bgClass: 'bg-[#4F46E5] dark:bg-[#4F46E5]',
      hoverBgClass: 'hover:bg-[#4338CA] dark:hover:bg-[#4338CA]'
    },
    { 
      name: 'gray', 
      class: 'text-[#6B7280] dark:text-[#6B7280]', 
      hoverClass: 'hover:text-[#4B5563] dark:hover:text-[#4B5563]',
      bgClass: 'bg-[#6B7280] dark:bg-[#6B7280]',
      hoverBgClass: 'hover:bg-[#4B5563] dark:hover:bg-[#4B5563]'
    },
    { 
      name: 'orange', 
      class: 'text-[#EA580C] dark:text-[#EA580C]', 
      hoverClass: 'hover:text-[#C2410C] dark:hover:text-[#C2410C]',
      bgClass: 'bg-[#EA580C] dark:bg-[#EA580C]',
      hoverBgClass: 'hover:bg-[#C2410C] dark:hover:bg-[#C2410C]'
    },
    { 
      name: 'teal', 
      class: 'text-[#0D9488] dark:text-[#0D9488]', 
      hoverClass: 'hover:text-[#0F766E] dark:hover:text-[#0F766E]',
      bgClass: 'bg-[#0D9488] dark:bg-[#0D9488]',
      hoverBgClass: 'hover:bg-[#0F766E] dark:hover:bg-[#0F766E]'
    },
    { 
      name: 'white', 
      class: 'text-[#FFFFFF] dark:text-[#FFFFFF]', 
      hoverClass: 'hover:text-[#F3F4F6] dark:hover:text-[#F3F4F6]',
      bgClass: 'bg-[#FFFFFF] dark:bg-[#FFFFFF]',
      hoverBgClass: 'hover:bg-[#F3F4F6] dark:hover:bg-[#F3F4F6]'
    },
    { 
      name: 'black', 
      class: 'text-[#000000] dark:text-[#000000]', 
      hoverClass: 'hover:text-[#1F2937] dark:hover:text-[#1F2937]',
      bgClass: 'bg-[#000000] dark:bg-[#000000]',
      hoverBgClass: 'hover:bg-[#1F2937] dark:hover:bg-[#1F2937]'
    },
    { 
      name: 'royal', 
      class: 'text-[#4169E1] dark:text-[#4169E1]', 
      hoverClass: 'hover:text-[#3659C7] dark:hover:text-[#3659C7]',
      bgClass: 'bg-[#4169E1] dark:bg-[#4169E1]',
      hoverBgClass: 'hover:bg-[#3659C7] dark:hover:bg-[#3659C7]'
    }
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
    handleTitleBlurWithFormatting,
    handleClassesTitleBlur: handleClassesTitleBlurData,
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
    <>
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
            background-color: #6B7280 !important;
            transform: scaleX(1.2);
            opacity: 1;
          }
          .resize-indicator {
            width: 2px;
            background-color: #6B7280;
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
          isResizing={isResizing}
        />
        
        {/* Title Section */}
        <SidebarTitle
          title={title}
          setTitle={setTitle}
          isEditingTitle={isEditingTitle}
          onTitleClick={handleTitleClick}
          onTitleBlur={() => {
            handleTitleBlurWithFormatting();
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
            <div className={`mb-4 px-6 sidebar-content-fade ${
              isSidebarCollapsed ? 'collapsed' : 'expanded'
            }`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <div className="relative">
                <div 
                  className="relative min-w-0 flex-shrink"
                  style={{ maxWidth: '100%' }}
                >
                  <EditableText
                    key={`classes-header-${classesHeaderSize}`} // Force re-render when font size changes
                    value={classesTitle}
                    onChange={setClassesTitle}
                    onBlur={() => {
                      handleClassesTitleBlurData();
                      handleClassesTitleBlur();
                      setIsEditingClassesTitle(false);
                      // Force a re-render to pick up font size changes
                      setTimeout(() => {
                        setClassesHeaderSize(prev => {
                          const formatting = elementFormatting['classes-header'];
                          return formatting?.fontSize || getFontSize('classes-header');
                        });
                      }, 50);
                    }}
                    isEditing={isEditingClassesTitle}
                    onClick={() => setIsEditingClassesTitle(true)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Calculate position relative to the clicked element
                      const rect = e.currentTarget.getBoundingClientRect();
                      setClassesColorPickerPosition({
                        x: rect.left + (rect.width / 2), // Center horizontally on the text
                        y: rect.bottom + 8 // Position below the text with 8px gap
                      });
                      
                      setShowClassesHeaderColorPicker(true);
                    }}
                    className={isEditingClassesTitle
                      ? `${getColorClasses(classesHeaderColor).class} normal-case bg-transparent outline-none block break-words`
                      : `${getColorClasses(classesHeaderColor).class} normal-case cursor-pointer transition-all duration-200 ${getColorClasses(classesHeaderColor).hoverClass} block break-words`
                    }
                    style={{ 
                      fontSize: `${classesHeaderSize}px`,
                      fontWeight: classesHeaderWeight,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}
                    title="Left-click to edit, Right-click to change color • Focus and use Ctrl+Plus/Minus to resize"
                    data-element-type="classes-header"
                    tabIndex={0}
                    aria-label={`Classes section header: ${classesTitle}. Click to edit, right-click to change color, focus and use Ctrl+Plus/Minus to resize.`}
                  />
                </div>
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


      {/* Chatbot Panel */}
      <Suspense fallback={
        showChatbotPanel ? (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800/90 dark:backdrop-blur-md rounded-lg shadow-lg dark:shadow-slate-900/40 border border-gray-200 dark:border-slate-600/50 p-4" style={{ width: `${chatbotPanelWidth}px`, height: `${chatbotPanelHeight}px` }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-8" />
            <p className="text-center mt-4 text-gray-600 dark:text-slate-400">Loading chatbot...</p>
          </div>
        ) : null
      }>
        <ChatbotPanel
          classes={classes}
          show={showChatbotPanel}
          onClose={() => setShowChatbotPanel(false)}
          position={chatbotPosition}
          onPositionChange={setChatbotPosition}
          height={chatbotPanelHeight}
          onHeightChange={setChatbotPanelHeight}
          width={chatbotPanelWidth}
          onWidthChange={setChatbotPanelWidth}
          fontSize={fontSize}
        />
      </Suspense>

      {/* Classes Header Color Picker - Outside sidebar container */}
      {showClassesHeaderColorPicker && (
        <>
          {/* Enhanced backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-[10100]"
            onClick={() => setShowClassesHeaderColorPicker(false)}
            aria-label="Close color picker"
          />
          {/* Ultra-compact color picker - positioned near the text */}
          <div className="fixed bg-slate-800/95 backdrop-blur-lg border border-slate-600/50 
                         rounded-lg shadow-xl p-3 w-[140px] animate-fadeIn z-[10101]"
               style={{
                 left: `${classesColorPickerPosition.x}px`,
                 top: `${classesColorPickerPosition.y}px`,
                 transform: 'translateX(-50%)' // Center horizontally on the calculated x position
               }}>
            {/* Minimal header */}
            <div className="text-xs font-medium text-slate-200 mb-2 text-center">Choose Color</div>
            
            {/* Ultra-compact 2-row grid */}
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setClassesHeaderColor(color.name);
                    setShowClassesHeaderColorPicker(false);
                  }}
                  className={`w-5 h-5 rounded border ${color.bgClass} 
                             transition-all duration-150 hover:scale-110 active:scale-95
                             focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1
                             shadow-sm ${
                    classesHeaderColor === color.name 
                      ? 'border-slate-200 ring-1 ring-blue-400 scale-110' 
                      : 'border-slate-500 hover:border-slate-400'
                  }`}
                  title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
                  aria-label={`Set color to ${color.name}`}
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
    </>
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

export default React.memo(Sidebar);