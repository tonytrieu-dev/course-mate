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
    if (!chatQuery.trim() || isChatLoading) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatQuery }];
    setChatHistory(newHistory);
    setChatQuery(''); // Clear input after sending
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
          query: chatQuery,
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

  return (
    <div className="w-64 border-r border-gray-300 py-3 px-2.5 bg-white h-full box-border font-sans flex flex-col">
      <div className="pt-16">
        {isEditingTitle ? (
          <input
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            autoFocus
            className="text-4xl font-bold w-[90%] p-0.5 text-blue-700 border border-gray-300 mt-0 mb-3 font-inherit"
          />
        ) : (
          <h1
            className="text-blue-700 cursor-pointer text-5xl mb-3 leading-tight font-inherit font-semibold text-center transition-all duration-200 hover:text-blue-800"
            onClick={handleTitleClick}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Empty space to push content down */}
      <div className="mt-8"></div>

      <div
        className="relative flex-1"
        onMouseEnter={() => setIsHoveringClassArea(true)}
        onMouseLeave={() => setIsHoveringClassArea(false)}
      >
        <div className="mb-4 px-8">
          {isEditingClassesTitle ? (
            <input
              value={classesTitle}
              onChange={(e) => setClassesTitle(e.target.value)}
              onBlur={() => {
                setIsEditingClassesTitle(false);
                updateSettings({ classesTitle });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingClassesTitle(false);
                  updateSettings({ classesTitle });
                }
              }}
              autoFocus
              className="text-yellow-500 font-medium text-xl normal-case bg-transparent border-b-2 border-yellow-500 outline-none min-w-0 max-w-full"
              style={{ width: `${classesTitle.length + 1}ch` }}
            />
          ) : (
            <h4 
              className="text-yellow-500 font-medium text-xl normal-case cursor-pointer transition-all duration-200 hover:text-yellow-600 inline-block"
              onClick={() => setIsEditingClassesTitle(true)}
            >
              {classesTitle}
            </h4>
          )}
        </div>

        <ul className="list-none p-0 m-0">
          {classes.map((c) => (
            <li
              key={c.id}
              className={`mb-1 transition-all duration-200 ${
                hoveredClassId === c.id ? "bg-gray-50" : ""
              }`}
              onMouseEnter={() => setHoveredClassId(c.id)}
              onMouseLeave={() => setHoveredClassId(null)}
            >
              <div
                onClick={() => handleClassClick(c.id)}
                className={`flex justify-between items-center py-2 px-8 cursor-pointer hover:bg-gray-100 transition-all duration-200 ${
                  selectedClass?.id === c.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex-1 flex items-center">
                  {editingClassId === c.id ? (
                    <input
                      value={c.name}
                      onChange={(e) => handleClassChange(e, c.id)}
                      onKeyDown={(e) => handleClassKeyDown(e, c.id)}
                      onBlur={handleClassBlur}
                      autoFocus
                      className="flex-1 p-0.5 bg-transparent font-sans text-base text-gray-800 outline-none border-b border-gray-300 focus:border-blue-500"
                    />
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassNameClick(e, c.id);
                      }}
                    >
                      <span className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-150">{c.name}</span>
                    </span>
                  )}
                </div>
                {hoveredClassId === c.id && editingClassId !== c.id && (
                  <button
                    onClick={(e) => handleDeleteClass(e, c.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {(classes.length === 0 || isHoveringClassArea) && (
          <button
            onClick={handleAddClass}
            className="flex items-center mt-4 mb-4 p-2 pl-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer bg-transparent border-none rounded transition-all duration-200"
          >
            <span className="mr-1 text-lg">+</span>
            <span>Add class</span>
          </button>
        )}
      </div>

      <div className="px-2 mt-auto border-t pt-6">
        <div className="mb-3 relative group"> {/* CLAUDE DON'T add justify-between or center-items into this line or you'll uncenter the class chatbot text */ }
          <h4 className="font-medium text-center text-black-700 text-base uppercase tracking-wider">
            Class Chatbot
          </h4>
          {chatHistory.length > 0 && (
            <button
              onClick={clearChatHistory}
              className="absolute top-0 right-0 text-xs text-gray-400 hover:text-gray-600 transition-all duration-200 px-2 py-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100"
              title="Clear conversation"
            >
              🗑️
            </button>
          )}
        </div>
        <div className="bg-gray-50 p-3 rounded-md overflow-y-auto flex flex-col space-y-2 mb-2 chat-scrollbar h-48">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg text-sm max-w-[85%] break-words transition-all duration-200 ${msg.role === 'user'
                  ? 'bg-blue-500 text-white self-end shadow-sm'
                  : 'bg-gray-200 text-gray-800 self-start'
                }`}
            >
              {msg.content}
            </div>
          ))}
          {isChatLoading && (
            <div className="bg-gray-200 text-gray-800 self-start p-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleAskChatbot} className="flex items-end gap-[1%]">
          <textarea
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm shadow-sm resize-none overflow-hidden leading-normal focus:outline-none"
            disabled={isChatLoading}
            rows={Math.min(Math.max(Math.ceil(chatQuery.length / 35), 1), 4)}
            style={{ 
              minHeight: '38px',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskChatbot(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isChatLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ height: '38px' }}
          >
            {isChatLoading ? '...' : '➤'}
          </button>
        </form>
      </div>

      {/* Canvas Integration Button */}
      <div className="px-2 mt-6 mb-4">
        <button
          onClick={() => setShowCanvasSettings(true)}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg w-full flex items-center justify-center transition-all duration-200 hover:shadow-sm"
        >
          <span className="mr-2">🎓</span>
          Sync Canvas Calendar
        </button>
      </div>

      {/* Auth Controls - Enhanced */}
      <div className="px-2 mt-auto mb-8">
        {isAuthenticated ? (
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-white hover:bg-red-100 mt-2 text-black-700 hover:text-red-600 py-2 px-3 rounded-lg w-full border border-gray-200 transition-all duration-200 text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              Login / Register
            </button>
          </div>
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
  );
};

export default Sidebar;
