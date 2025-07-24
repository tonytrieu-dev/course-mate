import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ClassWithRelations } from '../types/database';
import { supabase } from '../services/supabaseClient';

const CHAT_HISTORY_LIMIT = 6;

interface Position {
  x: number;
  y: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotPanelProps {
  selectedClass: ClassWithRelations | null;
  show: boolean;
  onClose: () => void;
  position: Position;
  onPositionChange: (position: Position) => void;
  height: number;
  onHeightChange: (height: number) => void;
  fontSize: number;
}

interface DragRef {
  startX: number;
  startY: number;
  startPosX: number;
  startPosY: number;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ 
  selectedClass, 
  show, 
  onClose,
  position,
  onPositionChange,
  height,
  onHeightChange,
  fontSize 
}) => {
  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const chatbotRef = useRef<HTMLDivElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragRef>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  
  // Function to smoothly scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);
  
  // Memoize input handlers for better performance
  const handleInputChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setChatQuery(target.textContent || '');
    // Auto-scroll to bottom when user starts typing
    scrollToBottom();
  }, [scrollToBottom]);

  const handleAskChatbot = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = typeof chatQuery === 'string' ? chatQuery : (e.target as HTMLFormElement).textContent || '';
    if (!queryText.trim() || isChatLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: queryText }];
    setChatHistory(newHistory);
    setChatQuery('');
    
    const chatInput = document.querySelector('[data-placeholder="Ask a question..."]') as HTMLElement;
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
    } catch (err: unknown) {
      console.error('Caught error asking chatbot:', err);
      let errorMessage = 'Sorry, something went wrong.';
      if (err instanceof Error && err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setChatHistory([...newHistory, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatHistory, selectedClass, chatQuery, isChatLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Call handleAskChatbot with the keyboard event cast as FormEvent
      handleAskChatbot(e as unknown as React.FormEvent);
    }
  }, [handleAskChatbot]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
  }, [position]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Memoize chat messages to prevent re-creation
  const chatMessages = useMemo(() => {
    return chatHistory.map((msg, index) => (
      <div
        key={index}
        className={`p-2 rounded-lg text-sm max-w-[85%] break-words transition-all duration-200 ${msg.role === 'user'
            ? 'bg-blue-500 text-white self-end ml-auto'
            : 'bg-gray-200 text-gray-800 self-start mr-auto'
          }`}
      >
        {msg.content}
      </div>
    ));
  }, [chatHistory]);

  // Auto-scroll when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading, scrollToBottom]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  if (!show) return null;

  return (
    <div
      ref={chatbotRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 flex flex-col"
      role="dialog"
      aria-label="Class Chatbot"
      aria-modal="true"
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
        onMouseDown={handleResizeStart}
        role="separator"
        aria-label="Resize panel"
        aria-orientation="horizontal"
        tabIndex={0}
      >
        <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-move"
        onMouseDown={handleDragStart}
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
              type="button"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded hover:bg-gray-200"
            title="Close chatbot"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div 
        ref={chatContentRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        role="log"
        aria-label="Chat history"
        aria-live="polite"
      >
        {chatMessages}
        {isChatLoading && (
          <div className="bg-gray-200 text-gray-800 p-2 rounded-lg text-sm max-w-[85%] animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-gray-500 text-xs">Thinking...</span>
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
            onInput={handleInputChange}
            data-placeholder="Ask a question..."
            role="textbox"
            aria-label="Chat message input"
            aria-multiline="true"
            className={`flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${!chatQuery.trim() ? 'empty-placeholder' : ''}`}
            style={{ 
              minHeight: '38px',
              maxHeight: '90px',
              overflowY: 'auto',
              fontSize: `${fontSize}px`,
              direction: 'ltr',
              textAlign: 'left'
            }}
            onKeyDown={handleKeyDown}
          ></div>
          <button
            type="submit"
            disabled={isChatLoading}
            aria-label="Send message"
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

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ChatbotPanel);