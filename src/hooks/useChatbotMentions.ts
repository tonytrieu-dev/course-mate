import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ClassWithRelations } from '../types/database';
import { ChatbotMentionParser, type MentionMatch, type MentionParseResult } from '../utils/chatbotMentions';
import { logger } from '../utils/logger';

export interface AutocompleteState {
  isVisible: boolean;
  suggestions: ClassWithRelations[];
  selectedIndex: number;
  searchTerm: string;
  position: { top: number; left: number };
}

export interface MentionState {
  mentions: MentionMatch[];
  referencedClasses: ClassWithRelations[];
  hasValidMentions: boolean;
}

interface UseChatbotMentionsProps {
  classes: ClassWithRelations[];
  onMentionedClassesChange?: (classes: ClassWithRelations[]) => void;
}

interface UseChatbotMentionsReturn {
  // Mention parsing
  parseMentions: (text: string) => MentionParseResult;
  mentionState: MentionState;
  
  // Autocomplete
  autocompleteState: AutocompleteState;
  showAutocomplete: (searchTerm: string, position: { top: number; left: number }) => void;
  hideAutocomplete: () => void;
  selectSuggestion: (index: number) => ClassWithRelations | null;
  navigateAutocomplete: (direction: 'up' | 'down') => void;
  
  // Input handling
  handleInputForMentions: (text: string, cursorPosition: number) => void;
  insertMention: (classObj: ClassWithRelations, text: string, cursorPosition: number) => string;
  setSkipNextParsing: (skip: boolean) => void;
  
  // Utility
  getMentionContext: () => string[];
  resetMentionState: () => void;
}

