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

/**
 * Custom hook for managing AI chatbot functionality in ScheduleBud.
 * 
 * This hook provides comprehensive chatbot capabilities including:
 * - Real-time conversation management with chat history
 * - Integration with Google Gemini AI via Supabase Edge Functions
 * - Smart mention system for referencing classes (@ClassName)
 * - Context-aware responses using document embeddings
 * - Optimized performance with debounced input handling
 * - Automatic scrolling and UI state management
 * 
 * The chatbot can answer questions about:
 * - Academic tasks and assignments
 * - Study strategies and time management  
 * - Class-specific content from uploaded syllabi
 * - General productivity and organization tips
 * 
 * @param props - Configuration object for the chatbot hook
 * @param props.selectedClass - Currently selected class for context
 * @param props.classes - Array of user's classes for mention functionality
 * 
 * @returns Object containing:
 * - Chat state variables (chatQuery, chatHistory, isChatLoading)
 * - Event handlers for user interaction
 * - Utility functions for chat management
 * - Mention system integration
 * 
 * @example
 * ```tsx
 * const {
 *   chatQuery,
 *   chatHistory, 
 *   isChatLoading,
 *   handleAskChatbot,
 *   handleInputChange,
 *   clearChatHistory,
 *   mentionHook
 * } = useChatbot({
 *   selectedClass: 'CS101',
 *   classes: userClasses
 * });
 * 
 * // Use in JSX
 * <form onSubmit={handleAskChatbot}>
 *   <div onInput={handleInputChange} contentEditable>
 *     {chatQuery}
 *   </div>
 * </form>
 * ```
 */
export const useChatbot = ({ selectedClass, classes }: UseChatbotProps): UseChatbotReturn => {
  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [currentCursor, setCurrentCursor] = useState<number>(0);
  const [isProcessingMention, setIsProcessingMention] = useState<boolean>(false);
  
  const chatContentRef = useRef<HTMLDivElement>(null);

  // Initialize mention functionality - with proper class loading validation
  const mentionHook = useChatbotMentions({
    classes,
    onMentionedClassesChange: (mentionedClasses) => {
      // Only log if there are actual changes to avoid startup spam
      if (mentionedClasses.length > 0) {
        logger.info('Classes mentioned in chat', {
          count: mentionedClasses.length,
          classes: mentionedClasses.map(c => c.name).join(', ')
        });
      }
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

    // Parse @mentions in the query - with safety checks for class loading
    const mentionResult = mentionHook.parseMentions(queryText);
    let cleanQuery = mentionResult.cleanText;
    const mentionedClasses = mentionResult.mentions.map(m => m.matchedClass).filter(Boolean) as ClassWithRelations[];
    
    // Validate that we got a proper clean query (not empty or just punctuation)
    if (!cleanQuery.trim() || cleanQuery.trim().length < 2) {
      logger.warn('Clean query is too short after mention parsing, using fallback', {
        originalQuery: queryText,
        cleanQuery,
        classesLoaded: classes?.length || 0,
        mentionResult
      });
      
      // Fallback strategy:
      // 1. If classes aren't loaded yet, use original query text (prevents "?" warmup issue)
      // 2. If classes are loaded but parsing failed, try simple regex strip
      if (!classes || classes.length === 0) {
        cleanQuery = queryText; // Use original during warmup
        logger.info('Using original query during class loading warmup', {
          originalQuery: queryText
        });
      } else {
        // Try simple regex-based mention removal as fallback
        cleanQuery = queryText.replace(/@[A-Za-z0-9_-]+(?=\s|$|[.!?,:;])/g, '').replace(/\s+/g, ' ').trim();
        logger.info('Using regex-based fallback mention removal', {
          originalQuery: queryText,
          fallbackQuery: cleanQuery
        });
      }
    }

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