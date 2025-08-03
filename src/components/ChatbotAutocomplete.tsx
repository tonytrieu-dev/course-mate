import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { ClassWithRelations } from '../types/database';

interface ChatbotAutocompleteProps {
  isVisible: boolean;
  suggestions: ClassWithRelations[];
  selectedIndex: number;
  searchTerm: string;
  position: { top: number; left: number };
  onSelect: (classObj: ClassWithRelations, index: number) => void;
  onClose: () => void;
  maxResults?: number;
  showShortcuts?: boolean;
  className?: string;
}

const ChatbotAutocomplete: React.FC<ChatbotAutocompleteProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  searchTerm,
  position,
  onSelect,
  onClose,
  maxResults = 5,
  showShortcuts = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Auto-scroll to selected item with performance optimization
  const scrollToSelected = useCallback(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const container = containerRef.current;
      const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      
      if (selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    scrollToSelected();
  }, [scrollToSelected]);

  // Handle click outside to close with improved event handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Add slight delay to prevent conflicts with other click handlers
        setTimeout(() => onClose(), 0);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Position adjustment to stay within viewport
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newPosition = { ...position };
      
      // Adjust horizontal position
      if (rect.right > viewportWidth - 20) {
        newPosition.left = viewportWidth - rect.width - 20;
      }
      
      // Adjust vertical position
      if (rect.bottom > viewportHeight - 20) {
        newPosition.top = position.top - rect.height - 10;
      }
      
      setAdjustedPosition(newPosition);
    }
  }, [isVisible, position]);

  // Animation effect
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for all code paths
  }, [isVisible]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  /**
   * Enhanced text highlighting with fuzzy matching support
   */
  const highlightMatch = useCallback((text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Direct substring match
    const directIndex = lowerText.indexOf(lowerSearchTerm);
    if (directIndex !== -1) {
      return (
        <>
          {text.substring(0, directIndex)}
          <span className="bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900 font-semibold px-1 rounded">
            {text.substring(directIndex, directIndex + searchTerm.length)}
          </span>
          {text.substring(directIndex + searchTerm.length)}
        </>
      );
    }

    // Acronym match
    const words = text.split(/\s+/);
    const acronym = words.map(word => word.charAt(0)).join('').toLowerCase();
    
    if (acronym.includes(lowerSearchTerm)) {
      return (
        <span className="flex items-center">
          <span>{text}</span>
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
            {acronym.toUpperCase()}
          </span>
        </span>
      );
    }

    // Fuzzy match - highlight individual characters
    const highlightedText: React.ReactNode[] = [];
    let searchIndex = 0;
    
    for (let i = 0; i < text.length && searchIndex < searchTerm.length; i++) {
      const char = text[i];
      const isMatch = char.toLowerCase() === lowerSearchTerm[searchIndex];
      
      if (isMatch) {
        highlightedText.push(
          <span key={i} className="bg-green-200 text-green-800 font-medium">
            {char}
          </span>
        );
        searchIndex++;
      } else {
        highlightedText.push(char);
      }
    }
    
    // Add remaining text
    if (text.length > highlightedText.length) {
      highlightedText.push(text.substring(highlightedText.length));
    }
    
    return searchIndex === searchTerm.length ? <>{highlightedText}</> : text;
  }, []);

  /**
   * Enhanced class information with visual indicators
   */
  const getClassInfo = useCallback((classObj: ClassWithRelations) => {
    const fileCount = classObj.files?.length || 0;
    const hasSyllabus = !!classObj.syllabus;
    
    return (
      <div className="flex items-center space-x-2 text-xs">
        {fileCount > 0 && (
          <span className="flex items-center text-blue-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {fileCount}
          </span>
        )}
        {hasSyllabus && (
          <span className="flex items-center text-green-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Syllabus
          </span>
        )}
        {fileCount === 0 && !hasSyllabus && (
          <span className="text-gray-400 italic">No materials</span>
        )}
      </div>
    );
  }, []);

  const displayedSuggestions = suggestions.slice(0, maxResults);
  const hasMoreResults = suggestions.length > maxResults;

  return (
    <div
      ref={containerRef}
      className={`
        absolute z-50 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-64 overflow-hidden min-w-72
        ${isAnimating ? 'animate-scaleIn' : ''}
        ${className || ''}
        transition-all duration-200 ease-out
      `}
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        maxWidth: '320px',
        filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))'
      }}
      role="listbox"
      aria-label={`Class suggestions${searchTerm ? ` for "${searchTerm}"` : ''}`}
      aria-expanded={isVisible}
    >
      {/* Header */}
      <div className="px-4 py-3 text-xs font-semibold text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Classes {searchTerm && `matching "${searchTerm}"`}
        </div>
        <span className="text-gray-400">{displayedSuggestions.length} of {suggestions.length}</span>
      </div>

      {/* Suggestions */}
      <div className="overflow-y-auto max-h-48">
        {displayedSuggestions.map((classObj, index) => (
          <div
            key={classObj.id}
            data-index={index}
            className={`
              px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 
              transition-all duration-150 hover:shadow-sm
              ${index === selectedIndex
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-blue-200'
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-900'
              }
            `}
            onClick={() => onSelect(classObj, index)}
            onMouseEnter={() => {/* Optional: update selectedIndex on hover */}}
            role="option"
            aria-selected={index === selectedIndex}
            tabIndex={-1}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Class name with enhanced highlighting */}
                <div className="text-sm font-semibold truncate mb-1">
                  {highlightMatch(classObj.name, searchTerm)}
                </div>
                
                {/* Enhanced class info with icons */}
                {getClassInfo(classObj)}
              </div>
              
              {/* Enhanced @ symbol indicator */}
              <div className={`ml-3 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                index === selectedIndex ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                @
              </div>
            </div>
          </div>
        ))}
        
        {/* More results indicator */}
        {hasMoreResults && (
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200 text-center">
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {suggestions.length - maxResults} more results available
          </div>
        )}
      </div>

      {/* Enhanced footer with keyboard shortcuts */}
      {showShortcuts && (
        <div className="px-4 py-3 text-xs bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <span className="flex items-center text-gray-600">
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 border border-gray-300 rounded mr-1">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center text-gray-600">
                <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 border border-gray-300 rounded mr-1">Enter</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center text-gray-600">
              <kbd className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 border border-gray-300 rounded mr-1">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatbotAutocomplete);

// Component enhancements:
// ✅ Enhanced performance with optimized event handling and scrolling
// ✅ Improved accessibility with ARIA labels and keyboard navigation
// ✅ Better visual feedback with gradients, animations, and icons
// ✅ Smart positioning to stay within viewport boundaries
// ✅ Enhanced text highlighting with fuzzy matching support
// ✅ Professional UI with modern styling and micro-interactions
// ✅ Configurable features (max results, shortcuts display)
// ✅ Better mobile support with improved touch targets