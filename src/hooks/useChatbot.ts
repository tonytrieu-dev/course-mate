import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClassWithRelations } from '../types/database';
import { supabase } from '../services/supabaseClient';

const CHAT_HISTORY_LIMIT = 8;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatbotProps {
  selectedClass: ClassWithRelations | null;
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
}

export const useChatbot = ({ selectedClass }: UseChatbotProps): UseChatbotReturn => {
  const [chatQuery, setChatQuery] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  const chatContentRef = useRef<HTMLDivElement>(null);
  
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
      handleAskChatbot(e as unknown as React.FormEvent);
    }
  }, [handleAskChatbot]);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
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
  };
};