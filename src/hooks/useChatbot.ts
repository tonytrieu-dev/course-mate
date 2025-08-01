import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClassWithRelations } from '../types/database';
import { supabase } from '../services/supabaseClient';
import { useChatbotMentions } from './useChatbotMentions';
import { logger } from '../utils/logger';

const CHAT_HISTORY_LIMIT = 8;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatbotProps {
  selectedClass: ClassWithRelations | null;
  classes: ClassWithRelations[];
}

interface UseChatbotReturn {
  chatQuery: string;
  setChatQuery: (query: string) => void;
  chatHistory: ChatMessage[];
  setChatHistory: (history: ChatMessage[]) => void;
  isChatLoading: boolean;
  chatContentRef: React.RefObject<HTMLDivElement | null>;
  handleInputChange: (e: React.FormEvent<HTMLDivElement>) => void;
  handleAskChatbot: (e: React.FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  clearChatHistory: () => void;
  scrollToBottom: () => void;
  // Mention functionality
  mentionHook: ReturnType<typeof useChatbotMentions>;
  currentCursor: number;
  setCursorPosition: (position: number) => void;
  setIsProcessingMention: (processing: boolean) => void;
}

export const useChatbot = ({ selectedClass, classes }: UseChatbotProps): UseChatbotReturn => {
  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [currentCursor, setCurrentCursor] = useState<number>(0);
  const [isProcessingMention, setIsProcessingMention] = useState<boolean>(false);
  
  const chatContentRef = useRef<HTMLDivElement>(null);

  // Initialize mention functionality
  const mentionHook = useChatbotMentions({
    classes,
    onMentionedClassesChange: (mentionedClasses) => {
      logger.debug('Mentioned classes changed', {
        count: mentionedClasses.length,
        classes: mentionedClasses.map(c => c.name)
      });
    }
  });
  
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
    const text = target.textContent || '';
    setChatQuery(text);
    
    // Skip cursor processing if we're currently processing a mention insertion
    if (isProcessingMention) {
      return;
    }
    
    // Get cursor position more reliably for contentEditable
    const selection = window.getSelection();
    let cursorPosition = 0;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(target);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorPosition = preCaretRange.toString().length;
    }
    
    setCurrentCursor(cursorPosition);
    
    // Handle @mention parsing and autocomplete
    mentionHook.handleInputForMentions(text, cursorPosition);
    
    // Auto-scroll to bottom when user starts typing
    scrollToBottom();
  }, [scrollToBottom, mentionHook, isProcessingMention]);

  const handleAskChatbot = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = typeof chatQuery === 'string' ? chatQuery : (e.target as HTMLFormElement).textContent || '';
    if (!queryText.trim() || isChatLoading) return;

    // Parse @mentions in the query
    const mentionResult = mentionHook.parseMentions(queryText);
    const cleanQuery = mentionResult.cleanText;
    const mentionedClasses = mentionResult.mentions.map(m => m.matchedClass).filter(Boolean) as ClassWithRelations[];

    // Determine which classes to query against
    let classesToQuery: ClassWithRelations[] = [];
    let contextMessage = '';

    if (mentionedClasses.length > 0) {
      // Use mentioned classes
      classesToQuery = mentionedClasses;
      contextMessage = mentionedClasses.length === 1 
        ? `Asking about ${mentionedClasses[0].name}` 
        : `Asking about ${mentionedClasses.length} classes: ${mentionedClasses.map(c => c.name).join(', ')}`;
    } else if (selectedClass) {
      // Fallback to selected class
      classesToQuery = [selectedClass];
    } else {
      // No class context available
      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: queryText }];
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: 'Please select a class or use @ClassName to specify which class to ask about.' },
      ]);
      setIsChatLoading(false);
      return;
    }

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: queryText }];
    setChatHistory(newHistory);
    setChatQuery('');
    
    const chatInput = document.querySelector('[data-placeholder="Ask a question..."]') as HTMLElement;
    if (chatInput) {
      chatInput.textContent = '';
    }
    setIsChatLoading(true);

    // Clear mentions and autocomplete
    mentionHook.hideAutocomplete();

    try {
      logger.debug('Sending chatbot request', {
        query: cleanQuery,
        classIds: classesToQuery.map(c => c.id),
        contextMessage,
        originalQuery: queryText
      });

      const { data, error } = await supabase.functions.invoke('ask-chatbot', {
        body: {
          query: cleanQuery,
          classIds: classesToQuery.map(c => c.id), // Send multiple class IDs
          classId: classesToQuery[0]?.id, // Keep for backward compatibility
          conversationHistory: newHistory.slice(0, -1).slice(-CHAT_HISTORY_LIMIT),
          mentionContext: {
            hasMentions: mentionedClasses.length > 0,
            mentionedClasses: mentionedClasses.map(c => ({ id: c.id, name: c.name })),
            contextMessage
          }
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
      handleAskChatbot(e as unknown as React.FormEvent);
    }
  }, [handleAskChatbot]);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    mentionHook.resetMentionState();
  }, [mentionHook]);

  const setCursorPosition = useCallback((position: number) => {
    setCurrentCursor(position);
  }, []);

  // Auto-scroll when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isChatLoading, scrollToBottom]);

  return {
    chatQuery,
    setChatQuery,
    chatHistory,
    setChatHistory,
    isChatLoading,
    chatContentRef,
    handleInputChange,
    handleAskChatbot,
    handleKeyDown,
    clearChatHistory,
    scrollToBottom,
    // Mention functionality
    mentionHook,
    currentCursor,
    setCursorPosition,
    setIsProcessingMention,
  };
};