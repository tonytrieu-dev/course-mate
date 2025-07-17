import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const CHAT_HISTORY_LIMIT = 6;

const ChatbotPanel = ({ 
  selectedClass, 
  show, 
  onClose,
  position,
  onPositionChange,
  height,
  onHeightChange,
  fontSize 
}) => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatbotRef = useRef(null);
  const chatContentRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Function to smoothly scroll chat to bottom
  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY - 20;
        if (newHeight >= 200 && newHeight <= 600) {
          onHeightChange(newHeight);
        }
      } else if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        const newX = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.startPosX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - height, dragRef.current.startPosY - deltaY));
        
        onPositionChange({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDragging(false);
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      if (isResizing) {
        document.body.style.cursor = 'ns-resize';
      } else if (isDragging) {
        document.body.style.cursor = 'move';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, isDragging, height, onHeightChange, onPositionChange]);

  const handleAskChatbot = async (e) => {
    e.preventDefault();
    const queryText = typeof chatQuery === 'string' ? chatQuery : e.target.textContent || '';
    if (!queryText.trim() || isChatLoading) return;

    const newHistory = [...chatHistory, { role: 'user', content: queryText }];
    setChatHistory(newHistory);
    setChatQuery('');
    
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
      const { data, error } = await supabase.functions.invoke('ask-chatbot', {
        body: {
          query: queryText,
          classId: selectedClass.id,
          conversationHistory: newHistory.slice(0, -1).slice(-CHAT_HISTORY_LIMIT),
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        setChatHistory([...newHistory, { role: 'assistant', content: `Error: ${error.message || 'Something went wrong.'}` }]);
      } else {
        setChatHistory([...newHistory, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      console.error('Caught error asking chatbot:', err);
      let errorMessage = 'Sorry, something went wrong.';
      if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setChatHistory([...newHistory, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  if (!show) return null;

  return (
    <div
      ref={chatbotRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 flex flex-col"
      style={{
        width: '400px',
        height: `${height}px`,
        maxHeight: '600px',
        minHeight: '200px',
        left: `${position.x}px`,
        bottom: `${position.y}px`
      }}
    >
      {/* Resize Handle */}
      <div
        className="h-1 bg-gray-200 hover:bg-gray-300 cursor-ns-resize flex items-center justify-center rounded-t-lg"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: position.x,
            startPosY: position.y
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded hover:bg-gray-200"
            title="Close chatbot"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div 
        ref={chatContentRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
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
            onInput={(e) => {
              setChatQuery(e.target.textContent);
              // Auto-scroll to bottom when user starts typing
              scrollToBottom();
            }}
            data-placeholder="Ask a question..."
            className={`flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!chatQuery.trim() ? 'empty-placeholder' : ''}`}
            style={{ 
              minHeight: '38px',
              maxHeight: '90px',
              overflowY: 'auto',
              fontSize: `${fontSize}px`,
              direction: 'ltr',
              textAlign: 'left'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskChatbot(e);
              }
            }}
          ></div>
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
  );
};

export default ChatbotPanel;