export const useChatbotMentions = ({
  classes,
  onMentionedClassesChange
}: UseChatbotMentionsProps): UseChatbotMentionsReturn => {
  
  // Initialize mention parser - ensure classes are loaded
  const mentionParser = useMemo(() => {
    return new ChatbotMentionParser(classes || []);
  }, [classes]);
  
  // State for mentions
  const [mentionState, setMentionState] = useState<MentionState>({
    mentions: [],
    referencedClasses: [],
    hasValidMentions: false
  });

  // State for autocomplete
  const [autocompleteState, setAutocompleteState] = useState<AutocompleteState>({
    isVisible: false,
    suggestions: [],
    selectedIndex: 0,
    searchTerm: '',
    position: { top: 0, left: 0 }
  });

  // Flag to temporarily disable mention parsing after insertion
  const [skipNextParsing, setSkipNextParsing] = useState(false);

  // Update parser when classes change and warm it up
  useEffect(() => {
    mentionParser.updateClasses(classes);
    
    // Warm up the parser when classes are loaded to prevent cold start issues
    if (classes && classes.length > 0) {
      // Test parse a simple @mention to ensure everything is initialized
      try {
        mentionParser.parseText('@test warmup');
      } catch (error) {
        logger.warn('Failed to warm up mention parser', { error });
      }
    }
  }, [classes, mentionParser]);

  // Notify parent when mentioned classes change
  useEffect(() => {
    if (onMentionedClassesChange) {
      onMentionedClassesChange(mentionState.referencedClasses);
    }
  }, [mentionState.referencedClasses, onMentionedClassesChange]);

  /**
   * Parse text for @mentions and update state
   */
  const parseMentions = useCallback((text: string): MentionParseResult => {
    // Early return if no classes are loaded yet
    if (!classes || classes.length === 0) {
      logger.debug('Skipping mention parsing - no classes loaded yet', {
        text: text.substring(0, 50),
        classesCount: classes?.length || 0
      });
      
      // Return a safe result that preserves the original text
      const fallbackResult: MentionParseResult = {
        mentions: [],
        hasValidMentions: false,
        cleanText: text.trim()
      };
      
      // Still update state to clear any previous mentions
      setMentionState({
        mentions: [],
        referencedClasses: [],
        hasValidMentions: false
      });
      
      return fallbackResult;
    }

    const result = mentionParser.parseText(text);
    
    // Update mention state
    const referencedClasses = result.mentions
      .map(m => m.matchedClass)
      .filter(Boolean) as ClassWithRelations[];
    
    setMentionState({
      mentions: result.mentions,
      referencedClasses,
      hasValidMentions: result.hasValidMentions
    });

    logger.debug('Mentions parsed', {
      text: text.substring(0, 50),
      mentionsFound: result.mentions.length,
      validMentions: result.hasValidMentions,
      referencedClasses: referencedClasses.map(c => c.name),
      classesCount: classes.length
    });

    return result;
  }, [mentionParser, classes]);

  /**
   * Show autocomplete dropdown
   */
  const showAutocomplete = useCallback((searchTerm: string, position: { top: number; left: number }) => {
    // Check if we have classes available before getting suggestions
    if (!classes || classes.length === 0) {
      logger.debug('No classes available for autocomplete', {
        searchTerm,
        classesCount: classes?.length || 0
      });
      return;
    }

    const suggestions = mentionParser.getAutocompleteSuggestions(searchTerm, 6);
    
    setAutocompleteState({
      isVisible: suggestions.length > 0,
      suggestions,
      selectedIndex: 0,
      searchTerm,
      position
    });

    logger.debug('Autocomplete shown', {
      searchTerm,
      suggestionsCount: suggestions.length,
      position,
      classesAvailable: classes.length,
      isVisible: suggestions.length > 0
    });
  }, [mentionParser, classes]);

  /**
   * Hide autocomplete dropdown
   */
  const hideAutocomplete = useCallback(() => {
    setAutocompleteState(prev => ({
      ...prev,
      isVisible: false,
      selectedIndex: 0
    }));
  }, []);

  /**
   * Select a suggestion from autocomplete
   */
  const selectSuggestion = useCallback((index: number): ClassWithRelations | null => {
    if (index >= 0 && index < autocompleteState.suggestions.length) {
      const selectedClass = autocompleteState.suggestions[index];
      hideAutocomplete();
      return selectedClass;
    }
    return null;
  }, [autocompleteState.suggestions, hideAutocomplete]);

  /**
   * Navigate autocomplete with arrow keys
   */
  const navigateAutocomplete = useCallback((direction: 'up' | 'down') => {
    if (!autocompleteState.isVisible) return;

    setAutocompleteState(prev => {
      const maxIndex = prev.suggestions.length - 1;
      let newIndex: number;

      if (direction === 'up') {
        newIndex = prev.selectedIndex > 0 ? prev.selectedIndex - 1 : maxIndex;
      } else {
        newIndex = prev.selectedIndex < maxIndex ? prev.selectedIndex + 1 : 0;
      }

      return {
        ...prev,
        selectedIndex: newIndex
      };
    });
  }, [autocompleteState.isVisible]);

  /**
   * Handle input text for @mention detection and autocomplete
   */
  const handleInputForMentions = useCallback((text: string, cursorPosition: number) => {
    // Skip parsing if we just inserted a mention to avoid cursor jumping
    if (skipNextParsing) {
      setSkipNextParsing(false);
      // Still parse mentions for final state but don't show autocomplete
      parseMentions(text);
      return;
    }
    
    // Check if we're currently typing an @mention
    const beforeCursor = text.substring(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const afterAt = beforeCursor.substring(atIndex + 1);
      
      // Check if we're still in the same word (no spaces after @)
      if (!afterAt.includes(' ') && afterAt.length <= 20) {
        // We're typing an @mention - show autocomplete
        logger.debug('Showing autocomplete for mention typing', {
          afterAt,
          length: afterAt.length,
          atIndex,
          cursorPosition
        });
        showAutocomplete(afterAt, { top: 0, left: 0 }); // Position will be calculated by UI
        return;
      } else {
        logger.debug('Not showing autocomplete - invalid mention pattern', {
          afterAt,
          includesSpace: afterAt.includes(' '),
          length: afterAt.length
        });
      }
    } else {
      logger.debug('No @ symbol found before cursor', {
        beforeCursor: beforeCursor.slice(-10),
        cursorPosition
      });
    }
    
    // Not typing @mention, hide autocomplete
    hideAutocomplete();
    
    // Parse any completed @mentions in the text
    parseMentions(text);
  }, [showAutocomplete, hideAutocomplete, parseMentions, skipNextParsing]);

  /**
   * Insert a class mention into text at cursor position
   */
  const insertMention = useCallback((classObj: ClassWithRelations, text: string, cursorPosition: number): string => {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    
    // Find the @ symbol that we're completing
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      // Replace from @ to cursor with the class mention
      const beforeAt = text.substring(0, atIndex);
      const mention = `@${classObj.name}`;
      const newText = beforeAt + mention + ' ' + afterCursor;
      
      logger.debug('Mention inserted', {
        className: classObj.name,
        atIndex,
        cursorPosition,
        newText: newText.substring(0, 50)
      });
      
      return newText;
    }
    
    // Fallback: append mention at cursor
    return beforeCursor + `@${classObj.name} ` + afterCursor;
  }, []);

  /**
   * Get context information for mentioned classes
   */
  const getMentionContext = useCallback((): string[] => {
    return mentionState.referencedClasses.map(classObj => classObj.id);
  }, [mentionState.referencedClasses]);

  /**
   * Reset mention state (useful when clearing chat)
   */
  const resetMentionState = useCallback(() => {
    setMentionState({
      mentions: [],
      referencedClasses: [],
      hasValidMentions: false
    });
    hideAutocomplete();
  }, [hideAutocomplete]);

  return {
    // Mention parsing
    parseMentions,
    mentionState,
    
    // Autocomplete
    autocompleteState,
    showAutocomplete,
    hideAutocomplete,
    selectSuggestion,
    navigateAutocomplete,
    
    // Input handling
    handleInputForMentions,
    insertMention,
    setSkipNextParsing,
    
    // Utility
    getMentionContext,
    resetMentionState
  };
};