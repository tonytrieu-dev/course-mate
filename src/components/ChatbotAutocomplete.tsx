import React, { useEffect, useRef } from 'react';
import type { ClassWithRelations } from '../types/database';

interface ChatbotAutocompleteProps {
  isVisible: boolean;
  suggestions: ClassWithRelations[];
  selectedIndex: number;
  searchTerm: string;
  position: { top: number; left: number };
  onSelect: (classObj: ClassWithRelations, index: number) => void;
  onClose: () => void;
}

const ChatbotAutocomplete: React.FC<ChatbotAutocompleteProps> = ({
  isVisible,
  suggestions,
  selectedIndex,
  searchTerm,
  position,
  onSelect,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected item
  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      if (isVisible) {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [isVisible, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  /**
   * Highlight matching text in class name
   */
  const highlightMatch = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);

    if (index === -1) {
      // Check for acronym match
      const acronym = text
        .split(/\s+/)
        .map(word => word.charAt(0))
        .join('')
        .toLowerCase();
      
      if (acronym.includes(lowerSearchTerm)) {
        return (
          <span>
            {text}
            <span className="text-xs text-gray-500 ml-1">({acronym.toUpperCase()})</span>
          </span>
        );
      }
      
      return text;
    }

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-blue-200 text-blue-800 font-medium">
          {text.substring(index, index + searchTerm.length)}
        </span>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  /**
   * Get display info for a class (shows file count, syllabus status)
   */
  const getClassInfo = (classObj: ClassWithRelations): string => {
    const fileCount = classObj.files?.length || 0;
    const hasSyllabus = !!classObj.syllabus;
    
    const parts: string[] = [];
    if (fileCount > 0) {
      parts.push(`${fileCount} file${fileCount === 1 ? '' : 's'}`);
    }
    if (hasSyllabus) {
      parts.push('syllabus');
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No materials';
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64"
      style={{
        top: position.top,
        left: position.left,
        // Ensure it doesn't go off screen
        maxWidth: '300px'
      }}
      role="listbox"
      aria-label="Class suggestions"
    >
      {/* Header */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 font-medium">
        Classes {searchTerm && `matching "${searchTerm}"`}
      </div>

      {/* Suggestions */}
      {suggestions.map((classObj, index) => (
        <div
          key={classObj.id}
          className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
            index === selectedIndex
              ? 'bg-blue-50 text-blue-900'
              : 'hover:bg-gray-50 text-gray-900'
          }`}
          onClick={() => onSelect(classObj, index)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {/* Class name with highlighting */}
              <div className="text-sm font-medium truncate">
                {highlightMatch(classObj.name, searchTerm)}
              </div>
              
              {/* Class info */}
              <div className="text-xs text-gray-500 mt-1">
                {getClassInfo(classObj)}
              </div>
            </div>
            
            {/* @ symbol indicator */}
            <div className="text-gray-400 text-xs ml-2 flex-shrink-0">
              @
            </div>
          </div>
        </div>
      ))}

      {/* Footer with help text */}
      <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span>↑↓ navigate</span>
          <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatbotAutocomplete);