import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  getSettings,
  updateSettings,
  generateUniqueId,
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabaseClient";
import { fetchCanvasCalendar } from "../services/canvasService";
import { useFileManager } from "../hooks/useFileManager";
import LoginComponent from "./LoginComponent";
import CanvasSettings from "./CanvasSettings";
import SyllabusModal from "./SyllabusModal";
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import classService from "../services/classService";
GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

// Constants
const CHAT_HISTORY_LIMIT = 6;
const AUTO_SYNC_DELAY = 1500;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 256;

const Sidebar = () => {
  const { user, isAuthenticated, logout, setLastCalendarSyncTimestamp } = useAuth();
  const { getClassData } = useFileManager();
  const [title, setTitle] = useState("UCR 🐻");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editingClassId, setEditingClassId] = useState(null);
  const [hoveredClassId, setHoveredClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isHoveringClassArea, setIsHoveringClassArea] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [classesTitle, setClassesTitle] = useState("Current Classes");
  const [isEditingClassesTitle, setIsEditingClassesTitle] = useState(false);
  const [isChatbotExpanded, setIsChatbotExpanded] = useState(false);
  const [showChatbotPanel, setShowChatbotPanel] = useState(false);
  const [chatbotPanelHeight, setChatbotPanelHeight] = useState(400);
  const [isResizingChatbot, setIsResizingChatbot] = useState(false);
  const [isDraggingChatbot, setIsDraggingChatbot] = useState(false);
  const [chatbotPosition, setChatbotPosition] = useState({ x: 16, y: 0 });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('sidebarFontSize');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem('userDisplayName');
    return saved || (user?.email?.split('@')[0] || 'User');
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameSize, setDisplayNameSize] = useState(() => {
    const saved = localStorage.getItem('displayNameFontSize');
    return saved ? parseInt(saved, 10) : 14;
  });
  const [titleSize, setTitleSize] = useState(() => {
    const saved = localStorage.getItem('titleFontSize');
    return saved ? parseInt(saved, 10) : 50; // 5xl equivalent
  });
  const [classesHeaderSize, setClassesHeaderSize] = useState(() => {
    const saved = localStorage.getItem('classesHeaderFontSize');
    return saved ? parseInt(saved, 10) : 20; // xl equivalent
  });
  const [classNameSize, setClassNameSize] = useState(() => {
    const saved = localStorage.getItem('classNameFontSize');
    return saved ? parseInt(saved, 10) : 14; // sm equivalent
  });
  
  // Text formatting state - loaded from localStorage
  const [elementFormatting, setElementFormatting] = useState(() => {
    const saved = localStorage.getItem('elementFormatting');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeElement, setActiveElement] = useState(null);
  
  // Save formatting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('elementFormatting', JSON.stringify(elementFormatting));
  }, [elementFormatting]);
  const [showTitleSizeControl, setShowTitleSizeControl] = useState(false);
  const [showClassesHeaderSizeControl, setShowClassesHeaderSizeControl] = useState(false);
  const [showClassNameSizeControl, setShowClassNameSizeControl] = useState(false);
  const chatbotRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  
  // Function to restore saved formatting to an element
  const restoreElementFormatting = (element, elementType) => {
    if (elementType && elementFormatting[elementType]) {
      const formatting = elementFormatting[elementType];
      
      if (formatting.bold) {
        element.style.fontWeight = 'bold';
      }
      if (formatting.underline) {
        element.style.textDecoration = 'underline';
      }
    }
  };
  
  // Text formatting functions
  const applyFormatting = (command, value = null) => {
    if (activeElement && activeElement.contentEditable === 'true') {
      const elementType = activeElement.getAttribute('data-element-type') || 'unknown';
      
      if (command === 'bold') {
        const currentFormatting = elementFormatting[elementType] || {};
        const newBoldState = !currentFormatting.bold;
        
        // Toggle bold style directly
        if (newBoldState) {
          activeElement.style.fontWeight = 'bold';
        } else {
          activeElement.style.fontWeight = 'normal';
        }
        
        // Update formatting state
        const newFormatting = { ...currentFormatting, bold: newBoldState };
        setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      } else if (command === 'underline') {
        const currentFormatting = elementFormatting[elementType] || {};
        const newUnderlineState = !currentFormatting.underline;
        
        // Toggle underline style directly
        if (newUnderlineState) {
          activeElement.style.textDecoration = 'underline';
        } else {
          activeElement.style.textDecoration = 'none';
        }
        
        // Update formatting state
        const newFormatting = { ...currentFormatting, underline: newUnderlineState };
        setElementFormatting(prev => ({ ...prev, [elementType]: newFormatting }));
      } else if (command === 'fontSize') {
        document.execCommand('fontSize', false, value);
      }
    }
  };
  
  const increaseFontSize = () => {
    if (activeElement) {
      const currentSize = window.getComputedStyle(activeElement).fontSize;
      const newSize = parseInt(currentSize) + 2;
      activeElement.style.fontSize = `${newSize}px`;
      
      // Save to appropriate state and localStorage based on element
      saveElementFontSize(activeElement, newSize);
    }
  };
  
  const decreaseFontSize = () => {
    if (activeElement) {
      const currentSize = window.getComputedStyle(activeElement).fontSize;
      const newSize = Math.max(10, parseInt(currentSize) - 2);
      activeElement.style.fontSize = `${newSize}px`;
      
      // Save to appropriate state and localStorage based on element
      saveElementFontSize(activeElement, newSize);
    }
  };
  
  // Helper function to save font size based on element type
  const saveElementFontSize = (element, size) => {
    // Check if it's the title element
    if (element.classList?.contains('text-blue-700') || element.getAttribute('data-element-type') === 'title') {
      setTitleSize(size);
      localStorage.setItem('titleFontSize', size.toString());
    }
    // Check if it's the classes header
    else if (element.classList?.contains('text-yellow-500') || element.getAttribute('data-element-type') === 'classes-header') {
      setClassesHeaderSize(size);
      localStorage.setItem('classesHeaderFontSize', size.toString());
    }
    // Check if it's a class name
    else if (element.classList?.contains('text-gray-700') || element.getAttribute('data-element-type') === 'class-name') {
      setClassNameSize(size);
      localStorage.setItem('classNameFontSize', size.toString());
    }
    // Check if it's the display name
    else if (element.classList?.contains('text-gray-800') || element.getAttribute('data-element-type') === 'display-name') {
      // For display name, we can use a separate state if needed
      localStorage.setItem('displayNameFontSize', size.toString());
    }
    // For chat input and other elements, save to general fontSize
    else {
      setFontSize(size);
      localStorage.setItem('sidebarFontSize', size.toString());
    }
  };
  
  // Keyboard shortcut handler
  const handleKeyDown = (e) => {
    // Check if Ctrl (or Cmd on Mac) is pressed
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    
    if (isCtrlPressed) {
      switch (e.key) {
        case 'b':
        case 'B':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          applyFormatting('underline');
          break;
        case ']':
          e.preventDefault();
          increaseFontSize();
          break;
        case '[':
          e.preventDefault();
          decreaseFontSize();
          break;
        default:
          break;
      }
    }
  };


  useEffect(() => {
    const autoSyncCanvas = async () => {
      const canvasUrl = localStorage.getItem("canvas_calendar_url");
      const autoSync = localStorage.getItem("canvas_auto_sync") === "true";
      console.log('[Sidebar] autoSyncCanvas triggered. Canvas URL:', canvasUrl, 'Auto Sync Enabled:', autoSync, 'User Authenticated:', !!user);

      if (user && canvasUrl && autoSync) {
        try {
          console.log("Auto-syncing Canvas calendar (User ID available):", user.id);
          const result = await fetchCanvasCalendar(canvasUrl, isAuthenticated, user);
          console.log("fetchCanvasCalendar result:", result);

          if (result && result.success) {
            console.log("Canvas auto-sync successful, updating sync timestamp.");
            setLastCalendarSyncTimestamp(Date.now());
          } else {
            console.log("Canvas auto-sync did not report success or result was invalid. Result:", result);
          }
        } catch (error) {
          console.error("Error auto-syncing Canvas calendar:", error);
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
    const loadData = async () => {
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

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        // Save width to localStorage
        localStorage.setItem('sidebarWidth', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      document.body.classList.add('sidebar-resizing');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.classList.remove('sidebar-resizing');
    };
  }, [isResizing, sidebarWidth]);

  // Subscribe to class changes from the class service
  useEffect(() => {
    if (!isAuthenticated) {
      classService.reset();
      return;
    }

    const unsubscribe = classService.subscribe((updatedClasses) => {
      // Filter out task-only classes from sidebar display
      const sidebarClasses = updatedClasses.filter(cls => !cls.isTaskClass);
      setClasses(sidebarClasses);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Handle chatbot panel resize and drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingChatbot) {
        const newHeight = window.innerHeight - e.clientY - 20;
        if (newHeight >= 200 && newHeight <= 600) {
          setChatbotPanelHeight(newHeight);
        }
      } else if (isDraggingChatbot) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        const newX = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.startPosX + deltaX));
        // Fix Y-axis inversion: subtract deltaY for bottom positioning
        const newY = Math.max(0, Math.min(window.innerHeight - chatbotPanelHeight, dragRef.current.startPosY - deltaY));
        
        setChatbotPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizingChatbot(false);
      setIsDraggingChatbot(false);
    };

    if (isResizingChatbot || isDraggingChatbot) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      if (isResizingChatbot) {
        document.body.style.cursor = 'ns-resize';
      } else if (isDraggingChatbot) {
        document.body.style.cursor = 'move';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingChatbot, isDraggingChatbot, chatbotPanelHeight]);

  // Save font size and display name changes
  useEffect(() => {
    localStorage.setItem('sidebarFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('userDisplayName', displayName);
  }, [displayName]);
  
  useEffect(() => {
    localStorage.setItem('displayNameFontSize', displayNameSize.toString());
  }, [displayNameSize]);

  // Save individual text size preferences
  useEffect(() => {
    localStorage.setItem('titleFontSize', titleSize.toString());
  }, [titleSize]);

  useEffect(() => {
    localStorage.setItem('classesHeaderFontSize', classesHeaderSize.toString());
  }, [classesHeaderSize]);

  useEffect(() => {
    localStorage.setItem('classNameFontSize', classNameSize.toString());
  }, [classNameSize]);
  
  // Add global keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    // Track focus on text inputs and apply saved formatting
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        setActiveElement(e.target);
        
        // Apply saved formatting for this element type
        const elementType = e.target.getAttribute('data-element-type');
        if (elementType && elementFormatting[elementType]) {
          const formatting = elementFormatting[elementType];
          
          // Apply text formatting styles
          if (formatting.bold) {
            e.target.style.fontWeight = 'bold';
          }
          if (formatting.underline) {
            e.target.style.textDecoration = 'underline';
          }
        }
      }
    };
    
    const handleBlur = () => {
      setActiveElement(null);
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [activeElement]);


  // Update display name when user changes
  useEffect(() => {
    if (user?.email && !localStorage.getItem('userDisplayName')) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  // Title editing functions
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Save title in settings
    updateSettings({ title });
  };

  // Class editing functions
  const handleClassClick = async (classId) => {
    const classObj = classes.find((c) => c.id === classId);
    const classData = await getClassData(classId);
    
    const updatedClass = {
      ...classObj,
      ...classData,
    };

    setSelectedClass(updatedClass);
    setShowSyllabusModal(true);
  };

  const handleClassNameClick = (e, classId) => {
    e.stopPropagation();
    setEditingClassId(classId);
  };

  const handleClassChange = (e, classId) => {
    // Update local state for immediate UI feedback
    const updatedClasses = classes.map((c) =>
      c.id === classId ? { ...c, name: e.target.value } : c
    );
    setClasses(updatedClasses);
  };

  const handleClassBlur = async () => {
    // Save the updated class using class service
    if (editingClassId) {
      const classToUpdate = classes.find((c) => c.id === editingClassId);
      if (classToUpdate) {
        await classService.updateClass(editingClassId, classToUpdate, isAuthenticated);
      }
    }
    setEditingClassId(null);
  };

  const handleDeleteClass = async (e, classId) => {
    e.stopPropagation();
    await classService.deleteClass(classId, isAuthenticated);
    // No need to update local state - the class service will notify subscribers
  };

  const handleAddClass = async () => {
    if (newClassName.trim()) {
      const newId = generateUniqueId();
      const newClass = {
        id: newId,
        name: newClassName.trim(),
        syllabus: null,
        files: [],
      };

      // Add class using class service
      await classService.addClass(newClass, isAuthenticated);
      setNewClassName("");
    } else {
      const newId = generateUniqueId();
      const newClass = {
        id: newId,
        name: "New Class",
        syllabus: null,
        files: [],
      };

      // Add class using class service
      await classService.addClass(newClass, isAuthenticated);
      setEditingClassId(newId);
    }
  };

  const handleClassKeyDown = (e, classId) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents newline in input
      handleClassBlur(); // Close current editing
    }
  };

  // File management callbacks
  const handleSyllabusUpdate = async (syllabusRecord) => {
    const updatedClass = { ...selectedClass, syllabus: syllabusRecord };
    setSelectedClass(updatedClass);
    
    // Update class using class service
    await classService.updateClass(selectedClass.id, updatedClass, isAuthenticated);
  };

  const handleFileUpdate = async (fileRecord, remainingFiles) => {
    if (fileRecord) {
      // Adding new file
      const updatedClass = {
        ...selectedClass,
        files: [...selectedClass.files, fileRecord],
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
  };


  // Move handleAskChatbot inside the component
  const handleAskChatbot = async (e) => {
    e.preventDefault();
    const queryText = typeof chatQuery === 'string' ? chatQuery : e.target.textContent || '';
    if (!queryText.trim() || isChatLoading) return;

    const newHistory = [...chatHistory, { role: 'user', content: queryText }];
    setChatHistory(newHistory);
    setChatQuery(''); // Clear input after sending
    // Clear the contentEditable div
    const chatInput = document.querySelector('[data-placeholder="Ask a question..."]');
    if (chatInput) {
      chatInput.textContent = '';
    }
    setIsChatLoading(true);

    if (!selectedClass) {
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: 'Please select a class before asking a question.' },
      ]);
      setIsChatLoading(false);
      return;
    }

    try {
      // Send conversation history with the request (use newHistory which includes current conversation)
      const { data, error } = await supabase.functions.invoke('ask-chatbot', {
        body: {
          query: queryText,
          classId: selectedClass.id,
          conversationHistory: newHistory.slice(0, -1).slice(-CHAT_HISTORY_LIMIT), // Send last 6 messages (exclude current question)
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setChatHistory([...newHistory, { role: 'assistant', content: `Error: ${error.message || 'Something went wrong.'}` }]);
      } else {
        setChatHistory([...newHistory, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      console.error('Caught error asking chatbot:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      let errorMessage = 'Sorry, something went wrong.';
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setChatHistory([...newHistory, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add this function near your other handlers
  const clearChatHistory = () => {
    setChatHistory([]);
  };


  // Inline size control component
  const InlineSizeControl = ({ size, setSize, minSize = 12, maxSize = 60, show, setShow }) => (
    show && (
      <div className="inline-flex items-center ml-2 bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1 space-x-1">
        <button
          onClick={() => setSize(Math.max(minSize, size - 2))}
          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
        >
          −
        </button>
        <span className="text-xs text-gray-600 w-8 text-center">{size}</span>
        <button
          onClick={() => setSize(Math.min(maxSize, size + 2))}
          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setShow(false)}
          className="w-6 h-6 text-gray-400 hover:text-gray-600 text-xs flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    )
  );

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
        `}
      </style>
      <div 
        ref={sidebarRef}
        className={`${isSidebarCollapsed ? 'w-16' : ''} border-r border-gray-300 py-3 px-2.5 bg-white h-full box-border font-sans flex flex-col transition-all duration-300 relative overflow-hidden`}
        style={{
          width: isSidebarCollapsed ? '64px' : `${sidebarWidth}px`,
          minWidth: isSidebarCollapsed ? '64px' : `${MIN_SIDEBAR_WIDTH}px`,
          maxWidth: isSidebarCollapsed ? '64px' : `${MAX_SIDEBAR_WIDTH}px`
        }}
      >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
          // Reset to default width when expanding
          if (isSidebarCollapsed) {
            const savedWidth = localStorage.getItem('sidebarWidth');
            setSidebarWidth(savedWidth ? parseInt(savedWidth, 10) : DEFAULT_SIDEBAR_WIDTH);
          }
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className={`text-gray-600 text-sm transform transition-transform duration-200 ${
          isSidebarCollapsed ? 'rotate-180' : ''
        }`}>
          ◀
        </span>
      </button>
      
      <div className="pt-16">
        {!isSidebarCollapsed && (
          isEditingTitle ? (
            <div
              contentEditable
              suppressContentEditableWarning={true}
              data-element-type="title"
              onInput={(e) => setTitle(e.target.textContent)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTitleBlur();
                }
              }}
              className="text-4xl font-bold w-[90%] p-0.5 text-blue-700 border border-gray-300 mt-0 mb-3 font-inherit outline-none"
              style={{ fontSize: `${titleSize}px` }}
              ref={(el) => {
                if (el) {
                  // Restore saved formatting
                  restoreElementFormatting(el, 'title');
                  
                  if (isEditingTitle) {
                    el.focus();
                    // Set cursor at end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }
                }
              }}
            >
              {title}
            </div>
          ) : (
            <div className="text-center mb-3">
              <h1
                className="text-blue-700 cursor-pointer leading-tight font-inherit font-semibold transition-all duration-200 hover:text-blue-800 inline-block"
                style={{ fontSize: `${titleSize}px` }}
                onClick={handleTitleClick}
                onDoubleClick={() => setShowTitleSizeControl(true)}
                title="Double-click to adjust size"
              >
                {title}
              </h1>
              <InlineSizeControl 
                size={titleSize} 
                setSize={setTitleSize} 
                minSize={24} 
                maxSize={72} 
                show={showTitleSizeControl} 
                setShow={setShowTitleSizeControl} 
              />
            </div>
          )
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
            {isEditingClassesTitle ? (
              <div
                contentEditable
                suppressContentEditableWarning={true}
                data-element-type="classes-header"
                onInput={(e) => setClassesTitle(e.target.textContent)}
                onBlur={() => {
                  setIsEditingClassesTitle(false);
                  updateSettings({ classesTitle });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setIsEditingClassesTitle(false);
                    updateSettings({ classesTitle });
                  }
                }}
                className="text-yellow-500 font-medium normal-case bg-transparent border-b-2 border-yellow-500 outline-none min-w-0 max-w-full inline-block"
                style={{ fontSize: `${classesHeaderSize}px`, minWidth: `${classesTitle.length + 1}ch` }}
                ref={(el) => {
                  if (el) {
                    // Restore saved formatting
                    restoreElementFormatting(el, 'classes-header');
                    
                    if (isEditingClassesTitle) {
                      el.focus();
                      // Set cursor at end
                      const range = document.createRange();
                      const sel = window.getSelection();
                      range.selectNodeContents(el);
                      range.collapse(false);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                  }
                }}
              >
                {classesTitle}
              </div>
            ) : (
              <div className="flex items-center">
                <h4 
                  className="text-yellow-500 font-medium normal-case cursor-pointer transition-all duration-200 hover:text-yellow-600 inline-block"
                  style={{ fontSize: `${classesHeaderSize}px` }}
                  onClick={() => setIsEditingClassesTitle(true)}
                  onDoubleClick={() => setShowClassesHeaderSizeControl(true)}
                  title="Double-click to adjust size"
                >
                  {classesTitle}
                </h4>
                <InlineSizeControl 
                  size={classesHeaderSize} 
                  setSize={setClassesHeaderSize} 
                  minSize={14} 
                  maxSize={32} 
                  show={showClassesHeaderSizeControl} 
                  setShow={setShowClassesHeaderSizeControl} 
                />
              </div>
            )}
          </div>
        )}

        <ul className="list-none p-0 m-0 space-y-1">
          {classes.map((c) => (
            <li
              key={c.id}
              className={`transition-all duration-200 rounded-lg ${
                hoveredClassId === c.id ? "bg-gray-50" : ""
              }`}
              onMouseEnter={() => setHoveredClassId(c.id)}
              onMouseLeave={() => setHoveredClassId(null)}
            >
              {isSidebarCollapsed ? (
                <div
                  onClick={() => handleClassClick(c.id)}
                  className={`flex justify-center items-center py-2 px-2 cursor-pointer hover:bg-gray-100 transition-all duration-200 rounded-lg ${
                    selectedClass?.id === c.id ? "bg-blue-50 border border-blue-200" : ""
                  }`}
                  title={c.name}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 ${
                    selectedClass?.id === c.id ? "bg-blue-500" : "bg-gray-400"
                  }`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleClassClick(c.id)}
                  className={`flex justify-between items-center py-3 px-6 cursor-pointer hover:bg-gray-100 transition-all duration-200 rounded-lg group ${
                    selectedClass?.id === c.id ? "bg-blue-50 border border-blue-200 shadow-sm" : ""
                  }`}
                >
                  <div className="flex-1 flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      selectedClass?.id === c.id ? "bg-blue-500" : "bg-gray-300 group-hover:bg-gray-400"
                    }`}></div>
                    {editingClassId === c.id ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        data-element-type="class-name"
                        onInput={(e) => {
                          const updatedClasses = classes.map((cls) =>
                            cls.id === c.id ? { ...cls, name: e.target.textContent } : cls
                          );
                          setClasses(updatedClasses);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleClassBlur();
                          }
                        }}
                        onBlur={handleClassBlur}
                        className="flex-1 p-1 bg-transparent font-sans text-gray-800 outline-none border-b border-gray-300 focus:border-blue-500 rounded"
                        style={{ fontSize: `${classNameSize}px` }}
                        ref={(el) => {
                          if (el) {
                            // Restore saved formatting
                            restoreElementFormatting(el, 'class-name');
                            
                            if (editingClassId === c.id) {
                              el.focus();
                              // Set cursor at end
                              const range = document.createRange();
                              const sel = window.getSelection();
                              range.selectNodeContents(el);
                              range.collapse(false);
                              sel.removeAllRanges();
                              sel.addRange(range);
                            }
                          }
                        }}
                      >
                        {c.name}
                      </div>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassNameClick(e, c.id);
                        }}
                        className="flex-1"
                      >
                        <span 
                          className="font-medium text-gray-700 hover:text-gray-900 transition-colors duration-150 cursor-text"
                          style={{ fontSize: `${classNameSize}px` }}
                          onDoubleClick={() => setShowClassNameSizeControl(c.id)}
                          title="Double-click to adjust size"
                        >
                          {c.name}
                        </span>
                        {showClassNameSizeControl === c.id && (
                          <InlineSizeControl 
                            size={classNameSize} 
                            setSize={setClassNameSize} 
                            minSize={10} 
                            maxSize={24} 
                            show={true} 
                            setShow={() => setShowClassNameSizeControl(null)} 
                          />
                        )}
                      </span>
                    )}
                  </div>
                  {hoveredClassId === c.id && editingClassId !== c.id && (
                    <button
                      onClick={(e) => handleDeleteClass(e, c.id)}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Delete class"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        {(classes.length === 0 || isHoveringClassArea) && !isSidebarCollapsed && (
          <button
            onClick={handleAddClass}
            className="flex items-center mt-4 mb-4 p-3 mx-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer bg-transparent border border-blue-200 border-dashed rounded-lg transition-all duration-200 hover:border-blue-300 hover:shadow-sm group w-auto"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-200 mr-3">
              <span className="text-blue-600 text-sm font-medium">+</span>
            </div>
            <span className="text-sm font-medium">Add class</span>
          </button>
        )}
        {(classes.length === 0 || isHoveringClassArea) && isSidebarCollapsed && (
          <button
            onClick={handleAddClass}
            className="flex justify-center items-center mt-4 mb-4 p-2 mx-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer bg-transparent border border-blue-200 border-dashed rounded-lg transition-all duration-200 hover:border-blue-300 hover:shadow-sm"
            title="Add class"
          >
            <span className="text-blue-600 text-lg font-bold">+</span>
          </button>
        )}
      </div>

      <div className="px-2 mt-auto border-t pt-6 flex-shrink-0 max-h-96 overflow-y-auto">
        {/* Class Chatbot Button - Notion Style */}
        {!isSidebarCollapsed && (
          <div className="mb-3">
          <button
            onClick={() => {
              setShowChatbotPanel(!showChatbotPanel);
              setIsChatbotExpanded(!isChatbotExpanded);
            }}
            className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-all duration-200 group"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-base">🤖</span>
              <span className="text-gray-700 text-sm font-normal">
                Class Chatbot
              </span>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearChatHistory();
                }}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-all duration-200 px-1 opacity-0 group-hover:opacity-100"
                title="Clear conversation"
              >
                Clear
              </button>
            )}
          </button>
          
        </div>
        )}
        
        {/* Collapsed chatbot icon */}
        {isSidebarCollapsed && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={() => {
                setShowChatbotPanel(!showChatbotPanel);
                setIsChatbotExpanded(!isChatbotExpanded);
              }}
              className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
              title="Class Chatbot"
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
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-base">🎓</span>
              <span className="text-gray-700 text-sm font-normal">
                Canvas Sync
              </span>
            </div>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setShowCanvasSettings(true)}
              className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
              title="Canvas Sync"
            >
              <span className="text-gray-600 text-lg">🎓</span>
            </button>
          </div>
        )}
      </div>


      {/* Auth Controls - Enhanced */}
      <div className="px-2 mt-auto mb-8 flex-shrink-0">
        {isAuthenticated ? (
          !isSidebarCollapsed ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="mr-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingDisplayName ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      data-element-type="display-name"
                      onInput={(e) => setDisplayName(e.target.textContent)}
                      onBlur={() => setIsEditingDisplayName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          setIsEditingDisplayName(false);
                        }
                      }}
                      className="text-sm font-medium text-gray-800 bg-white border border-blue-300 rounded px-1 py-0.5 w-full outline-none"
                      style={{ fontSize: `${displayNameSize}px` }}
                      ref={(el) => {
                        if (el) {
                          // Restore saved formatting
                          restoreElementFormatting(el, 'display-name');
                          
                          if (isEditingDisplayName) {
                            el.focus();
                            // Set cursor at end
                            const range = document.createRange();
                            const sel = window.getSelection();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                          }
                        }
                      }}
                    >
                      {displayName}
                    </div>
                  ) : (
                    <p 
                      className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors duration-200"
                      onClick={() => setIsEditingDisplayName(true)}
                      title="Click to edit display name"
                    >
                      {displayName}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-white hover:bg-red-50 mt-2 text-gray-700 hover:text-red-600 py-2 px-3 rounded-lg w-full border border-gray-200 hover:border-red-200 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all duration-200 overflow-hidden"
                title={user?.email}
                onClick={() => setIsSidebarCollapsed(false)}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center text-white font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-10 h-8 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md border border-gray-200 hover:border-red-200 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md flex items-center justify-center"
                title="Sign out"
              >
                ⤴
              </button>
            </div>
          )
        ) : (
          !isSidebarCollapsed ? (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <button
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg w-full transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Login / Register
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setShowLogin(true)}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center"
                title="Login / Register"
              >
                👤
              </button>
            </div>
          )
        )}
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
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          title="Drag to resize sidebar"
        >
          <div className="absolute inset-y-0 -left-1 w-3 hover:bg-blue-500/10 transition-colors duration-200" />
        </div>
      )}

      {/* Floating Chatbot Panel */}
      {showChatbotPanel && (
        <div
          ref={chatbotRef}
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 flex flex-col"
          style={{
            width: '400px',
            height: `${chatbotPanelHeight}px`,
            maxHeight: '600px',
            minHeight: '200px',
            left: `${chatbotPosition.x}px`,
            bottom: `${chatbotPosition.y}px`
          }}
        >
          {/* Resize Handle */}
          <div
            className="h-1 bg-gray-200 hover:bg-gray-300 cursor-ns-resize flex items-center justify-center rounded-t-lg"
            onMouseDown={() => setIsResizingChatbot(true)}
          >
            <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
          </div>

          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move"
            onMouseDown={(e) => {
              setIsDraggingChatbot(true);
              dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startPosX: chatbotPosition.x,
                startPosY: chatbotPosition.y
              };
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-base">🤖</span>
              <span className="text-gray-700 text-sm font-medium">Class Chatbot</span>
            </div>
            <div className="flex items-center space-x-2" onMouseDown={(e) => e.stopPropagation()}>
              {chatHistory.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-all duration-200 px-2 py-1 rounded hover:bg-gray-200"
                  title="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowChatbotPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded hover:bg-gray-200"
                title="Close chatbot"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-sm max-w-[85%] break-words transition-all duration-200 ${msg.role === 'user'
                    ? 'bg-blue-500 text-white self-end ml-auto'
                    : 'bg-gray-200 text-gray-800 self-start mr-auto'
                  }`}
              >
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-gray-200 text-gray-800 p-2 rounded-lg text-sm max-w-[85%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <form onSubmit={handleAskChatbot} className="flex items-end gap-2">
              <div
                contentEditable
                suppressContentEditableWarning={true}
                data-element-type="chat-input"
                onInput={(e) => setChatQuery(e.target.textContent)}
                data-placeholder="Ask a question..."
                className={`flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!chatQuery.trim() ? 'empty-placeholder' : ''}`}
                style={{ 
                  minHeight: '38px',
                  maxHeight: '90px',
                  overflowY: 'auto',
                  fontSize: `${fontSize}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskChatbot(e);
                  }
                }}
              >
                {chatQuery}
              </div>
              <button
                type="submit"
                disabled={isChatLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ height: '38px', width: '50px' }}
              >
                {isChatLoading ? '...' : '➤'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
